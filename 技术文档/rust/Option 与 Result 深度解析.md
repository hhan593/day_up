
---

## 1. 概述 (Overview)

在 Rust 编程语言中，`Option<T>` 和 `Result<T, E>` 是两个最基础且最重要的枚举类型。它们构成了 Rust **内存安全**和**错误处理机制**的基石。

与传统语言（如 Java, Python, C++）不同，Rust **没有 `null` 指针**，也**没有异常（Exceptions）**。

- 如果一个值可能不存在，必须使用 `Option`。
- 如果一个操作可能失败，必须使用 `Result`。

这种设计强迫开发者在**编译期**显式处理所有可能的情况，从而彻底消除了“空指针异常”和“未捕获异常”导致的运行时崩溃。

---

## 2. Option：处理“值的存在性”

### 2.1 定义

`Option<T>` 枚举表示一个值要么是某种类型 `T`，要么根本不存在。

```rust
enum Option<T> {
    Some(T), // 包含一个值为 T
    None,    // 不包含任何值
}
```

### 2.2 为什么需要它？

在其他语言中：

```java
// Java: 容易引发 NullPointerException
String name = null;
int len = name.length(); // 💥 运行时崩溃！
```

在 Rust 中：

```rust
// Rust: 编译期强制检查
let name: Option<String> = None;
// let len = name.length(); // ❌ 编译错误：Option<String> 没有 length 方法
```

你必须先解包（Unwrap）或匹配（Match）确认有值后，才能使用它。

### 2.3 常用操作模式

#### A. 模式匹配 (Pattern Matching)

最基础的处理方式，必须处理所有分支。

```rust
let some_number: Option<i32> = Some(5);

match some_number {
    Some(val) => println!("数字是: {}", val),
    None => println("没有数字"),
}
```

#### B. 组合子 (Combinators) - 推荐

函数式风格的链式调用，代码更简洁。

|方法|描述|示例|
|:--|:--|:--|
|`unwrap_or(default)`|有值取值，无值取默认|`opt.unwrap_or(0)`|
|`map(f)`|有值则转换，无值保持 None|`opt.map(|
|`and_then(f)`|有值则执行返回 Option 的函数|`opt.and_then(|
|`is_some()` / `is_none()`|布尔判断|`if opt.is_some() { ... }`|

---

## 3. Result<T, E>：处理“操作的成功与失败”

### 3.1 定义

`Result<T, E>` 枚举表示一个操作要么成功（包含值 `T`），要么失败（包含错误信息 `E`）。

```rust
enum Result<T, E> {
    Ok(T),  // 成功，包含数据 T
    Err(E), // 失败，包含错误 E
}
```

- `T`: 成功时的数据类型 (Type)。
- `E`: 错误时的数据类型 (Error)，通常实现 `std::error::Error` trait。

### 3.2 典型场景

- 文件操作 (`File::open`)
- 网络请求
- 字符串解析 (`"123".parse::<i32>()`)
- 数据库查询

### 3.3 常用操作模式

#### A. 传播错误 (`?` 运算符)

这是 Rust 最优雅的特性。如果结果是 `Ok`，取出值；如果是 `Err`，直接将该错误返回给上层调用者。

```rust
fn read_username_from_file() -> Result<String, io::Error> {
    // 如果 open 失败，直接返回 Err，不再执行后续代码
    let mut file = File::open("username.txt")?; 
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}
```

#### B. 组合子处理

与 `Option` 类似，但 `unwrap_or_else` 的闭包可以接收错误对象 `E` 作为参数。

```rust
let port = config.get("port")
    .parse::<u16>()
    .unwrap_or_else(|err| {
        eprintln!("解析端口失败: {}", err);
        8080 // 返回默认端口
    });
```

---

## 4. 核心对比：Option vs Result

|特性|Option|Result<T, E>|
|:--|:--|:--|
|**语义**|**有** (Some) 或 **无** (None)|**成功** (Ok) 或 **失败** (Err)|
|**错误信息**|无 (None 不携带原因)|有 (Err 携带具体的错误对象)|
|**主要用途**|可选字段、查找键值、边界检查|IO、网络、解析、业务逻辑校验|
|**转换**|`ok_or(err)` → Result|`ok()` → Option (丢弃错误)|
|**? 行为**|遇到 `None` 提前返回 `None`|遇到 `Err` 提前返回 `Err`|

---

## 5. 进阶：组合子链式编程 (Chaining)

Rust 的强大在于可以将多个操作串联起来，形成一条数据处理流水线。一旦中间某一步失败（None 或 Err），整个链条会自动短路，直接返回失败状态。

### 场景示例：配置加载

假设我们要从环境变量读取端口号，要求：

1. 变量必须存在。
2. 必须是数字。
3. 必须大于 1024。

```rust
use std::env;

fn get_valid_port() -> Result<u16, String> {
    env::var("PORT")                  // 1. 获取环境变量 -> Result<String, VarError>
        .map_err(|_| "PORT 变量未设置".to_string()) // 转换错误类型
        .and_then(|s| {               // 2. 如果成功，尝试解析
            s.parse::<u16>()
             .map_err(|_| "端口号不是有效的数字".to_string())
        })
        .and_then(|port| {            // 3. 如果解析成功，检查范围
            if port > 1024 {
                Ok(port)
            } else {
                Err("端口号必须大于 1024".to_string())
            }
        })
}

fn main() {
    match get_valid_port() {
        Ok(p) => println!("服务器启动在端口: {}", p),
        Err(e) => eprintln!("配置错误: {}", e),
    }
}
```

_如果不使用链式调用，上述逻辑需要嵌套 3 层 `match` 或 `if let`，代码可读性极差。_

---

## 6. 最佳实践与避坑指南

### ✅ 推荐做法

1. **优先使用组合子**：`map`, `and_then`, `ok_or` 能让代码更声明式、更简洁。
2. **使用 `?` 传播错误**：在返回 `Result` 或 `Option` 的函数中，尽量用 `?` 代替冗长的 `match`。
3. **自定义错误类型**：在大型项目中，定义自己的 `enum Error` 并实现 `std::error::Error`，而不是只用 `String`。
4. **区分“预期内”和“意外”**：
    - 预期内的缺失/失败（如查字典没查到）：用 `Option`/`Result` 正常处理。
    - 意外的、不可恢复的错误（如逻辑bug、内存耗尽）：可以用 `panic!` 或 `unwrap()` (仅限测试/原型代码)。

### ❌ 避免做法

1. **滥用 `unwrap()`**：在生产代码中直接使用 `.unwrap()` 会导致程序在遇到错误时直接崩溃（Panic）。
    
    ```rust
    // 坏代码
    let file = File::open("config.txt").unwrap(); 
    
    // 好代码
    let file = File::open("config.txt").expect("配置文件必须存在"); 
    // 或者
    let file = match File::open("config.txt") { ... };
    ```
    
2. **忽略错误**：不要将 `Result` 赋值给变量却不去使用它（Rust 编译器会警告 `unused_must_use`）。
3. **混用类型**：不要在同一个逻辑流中随意在 `Option` 和 `Result` 之间反复横跳，尽量保持一致性，必要时使用 `ok_or` 或 `ok` 进行明确转换。

---

## 7. 总结

- **Option** 解决了“空指针”问题，让“无值”成为一种显式的类型状态。
- **Result** 解决了“异常”问题，让错误成为返回值的一部分，强制调用者处理。
- 通过 **组合子 (Combinators)** 和 **`?` 运算符**，Rust 将繁琐的错误处理变成了流畅的数据流管道。

掌握这两个类型，是写出**健壮、安全、易维护**的 Rust 代码的关键第一步。