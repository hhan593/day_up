# 01 · 环境安装与 Hello World

> 体系定位：Rust 学习的第一站。本文让你在 10 分钟内跑通第一个程序，并建立对**工具链 / Cargo / 编译模型**的直觉。
> 速查对照：`00-学习指南/02-Rust快速参考手册.md`；深入原理：`41-rustc编译模型.md`。

---

## 1. 安装工具链

```bash
# 官方安装器（Unix / macOS / WSL）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows：从 https://rustup.rs 下载 rustup-init.exe 运行
```

安装后获得三个核心命令：

| 命令 | 作用 |
|------|------|
| `rustc` | 编译器（通常不直接用，交给 Cargo） |
| `cargo` | 构建系统 + 包管理器（= npm + webpack + 部分 yarn） |
| `rustup` | 工具链管理（升级 / 切换 nightly / 装组件） |

验证：

```bash
rustc --version   # 例：rustc 1.87.0 (xxxx 2026-06-01)
cargo --version
```

> 建议版本 ≥ 1.87（wgpu 30 等 crate 的最低要求，见 `57-wgpu-gpu-computing.md`）。

---

## 2. 第一个项目

```bash
cargo new hello && cd hello
```

生成结构：

```
hello/
├── Cargo.toml      # 清单：包名、版本、依赖
└── src/
    └── main.rs     # 入口
```

`src/main.rs`：

```rust
fn main() {
    println!("Hello, Rust!");
}
```

运行：

```bash
cargo run     # 自动编译 + 执行
```

`Cargo.toml` 关键字段：

```toml
[package]
name = "hello"
version = "0.1.0"
edition = "2021"   # 语言版本，2021 是当前主流；2024 已稳定

[dependencies]
# 加第三方库在这里，例如：
# serde = { version = "1", features = ["derive"] }
```

---

## 3. 编译模型直觉（重要）

Rust 是** ahead-of-time（AOT）编译**到机器码，无运行时虚拟机：

```bash
cargo build --release   # 优化编译，产物在 target/release/hello
```

- `cargo build`（debug）：编译快、运行慢、含调试符号。
- `cargo build --release`：编译慢、运行快（开启 LLVM 优化）。
- 默认**零运行时依赖**：编译出的二进制可直接拷贝到同架构机器运行，无需安装 Rust。

这与 Node/Python（解释执行）和 Java（JVM）都不同——也是 Rust 适合嵌入式、CLI、后端微服务的原因（见 `53-no-std-embedded.md`、`33-cli-clap-ratatui.md`）。

---

## 4. 第一个有类型的程序

```rust
fn main() {
    let x: i32 = 42;          // 显式标注类型（通常可省略，编译器推断）
    let y = add(x, 8);
    println!("x + 8 = {y}");  // {} 占位符，{y} 是命名占位（Rust 2021）
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

要点：
- `let` 绑定默认**不可变**（`x` 不能重新赋值），要用 `let mut x` 才可变。
- 命名占位 `{y}` 比 `{0}` 更可读，推荐。

---

## ✅ 验收清单

- [ ] `cargo new` / `cargo run` / `cargo build --release` 都能跑通
- [ ] 理解 `edition` 字段含义
- [ ] 能说清 Rust 编译产物与 Node/Python 的区别

→ 下一篇：[02-变量常量与标量类型](./02-变量常量与标量类型.md)
