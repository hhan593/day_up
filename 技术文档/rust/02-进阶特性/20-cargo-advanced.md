# 20 · Cargo 与包管理进阶

> 官方来源：The Cargo Book（https://doc.rust-lang.org/cargo/，Rust Team）
> 说明：基于 Cargo 官方文档结构与标准用法整理；现有 `10-Rust模块系统与包管理手册.md` 已覆盖基础，本文补进阶（workspace/特性/发布/配置文件）。

Cargo 是 Rust 的构建系统与包管理器（类比 Java 的 Maven/Gradle、Node 的 npm、Go 的 go modules）。

## 一、Cargo.toml 进阶

```toml
[package]
name = "myapp"
version = "0.1.0"
edition = "2021"          # 2021 / 2024 edition

[dependencies]
serde = { version = "1.0", features = ["derive"] }   # 开启特性
tokio = { version = "1", features = ["full"] }
reqwest = "0.12"

[dependencies.clap]
version = "4"
optional = true          # 可选依赖（配合特性）

[features]
default = ["cli"]
cli = ["dep:clap"]        # 特性门控

[dev-dependencies]        # 仅测试用
tempfile = "3"

[build-dependencies]      # build.rs 用

[profile.release]
opt-level = 3
lto = true                # 链接时优化
codegen-units = 1
panic = "abort"           # 发布态用 abort 减小体积
```

- **edition**：2021（稳定）/ 2024（新特性，如 `gen` 关键字、更严格 lifetime）——影响语法。
- **features**：条件编译开关，实现"按需启用"，等价于 C++ 宏开关、Java 的 `@Profile`。

## 二、Workspace（多 crate 工作区）

```toml
# 根 Cargo.toml
[workspace]
members = ["crates/api", "crates/core", "crates/cli"]
resolver = "2"
```

- 多个 crate 共享 `Cargo.lock` 与 `target/`，统一版本解析。
- 适合大型项目分层（类比 Maven multi-module、Node 的 pnpm workspace、Go workspace）。

## 三、常用命令

```bash
cargo build --release        # 优化构建
cargo run --features cli     # 启用特性
cargo test                   # 测试
cargo clippy                 # lint（等价于 ESLint / Java SpotBugs）
cargo fmt                    # 格式化（rustfmt）
cargo doc --open             # 生成并打开文档
cargo bench                  # 基准测试（需 nightly + #[bench]）
cargo update                 # 更新依赖
cargo audit                  # 安全审计（第三方 cargo-audit）
```

## 四、发布到 crates.io

```bash
cargo login                  # 登录令牌
cargo publish                # 发布（自动 README/版本校验）
cargo yank "0.1.0"           # 撤回（不删，仅标记）
```

- `crates.io` = Rust 包注册中心（类比 npmjs / Maven Central）。
- 发布需 `LICENSE` 与唯一版本号，无中央审批。

## 五、构建产物与交叉编译

- `target/debug`、`target/release`；`target/<triple>/` 交叉编译（如 `x86_64-pc-windows-gnu`）。
- `#[cfg(target_os = "linux")]` 条件编译（平台相关代码）。

## 六、与系列对照

| Rust | 其他 |
|---|---|
| Cargo | Maven/Gradle（java）、npm/pnpm（node）、Go modules |
| crates.io | Maven Central / npmjs |
| edition | Java LTS / ECMAScript 版本 |
| features | Maven profile / Cargo flag |
| workspace | Maven multi-module / pnpm workspace |

> 延伸：`10-Rust模块系统与包管理手册.md`（基础）、`11-Rust测试与文档手册.md`、`技术文档/java/13-spring-boot.md`（起步依赖对比）。
