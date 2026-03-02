

> 本文档系统总结 Rust 错误处理的核心概念、常用模式和最佳实践。
---

## 目录

1. [错误处理概览](#1-错误处理概览)
2. [不可恢复错误：panic!](#2-不可恢复错误panic)
3. [可恢复错误：Result](#3-可恢复错误result)
4. [Option 类型](#4-option-类型)
5. [unwrap 和 expect](#5-unwrap-和-expect)
6. [模式匹配与错误处理](#6-模式匹配与错误处理)
7. [? 操作符与错误传播](#7--操作符与错误传播)
8. [Error trait 深入](#8-error-trait-深入)
9. [自定义错误类型](#9-自定义错误类型)
10. [From trait 与错误转换](#10-from-trait-与错误转换)
11. [迭代器中的错误处理](#11-迭代器中的错误处理)
12. [所有权与 Result/Option](#12-所有权与-resultoption)
13. [async 异步代码中的错误处理](#13-async-异步代码中的错误处理)
14. [常用错误处理 crate](#14-常用错误处理-crate)
15. [实战模式与技巧](#15-实战模式与技巧)
16. [最佳实践总结](#16-最佳实践总结)

---

## 1. 错误处理概览

Rust 将错误分为两大类：

| 类别             | 机制           | 适用场景                                       |
| ---------------- | -------------- | ---------------------------------------------- |
| **不可恢复错误** | `panic!`       | 程序遇到 bug、不一致状态，继续运行不安全       |
| **可恢复错误**   | `Result<T, E>` | 预期内可能失败的操作（文件不存在、网络超时等） |

与 Java/Python 的异常机制不同，Rust **没有异常**。它通过类型系统强制开发者显式处理错误，在编译期就能发现未处理的错误情况。

### 与其他语言对比

| 特性 | Rust | Java/Python | Go |
|------|------|-------------|-----|
| 错误机制 | `Result<T, E>` 枚举 | try/catch 异常 | 多返回值 `(value, err)` |
| 编译期检查 | 必须处理 Result，否则编译警告 | 仅 checked exception 强制处理 | 不检查，可忽略 err |
| 零成本 | Result 是零成本抽象 | 异常有栈展开开销 | 零成本但容易遗漏 |
| 类型安全 | 错误类型在签名中明确 | 异常可从任意位置抛出 | 错误类型不在签名中 |

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

| 策略 | 特点 | 适用场景 |
|------|------|---------|
| `unwind`（默认） | 逐层清理栈帧，调用析构函数 | 通用场景，需要资源清理 |
| `abort` | 直接终止进程，不清理 | 嵌入式、减小二进制体积、不需要 catch_unwind |

### 2.3 Backtrace（回溯信息）

通过设置环境变量查看完整调用栈：

```bash
RUST_BACKTRACE=1 cargo run      # 简要回溯
RUST_BACKTRACE=full cargo run   # 完整回溯（包含所有帧）
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
- 测试框架中捕获被测代码的 panic

注意事项：

- 仅能捕获 unwinding panic，不能捕获 abort 模式的 panic
- 闭包需满足 `UnwindSafe` trait
- panic hook 仍会在捕获前触发

### 2.5 自定义 Panic Hook

使用 `std::panic::set_hook` 可以自定义 panic 发生时的行为（如日志记录、上报错误）：

```rust
use std::panic;

panic::set_hook(Box::new(|panic_info| {
    // panic_info 包含 panic 的位置和消息
    if let Some(location) = panic_info.location() {
        eprintln!(
            "Panic 发生在 {}:{}:{}",
            location.file(),
            location.line(),
            location.column()
        );
    }

    if let Some(msg) = panic_info.payload().downcast_ref::<&str>() {
        eprintln!("Panic 消息: {}", msg);
    }
}));

// 恢复默认 hook
let _ = panic::take_hook();
```

### 2.6 todo!、unimplemented!、unreachable!

这三个宏都会触发 panic，但语义不同：

```rust
fn feature_a() {
    todo!("稍后实现这个功能")        // 标记待实现的代码
}

fn feature_b() {
    unimplemented!("此平台不支持")   // 标记故意不实现的代码
}

fn check(x: i32) {
    match x {
        1 => println!("one"),
        2 => println!("two"),
        _ => unreachable!("x 只可能是 1 或 2") // 逻辑上不可达的分支
    }
}
```

| 宏 | 语义 | 使用场景 |
|----|------|---------|
| `todo!()` | "还没写完" | 开发中的占位符，提醒自己要回来完成 |
| `unimplemented!()` | "故意不实现" | 某个 trait 方法在特定类型上不适用 |
| `unreachable!()` | "不可能到达这里" | 逻辑上已被排除的分支 |

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

### 3.5 Result 方法全览

#### 查询状态

```rust
let ok: Result<i32, &str> = Ok(42);
let err: Result<i32, &str> = Err("error");

// is_ok / is_err: 判断结果
ok.is_ok();   // true
ok.is_err();  // false

// is_ok_and / is_err_and (Rust 1.70+): 判断并检查值
Ok(42).is_ok_and(|v| v > 40);       // true
Ok(42).is_ok_and(|v| v > 50);       // false
Err("e").is_err_and(|e: &&str| *e == "e");  // true
```

#### 提取值

```rust
let ok: Result<i32, &str> = Ok(42);
let err: Result<i32, &str> = Err("error");

// ok(): Result<T,E> → Option<T>，丢弃错误
ok.ok();         // Some(42)
err.ok();        // None

// err(): Result<T,E> → Option<E>，丢弃成功值
ok.err();        // None
err.err();       // Some("error")

// unwrap / expect（详见第 5 节）
ok.unwrap();              // 42
ok.expect("应该有值");     // 42
// err.unwrap();           // panic!
// err.expect("有值");     // panic!

// unwrap_or: 提供默认值（急切求值）
err.unwrap_or(0);         // 0

// unwrap_or_else: 闭包计算默认值（惰性求值）
err.unwrap_or_else(|e| e.len() as i32);  // 5

// unwrap_or_default: 使用 T::default()
err.unwrap_or_default();  // 0（i32 的默认值）

// unwrap_err: 提取 Err 中的值，Ok 时 panic
err.unwrap_err();         // "error"
```

#### 转换 Ok 值（保持 Err 不变）

```rust
let ok: Result<i32, &str> = Ok(42);
let err: Result<i32, &str> = Err("error");

// map: Ok(T) → Ok(U)
ok.map(|v| v * 2);           // Ok(84)
err.map(|v| v * 2);          // Err("error")，闭包不执行

// map_or: Ok 时映射，Err 时返回默认值（急切求值）
ok.map_or(0, |v| v * 2);     // 84
err.map_or(0, |v| v * 2);    // 0

// map_or_else: Ok 时映射，Err 时用闭包计算（惰性求值）
ok.map_or_else(|_| 0, |v| v * 2);    // 84
err.map_or_else(|e| e.len() as i32, |v| v * 2);  // 5
```

#### 转换 Err 值（保持 Ok 不变）

```rust
let ok: Result<i32, &str> = Ok(42);
let err: Result<i32, &str> = Err("error");

// map_err: Err(E) → Err(F)
ok.map_err(|e| format!("ERR: {}", e));    // Ok(42)
err.map_err(|e| format!("ERR: {}", e));   // Err("ERR: error")
```

#### 链式组合（布尔语义）

```rust
let ok: Result<i32, &str> = Ok(42);
let err: Result<i32, &str> = Err("error");

// and: 类似 && —— self 为 Ok 时返回 other，否则返回 self 的 Err
ok.and(Ok(100));                           // Ok(100)
ok.and(Err::<i32, &str>("other error"));   // Err("other error")
err.and(Ok(100));                          // Err("error")

// and_then: 链式操作（flatmap），闭包返回 Result
ok.and_then(|v| {
    if v > 0 { Ok(v * 2) } else { Err("必须为正数") }
}); // Ok(84)

// or: 类似 || —— self 为 Err 时返回 other，否则返回 self 的 Ok
ok.or(Ok(100));                   // Ok(42)，self 已是 Ok
err.or(Ok(100));                  // Ok(100)，使用备选值
err.or(Err("backup error"));     // Err("backup error")

// or_else: 惰性版 or，闭包计算备选值

```

**链式组合对照表**：

| 方法 | self = Ok(v) | self = Err(e) | 用途 |
|------|-------------|--------------|------|
| `and(other)` | 返回 `other` | 返回 `Err(e)` | "两个都要成功" |
| `and_then(f)` | 返回 `f(v)` | 返回 `Err(e)` | "成功后继续下一步" |
| `or(other)` | 返回 `Ok(v)` | 返回 `other` | "至少一个成功" |
| `or_else(f)` | 返回 `Ok(v)` | 返回 `f(e)` | "失败时尝试恢复" |

#### 审查/调试（inspect）

```rust
// inspect: 查看 Ok 值而不消耗（常用于日志/调试）
let result = Ok(42)
    .inspect(|v| println!("成功: {v}"))   // 打印 "成功: 42"
    .map(|v| v * 2);                      // Ok(84)

// inspect_err: 查看 Err 值而不消耗
let result: Result<i32, &str> = Err("fail")
    .inspect_err(|e| eprintln!("错误: {e}"));  // 打印 "错误: fail"
```

#### 转换与嵌套处理

```rust
// ==========================================
// 1. transpose: 内外类型翻转（把 Result 和 Option 的位置互换）
// 常见场景：读取文件内容（Result），但文件可能为空（Option）
// ==========================================

// 情况 A：闯关成功 (Ok)，且拿到了一件装备 (Some)
let x: Result<Option<i32>, &str> = Ok(Some(42));
// 翻转后：确实有个东西 (Some)，而且它是通过闯关拿到的 (Ok)
let y: Option<Result<i32, &str>> = x.transpose();  // 结果变成：Some(Ok(42))

// 情况 B：闯关成功 (Ok)，但是宝箱是空的 (None)
let x: Result<Option<i32>, &str> = Ok(None);
// 翻转后：既然宝箱是空的，那整体就当做“啥也没有” (None) 
// 💡 注意：这是 transpose 最核心的作用，直接把无用的 Ok(None) 过滤掉！
let y: Option<Result<i32, &str>> = x.transpose();  // 结果变成：None

// （补充）情况 C：闯关直接失败了 (Err)
// let x: Result<Option<i32>, &str> = Err("error");
// 翻转后：确实有个结果 (Some)，只不过这个结果是个报错 (Err)
// let y: Option<Result<i32, &str>> = x.transpose();  // 结果变成：Some(Err("error"))


// ==========================================
// 2. flatten: 降维打击（消除多余的嵌套，剥洋葱）
// 常见场景：你调用了一个返回 Result 的函数，这个函数内部又调了另一个返回 Result 的函数
// ==========================================

// 情况 A：外层闯关成功，内层也闯关成功，最终拿到 42
let x: Result<Result<i32, &str>, &str> = Ok(Ok(42));
// 拍扁：成功拿到 42
x.flatten(); // 结果：Ok(42)

// 情况 B：外层闯关成功了，但拆开一看，内层失败了
let x: Result<Result<i32, &str>, &str> = Ok(Err("inner"));
// 拍扁：整体算作失败，返回内层的死法
x.flatten(); // 结果：Err("inner")

// 情况 C：外层直接闯关失败，连内层长啥样都没看到
let x: Result<Result<i32, &str>, &str> = Err("outer");
// 拍扁：整体算作失败，返回外层的死法
x.flatten(); // 结果：Err("outer")
```

#### 引用操作

```rust
let ok: Result<String, String> = Ok("hello".to_string());

// as_ref: Result<T, E> → Result<&T, &E>（借用内部值）
let r: Result<&String, &String> = ok.as_ref();

// as_mut: Result<T, E> → Result<&mut T, &mut E>
let mut ok = Ok(42);
if let Ok(v) = ok.as_mut() {
    *v += 1; // 修改 Ok 内部的值
}
assert_eq!(ok, Ok(43));

// as_deref: Result<T, E> → Result<&T::Target, &E>（当 T: Deref 时）
let ok: Result<String, &str> = Ok("hello".to_string());
let r: Result<&str, &&str> = ok.as_deref(); // Ok("hello")
```

### 3.6 Result 类型别名

标准库中许多模块定义了 Result 类型别名，简化签名：

```rust
// std::io 中的定义
type Result<T> = std::result::Result<T, std::io::Error>;

// 使用时不需要指定错误类型
fn read_file() -> std::io::Result<String> {
    std::fs::read_to_string("file.txt")
}

// 自己的项目也可以这样做
mod my_module {
    pub type Result<T> = std::result::Result<T, super::MyError>;

    pub fn do_something() -> Result<i32> {
        Ok(42)
    }
}
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

### 4.1 基本操作

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
```

### 4.2 Option 方法全览

#### 查询与提取

```rust
let some: Option<i32> = Some(42);
let none: Option<i32> = None;

// 状态查询
some.is_some();                     // true
none.is_none();                     // true
some.is_some_and(|v| v > 40);      // true (Rust 1.70+)

// 提取值
some.unwrap();                      // 42
some.expect("应有值");               // 42
none.unwrap_or(0);                  // 0 设置默认值
none.unwrap_or_else(|| 100);        // 100 惰性默认值，只有为Err或者为None时
none.unwrap_or_default();           // 0 (i32::default())
```

#### 转换

```rust
// 我们先准备两个测试用的“盲盒”
let some: Option<i32> = Some(42); // 这是一个有货的盲盒，里面装着 42
let none: Option<i32> = None;     // 这是一个空盲盒，啥也没有

// ==========================================
// 1. map：原地加工（不改变盲盒的本质，只改变里面的东西）
// 核心逻辑：如果是 Some，把值拿出来执行闭包加工，然后【重新装回一个新的 Some 里】；如果是 None，原样返回 None。
// ==========================================
// 42 乘以 2 变成 84，重新装箱返回 Some(84)
some.map(|v| v * 2);               
// 空盒子里没东西可乘，直接退回空盒子 None
none.map(|v| v * 2);               


// ==========================================
// 2. map_or / map_or_else：拆盒拿走，并自带保底
// 核心逻辑：这次我们不仅要加工，还要【彻底扔掉 Option 外壳】，直接拿到里面的值。
// 参数 1 是保底值（或者生成保底值的闭包），参数 2 是加工逻辑。
// ==========================================
// 盒子有货，拿到 42，加工成 84 直接返回（注意：这里不再是 Some(84) 了，而是纯数字 84！）
some.map_or(0, |v| v * 2);   //能拿到的是里边的值       
// 盒子是空的，无法加工，只能使用我们提供的保底值 0
none.map_or(0, |v| v * 2);         


// ==========================================
// 3. and_then：流水线作业 (常说的 flatmap)
// 核心逻辑：如果盒子有货，把值拿出来交给闭包。
// ⚠️ 注意：与 map 不同，and_then 要求闭包【必须自己返回一个 Option】。这就避免了套娃。
// ==========================================
some.and_then(|v| {
    // 拿到 42，判断大于 0，返回一个新的 Some(42)。
    // 如果这里用 map，结果会变成可怕的 Some(Some(42))，而 and_then 结果依然是单层 Some(42)
    if v > 0 { Some(v) } else { None }
}); 


// ==========================================
// 4. filter：无情质检员
// 核心逻辑：看看盒子里的东西满不满足条件。满足就保留原来的盒子，不满足就直接把盒子没收，变成 None。
// ==========================================
// 42 不大于 50，质检不合格，没收！变成 None (注意闭包里传入的是引用，所以要解引用 *v)
some.filter(|v| *v > 50);          
// 42 大于 0，质检合格，原样保留 Some(42)
some.filter(|v| *v > 0);           


// ==========================================
// 5. or / or_else：找备胎
// 核心逻辑：处理 None 的情况。如果是空盒子，就换上我们准备的备用盲盒。
// ==========================================
// 本来是空盒子，强行塞给它一个备用的 Some(0)
none.or(Some(0));                  
// 同样是找备胎，or_else 支持传入闭包，只有在需要备胎时才去计算（惰性求值，更省性能），返回 Some(100)
none.or_else(|| Some(100));        
// 本来就是有货的 Some(42)，备胎根本用不上，原样保留 Some(42)
some.or(Some(0));                  


// ==========================================
// 6. zip：两个盲盒合体
// 核心逻辑：把两个 Option 打包成一个包含元组 (A, B) 的大 Option。
// 规则极其严苛：必须两个盲盒都有货，才能合体成功。只要有一个是空的，整体全军覆没。
// ==========================================
// 双方都有货，合体成功，变成 Some((1, "a"))
Some(1).zip(Some("a"));            
// 右边是个空盒子，合体失败，整体变成 None
Some(1).zip(None::<&str>);         


// ==========================================
// 7. flatten：暴力拍扁套娃 (降维打击)
// 核心逻辑：专门处理 Option<Option<T>> 这种“盒中盒”的情况，直接消除一层包装。
// ==========================================
// 盲盒里装着另一个盲盒（里面有 42），拍扁后变成单层 Some(42)
Some(Some(42)).flatten();          
// 盲盒里装了个空盲盒，拍扁后直接变成彻头彻尾的 None
Some(None::<i32>).flatten();       


// ==========================================
// 8. inspect：透明视窗 (Rust 1.76+ 新增特性)
// 核心逻辑：允许你在链式调用中间“偷看”一眼盒子里的东西，【但不拿走，也不改变它】。
// 常用于 debug 打印，看完后会把原有的 Option 丝毫不差地传给下一环。
// ==========================================
// 在终端打印出 42，但这一步的结果依然是完整的 Some(42)
some.inspect(|v| println!("{v}"));
```

#### Option ↔ Result 互转

```rust
let some: Option<i32> = Some(42);
let none: Option<i32> = None;

// Option → Result
some.ok_or("值不存在");              // Ok(42)
none.ok_or("值不存在");              // Err("值不存在")
none.ok_or_else(|| "计算错误信息".to_string()); // Err("计算错误信息")

// Result → Option
Ok::<i32, &str>(42).ok();           // Some(42)
Err::<i32, &str>("err").ok();       // None

// transpose: Option<Result<T, E>> ↔ Result<Option<T>, E>
let x: Option<Result<i32, &str>> = Some(Ok(42));
let y: Result<Option<i32>, &str> = x.transpose();  // Ok(Some(42))
```

#### 可变操作

```rust
// take: 取走值，原处留 None
let mut opt = Some(42);
let taken = opt.take();  // taken = Some(42), opt = None

// replace: 替换值
let mut opt = Some(42);
let old = opt.replace(100);  // old = Some(42), opt = Some(100)

// get_or_insert: 如果是 None，插入默认值并返回 &mut
let mut opt = None;
let v = opt.get_or_insert(42);  // *v = 42, opt = Some(42)

// get_or_insert_with: 惰性插入
let mut opt: Option<Vec<i32>> = None;
let v = opt.get_or_insert_with(Vec::new);
v.push(1);
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

| 方法              | 适用场景                           |
| --------------- | ------------------------------ |
| `unwrap()`      | 快速原型、示例代码、确信不会失败的情况            |
| `expect("msg")` | 生产代码中需要 panic 的地方（提供有意义的上下文信息） |

**在生产代码中，优先使用 `expect` 而非 `unwrap`**。`expect` 提供的自定义信息能帮助快速定位问题。

### 5.4 unwrap 家族完整对比

| 方法                    | Ok/Some 时 | Err/None 时   | 适用场景           |
| --------------------- | --------- | ------------ | -------------- |
| `unwrap()`            | 返回值       | panic（默认信息）  | 原型代码           |
| `expect("msg")`       | 返回值       | panic（自定义信息） | 确信不会失败         |
| `unwrap_or(default)`  | 返回值       | 返回 default   | 有合理默认值         |
| `unwrap_or_else(f)`   | 返回值       | 调用 f()       | 默认值需要计算        |
| `unwrap_or_default()` | 返回值       | T::default() | 类型有 Default 实现 |
| `unwrap_err()`        | panic     | 返回错误值        | 测试代码中断言错误      |

---

## 6. 模式匹配与错误处理

### 6.1 match

最基础的错误处理方式，适合需要精细控制每种情况的场景：

```rust
match some_result {
    Ok(value) => println!("成功: {}", value),
    Err(e) => eprintln!("失败: {}", e),
}
```

### 6.2 if let / while let

只关心一种情况时简化代码：

```rust
// if let: 只处理 Ok/Some
if let Ok(file) = File::open("config.txt") {
    // 使用 file
}

if let Some(first) = vec.first() {
    println!("第一个元素: {}", first);
}

// while let: 循环直到 None/Err
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {
    println!("弹出: {}", top);
}
```

### 6.3 let-else（Rust 1.65+）

`let-else` 在模式匹配失败时提前退出，是处理错误的利器：

```rust
fn process_input(input: &str) -> Result<i32, String> {
    // let-else: 匹配成功继续，失败则执行 else 块（必须发散：return/break/continue/panic）
    let Ok(number) = input.parse::<i32>() else {
        return Err(format!("无法解析: '{}'", input));
    };

    // 这里 number 已经是 i32 类型，可以直接使用
    Ok(number * 2)
}

// 与 Option 配合
fn get_first_word(text: &str) -> &str {
    let Some(pos) = text.find(' ') else {
        return text; // 没有空格，整个字符串就是第一个单词
    };
    &text[..pos]
}
```

**let-else vs if let 的选择**：

```rust
// if let: "如果成功，就做某事"（正常流程在缩进里）
if let Ok(value) = result {
    // 正常逻辑在这里，缩进了一层
    do_something(value);
}

// let-else: "必须成功，否则提前退出"（正常流程在外层，无缩进）
let Ok(value) = result else {
    return Err("失败了".into());
};
// 正常逻辑在这里，没有多余缩进
do_something(value);
```

### 6.4 matches! 宏

检查值是否匹配某个模式，返回 `bool`：

```rust
// 准备一个测试用的 Result（闯关成功，拿到了数字 42）
let result: Result<i32, &str> = Ok(42);

// ==========================================
// 1. matches! 基础用法：超级简化的 match 语句，只返回 true 或 false
// 核心逻辑：它是一个“双重门卫”。
// 第一关：看“外壳形状”对不对（是 Ok 还是 Err）。
// 第二关（可选）：看后面的附加条件（if 守卫）成不成立。
// 必须全部通关，才会返回 true！
// ==========================================

// 检查 result 是否是 Ok，并且里面的值 v 是否大于 0。
// 因为 result 的外壳确实是 Ok（第一关过），且提取出的 42 大于 0（第二关过），所以返回 true。
let is_positive_ok = matches!(result, Ok(v) if v > 0); // true

// 检查 result 是否是具体的错误 Err("not found")。
// 因为 result 的外壳是 Ok，连 Err 都不是，第一关直接阵亡，根本不看里面的内容，返回 false。
let is_specific_err = matches!(result, Err("not found")); // false


// ==========================================
// 2. 测试神兵：在 assert! 断言中的应用
// 痛点：用传统的 assert_eq! 比较时，要求 Result 两边的类型必须完全实现“可比较（PartialEq）”特征，有时非常繁琐。
// 解决：matches! 只做“模式匹配”，不管相等性，极其灵活。
// ==========================================

// 断言 result 就是 Ok(42)。如果不是，程序运行到这里就会 panic（崩溃报错）。
// 你甚至可以这样写范围匹配：assert!(matches!(result, Ok(1..=100))); 
assert!(matches!(result, Ok(42)));


// ==========================================
// 3. 迭代器的黄金搭档：在 filter 过滤中的应用
// 痛点：filter 方法需要传入一个必须返回 true/false 的闭包。如果用传统的 match 写，代码会极其臃肿。
// 解决：用 matches! 一句话搞定。
// ==========================================

// 准备一个混杂了成功和失败结果的数组
let results: Vec<Result<i32, &str>> = vec![Ok(1), Err("x"), Ok(3)];

// 需求：统计里面到底有几个成功的元素（Ok）。
// 解析闭包 `|r| matches!(r, Ok(_))`：
// `r` 代表数组里的每一个元素。
// `Ok(_)` 里的下划线 `_` 是通配符，意思是：“我根本不在乎 Ok 里面装的是 1 还是 3，只要它是个 Ok，就放行（返回 true）。”
let ok_count = results.iter().filter(|r| matches!(r, Ok(_))).count(); 
// 最终统计出有 2 个 Ok，ok_count 为 2
```

---

## 7. ? 操作符与错误传播

### 7.1 基本用法

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

### 7.2 ? 的展开等价形式

```rust
// 使用 ? 的代码：
let file = File::open("hello.txt")?;

// 等价于：
let file = match File::open("hello.txt") {
    Ok(f) => f,
    Err(e) => return Err(From::from(e)),
    //                   ^^^^^^^^^^^^^^ 自动调用 From trait 转换错误类型
};
```

### 7.3 链式调用

```rust
fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("hello.txt")?.read_to_string(&mut username)?;
    Ok(username)
}

// 更简洁的标准库方式
fn read_username_from_file_v2() -> Result<String, io::Error> {
    std::fs::read_to_string("hello.txt")
}
```

### 7.4 用于 Option

`?` 也可以用于 `Option` 类型——`None` 时提前返回 `None`：

```rust
fn first_char(text: &str) -> Option<char> {
    text.lines().next()?.chars().next()
}
```

> ⚠️ **注意**：`?` 用于 Result 和 Option 时不能混用。在返回 `Result` 的函数中不能对 `Option` 用 `?`（反之亦然），除非进行转换。

```rust
fn mixed() -> Result<i32, String> {
    let vec = vec![1, 2, 3];

    // ❌ 不能直接对 Option 用 ?（函数返回的是 Result）
    // let first = vec.first()?;

    // ✅ 方式一：用 ok_or 将 Option 转为 Result
    let first = vec.first().ok_or("列表为空")?;

    // ✅ 方式二：用 ok_or_else 惰性计算错误
    let first = vec.first().ok_or_else(|| "列表为空".to_string())?;

    Ok(*first)
}
```

### 7.5 在 main 函数中使用

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let file = File::open("hello.txt")?;
    Ok(())
}
// main 返回 Err 时，程序会打印 Debug 格式的错误信息并以非零退出码退出
```

### 7.6 自动类型转换

`?` 操作符会自动调用 `From` trait 进行错误类型转换。如果函数返回的错误类型实现了 `From<源错误类型>`，`?` 会自动完成转换。

```rust
// 函数返回 AppError，但内部操作产生 io::Error
// 只要 AppError 实现了 From<io::Error>，? 就会自动转换
fn process() -> Result<(), AppError> {
    let file = File::open("test.txt")?;  // io::Error → AppError（自动）
    Ok(())
}
```

---

## 8. Error trait 深入

### 8.1 Error trait 定义

```rust
pub trait Error: Display + Debug {
    // 返回导致此错误的底层原因（可选）
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        None
    }
}
```

**一个类型要成为"错误"，需要满足三个条件**：
1. 实现 `std::fmt::Debug`（通常 `#[derive(Debug)]`）
2. 实现 `std::fmt::Display`（人类可读的错误信息）
3. 实现 `std::error::Error`（错误链支持）

### 8.2 错误链 (Error Chain)

`source()` 方法形成了错误链，可以追溯到最底层的根因：

```rust
use std::error::Error;

fn print_error_chain(err: &dyn Error) {
    eprintln!("错误: {}", err);             // Display 格式
    let mut source = err.source();
    while let Some(cause) = source {
        eprintln!("  原因: {}", cause);
        source = cause.source();
    }
}

// 输出示例：
// 错误: 读取配置文件失败
//   原因: hello.txt: 文件不存在 (os error 2)
```

### 8.3 错误向下转型 (Downcast)

`dyn Error` 可以向下转型为具体的错误类型：

```rust
use std::error::Error;
use std::io;

fn handle_error(err: Box<dyn Error>) {
    // downcast_ref: 尝试获取具体类型的引用
    if let Some(io_err) = err.downcast_ref::<io::Error>() {
        match io_err.kind() {
            io::ErrorKind::NotFound => println!("文件未找到"),
            io::ErrorKind::PermissionDenied => println!("权限不足"),
            _ => println!("其他 IO 错误: {}", io_err),
        }
    } else if let Some(parse_err) = err.downcast_ref::<std::num::ParseIntError>() {
        println!("解析整数失败: {}", parse_err);
    } else {
        println!("未知错误: {}", err);
    }
}

fn handle_error_consume(err: Box<dyn Error>) {
    // downcast: 消耗 Box 并尝试转换（成功时返回 Box<具体类型>）
    match err.downcast::<io::Error>() {
        Ok(io_err) => println!("IO 错误: {}", io_err),
        Err(original) => println!("不是 IO 错误: {}", original),
    }
}

fn check_error_type(err: &dyn Error) {
    // is: 检查是否是某个具体类型
    if err.is::<io::Error>() {
        println!("这是一个 IO 错误");
    }
}
```

### 8.4 Display vs Debug

```rust
#[derive(Debug)]
struct MyError {
    code: u32,
    message: String,
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "错误 [{}]: {}", self.code, self.message) // 用户友好
    }
}

impl std::error::Error for MyError {}

let err = MyError { code: 404, message: "未找到".into() };
println!("{}", err);    // Display: 错误 [404]: 未找到
println!("{:?}", err);  // Debug:   MyError { code: 404, message: "未找到" }
```

- **Display**（`{}`）：给最终用户看的，应简洁清晰
- **Debug**（`{:?}`）：给开发者调试用的，包含内部结构信息

---

## 9. 自定义错误类型

### 9.1 手动实现

自定义错误类型需要实现 `std::fmt::Display`、`std::fmt::Debug` 和 `std::error::Error` trait：

```rust
use std::fmt;
use std::error::Error;

#[derive(Debug)]
enum AppError {
    IoError(std::io::Error),
    ParseError(std::num::ParseIntError),
    NotFound(String),
    ValidationError { field: String, message: String },
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "IO 错误: {}", e),
            AppError::ParseError(e) => write!(f, "解析错误: {}", e),
            AppError::NotFound(name) => write!(f, "未找到: {}", name),
            AppError::ValidationError { field, message } =>
                write!(f, "字段 '{}' 验证失败: {}", field, message),
        }
    }
}

impl Error for AppError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            AppError::IoError(e) => Some(e),
            AppError::ParseError(e) => Some(e),
            AppError::NotFound(_) => None,
            AppError::ValidationError { .. } => None,
        }
    }
}
```

### 9.2 实现 From trait 进行自动转换

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
    let content = std::fs::read_to_string(path)?;  // io::Error → AppError
    let number: i32 = content.trim().parse()?;      // ParseIntError → AppError
    Ok(number)
}
```

### 9.3 结构体错误类型

不一定要用枚举，也可以用结构体：

```rust
#[derive(Debug)]
struct ConfigError {
    key: String,
    reason: String,
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "配置错误 '{}': {}", self.key, self.reason)
    }
}

impl Error for ConfigError {}
```

### 9.4 新类型模式 (Newtype)

用新类型包装已有的错误，增加语义或上下文：

```rust
#[derive(Debug)]
struct DatabaseError(std::io::Error); // 内部包装一个具体错误

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "数据库操作失败: {}", self.0)
    }
}

impl Error for DatabaseError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        Some(&self.0) // 保留错误链
    }
}

impl From<std::io::Error> for DatabaseError {
    fn from(err: std::io::Error) -> Self {
        DatabaseError(err)
    }
}
```

---

## 10. From trait 与错误转换

### 10.1 核心机制

`?` 操作符在传播错误时，会自动调用 `From::from()` 将错误从一种类型转换为另一种类型。这是 Rust 错误处理中类型安全的关键设计。

```
函数返回类型: Result<T, OuterError>
内部操作类型: Result<U, InnerError>

使用 ? 的前提: OuterError 实现了 From<InnerError>
```

### 10.2 转换流程

```rust
// 当执行 some_operation()? 时，等价于：
match some_operation() {
    Ok(value) => value,
    Err(e) => return Err(From::from(e)),
    //                   ^^^^^^^^^^^^^^ 自动类型转换
}
```

### 10.3 使用 map_err 手动转换

当不想实现 `From` trait，或者同一错误类型需要映射到不同变体时：

```rust
fn process() -> Result<(), AppError> {
    // 同一个 io::Error，根据上下文映射到不同的错误变体
    let config = File::open("config.txt")
        .map_err(|e| AppError::NotFound(format!("配置文件: {}", e)))?;

    let data = File::open("data.txt")
        .map_err(|e| AppError::IoError(e))?;

    Ok(())
}
```

### 10.4 Box<dyn Error> 快速方案

适合原型开发和简单程序，所有实现了 `Error` trait 的类型都可以转换为 `Box<dyn Error>`：

```rust
fn do_something() -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open("test.txt")?;       // io::Error 自动转换
    let num: i32 = "42abc".parse()?;           // ParseIntError 自动转换
    Ok(())
}
```

优缺点：

| 优点 | 缺点 |
|------|------|
| 简洁，任何 Error 都能用 `?` | 类型被擦除，调用者无法 match 具体错误 |
| 适合 main 函数和原型 | 不适合库的公共 API |
| 无需定义自定义错误类型 | 性能有微小开销（堆分配） |

---

## 11. 迭代器中的错误处理

### 11.1 collect 收集 Result

`Result` 实现了 `FromIterator`，可以将 `Iterator<Item = Result<T, E>>` 收集为 `Result<Vec<T>, E>`：

```rust
let strings = vec!["42", "93", "18"];

// 全部成功 → Ok(Vec)
let numbers: Result<Vec<i32>, _> = strings
    .iter()
    .map(|s| s.parse::<i32>())
    .collect();
assert_eq!(numbers, Ok(vec![42, 93, 18]));

// 遇到第一个错误就停止 → Err
let strings = vec!["42", "abc", "18"];
let numbers: Result<Vec<i32>, _> = strings
    .iter()
    .map(|s| s.parse::<i32>())
    .collect();
assert!(numbers.is_err()); // "abc" 解析失败
```

### 11.2 忽略错误，只保留成功值

```rust
let strings = vec!["42", "abc", "18", "xyz"];

// filter_map + ok: 忽略所有错误
let numbers: Vec<i32> = strings
    .iter()
    .filter_map(|s| s.parse::<i32>().ok())
    .collect();
assert_eq!(numbers, vec![42, 18]);

// 用 flat_map（效果相同）
let numbers: Vec<i32> = strings
    .iter()
    .flat_map(|s| s.parse::<i32>())
    .collect();
assert_eq!(numbers, vec![42, 18]);
```

### 11.3 分离成功值和错误（partition）

```rust
let strings = vec!["42", "abc", "18", "xyz"];

let results: Vec<Result<i32, _>> = strings
    .iter()
    .map(|s| s.parse::<i32>())
    .collect();

// partition 分离 Ok 和 Err
let (oks, errs): (Vec<_>, Vec<_>) = results.into_iter().partition(Result::is_ok);

let oks: Vec<i32> = oks.into_iter().map(Result::unwrap).collect();
let errs: Vec<_> = errs.into_iter().map(Result::unwrap_err).collect();

println!("成功: {:?}", oks);   // [42, 18]
println!("失败: {:?}", errs);  // [ParseIntError, ParseIntError]
```

### 11.4 在 map 闭包中返回 Result

```rust
// 在闭包中不能用 ? 传播到外部函数
// 但可以在闭包内返回 Result，由 collect 统一收集

fn double_all(strings: &[&str]) -> Result<Vec<i32>, std::num::ParseIntError> {
    strings
        .iter()
        .map(|s| {
            let n = s.parse::<i32>()?;  // ? 返回闭包的 Result
            Ok(n * 2)
        })
        .collect() // collect 遇到第一个 Err 就停止并返回
}

assert_eq!(double_all(&["1", "2", "3"]), Ok(vec![2, 4, 6]));
assert!(double_all(&["1", "abc", "3"]).is_err());
```

### 11.5 sum/product 与 Result

```rust
let strings = vec!["1", "2", "3"];

// sum 也支持 Result
let total: Result<i32, _> = strings
    .iter()
    .map(|s| s.parse::<i32>())
    .sum();
assert_eq!(total, Ok(6));

// product 同理
let product: Result<i32, _> = strings
    .iter()
    .map(|s| s.parse::<i32>())
    .product();
assert_eq!(product, Ok(6));
```

### 11.6 收集所有错误（不短路）

```rust
fn validate_all(inputs: &[&str]) -> Result<Vec<i32>, Vec<String>> {
    let mut values = Vec::new();
    let mut errors = Vec::new();

    for input in inputs {
        match input.parse::<i32>() {
            Ok(v) => values.push(v),
            Err(e) => errors.push(format!("'{}': {}", input, e)),
        }
    }

    if errors.is_empty() {
        Ok(values)
    } else {
        Err(errors)
    }
}

let result = validate_all(&["1", "abc", "3", "xyz"]);
// Err(["'abc': invalid digit found in string", "'xyz': invalid digit found in string"])
```

---

## 12. 所有权与 Result/Option

### 12.1 Copy trait 与 Result

`Result<T, E>` 在 `T` 和 `E` 都实现 `Copy` 时才实现 `Copy`：

```rust
// ✅ Result<i32, &str> 实现 Copy（i32: Copy, &str: Copy）
let r: Result<i32, &str> = Ok(42);
let r2 = r;  // Copy，r 仍然有效
println!("{:?}", r); // ✅ 可以继续使用

// ❌ Result<i32, String> 不实现 Copy（String: !Copy）
let r: Result<i32, String> = Ok(42);
let r2 = r;  // Move，r 被移走
// println!("{:?}", r); // ❌ 编译错误：value used after move
```

### 12.2 消耗性方法 vs 借用性方法

| 方法 | 签名中的 self | 是否消耗 | 说明 |
|------|-------------|---------|------|
| `map()` | `self` | 是 | 消耗 Result |
| `and_then()` | `self` | 是 | 消耗 Result |
| `unwrap()` | `self` | 是 | 消耗 Result |
| `unwrap_or()` | `self` | 是 | 消耗 Result |
| `is_ok()` | `&self` | 否 | 只借用 |
| `is_err()` | `&self` | 否 | 只借用 |
| `as_ref()` | `&self` | 否 | 返回 `Result<&T, &E>` |
| `as_mut()` | `&mut self` | 否 | 返回 `Result<&mut T, &mut E>` |
| `iter()` | `&self` | 否 | 返回 0 或 1 个元素的迭代器 |
| `inspect()` | `self` | 是 | 查看后转移所有权 |

### 12.3 as_ref() 避免所有权问题

```rust
let value: Result<String, String> = Ok("hello".to_string());

// ❌ map 消耗了 value
// let mapped = value.map(|s| s.len());
// println!("{:?}", value);  // 编译错误

// ✅ as_ref 借用后操作
let len = value.as_ref().map(|s| s.len());  // value 不被消耗
println!("{:?}", value);  // ✅ 仍可使用
println!("长度: {:?}", len);

// ✅ clone 也可以，但有运行时成本
let mapped = value.clone().map(|s| s.len());
```

### 12.4 引用上的 Result

```rust
// 函数接受 &Result 时，需要 as_ref 解包
fn check(result: &Result<String, String>) {
    // result 是 &Result，不能直接 result.map(...)（map 需要所有权）

    // 方式一：match 引用
    match result {
        Ok(val) => println!("成功: {}", val),
        Err(e) => println!("失败: {}", e),
    }

    // 方式二：as_ref 转为 Result<&T, &E>
    let len = result.as_ref().map(|s| s.len());
    println!("长度: {:?}", len);
}
```

---

## 13. async 异步代码中的错误处理

### 13.1 async 函数中的 ?

`?` 在 async 函数中的工作方式与同步函数完全一致：

```rust
use tokio::fs;

async fn read_config() -> Result<String, std::io::Error> {
    let content = fs::read_to_string("config.toml").await?;
    Ok(content)
}

async fn process() -> Result<(), Box<dyn std::error::Error>> {
    let config = read_config().await?;
    let value: i32 = config.trim().parse()?;
    println!("配置值: {}", value);
    Ok(())
}
```

### 13.2 多个异步操作的错误处理

```rust
use tokio::try_join;

async fn fetch_user() -> Result<String, Box<dyn std::error::Error>> {
    Ok("Alice".into())
}

async fn fetch_config() -> Result<String, Box<dyn std::error::Error>> {
    Ok("v2".into())
}

async fn fetch_all() -> Result<(String, String), Box<dyn std::error::Error>> {
    // try_join!: 并发执行，任一失败则立即返回 Err
    let (user, config) = try_join!(
        fetch_user(),
        fetch_config(),
    )?;
    Ok((user, config))
}

// 使用 join! 后分别处理（不短路，等待全部完成）
async fn fetch_all_separate() {
    let (user_result, config_result) = tokio::join!(
        fetch_user(),
        fetch_config(),
    );
    // 分别处理各自的 Result
    if let Ok(user) = user_result {
        println!("用户: {}", user);
    }
}
```

### 13.3 async 中的 anyhow

```rust
use anyhow::{Context, Result};

async fn load_data(url: &str) -> Result<String> {
    let response = reqwest::get(url)
        .await
        .with_context(|| format!("请求 {} 失败", url))?;

    let body = response.text()
        .await
        .context("读取响应体失败")?;

    Ok(body)
}
```

---

## 14. 常用错误处理 crate

### 14.1 thiserror — 结构化、可匹配的错误类型

`thiserror` 通过 derive 宏简化自定义错误类型的实现，**适合库代码**和需要调用者区分错误类型的场景。

```rust
use thiserror::Error;

#[derive(Error, Debug)]
enum DataError {
    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),                // #[from] 自动生成 From 实现

    #[error("解析错误: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("数据验证失败: {field} - {message}")]
    Validation {                                // 命名字段，在 #[error] 中直接引用
        field: String,
        message: String,
    },

    #[error("未找到记录 (id: {0})")]
    NotFound(u64),                              // 元组变体

    #[error(transparent)]                       // 委托给内部错误的 Display 和 source
    Other(#[from] anyhow::Error),
}
```

功能说明：

- `#[error("...")]`：自动生成 `Display` 实现
- `#[from]`：自动生成 `From` 实现，同时设置 `source()`
- `#[source]`：仅设置 `source()`，不生成 `From`
- `#[error(transparent)]`：将 Display 和 source 都委托给内部错误
- 支持 `{0}`、`{field}` 等格式化引用错误中的数据

**thiserror 为你省去了什么**：

```rust
// 不用 thiserror 需要手写 ~30 行（Display + Error + From）
// 用 thiserror 只需 ~5 行，自动生成：
// 1. impl Display for DataError       ← 来自 #[error("...")]
// 2. impl Error for DataError         ← 来自 #[derive(Error)]
// 3. fn source()                      ← 来自 #[from] 或 #[source]
// 4. impl From<io::Error> for DataError ← 来自 #[from]
```

### 14.2 anyhow — 灵活的应用级错误处理

`anyhow` 提供了 `anyhow::Error` 类型（本质是 `Box<dyn Error>` 的封装），**适合应用程序代码**。

```rust
use anyhow::{Context, Result, bail, ensure, anyhow};

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

| API | 说明 | 示例 |
|-----|------|------|
| `anyhow::Result<T>` | `Result<T, anyhow::Error>` 的别名 | `fn foo() -> Result<i32>` |
| `.context("msg")` | 给 Result/Option 添加上下文 | `file.open().context("打开失败")?` |
| `.with_context(\|\| ...)` | 惰性构造上下文 | `.with_context(\|\| format!("..."))` |
| `bail!("msg")` | 立即返回错误 | `bail!("无效输入")` |
| `ensure!(cond, "msg")` | 条件不满足时返回错误 | `ensure!(x > 0, "必须为正")` |
| `anyhow!("msg")` | 创建 `anyhow::Error` | `Err(anyhow!("错误"))` |

**anyhow 的错误链**：

```rust
// context 会形成错误链
let result = std::fs::read_to_string("config.txt")
    .context("读取配置")
    .context("初始化应用");

// 打印时显示完整错误链：
// Error: 初始化应用
//
// Caused by:
//     0: 读取配置
//     1: No such file or directory (os error 2)
```

**anyhow 中的 downcast**：

```rust
use anyhow::Error;

fn handle(err: Error) {
    // 可以向下转型到具体错误类型
    if let Some(io_err) = err.downcast_ref::<std::io::Error>() {
        println!("IO 错误: {}", io_err);
    }

    // 遍历错误链
    for cause in err.chain() {
        println!("原因: {}", cause);
    }
}
```

### 14.3 何时用哪个？

| 场景                         | 推荐        | 原因                                      |
| ---------------------------- | ----------- | ----------------------------------------- |
| 编写库代码                   | `thiserror` | 调用者需要匹配具体错误类型                |
| 编写应用程序                 | `anyhow`    | 大多数错误只需上报，不需细分              |
| 调用者需要根据错误做不同处理 | `thiserror` | 提供结构化的错误枚举                      |
| 调用者只关心"成功或失败"     | `anyhow`    | 简洁，附带上下文信息                      |
| 混合项目                     | 两者结合    | 内部库用 `thiserror`，应用入口用 `anyhow` |

### 14.4 更准确的选择原则

> **常见误解**："anyhow 用于应用，thiserror 用于库" — 这不是最准确的说法。
>
> **更好的思考方式**：看调用者的意图。
>
> - 调用者需要根据不同失败模式做不同处理？→ 使用错误枚举（`thiserror`）
> - 调用者只需要上报错误、不关心具体类型？→ 使用不透明错误（`anyhow`）

### 14.5 其他值得了解的 crate

| crate        | 说明                                             | 适用场景 |
| ------------ | ------------------------------------------------ | -------- |
| `eyre`       | `anyhow` 的替代品，支持自定义错误报告格式        | 需要定制错误展示 |
| `color-eyre` | `eyre` 的扩展，提供彩色错误报告和 SpanTrace 支持 | CLI 工具开发 |
| `miette`     | 面向诊断的错误报告，支持源码位置标注             | 编译器、linter |
| `snafu`      | 另一种定义错误类型的方式，强调上下文选择器模式   | 喜欢上下文模式 |
| `displaydoc` | 通过文档注释生成 Display 实现                    | 与 thiserror 类似 |

---

## 15. 实战模式与技巧

### 15.1 早返回模式 (Early Return)

```rust
fn validate_user(name: &str, age: i32) -> Result<(), String> {
    if name.is_empty() {
        return Err("名称不能为空".into());
    }
    if name.len() > 50 {
        return Err("名称太长".into());
    }
    if age < 0 || age > 150 {
        return Err("年龄范围无效".into());
    }
    Ok(())
}
```

### 15.2 Builder 模式中的错误处理

```rust
struct ServerConfig {
    host: String,
    port: u16,
}

struct ServerBuilder {
    host: Option<String>,
    port: Option<u16>,
}

impl ServerBuilder {
    fn new() -> Self {
        Self { host: None, port: None }
    }

    fn host(mut self, host: &str) -> Self {
        self.host = Some(host.to_string());
        self
    }

    fn port(mut self, port: u16) -> Self {
        self.port = Some(port);
        self
    }

    fn build(self) -> Result<ServerConfig, String> {
        let host = self.host.ok_or("host 未设置")?;
        let port = self.port.ok_or("port 未设置")?;
        Ok(ServerConfig { host, port })
    }
}

// 使用
fn start() -> Result<(), String> {
    let config = ServerBuilder::new()
        .host("localhost")
        .port(8080)
        .build()?;
    println!("服务器: {}:{}", config.host, config.port);
    Ok(())
}
```

### 15.3 组合多个 Result

```rust
// 所有操作都必须成功
fn initialize() -> Result<(), Box<dyn std::error::Error>> {
    let config = load_config()?;
    let db = connect_database(&config)?;
    let cache = init_cache(&config)?;
    Ok(())
}

// 尝试多个备选方案（or_else 链）
fn find_config() -> Result<String, String> {
    load_from_env()
        .or_else(|_| load_from_file("config.toml"))
        .or_else(|_| load_from_file("/etc/app/config.toml"))
        .or_else(|_| Ok("default_config".to_string())) // 最终回退到默认配置
}
```

### 15.4 用 map_err 添加上下文（无 anyhow 时）

```rust
fn read_user_age(path: &str) -> Result<i32, String> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| format!("读取文件 '{}' 失败: {}", path, e))?;

    let age: i32 = content.trim().parse()
        .map_err(|e| format!("解析年龄失败 (内容: '{}'): {}", content.trim(), e))?;

    if age < 0 {
        return Err(format!("年龄不能为负数: {}", age));
    }

    Ok(age)
}
```

### 15.5 类型状态模式（编译期防止错误）

```rust
use std::marker::PhantomData;

// 用类型系统在编译期防止错误，而非运行时检查
struct Unvalidated;
struct Validated;

struct Email<State = Unvalidated> {
    address: String,
    _state: PhantomData<State>,
}

impl Email<Unvalidated> {
    fn new(address: String) -> Self {
        Email { address, _state: PhantomData }
    }

    fn validate(self) -> Result<Email<Validated>, String> {
        if self.address.contains('@') {
            Ok(Email { address: self.address, _state: PhantomData })
        } else {
            Err(format!("无效邮箱: {}", self.address))
        }
    }
}

impl Email<Validated> {
    fn send(&self) {
        println!("发送邮件到: {}", self.address);
    }
}

// let raw = Email::new("foo".into());
// raw.send();                       // ❌ 编译错误！未验证的邮箱没有 send 方法
// Email::new("a@b.c".into()).validate()?.send(); // ✅ 验证后才能发送
```

### 15.6 错误日志记录模式

```rust
// inspect_err: 记录日志但不消耗错误
fn process() -> Result<(), Box<dyn std::error::Error>> {
    std::fs::read_to_string("data.txt")
        .inspect_err(|e| eprintln!("警告: 读取失败: {e}"))
        ?;
    Ok(())
}

// 或者用 map_err（inspect_err 不稳定时的替代方案）
fn process_v2() -> Result<(), Box<dyn std::error::Error>> {
    std::fs::read_to_string("data.txt")
        .map_err(|e| {
            eprintln!("警告: 读取失败: {e}");
            e // 原样返回错误
        })?;
    Ok(())
}
```

### 15.7 #[must_use] 与 Result

`Result` 默认标记了 `#[must_use]`，不处理会触发编译器警告：

```rust
fn might_fail() -> Result<(), String> {
    Ok(())
}

fn caller() {
    might_fail(); // ⚠️ 编译器警告: unused `Result` that must be used

    // 如果故意忽略，显式标注
    let _ = might_fail(); // ✅ 无警告，表示"我知道可能失败，但我选择忽略"
}
```

---

## 16. 最佳实践总结

### 何时 panic，何时返回 Result

| 场景                                       | 做法                           |
| ------------------------------------------ | ------------------------------ |
| 程序进入不一致/不安全状态                  | `panic!`                       |
| 违反了函数的契约/前置条件                  | `panic!`                       |
| 示例代码、原型开发                         | `unwrap()` / `expect()` 可接受 |
| 失败是预期内的情况（文件不存在、网络超时） | 返回 `Result`                  |
| 你比编译器更了解一定不会失败               | `unwrap()` 加注释说明          |
| 测试代码中断言                             | `unwrap()` / `expect()` 可接受 |

### 错误处理方法选择流程

```
需要处理 Result/Option？
├── 需要传播给调用者？
│   ├── 需要转换错误类型？ → .map_err(...)? 或实现 From + ?
│   └── 不需要转换？       → 直接用 ?
├── 需要处理错误？
│   ├── 需要精细匹配？     → match
│   ├── 只关心一种情况？   → if let / let-else
│   └── 需要恢复默认值？   → unwrap_or / unwrap_or_else / unwrap_or_default
└── 确信不会失败？
    └── expect("原因")
```

### 错误处理方法选择

| 方法                       | 适用场景                              |
| -------------------------- | ------------------------------------- |
| `match`                    | 需要精细控制每种 Ok/Err 情况          |
| `if let`                   | 只关心其中一种情况                    |
| `let-else`                 | 必须成功否则提前退出（减少嵌套）      |
| `?`                        | 将错误传播给调用者                    |
| `unwrap()`                 | 快速原型 / 示例代码                   |
| `expect("说明")`           | 确信不会失败但需要有意义的 panic 信息 |
| `unwrap_or(default)`       | 提供默认值                            |
| `unwrap_or_else(\|\| ...)` | 默认值需要计算                        |
| `unwrap_or_default()`      | 使用类型的 Default 实现               |
| `map_err(...)`             | 转换错误类型                          |
| `.context("...")`          | 添加上下文（需要 `anyhow`）           |

### 设计原则

1. **让错误有意义**：错误信息应包含足够的上下文，帮助定位和解决问题
2. **保留错误链**：使用 `source()` / `#[source]` / `#[from]` 保留底层错误原因
3. **始终 derive Debug**：`{:?}` 格式对日志和调试必不可少
4. **不要过度设计错误变体**：如果 20 个变体的处理方式都一样，说明过度设计了
5. **不要在库 API 中暴露 anyhow**：调用者会失去匹配特定错误的能力
6. **优先用 `expect` 而非 `unwrap`**：提供错误上下文
7. **善用 `?` 操作符**：减少嵌套，保持代码清晰
8. **在系统边界验证输入**：用户输入、外部 API 是需要验证的地方
9. **用 `let-else` 减少嵌套**：比 `if let` + early return 更扁平
10. **Display 面向用户，Debug 面向开发者**：两者应有不同内容

### 常见反模式

```rust
// ❌ 反模式 1：忽略错误
let _ = File::open("important.txt"); // 完全忽略了可能的失败

// ✅ 至少记录日志
if let Err(e) = File::open("important.txt") {
    eprintln!("警告: 无法打开文件: {}", e);
}

// ❌ 反模式 2：到处 unwrap
let file = File::open("config.txt").unwrap();
let content = std::io::read_to_string(file).unwrap();

// ✅ 使用 ? 传播
fn load_config() -> Result<String, std::io::Error> {
    let content = std::fs::read_to_string("config.txt")?;
    Ok(content)
}

// ❌ 反模式 3：吞掉错误信息
.map_err(|_| "发生了某个错误") // 丢失了原始错误信息

// ✅ 保留原始错误
.map_err(|e| format!("解析配置失败: {}", e))

// ❌ 反模式 4：在库中使用 panic 处理可恢复错误
pub fn parse_config(input: &str) -> Config {
    serde_json::from_str(input).unwrap() // 库代码不应该 panic
}

// ✅ 返回 Result，让调用者决定如何处理
pub fn parse_config(input: &str) -> Result<Config, serde_json::Error> {
    serde_json::from_str(input)
}
```

---

## 参考资料

- [The Rust Programming Language - Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)
- [Rust By Example - Error Handling](https://doc.rust-lang.org/rust-by-example/error.html)
- [Rust By Example - Iterating over Results](https://doc.rust-lang.org/rust-by-example/error/iter_result.html)
- [Result in std::result - Rust 官方文档](https://doc.rust-lang.org/std/result/enum.Result.html)
- [Option in std::option - Rust 官方文档](https://doc.rust-lang.org/std/option/enum.Option.html)
- [std::error::Error trait](https://doc.rust-lang.org/std/error/trait.Error.html)
- [Error Handling In Rust - A Deep Dive (Luca Palmieri)](https://lpalmieri.com/posts/error-handling-rust/)
- [Comprehensive Rust - Error Handling](https://google.github.io/comprehensive-rust/error-handling.html)
- [Effective Rust - Item 4: Prefer idiomatic Error types](https://effective-rust.com/errors.html)
- [thiserror crate](https://docs.rs/thiserror)
- [anyhow crate](https://docs.rs/anyhow)
