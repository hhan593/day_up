# Rust 学习文档体系

> 本目录包含系统的 Rust 学习文档，从基础入门到高级特性，循序渐进。

---

## 📚 文档索引

### 🎯 学习指南

| 文档 | 说明 | 推荐顺序 |
|------|------|----------|
| [Rust 学习路线图与计划书](Rust学习路线图与计划书.md) | 完整的学习路径规划，从入门到精通 | **第 1 步** |

### 📖 核心概念手册

| 文档 | 说明 | 推荐顺序 |
|------|------|----------|
| [Rust 快速参考手册](Rust快速参考手册.md) | 语法速查、常用模式、Trait 速查 | 随时查阅 |
| [结构体语法.md](结构体语法.md) | 结构体定义、实例化、方法 | 基础阶段 |
| [枚举与模式匹配.md](枚举与模式匹配.md) | 枚举、Option、Result、match | 基础阶段 |
| [references-and-borrowing.md](./references-and-borrowing.md) | 引用与借用基础 | 核心概念阶段 |
| [Rust_String知识手册.md](Rust_String知识手册.md) | String 与 &str 深入讲解 | 核心概念阶段 |
| [Rust 泛型 Trait 与生命周期知识手册](Rust泛型Trait与生命周期知识手册.md) | 泛型、Trait、生命周期综合 | 核心概念阶段 |
| [Rust 错误处理知识手册](Rust错误处理知识手册.md) | Result、Option、panic、自定义错误 | 核心概念阶段 |

### 🚀 进阶主题手册

| 文档 | 说明 | 推荐顺序 |
|------|------|----------|
| [Rust 集合类型与迭代器手册](Rust集合类型与迭代器手册.md) | Vec、HashMap、迭代器等 | 进阶阶段 |
| [Rust 模块系统与包管理手册](Rust模块系统与包管理手册.md) | 模块、crate、workspace、Cargo | 进阶阶段 |
| [Rust 测试与文档手册](Rust测试与文档手册.md) | 单元测试、集成测试、文档编写 | 进阶阶段 |

---

## 🎓 学习路径

### Phase 1: 基础入门（1-2周）

1. 阅读 [Rust 学习路线图与计划书](Rust学习路线图与计划书.md) 了解整体规划
2. 完成 Rustlings 前 50% 练习
3. 学习基础文档：
   - [结构体语法.md](结构体语法.md)
   - [枚举与模式匹配.md](枚举与模式匹配.md)

### Phase 2: 核心概念（3-4周）

这是 Rust 最重要的部分，务必深入理解：

1. **所有权系统**
   - [references-and-borrowing.md](./references-and-borrowing.md)
   - [Rust_String知识手册.md](Rust_String知识手册.md)（所有权实践）

2. **类型系统三支柱**
   - [Rust 泛型 Trait 与生命周期知识手册](Rust泛型Trait与生命周期知识手册.md)

3. **错误处理**
   - [Rust 错误处理知识手册](Rust错误处理知识手册.md)

### Phase 3: 进阶特性（2-3周）

1. [Rust 集合类型与迭代器手册](Rust集合类型与迭代器手册.md)
2. [Rust 模块系统与包管理手册](Rust模块系统与包管理手册.md)
3. [Rust 测试与文档手册](Rust测试与文档手册.md)

### Phase 4: 实战项目（持续）

参考路线图中的项目建议，动手实践。

---

## 📋 快速查阅

### 按主题查找

| 主题 | 相关文档 |
|------|----------|
| **所有权/借用** | references-and-borrowing.md, Rust_String知识手册.md |
| **泛型/Trait** | Rust泛型Trait与生命周期知识手册.md |
| **生命周期** | Rust泛型Trait与生命周期知识手册.md |
| **错误处理** | Rust错误处理知识手册.md, 枚举与模式匹配.md |
| **集合类型** | Rust集合类型与迭代器手册.md |
| **项目组织** | Rust模块系统与包管理手册.md |
| **测试** | Rust测试与文档手册.md |

### 按难度分级

**初级** 🌱
- 结构体语法.md
- 枚举与模式匹配.md
- references-and-borrowing.md

**中级** 🌿
- Rust_String知识手册.md
- Rust错误处理知识手册.md
- Rust集合类型与迭代器手册.md

**高级** 🌳
- Rust泛型Trait与生命周期知识手册.md
- Rust模块系统与包管理手册.md
- Rust测试与文档手册.md

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

---

祝学习愉快！🦀
