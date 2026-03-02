# Rust 错误处理知识手册

> 本文档系统总结 Rust 错误处理的核心概念、常用模式和最佳实践。

---

## 目录

1. [错误处理概览](#1-错误处理概览)
2. [不可恢复错误：panic!](#2-不可恢复错误panic)
3. [可恢复错误��Result](#3-可恢复错误result)
4. [Option 类型](#4-option-类型)
5. [unwrap 和 expect](#5-unwrap-和-expect)
6. [? 操作符与错误传播](#6--操作符与错误传播)
7. [自定义错误类型](#7-自定义错误类型)
8. [From trait 与错误转换](#8-from-trait-与错误转换)
9. [常用错误处理 crate](#9-常用错误处理-crate)
10. [最佳实践总结](#10-最佳实践总结)

---

## 1. 错误处理概览

Rust 将错误分为两大类：

| 类别 | 机制 | 适用场景 |
|------|------|---------|
| **不可恢复错误** | `panic!` | 程序遇到 bug、不一致状态，继续运行不安全 |
| **可恢复错误** | `Result<T, E>` | 预期内可能失败的操作（文件不存在、网络超时等） |

与 Java/Python 的异常机制不同，Rust **没有异常**。它通过类型系统强制开发者显式处理错误，在编译期就能发现未处理的错误情况。

---

## 2. 不可恢复错误：panic!

### 2.1 基本用法

```rust
fn main() {
    panic!("程序崩溃了！");
}
```

触发 panic 的两种方式：
- 显式调用 `panic!` 宏
- 运行时错误（如数组越界访问）

```rust
let v = vec![1, 2, 3];
v[99]; // 触发 panic: index out of bounds
```

### 2.2 Unwinding vs Aborting

当 panic 发生时，Rust 默认会 **栈展开（unwinding）**：沿调用栈逐层清理数据。如果希望直接终止程序（减小二进制体积），可以在 `Cargo.toml` 中配置：

```toml
[profile.release]
panic = 'abort'
```

### 2.3 Backtrace（回溯信息）

通过设置环境变量查看完整调用栈：

```bash
RUST_BACKTRACE=1 cargo run
```

注意：需要开启 debug 符号（`cargo build` 或 `cargo run` 默认开启，`--release` 模式下关闭）。

### 2.4 catch_unwind

`std::panic::catch_unwind` 可以捕获 panic，但**不应作为通用的 try/catch 机制**。

```rust
use std::panic;

let result = panic::catch_unwind(|| {
    println!("正常执行");
});
assert!(result.is_ok());

let result = panic::catch_unwind(|| {
    panic!("出错了！");
});
assert!(result.is_err());
```

适用场景：
- 服务器中隔离单个请求的崩溃，避免影响整体服务
- FFI 边界防止 panic 传播到非 Rust 代码

注意事项：
- 仅能捕获 unwinding panic，不能捕获 abort 模式的 panic
- 闭包需满足 `UnwindSafe` trait
- panic hook 仍会在捕获前触发

---

## 3. 可恢复错误：Result

### 3.1 Result 枚举定义

```rust
enum Result<T, E> {
    Ok(T),   // 操作成功，包含返回值
    Err(E),  // 操作失败，包含错误信息
}
```

### 3.2 使用 match 处理 Result

```rust
use std::fs::File;

fn main() {
    let file = File::open("hello.txt");

    let file = match file {
        Ok(f) => f,
        Err(error) => panic!("打开文件失败: {:?}", error),
    };
}
```

### 3.3 嵌套 match 处理不同错误类型

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let file = File::open("hello.txt");

    let file = match file {
        Ok(f) => f,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("创建文件失败: {:?}", e),
            },
            other_error => panic!("打开文件失败: {:?}", other_error),
        },
    };
}
```

### 3.4 使用闭包简化（unwrap_or_else）

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let file = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("创建文件失败: {:?}", error);
            })
        } else {
            panic!("打开文件失败: {:?}", error);
        }
    });
}
```

### 3.5 Result 的常用方法

```rust
let value: Result<i32, String> = Ok(42);

// map: 转换 Ok 中的值
let doubled = value.map(|v| v * 2); // Ok(84)

// and_then: 链式操作（flatmap）
let result = value.and_then(|v| {
    if v > 0 { Ok(v) } else { Err("必须为正数".to_string()) }
});

// unwrap_or: 提供默认值
let val = Err::<i32, &str>("error").unwrap_or(0); // 0

// unwrap_or_else: 通过闭包计算默认值
let val = Err::<i32, &str>("error").unwrap_or_else(|_| 0); // 0

// unwrap_or_default: 使用 Default trait 的默认值
let val: i32 = Err::<i32, &str>("error").unwrap_or_default(); // 0

// is_ok / is_err: 判断结果
assert!(Ok::<i32, &str>(42).is_ok());
assert!(Err::<i32, &str>("err").is_err());
```

---

## 4. Option 类型

`Option` 用于表示值可能存在也可能不存在的情况（类似其他语言的 null/nil）。

```rust
enum Option<T> {
    Some(T), // 有值
    None,    // 无值
}
```

### 常用操作

```rust
let some_value: Option<i32> = Some(42);
let no_value: Option<i32> = None;

// match 处理
match some_value {
    Some(v) => println!("值是: {}", v),
    None => println!("没有值"),
}

// if let 简化
if let Some(v) = some_value {
    println!("值是: {}", v);
}

// map
let doubled = some_value.map(|v| v * 2); // Some(84)

// and_then (flatmap)
let result = some_value.and_then(|v| {
    if v > 0 { Some(v) } else { None }
});

// unwrap_or
let val = no_value.unwrap_or(0); // 0

// Option 转 Result
let result: Result<i32, &str> = some_value.ok_or("值不存在");
```

---

## 5. unwrap 和 expect

### 5.1 unwrap

`unwrap()` 在值为 `Ok` / `Some` 时返回内部值，为 `Err` / `None` 时直接 panic。

```rust
let file = File::open("hello.txt").unwrap();
// 如果文件不存在，程序 panic 并打印默认错误信息
```

### 5.2 expect

`expect()` 与 `unwrap()` 类似，但允许自定义 panic 信息：

```rust
let file = File::open("hello.txt")
    .expect("无法打开 hello.txt 文件");
// panic 信息: "无法打开 hello.txt 文件: Os { ... }"
```

### 5.3 使用建议

| 方法 | 适用场景 |
|------|---------|
| `unwrap()` | 快速原型、示例代码、确信不会失败的情况 |
| `expect("msg")` | 生产代码中需要 panic 的地方（提供有意义的上下文信息） |

**在生产代码中，优先使用 `expect` 而非 `unwrap`**。`expect` 提供的自定义信息能帮助快速定位问题。

---

## 6. ? 操作符与错误传播

### 6.1 基本用法

`?` 操作符是 Rust 中传播错误的简洁方式。如果 `Result` 为 `Ok`，提取值继续执行；如果为 `Err`，立即从当前函数返回该错误。

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut file = File::open("hello.txt")?;  // 失败则提前返回 Err
    let mut username = String::new();
    file.read_to_string(&mut username)?;       // 失败则提前返回 Err
    Ok(username)
}
```

### 6.2 链式调用

```rust
fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("hello.txt")?.read_to_string(&mut username)?;
    Ok(username)
}
```

### 6.3 用于 Option

`?` 也可以用于 `Option` 类型——`None` 时提前返回 `None`：

```rust
fn first_char(text: &str) -> Option<char> {
    text.lines().next()?.chars().next()
}
```

### 6.4 在 main 函数中使用

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let file = File::open("hello.txt")?;
    Ok(())
}
```

### 6.5 自动类型转换

`?` 操作符会自动调用 `From` trait 进行错误类型转换。如果函数返回的错误类型实现了 `From<源错误类型>`，`?` 会自动完成转换。

---

## 7. 自定义错误类型

### 7.1 手动实现

自定义错误类型需要实现 `std::fmt::Display`、`std::fmt::Debug` 和 `std::error::Error` trait：

```rust
use std::fmt;
use std::error::Error;

#[derive(Debug)]
enum AppError {
    IoError(std::io::Error),
    ParseError(std::num::ParseIntError),
    NotFound(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "IO 错误: {}", e),
            AppError::ParseError(e) => write!(f, "解析错误: {}", e),
            AppError::NotFound(name) => write!(f, "未找到: {}", name),
        }
    }
}

impl Error for AppError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            AppError::IoError(e) => Some(e),
            AppError::ParseError(e) => Some(e),
            AppError::NotFound(_) => None,
        }
    }
}
```

### 7.2 实现 From trait 进行自动转换

```rust
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error)
    }
}

impl From<std::num::ParseIntError> for AppError {
    fn from(error: std::num::ParseIntError) -> Self {
        AppError::ParseError(error)
    }
}

// 现在可以在返回 Result<T, AppError> 的函数中直接用 ?
fn process_file(path: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(path)?;  // io::Error -> AppError
    let number: i32 = content.trim().parse()?;      // ParseIntError -> AppError
    Ok(number)
}
```

---

## 8. From trait 与错误转换

### 8.1 核心机制

`?` 操作符在传播错误时，会自动调用 `From::from()` 将错误从一种类型转换为另一种类型。这是 Rust 错误处理中类型安全的关键设计。

```
函数返回类型: Result<T, OuterError>
内部操作类型: Result<U, InnerError>

使用 ? 的前提: OuterError 实现了 From<InnerError>
```

### 8.2 转换流程

```rust
// 当执行 some_operation()? 时，等价于：
match some_operation() {
    Ok(value) => value,
    Err(e) => return Err(From::from(e)),
    //                   ^^^^^^^^^^^^^^ 自动类型转换
}
```

### 8.3 使用 map_err 手动转换

当不想实现 `From` trait，或者同一错误类型需要映射到不同变体时：

```rust
fn process() -> Result<(), AppError> {
    let file = File::open("config.txt")
        .map_err(|e| AppError::NotFound(format!("配置文件: {}", e)))?;
    Ok(())
}
```

### 8.4 Box<dyn Error> 快速方案

适合原型开发和简单程序，所有实现了 `Error` trait 的类型都可以转换为 `Box<dyn Error>`：

```rust
fn do_something() -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open("test.txt")?;       // io::Error 自动转换
    let num: i32 = "42abc".parse()?;           // ParseIntError 自动转换
    Ok(())
}
```

缺点：类型被擦除，调用者无法匹配具体的错误类型。

---

## 9. 常用错误处理 crate

### 9.1 thiserror — 结构化、可匹配的错误类型

`thiserror` 通过 derive 宏简化自定义错误类型的实现，**适合库代码**和需要调用者区分错误类型的场景。

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum DataError {
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("解析错误: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("数据验证失败: {field} - {message}")]
    Validation {
        field: String,
        message: String,
    },

    #[error("未找到记录 (id: {0})")]
    NotFound(u64),

    #[error(transparent)]  // 委托给内部错误的 Display
    Other(#[from] anyhow::Error),
}
```

功能说明：
- `#[error("...")]`：自动生成 `Display` 实现
- `#[from]`：自动生成 `From` 实现，同时设置 `source()`
- `#[source]`：仅设置 `source()`，不生成 `From`
- `#[error(transparent)]`：将 Display 和 source 都委托给内部错误

### 9.2 anyhow — 灵活的应用级错误处理

`anyhow` 提供了 `anyhow::Error` 类型（本质是 `Box<dyn Error>` 的封装），**适合应用程序代码**。

```rust
use anyhow::{Context, Result, bail, ensure};

// 使用 anyhow::Result 简化返回类型
fn read_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .context("读取配置文件失败")?;       // 添加上下文信息

    let config: Config = serde_json::from_str(&content)
        .with_context(|| format!("解析配置文件 {} 失败", path))?;

    // bail! 宏：快速返回错误
    if config.version < 2 {
        bail!("不支持的配置版本: {}", config.version);
    }

    // ensure! 宏：条件检查
    ensure!(!config.name.is_empty(), "配置名称不能为空");

    Ok(config)
}
```

核心 API：
- `anyhow::Result<T>` = `Result<T, anyhow::Error>`
- `.context("msg")`：给 `Result` / `Option` 添加上下文
- `.with_context(|| format!("..."))`：惰性构造上下文
- `bail!("msg")`：提前返回错误（等同于 `return Err(anyhow!("msg"))`）
- `ensure!(condition, "msg")`：条件不满足时返回错误
- `anyhow!("msg")`：创建 `anyhow::Error`

### 9.3 何时用哪个？

| 场景 | 推荐 | 原因 |
|------|------|------|
| 编写库代码 | `thiserror` | 调用者需要匹配具体错误类型 |
| 编写应用程序 | `anyhow` | 大多数错误只需上报，不需细分 |
| 调用者需要根据错误做不同处理 | `thiserror` | 提供结构化的错误枚举 |
| 调用者只关心"成功或失败" | `anyhow` | 简洁，附带上下文信息 |
| 混合项目 | 两者结合 | 内部库用 `thiserror`，应用入口用 `anyhow` |

### 9.4 更准确的选择原则

> **常见误解**："anyhow 用于应用，thiserror 用于库" — 这不是最准确的说法。
>
> **更好的思考方式**：看调用者的意图。
> - 调用者需要根据不同失败模式做不同处理？→ 使用错误枚举（`thiserror`）
> - 调用者只需要上报错误、不关心具体类型？→ 使用不透明错误（`anyhow`）

### 9.5 其他值得了解的 crate

| crate | 说明 |
|-------|------|
| `eyre` | `anyhow` 的替代品，支持自定义错误报告格式 |
| `color-eyre` | `eyre` 的扩展，提供彩色错误报告和 SpanTrace 支持 |
| `miette` | 面向诊断的错误报告，适合 CLI 工具和编译器 |
| `snafu` | 另一种定义错误类型的方式，强调上下文选择器模式 |

---

## 10. 最佳实践总结

### 何时 panic，何时返回 Result

| 场景 | 做法 |
|------|------|
| 程序进入不一致/不安全状态 | `panic!` |
| 违反了函数的契约/前置条件 | `panic!` |
| 示例代码、原型开发 | `unwrap()` / `expect()` 可接受 |
| 失败是预期内的情况（文件不存在、网络超时） | 返回 `Result` |
| 你比编译器更了解一定不会失败 | `unwrap()` 加注释说明 |

### 错误处理方法选择

| 方法 | 适用场景 |
|------|---------|
| `match` | 需要精细控制每种 Ok/Err 情况 |
| `if let` | 只关心其中一种情况 |
| `?` | 将错误传播给调用者 |
| `unwrap()` | 快速原型 / 示例代码 |
| `expect("说明")` | 确信不会失败但需要有意义的 panic 信息 |
| `unwrap_or(default)` | 提供默认值 |
| `unwrap_or_else(\|\| ...)` | 默认值需要计算 |
| `unwrap_or_default()` | 使用类型的 Default 实现 |
| `map_err(...)` | 转换错误类型 |
| `.context("...")` | 添加上下文（需要 `anyhow`） |

### 设计原则

1. **让错误有意义**：错误信息应包含足够的上下文，帮助定位和解决问题
2. **保留错误链**：使用 `#[source]` 或 `#[from]` 保留底层错误原因
3. **始终 derive Debug**：`{:?}` 格式对日志和调试必不可少
4. **不要过度设计错误变体**：如果 20 个变体的处理方式都一样，说明过度设计了
5. **不要在库 API 中暴露 anyhow**：调用者会失去匹配特定错误的能力
6. **优先用 `expect` 而非 `unwrap`**：提供错误上下文
7. **善用 `?` 操作符**：减少嵌套，保持代码清晰
8. **在系统边界验证输入**：用户输入、外部 API 是需要验证的地方

---

## 参考资料

- [The Rust Programming Language - Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- [Rust By Example - Error Handling](https://doc.rust-lang.org/rust-by-example/error.html)
- [Error Handling In Rust - A Deep Dive (Luca Palmieri)](https://lpalmieri.com/posts/error-handling-rust/)
- [Rust Error Handling Guide 2025 (Markaicode)](https://markaicode.com/rust-error-handling-2025-guide/)
- [thiserror crate](https://docs.rs/thiserror)
- [anyhow crate](https://docs.rs/anyhow)
- [Comprehensive Rust - Error Handling](https://google.github.io/comprehensive-rust/error-handling.html)
- [Effective Rust - Item 4: Prefer idiomatic Error types](https://effective-rust.com/errors.html)
