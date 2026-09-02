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

---

祝学习愉快！🦀
