# 23 · 跨语言对照（Rust vs Java / Go / Node / C++）

> 本文为 `技术文档/` 系列（typescript/nest/react/nextjs/vue/java/node/rust）的横向总结，基于各目录已确认知识点整理。

Rust 的定位：**系统级语言 + 内存安全 + 高性能 + 无畏并发**，无 GC、无运行时开销。下面与同系列其他语言对照，帮助你面试与选型。

## 一、语言模型对照

| 维度 | Rust | Java | Go | Node.js | C++ |
|---|---|---|---|---|---|
| 内存管理 | 所有权（编译期） | GC | GC | GC（V8） | 手动/智能指针 |
| 运行时 | 几乎无 | JVM | 小 runtime | V8 + libuv | 无 |
| 并发模型 | 线程 + async + channel | 线程 + 虚拟线程(java/10) | goroutine + channel | 事件循环(node/02) | std::thread |
| 安全保证 | 编译期内存+并发安全 | 类型安全、GC 防越界 | 类型安全、GC | 类型安全 | 易 UB |
| 包管理 | Cargo/crates.io(20) | Maven/Gradle | go modules | npm/pnpm | vcpkg/CMake |
| 学习曲线 | 陡（借用检查） | 中 | 缓 | 缓 | 陡 |

## 二、所有权 vs GC

- Rust 用**所有权/借用/生命周期**（05-借用与引用.md、07-泛型Trait与生命周期）在编译期保证无悬垂、无数据竞争，**零运行时成本**。
- Java/Go/Node 用 GC 在运行期回收，简单但有误触停顿与内存开销。
- C++ 手动管理，灵活但易内存安全 bug——Rust 取其性能、补其安全。

## 三、并发对照

| 特性 | Rust | Java | Go | Node |
|---|---|---|---|---|
| 线程 | `thread::spawn`(17) | `Thread`/虚拟线程(java/10) | goroutine | worker_threads(node/09) |
| 通信 | channel/mpsc(17) | `BlockingQueue`/虚拟线程 | channel(CSP) | `MessageChannel` |
| 共享 | `Mutex`+`Arc`(17) | `synchronized`/Lock(java/15) | `sync.Mutex` | `SharedArrayBuffer` |
| 异步 | tokio async(18) | Project Loom | goroutine 原生 | 事件循环(node/02) |
| 安全 | `Send`/`Sync` 编译期 | 运行期检测 | race detector | 单线程无竞争 |

## 四、错误处理对照

- Rust：`Result<T,E>` + `?` 强制处理（08-错误处理、16-Option/Result），无异常。
- Java：受检/非受检异常（java/04）、Spring 异常过滤器（nest/05 灵感）。
- Go：`error` 返回值（类似 Result 但不强制）。
- Node：回调 err-first / `throw` / `Promise.reject`（node/13 测试亦验证）。
- C++：异常 / 返回码 / `std::expected`（C++23，仿 Result）。

## 五、类型系统与 trait

- Rust `trait`（12-Trait、07-泛型Trait）≈ Java `interface` + 默认方法 + 静态分发（单态化，零成本）。
- Rust 泛型单态化 vs Java 类型擦除（java/06-generics）：Rust 无运行时 boxing 开销。
- Rust `enum` + 模式匹配（04-枚举与模式匹配）≈ Java 21 密封类 + switch 模式匹配（java/09），但 Rust 天然穷尽检查。

## 六、Web / 后端生态

| 能力 | Rust | Java | Node |
|---|---|---|---|
| 框架 | axum/Actix(22) | Spring Boot(java/13) | Express/Fastify(node/11-12) |
| 异步 | tokio(18) | 虚拟线程(java/10) | 事件循环 |
| ORM | sqlx/diesel | JPA/MyBatis(java/19-20) | prisma/sequelize |
| 微服务 | tonic(gRPC)/axum | Spring Cloud(java/24) | Nest(node 可选) |

## 七、选型建议（面试加分）

- **用 Rust**：系统编程、CLI 工具、高性能网关/代理、WASM、嵌入式、需要无 GC 高并发。
- **用 Java**：企业级后端、成熟生态、JVM 全家桶（java/13-24）。
- **用 Go**：云原生基础设施、简单高并发服务。
- **用 Node**：I/O 密集 Web、前后端同语言、快速原型。
- **Rust 与 Node 互补**：用 Rust 写性能敏感模块，编译为 NAPI/WebAssembly 供 Node 调用（FFI，21 章）。

## 八、本系列索引

- typescript（16）、nest（9）、react（16）、nextjs（16）、vue（13）、java（25）、node（15）、rust（23）
- Rust 内部：01 路线图 → 02 速查 → 03-16 基础手册 → 17 并发 → 18 异步 → 19 宏 → 20 Cargo → 21 unsafe/FFI → 22 Web → 23 对照

> 至此 `技术文档/` 八目录构成完整语言/框架求职复习体系。
