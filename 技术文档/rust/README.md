# Rust 学习文档体系

> 本目录包含系统的 Rust 学习文档，从基础入门到高级特性，循序渐进。

---

## 📚 文档索引（编号体系，推荐阅读顺序）

### 🎯 学习指南

| 编号 | 文档 | 说明 |
|------|------|------|
| 01 | [Rust 学习路线图与计划书](01-Rust学习路线图与计划书.md) | 完整学习路径规划，从入门到精通 |
| 02 | [Rust 快速参考手册](02-Rust快速参考手册.md) | 语法速查、常用模式、Trait 速查 |

### 📖 基础核心手册

| 编号 | 文档 | 主题 |
|------|------|------|
| 03 | [结构体语法](03-结构体语法.md) | 结构体定义、实例化、方法 |
| 04 | [枚举与模式匹配](04-枚举与模式匹配.md) | 枚举、Option、Result、match |
| 05 | [借用与引用](05-借用与引用.md) | 引用与借用（所有权核心） |
| 06 | [Rust_String 知识手册](06-Rust_String知识手册.md) | String 与 &str 深入 |
| 07 | [泛型 Trait 与生命周期](07-Rust泛型Trait与生命周期知识手册.md) | 泛型、Trait、生命周期综合 |
| 08 | [错误处理知识手册](08-Rust错误处理知识手册.md) | Result、Option、panic、自定义错误 |
| 09 | [集合类型与迭代器](09-Rust集合类型与迭代器手册.md) | Vec、HashMap、迭代器 |
| 10 | [模块系统与包管理](10-Rust模块系统与包管理手册.md) | 模块、crate、workspace、Cargo 基础 |
| 11 | [测试与文档](11-Rust测试与文档手册.md) | 单元测试、集成测试、文档 |
| 12 | [Trait 知识手册](12-Rust_Trait知识手册.md) | Trait 深入 |
| 13 | [闭包知识手册](13-Rust闭包知识手册.md) | 闭包、Fn/FnMut/FnOnce |
| 14 | [迭代器知识手册](14-Rust迭代器知识手册.md) | 迭代器适配器、惰性求值 |
| 15 | [智能指针知识手册](15-Rust智能指针知识手册.md) | Box/Rc/RefCell/Arc/Mutex |
| 16 | [Option 与 Result 深度解析](16-Option 与 Result 深度解析.md) | 可选值与错误处理的本质 |

### 🚀 进阶主题（官方权威补充）

| 编号 | 文档 | 主题 | 官方来源 |
|------|------|------|----------|
| 17 | [并发与并行](17-concurrency-parallel.md) | thread/spawn/move/channel/Mutex/Send/Sync | The Book Ch16 Fearless Concurrency |
| 18 | [异步编程](18-async-await.md) | async/await/Future/executor/Pin/tokio/Stream | Async Book + tokio |
| 19 | [宏](19-macros.md) | 声明宏/过程宏/derive | The Rust Reference — Macros |
| 20 | [Cargo 进阶](20-cargo-advanced.md) | workspace/features/发布/profile | The Cargo Book |
| 21 | [unsafe 与 FFI](21-unsafe-ffi.md) | 裸指针/extern "C"/cbindgen | The Rust Reference — Unsafe |
| 22 | [Web 框架](22-web-framework-axum.md) | axum/Actix/tokio/sqlx/中间件 | axum/Actix/tokio 官方 |
| 23 | [跨语言对照](23-cross-lang-comparison.md) | Rust vs Java/Go/Node/C++ 对照 | 全系列联动 |
| 24 | [Rustlings 习题](24-rustlings-exercises.md) | 官方练习集/题型解析/学习法 | rust-lang/rustlings |
| 25 | [Rust + WASM](25-wasm-web.md) | wasm-bindgen/wasm-pack/web-sys/DOM | Rust-WASM Book（已停维） |
| 26 | [过程宏实战](26-proc-macro-deep.md) | syn/quote/DeriveInput/属性宏 | syn-3.0.4 官方文档（完整） |
| 27 | [嵌入式与 RTIC](27-embedded-rtic.md) | no_std/RTIC 实时任务/中断 | RTIC + rust-embedded 官方 |
| 28 | [性能剖析](28-performance-profiling.md) | criterion/flamegraph/perf/dhat/tokio-console | The Rust Performance Book |
| 29 | [Actor 框架](29-actor-frameworks.md) | RActor/Actix/监督树/分布式 | RActor/Actix 官方 |
| 30 | [Rust↔Java JNI](30-rust-java-jni.md) | JNI/cdylib/JavaVM/异常/类型映射 | jni-0.22.4 官方（完整） |
| 31 | [async-graphql](31-async-graphql.md) | Schema/Object/Query/Mutation/Subscription/axum 集成 | async-graphql 官方书 |
| 32 | [tonic gRPC](32-tonic-grpc.md) | proto/tonic-build/Server/Client/Streaming/tokio | tonic-0.14.6 官方（完整） |
| 33 | [CLI clap/ratatui](33-cli-clap-ratatui.md) | clap derive/子命令/ratatui TUI | clap-4.6.6 官方（完整） |
| 34 | [Bevy 游戏](34-bevy-game.md) | ECS/Entity/Component/System/Plugin/Event | Bevy 官方书（目录式） |
| 35 | [Linux 内核 Rust](35-linux-kernel-rust.md) | 内核 Rust/abstractions/bindgen/Opaque | Linux Kernel Rust 6.12 官方 |
| 36 | [Redis/SQLx 深入](36-data-redis-sqlx.md) | redis-rs/sqlx query!/PgPool/事务/PubSub | redis-1.6.0 + sqlx-0.9.0 官方（完整） |
| 37 | [Actix Web 深入](37-actix-web-deep.md) | Handler/extractors/middleware/state/WebSocket/测试 | Actix Web 官方（目录式） |
| 38 | [WASM 前端](38-wasm-frontend-leptos-yew.md) | Leptos signals/server-fn / Yew html! / SSR+hdyration | Leptos 官方 + Yew（标注） |
| 39 | [Tokio 深度](39-tokio-deep.md) | Runtime/Scheduler/I-O driver/spawn_blocking/sync | tokio-1.53.1 官方（完整） |
| 40 | [Serde 内部](40-serde-internals.md) | 四大 trait/derive/数据格式/零开销/零拷贝 | serde-1.0.229 官方（完整） |
| 41 | [Rust 编译模型](41-rustc-compiler-model.md) | HIR→MIR/borrow check/NLL/LLVM/LTO | Rustc Dev Guide（MIR 完整） |
| 42 | [分布式 tonic 集群](42-tonic-distributed.md) | LB/服务发现/拦截器/重试/可观测/与 MQ 结合 | tonic-0.14.6 + gRPC 标准 |
| 43 | [Rayon 数据并行](43-rayon-data-parallel.md) | par_iter/join/par_sort/ThreadPoolBuilder | rayon-1.12.0 官方（完整） |
| 44 | [Tower 中间件](44-tower-middleware.md) | Service/Layer/ServiceBuilder/timeout/retry/limit | tower-0.5.3 官方（完整） |
| 45 | [WASM 优化实战](45-wasm-optimization.md) | 体积/TypedArray 零拷贝/多线程/twiggy | 官方结构 + 标准实践 |
| 46 | [Postgres 深入](46-postgres-deep.md) | sqlx/PgPool/query_as!/事务/迁移/JSONB | sqlx-0.9.0 官方（完整） |
| 47 | [RActor 集群](47-ractor-cluster.md) | Actor/Msg/State/handle/监督树/cluster RPC | ractor-0.16.5 官方（完整） |
| 48 | [内核驱动实战](48-kernel-driver-practice.md) | module!/platform::Driver/probe/devres | Rust-for-Linux 官方（结构） |
| 49 | [tracing 可观测性](49-tracing-observability.md) | Span/Event/Subscriber/#[instrument]/OTel | tracing-0.1.44 官方（完整） |
| 50 | [Wasmtime 与 WASI](50-wasmtime-wasi.md) | Engine/Store/Linker/Module/fuel/epoch/AOT | wasmtime-48.0.1 官方（完整） |
| 51 | [测试进阶](51-testing-advanced.md) | proptest/criterion/mockall/覆盖率 | proptest-1.11.0 官方（完整） |
| 52 | [rustls 与密码学](52-rustls-crypto.md) | TLS/Arc 复用/mTLS/Argon2/AES-GCM/Ed25519 | rustls + RustCrypto（结构+实践） |
| 53 | [no_std 与嵌入式](53-no-std-embedded.md) | core/alloc/embedded-hal/Embassy/defmt | embedded-hal + Embassy（结构） |
| 54 | [交叉编译与发布](54-cross-compile-release.md) | target triple/musl/cross/zigbuild/cargo-dist | Rust 官方 + cross（结构+实践） |
| 55 | [异步运行时生态选型](55-async-runtime-ecosystem.md) | tokio/smol/glommio/monoio/Embassy/async-compat | async-std 1.13.2 官方声明（完整）⚠️已停维 |
| 56 | [WASM 组件模型](56-wasm-component-model.md) | WIT/Component/cargo-component/wac compose/WASIp2 | wasmtime 48 官方 component 模块 |
| 57 | [wgpu GPU 计算](57-wgpu-gpu-computing.md) | Instance/Device/ComputePipeline/WGSL/深度[0,1]/HDR | wgpu-30.0.1 官方（完整） |
| 58 | [unsafe 审计与 Miri](58-unsafe-audit-miri.md) | UB 清单/# Safety 契约/Miri/ASan-TSan/Loom/cargo-geiger | Rust Reference + Miri 官方 |

---

## 🎓 学习路径

### Phase 1: 基础入门（1-2周）
1. [01 路线图](01-Rust学习路线图与计划书.md) 了解整体规划
2. 基础文档：03 结构体、04 枚举、05 借用与引用
3. 完成 Rustlings 前 50% 练习

### Phase 2: 核心概念（3-4周，最重要）
1. **所有权系统**：05 借用与引用、06 String
2. **类型系统三支柱**：07 泛型/Trait/生命周期、12 Trait
3. **错误处理**：08 错误处理、16 Option/Result

### Phase 3: 进阶特性（2-3周）
1. 09 集合与迭代器、13 闭包、14 迭代器
2. 10 模块与包管理、11 测试、15 智能指针

### Phase 4: 专家级（持续，官方补充篇）
1. 17 并发、18 异步、19 宏
2. 20 Cargo 进阶、21 unsafe/FFI
3. 22 Web 框架（axum/tokio）、23 跨语言对照

### Phase 5: 实战项目（持续）
参考路线图项目建议，动手实践。

---

## 📋 快速查阅

### 按主题查找

| 主题 | 相关文档 |
|------|----------|
| **所有权/借用** | 05 借用与引用、06 String |
| **泛型/Trait** | 07 泛型Trait与生命周期、12 Trait |
| **生命周期** | 07 泛型Trait与生命周期 |
| **错误处理** | 08 错误处理、16 Option/Result、04 枚举 |
| **集合类型** | 09 集合类型与迭代器、14 迭代器 |
| **项目组织** | 10 模块系统、20 Cargo 进阶 |
| **测试** | 11 测试与文档 |
| **并发/异步** | 17 并发、18 异步 |
| **宏/元编程** | 19 宏 |
| **FFI** | 21 unsafe/FFI |
| **Web 后端** | 22 Web 框架、23 跨语言对照 |

### 按难度分级

**初级** 🌱：03 结构体、04 枚举、05 借用与引用
**中级** 🌿：06 String、08 错误处理、09 集合与迭代器
**高级** 🌳：07 泛型Trait、10 模块、11 测试、15 智能指针
**专家** 🔥：17 并发、18 异步、19 宏、21 unsafe、22 Web

---

## 🔧 学习工具

### 必备工具

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 常用命令
cargo build      # 构建
cargo run        # 运行
cargo test       # 测试
cargo check      # 快速检查
cargo doc        # 生成文档
cargo clippy     # 代码检查
cargo fmt        # 格式化
```

### 推荐 IDE

- **VS Code** + rust-analyzer 插件
- **RustRover** (JetBrains 出品的 Rust IDE)
- **Zed** (内置 Rust 支持)

### 在线资源

- [The Rust Programming Language](https://doc.rust-lang.org/book/) - 官方教程
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - 实例学习
- [Rustlings](https://github.com/rust-lang/rustlings) - 小练习
- [Rust 语言圣经](https://course.rs/) - 中文教程

---

## 📝 学习建议

1. **不要跳过所有权**：这是 Rust 的核心，花时间彻底理解
2. **多写代码**：每天至少写 30 分钟 Rust 代码
3. **边学边练**：读完一个概念后立即写代码验证
4. **善用文档**：Rust 文档非常详细，学会查阅标准库文档
5. **参与社区**：遇到问题及时在论坛或 Discord 求助

---

## 📅 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2024-02-27 | 新增 Rust_String知识手册.md |
| 2024-02-28 | 新增 Rust错误处理知识手册.md、Rust泛型Trait与生命周期知识手册.md |
| 2024-03-01 | 新增 Rust学习路线图与计划书.md、Rust集合类型与迭代器手册.md、Rust模块系统与包管理手册.md、Rust测试与文档手册.md、Rust快速参考手册.md |
| 2026-09-02 | **编号化整合**：原 17 篇基础手册重命名为 01-16；新增进阶官方文档 17-23（并发/异步/宏/Cargo/unsafe-FFI/Web 框架/跨语言对照），与 typescript/nest/react/nextjs/vue/java/node 系列统一风格 |
| 2026-09-02 | **扩展补充**：新增 24-30（Rustlings/WASM/过程宏实战/嵌入式 RTIC/性能剖析/Actor/JNI 互操作），rust 目录共 30 篇完整覆盖入门→专家→跨语言集成 |
| 2026-09-02 | **生态扩展**：新增 31-36（async-graphql/tonic gRPC/clap+ratatui/Bevy 游戏/Linux 内核 Rust/Redis+SQLx 数据层），rust 目录共 36 篇 |
| 2026-09-02 | **框架/运行时/编译深挖**：新增 37-42（actix-web/Leptos+Yew WASM 前端/tokio 深度/Serde 内部/Rust 编译模型+LLVM/分布式 tonic 集群），rust 目录共 42 篇 |
| 2026-09-02 | **并行数据/中间件/内核深挖**：新增 43-48（Rayon 数据并行/tower 中间件/ WASM 优化实战/Rust+Postgres 深入/RActor 集群/Actor 实战/内核 Rust 驱动实战），rust 目录共 48 篇 |
| 2026-09-02 | **可观测/运行时/工程化**：新增 49-54（tracing 可观测性/Wasmtime+WASI/proptest+criterion+mockall 测试进阶/rustls 与密码学/no_std 与嵌入式 Embassy/交叉编译与发布），rust 目录共 54 篇 |
| 2026-09-02 | **运行时选型/组件模型/GPU/安全审计**：新增 55-58（异步运行时生态选型 + ⚠️async-std 已停维改用 smol、WASM 组件模型与 WIT、wgpu 30 GPU 计算、unsafe 审计与 Miri），rust 目录共 58 篇 |

---

## 📊 目录状态：已完整覆盖

`技术文档/rust` 共 **58 篇**，链路：学习路线(01) → 速查(02) → 基础手册(03-16) → 并发/异步/宏(17-19) → Cargo/unsafe-FFI/Web(20-22) → 跨语言对照(23) → 进阶实战(24-30) → 生态扩展(31-36) → 框架/运行时/编译深挖(37-42) → 并行/中间件/内核实战(43-48) → 可观测/WASM 运行时/工程化(49-54) → 选型/组件模型/GPU/安全(55-58)。

至此与 `技术文档/` 下 typescript(20) / nest(13) / react(20) / nextjs(20) / vue(17) / java(30) / node(20) / go(20) / rust(58) / Three.js(22) 等目录共同构成完整的技术求职复习体系。

> 如需在 rust 目录新增其他主题（如 Rust+GPU 计算进阶、wasm 组件模型组合深入、形式化验证 Kani），告知即可。

祝学习愉快！🦀
