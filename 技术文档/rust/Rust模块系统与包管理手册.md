# Rust 模块系统与包管理手册

> 理解 Rust 的模块系统、包管理和项目结构是编写大型 Rust 程序的基础。本手册系统介绍 crate、module、use 等核心概念。

---

## 目录

1. [概念概览](#1-概念概览)
2. [包与项目](#2-包与项目)
3. [模块系统](#3-模块系统)
4. [路径与访问](#4-路径与访问)
5. [use 关键字](#5-use-关键字)
6. [项目结构最佳实践](#6-项目结构最佳实践)
7. [Cargo 高级用法](#7-cargo-高级用法)
8. [Workspace 工作空间](#8-workspace-工作空间)

---

## 1. 概念概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Rust 代码组织层次                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  工作空间 (Workspace)                                               │
│  └── 包含多个相互关联的包                                            │
│       │                                                             │
│       ├── 包 (Package)                                              │
│       │   ├── Cargo.toml（包配置）                                   │
│       │   └── 至少一个 Crate                                         │
│       │       │                                                     │
│       │       ├── 库 Crate (src/lib.rs)                             │
│       │       │   └── 模块 (Module)                                 │
│       │       │       ├── 声明 (mod)                                │
│       │       │       └── 公开 (pub)                                │
│       │       │                                                     │
│       │       └── 二进制 Crate (src/main.rs 或 src/bin/*.rs)        │
│       │           └── ...                                           │
│       │                                                             │
│       └── 另一个包 ...                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 关键术语

| 术语 | 英文 | 说明 |
|------|------|------|
| 包 | Package | Cargo 的管理单元，包含一个或多个 crate |
| 箱 | Crate | 编译单元，可以是库或二进制可执行文件 |
| 模块 | Module | 代码组织单元，控制作用域和访问权限 |
| 工作空间 | Workspace | 多个关联包的组合 |

---

## 2. 包与项目

### 2.1 创建项目

```bash
# 创建二进制项目（可执行程序）
cargo new my_app
cd my_app

# 创建库项目
cargo new my_lib --lib

# 创建在当前目录（已有项目）
cargo init

# 查看项目结构
tree my_app
# my_app/
# ├── Cargo.toml      # 包配置文件
# ├── .gitignore
# └── src/
#     └── main.rs     # 二进制入口
```

### 2.2 Cargo.toml 详解

```toml
[package]
name = "my_project"          # 包名
version = "0.1.0"            # 版本号（语义化版本）
edition = "2021"             # Rust 版本（2015/2018/2021/2024）
authors = ["Your Name <you@example.com>"]
description = "A great project"
license = "MIT OR Apache-2.0"
repository = "https://github.com/you/my_project"
keywords = ["rust", "demo"]
categories = ["command-line-utilities"]
rust-version = "1.70"        # 最低支持的 Rust 版本

[dependencies]
# 外部依赖
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }

# 开发依赖（仅测试和示例使用）
[dev-dependencies]
mockall = "0.12"

# 构建依赖
[build-dependencies]
cc = "1.0"

[[bin]]                      # 额外的二进制目标
name = "extra_tool"
path = "src/bin/tool.rs"

[lib]                        # 库配置
crate-type = ["cdylib", "staticlib"]  # 编译为动态/静态库
name = "my_lib"
path = "src/lib.rs"
```

### 2.3 多二进制项目

```
src/
├── main.rs           # 默认二进制
├── lib.rs            # 库代码
└── bin/              # 额外的二进制
    ├── server.rs     # cargo run --bin server
    ├── client.rs     # cargo run --bin client
    └── admin.rs      # cargo run --bin admin
```

---

## 3. 模块系统

### 3.1 模块声明方式

```rust
// ===== 方式 1：内联模块 =====
mod my_module {
    pub fn hello() {
        println!("Hello from my_module!");
    }
}

// ===== 方式 2：文件模块 =====
// 文件: src/utils.rs
// 声明: mod utils;

// ===== 方式 3：目录模块 =====
// 目录: src/network/
// 文件: src/network/mod.rs (Rust 2015/2018) 或 src/network.rs (Rust 2021+)
// 子模块: src/network/client.rs, src/network/server.rs
```

### 3.2 模块树示例

```
src/
├── main.rs
├── lib.rs
├── front_of_house.rs           # 模块文件
│
├── front_of_house/             # 模块目录（Rust 2021+）
│   ├── mod.rs                  # 或者直接用 front_of_house.rs
│   ├── hosting.rs              # hosting 子模块
│   └── serving.rs              # serving 子模块
│
└── back_of_house/
    ├── mod.rs
    └── cooking.rs
```

### 3.3 模块声明示例

```rust
// src/lib.rs

// 声明模块
pub mod front_of_house;
pub mod back_of_house;

// 重新导出（简化外部访问）
pub use front_of_house::hosting;
```

```rust
// src/front_of_house.rs (Rust 2021+)
pub mod hosting;
pub mod serving;
```

```rust
// src/front_of_house/hosting.rs
pub fn add_to_waitlist() {}
pub fn seat_at_table() {}
```

### 3.4 可见性控制

```rust
mod outer {
    // 默认私有
    fn private_function() {}

    // 公开
    pub fn public_function() {}

    // 公开，但在当前 crate 内可见
    pub(crate) fn crate_visible() {}

    // 公开，但在父模块可见
    pub(super) fn parent_visible() {}

    // 公开，但在指定路径可见（复杂，较少用）
    // pub(in path) fn path_visible() {}

    pub mod inner {
        pub fn function() {}

        // 公开，但类型内部字段私有
        pub struct MyStruct {
            pub public_field: i32,
            private_field: i32,
        }

        impl MyStruct {
            pub fn new() -> Self {
                Self {
                    public_field: 0,
                    private_field: 0,
                }
            }
        }

        // 公开枚举（所有变体自动公开）
        pub enum MyEnum {
            Variant1,
            Variant2,
        }
    }
}
```

---

## 4. 路径与访问

### 4.1 路径类型

```rust
// ===== 绝对路径 =====
// 从 crate 根开始
crate::front_of_house::hosting::add_to_waitlist();

// 2018 版前使用 :: 开头（现已弃用）

// ===== 相对路径 =====
// 从当前模块开始
front_of_house::hosting::add_to_waitlist();

// 从父模块开始
super::some_function();

// 从当前模块开始（self，通常可省略）
self::inner_module::function();
```

### 4.2 访问示例

```rust
// src/lib.rs

mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

fn serve_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::serve_order();  // 调用父模块的函数
    }

    fn cook_order() {}

    pub struct Breakfast {
        pub toast: String,
        seasonal_fruit: String,
    }

    impl Breakfast {
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();

    // 使用结构体（公开字段可访问）
    let mut meal = back_of_house::Breakfast::summer("Rye");
    meal.toast = String::from("Wheat");
    // meal.seasonal_fruit = String::from("blueberries"); // 编译错误！
}
```

---

## 5. use 关键字

### 5.1 基本用法

```rust
// 引入具体路径
use std::collections::HashMap;

// 引入多个项
use std::{fmt, io};
use std::io::{Write, Read};

// 引入所有公共项（谨慎使用）
use std::collections::*;

// 使用 as 重命名
use std::io::Result as IoResult;

// 引入枚举变体
use std::cmp::Ordering::{Less, Greater};
```

### 5.2 惯用模式

```rust
// ===== 引入父模块，保留上下文 =====
// 推荐：保持清晰的路径上下文
use std::collections;
let map = collections::HashMap::new();

// 不推荐（除非非常常用）
use std::collections::HashMap;
let map = HashMap::new();

// ===== 引入枚举变体 =====
use std::cmp::Ordering;
match value.cmp(&other) {
    Ordering::Less => println!("Less"),
    Ordering::Equal => println!("Equal"),
    Ordering::Greater => println!("Greater"),
}

// 或者引入变体
use std::cmp::Ordering::*;
match value.cmp(&other) {
    Less => println!("Less"),
    Equal => println!("Equal"),
    Greater => println!("Greater"),
}
```

### 5.3 pub use 重新导出

```rust
// src/lib.rs

// 内部结构
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

// 重新导出，简化外部 API
pub use crate::front_of_house::hosting;

// 外部用户可以：
// use my_crate::hosting;
// hosting::add_to_waitlist();
// 而不是：
// use my_crate::front_of_house::hosting;
```

### 5.4 use 与外部 crate

```rust
// Cargo.toml
// [dependencies]
// serde = { version = "1.0", features = ["derive"] }

// 使用外部 crate
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct MyData {
    name: String,
}
```

---

## 6. 项目结构最佳实践

### 6.1 小型项目结构

```
small_project/
├── Cargo.toml
└── src/
    ├── main.rs          # 二进制入口
    ├── lib.rs           # 库代码（测试更方便）
    └── utils.rs         # 辅助模块
```

### 6.2 中型项目结构

```
my_app/
├── Cargo.toml
├── build.rs             # 构建脚本
├── src/
│   ├── main.rs
│   ├── lib.rs           # 核心库
│   ├── cli.rs           # 命令行解析
│   ├── config.rs        # 配置处理
│   ├── error.rs         # 错误类型
│   ├── db/
│   │   ├── mod.rs
│   │   ├── connection.rs
│   │   └── models.rs
│   ├── api/
│   │   ├── mod.rs
│   │   ├── routes.rs
│   │   └── handlers.rs
│   └── utils/
│       ├── mod.rs
│       ├── validation.rs
│       └── formatting.rs
├── tests/               # 集成测试
│   └── integration_test.rs
├── benches/             # 基准测试
│   └── my_bench.rs
└── examples/            # 使用示例
    └── demo.rs
```

### 6.3 大型项目结构（使用 Workspace）

```
my_workspace/
├── Cargo.toml           # workspace 定义
├── crates/
│   ├── core/
│   │   ├── Cargo.toml
│   │   └── src/lib.rs
│   ├── cli/
│   │   ├── Cargo.toml
│   │   └── src/main.rs
│   ├── server/
│   │   ├── Cargo.toml
│   │   └── src/main.rs
│   └── common/
│       ├── Cargo.toml
│       └── src/lib.rs
└── docs/
    └── README.md
```

### 6.4 lib.rs 与 main.rs 的关系

```rust
// ===== src/lib.rs =====
// 核心库逻辑
pub mod config;
pub mod error;
pub mod database;

pub use config::Config;
pub use error::AppError;

pub fn run(config: Config) -> Result<(), AppError> {
    // 主逻辑
    Ok(())
}

// ===== src/main.rs =====
use my_app::{Config, run};

fn main() {
    let config = Config::from_args();
    if let Err(e) = run(config) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
```

**优势**：
- 集成测试可以使用库
- 库可以被其他项目使用
- 更好的代码组织

---

## 7. Cargo 高级用法

### 7.1 条件编译

```rust
// 根据特性启用代码
#[cfg(feature = "database")]
pub mod database;

// 根据平台
#[cfg(target_os = "windows")]
pub fn os_specific() {}

#[cfg(target_os = "linux")]
pub fn os_specific() {}

// 组合条件
#[cfg(all(feature = "async", not(feature = "sync")))]
pub mod async_impl;
```

```toml
# Cargo.toml
[features]
default = ["std"]
std = []
database = ["dep:sqlx", "dep:tokio"]
full = ["std", "database"]
```

### 7.2 构建脚本

```rust
// build.rs
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // 告诉 Cargo 在文件改变时重新运行
    println!("cargo:rerun-if-changed=build.rs");

    // 获取环境变量
    let out_dir = env::var("OUT_DIR").unwrap();

    // 生成代码
    let dest_path = Path::new(&out_dir).join("hello.rs");
    fs::write(
        dest_path,
        "pub fn message() -> &'static str { \"Hello\" }"
    ).unwrap();
}
```

### 7.3 Cargo 命令速查

```bash
# 构建
cargo build              # 调试构建
cargo build --release    # 发布构建（优化）
cargo build --target x86_64-unknown-linux-gnu  # 交叉编译

# 运行
cargo run                # 构建并运行
cargo run -- arg1 arg2   # 传递参数
cargo run --bin server   # 运行特定二进制

# 测试
cargo test               # 运行所有测试
cargo test --lib         # 只测试库
cargo test --test integration  # 运行集成测试
cargo test my_function   # 运行特定测试
cargo test -- --nocapture  # 显示 println! 输出

# 检查
cargo check              # 快速检查（不生成二进制）
cargo clippy             # 代码检查
cargo fmt                # 代码格式化
cargo doc                # 生成文档
cargo doc --open         # 生成并打开文档

# 依赖
cargo add serde          # 添加依赖
cargo add serde --features derive
cargo update             # 更新依赖
cargo tree               # 查看依赖树
cargo tree -d            # 查看重复依赖

# 其他
cargo clean              # 清理构建产物
cargo install ripgrep    # 安装工具
cargo publish            # 发布到 crates.io
cargo new --edition 2021 my_project
```

---

## 8. Workspace 工作空间

### 8.1 定义 Workspace

```toml
# 根目录 Cargo.toml
[workspace]
members = [
    "crates/core",
    "crates/cli",
    "crates/server",
    "crates/common",
]

# 可选：共享依赖版本
[workspace.dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
thiserror = "1"
```

### 8.2 成员 crate 示例

```toml
# crates/core/Cargo.toml
[package]
name = "my-core"
version = "0.1.0"
edition = "2021"

[dependencies]
# 使用 workspace 定义的版本
tokio = { workspace = true }
serde = { workspace = true }

# 依赖 workspace 内其他 crate
my-common = { path = "../common" }
```

### 8.3 Workspace 特性

```bash
# 构建整个 workspace
cargo build --workspace

# 构建特定成员
cargo build -p my-core

# 测试整个 workspace
cargo test --workspace

# 在特定成员中运行命令
cargo run -p my-cli -- arg1 arg2
```

### 8.4 Workspace 共享代码

```rust
// crates/common/src/lib.rs
// 定义所有 crate 共享的类型和工具

pub mod error;
pub mod types;
pub mod utils;
```

---

## 常见问题

### Q: 模块文件还是内联模块？

**A**:
- 代码少：内联模块
- 代码多：单独文件
- 子模块多：使用目录 + mod.rs

### Q: pub(crate) vs pub？

**A**:
- `pub`: 完全公开，库用户可见
- `pub(crate)`: 当前 crate 可见，对外隐藏

### Q: 如何解决模块循环依赖？

**A**:
1. 提取公共代码到新模块
2. 使用 trait 解耦
3. 重构代码结构

### Q: Rust 2021 模块变化？

**A**:
- 不再需要 `mod.rs`，可以直接用 `module_name.rs`
- 旧： `src/foo/mod.rs` + `src/foo/bar.rs`
- 新： `src/foo.rs` + `src/foo/bar.rs`

---

## 参考资料

- [The Rust Programming Language - 模块](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html)
- [Cargo 文档](https://doc.rust-lang.org/cargo/)
- [Rust Reference - Crates and Source Files](https://doc.rust-lang.org/reference/crates-and-source-files.html)
- [Rust 语言圣经 - 模块系统](https://course.rs/basic/crate-module/module.html)
