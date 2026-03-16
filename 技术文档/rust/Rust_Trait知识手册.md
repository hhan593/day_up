# Rust Trait 全面知识手册

> 基于 Rust 官方文档、The Rust Book、Effective Rust、Tour of Rust's Standard Library Traits 等权威来源整理

---

## 目录

1. [Trait 概览](#1-trait-概览)
2. [定义与实现 Trait](#2-定义与实现-trait)
3. [默认实现与方法覆盖](#3-默认实现与方法覆盖)
4. [Trait 约束 (Trait Bounds)](#4-trait-约束-trait-bounds)
5. [关联类型 (Associated Types)](#5-关联类型-associated-types)
6. [泛型 Trait 参数](#6-泛型-trait-参数)
7. [Trait 对象与动态分发](#7-trait-对象与动态分发)
8. [静态分发 vs 动态分发](#8-静态分发-vs-动态分发)
9. [Supertraits（超 trait）](#9-supertraits超-trait)
10. [Blanket Implementation（全面实现）](#10-blanket-implementation全面实现)
11. [derive 宏与可派生 Trait](#11-derive-宏与可派生-trait)
12. [标准库常用 Trait 速查](#12-标准库常用-trait-速查)
13. [运算符重载](#13-运算符重载)
14. [闭包 Trait：Fn / FnMut / FnOnce](#14-闭包-traitfn--fnmut--fnonce)
15. [Marker Trait（标记 trait）](#15-marker-trait标记-trait)
16. [Newtype 模式与孤儿规则](#16-newtype-模式与孤儿规则)
17. [常见模式与最佳实践](#17-常见模式与最佳实践)

---

## 1. Trait 概览

Trait 定义了某个类型具有的、可以与其他类型共享的功能。类似于其他语言中的 **接口（interface）**，但功能更强大。

### Trait 在 Rust 中的核心角色

| 用途 | 说明 |
|------|------|
| 共享行为 | 定义多个类型共有的方法签名 |
| 泛型约束 | 限制泛型参数必须实现哪些行为 |
| 动态分发 | 通过 `dyn Trait` 实现运行时多态 |
| 运算符重载 | `Add`、`Mul`、`Index` 等 |
| 标记能力 | `Send`、`Sync`、`Copy` 等标记类型特性 |
| 自动派生 | `#[derive(...)]` 自动实现常用 trait |

### 与其他语言对比

| 特性 | Rust Trait | Java Interface | Go Interface | C++ Concept |
|------|-----------|---------------|-------------|-------------|
| 方法签名 | ✅ | ✅ | ✅ | ✅ |
| 默认实现 | ✅ | ✅ (default) | ❌ | ❌ |
| 关联类型 | ✅ | ✅ (泛型参数) | ❌ | ✅ |
| 静态分发 | ✅（零成本） | ❌ | ❌ | ✅ |
| 动态分发 | ✅（显式 `dyn`） | ✅（默认） | ✅（隐式） | ✅（virtual） |
| 实现方式 | 显式 `impl Trait for Type` | `implements` | 隐式（duck typing） | `requires` |

---

## 2. 定义与实现 Trait

### 定义 Trait

```rust
pub trait Summary {
    fn summarize(&self) -> String; // 必须实现的方法（只有签名，没有函数体）
}
```

### 为类型实现 Trait

```rust
struct NewsArticle {
    title: String,
    author: String,
    content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {}", self.title, self.author)
    }
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

### 使用 Trait 方法

```rust
let article = NewsArticle {
    title: "Rust 发布 2.0".to_string(),
    author: "张三".to_string(),
    content: "很长的正文...".to_string(),
};
println!("{}", article.summarize()); // "Rust 发布 2.0, by 张三"
```

### 孤儿规则 (Orphan Rule)

> 实现 trait 时，**trait 或 类型至少有一个**必须定义在当前 crate 中。

```rust
// ✅ 可以：为自己的类型实现标准库的 trait
impl Display for MyType { ... }

// ✅ 可以：为标准库的类型实现自己的 trait
impl MyTrait for Vec<i32> { ... }

// ❌ 不行：为标准库的类型实现标准库的 trait
// impl Display for Vec<i32> { ... }  // 两者都不是本 crate 的
```

---

## 3. 默认实现与方法覆盖

### 默认实现

```rust
pub trait Summary {
    fn summarize_author(&self) -> String; // 没有默认实现，必须手动实现

    fn summarize(&self) -> String {
        // 有默认实现，可以选择覆盖或不覆盖
        format!("(阅读更多来自 {} 的内容...)", self.summarize_author())
    }
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // summarize() 使用默认实现，不需要显式写出
}

let tweet = Tweet { username: "rust".into(), content: "hello".into() };
println!("{}", tweet.summarize());
// "(阅读更多来自 @rust 的内容...)"
```

### 覆盖默认实现

```rust
impl Summary for NewsArticle {
    fn summarize_author(&self) -> String {
        self.author.clone()
    }

    fn summarize(&self) -> String {
        // 覆盖默认实现
        format!("{}（作者: {}）", self.title, self.author)
    }
}
```

> ⚠️ **注意**：默认实现可以调用同 trait 内的其他方法（包括没有默认实现的方法）。但从覆盖实现中无法调用原来的默认实现（没有 `super` 机制）。

---

## 4. Trait 约束 (Trait Bounds)

### 基本语法：`impl Trait`（语法糖）

```rust
// 参数 item 必须实现 Summary trait
fn notify(item: &impl Summary) {
    println!("速报: {}", item.summarize());
}
```

### Trait Bound 语法（更灵活）

```rust
// 等价于上面的 impl Trait 语法
fn notify<T: Summary>(item: &T) {
    println!("速报: {}", item.summarize());
}

// 多个参数必须是同一类型时，只能用 Trait Bound
fn notify_pair<T: Summary>(a: &T, b: &T) { ... }
// 而 impl Trait 无法表达这个约束：
// fn notify_pair(a: &impl Summary, b: &impl Summary) // a 和 b 可以是不同类型
```

### 多个 Trait 约束（`+` 语法）

```rust
fn notify(item: &(impl Summary + Display)) {
    println!("{}", item); // 可以用 Display
    println!("{}", item.summarize()); // 可以用 Summary
}

// 等价的 Trait Bound 形式
fn notify<T: Summary + Display>(item: &T) { ... }
```

### where 子句（复杂约束时提高可读性）

```rust
// ❌ 可读性差
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 { ... }

// ✅ 用 where 子句
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}
```

### 返回值中使用 `impl Trait`

```rust
fn create_summarizable() -> impl Summary {
    Tweet {
        username: "rust".into(),
        content: "hello world".into(),
    }
}
// 调用者不知道具体类型，只知道返回值实现了 Summary
```

> ⚠️ **限制**：`impl Trait` 作为返回值时，函数只能返回**单一**具体类型。不能在 if/else 中返回不同类型。

```rust
// ❌ 编译错误：不同分支返回不同类型
fn get_item(is_tweet: bool) -> impl Summary {
    if is_tweet {
        Tweet { ... }
    } else {
        NewsArticle { ... } // 类型不同！
    }
}

// ✅ 需要用 trait 对象 (Box<dyn Summary>) 来解决
fn get_item(is_tweet: bool) -> Box<dyn Summary> {
    if is_tweet {
        Box::new(Tweet { ... })
    } else {
        Box::new(NewsArticle { ... })
    }
}
```

### 条件实现 (Conditional Implementation)

```rust
struct Pair<T> {
    x: T,
    y: T,
}

// 所有 Pair<T> 都有 new 方法
impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

// 只有 T 实现了 Display + PartialOrd 时，才有 cmp_display 方法
impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("最大值是 x = {}", self.x);
        } else {
            println!("最大值是 y = {}", self.y);
        }
    }
}
```

---

## 5. 关联类型 (Associated Types)

关联类型是 trait 内部的**类型占位符**，在实现时被具体化。

### 定义与使用

```rust
pub trait Iterator {
    type Item; // 关联类型：实现者决定具体类型

    fn next(&mut self) -> Option<Self::Item>;
}

struct Counter {
    count: u32,
}

impl Iterator for Counter {
    type Item = u32; // 指定关联类型为 u32

    fn next(&mut self) -> Option<Self::Item> {
        self.count += 1;
        if self.count <= 5 {
            Some(self.count)
        } else {
            None
        }
    }
}
```

### 关联类型 vs 泛型参数

| 特性 | 关联类型 `type Item` | 泛型参数 `Trait<T>` |
|------|---------------------|---------------------|
| 每个类型可实现次数 | **一次** | 多次（不同 T） |
| 使用时是否需要指定类型 | 否（类型已确定） | 是（需要写 `Trait<i32>`） |
| 适用场景 | 一个类型只有一种逻辑实现 | 同一类型需要多种实现 |

```rust
// 关联类型：一个类型只能实现一次 Iterator
// Counter 的 Item 只能是 u32
impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<u32> { ... }
}

// 泛型参数：同一类型可以多次实现
trait Convert<T> {
    fn convert(&self) -> T;
}
impl Convert<String> for i32 {
    fn convert(&self) -> String { self.to_string() }
}
impl Convert<f64> for i32 {
    fn convert(&self) -> f64 { *self as f64 }
}
```

### 关联常量

```rust
trait Bounded {
    const MIN: Self;
    const MAX: Self;
}

impl Bounded for u8 {
    const MIN: u8 = 0;
    const MAX: u8 = 255;
}
```

---

## 6. 泛型 Trait 参数

### 带默认类型参数的泛型 Trait

```rust
// 标准库中的 Add trait
trait Add<Rhs = Self> {  // Rhs 默认为 Self
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}

// 使用默认类型参数（Rhs = Self）
impl Add for Point {
    type Output = Point;
    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

// 指定不同的 Rhs 类型
struct Millimeters(f64);
struct Meters(f64);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;
    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000.0))
    }
}
```

---

## 7. Trait 对象与动态分发

### 什么是 Trait 对象

Trait 对象（`dyn Trait`）是一种实现运行时多态的机制。它是一个**胖指针**，包含：
1. 指向数据的指针
2. 指向 vtable（虚函数表）的指针

```rust
// trait 对象必须通过某种指针使用
let item: Box<dyn Summary> = Box::new(tweet);
let item: &dyn Summary = &tweet;
let item: Arc<dyn Summary> = Arc::new(tweet);
```

### 内存布局

```
&dyn Summary (16 字节胖指针):
┌──────────────┬──────────────┐
│ data_ptr     │ vtable_ptr   │
│ 指向具体数据 │ 指向虚函数表 │
└──────┬───────┴──────┬───────┘
       │              │
       ▼              ▼
  ┌─────────┐   ┌───────────────┐
  │ Tweet {  │   │ vtable:       │
  │  username│   │  drop_fn      │ ← 析构函数指针
  │  content │   │  size          │ ← 类型大小
  │ }        │   │  align         │ ← 对齐要求
  └─────────┘   │  summarize_fn │ ← 方法指针
                └───────────────┘
```

### dyn 兼容性（对象安全）规则

只有满足以下规则的 trait 才能作为 trait 对象使用：

**Trait 级别的规则**：
1. trait 本身不能有 `Self: Sized` 约束
2. 所有 supertrait 也必须是 dyn 兼容的

**方法级别的规则**：
1. 方法不能返回 `Self`（编译器不知道 Self 的具体大小）
2. 方法不能有泛型类型参数（无法为所有可能的类型在 vtable 中生成函数指针）
3. 方法必须有 `self`/`&self`/`&mut self`/`self: Box<Self>` 等接收者

```rust
// ✅ dyn 兼容
trait Draw {
    fn draw(&self);
}

// ❌ 不兼容：方法返回 Self
trait Cloneable {
    fn clone(&self) -> Self; // Self 大小未知
}

// ❌ 不兼容：方法有泛型参数
trait Serializer {
    fn serialize<T: Serialize>(&self, value: &T); // 泛型方法
}

// ✅ 绕过方法：用 where Self: Sized 排除该方法
trait MyTrait {
    fn normal_method(&self);

    fn generic_method<T>(&self, t: T)
    where
        Self: Sized; // 标记为 Sized，这个方法不会出现在 vtable 中
}
// 现在 dyn MyTrait 是合法的，但只能调用 normal_method
```

### 异构集合

```rust
trait Draw {
    fn draw(&self);
}

struct Button { label: String }
struct TextBox { text: String }

impl Draw for Button {
    fn draw(&self) { println!("按钮: {}", self.label); }
}
impl Draw for TextBox {
    fn draw(&self) { println!("文本框: {}", self.text); }
}

// 异构集合：不同类型放在同一个 Vec 中
let components: Vec<Box<dyn Draw>> = vec![
    Box::new(Button { label: "确定".into() }),
    Box::new(TextBox { text: "输入内容".into() }),
];

for component in &components {
    component.draw(); // 动态分发
}
```

---

## 8. 静态分发 vs 动态分发

### 静态分发（泛型 + Trait Bound）

编译器为每个具体类型生成专门的代码（单态化 monomorphization）。

```rust
fn notify(item: &impl Summary) {
    println!("{}", item.summarize());
}

// 编译器会生成：
// fn notify_Tweet(item: &Tweet) { ... }
// fn notify_NewsArticle(item: &NewsArticle) { ... }
```

### 动态分发（dyn Trait）

通过 vtable 在运行时查找方法。

```rust
fn notify(item: &dyn Summary) {
    println!("{}", item.summarize()); // 运行时通过 vtable 调用
}
```

### 对比

| 特性 | 静态分发 (泛型) | 动态分发 (dyn) |
|------|----------------|----------------|
| 关键字 | `impl Trait` / `T: Trait` | `dyn Trait` |
| 分发方式 | 编译时确定 | 运行时通过 vtable |
| 性能 | 零成本，可内联 | 有 vtable 查找开销，不可内联 |
| 二进制大小 | 可能较大（单态化膨胀） | 较小（共享一份代码） |
| 异构集合 | ❌ 不支持 | ✅ 支持 |
| 返回不同类型 | ❌ 不支持 | ✅ 支持 |
| 编译速度 | 较慢（生成多份代码） | 较快 |

### 选择建议

| 场景 | 推荐 |
|------|------|
| 性能敏感的热路径 | 静态分发 |
| 异构集合（不同类型放一起） | 动态分发 |
| 库 API 的公共接口 | 取决于灵活性需求 |
| 二进制大小敏感（嵌入式） | 动态分发 |
| 需要编译时类型信息 | 静态分发 |

---

## 9. Supertraits（超 trait）

Supertrait 要求实现当前 trait 的类型必须也实现另一个 trait。

```rust
use std::fmt;

// OutlinePrint 要求实现者也必须实现 Display
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string(); // 可以使用 Display 的方法
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("* {} *", output);
        println!("{}", "*".repeat(len + 4));
    }
}

struct Point { x: i32, y: i32 }

// 必须先实现 Display（supertrait）
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// 然后才能实现 OutlinePrint
impl OutlinePrint for Point {}

// point.outline_print() 输出：
// **********
// * (1, 2) *
// **********
```

### Supertrait 层级

```rust
trait Shape {
    fn area(&self) -> f64;
}

trait Circle: Shape {       // Circle: Shape 的子 trait
    fn radius(&self) -> f64;
}

// 实现 Circle 的类型必须同时实现 Shape
struct Disk { r: f64 }

impl Shape for Disk {
    fn area(&self) -> f64 { std::f64::consts::PI * self.r * self.r }
}

impl Circle for Disk {
    fn radius(&self) -> f64 { self.r }
}
```

### 常见的 supertrait 关系

```
Copy: Clone              // Copy 要求先实现 Clone
Eq: PartialEq            // Eq 要求先实现 PartialEq
Ord: Eq + PartialOrd     // Ord 要求 Eq 和 PartialOrd
PartialOrd: PartialEq    // PartialOrd 要求 PartialEq
Error: Display + Debug    // Error 要求 Display 和 Debug
FnMut: FnOnce            // FnMut 是 FnOnce 的子 trait
Fn: FnMut                // Fn 是 FnMut 的子 trait
DerefMut: Deref           // DerefMut 要求 Deref
ExactSizeIterator: Iterator
```

---

## 10. Blanket Implementation（全面实现）

为所有满足某个条件的类型自动实现 trait，称为 blanket implementation。

### 标准库中的经典例子

```rust
// 标准库：为所有实现 Display 的类型自动实现 ToString
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        format!("{}", self)
    }
}
// 因此：42.to_string()、"hello".to_string() 都能用
```

### 自定义 blanket implementation

```rust
trait Printable {
    fn print(&self);
}

// 为所有实现了 Display 的类型自动实现 Printable
impl<T: std::fmt::Display> Printable for T {
    fn print(&self) {
        println!("{}", self);
    }
}

42.print();        // "42"
"hello".print();   // "hello"
3.14.print();      // "3.14"
```

### 更多标准库 blanket implementation

```rust
// 所有 Iterator 自动实现 IntoIterator
impl<I: Iterator> IntoIterator for I { ... }

// 所有 &T（T: ?Sized） 自动实现 Copy
impl<T: ?Sized> Copy for &T { }

// 所有 T 自动实现 From<T>（恒等转换）
impl<T> From<T> for T {
    fn from(t: T) -> T { t }
}

// 所有实现 From<T> 的类型自动拥有 Into
impl<T, U> Into<U> for T
where
    U: From<T>,
{
    fn into(self) -> U { U::from(self) }
}
```

---

## 11. derive 宏与可派生 Trait

### 基本语法

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}
```

### 可自动派生的标准库 Trait

| Trait | 功能 | 派生条件 |
|-------|------|---------|
| `Debug` | `{:?}` 格式化输出 | 所有字段实现 Debug |
| `Clone` | 深拷贝（`.clone()`） | 所有字段实现 Clone |
| `Copy` | 按位复制（隐式） | 所有字段实现 Copy + 已 derive Clone |
| `PartialEq` | `==` 和 `!=` 比较 | 所有字段实现 PartialEq |
| `Eq` | 完全等价关系 | 已实现 PartialEq |
| `Hash` | 哈希值计算 | 所有字段实现 Hash |
| `PartialOrd` | `<` `>` `<=` `>=` 比较 | 已实现 PartialEq + 所有字段实现 PartialOrd |
| `Ord` | 全序比较 | 已实现 PartialOrd + Eq |
| `Default` | 默认值 (`Default::default()`) | 所有字段实现 Default |

### 派生顺序依赖

```
PartialEq  ──►  Eq
    │              │
    ▼              ▼
PartialOrd ──►  Ord

Clone ──► Copy

PartialEq ──► Hash  (语义约束: a == b → hash(a) == hash(b))
```

### 派生行为说明

```rust
#[derive(PartialEq)]
struct Point { x: f64, y: f64 }
// 派生的 PartialEq 按字段顺序逐一比较
// Point { x: 1.0, y: 2.0 } == Point { x: 1.0, y: 2.0 } → true

#[derive(PartialOrd)]
struct Pair { first: i32, second: i32 }
// 派生的 PartialOrd 按字段定义顺序进行字典序比较
// 先比 first，first 相同再比 second

#[derive(Debug)]
enum Color { Red, Green, Blue }
// 派生的 Debug 输出枚举变体名
// format!("{:?}", Color::Red) → "Red"
```

### 何时手动实现而非 derive

```rust
// 1. 自定义相等逻辑（忽略某些字段）
struct User {
    id: u64,
    name: String,
    cache: String, // 不参与比较
}

impl PartialEq for User {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id // 只比较 id
    }
}

// 2. 自定义 Debug 输出（隐藏敏感信息）
impl std::fmt::Debug for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("User")
            .field("id", &self.id)
            .field("name", &self.name)
            // 不输出 cache 字段
            .finish()
    }
}

// 3. 性能优化（更高效的 Clone）
impl Clone for MyLargeStruct {
    fn clone(&self) -> Self {
        // 自定义高效的克隆逻辑
        Self { ... }
    }
}
```

---

## 12. 标准库常用 Trait 速查

### 格式化 Trait

| Trait | 格式符 | 用途 |
|-------|-------|------|
| `Debug` | `{:?}` `{:#?}` | 开发调试（可 derive） |
| `Display` | `{}` | 用户友好的输出（**不可** derive，必须手动实现） |

```rust
use std::fmt;

#[derive(Debug)] // Debug 可以自动派生
struct Point { x: f64, y: f64 }

impl fmt::Display for Point { // Display 必须手动实现
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

let p = Point { x: 1.0, y: 2.0 };
println!("{:?}", p);  // Debug:   Point { x: 1.0, y: 2.0 }
println!("{}", p);    // Display: (1.0, 2.0)
```

> 实现 `Display` 会自动获得 `ToString`（通过 blanket implementation）。

### Clone 与 Copy

```rust
// Clone: 显式深拷贝
#[derive(Clone)]
struct Buffer {
    data: Vec<u8>, // Vec 实现了 Clone（堆数据会被复制）
}

let a = Buffer { data: vec![1, 2, 3] };
let b = a.clone(); // 显式克隆，堆数据被复制

// Copy: 隐式按位复制（仅适用于栈上固定大小的类型）
#[derive(Copy, Clone)] // Copy 要求也实现 Clone
struct Point { x: i32, y: i32 }

let a = Point { x: 1, y: 2 };
let b = a; // 隐式 Copy，a 仍然可用
println!("{:?}", a); // ✅ a 没有被移动
```

**Copy 的条件**：所有字段都是 Copy 类型。不能含有 `String`、`Vec`、`Box` 等堆分配类型。

### Default

```rust
#[derive(Default)]
struct Config {
    width: u32,      // 默认 0
    height: u32,     // 默认 0
    title: String,   // 默认 ""
    verbose: bool,   // 默认 false
}

// 使用结构体更新语法，只覆盖部分字段
let config = Config {
    title: "我的应用".into(),
    ..Default::default()
};
```

### From 与 Into

```rust
// From: 定义如何从一个类型创建另一个类型
impl From<&str> for MyString {
    fn from(s: &str) -> Self {
        MyString(s.to_string())
    }
}

// 实现 From 自动获得 Into（反向转换）
let s: MyString = "hello".into();         // 使用 Into
let s = MyString::from("hello");          // 使用 From

// TryFrom / TryInto: 可能失败的转换
impl TryFrom<i32> for PositiveInt {
    type Error = String;
    fn try_from(value: i32) -> Result<Self, Self::Error> {
        if value > 0 {
            Ok(PositiveInt(value))
        } else {
            Err(format!("{} 不是正整数", value))
        }
    }
}
```

### AsRef 与 AsMut

```rust
// AsRef: 廉价的引用转换
fn print_bytes(data: &impl AsRef<[u8]>) {
    println!("{:?}", data.as_ref());
}

print_bytes(&"hello");           // &str → &[u8]
print_bytes(&vec![1u8, 2, 3]);   // Vec<u8> → &[u8]
print_bytes(&[1u8, 2, 3]);       // &[u8] → &[u8]
```

### Deref 与 DerefMut

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T {
        &self.0
    }
}

let x = MyBox(String::from("hello"));
// Deref 强制转换链：&MyBox<String> → &String → &str
fn greet(name: &str) { println!("Hello, {name}!"); }
greet(&x); // ✅ 自动多级 Deref
```

### Drop

```rust
struct CustomResource {
    name: String,
}

impl Drop for CustomResource {
    fn drop(&mut self) {
        println!("释放资源: {}", self.name);
    }
}

{
    let r = CustomResource { name: "数据库连接".into() };
    // r 在作用域结束时自动调用 drop
} // 打印 "释放资源: 数据库连接"

// 手动提前释放
let r = CustomResource { name: "文件句柄".into() };
drop(r); // 显式调用 std::mem::drop
// r 已不可用
```

### Iterator

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
    // + 数十个有默认实现的方法: map, filter, fold, collect, sum...
}

struct Fibonacci {
    a: u64,
    b: u64,
}

impl Iterator for Fibonacci {
    type Item = u64;
    fn next(&mut self) -> Option<u64> {
        let result = self.a;
        self.a = self.b;
        self.b = result + self.b;
        Some(result)
    }
}

// 使用所有迭代器方法
let fibs: Vec<u64> = Fibonacci { a: 0, b: 1 }
    .take(10)
    .collect();
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### 完整 Trait 速查表

| 类别 | Trait | 方法/用途 |
|------|-------|----------|
| **格式化** | `Debug` | `{:?}` 调试输出 |
| | `Display` | `{}` 用户输出，自动获得 `ToString` |
| **克隆** | `Clone` | `.clone()` 深拷贝 |
| | `Copy` | 隐式按位复制（标记 trait） |
| **比较** | `PartialEq` | `==` `!=` |
| | `Eq` | 完全等价关系（标记 trait） |
| | `PartialOrd` | `<` `>` `<=` `>=`，返回 `Option<Ordering>` |
| | `Ord` | 全序比较，返回 `Ordering` |
| | `Hash` | 哈希值，用于 HashMap/HashSet |
| **转换** | `From<T>` / `Into<T>` | 类型转换 |
| | `TryFrom<T>` / `TryInto<T>` | 可失败的类型转换 |
| | `AsRef<T>` / `AsMut<T>` | 廉价引用转换 |
| | `Borrow<T>` / `BorrowMut<T>` | 借用语义（HashMap 键查找） |
| | `ToOwned` | 创建拥有所有权的副本 |
| | `FromStr` | 从字符串解析（`.parse()` 底层） |
| **默认值** | `Default` | 类型的默认值 |
| **解引用** | `Deref` / `DerefMut` | 智能指针解引用，强制转换 |
| **释放** | `Drop` | 自定义析构逻辑 |
| **迭代** | `Iterator` | `.next()` + 数十个适配器方法 |
| | `IntoIterator` | `for x in collection` 底层 |
| | `FromIterator` | `.collect()` 底层 |
| **运算符** | `Add` `Sub` `Mul` `Div` `Rem` | 算术运算符重载 |
| | `Neg` `Not` | 一元运算符 |
| | `Index` `IndexMut` | `[]` 索引 |
| **闭包** | `Fn` `FnMut` `FnOnce` | 闭包类型 |
| **并发** | `Send` | 可跨线程转移所有权 |
| | `Sync` | 可跨线程共享引用 |
| **大小** | `Sized` | 编译时已知大小 |
| | `Unpin` | 可安全移动（pin 相关） |

---

## 13. 运算符重载

Rust 通过实现 `std::ops` 中的 trait 来重载运算符。

```rust
use std::ops::{Add, Mul, Neg, Index};

#[derive(Debug, Clone, Copy, PartialEq)]
struct Vec2 {
    x: f64,
    y: f64,
}

// + 运算符
impl Add for Vec2 {
    type Output = Vec2;
    fn add(self, other: Vec2) -> Vec2 {
        Vec2 { x: self.x + other.x, y: self.y + other.y }
    }
}

// * 标量乘法（Vec2 * f64）
impl Mul<f64> for Vec2 {
    type Output = Vec2;
    fn mul(self, scalar: f64) -> Vec2 {
        Vec2 { x: self.x * scalar, y: self.y * scalar }
    }
}

// 一元 - 运算符
impl Neg for Vec2 {
    type Output = Vec2;
    fn neg(self) -> Vec2 {
        Vec2 { x: -self.x, y: -self.y }
    }
}

let a = Vec2 { x: 1.0, y: 2.0 };
let b = Vec2 { x: 3.0, y: 4.0 };
let c = a + b;         // Vec2 { x: 4.0, y: 6.0 }
let d = a * 2.0;       // Vec2 { x: 2.0, y: 4.0 }
let e = -a;            // Vec2 { x: -1.0, y: -2.0 }
```

### 运算符 Trait 速查

| 运算符 | Trait | 方法 |
|--------|-------|------|
| `+` | `Add<Rhs>` | `add(self, rhs)` |
| `-` | `Sub<Rhs>` | `sub(self, rhs)` |
| `*` | `Mul<Rhs>` | `mul(self, rhs)` |
| `/` | `Div<Rhs>` | `div(self, rhs)` |
| `%` | `Rem<Rhs>` | `rem(self, rhs)` |
| `-x` | `Neg` | `neg(self)` |
| `!x` | `Not` | `not(self)` |
| `+=` | `AddAssign<Rhs>` | `add_assign(&mut self, rhs)` |
| `a[i]` | `Index<Idx>` | `index(&self, idx)` |
| `a[i] = v` | `IndexMut<Idx>` | `index_mut(&mut self, idx)` |
| `==` `!=` | `PartialEq` | `eq(&self, other)` |
| `<` `>` `<=` `>=` | `PartialOrd` | `partial_cmp(&self, other)` |

---

## 14. 闭包 Trait：Fn / FnMut / FnOnce

Rust 中每个闭包都实现了 `FnOnce`、`FnMut`、`Fn` 中的一个或多个。

### 三者关系

```
FnOnce          最宽松：消耗捕获的变量（只能调用一次）
  ↑ (supertrait)
FnMut           中间：可变借用捕获的变量（可多次调用）
  ↑ (supertrait)
Fn              最严格：不可变借用捕获的变量（可多次调用，可共享）
```

### 选择规则

```rust
// Fn: 不可变借用环境
let name = String::from("Rust");
let greet = || println!("Hello, {}!", name); // 不可变借用 name
greet(); // ✅ 可多次调用
greet(); // ✅

// FnMut: 可变借用环境
let mut count = 0;
let mut counter = || { count += 1; count }; // 可变借用 count
counter(); // 1
counter(); // 2

// FnOnce: 消耗环境中的值
let name = String::from("Rust");
let consume = move || {
    drop(name); // 消耗了 name
};
consume(); // ✅ 第一次调用没问题
// consume(); // ❌ 不能再调用
```

### 作为函数参数

```rust
// 接受任何闭包（最宽松）
fn call_once<F: FnOnce()>(f: F) {
    f();
}

// 接受可多次调用的闭包
fn call_twice<F: FnMut()>(mut f: F) {
    f();
    f();
}

// 接受最严格的闭包（可共享，可多次调用）
fn call_many<F: Fn()>(f: F) {
    f();
    f();
    f();
}
```

### 闭包作为返回值

```rust
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y // move 将 x 移入闭包
}

let add5 = make_adder(5);
println!("{}", add5(3)); // 8
```

---

## 15. Marker Trait（标记 trait）

标记 trait 没有方法，仅标记类型具有某种属性。

### Send 与 Sync

```rust
// Send: 类型的值可以安全地跨线程转移所有权
// 大多数类型是 Send 的
// 反例: Rc<T> 不是 Send（引用计数不是原子的）

// Sync: 类型的引用 (&T) 可以安全地在多线程间共享
// 如果 T 是 Sync，则 &T 是 Send
// 反例: Cell<T>、RefCell<T> 不是 Sync

// 手动标记（unsafe，需要自行保证安全性）
unsafe impl Send for MyType {}
unsafe impl Sync for MyType {}
```

### Sized

```rust
// 大多数类型默认实现 Sized（编译时已知大小）
// DST（动态大小类型）不实现 Sized: str, [T], dyn Trait

// 泛型参数默认有 Sized 约束
fn foo<T>(t: T) {} // 等价于 fn foo<T: Sized>(t: T) {}

// 使用 ?Sized 放宽约束，允许 DST
fn foo<T: ?Sized>(t: &T) {} // T 可以是 str、[i32] 等
```

### Unpin

```rust
// Unpin: 类型可以安全地从 Pin 中移出
// 几乎所有类型都实现 Unpin
// 反例: async 块生成的 Future 可能是 !Unpin
// 主要在手写 Future 或自引用结构时才需要关心
```

---

## 16. Newtype 模式与孤儿规则

### 问题

孤儿规则不允许为外部类型实现外部 trait：

```rust
// ❌ 不允许：Vec 和 Display 都不是我们定义的
impl fmt::Display for Vec<String> { ... }
```

### Newtype 模式解决

```rust
// 用 tuple struct 包装外部类型
struct Wrapper(Vec<String>);

// 现在 Wrapper 是我们的类型，可以实现任何 trait
impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

// 通过 Deref 透明访问内部类型
impl std::ops::Deref for Wrapper {
    type Target = Vec<String>;
    fn deref(&self) -> &Vec<String> {
        &self.0
    }
}

let w = Wrapper(vec!["hello".into(), "world".into()]);
println!("{}", w);       // Display: [hello, world]
println!("{}", w.len()); // 通过 Deref 访问 Vec 的方法
```

> **零成本**：Newtype 模式在编译时被完全擦除，没有运行时开销。

---

## 17. 常见模式与最佳实践

### 1. 函数参数优先用泛型 + Trait Bound

```rust
// ✅ 推荐：静态分发，零成本
fn process(item: &impl Summary) { ... }

// ⚠️ 只在需要异构集合时使用动态分发
fn process(items: &[Box<dyn Summary>]) { ... }
```

### 2. 返回值用 `impl Trait` 或 `Box<dyn Trait>`

```rust
// 返回单一具体类型
fn create_iter() -> impl Iterator<Item = i32> {
    (0..10).filter(|x| x % 2 == 0)
}

// 返回不同类型
fn create_shape(kind: &str) -> Box<dyn Shape> {
    match kind {
        "circle" => Box::new(Circle { ... }),
        "rect" => Box::new(Rectangle { ... }),
        _ => Box::new(DefaultShape),
    }
}
```

### 3. derive 能用就用，特殊情况再手动实现

```rust
// 常见的 derive 组合
#[derive(Debug, Clone, PartialEq)]            // 基础三件套
#[derive(Debug, Clone, PartialEq, Eq, Hash)]  // 用于 HashMap 键
#[derive(Debug, Clone, Copy, PartialEq)]       // 小型值类型
#[derive(Debug, Default)]                      // 需要默认值
```

### 4. Trait 设计原则

- **小而聚焦**：一个 trait 只做一件事，避免"上帝 trait"
- **利用默认实现**：减少实现者的负担
- **考虑 dyn 兼容性**：如果 trait 可能被用作 trait 对象，避免使用泛型方法和 `-> Self`
- **提供关联类型而非泛型参数**：除非需要同一类型多次实现

### 5. 完全限定语法（消歧义）

当多个 trait 有同名方法时：

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) { println!("机长说话..."); }
}

impl Wizard for Human {
    fn fly(&self) { println!("魔法飞行！"); }
}

impl Human {
    fn fly(&self) { println!("挥动双臂"); }
}

let person = Human;
person.fly();              // 调用 Human 自身的方法："挥动双臂"
Pilot::fly(&person);       // 调用 Pilot 的实现："机长说话..."
Wizard::fly(&person);      // 调用 Wizard 的实现："魔法飞行！"

// 对于没有 &self 参数的关联函数，使用完全限定语法：
// <Type as Trait>::function()
```

### 6. Extension Trait 模式

为现有类型添加方法（不违反孤儿规则）：

```rust
// 为所有 &str 添加自定义方法
trait StrExt {
    fn is_blank(&self) -> bool;
}

impl StrExt for str {
    fn is_blank(&self) -> bool {
        self.trim().is_empty()
    }
}

"  ".is_blank();   // true
"hi".is_blank();   // false
```

---

## 参考资料

- [The Rust Book - Traits: Defining Shared Behavior](https://doc.rust-lang.org/book/ch10-02-traits.html)
- [The Rust Book - Advanced Traits](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html)
- [The Rust Book - Trait Objects](https://doc.rust-lang.org/book/ch18-02-trait-objects.html)
- [The Rust Book - Appendix: Derivable Traits](https://doc.rust-lang.org/book/appendix-03-derivable-traits.html)
- [Rust By Example - Traits](https://doc.rust-lang.org/rust-by-example/trait.html)
- [Tour of Rust's Standard Library Traits (pretzelhammer)](https://github.com/pretzelhammer/rust-blog/blob/master/posts/tour-of-rusts-standard-library-traits.md)
- [Effective Rust - Item 10: Familiarize yourself with standard traits](https://effective-rust.com/std-traits.html)
- [The Rust Reference - Traits](https://doc.rust-lang.org/reference/items/traits.html)
- [Mastering Rust's Trait Objects: A Complete Guide](https://amritsingh183.github.io/rust/concepts/2025/10/23/rust-dyn.html)
