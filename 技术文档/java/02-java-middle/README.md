# Java 知识文档索引

> 全部基于 **Java 官方文档（docs.oracle.com）**、**Spring 官方文档（spring.io）**、**JVM 规范**、**OpenJDK 源码/JEP** 抓取整理。
> 知识点标注官网来源；官网未展开处以标准实践补充并注明。
> 逐篇主题与官方出处见 [`12-索引明细表.md`](./12-索引明细表.md)。

---

## 文档索引（编号即文件序号）

### 语言核心（01-12）

| 编号 | 文件 | 主题 |
|---|---|---|
| 01 | `01-Java基础语法与学习路线.md` | 知识地图与学习路线 |
| 02 | `02-Java语言基础.md` | 变量 / 8 种基本类型 / 运算符 / 控制流 / 数组 |
| 03 | `03-面向对象类与对象.md` | 类 / 继承 / 多态 / 抽象类 / 接口 / 包 |
| 04 | `04-异常处理.md` | 异常体系 / try-catch / try-with-resources |
| 05 | `05-集合框架.md` | List / Set / Map / Queue **用法层** |
| 06 | `06-泛型.md` | 泛型类 / 方法 / 通配符 / 类型擦除 |
| 07 | `07-Lambda与函数式编程.md` | Lambda / 函数式接口 / Stream / Optional |
| 08 | `08-Record记录类.md` | Record 不可变数据载体（JEP 395） |
| 09 | `09-密封类与模式匹配.md` | Sealed + instanceof/switch 模式匹配 |
| 10 | `10-虚拟线程.md` | 虚拟线程（JEP 444） |
| 11 | `11-Java8到21新特性.md` | Java 8 → 21 特性演进总览 |
| 12 | `12-索引明细表.md` | 全目录索引与官方出处对照 |

### 框架与数据访问（13-25）

| 编号 | 文件 | 主题 |
|---|---|---|
| 13 | `13-SpringBoot.md` | 自动配置 / Starter / REST / Actuator |
| 14 | `14-Spring核心IoC与AOP.md` | IoC / DI / AOP / Bean Scope |
| 15 | `15-并发进阶.md` | synchronized / Lock / JUC / CompletableFuture **API 层** |
| 16 | `16-JVM内存模型与GC.md` | 运行时数据区 / 分代 / GC 收集器 |
| 17 | `17-单元测试JUnit与Mockito.md` | JUnit 6 / 断言 / 参数化 / Mockito |
| 18 | `18-JDBC数据库编程.md` | DriverManager / PreparedStatement / 事务 / 批处理 |
| 19 | `19-JPA与SpringDataJPA.md` | @Entity / 关联 / Repository / @Transactional |
| 20 | `20-MyBatis.md` | XML 映射 / `#{}` vs `${}` / 动态 SQL / 缓存 |
| 21 | `21-持久层进阶JPA与MyBatisPlus.md` | 分页 / 审计 / 逻辑删除 / 多数据源 |
| 22 | `22-SpringSecurity与OAuth2与JWT.md` | 过滤器链 / OAuth2 / JWT / `@PreAuthorize` |
| 23 | `23-Redis缓存.md` | RedisTemplate / `@Cacheable` / 缓存三问 / 分布式锁 |
| 24 | `24-消息队列与微服务.md` | Kafka / RabbitMQ / 注册发现 / 网关 / 熔断 |
| 25 | `25-设计模式与面试专项.md` | GoF 23 种 / 算法套路 / 高频面试题串讲 |

### 云原生现代栈（26-30）

| 编号 | 文件 | 主题 |
|---|---|---|
| 26 | `26-WebFlux响应式编程.md` | Reactor / Mono-Flux / 背压 |
| 27 | `27-Kafka流式处理.md` | Spring Kafka / Streams / exactly-once |
| 28 | `28-云原生GraalVM.md` | Native Image / AOT / 反射注册 |
| 29 | `29-Kubernetes部署.md` | 容器镜像 / 探针 / 配置与 Secret |
| 30 | `30-可观测性.md` | Micrometer / OpenTelemetry / 日志与 MDC |

### 底层原理与面试深挖层（31-37，本次新增）

| 编号 | 文件 | 主题 | 补的是哪个空洞 |
|---|---|---|---|
| 31 | `31-反射与注解.md` | Class / Field-Method-Constructor / JDK 代理 vs CGLIB / 元注解 | 13、14 两篇 Spring 文档长期默认读者已懂反射与动态代理 |
| 32 | `32-IO与NIO.md` | 字节字符流 / 序列化 / Path-Files / Buffer-Channel-Selector / 零拷贝 / Reactor | 旧索引承诺过「IO 与 NIO」但从未有文件 |
| 33 | `33-字符串与常用API.md` | 常量池与 intern / StringBuilder / Object 五方法 / 包装类缓存 / java.time / 枚举 / 正则 | `Object类`、`正则`、`静态代码块` 此前全目录 0 覆盖 |
| 34 | `34-并发底层原理JMM与锁.md` | JMM / happens-before / 内存屏障 / Mark Word 与锁演化 / CAS 与 ABA / AQS | `AQS` 此前 0 命中；15 篇只讲 API 不讲为什么 |
| 35 | `35-线程池与线程协作.md` | 七大参数 / 提交流程与推演 / 拒绝策略 / 状态机 / 线程数怎么定 / wait-notify / 同步工具类 / ThreadLocal 泄漏 | 线程池此前只有 5 行；`ThreadLocal` 无专章 |
| 36 | `36-集合底层源码剖析.md` | put 全流程 / 树化三阈值 / 扩容拆链 / CHM 1.7→1.8 / 1.5 倍扩容 / fail-fast | 25 篇写着「集合底层见 05」，但 05 是 API 手册 |
| 37 | `37-JVM调优与故障排查.md` | GC Roots 与四种引用 / 类加载与双亲委派 / jstat-jstack-jcmd-Arthas-MAT / 8 个线上案例 | `GC Roots` 此前 0 命中；16 篇只有参数表没有排查 |

### Spring 深挖层（38-40，本次第二批新增）

| 编号 | 文件 | 主题 | 补的是哪个空洞 |
|---|---|---|---|
| 38 | `38-SpringMVC请求流程与Web层.md` | DispatcherServlet 全链路 / 参数绑定 / Jackson 定制 / Bean Validation / 全局异常 / Filter-拦截器-AOP 选型 / CORS | `DispatcherServlet`、`HandlerInterceptor`、`@ControllerAdvice`、`@Valid`、`全局异常`、`跨域`、`文件上传` 此前全部 0 命中 |
| 39 | `39-Spring事务与传播机制.md` | 事务抽象与 ThreadLocal 绑定 / 回滚规则 / 七种传播行为 / 十条失效清单 / 乐观锁与丢失更新 / 长事务与连接池 / 分布式事务取舍 | `事务传播`、`Propagation`、`乐观锁` 此前 0 命中；`@Transactional` 全目录只有 4 行 |
| 40 | `40-Bean生命周期与循环依赖.md` | 完整流水线与两类扩展点 / BeanDefinition 与 `@Import` / 三级缓存与循环依赖 / 三种初始化回调顺序 / 作用域陷阱 / 启动后钩子选型 | 14 篇「生命周期」只在导语出现一次；三级缓存仅 25 篇占一行 |

---

## 学习路径

**第一轮：语言基础**

1. `01-java_base/00-09`（零基础：语法、数组、方法、面向对象入门）
2. `01-11` 语言核心 → `33` 字符串与常用 API 补齐基础篇没讲的 API
3. `31` 反射与注解、`32` IO 与 NIO（框架与网络的前置底座）

**第二轮：原理与底层（面试深挖区）**

4. `05` 集合用法 → `36` 集合底层源码
5. `15` 并发 API → `34` JMM 与锁 → `35` 线程池与协作 → `10` 虚拟线程
6. `16` JVM 结构与 GC → `37` JVM 调优与故障排查

**第三轮：企业栈**

7. `13` Spring Boot → `14` Spring Core → **`40` Bean 生命周期与循环依赖** → **`38` SpringMVC 请求流程与 Web 层** → `17` 测试 → `22` Security
8. `18` JDBC → `19` JPA → `20` MyBatis → `21` 持久层进阶 → **`39` Spring 事务与传播机制**；SQL 侧配套 `../03-mysql/`（事务与锁的 DB 层论证在 `03-mysql/09`、`03-mysql/16`）
9. `23` Redis → `24` 消息与微服务

**第四轮：云原生与现代演进 + 冲刺**

10. `11` 新特性总览 → `26` WebFlux → `27` Kafka → `28` GraalVM → `29` K8s → `30` 可观测性
11. `25` 设计模式与面试专项串讲（其「集合底层」「JVM 与并发」两节的深挖答案现已在 34-37）

**目录外衔接**：SQL 与事务原理配套 `../03-mysql/`（09 事务、11 索引、16 锁）；生产实战问题直接查 `../17-practice/`（01 故障排查、03 事务失效清单、09 线程池实践，分别与本目录 37、39、35 呼应）。

---

## 三个同名易混概念（先读这条再读 16/34/37）

| 术语 | 指什么 | 在哪篇 |
|---|---|---|
| **JMM**（Java Memory Model） | 并发可见性与重排的**规范契约**（JSR-133） | `34` |
| **JVM 运行时内存区域** | 堆 / 元空间 / 栈 / 程序计数器等**内存划分** | `16`、`37` |
| **GC 根（GC Roots）** | 可达性分析的起点，属于垃圾回收 | `37`（`16` 只讲到分代与收集器） |

三者常被一并称作「内存模型」，答题时务必先确认对方问的是哪一个。

---

## 目录状态：整个 `技术文档/java` 共四层

| 层 | 目录 | 篇数 | 定位 |
|---|---|---|---|
| 基础 | `../01-java_base/` | 10（00-09） | 零基础入门 |
| 深挖 | 本目录 | 42 正文 + 本 README = 43 | 语言核心 → 企业栈 → 云原生 → 底层深挖（01-42 连续编号） |
| 深挖 | `../03-mysql/` | 23（00-22） | 从 SQL 到主从分库分表 |
| 总纲 | `../04-concurrency` ~ `../16-nginx`（13 个主题） | 各 1 篇 README | 主题知识地图 + 面试考点（100-350 行/篇，统一带「常见面试考点」收尾） |
| 实战 | `../17-practice/` | 11 | 线上故障排查、秒杀、事务失效、幂等、超时重试等生产经验 |

`技术文档/java` 合计 **99 篇 md**（另有顶层 `../README.md` 总导航与路线图）。

### 四层怎么配合：学新知看深挖，复习看总纲，动手前看实战

| 主题 | 总纲（速查） | 深挖正文 |
|---|---|---|
| JVM | `../05-jvm` | `16`（结构与收集器）+ `37`（引用/类加载/工具/案例） |
| 并发 | `../04-concurrency` | `15`（API）+ `34`（JMM/AQS/锁）+ `35`（线程池/协作）+ `36`（并发容器） |
| Spring | `../08-springboot` | `13`/`14` + `38`（Web 层）+ `39`（事务）+ `40`（Bean 生命周期）+ `31`（反射与代理） |
| Redis | `../06-redis` | `23`（Spring Data Redis 用法） |
| 消息队列 | `../07-mq` | `24`（Spring Kafka/AMQP）+ `27`（Kafka Streams）+ `32`（零拷贝根因） |
| 微服务/注册配置 | `../09-microservices`、`../11-nacos` | `24`（Spring Cloud 代码层）+ `30`（可观测性） |
| 容器编排 | `../14-docker`、`../15-kubernetes` | `29`（Spring Boot 侧落地） |
| 分布式理论 | `../10-distributed` | `39` 第十二节（事务取舍）+ `23`（分布式锁） |
| 计算机基础 | `../12-network`、`../13-linux` | `32`（IO 模型与多路复用） |

> 各总纲的「衔接」行已回指本目录的 31-40 深挖篇，双向可达。**读法建议**：面试前用总纲过一遍考点清单，任一条答不顺就跳对应编号篇细读。

## 尚未覆盖（后续可补）

| 主题 | 现状 |
|---|---|
| Elasticsearch | 全目录仅出现在本索引的待补充清单里，0 实质内容 |
| 分布式事务落地 | `../10-distributed` 与 `39` 第十二节给了方案与选型，Seata AT/TCC、本地消息表、RocketMQ 事务消息无落地篇 |
| 中间件运维件 | Canal/binlog 订阅（`../06-redis` 提了一句）、xxl-job、Apollo（已有 `../11-nacos` 可替代）、Sentinel 细节 |
| 压测与性能工程 | JMeter/wrk/gatling、火焰图基准测试无覆盖 |
| 架构方法论 | DDD 分层（`../09-microservices` 有服务拆分原则）、SOLID 设计原则（`25` 只有 GoF 模式清单） |
| 26-30 五篇密度 | 目前 2-2.5KB 概览级，与 01-25 的 5-7KB 不同档，可逐篇加厚 |

