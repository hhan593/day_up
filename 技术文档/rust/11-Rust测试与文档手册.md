# Rust 测试与文档手册

> 测试和文档是高质量 Rust 代码的重要组成部分。本手册介绍 Rust 的测试框架、文档规范和最佳实践。

---

## 目录

1. [测试概述](#1-测试概述)
2. [单元测试](#2-单元测试)
3. [集成测试](#3-集成测试)
4. [文档测试](#4-文档测试)
5. [测试技巧](#5-测试技巧)
6. [文档编写](#6-文档编写)
7. [持续集成](#7-持续集成)

---

## 1. 测试概述

### 1.1 测试类型

```
┌─────────────────────────────────────────────────────────────────┐
│                     Rust 测试分类                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  单元测试 (Unit Tests)                                          │
│  ├── 位置: src/ 文件内的 #[cfg(test)] 模块                       │
│  ├── 范围: 单个函数/模块                                         │
│  └── 目的: 验证具体实现                                          │
│                                                                 │
│  集成测试 (Integration Tests)                                   │
│  ├── 位置: tests/ 目录                                           │
│  ├── 范围: 多个模块组合                                          │
│  └── 目的: 验证组件协作                                          │
│                                                                 │
│  文档测试 (Doc Tests)                                           │
│  ├── 位置: 文档注释中的代码块                                     │
│  ├── 范围: 公共 API 示例                                         │
│  └── 目的: 验证文档正确性                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 测试项目结构

```
my_project/
├── Cargo.toml
├── src/
│   └── lib.rs          # 包含 #[cfg(test)] 模块
├── tests/              # 集成测试目录
│   ├── integration_test.rs
│   └── common/
│       └── mod.rs      # 测试辅助函数
├── benches/            # 基准测试 (需要 cargo-criterion)
│   └── my_bench.rs
└── examples/           # 使用示例
    └── demo.rs
```

---

## 2. 单元测试

### 2.1 基本测试

```rust
// src/lib.rs 或 src/some_module.rs

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*;  // 导入父模块的所有内容

    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    // 失败测试
    #[test]
    #[ignore]  // 暂时忽略此测试
    fn failing_test() {
        panic!("This test will fail");
    }
}
```

### 2.2 断言宏

```rust
#[cfg(test)]
mod tests {
    // 相等性断言
    assert_eq!(actual, expected);     // 相等
    assert_ne!(actual, not_expected); // 不相等

    // 布尔断言
    assert!(condition);
    assert!(!condition);

    // 带消息的断言
    assert_eq!(a, b, "Values don't match: {} vs {}", a, b);
    assert!(result, "Operation failed for input: {}", input);

    // 精确比较（浮点数不要用 assert_eq!）
    assert!((actual - expected).abs() < f64::EPSILON);

    // 自定义错误消息
    assert!(
        result.is_ok(),
        "Expected Ok, got Err: {:?}",
        result.err()
    );
}
```

### 2.3 测试 Result

```rust
pub fn might_fail(input: i32) -> Result<i32, String> {
    if input >= 0 {
        Ok(input * 2)
    } else {
        Err("Negative input not allowed".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 方式 1：使用 unwrap/expect（测试失败时会 panic）
    #[test]
    fn test_success_case() {
        let result = might_fail(5).unwrap();
        assert_eq!(result, 10);
    }

    // 方式 2：使用 ? 运算符（测试函数返回 Result）
    #[test]
    fn test_with_question_mark() -> Result<(), String> {
        let result = might_fail(5)?;
        assert_eq!(result, 10);
        Ok(())
    }

    // 方式 3：使用 assert!(result.is_ok())
    #[test]
    fn test_result_check() {
        assert!(might_fail(5).is_ok());
        assert!(might_fail(-1).is_err());
    }

    // 方式 4：使用 match
    #[test]
    fn test_with_match() {
        match might_fail(-1) {
            Ok(_) => panic!("Expected error"),
            Err(e) => assert_eq!(e, "Negative input not allowed"),
        }
    }
}
```

### 2.4 测试 Panic

```rust
pub fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("Cannot divide by zero!");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]  // 期望测试 panic
    fn test_divide_by_zero() {
        divide(10.0, 0.0);
    }

    #[test]
    #[should_panic(expected = "divide by zero")]  // 检查 panic 消息
    fn test_divide_by_zero_message() {
        divide(10.0, 0.0);
    }
}
```

### 2.5 使用第三方测试库

```toml
# Cargo.toml
[dev-dependencies]
pretty_assertions = "1.4"  # 更好的断言输出

# 或者使用断言框架
claim = "0.5"              # 更多断言宏
assert_approx_eq = "1.1"   # 浮点数比较
```

```rust
#[cfg(test)]
mod tests {
    use pretty_assertions::assert_eq;

    #[test]
    fn test_with_pretty_output() {
        let a = vec![1, 2, 3, 4, 5];
        let b = vec![1, 2, 3, 4, 6];
        assert_eq!(a, b);  // 美观的差异显示
    }
}
```

---

## 3. 集成测试

### 3.1 基本结构

```rust
// tests/integration_test.rs

// 集成测试像外部 crate 一样使用你的库
use my_project::add;

#[test]
fn test_add_from_outside() {
    assert_eq!(add(2, 2), 4);
}

// 每个 tests/ 目录下的文件是一个独立的 crate
```

### 3.2 共享测试代码

```rust
// tests/common/mod.rs
// 注意：这不是测试文件（没有 #[test]）

pub fn setup() {
    // 初始化代码
    println!("Setting up test environment...");
}

pub fn teardown() {
    // 清理代码
}

pub fn create_test_data() -> Vec<i32> {
    vec![1, 2, 3, 4, 5]
}
```

```rust
// tests/some_integration_test.rs

mod common;

use common::setup;
use my_project::process_data;

#[test]
fn test_process_data() {
    setup();
    let data = common::create_test_data();
    let result = process_data(&data);
    assert_eq!(result, expected);
}
```

### 3.3 子模块测试

```
tests/
├── integration_test.rs      # cargo test --test integration_test
├── api/
│   └── mod.rs               # cargo test --test api
└── database/
    └── mod.rs
```

---

## 4. 文档测试

### 4.1 基本文档测试

```rust
/// 加法函数
///
/// # Examples
///
/// ```
/// use my_project::add;
///
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// 除法函数
///
/// # Examples
///
/// ```
/// use my_project::divide;
///
/// let result = divide(10.0, 2.0);
/// assert_eq!(result, 5.0);
/// ```
pub fn divide(a: f64, b: f64) -> f64 {
    a / b
}
```

### 4.2 文档测试属性

```rust
/// 这个例子不应该运行（只是演示代码）
///
/// ```ignore
/// this_code_has_syntax_error(
/// ```

/// 这个例子会编译但不运行
///
/// ```no_run
/// loop {
///     println!("Hello, world");
/// }
/// ```

/// 这个例子应该编译失败
///
/// ```compile_fail
/// let x: String = 5;  // 类型不匹配
/// ```

/// 指定 edition
///
/// ```edition2018
/// use crate::foo::Bar;
/// ```

/// 隐藏代码（使用 #）
///
/// ```
/// # fn main() {
/// let x = 5;
/// println!("{}", x);
/// # }
/// ```
```

### 4.3 文档模块示例

```rust
//! # My Project
//!
//! 这是 crate 级别的文档。
//!
//! ## 快速开始
//!
//! ```
//! use my_project::Calculator;
//!
//! let calc = Calculator::new();
//! let result = calc.add(1, 2);
//! ```
//!
//! ## 特性
//!
//! - 特性 A
//! - 特性 B
//!
//! ## 模块说明
//!
//! | 模块 | 说明 |
//! |------|------|
//! | `core` | 核心功能 |
//! | `utils` | 工具函数 |

pub mod core;
pub mod utils;
```

---

## 5. 测试技巧

### 5.1 测试组织结构

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // 测试固件（fixture）
    fn setup() -> Database {
        let db = Database::new_in_memory();
        db.seed_test_data();
        db
    }

    mod user_tests {
        use super::*;

        #[test]
        fn test_create_user() {
            let db = setup();
            // ...
        }

        #[test]
        fn test_delete_user() {
            let db = setup();
            // ...
        }
    }

    mod product_tests {
        use super::*;

        #[test]
        fn test_create_product() {
            let db = setup();
            // ...
        }
    }
}
```

### 5.2 使用 lazy_static 共享状态

```toml
[dev-dependencies]
lazy_static = "1.4"
```

```rust
#[cfg(test)]
mod tests {
    use lazy_static::lazy_static;
    use std::sync::Mutex;

    lazy_static! {
        static ref TEST_DB: Mutex<TestDatabase> = Mutex::new(TestDatabase::new());
    }

    #[test]
    fn test_with_shared_db() {
        let mut db = TEST_DB.lock().unwrap();
        db.reset();
        // ...
    }
}
```

### 5.3 参数化测试

```rust
#[cfg(test)]
mod tests {
    // Rust 没有内置参数化测试，可以使用宏或循环

    #[test]
    fn test_multiple_cases() {
        let test_cases = vec![
            (1, 2, 3),
            (0, 0, 0),
            (-1, 1, 0),
            (100, 200, 300),
        ];

        for (a, b, expected) in test_cases {
            assert_eq!(add(a, b), expected,
                "Failed on input: add({}, {})", a, b);
        }
    }
}
```

### 5.4 使用 rstest 进行参数化测试

```toml
[dev-dependencies]
rstest = "0.18"
```

```rust
#[cfg(test)]
mod tests {
    use rstest::rstest;

    #[rstest]
    #[case(1, 2, 3)]
    #[case(0, 0, 0)]
    #[case(-1, 1, 0)]
    #[case(100, 200, 300)]
    fn test_add(#[case] a: i32, #[case] b: i32, #[case] expected: i32) {
        assert_eq!(add(a, b), expected);
    }

    // 矩阵测试
    #[rstest]
    #[case(1, 2)]
    #[case(3, 4)]
    fn test_with_matrix(
        #[case] x: i32,
        #[values(10, 20)] y: i32,
    ) {
        // 测试组合：(1,10), (1,20), (3,10), (3,20)
    }
}
```

### 5.5 Mock 测试

```toml
[dev-dependencies]
mockall = "0.12"
```

```rust
use mockall::automock;

#[automock]
pub trait Database {
    fn get_user(&self, id: u64) -> Option<User>;
    fn save_user(&mut self, user: &User) -> Result<(), Error>;
}

fn get_user_name(db: &dyn Database, id: u64) -> Option<String> {
    db.get_user(id).map(|u| u.name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_user_name() {
        let mut mock = MockDatabase::new();
        mock.expect_get_user()
            .with(mockall::predicate::eq(1))
            .times(1)
            .returning(|_| Some(User { name: "Alice".to_string() }));

        let name = get_user_name(&mock, 1);
        assert_eq!(name, Some("Alice".to_string()));
    }
}
```

---

## 6. 文档编写

### 6.1 文档注释规范

```rust
/// 简短的单行描述。
///
/// 更详细的描述，可以有多行。
/// 使用 Markdown 格式。
///
/// # Examples
///
/// ```
/// use my_crate::MyStruct;
///
/// let s = MyStruct::new("value");
/// ```
///
/// # Panics
///
/// 描述函数在什么情况下会 panic。
///
/// # Errors
///
/// 描述可能返回的错误类型和原因。
///
/// # Safety
///
/// 如果是 unsafe 函数，描述安全前提条件。
///
/// # See Also
///
/// - [`OtherStruct`](struct.OtherStruct.html)
/// - [相关 RFC](https://example.com)
pub fn documented_function() {}
```

### 6.2 模块文档

```rust
//! HTTP 客户端模块
//!
//! 提供异步 HTTP 请求功能。
//!
//! # 基本使用
//!
//! ```
//! use my_crate::http::Client;
//!
//! let client = Client::new();
//! let response = client.get("https://api.example.com").await?;
//! ```
//!
//! # 特性
//!
//! - 支持 HTTP/1.1 和 HTTP/2
//! - 自动连接池
//! - 请求/响应中间件

pub mod client;
pub mod request;
pub mod response;

// 重新导出主要类型
pub use client::Client;
pub use request::Request;
pub use response::Response;
```

### 6.3 结构体和枚举文档

```rust
/// 表示 HTTP 请求的配置。
///
/// 包含超时设置、重试策略等。
#[derive(Debug, Clone)]
pub struct Config {
    /// 连接超时时间（秒）
    pub connect_timeout: u64,

    /// 请求超时时间（秒）
    pub request_timeout: u64,

    /// 最大重试次数
    pub max_retries: u32,

    // 私有字段不需要文档
    internal_state: InternalState,
}

/// HTTP 方法类型
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Method {
    /// GET 请求
    Get,
    /// POST 请求
    Post,
    /// PUT 请求
    Put,
    /// DELETE 请求
    Delete,
}
```

### 6.4 文档链接

```rust
/// 跳转到 [`crate::module::Item`]
/// 或者 [`Item`](crate::module::Item)
///
/// 使用完整路径：[`std::vec::Vec`]
///
/// 链接到方法：[`MyStruct::method`]
/// 链接到字段：[`MyStruct::field`]
///
/// 外部链接：[Rust Book](https://doc.rust-lang.org/book/)
pub fn linking_example() {}
```

### 6.5 生成与发布文档

```bash
# 生成本地文档
cargo doc

# 生成并打开浏览器
cargo doc --open

# 包含私有项
cargo doc --document-private-items

# 为依赖也生成文档
cargo doc --no-deps

# 发布到 docs.rs（通过 crates.io 自动处理）
cargo publish
```

---

## 7. 持续集成

### 7.1 GitHub Actions 配置

```yaml
# .github/workflows/rust.yml
name: Rust

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

env:
  CARGO_TERM_COLOR: always

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Install Rust
      uses: dtolnay/rust-action@stable

    - name: Cache cargo
      uses: actions/cache@v3
      with:
        path: |
          ~/.cargo/registry
          ~/.cargo/git
          target
        key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

    - name: Check formatting
      run: cargo fmt -- --check

    - name: Run Clippy
      run: cargo clippy -- -D warnings

    - name: Build
      run: cargo build --verbose

    - name: Run tests
      run: cargo test --verbose

    - name: Generate documentation
      run: cargo doc --no-deps

  test-windows:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v3
    - uses: dtolnay/rust-action@stable
    - run: cargo test --verbose

  test-macos:
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v3
    - uses: dtolnay/rust-action@stable
    - run: cargo test --verbose
```

### 7.2 代码覆盖率

```yaml
# .github/workflows/coverage.yml
name: Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: dtolnay/rust-action@stable

    - name: Install tarpaulin
      run: cargo install cargo-tarpaulin

    - name: Generate coverage
      run: cargo tarpaulin --out Xml

    - name: Upload to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./cobertura.xml
```

### 7.3 pre-commit 配置

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: cargo-fmt
        name: cargo fmt
        entry: cargo fmt --
        language: system
        types: [rust]
        pass_filenames: false

      - id: cargo-clippy
        name: cargo clippy
        entry: cargo clippy -- -D warnings
        language: system
        types: [rust]
        pass_filenames: false

      - id: cargo-test
        name: cargo test
        entry: cargo test
        language: system
        types: [rust]
        pass_filenames: false
```

---

## 常用测试命令速查

```bash
# 运行所有测试
cargo test

# 运行特定测试
cargo test test_name
cargo test module_name::

# 只运行单元测试
cargo test --lib

# 只运行集成测试
cargo test --test integration_test_name

# 显示测试输出
cargo test -- --nocapture

# 只运行忽略的测试
cargo test -- --ignored

# 运行所有测试（包括忽略的）
cargo test -- --include-ignored

# 运行测试并显示耗时
cargo test -- --report-time

# 基准测试（需要 nightly 或 criterion）
cargo bench

# 代码覆盖率
cargo tarpaulin

# 文档测试
cargo test --doc
```

---

## 参考资料

- [The Rust Programming Language - Testing](https://doc.rust-lang.org/book/ch11-00-testing.html)
- [Rust By Example - Testing](https://doc.rust-lang.org/rust-by-example/testing.html)
- [Rust Doc Guidelines](https://doc.rust-lang.org/rustdoc/how-to-write-documentation.html)
- [API Guidelines](https://rust-lang.github.io/api-guidelines/)
