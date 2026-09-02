# Rust 学习文档体系

> 本目录包含系统的 Rust 学习文档，按**主题拆分子文件夹**组织。从基础核心到高级特性，循序渐进。
> 全文共 **71 篇**，分布于 10 个子文件夹。

---

## 📁 目录结构（按主题分组）

```
rust/
├── 00-学习指南/          路线图 + 速查（先读这份规划全局）
├── 01-基础核心/          ← 新建：12 篇成体系循序渐进教程（推荐从这里入门）
├── 02-进阶特性/          并发 / 异步 / 宏 / Cargo / unsafe / Web / 跨语言
├── 03-实战生态/          Rustlings / WASM / 过程宏 / 嵌入式 / 性能 / Actor / JNI / graphql / gRPC / CLI / Bevy / 内核 / 数据层
├── 04-框架运行时/        actix / Leptos-Yew / tokio / Serde / 编译模型 / 分布式 tonic
├── 05-并行中间件内核/     Rayon / tower / WASM优化 / Postgres / RActor / 内核驱动
├── 06-工程化可观测/       tracing / Wasmtime-WASI / 测试进阶 / rustls / no_std / 交叉编译
├── 07-前沿安全/          异步运行时选型 / WASM组件模型 / wgpu GPU / unsafe审计-Miri
├── 08-动手项目/          4 阶段练手项目计划（动手敲代码）
└── 补充知识点/           ← 原有 03-16 碎片化专题手册（作为速查补充，不成体系）
```

**两类的区别**（重要）：
- `01-基础核心/`：新写的**循序渐进教程**，每篇讲透一个概念 + 可运行例子 + 易错点，适合零基础按序学。
- `补充知识点/`：原有各主题**专题速查手册**（如"结构体更新语法""Copy Trait 详解"），内容好但碎片化、有重叠，适合遇到问题回查，不作为主线。

---

## 🎯 00-学习指南

| 文档 | 说明 |
|------|------|
| [Rust 学习路线图与计划书](./00-学习指南/01-Rust学习路线图与计划书.md) | 完整学习路径规划（入门→精通） |
| [Rust 快速参考手册](./00-学习指南/02-Rust快速参考手册.md) | 语法速查、常用模式、Trait 速查 |

## 📘 01-基础核心（成体系教程，推荐顺序）

| # | 文档 | 主题 |
|---|------|------|
| 01 | [环境安装与 Hello World](./01-基础核心/01-环境安装与HelloWorld.md) | 工具链 / Cargo / 编译模型直觉 |
| 02 | [变量、常量与标量类型](./01-基础核心/02-变量常量与标量类型.md) | let/mut/const、i32/usize/f64/char、shadowing |
| 03 | [所有权与移动语义](./01-基础核心/03-所有权与移动语义.md) | 三规则、Move、Copy、RAII |
| 04 | [借用与引用](./01-基础核心/04-借用与引用.md) | &T / &mut T 共存规则、切片 |
| 05 | [结构体与方法](./01-基础核心/05-结构体与方法.md) | struct / 元组结构体 / impl / new |
| 06 | [枚举与模式匹配](./01-基础核心/06-枚举与模式匹配.md) | enum / match 穷尽 / if let / Option·Result |
| 07 | [流程控制与函数](./01-基础核心/07-流程控制与函数.md) | 表达式 vs 语句、if/else 表达式、loop/for |
| 08 | [泛型、Trait 与生命周期](./01-基础核心/08-泛型Trait与生命周期.md) | 零成本抽象、trait bound、'a 标注 |
| 09 | [集合类型 Vec/String/HashMap](./01-基础核心/09-集合类型VecStringHashMap.md) | push/get、String vs &str、HashMap 所有权 |
| 10 | [错误处理 Result 与 Option](./01-基础核心/10-错误处理Result与Option.md) | Option 取代 null、? 运算符、panic |
| 11 | [迭代器与闭包](./01-基础核心/11-迭代器与闭包.md) | 闭包捕获、Fn/FnMut/FnOnce、惰性链 |
| 12 | [模块、包管理与测试](./01-基础核心/12-模块包管理与测试.md) | mod/pub/use、crate/workspace、#[test]/doctest |

## 🚀 02-进阶特性

| # | 文档 | 主题 |
|---|------|------|
| 17 | [并发与并行](./02-进阶特性/17-concurrency-parallel.md) | thread/spawn/move/channel/Mutex/Send/Sync |
| 18 | [异步编程](./02-进阶特性/18-async-await.md) | async/await/Future/Pin/tokio/Stream |
| 19 | [宏](./02-进阶特性/19-macros.md) | 声明宏 / 过程宏 / derive |
| 20 | [Cargo 进阶](./02-进阶特性/20-cargo-advanced.md) | workspace / features / 发布 / profile |
| 21 | [unsafe 与 FFI](./02-进阶特性/21-unsafe-ffi.md) | 裸指针 / extern "C" / cbindgen |
| 22 | [Web 框架](./02-进阶特性/22-web-framework-axum.md) | axum / Actix / tokio / sqlx / 中间件 |
| 23 | [跨语言对照](./02-进阶特性/23-cross-lang-comparison.md) | Rust vs Java/Go/Node/C++ |

## 🧩 03-实战生态

| # | 文档 | 主题 |
|---|------|------|
| 24 | [Rustlings 习题](./03-实战生态/24-rustlings-exercises.md) | 官方练习集 / 题型解析 |
| 25 | [Rust + WASM](./03-实战生态/25-wasm-web.md) | wasm-bindgen / wasm-pack / web-sys |
| 26 | [过程宏实战](./03-实战生态/26-proc-macro-deep.md) | syn/quote/DeriveInput/属性宏 |
| 27 | [嵌入式与 RTIC](./03-实战生态/27-embedded-rtic.md) | no_std / RTIC 实时任务 / 中断 |
| 28 | [性能剖析](./03-实战生态/28-performance-profiling.md) | criterion/flamegraph/perf/dhat/tokio-console |
| 29 | [Actor 框架](./03-实战生态/29-actor-frameworks.md) | RActor/Actix/监督树/分布式 |
| 30 | [Rust↔Java JNI](./03-实战生态/30-rust-java-jni.md) | JNI/cdylib/JavaVM/类型映射 |
| 31 | [async-graphql](./03-实战生态/31-async-graphql.md) | Schema/Query/Mutation/Subscription/axum |
| 32 | [tonic gRPC](./03-实战生态/32-tonic-grpc.md) | proto/tonic-build/Streaming |
| 33 | [CLI clap/ratatui](./03-实战生态/33-cli-clap-ratatui.md) | clap derive/子命令/ratatui TUI |
| 34 | [Bevy 游戏](./03-实战生态/34-bevy-game.md) | ECS/Entity/Component/System/Plugin |
| 35 | [Linux 内核 Rust](./03-实战生态/35-linux-kernel-rust.md) | abstractions/bindgen/Opaque |
| 36 | [Redis/SQLx 深入](./03-实战生态/36-data-redis-sqlx.md) | redis-rs/sqlx query!/PgPool/事务 |

## ⚙️ 04-框架运行时

| # | 文档 | 主题 |
|---|------|------|
| 37 | [Actix Web 深入](./04-框架运行时/37-actix-web-deep.md) | Handler/extractors/middleware/WebSocket |
| 38 | [WASM 前端](./04-框架运行时/38-wasm-frontend-leptos-yew.md) | Leptos signals / Yew html! / SSR |
| 39 | [Tokio 深度](./04-框架运行时/39-tokio-deep.md) | Runtime/Scheduler/I-O driver/spawn_blocking |
| 40 | [Serde 内部](./04-框架运行时/40-serde-internals.md) | 四大 trait/derive/零拷贝 |
| 41 | [Rust 编译模型](./04-框架运行时/41-rustc-compiler-model.md) | HIR→MIR/borrow check/NLL/LLVM/LTO |
| 42 | [分布式 tonic 集群](./04-框架运行时/42-tonic-distributed.md) | LB/服务发现/拦截器/重试/可观测 |

## 🔗 05-并行中间件内核

| # | 文档 | 主题 |
|---|------|------|
| 43 | [Rayon 数据并行](./05-并行中间件内核/43-rayon-data-parallel.md) | par_iter/join/par_sort/ThreadPoolBuilder |
| 44 | [Tower 中间件](./05-并行中间件内核/44-tower-middleware.md) | Service/Layer/ServiceBuilder/Timeout/Retry |
| 45 | [WASM 优化实战](./05-并行中间件内核/45-wasm-optimization.md) | 体积/TypedArray 零拷贝/多线程/twiggy |
| 46 | [Postgres 深入](./05-并行中间件内核/46-postgres-deep.md) | sqlx/PgPool/query_as!/事务/JSONB |
| 47 | [RActor 集群](./05-并行中间件内核/47-ractor-cluster.md) | Actor/Msg/State/监督树/cluster RPC |
| 48 | [内核驱动实战](./05-并行中间件内核/48-kernel-driver-practice.md) | module!/platform::Driver/probe/devres |

## 📊 06-工程化可观测

| # | 文档 | 主题 |
|---|------|------|
| 49 | [tracing 可观测性](./06-工程化可观测/49-tracing-observability.md) | Span/Event/Subscriber/#[instrument]/OTel |
| 50 | [Wasmtime 与 WASI](./06-工程化可观测/50-wasmtime-wasi.md) | Engine/Store/Linker/Module/fuel/epoch/AOT |
| 51 | [测试进阶](./06-工程化可观测/51-testing-advanced.md) | proptest/criterion/mockall/覆盖率 |
| 52 | [rustls 与密码学](./06-工程化可观测/52-rustls-crypto.md) | TLS/mTLS/Argon2/AES-GCM/Ed25519 |
| 53 | [no_std 与嵌入式](./06-工程化可观测/53-no-std-embedded.md) | core/alloc/embedded-hal/Embassy/defmt |
| 54 | [交叉编译与发布](./06-工程化可观测/54-cross-compile-release.md) | target triple/musl/cross/zigbuild/cargo-dist |

## 🛡️ 07-前沿安全

| # | 文档 | 主题 |
|---|------|------|
| 55 | [异步运行时生态选型](./07-前沿安全/55-async-runtime-ecosystem.md) | tokio/smol/glommio/monoio/Embassy ⚠️async-std 已停维 |
| 56 | [WASM 组件模型](./07-前沿安全/56-wasm-component-model.md) | WIT/Component/cargo-component/WASIp2 |
| 57 | [wgpu GPU 计算](./07-前沿安全/57-wgpu-gpu-computing.md) | Instance/Device/ComputePipeline/WGSL（wgpu 30，rustc≥1.87） |
| 58 | [unsafe 审计与 Miri](./07-前沿安全/58-unsafe-audit-miri.md) | UB 清单/# Safety 契约/Miri/ASan-TSan/Loom |

## 🛠️ 08-动手项目

| 文档 | 说明 |
|------|------|
| [动手项目计划](./08-动手项目/59-动手项目计划.md) | 4 阶段练手：CLI 待办 / 线程池 / Axum API / Tokio 爬虫 |

## 📎 补充知识点（原 03-16 碎片化专题手册，作速查）

| # | 文档 | 主题 |
|---|------|------|
| 03 | [结构体更新语法与 Copy](./补充知识点/03-结构体语法.md) | `..` 更新语法、Copy 派生条件 |
| 04 | [枚举深入](./补充知识点/04-枚举与模式匹配.md) | 枚举变体 / match 细节 |
| 05 | [借用与引用（详解）](./补充知识点/05-借用与引用.md) | 引用规则完整版 |
| 06 | [String 知识手册](./补充知识点/06-Rust_String知识手册.md) | String vs &str 全面 |
| 07 | [泛型 Trait 生命周期（详解）](./补充知识点/07-Rust泛型Trait与生命周期知识手册.md) | 三件套综合速查 |
| 08 | [错误处理知识手册](./补充知识点/08-Rust错误处理知识手册.md) | Result/Option/panic/自定义错误 |
| 09 | [集合类型与迭代器手册](./补充知识点/09-Rust集合类型与迭代器手册.md) | Vec/HashMap/迭代器 |
| 10 | [模块系统与包管理手册](./补充知识点/10-Rust模块系统与包管理手册.md) | mod/crate/workspace/Cargo 基础 |
| 11 | [测试与文档手册](./补充知识点/11-Rust测试与文档手册.md) | 单元/集成/文档测试 |
| 12 | [Trait 知识手册](./补充知识点/12-Rust_Trait知识手册.md) | Trait 深入 |
| 13 | [闭包知识手册](./补充知识点/13-Rust闭包知识手册.md) | Fn/FnMut/FnOnce |
| 14 | [迭代器知识手册](./补充知识点/14-Rust迭代器知识手册.md) | 适配器/惰性求值 |
| 15 | [智能指针知识手册](./补充知识点/15-Rust智能指针知识手册.md) | Box/Rc/RefCell/Arc/Mutex |
| 16 | [Option 与 Result 深度解析](./补充知识点/16-Option 与 Result 深度解析.md) | 可选值与错误处理的本质 |

---

## 🔗 在线资源

- [The Rust Programming Language](https://doc.rust-lang.org/book/) - 官方教程
- [Rust by Example](https://doc.rust-lang.org/rust-by-example/) - 实例学习
- [Rustlings](https://github.com/rust-lang/rustlings) - 小练习
- [Rust 语言圣经](https://course.rs/) - 中文教程

---

## 📝 学习建议

1. **从 `01-基础核心/` 按顺序学**：尤其不要跳过 03 所有权、04 借用，这是 Rust 核心。
2. **主线用教程，卡壳查补充**：`补充知识点/` 是速查，遇到细节回翻。
3. **多写代码**：配合 `08-动手项目/` 的练手计划，每天至少 30 分钟。
4. **善用文档**：Rust 文档非常详细，学会查阅标准库文档（或 `补充知识点/02-Rust快速参考手册.md`）。
5. **读进阶按需**：`02-进阶特性/` 起可按求职方向选读（后端看 22/39/42，前端看 25/38，系统看 21/35/53）。

---

## 📅 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2024-02-27 | 新增 Rust_String知识手册.md |
| 2024-02-28 | 新增 Rust错误处理知识手册.md、Rust泛型Trait与生命周期知识手册.md |
| 2024-03-01 | 新增 Rust学习路线图与计划书.md、Rust集合类型与迭代器手册.md、Rust模块系统与包管理手册.md、Rust测试与文档手册.md、Rust快速参考手册.md |
| 2026-09-02 | 编号化整合：原 17 篇基础手册重命名为 01-16；新增进阶官方文档 17-23 |
| 2026-09-02 | 扩展补充：新增 24-30（Rustlings/WASM/过程宏/嵌入式/性能/Actor/JNI） |
| 2026-09-02 | 生态扩展：新增 31-36（async-graphql/tonic/clap+ratatui/Bevy/内核/数据层） |
| 2026-09-02 | 框架/运行时/编译深挖：新增 37-42（actix/Leptos-Yew/tokio/Serde/编译模型/tonic 集群） |
| 2026-09-02 | 并行/中间件/内核深挖：新增 43-48（Rayon/tower/WASM/Postgres/RActor/内核驱动） |
| 2026-09-02 | 可观测/工程化：新增 49-54（tracing/Wasmtime/测试/rustls/no_std/交叉编译） |
| 2026-09-02 | 选型/GPU/安全：新增 55-58（异步运行时选型/wasm 组件/wgpu/Miri） |
| 2026-09-02 | 动手项目：新增 59-动手项目计划.md |
| 2026-09-02 | **目录重组 + 补基础**：按主题拆成 10 个子文件夹；原 03-16 碎片化手册归入 `补充知识点/`，新建 `01-基础核心/` 12 篇成体系循序渐进教程（环境→所有权→借用→结构体→枚举→流程→泛型Trait→集合→错误→迭代器→模块测试），rust 目录共 71 篇 |

---

## 📊 目录状态

`技术文档/rust` 共 **71 篇**，分布于 10 个子文件夹：

- `00-学习指南`（2）+ `01-基础核心`（12，新）+ `02-进阶特性`（7）+ `03-实战生态`（13）+ `04-框架运行时`（6）+ `05-并行中间件内核`（6）+ `06-工程化可观测`（6）+ `07-前沿安全`（4）+ `08-动手项目`（1）+ `补充知识点`（14，原 03-16 专题手册）。

学习路径：**`00-学习指南` 规划 → `01-基础核心` 主线学完 → 按方向选 `02~07` 进阶 → `08-动手项目` 练手 → 细节回 `补充知识点` 查**。

至此与 `技术文档/` 下 typescript(20)/nest(13)/react(20)/nextjs(20)/vue(17)/java(30)/node(20)/go(20)/Three.js(22) 等目录共同构成完整技术求职复习体系。

祝学习愉快！🦀
