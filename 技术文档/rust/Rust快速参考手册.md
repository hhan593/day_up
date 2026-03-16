# Rust 快速参考手册

> 本手册提供 Rust 编程语言的核心概念速查，适合快速回顾语法和查找常用模式。

---

## 目录

1. [基础语法速查](#1-基础语法速查)
2. [所有权与借用](#2-所有权与借用)
3. [类型系统](#3-类型系统)
4. [控制流](#4-控制流)
5. [模式匹配](#5-模式匹配)
6. [函数与闭包](#6-函数与闭包)
7. [Trait 与泛型](#7-trait-与泛型)
8. [常用宏](#8-常用宏)
9. [常用 trait 速查](#9-常用-trait-速查)
10. [错误处理](#10-错误处理)

---

## 1. 基础语法速查

### 1.1 变量与常量

```rust
let x = 5;              // 不可变绑定
let mut y = 10;         // 可变绑定
const MAX: i32 = 100;   // 常量（必须标注类型）
static GREETING: &str = "Hello"; // 静态变量

// Shadowing
let x = 5;
let x = x + 1;          // 创建新绑定
let x = "hello";        // 可以改变类型
```

### 1.2 数据类型

```rust
// 标量类型
let a: i32 = 10;        // 有符号整数：i8, i16, i32, i64, i128, isize
let b: u32 = 10;        // 无符号整数：u8, u16, u32, u64, u128, usize
let c: f64 = 3.14;      // 浮点数：f32, f64
let d: bool = true;     // 布尔
let e: char = '🦀';     // Unicode 字符

// 复合类型
let tup: (i32, f64, &str) = (500, 6.4, "hi");
let (x, y, z) = tup;    // 解构
let first = tup.0;      // 索引访问

let arr: [i32; 5] = [1, 2, 3, 4, 5];
let first = arr[0];
let zeros = [0; 5];     // [0, 0, 0, 0, 0]
```

### 1.3 类型转换

```rust
// 显式转换（as）
let x: i32 = 10;
let y: f64 = x as f64;

// 字符串转换
let s = "42";
let n: i32 = s.parse().unwrap();
let n: i32 = s.parse::<i32>().unwrap();  //  turbofish ::<>

// 切片与 Vec 转换
let arr = [1, 2, 3];
let vec = arr.to_vec();
let slice: &[i32] = &vec;
```

---

## 2. 所有权与借用

### 2.1 所有权三规则

```
1. 每个值都有一个所有者
2. 每个值同时只能有一个所有者
3. 当所有者离开作用域，值将被丢弃
```

### 2.2 Move、Copy、Clone

```rust
// Copy 类型（栈上简单类型）
let x = 5;
let y = x;              // x 被复制，仍然可用
// 实现 Copy 的类型：所有整数、浮点、bool、char、Copy 类型的元组/数组

// Move 类型（堆上数据或复杂类型）
let s1 = String::from("hello");
let s2 = s1;            // s1 被 move，不再可用

// Clone（显式深拷贝）
let s2 = s1.clone();
```

### 2.3 引用

```rust
// 不可变引用
let s = String::from("hello");
let len = calculate_length(&s);  // 借用

// 可变引用
let mut s = String::from("hello");
change(&mut s);

// 引用规则
// 1. 任意时刻，要么有一个可变引用，要么有多个不可变引用
// 2. 引用必须始终有效（不能是悬垂引用）

fn calculate_length(s: &String) -> usize {
    s.len()
}

fn change(s: &mut String) {
    s.push_str(", world");
}
```

### 2.4 Slice

```rust
let s = String::from("hello world");

let hello = &s[0..5];   // 字符串 slice
let world = &s[6..11];
let all = &s[..];       // 整个字符串

let arr = [1, 2, 3, 4, 5];
let slice = &arr[1..3]; // [2, 3]
```

---

## 3. 类型系统

### 3.1 结构体

```rust
// 命名字段结构体
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

let user = User {
    email: String::from("a@b.com"),
    username: String::from("abc"),
    active: true,
    sign_in_count: 1,
};

// 元组结构体
struct Point(i32, i32, i32);
let p = Point(0, 0, 0);

// 单元结构体
struct AlwaysEqual;
let subject = AlwaysEqual;
```

### 3.2 枚举

```rust
enum Message {
    Quit,                           // 无数据
    Move { x: i32, y: i32 },        // 匿名结构体
    Write(String),                  // 单个值
    ChangeColor(i32, i32, i32),     // 元组
}

// Option<T>
enum Option<T> {
    Some(T),
    None,
}

// Result<T, E>
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

### 3.3 类型别名

```rust
type Kilometers = i32;
type Thunk = Box<dyn Fn() + Send + 'static>;

// 在 Result 中使用
type MyResult<T> = Result<T, MyError>;
```

---

## 4. 控制流

### 4.1 条件语句

```rust
let number = 5;

if number < 10 {
    println!("small");
} else if number < 100 {
    println!("medium");
} else {
    println!("large");
}

// if 是表达式
let result = if condition { 5 } else { 6 };

// match
match number {
    1 => println!("one"),
    2 | 3 => println!("two or three"),
    4..=10 => println!("four to ten"),
    _ => println!("something else"),
}

// if let（简化 match）
if let Some(value) = some_option {
    println!("{}", value);
}

// while let
while let Some(value) = iter.next() {
    println!("{}", value);
}
```

### 4.2 循环

```rust
// loop（无限循环）
loop {
    println!("again!");
    break;
}

// 带标签的循环
'outer: loop {
    loop {
        break 'outer;
    }
}

// 从 loop 返回值
let result = loop {
    break 10;  // loop 返回 10
};

// while
while condition {
    println!("looping");
}

// for
for i in 0..5 {         // 0, 1, 2, 3, 4
    println!("{}", i);
}

for i in 0..=5 {        // 0, 1, 2, 3, 4, 5
    println!("{}", i);
}

for item in &collection {
    println!("{}", item);
}

// continue / break
for i in 0..10 {
    if i % 2 == 0 { continue; }
    if i > 5 { break; }
    println!("{}", i);
}
```

---

## 5. 模式匹配

### 5.1 匹配模式

```rust
// 字面量匹配
match x {
    1 => println!("one"),
    _ => println!("other"),
}

// 命名变量
match x {
    n => println!("value: {}", n),
}

// 多重模式
match x {
    1 | 2 => println!("one or two"),
    _ => println!("other"),
}

// 范围模式
match x {
    1..=10 => println!("1 to 10"),
    _ => println!("other"),
}

// 解构结构体
let p = Point { x: 0, y: 7 };
match p {
    Point { x, y: 0 } => println!("on x axis"),
    Point { x: 0, y } => println!("on y axis"),
    Point { x, y } => println!("({}, {})", x, y),
}

// 解构枚举
match msg {
    Message::Quit => println!("quit"),
    Message::Move { x, y } => println!("move to {}, {}", x, y),
    Message::Write(text) => println!("write {}", text),
    Message::ChangeColor(r, g, b) => println!("color {}, {}, {}", r, g, b),
}

// 解构元组
let (x, y, z) = point;

// 忽略值
let (x, _, z) = point;      // 忽略第二个值
let (x, .., z) = point;     // 忽略中间所有值
let _unused = 5;            // 忽略整个变量
```

### 5.2 Match Guards

```rust
match num {
    n if n < 0 => println!("negative"),
    n if n > 0 => println!("positive"),
    _ => println!("zero"),
}

match pair {
    (x, y) if x == y => println!("equal"),
    (x, y) => println!("{} != {}", x, y),
}
```

### 5.3 @ 绑定

```rust
match msg {
    Message::Move { x, y: 0 } => println!("move along x to {}", x),
    Message::Move { x: 0..=10, y } => println!("move within x range, y={}", y),
    Message::Move { x, y } => println!("move to {}, {}", x, y),
}

// 使用 @ 绑定
match msg {
    Message::Move { x: x @ 0..=10, y } => {
        println!("x is in range: {}", x);
    }
    _ => {}
}
```

---

## 6. 函数与闭包

### 6.1 函数定义

```rust
// 基本函数
fn add(a: i32, b: i32) -> i32 {
    a + b  // 表达式返回值（无分号）
}

// 返回多个值（使用元组）
fn get_dimensions() -> (i32, i32) {
    (800, 600)
}

// 永不返回
fn panic() -> ! {
    panic!("never returns");
}

// 泛型函数
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    // ...
    &list[0]
}

// 函数指针
fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}
```

### 6.2 方法

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // 构造函数（约定俗成）
    fn new(width: u32, height: u32) -> Self {
        Rectangle { width, height }
    }

    // 实例方法（&self）
    fn area(&self) -> u32 {
        self.width * self.height
    }

    // 可变实例方法
    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }

    // 获取器（getter）
    fn width(&self) -> u32 {
        self.width
    }

    // 关联函数（无 self）
    fn square(size: u32) -> Self {
        Rectangle { width: size, height: size }
    }
}

// 使用
let rect = Rectangle::new(10, 20);
let area = rect.area();
let square = Rectangle::square(5);
```

### 6.3 闭包

```rust
// 基本闭包
let add_one = |x| x + 1;
let result = add_one(5);  // 6

// 多参数
let add = |a, b| a + b;

// 带类型标注
let add: fn(i32, i32) -> i32 = |a, b| a + b;

// 闭包捕获环境
let x = 5;
let equal_to_x = |z| z == x;  // 捕获 x

// 强制捕获所有权（move）
let s = String::from("hello");
let consume = move || println!("{}", s);  // s 被 move 进闭包
```

### 6.4 闭包 Trait

```rust
// Fn: 借用环境中的值
fn call_with_closure<F>(f: F)
where
    F: Fn(),
{
    f();
}

// FnMut: 可变借用环境中的值
fn call_with_mut_closure<F>(mut f: F)
where
    F: FnMut(),
{
    f();
}

// FnOnce: 消费环境中的值（只能调用一次）
fn call_with_once_closure<F>(f: F)
where
    F: FnOnce(),
{
    f();
}
```

---

## 7. Trait 与泛型

### 7.1 定义与实现

```rust
// 定义 trait
pub trait Summary {
    fn summarize(&self) -> String;

    // 默认实现
    fn summarize_author(&self) -> String {
        String::from("(read more)")
    }
}

// 为类型实现 trait
struct NewsArticle { /* ... */ }

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {}", self.headline, self.author)
    }
}
```

### 7.2 Trait Bound

```rust
// impl Trait 语法
fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

// Trait bound 语法
fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// 多重约束
fn notify(item: &(impl Summary + Display)) { }
fn notify<T: Summary + Display>(item: &T) { }

// where 子句
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}
```

### 7.3 关联类型

```rust
pub trait Iterator {
    type Item;  // 关联类型

    fn next(&mut self) -> Option<Self::Item>;
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        // ...
    }
}
```

### 7.4 泛型

```rust
// 泛型函数
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    // ...
}

// 泛型结构体
struct Point<T> {
    x: T,
    y: T,
}

struct Point2<T, U> {
    x: T,
    y: U,
}

// 泛型枚举
enum Result<T, E> {
    Ok(T),
    Err(E),
}

// 泛型方法
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 为特定类型实现
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

### 7.5 生命周期

```rust
// 函数生命周期
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

// 结构体生命周期
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
}

// 静态生命周期
let s: &'static str = "I have a static lifetime.";

// 生命周期省略规则适用场景：
// 1. 每个引用参数有自己的生命周期
// 2. 只有一个输入生命周期时，输出使用它
// 3. 有 &self 或 &mut self 时，输出使用 self 的生命周期
```

---

## 8. 常用宏

### 8.1 输出宏

```rust
println!("Hello, {}!", name);           // 输出并换行
print!("Hello");                        // 输出不换行
eprintln!("Error: {}", err);            // 输出到 stderr
format!("Hello, {}!", name);            // 返回 String

// 调试输出
println!("{:?}", value);                // Debug trait
println!("{:#?}", value);               // 美化 Debug 输出
```

### 8.2 声明宏

```rust
// vec! 宏
let v = vec![1, 2, 3];
let v = vec![0; 5];  // [0, 0, 0, 0, 0]

// 创建集合
let mut map = HashMap::new();
let map = hashmap! {
    "key1" => "value1",
    "key2" => "value2",
};

// todo!() 和 unimplemented!()
todo!("implement this later");
unimplemented!();
```

### 8.3 属性宏

```rust
// 测试
#[test]
fn my_test() { }

#[test]
#[should_panic]
fn test_panic() { }

#[test]
#[ignore]
fn ignored_test() { }

// 条件编译
#[cfg(target_os = "linux")]
fn linux_only() { }

#[cfg(feature = "serde")]
impl Serialize for MyType { }

// 派生宏
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
struct MyStruct { }

// 其他常用属性
#[inline]           // 建议内联
#[must_use]         // 返回值必须被使用
#[repr(C)]          // C 语言兼容布局
#[non_exhaustive]   // 非穷尽（库版本兼容）
```

---

## 9. 常用 Trait 速查

### 9.1 基础 Trait

| Trait | 方法 | 用途 |
|-------|------|------|
| `Drop` | `drop(&mut self)` | 析构时清理资源 |
| `Clone` | `clone(&self)` | 深拷贝 |
| `Copy` | （标记 trait） | 按位复制 |
| `Default` | `default() -> Self` | 创建默认值 |

### 9.2 比较 Trait

| Trait | 方法 | 用途 |
|-------|------|------|
| `PartialEq` | `eq(&self, &other)` | 相等比较 (`==`, `!=`) |
| `Eq` | （标记 trait） | 自反性相等 |
| `PartialOrd` | `partial_cmp` | 部分排序 (`<`, `>`, `<=`, `>=`) |
| `Ord` | `cmp(&self, &other)` | 全序排序 |

### 9.3 转换 Trait

| Trait | 方法 | 用途 |
|-------|------|------|
| `From<T>` | `from(T) -> Self` | 从 T 转换 |
| `Into<T>` | `into(self) -> T` | 转换为 T |
| `TryFrom<T>` | `try_from(T) -> Result<Self, E>` | 可能失败的转换 |
| `TryInto<T>` | `try_into(self) -> Result<T, E>` | 可能失败的转换 |
| `AsRef<T>` | `as_ref(&self) -> &T` | 引用转换 |
| `AsMut<T>` | `as_mut(&mut self) -> &mut T` | 可变引用转换 |

### 9.4 迭代 Trait

| Trait | 方法 | 用途 |
|-------|------|------|
| `Iterator` | `next(&mut self) -> Option<Self::Item>` | 迭代器 |
| `IntoIterator` | `into_iter(self) -> Iter` | 转换为迭代器 |
| `FromIterator` | `from_iter(iter) -> Self` | 从迭代器收集 |
| `ExactSizeIterator` | `len(&self) -> usize` | 已知长度迭代器 |

### 9.5 智能指针 Trait

| Trait | 方法 | 用途 |
|-------|------|------|
| `Deref` | `deref(&self) -> &Target` | 解引用 |
| `DerefMut` | `deref_mut(&mut self) -> &mut Target` | 可变解引用 |

### 9.6 错误处理 Trait

| Trait | 方法 | 用途 |
|-------|------|------|
| `Error` | `source(&self) -> Option<&dyn Error>` | 标准错误 trait |
| `Display` | `fmt(&self, f) -> fmt::Result` | 格式化显示 |
| `Debug` | `fmt(&self, f) -> fmt::Result` | 调试格式化 |

### 9.7 闭包 Trait

| Trait | 调用方式 | 用途 |
|-------|----------|------|
| `Fn` | `call(&self)` | 借用捕获 |
| `FnMut` | `call_mut(&mut self)` | 可变借用捕获 |
| `FnOnce` | `call_once(self)` | 消费捕获 |

---

## 10. 错误处理

### 10.1 Result 处理

```rust
// 基本处理
match result {
    Ok(value) => println!("{}", value),
    Err(e) => println!("Error: {}", e),
}

// if let
if let Ok(value) = result {
    println!("{}", value);
}

// unwrap（panic 如果 Err）
let value = result.unwrap();
let value = result.expect("custom error message");

// unwrap_or / unwrap_or_else
let value = result.unwrap_or(default);
let value = result.unwrap_or_else(|| compute_default());

// ? 运算符
let value = result?;

// map / map_err
let doubled = result.map(|v| v * 2);
let converted = result.map_err(|e| MyError::from(e));

// and_then / or_else
let result = result.and_then(|v| validate(v));
let result = result.or_else(|e| fallback(e));
```

### 10.2 Option 处理

```rust
// 基本处理
match option {
    Some(value) => println!("{}", value),
    None => println!("no value"),
}

// if let
if let Some(value) = option {
    println!("{}", value);
}

// unwrap
let value = option.unwrap();
let value = option.expect("should have value");

// unwrap_or / unwrap_or_else
let value = option.unwrap_or(default);
let value = option.unwrap_or_else(|| compute_default());

// ? 运算符
let value = option?;

// map / and_then
let doubled = option.map(|v| v * 2);
let result = option.and_then(|v| some_operation(v));

// 组合 Option 和 Result
let result = option.ok_or(MyError::NotFound)?;
let option = result.ok();
```

### 10.3 自定义错误

```rust
use std::fmt;
use std::error::Error;

#[derive(Debug)]
enum MyError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
    Custom(String),
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            MyError::Io(e) => write!(f, "IO error: {}", e),
            MyError::Parse(e) => write!(f, "Parse error: {}", e),
            MyError::Custom(s) => write!(f, "{}", s),
        }
    }
}

impl Error for MyError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            MyError::Io(e) => Some(e),
            MyError::Parse(e) => Some(e),
            MyError::Custom(_) => None,
        }
    }
}

// 使用 thiserror 简化
use thiserror::Error;

#[derive(Error, Debug)]
enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(#[from] std::num::ParseIntError),

    #[error("{0}")]
    Custom(String),
}
```

---

## 常用命令速查

```bash
# 构建
cargo build
cargo build --release
cargo check              # 快速检查，不生成二进制

# 运行
cargo run
cargo run -- arg1 arg2   # 传递参数

# 测试
cargo test
cargo test -- --nocapture    # 显示输出
cargo test test_name         # 运行特定测试

# 文档
cargo doc
cargo doc --open

# 依赖
cargo add crate_name
cargo update
cargo tree

# 其他
cargo fmt                # 格式化
cargo clippy             # 代码检查
cargo clean              # 清理
cargo publish            # 发布到 crates.io
```

---

## 参考资料

- [The Rust Programming Language](https://doc.rust-lang.org/book/)
- [Rust By Example](https://doc.rust-lang.org/rust-by-example/)
- [Rust Cheat Sheet](https://cheats.rs/)
- [Rust Reference](https://doc.rust-lang.org/reference/)
