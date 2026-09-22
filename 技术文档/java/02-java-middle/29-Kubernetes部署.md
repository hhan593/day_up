# 29 - Spring Boot 上 Kubernetes

> 来源：Kubernetes 官方文档 Concepts（「Pods」「Containers」「Pod Lifecycle」「Allocate Resources」「Scheduling Constraints」「Pod Disruption Budgets」）与 Tasks（「Configure Liveness, Readiness and Startup Probes」「Assign Memory Resources to Containers and Pods」「Run a Deployment」「Horizontally Scale a Deployment」「Perform a Rolling Update」「Debug a Pod」）；Spring Boot Reference 的 «Container Images»、«Creating a Deployable Unit»、«Cloud Foundry Support»（含 layered jar 语义）与 Actuator «Kubernetes Probes / Metrics» 生产就绪章节
> 官方：Kubernetes docs — Concepts > Workloads > Pods、Tasks > Overview > «Configure Pod Initialization»、Concepts > Workloads & Autoscaling > Horizontal Pod Autoscaler；Spring Boot Reference — container images / cloud-foundry / production-ready（actuator endpoint 与 health group）三块
> 补充：镜像选型取舍、`preStop` 具体秒数、`MaxRAMPercentage=75`、CPU 是否设 limit、探针参数经验取值均属业界标准实践与工程判断，**不是官方规定**，正文逐处标注；除「JVM 具备容器感知能力的引入版本（8u191+/10，需按版本核对）」这一处必要事实外，不写 K8s / Spring Boot / JDK 版本号，也不给具体 URL，一律以所用集群与发行版实测为准。
> 关联：Next `18-deployment.md`、Go `12-project-layout.md`

**分工先说清**：`37-JVM调优与故障排查.md` 管 **JVM 侧**——该给哪些 `-XX` 参数、堆内存长什么样、出事后怎么用 `jstat/jcmd/MAT` 现场取证；本篇管 **编排侧**——镜像怎么建、四种探针各自会对你造成什么、一次 Pod 删除在集群里到底发生了什么、requests/limits/QoS/HPA 如何反过来决定 JVM 的行为。两边互相指路，不重复命令清单。

---
## 一、JVM 在容器里的特殊性（为什么 Java 上 K8s 有专属坑）

容器不是轻量虚拟机：它只是 **namespace（隔离视野）+ cgroup（限制用量）**。限制写在 cgroup 里，但 JVM 早期是**去读宿主机的 `/proc/meminfo` 和 `/proc/cpuinfo`** 来估算自己能吃多少 —— 于是在一台 128G/64 核的节点上，一个 512Mi 的 Java 容器会认为「我有 128G，默认堆给 25% 即 32G」，`Runtime.availableProcessors()` 返回 64（GC 线程数、`ForkJoinPool`、各中间件默认线程池全按 64 核铺开），启动即撞 limit。JDK 8u191+/10 起 `-XX:+UseContainerSupport` **默认开启**（需按版本核对），JVM 改为读 cgroup 的 memory limit 与 CPU quota，这个坑才算被填平 —— 但只填平了「读」这一半，「堆之外还有内存」那一半留到今天，就是第二、三小节。

### 1. 容器里堆大小只有三个来源，优先级固定

```
-Xmx 显式值                     ← 最高，会**无视** limit
  ↓ 未设时
-XX:MaxRAMPercentage=N          ← limit × N%（容器感知开着才按 limit 算）
  ↓ 也不设时
默认 25%                        ← limit × 25%
```

同一个 `limits.memory: 1Gi` 的容器：`-Xmx800m` → 堆 800m；只给 `-XX:MaxRAMPercentage=75.0` → 约 768m；什么都不给 → **256m**（很多「小 Pod 频繁 Full GC」的事故根因就是这个默认 25%，不是内存给多了）。

> 注意：`-Xmx` 与 `MaxRAMPercentage` 同时存在时前者胜出，于是「把 limit 从 1Gi 提到 2Gi」这个动作**对堆毫无影响**——参数固化在镜像或 `JAVA_TOOL_OPTIONS` 里，limit 却写在 Deployment YAML 里，两处各改一次就分叉了。二选一，别混用。

### 2. 进程 RSS ≠ 堆：一张拆解图

```
cgroup memory limit（例：1Gi）——— 内核在这条线上杀进程
└── JVM 进程 RSS
    ├── Heap .................. -Xmx / MaxRAMPercentage 管得住的**只有这一块**
    ├── Metaspace ............. 类元数据；要 -XX:MaxMetaspaceSize 才收口（37 第二节）
    ├── Thread stacks ......... 线程数 × -Xss。200 线程 × 1M ≈ 200M，**最常被忽略**
    ├── Code cache ............ JIT 产物，随运行时长到上限后稳住
    ├── GC 自身结构 ........... G1 的 RSet / card table，按堆大小成比例
    ├── Direct memory ......... Netty/NIO 的堆外缓冲，-XX:MaxDirectMemorySize（32）
    ├── glibc malloc arena .... 64 核机器上 arena 数 = 8×核数，可白占数百 MB
    │                          → 设 MALLOC_ARENA_MAX=2，或换 jemalloc/tcmalloc
    └── JVM native + agent + JNI 库（OTel java agent、Arthas 都算，见 30）
```

**结论**：给 1Gi 的 limit 不代表 1Gi 都能拿来放堆。堆只要占掉 limit 的九成，堆外一涨 RSS 就越线，内核直接 `OOMKilled`（exit code **137**）——**没有 Java 异常栈、没有 heap dump**，K8s 侧只留一行 `Last State: Terminated, Reason: OOMKilled`。所以「limit 的 25~40% 留给非堆」不是调优建议，是能不能拿到现场材料的分水岭。这条线上的现场排查（`pmap`、`-XX:NativeMemoryTracking`、案例复盘）全在 `37` 第十二节与案例 8，本篇不重复其命令。

---
## 二、镜像怎么建

### 1. 基础镜像选型

| 基础镜像 | 什么时候选 | 代价 |
|---|---|---|
| `eclipse-temurin` | Adoptium 官方构建，JRE/JDK 双 variant，社区默认选择 | 镜像偏大；Debian 基底需自己扫 CVE |
| `amazoncorretto` | 在 AWS（ECS/EKS）上，补丁由亚马逊维护，通常更小一点 | 带厂商私有补丁，非 AWS 环境排查差异时要留意 |
| distroless | 无 shell、无包管理器，攻击面与体积都最小，合规友好 | **进不去容器排障**：没有 `sh`，`kubectl exec -it ... sh` 直接失败，也没有 `sleep`（preStop 钩子会踩坑，见第八节） |
| UBI（Red Hat Universal Base Image） | OpenShift 上常被强制要求；SBOM 与 CVE 修复责任清晰 | 生态适配略麻烦，非 RedHat 平台无收益 |

**JRE 还是 JDK —— 生产要哪个**：

| | JRE 镜像 | JDK 镜像 |
|---|---|---|
| `jstack` / `jcmd` / `jmap` / `jhsdb` | 通常没有或不全 | ✅ 都在 |
| `javac` 等编译工具链 | 无（运行期也不需要） | 有（多占几十 MB） |
| async-profiler / Arthas 挂载 | 需额外塞进镜像 | 更容易 attach |

取舍结论：**生产用 JDK 镜像（或 JRE + 自带调试工具的 sidecar / ephemeral container）**。理由很实在——出事时你要能在容器里跑 `jcmd`/`jstack`（`37` 第九节那套），多几十 MB 换「当场定位」通常划算；真要压体积，就把 JDK 放在 `kubectl debug --image=... ` 的临时调试容器里 attach 上去，而不是让线上镜像裸奔到连线程栈都抓不下来。

### 2. 多阶段构建与「为什么 pom 要先 COPY」

```dockerfile
# ---------- build 阶段：只活在 CI 里，不进最终镜像 ----------
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./                    # 只拷 POM：内容不变 → 下面这层缓存命中
COPY .mvn .mvn
RUN mvn -B dependency:go-offline   # 依赖下载被固化成一个可复用层
COPY src src                       # 改业务代码只让这层之后的缓存失效
RUN mvn -B -DskipTests package

# ---------- runtime 阶段 ----------
FROM eclipse-temurin:21-jdk
RUN groupadd -g 10001 app && useradd -u 10001 -g 10001 -m app
WORKDIR /app
COPY --from=build /workspace/target/app.jar /app/app.jar
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Duser.timezone=Asia/Shanghai"
EXPOSE 8080
USER 10001
# exec 形式（JSON 数组）：java 直接成为 PID 1
ENTRYPOINT ["java","-jar","/app/app.jar"]
```

- 缓存原理一句话：Dockerfile 每条指令一层，**按「父层 + 本层内容哈希」命中**，所以要把「稳定且昂贵」的步骤放前面（`COPY pom.xml` + 拉依赖），把「易变且便宜」的放后面（`COPY src`）。这与 `41-Maven与Gradle依赖管理.md` 第十一节的 `layertools` 分层是同一思想：`java -Djarmode=layertools -jar app.jar extract` 能拆出 `dependencies/`（最稳）、`spring-boot-loader/`、`snapshot-dependencies/`、`application/`（最易变）四层，按层 COPY 后**改一行业务代码只让最上面一层重建**。launcher 类的全限定名在 Boot 版本间挪过家（细节以 `41` 为准），真要这么跑就别把启动命令写死在文档里。
- `JAVA_TOOL_OPTIONS` 是 JVM 启动时自动读取的环境变量，好处是**参数可以放 ConfigMap**、改参数不必重建镜像；代价是它会被 JVM 打印到 stdout（`Picked up JAVA_TOOL_OPTIONS: ...`），别误认为是异常。

> 注意：**`ENTRYPOINT` 必须是 exec（JSON 数组）形式。** 写成 shell 形式 `ENTRYPOINT java -jar app.jar` 时，PID 1 是 `/bin/sh -c ...`，SIGTERM 只会打死那个 shell，java 子进程收不到信号 → 第四节的整套优雅下线**彻底失效**（现象：Pod 每次都是卡满 `terminationGracePeriodSeconds` 后被 SIGKILL，退出码 137，日志里没有任何 shutdown 痕迹）。等价解法还有 shell 里写 `exec java -jar ...`。另一层理由：HotSpot 的默认信号处理与「是否 PID 1」有关（作为 PID 1 时才会为 SIGTERM/SIGINT 跑 shutdown hooks；非 PID 1 时行为随 JDK 版本有差异，需按版本核对）——让 java 当 PID 1 是最省事且行为确定的一种。

**tini / `--init` / PID 1 的两件事**：PID 1 在 Linux 上有特殊语义——不收到信号就不会被默认动作杀掉，而且要负责回收僵尸进程。
- `docker run --init` 本质是运行时替你插一个 tini 作 PID 1；**K8s 没有对应的 pod 字段**，要在 K8s 里用就得把 tini 打进镜像：`ENTRYPOINT ["tini","--","java","-jar","/app/app.jar"]`。
- Go/Node/Python 应用常需要 tini（转发信号 + 回收 zombie）。纯 Java 应用用 exec 形式让 JVM 自己当 PID 1 就够了，加 tini 只是为了顺便收僵尸（比如 `Runtime.exec` 起外部进程的服务）。

### 3. 镜像引用规范（K8s 侧的三条）

| 项 | 要求 | 为什么 |
|---|---|---|
| tag | **只用不可变版本号/git sha，禁 `latest`** | `latest` + `imagePullPolicy: IfNotPresent` 会让不同节点跑不同代码；`rollout undo` 也回不去（引用没变，撤销的是「不存在的差异」） |
| `imagePullPolicy` | 不可变 tag → `IfNotPresent`；可变 tag（SNAPSHOT、`latest`）→ `Always` | `Always` 拉长启动时间并受仓库限流；这也是 `41` 第十二节反对 SNAPSHOT 上生产的原因 |
| `imagePullSecrets` | 私有仓库（Harbor/ACR/ECR）必须配 ServiceAccount 级或 Pod 级拉取凭证 | 缺了就是 `ImagePullBackOff`，且报错常常被读成「镜像不存在」 |

---
## 三、四种探针：谁能杀你，谁只是不给你流量

| 机制 | 失败后果 | 能不能包含下游依赖（DB/Redis/MQ） | 语义 |
|---|---|---|---|
| `livenessProbe` | **kubelet 重启容器** | **绝对不能** | 「我进了不可自愈的死锁/坏状态，杀掉我重来」 |
| `readinessProbe` | **从 Service endpoints 摘除流量，不重启** | **应该包含**（DB 挂了就别接流量，但没必要重启） | 「我活着，只是暂时接不了活」 |
| `startupProbe` | 成功之前屏蔽 liveness/readiness；`failureThreshold × periodSeconds` 内仍未成功 → **杀掉重启** | 一般同 liveness | 慢启动专用，**用来替代 `initialDelaySeconds`** |
| `postStart`（钩子） | **它不是探针**：与容器 ENTRYPOINT 并发执行、不保证先后，失败会让容器被重建，没有任何「是否可接流量」的判断语义 | —— | 只做「容器创建后顺手干点事」，别拿它当就绪检查 |

liveness 依赖下游 = 自制雪崩：DB 抖 30 秒 → 全部 Pod 的 liveness 连续失败 → **整个 Deployment 被重启**，而重启完 DB 还是那个 DB，流量却全断了。这正是 `readinessProbe` 存在的意义——**摘流量不重启**。

### 1. Spring Boot 侧（两个 group 是关键）

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus   # 注意 * 会把 env/heapdump 也暴露出去（30）
  endpoint:
    health:
      probes:
        enabled: true                             # 打开 /actuator/health/{liveness,readiness}
      group:
        liveness:
          include: livenessState                  # 只放自身存活状态，**不加下游**
        readiness:
          include: readinessState,db,redis        # 下游依赖放这里，且要确认它们确实参与健康指示器
  health:
    redis:
      enabled: true                               # 分组里 include 了却被关闭 = 分组无效（Boot 会报错或忽略，取决于版本）
```

- `/actuator/health/liveness`、`/actuator/health/readiness` 由 Actuator 的 **availability 探针**提供，数据来自 `ApplicationAvailability`：`LivenessState`（`CORRECT`/`BROKEN`）与 `ReadinessState`（`ACCEPTING_TRAFFIC`/`REFUSING_TRAFFIC`）。
- 想主动摘流量不必改代码：`availability` 允许应用自己发 `AvailabilityChangeEvent` 把 readiness 置为 `REFUSING_TRAFFIC`（下线前、熔断打开时都能用）。
- **liveness 千万别写成 `/actuator/health`**：那是所有指示器的聚合，DB 一慢就 503 → 全量重启。

### 2. 探针参数怎么定（设错的后果）

| 参数 | 设太小 | 设太大 | 经验取值（liveness / readiness） |
|---|---|---|---|
| `periodSeconds` | 探测风暴，应用和 kubelet 一起受压 | 故障发现变慢，摘流量晚 | 10 / 5 |
| `timeoutSeconds` | **一次 GC 停顿或一次网络抖 → 判失败 → 误杀** | 单轮失败拖长整体收敛 | 3 / 2 |
| `failureThreshold` | 偶发一次抖动就重启/摘流 | 真故障要更久才被处理 | 3 / 2~3 |
| `successThreshold` | readiness 恢复太激进（冷 Pod 刚通一次就喂满流量） | —— | 1（`successThreshold > 1` 对 liveness/startup 不合法） |
| `initialDelaySeconds` | 用不上（该由 `startupProbe` 承担） | 启动后长时间无人监管，死循环期间探针不看 | 0 / 0 |

- `startupProbe` 的算术：**允许的最大启动时间 = `failureThreshold × periodSeconds`**。例：`failureThreshold: 30, periodSeconds: 5` → 最多容忍 150 秒启动；一旦 startup 成功，liveness/readiness 才开始工作，所以**配了 startupProbe 就该把 liveness 的 `initialDelaySeconds` 去掉**（否则两段等待叠加，故障发现被推迟到不可接受）。
- 探针总超时预算要大于「一次可接受的最坏停顿」：`timeoutSeconds=1` + Full GC 1.5 秒 = 每个 GC 周期都可能被判失败。

> 注意：`startupProbe` 一直不过，要怀疑的是**启动本身慢**，而不是把 `failureThreshold` 无限加大。Java 冷启动可通过 `-XX:TieredStopAtLevel=1`（牺牲峰值换启动）、CDS/AppCDS 类数据分享、直到 GraalVM native image 彻底解决，见 `28-云原生GraalVM.md`；镜像里塞了重量级 `init` 逻辑（预热缓存、下载字典、Flyway 迁库）也要单独量一次时间。

---
## 四、优雅下线的完整时序（本篇最重要的图）

### 1. 一个 Pod 被删除时，集群里并发发生了什么

```
t0  kubectl delete pod / rollout 换版本 / 节点驱逐（一切「自愿删除」路径，SIGTERM 都从这里开始）
 │
 ├──(A) API server 给 Pod 打 deletionTimestamp → kubectl 看到 Terminating
 │
 ├──(B) 摘流量链路（**每一跳都异步**）
 │       endpoint 控制器把它从 EndpointSlice 移除
 │         → 各节点 kube-proxy 重建 iptables/IPVS 规则
 │         → Ingress controller / 服务发现 / 客户端连接池各自更新
 │       收敛时间：十几毫秒 ~ 数秒，取决于集群规模与上游实现，**无人保证谁先谁后**
 │
 └──(C) kubelet 同时开始跑 preStop 钩子（例：sleep 8）
          │  钩子结束（或 t0 + terminationGracePeriodSeconds 到点）
          ▼
        容器运行时按 stopSignal（默认 SIGTERM）通知主进程
          ▼
        JVM 跑 shutdown hooks → Spring 发布 ContextClosedEvent
          ▼
        ① readiness 置 REFUSING_TRAFFIC（探针随之 DOWN，配合 B 再摘一轮）
        ② Web 服务器停止接受**新**连接，存量请求继续跑完
        ③ SmartLifecycle.stop() 按 phase **降序**被调用：MQ 监听容器、调度器在这一步停
           （它与 Web 容器收尾的相对先后随框架版本变化，要精确控制就自己实现 SmartLifecycle 显式设 phase）
        ④ Bean 销毁：@PreDestroy → destroy() → destroy-method（35 的线程池模板、40 的顺序）
          ▼
        进程退出（t_exit）

  ⚠ 若 t_exit > t0 + terminationGracePeriodSeconds：运行时发 SIGKILL —— 没有任何钩子会跑
```

**(B) 与 (C) 是并发两条路，没有先后保证**——这是整套设计的根本原因。SIGTERM 可能先到、而 kube-proxy 规则还没更新，于是**已下线但仍在接流量**，表现就是发布窗口里零星的 503 / connection reset。`preStop` 里那个 sleep 不是「等一会儿更保险」，而是**用一段确定的阻塞，给 B 的传播留时间**，让 SIGTERM 尽量落在摘除完成之后。

```
时间轴（terminationGracePeriodSeconds = 60，从 t0 起算，preStop 的耗时**计入**这 60 秒）

t0 ─────┬────────┬──────────────────────────────┬─────────→
        │        │                              │
     (B) 摘流量传播                        SIGTERM 到达         进程退出
     (C) preStop sleep 8s ──┐         ① 停接收 → ②③④ 存量+钩子
                            └ 硬截止线：t0+60s，超了 SIGKILL
        └────────── 约束：preStop sleep + timeout-per-shutdown-phase + Bean 销毁缓冲 < 60 ──────────┘
```

### 2. Spring Boot 侧要配的两行 + 三行 YAML

```yaml
server:
  shutdown: graceful                     # Web 服务器停止接新请求并等待存量跑完
spring:
  lifecycle:
    timeout-per-shutdown-phase: 25s      # 每个 SmartLifecycle 阶段的上限（含 Web 容器收尾）
```

```yaml
terminationGracePeriodSeconds: 60        # 默认 30，必须显式放大到 > preStop + 上面的 25s
lifecycle:
  preStop:
    exec:
      command: ["sh","-c","sleep 8"]     # 实践取值 5~10s；distroless 镜像里没有 sh/sleep，要换实现
```

### 3. 配了 graceful shutdown 为什么还在丢请求

> 注意：三种真实原因，按出现频率排：
> 1. **传播没跑完就有新请求进来**——没配 `preStop` 或 sleep 太短；更隐蔽的是客户端持有**长连接**（HTTP/2、gRPC、keep-alive 池）：kube-proxy 只影响新建连接，旧连接上的请求照打不误，Ingress/Gateway 的上游刷新更慢。这类要靠应用侧把 readiness 主动置 `REFUSING_TRAFFIC` + 客户端支持 GOAWAY。
> 2. **时间预算算错**——`preStop sleep + timeout-per-shutdown-phase ≥ terminationGracePeriodSeconds`，还没跑完就被 SIGKILL。默认宽限期只有 30 秒，是最典型的「配了 graceful 但白配」。
> 3. **存量活儿不归 Web 容器管**——长任务（大文件导出、SSE/流式下载、长轮询）、`@Async` 与线程池里排队中的任务、MQ 拉取线程：`server.shutdown=graceful` 只覆盖 Web 层的 in-flight 请求和 lifecycle 阶段。线程池要用 `35-线程池与线程协作.md` 的 `@PreDestroy` 模板（`shutdown()` → `awaitTermination` → `shutdownNow()` 并**把返回的未执行任务落库重投**）；MQ 消费者必须在 Bean 销毁早期先停（`27`），否则会出现「消费者还在线、DB 连接池已经关了」的丢消息窗口。
>
> 关闭阶段该跑什么，按 `40-Bean生命周期与循环依赖.md` 的**创建逆序**来推：谁后初始化谁先释放，基础设施（连接池、客户端、线程池）最先建、因此最后销毁；业务侧的 flush/收尾逻辑挂在 `SmartLifecycle`（要控制相对 Web 容器的先后就用 `phase`）而不是随便一个 `@PreDestroy`。

---
## 五、配置与密钥：注入方式和热更新能力

| 维度 | 注入为 env（`envFrom`/`env`） | 挂载为 volume（ConfigMap as file） |
|---|---|---|
| ConfigMap 改了会不会变 | **不会**。env 是进程创建时的快照，要生效只能重建 Pod | **文件内容会变**（kubelet 周期性同步，通常几十秒量级） |
| Spring 会不会重读 | 不会（属性源已固化） | **默认也不会**——`application.yml` 只在启动时解析一次 |
| 真要做到热更新 | 做不到 | 需要 `spring-cloud-kubernetes` 的配置刷新（`@RefreshScope`/config context），或干脆靠 checksum annotation 触发 `rollout restart` |
| 适合放什么 | 少量稳定开关：profile、端口、`JAVA_TOOL_OPTIONS`、Secret 引用 | 大段 `application.yml`、`logback-spring.xml`、证书/CA/truststore 文件 |
| 排障可见性 | `kubectl describe` 只看得到引用名（值不外泄） | 文件可 `kubectl exec` 直接看，定位「配置没生效」更快 |
| 松散绑定 | ✅ 天然支持 | ⚠️ 得让 Spring 把它当属性源（如 `spring.config.import=optional:file:/etc/config/application.yml` 或 configtree 形式） |

**属性名映射（松散绑定规则要点）**：OS env 全大写、只能出现 `_`，所以 Boot 定义了一套归一化：去掉 `SPRING_` 前缀之外的语义不变，`_` 视作分隔符、`-` 被丢弃、整体转小写。

```
SERVER_PORT              → server.port
SPRING_PROFILES_ACTIVE   → spring.profiles.active
SPRING_DATASOURCE_URL    → spring.datasource.url
MY_FEATURE_ENABLED       → my.feature.enabled        （也匹配 my-feature.enabled / myFeature.enabled）
```

```yaml
env:
- name: SPRING_APPLICATION_JSON          # 一次塞一整个 JSON 片段，适合少量结构化开关
  value: '{"server":{"port":8080},"logging":{"level":{"ROOT":"INFO"}}}'
```
优先级速记：**命令行 `--server.port=9090` > `SPRING_APPLICATION_JSON` > OS env > JVM `-D` > `application-{profile}.yml` > `application.yml`**（完整顺序以 `13-SpringBoot.md` 的外部化配置为准）。在 K8s 里 `--xxx` 得靠 `args` 传，所以实践中「YAML 打底座、ConfigMap env 打覆盖、命令行只在临时调试时用」。

**Secret**：`env` 与 `volume` 两种注入**都不算安全**，只是可见面不同——env 会进容器的 `/proc/<pid>/environ`（同 Pod 的 sidecar 若能读 proc 就看得到）并容易被启动脚本/调试接口打印出来；volume 默认权限让同 Pod 内所有容器可读，得靠 `defaultMode: 0400` + `fsGroup` 收窄，好处是「不会被 `System.getenv` 一把梭打印进日志」。**绝不进日志**（连接串密码要脱敏，见 `30-可观测性.md`）。

> 注意：把 Secret 明文写进 Deployment YAML，它会被 base64 存进 **etcd**（base64 是编码不是加密），并永久留在 GitOps 仓库历史、CI 日志、`kubectl get -o yaml` 输出里——删掉一次提交不等于撤回一次泄露。正确姿势：YAML 里只写 `secretKeyRef` 引用，凭证由 external-secrets / sealed-secrets / Vault Agent 之类落到集群里；同时给 ServiceAccount 最小 RBAC，能 `get secrets` 的名单本身也是泄露面。

---
## 六、资源、QoS 与调度

### 1. requests 与 limits 的语义差别

| | `requests` | `limits` |
|---|---|---|
| 作用 | **只影响调度**（scheduler 按它挑节点）+ 争抢时的相对权重 + HPA 利用率的分母 | **硬上限**，cgroup 真实执行 |
| 超了会怎样 | 不会被罚，节点空闲时可以用更多 | memory 超 → **OOMKill**；CPU 超 → **throttle（限流，不杀）** |
| Java 侧含义 | memory request ≈ 稳态 RSS，别低于真实用量（否则节点超卖 → 被驱逐） | memory limit 决定 `MaxRAMPercentage` 算出来的堆大小 |

**CPU 该不该设 limit（经验判断，非官方结论）**：CPU limit 由 CFS 配额实现，一个周期（通常 100ms）内 quota 用尽后**整个 cgroup 的所有线程被冻结到周期结束**。对 Java 意味着 GC 线程、JIT 编译线程、Tomcat/Netty EventLoop **一起被停**——表现为「CPU 看着只有 limit 那么多，但 P99 出现规律的百毫秒级毛刺」，且多数托管集群的默认监控面板看不到 `nr_throttled`。因此常见做法是 **memory 设 limit（必须有硬顶，否则 JVM 堆外能把节点撑爆）、CPU 只设 requests 不设 limit 或把 limit 放宽到 requests 的 2 倍以上**。代价：不设 limit 时在争抢激烈的节点上你的 CPU 份额不占优；且 HPA 的 CPU 利用率分母是 **request**，request 定小了会「一跑就 100% → 疯狂扩容」，两者必须一起看。

教程里最通用的那段（也是本篇早期版本给的写法）是 `requests: {memory: 512Mi, cpu: 250m}` + `limits: {memory: 1Gi, cpu: 1}`——它的**语义完全正确**，问题只在于两个数值要各自有出处：`512Mi` 的申请值若低于真实 RSS，节点一有内存压力你就是被驱逐的那个；`cpu: 1` 的硬顶若贴近稳态用量，就是在给自己埋 throttle。第八节给出的 `requests.memory == limits.memory` + 不设 CPU limit 是针对 Java 的变体，不是对这段的否定。

### 2. QoS 三档与驱逐顺序

| QoS | 判定 | 节点内存压力时 |
|---|---|---|
| Guaranteed | 每个容器都 `requests == limits`（CPU 与内存都要相等） | **最后**被驱逐 |
| Burstable | 至少设了一个 request/limit 且不满足 Guaranteed | 按「超出自身 request 的比例」排序驱逐，用得越离谱越早被杀 |
| BestEffort | 什么都没设 | **第一批**被驱逐、内核 OOM 时第一批被选 |

`OOMKilled`(137) 与 JVM 自己抛 `OutOfMemoryError` 的区分——这是面试也是值班必答题：

| | 容器 `OOMKilled` / exit 137 | JVM `OutOfMemoryError` |
|---|---|---|
| 谁动手 | 内核（cgroup 物理内存超限） | JVM（堆/元空间/direct 分配失败） |
| Java 栈 | **没有**，日志一片安静 | 有完整异常栈，通常伴 GC 风暴 |
| heap dump | 不会触发 `HeapDumpOnOutOfMemoryError` | 会（若已配，见 `37`） |
| 怎么看穿 | `kubectl describe pod` 的 `Last State: Terminated / Reason: OOMKilled` | 应用日志 + GC 日志 |
| 处置 | 提高 limit / 降 `MaxRAMPercentage` / 查堆外（`37` 案例 8） | 查泄漏、加分页（`37` 案例 1） |

### 3. 打散与「别一次杀光」

```yaml
# PodDisruptionBudget：只挡**自愿中断**（kubectl drain、节点升级）
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: order-service-pdb }
spec:
  maxUnavailable: 1
  selector: { matchLabels: { app: order-service } }
```
打散副本有两种写法，优先前者：`topologySpreadConstraints`（`maxSkew: 1` + `topologyKey: topology.kubernetes.io/zone` 或 `kubernetes.io/hostname`，`whenUnsatisfiable` 用 `ScheduleAnyway` 更稳，`DoNotSchedule` 可能直接调度不上；完整片段见第八节）表达「均匀摊开」；老式 `podAntiAffinity`（`preferredDuringScheduling` + `topologyKey`）只表达「别挤在一起」，副本数一多就容易和调度器打架。

> 注意：`PDB` **管不住滚动更新**——Deployment 换版本走的是直接删 Pod，不经过 eviction API。想保护发布期间的容量，靠的是 `maxUnavailable`（下节）而不是 PDB；反过来 `DoNotSchedule` 的打散约束 + `maxUnavailable: 0` 的 PDB 叠加时，节点维护会因「一个都不可驱逐/一个都放不下」而卡住，两者别同时设成最严。

### 4. HPA：算法、指标与 Java 特有的震荡

```
期望副本数 = ceil( 当前副本数 × 当前指标值 / 目标值 )
CPU 利用率 = (所有 Pod 该容器 CPU 用量的均值) / (container requests)
```
两个反直觉点：① 分母是 **requests** 不是 limits（所以 `requests.cpu` 定小 → 利用率虚高 → 无脑扩容）；② 目标是**均值**，不是最大值——单 Pod 被打满（热点 key、粘性会话）永远不会触发扩容，这类场景必须换自定义指标。

- 自定义指标：Prometheus 指标要经 `prometheus-adapter` 转成 `external/custom` metrics 才能被 `autoscaling/v2` 使用；队列长度/堆积量类场景 KEDA 更省事（`../15-kubernetes/README.md` 有全景）。
- `behavior` 稳定窗口：`scaleDown.stabilizationWindowSeconds`（默认 300 秒量级）内取窗口最大建议值，避免一次抖动就缩容；`scaleUp` 窗口默认 0，即「扩容立刻、缩容观察」——这是正确的方向，别反着调。
- **Java 冷启动导致的扩容震荡**（K8s 上的经典循环）：负载涨 → 扩出 N 个新 Pod → readiness 一绿立刻被喂满流量 → **JIT 还没编译到 C2，冷 JVM 吞吐只有稳态的几分之一** → 平均利用率仍高于目标 → 继续扩 → 老 Pod 负载终于掉下来 → 触发缩容 → 流量再涨 → 循环。缓解按性价比排：给新 Pod 一段**预热期**再让 readiness 转 UP（自定义 warmup runner / 慢热 readiness 组）、放宽 `scaleDown` 窗口并提高 `minReplicas`、把指标从 CPU 换成**队列积压或线程池拒绝数**、必要时上 AppCDS/native 缩短冷启动（`28`）。

---
## 七、发布与回滚

### 1. maxSurge / maxUnavailable（以 `replicas: 3` 为例）

| 组合 | 滚动期间副本数轨迹 | 适用 |
|---|---|---|
| `maxSurge: 1, maxUnavailable: 0` | 4 → 4 → 3（容量**永不**低于 3） | 线上默认选择；代价是要多备 1 份内存的节点余量 |
| `maxSurge: 0, maxUnavailable: 1` | 2 → 2 → 3（不新建，先杀再补） | 资源极紧张/配额受限；**Java 冷启动期间容量只有 2/3**，等于自带一次小型故障 |
| `maxSurge: 25%, maxUnavailable: 25%`（默认） | 2~4 波动 | 副本数多时省事，副本数 ≤3 时等价于上面两种之一（百分比向上/向下取整容易和预期不符） |

发布卡住的判据永远是同一个：**新 Pod 的 readiness 过不过**。`kubectl rollout status deploy/order-service` 卡住 → 看 `kubectl get rs` 谁在 0/1 → 看探针与启动日志（第八、九节）。

### 2. 版本与回滚

```bash
kubectl rollout history deployment/order-service          # 看 REVISION 列表（模板改了什么才有记录）
kubectl rollout history deploy/order-service --revision=7 # 看某一版的完整 template
kubectl rollout undo deploy/order-service                 # 回到上一版
kubectl rollout undo deploy/order-service --to-revision=7 # 指定版本
kubectl rollout pause|resume deploy/order-service         # 攒够一批改动再一起生效，避免连续触发
kubectl rollout restart deploy/order-service              # 模板没变也要重滚一遍（例如 ConfigMap 换了要重建 Pod）
```
`revisionHistoryLimit`（示例里设 5）决定留几份旧 ReplicaSet：**设成 0 就等于放弃了 `rollout undo`**。另外，回滚是「换回旧模板」，旧模板引用的**镜像 tag 必须仍然存在**（`latest` 会让回滚变成玄学，见第二节）。

- 金丝雀/蓝绿在 K8s 里两种做法：**多 Deployment + 同一个 Service 的 label 权重**（副本数即流量比例，简单粗糙但零依赖），或交给服务网格/**Argo Rollouts** 做带指标门禁的渐进式发布。本篇不展开，见 `../15-kubernetes/README.md` 与 `../09-microservices` 侧内容。
- **「新 Pod ready 就 equal 健康」是最大的错觉**：没有 `readinessProbe`、没有预热就发布 = 把冷 JVM 直接推到线上。相关取舍：`spring.main.lazy-initialization=true` 能把启动时间砍下来，但把成本搬到了**每个 Bean 的首次使用**（第一个真实请求替你付钱，还顺手掩盖启动期本该暴露的 Bean 初始化异常）——只适合本地开发或极低频服务，别当生产加速开关。真正的加速路线是 CDS/AppCDS 与 native image（`28-云原生GraalVM.md`）。

---
## 八、一份可直接抄的完整清单

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: shop
  labels: { app: order-service }
spec:
  replicas: 3
  revisionHistoryLimit: 5                    # 设 0 = 放弃 rollout undo
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1                            # 多起 1 个新版本 Pod
      maxUnavailable: 0                      # 可用副本永不低于 3
  selector:
    matchLabels: { app: order-service }      # 必须命中下面的 template labels，写错直接拒绝创建
  template:
    metadata:
      labels: { app: order-service }
      annotations:
        prometheus.io/scrape: "true"         # 指标采集：见 30
        prometheus.io/port: "8080"
        prometheus.io/path: "/actuator/prometheus"
        checksum/config: "{{ .Values.configmapChecksum }}"  # ConfigMap 变了强制滚 Pod（Helm 写法）
    spec:
      terminationGracePeriodSeconds: 60      # 默认 30；必须 > preStop sleep + shutdown 阶段预算
      securityContext:
        runAsNonRoot: true                   # 配合镜像里的 USER 10001，别用 root 跑 JVM
        runAsUser: 10001
        fsGroup: 10001
      topologySpreadConstraints:             # 打散，避免单节点故障带走全部副本
      - maxSkew: 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: ScheduleAnyway
        labelSelector: { matchLabels: { app: order-service } }
      containers:
      - name: app
        image: registry.internal/shop/order-service:1.24.3   # 不可变 tag，禁 latest
        imagePullPolicy: IfNotPresent
        ports:
        - { name: http, containerPort: 8080 }
        envFrom:
        - configMapRef: { name: order-service-env }          # env 形式的配置：**不热更新**
        env:
        - { name: SPRING_PROFILES_ACTIVE, value: "prod" }
        - { name: SERVER_PORT, value: "8080" }               # → server.port（松散绑定）
        - name: DB_PASSWORD                                  # 只引用，不在 YAML 里写明文
          valueFrom:
            secretKeyRef: { name: order-service-db, key: password }
        volumeMounts:
        - { name: app-config, mountPath: /etc/config, readOnly: true }  # 大段 yml / logback 配置
        - { name: tmp, mountPath: "/tmp" }                   # 部分 agent/dump 需要可写目录
        resources:
          requests: { memory: "1Gi", cpu: "1" }              # requests 决定调度与 HPA 分母
          limits:   { memory: "1Gi" }                        # 内存 requests==limits；CPU 故意不设 limit（见六.1）
        startupProbe:                                        # 慢启动专用：最长容忍 30×5=150s
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          failureThreshold: 30
          periodSeconds: 5
        livenessProbe:                                       # 失败 → 重启；**不含下游依赖**
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          periodSeconds: 10
          timeoutSeconds: 3                                  # 必须 > 一次可接受的最坏 GC 停顿
          failureThreshold: 3
          # 没有 initialDelaySeconds：它已由 startupProbe 取代
        readinessProbe:                                      # 失败 → 摘流量，不重启；**含下游**
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          periodSeconds: 5
          timeoutSeconds: 2
          failureThreshold: 2
          successThreshold: 1
        lifecycle:
          preStop:
            exec: { command: ["sh","-c","sleep 8"] }         # 给摘流量传播留时间（distroless 无 sh 要换招）
      volumes:
      - name: app-config
        configMap: { name: order-service-yml }
      - name: tmp
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata: { name: order-service }
spec:
  type: ClusterIP                            # 集群内调用；对外走 Ingress，见总纲
  selector: { app: order-service }           # 命中多余 Deployment 是最常见的「503 串流量」原因
  ports:
  - { name: http, port: 80, targetPort: 8080, protocol: TCP }
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: order-service }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: order-service }
  minReplicas: 3                             # Java 冷启动场景别给 1，扩容来不及
  maxReplicas: 12
  metrics:
  - type: Resource
    resource:
      name: cpu
      target: { type: Utilization, averageUtilization: 70 }   # 分母是 requests.cpu，不是 limits
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0          # 扩容要快
      policies: [{ type: Percent, value: 100, periodSeconds: 60 }]
    scaleDown:
      stabilizationWindowSeconds: 300        # 缩容要稳，压住冷启动震荡
      policies: [{ type: Pods, value: 1, periodSeconds: 120 }]
```

**这份 YAML 里哪 5 个字段一旦删掉就会出事**

| 删掉的字段 | 第一次事故长什么样 |
|---|---|
| `readinessProbe` | 新 Pod 的 Spring 还没起完就被挂进 Service → 发布窗口 503；`livenessProbe` 用 `/actuator/health`（聚合含 DB） |
| `livenessProbe` 里混进下游依赖（把 liveness 指向 `/actuator/health` 或加了 `db`） | DB 抖 30 秒 → **全量 Pod 被重启** → 雪崩，且重启完问题还在 |
| `startupProbe`（且 `initialDelaySeconds: 0`） | 慢启动应用被 liveness 在启动途中打死 → 无限重启 `CrashLoopBackOff`，看起来像「代码有问题」 |
| `preStop` + 足够的 `terminationGracePeriodSeconds` | 摘流量与 SIGTERM 赛跑，每次发布零星丢请求；日志里全是 Pod 卡满宽限期被 SIGKILL（137） |
| `resources.limits.memory` | 堆外把节点内存吃穿 → 触发**节点级** MemoryPressure，殃及同节点邻居，你的 Pod 也一起被 Evicted，还查不到 OOMKilled 记录 |

---
## 九、排障速查表

每行只给**一条**最直接的定位命令；需要往 JVM 内部深挖（GC 日志、dump、线程、火焰图）的一律去 `37`。

| 现象 | 一条定位命令 | 根因方向 |
|---|---|---|
| `CrashLoopBackOff`（起来几十秒就退） | `kubectl logs <pod> --previous` | 看已死容器最后一次日志：占位符没解析（缺 ConfigMap key）、profile 不对、Bean 创建失败读栈顶 `Caused by` |
| `ImagePullBackOff` / `ErrImagePull` | `kubectl describe pod <pod>` 找 `Failed to pull image` 那行的原文 | tag 不存在 / 没配 `imagePullSecrets` / 节点到 registry 网络或证书不通；`latest` 被仓库限流也报在这里 |
| `OOMKilled`，exit **137**，日志里没有任何 Java 异常 | `kubectl describe pod <pod>` 看 `Last State: Terminated / Reason: OOMKilled` | 堆外把 RSS 顶过 limit（线程数×`-Xss`、direct memory、glibc arena、Metaspace）→ 现场取证去 `37` 案例 8；先降 `MaxRAMPercentage` 或抬 limit |
| `Completed`（Pod 正常退出且不重启） | `kubectl get pod <pod> -o jsonpath='{.status.containerStatuses[0].state}'` | PID 1 提前退出：`ENTRYPOINT` shell 形式把 java 后台化了 / jar 不是可执行 fat jar（缺 `repackage`，见 `41` 第十一节）/ 应用真是一次性任务 |
| Pod 显示 `ready` 但外部一直 503 | `kubectl get endpointslices -l kubernetes.io/service-name=order-service` | readiness 太宽松（指到聚合 `/actuator/health` 或根本没配）、Service `selector` 命中了别的 Deployment、客户端复用旧连接/Ingress 上游未刷新、`targetPort` 与容器实际监听端口不一致 |
| 滚动发布卡住（新 RS 一直 `0 ready`） | `kubectl get events --sort-by=.lastTimestamp \| tail -25` | 三选一：探针路径/端口写错（404 即失败）、readiness 因下游慢而永不过、`FailedScheduling`（资源或打散约束太严） |
| 探针误杀（周期性重启，日志一切正常） | `kubectl describe pod <pod>` 看 `Restart Count` 与 `Last State.Reason: Error` 的时间间距 | 间距 ≈ `liveness 的 period×failureThreshold` → 就是它；`timeoutSeconds` 短于最坏 GC 停顿，或 liveness 里混了下游 |
| GC 停顿导致请求超时（Pod **不**重启） | `kubectl top pod --containers` 对比 `requests`，再看容器内 `cpu.stat` 的 `nr_throttled` | CPU 被 throttle 或 Full GC 过长 → 去 `37` 第十节读 GC 日志；**别只把探针超时调大来掩盖问题** |
| Pod 凭空消失，events 里写 `Evicted` | `kubectl describe pod <evicted-pod>`（`Status: Failed / Reason: Evicted`） | 节点内存压力 + 你的 QoS 是 Burstable/BestEffort：memory `requests` 设得比真实 RSS 低（超卖），把 request 抬到真实水位 |
| HPA 一直不扩（或不缩） | `kubectl describe hpa order-service` 看 `Metrics:` 与 `Events:` | `unable to fetch metrics` = adapter 没装；指标值虚低 = 分母是 `requests`（把 request 定大了）；已触及 `minReplicas`/`maxReplicas` 或 `behavior` 的缩容窗口 |
| 发布后延迟劣化，过一会儿自己恢复 | `kubectl logs <new-pod> \| grep -i "started .* in"` 配合 `kubectl get pods -w` 的时间戳 | 冷 JVM：JIT 未达稳态就被喂满流量 → 需要预热门（readiness 延后转 UP）与 CDS/native（`28`） |

---
## 与系列其他文档的关系

- `37-JVM调优与故障排查.md`：**容器基线参数（第十二节）、RSS/堆外增长的案例 8、`-XX` 参数与 `jcmd/NMT/pmap` 现场取证**全在那边；本篇只讲这些参数在编排侧怎么被 `requests/limits`、`MaxRAMPercentage` 与探针语义反噬。互为上下篇，别交叉重复读。
- `28-云原生GraalVM.md`：native image / CDS / AOT 是「`startupProbe` 要调多大」的根治手段；也给出小镜像的另一条路线（native 二进制无需 JRE/JDK）。
- `30-可观测性.md`：`/actuator/prometheus` 的抓取、traceId 与日志采集怎么和 Sidecar/DaemonSet 配合；Secret 与连接串不能进日志的落地约束。
- `40-Bean生命周期与循环依赖.md`：优雅下线阶段 `@PreDestroy`/`destroy()`/`destroy-method` 的执行顺序（创建逆序），以及 `context.close()` 这条路径就是被 SIGTERM 触发的。
- `35-线程池与线程协作.md`：线程池优雅关闭模板（`shutdown` → `awaitTermination` → `shutdownNow` + 未执行任务重投）与线程数对 `-Xss` × RSS 的直接影响。
- `41-Maven与Gradle依赖管理.md`：`layertools` 分层 jar 与镜像层缓存同源；`SNAPSHOT` 破坏「镜像不可变」这条发布前提（第七节）；fat jar 缺 `repackage` 导致容器 `Completed` 的产物层原因。
- `23-Redis缓存.md`：Pod 重启/扩容瞬间缓存连接与热 key 重建造成的抖动，是 readiness 该不该包含 `redis` 的判断依据。
- `27-Kafka流式处理.md`、`24-消息队列与微服务.md`：消费者在关闭阶段的停止时机（先停消费，再关 DB 连接池），对应第四节 ③。
- `../15-kubernetes/README.md`：**K8s 对象全景**（架构、Service/Ingress 网络模型、StatefulSet、RBAC、常用命令）在总纲，本篇只写 Java 应用相关的那一层。
- `../14-docker/README.md`：镜像分层与多阶段构建的通用机制；`../08-springboot/README.md`：Actuator 端点与外部化配置完整优先级。

> **一句话总结**：Spring Boot 上 K8s 的全部坑都来自同一件事——**JVM 的内存与生命周期语义、和 cgroup 的资源与信号语义不是一回事**。镜像里让 java 当 PID 1、堆按 `MaxRAMPercentage` 给 limit 的七成五、liveness 只看自己 / readiness 才看下游、`startupProbe` 顶掉 `initialDelay`、`preStop sleep + graceful shutdown + 放大宽限期` 三件套串成一条时间轴、`requests` 只管调度而 `limits` 才是硬顶 —— 这六件做齐了，Java 容器化与 Next/Go 的差别就只剩冷启动而已。
