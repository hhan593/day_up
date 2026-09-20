# 07 · Spring Boot 生产配置清单

> 可以直接抄的配置。每一项都标注「不配的后果」——这些默认值就是事故来源。
> 理论见 `../springboot/README.md`。

---

## 一、application.yml 生产模板

```yaml
server:
  port: 8080
  tomcat:                          # ── 内嵌 Tomcat（默认 maxThreads=200，够用但要心里有数）
    threads:
      max: 400                     # 并发处理线程上限；IO 密集可调大，CPU 密集别超过 2*核数太多
      min-spare: 20
    max-connections: 8192          # 最大连接（默认 8192）
    accept-count: 100              # 线程满后进 accept 队列的量；超了直接拒绝
  shutdown: graceful               # ── 优雅停机：收到 SIGTERM 先停止接新请求，处理完存量
  spring:
    lifecycle:
      timeout-per-shutdown-phase: 30s   # 优雅停机最长等 30s（配合 K8s terminationGracePeriodSeconds）

spring:
  datasource:
    hikari:                        # ── HikariCP：默认 maximumPoolSize=10，90% 的连接池事故是没调它
      maximum-pool-size: 20        # 不是越大越好：DB 连接是昂贵资源，公式 ≈ 核数*2 起步压测调
      minimum-idle: 5
      connection-timeout: 3000     # 拿连接最多等 3s，快速失败优于堆积
      max-lifetime: 1740000        # 29min，小于 DB/中间件的 wait_timeout（默认 8h），避免用到已被断开的连接
      validation-timeout: 3000
    type: com.zaxxer.hikari.HikariDataSource

  lifecycle:
    timeout-per-shutdown-phase: 30s

# ── Actuator：暴露要收敛，健康探针必须开
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus     # 别 include *（env/heapdump 有敏感信息）
  endpoint:
    health:
      probes:
        enabled: true                  # /actuator/health/liveness、/readiness 供 K8s
      show-details: when_authorized
  health:
    redis:
      enabled: true

# ── 日志：滚动切割 + 保留期，防磁盘打满
logging:
  level:
    root: INFO
    com.example.demo: INFO
  file:
    name: /data/logs/app.log
  logback:
    rollingpolicy:
      file-name-pattern: /data/logs/app.%d{yyyy-MM-dd}.%i.log.gz
      max-file-size: 200MB
      max-history: 14                  # 保留 14 天
      total-size-cap: 20GB

# ── 超时与重试（Feign 示例）：原则见 10-超时与重试体系实战
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connect-timeout: 1000
            read-timeout: 3000
            retryer: com.example.NoRetry     # 默认 NEVER_RETRY，若自定义重试必须配幂等
```

---

## 二、JVM 启动参数模板

```bash
java \
  -Xms4g -Xmx4g \                              # 初始=最大：避免运行期扩容抖动
  -XX:MaxMetaspaceSize=512m \                  # 不设上限的 Metaspace 会吃光容器内存
  -XX:MaxDirectMemorySize=1g \                 # NIO 堆外（Netty/文件传输用）
  -XX:+UseG1GC \                               # JDK 17+；超大堆低延迟可换 ZGC
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \            # OOM 自动 dump（没有它，OOM 排查=盲猜）
  -XX:HeapDumpPath=/data/dump/ \
  -Xlog:gc*:file=/data/logs/gc.log:time,uptime:filecount=5,filesize=50M \
  -XX:+ExitOnOutOfMemoryError \                # OOM 后自杀交给 K8s 重启，别带病运行
  -Djava.security.egd=file:/dev/./urandom \    # SecureRandom 非阻塞，避免启动卡顿
  -jar app.jar --spring.profiles.active=prod
```

**容器环境的致命细节**：容器内 JVM 感知的是容器 limit 而非宿主机（JDK 10+ 默认支持）。**堆 + Metaspace + 线程栈 + 堆外 + CodeCache 加起来必须 < 容器 limit**，否则被 cgroup OOM-Kill（kill -9，HeapDump 都来不及留）。经验配比：

```text
容器 limit 4G → 堆 2.5G + Metaspace 512M + 堆外/栈 ~1G
```

---

## 三、优雅停机：三处必须同时配（缺一处就白配）

```yaml
server.shutdown: graceful                              # ① 应用层：等存量请求处理完
k8s: terminationGracePeriodSeconds: 40                 # ② K8s：给足宽限期（> ①的超时）
preStop: sleep 10                                      # ③ preStop 睡几秒：等 kubelet 摘除
                                                       #    Service 端点，防止停机瞬间还接流量
```

只配 ①：K8s 发 SIGTERM 的同时还在往 Pod 导流量 → 停机瞬间报错。三件套齐了才真正优雅。

---

## 四、配置清单：不配的后果速查表

| 配置项 | 默认值 | 不配的后果 |
|--------|--------|-----------|
| `hikari.maximum-pool-size` | **10** | 一到高峰就拿连接超时（见 `01` 篇场景五） |
| `hikari.max-lifetime` | 30min | 比 DB wait_timeout 长时用到死连接，偶发 `Connection closed` |
| `server.shutdown` | immediate | 发布瞬间大量 502 |
| HeapDumpOnOutOfMemoryError | 关 | OOM 后现场全丢 |
| `MaxMetaspaceSize` | 无上限 | 动态类把容器内存吃穿被 OOM-Kill |
| actuator include | health | 想要 prometheus 指标时忘了暴露 |
| logback 滚动 | 单文件无限涨 | 磁盘打满，整个节点挂 |
| Feign read-timeout | 60s | 下游卡死时线程被占满，雪崩 |

---

## 五、发布前检查清单

```text
□ JVM 参数齐全（dump / GC日志 / ExitOnOOM / Metaspace 上限）
□ HikariCP 池大小与超时按压测结论配置
□ 优雅停机三件套（graceful + 宽限期 + preStop）
□ 日志滚动切割 + 敏感字段脱敏
□ Actuator 只暴露 health/prometheus
□ 外部调用全部有显式超时（连接/读分开配）
□ 健康探针接通 K8s（liveness/readiness 语义分开：启动慢的服务 liveness 别太激进）
□ 压测结论落档：QPS 上限、池大小、线程数依据
```

## 关联文档

- 优雅停机与 K8s 探针：`../kubernetes/README.md`
- 连接池事故排查：`01-线上故障排查实战手册.md` 场景五
- 超时配置原则：`10-超时与重试体系实战.md`
