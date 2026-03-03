# Rust 泛型、Trait 与生命周期知识手册

> 泛型、Trait 和生命周期是 Rust 最核心的抽象机制。泛型提供类型参数化，Trait 定义共享行为，生命周期保证引用安全。三者经常组合使用，构成 Rust 类型系统的基石。

---

## 目录

1. [泛型（Generics）](#1-泛型generics)
2. [Trait（特征）](#2-trait特征)
3. [生命周期（Lifetimes）](#3-生命周期lifetimes)
4. [三者结合使用](#4-三者结合使用)
5. [常见误解与陷阱](#5-常见误解与陷阱)
6. [参考资料](#6-参考资料)

---

## 1. 泛型（Generics）

### 1.1 什么是泛型

泛型是具体类型或属性的抽象替代。通过泛型，可以编写适用于多种类型的代码，而无需为每种类型重复编写逻辑。

**核心优势**：代码复用 + 类型安全 + 零运行时开销。

### 1.2 泛型函数

```rust
// 没有泛型：需要为每种类型写一个函数
fn largest_i32(list: &[i32]) -> &i32 { /* ... */ }
fn largest_f64(list: &[f64]) -> &f64 { /* ... */ }

// 使用泛型：一个函数适用于所有可比较的类型
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in &list[1..] {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大数: {}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大字符: {}", largest(&chars));
}
```

类型参数声明在函数名和参数列表之间的尖括号 `<>` 中。按惯例，使用大写驼峰命名：`T`、`U`、`V` 等。

### 1.3 泛型结构体

```rust
// 单一类型参数：x 和 y 必须是相同类型
struct Point<T> {
    x: T,
    y: T,
}

// 多类型参数：x 和 y 可以是不同类型
struct Point2<T, U> {
    x: T,
    y: U,
}

fn main() {
    let integer_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };
    // let wont_work = Point { x: 5, y: 4.0 }; // 编译错误！T 不能同时是 i32 和 f64

    let mixed = Point2 { x: 5, y: 4.0 }; // 正确：T=i32, U=f64
}
```

### 1.4 泛型枚举

标准库中最重要的两个泛型枚举：

```rust
// Option<T>：值可能存在也可能不存在
enum Option<T> {
    Some(T),
    None,
}

// Result<T, E>：操作可能成功也可能失败
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

自定义泛型枚举：

```rust
enum Shape<T> {
    Circle(T),           // 半径
    Rectangle(T, T),     // 宽和高
}

let circle = Shape::Circle(5.0_f64);
let rect = Shape::Rectangle(10, 20);
```

### 1.5 泛型方法（impl 块）

```rust
struct Point<T> {
    x: T,
    y: T,
}

// 为所有 Point<T> 实现方法
impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// 仅为 Point<f64> 实现特定方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

// 方法中使用不同的泛型参数
impl<T, U> Point2<T, U> {
    fn mixup<V, W>(self, other: Point2<V, W>) -> Point2<T, W> {
        Point2 {
            x: self.x,
            y: other.y,
        }
    }
}
```

注意：`impl<T>` 中的 `<T>` 声明告诉编译器 `Point<T>` 中的 `T` 是泛型而非具体类型。

### 1.6 const 泛型（常量泛型）

Rust 1.51 引入，允许以常量值作为泛型参数：

```rust
// N 是一个 const 泛型参数
fn display_array<T: std::fmt::Debug, const N: usize>(arr: [T; N]) {
    println!("{:?}", arr);
}

fn main() {
    let arr1 = [1, 2, 3];
    let arr2 = [1, 2, 3, 4, 5];
    display_array(arr1); // N = 3
    display_array(arr2); // N = 5
}
```

### 1.7 单态化（Monomorphization）— 零成本抽象

Rust 在编译时对泛型代码执行**单态化**：为每个使用到的具体类型生成专用代码。

```rust
// 源代码
let integer = Some(5);
let float = Some(5.0);

// 编译器生成的等价代码（概念上）
enum Option_i32 { Some(i32), None }
enum Option_f64 { Some(f64), None }

let integer = Option_i32::Some(5);
let float = Option_f64::Some(5.0);
```

**结论**：使用泛型不会有任何运行时性能损失。代价是编译时间增加和二进制体积可能变大。

---

## 2. Trait（特征）

### 2.1 什么是 Trait

Trait 定义了一组方法签名，描述某种类型应该具有的行为。类似于其他语言中的接口（interface），但功能更强大。

### 2.2 定义与实现 Trait

```rust
// 定义 Trait
pub trait Summary {
    fn summarize(&self) -> String;
}

// 为类型实现 Trait
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

**孤儿规则（Orphan Rule）**：只有当 trait 或类型至少有一个定义在当前 crate 中时，才能为该类型实现该 trait。不能为外部类型实现外部 trait，只能为自己的实现。

### 2.3 默认实现

```rust
pub trait Summary {
    // 带有默认实现的方法
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

// 实现时可以只实现必需方法，使用默认实现的其他方法
impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // summarize() 使用默认实现
}
```

### 2.4 Trait 作为参数（Trait Bound）

三种等价语法：

```rust
// 语法 1：impl Trait（语法糖，简洁）
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}

// 语法 2：Trait Bound（通用形式）
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// 语法 3：where 子句（适合复杂约束）
pub fn notify<T>(item: &T)
where
    T: Summary,
{
    println!("Breaking news! {}", item.summarize());
}
```

### 2.5 多重 Trait 约束

```rust
// 使用 + 语法
pub fn notify(item: &(impl Summary + Display)) { /* ... */ }

// Trait Bound 形式
pub fn notify<T: Summary + Display>(item: &T) { /* ... */ }

// where 子句（推荐用于复杂情况）
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}
```

### 2.6 Trait 作为返回类型

```rust
// 返回实现了某 Trait 的类型
fn returns_summarizable() -> impl Summary {
    Tweet {
        username: String::from("horse_ebooks"),
        content: String::from("of course..."),
    }
}
```

**限制**：`impl Trait` 返回类型只能返回**单一具体类型**。以下代码不能编译：

```rust
// 编译错误！不能返回不同的具体类型
fn returns_summarizable(switch: bool) -> impl Summary {
    if switch {
        NewsArticle { /* ... */ }  // 类型 A
    } else {
        Tweet { /* ... */ }        // 类型 B  ← 不兼容
    }
}
```

### 2.7 Trait 对象与动态分发（dyn Trait）

当需要在运行时处理不同类型时，使用 trait 对象：

```rust
// trait 对象：通过引用或 Box 持有
pub fn notify_dynamic(item: &dyn Summary) {
    println!("Breaking news! {}", item.summarize());
}

// 异构集合：存储不同类型的 trait 对象
let articles: Vec<Box<dyn Summary>> = vec![
    Box::new(NewsArticle { /* ... */ }),
    Box::new(Tweet { /* ... */ }),
];

for article in &articles {
    println!("{}", article.summarize());
}
```

### 2.8 impl Trait vs dyn Trait 对比

| 特性 | `impl Trait` (静态分发) | `dyn Trait` (动态分发) |
|------|------------------------|----------------------|
| 分发方式 | 编译时单态化 | 运行时通过 vtable |
| 性能 | 零开销，可内联 | 有间接调用开销 |
| 异构集合 | 不支持 | 支持 |
| 二进制大小 | 可能膨胀（每种类型一份代码） | 更紧凑 |
| 内存布局 | 普通指针 | 胖指针（值指针 + vtable 指针） |
| 返回不同类型 | 不支持（单一具体类型） | 支持 |

### 2.9 对象安全（dyn 兼容性）

不是所有 Trait 都可以作为 trait 对象使用。Trait 必须是**对象安全的**（dyn-compatible）：

- 方法的返回类型不能是 `Self`
- 方法不能有泛型类型参数
- 所有 supertrait 也必须是对象安全的
- 不能要求 `Self: Sized`

```rust
// 对象安全的 Trait
trait Draw {
    fn draw(&self);
}

// 不是对象安全的 Trait（返回 Self）
trait Clone {
    fn clone(&self) -> Self;  // 返回 Self，不能作为 dyn Clone
}
```

### 2.10 关联类型（Associated Types）

关联类型将类型占位符与 Trait 关联，在实现时指定具体类型：

```rust
// 标准库的 Iterator trait
pub trait Iterator {
    type Item;  // 关联类型

    fn next(&mut self) -> Option<Self::Item>;
}

// 实现时指定 Item 的具体类型
impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < 5 {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}
```

**关联类型 vs 泛型参数的区别**：

```rust
// 泛型：可以为同一类型多次实现（不同的 T）
trait Container<T> {
    fn get(&self) -> T;
}

// 关联类型：只能实现一次，Item 类型唯一确定
trait Container {
    type Item;
    fn get(&self) -> Self::Item;
}
```

### 2.11 Supertrait（超特征）

一个 Trait 可以要求实现者同时实现其他 Trait：

```rust
use std::fmt;

// OutlinePrint 要求实现者同时实现 Display
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

// 必须先实现 Display...
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// ...才能实现 OutlinePrint
impl OutlinePrint for Point {}
```

### 2.12 常用的 derive 宏

Rust 允许通过 `#[derive]` 自动为类型生成常见 Trait 的实现：

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
struct User {
    name: String,
    age: u32,
}
```

常用可 derive 的 Trait：

| Trait | 功能 |
|-------|------|
| `Debug` | `{:?}` 格式化输出 |
| `Clone` | 深拷贝 (`clone()`) |
| `Copy` | 按位复制（赋值时自动复制而非移动） |
| `PartialEq` / `Eq` | `==` 和 `!=` 比较 |
| `PartialOrd` / `Ord` | `<`、`>`、`<=`、`>=` 比较和排序 |
| `Hash` | 哈希值计算（用于 HashMap 等） |
| `Default` | 默认值 (`Default::default()`) |
| `Serialize` / `Deserialize` | 序列化（来自 serde 库） |

### 2.13 使用 Trait Bound 有条件地实现方法

```rust
use std::fmt::Display;

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

// 只有 T 实现了 Display + PartialOrd 时，Pair<T> 才有 cmp_display 方法
impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("最大的是 x = {}", self.x);
        } else {
            println!("最大的是 y = {}", self.y);
        }
    }
}
```

### 2.14 覆盖实现（Blanket Implementation）

为所有满足条件的类型统一实现 Trait：

```rust
// 标准库中的经典覆盖实现：
// 任何实现了 Display 的类型，自动获得 ToString
impl<T: Display> ToString for T {
    fn to_string(&self) -> String {
        format!("{}", self)
    }
}
```

---

## 3. 生命周期（Lifetimes）

### 3.1 什么是生命周期

生命周期是 Rust 编译器用来确保所有引用始终有效的机制。每个引用都有一个生命周期——引用保持有效的作用域。

生命周期的核心目的：**防止悬垂引用（dangling references）**。

```rust
fn main() {
    let r;                   // --------+-- 'a
    {                        //         |
        let x = 5;           // -+-- 'b |
        r = &x;              //  |      |  ← 编译错误！x 的生命周期 'b 短于 r 的 'a
    }                        // -+      |
    println!("r: {}", r);    //         |
}                            // --------+
```

### 3.2 借用检查器（Borrow Checker）

借用检查器是 Rust 编译器的核心组件，它比较引用的生命周期来确保所有借用都是有效的。

```rust
fn main() {
    let x = 5;            // ----------+-- 'b
    let r = &x;           // --+-- 'a  |
    println!("r: {}", r); //   |       |   ← 正确！'b 比 'a 长，引用始终有效
}                          // --+-------+
```

### 3.3 函数中的生命周期注解

当函数接收多个引用参数并返回引用时，编译器需要知道返回值的生命周期与哪个参数相关：

```rust
// 编译错误！编译器不知道返回的引用与 x 还是 y 的生命周期相关
// fn longest(x: &str, y: &str) -> &str { ... }

// 正确：使用生命周期注解
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

**解读 `<'a>`**：
- `'a` 是生命周期参数，声明在 `<>` 中
- `x: &'a str` 表示 x 的引用至少存活 `'a` 这么长
- `y: &'a str` 表示 y 的引用至少存活 `'a` 这么长
- `-> &'a str` 表示返回值的引用至少存活 `'a` 这么长
- 实际上 `'a` 是 x 和 y 生命周期中**较短的那个**

### 3.4 生命周期注解的含义

生命周期注解是**描述性的，不是规定性的**。它们不会改变引用的实际存活时间，而是告诉编译器引用之间的生命周期关系。

```rust
fn main() {
    let string1 = String::from("long string is long");
    let result;

    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("最长的字符串是: {}", result); // 正确：result 在 string2 有效时使用
    }
    // println!("{}", result); // 编译错误！string2 已经失效，result 可能引用它
}
```

### 3.5 结构体中的生命周期

当结构体持有引用时，必须添加生命周期注解：

```rust
// 结构体持有引用，必须声明生命周期
struct ImportantExcerpt<'a> {
    part: &'a str,  // part 引用的数据必须比 ImportantExcerpt 实例存活更久
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence;

    {
        let i = ImportantExcerpt {
            part: &novel[..19], // novel 的生命周期比 i 长，合法
        };
        first_sentence = i.part;
    }
    println!("{}", first_sentence); // 合法：novel 仍然有效
}
```

### 3.6 方法中的生命周期

```rust
impl<'a> ImportantExcerpt<'a> {
    // 不需要标注：生命周期省略规则第 3 条（&self 的生命周期赋予返回值）
    fn level(&self) -> i32 {
        3
    }

    // 同样适用省略规则第 3 条
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {}", announcement);
        self.part
    }
}
```

### 3.7 生命周期省略规则（Lifetime Elision Rules）

编译器自动推断生命周期的三条规则：

**规则 1**：每个引用参数都获得独立的生命周期参数。

```rust
fn foo(x: &str)          → fn foo<'a>(x: &'a str)
fn foo(x: &str, y: &str) → fn foo<'a, 'b>(x: &'a str, y: &'b str)
```

**规则 2**：如果只有一个输入生命周期参数，该生命周期赋予所有输出生命周期。

```rust
fn foo(x: &str) -> &str  → fn foo<'a>(x: &'a str) -> &'a str
```

**规则 3**：如果有 `&self` 或 `&mut self` 参数，`self` 的生命周期赋予所有输出生命周期。

```rust
fn method(&self, x: &str) -> &str  → fn method<'a, 'b>(&'a self, x: &'b str) -> &'a str
```

**如果三条规则都不能确定输出生命周期，则必须手动标注。**

### 3.8 'static 生命周期

`'static` 表示引用在整个程序运行期间都有效：

```rust
// 字符串字面量都是 'static（存储在程序二进制中）
let s: &'static str = "我有 static 生命周期";

// 常量和静态变量隐含 'static
static GREETING: &str = "Hello";  // 等价于 &'static str
const PI: &f64 = &3.14159;        // 等价于 &'static f64
```

`T: 'static` 的含义：

```rust
// T: 'static 意味着 T 可以安全地存活任意长时间
// 它不意味着 T 必须是 'static 引用！
// 拥有所有权的类型（如 String、Vec<T>）天然满足 'static
fn print_it<T: Display + 'static>(input: T) {
    println!("{}", input);
}

fn main() {
    let s = String::from("hello");
    print_it(s);  // 正确！String 拥有数据，满足 'static
    // print_it(&s); // 编译错误！&s 的生命周期不是 'static
}
```

### 3.9 生命周期子类型

较长的生命周期是较短生命周期的**子类型**：

```rust
// 'static 是所有生命周期的子类型
// 如果 'a: 'b（读作 'a outlives 'b），则 'a 至少和 'b 一样长
// 'static: 'a 对所有 'a 成立

fn select<'a, 'b: 'a>(s1: &'a str, s2: &'b str) -> &'a str {
    // 'b: 'a 表示 'b 至少和 'a 一样长
    if s1.len() > s2.len() { s1 } else { s2 }
}
```

### 3.10 高阶 Trait 约束（HRTB）

`for<'a>` 语法表示"对于所有可能的生命周期 'a"：

```rust
// 闭包的生命周期约束
fn apply_to_ref<F>(f: F)
where
    F: for<'a> Fn(&'a str) -> &'a str,  // F 必须适用于任意生命周期的引用
{
    let owned = String::from("hello");
    let result = f(&owned);
    println!("{}", result);
}

// 实际使用中，Fn(&str) -> &str 会自动推断为 for<'a> Fn(&'a str) -> &'a str
fn apply_to_ref_simple<F>(f: F)
where
    F: Fn(&str) -> &str,  // 等价于上面的写法（生命周期省略）
{
    let owned = String::from("hello");
    let result = f(&owned);
    println!("{}", result);
}
```

---

## 4. 三者结合使用

### 4.1 经典综合示例

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("公告: {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

- `'a`：生命周期参数，约束返回值与输入引用的生命周期关系
- `T`：泛型类型参数
- `T: Display`：Trait 约束，要求 T 实现 Display

### 4.2 带生命周期的泛型结构体 + Trait 实现

```rust
use std::fmt;

#[derive(Debug)]
struct Wrapper<'a, T: fmt::Display> {
    value: &'a T,
}

impl<'a, T: fmt::Display> fmt::Display for Wrapper<'a, T> {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Wrapped: {}", self.value)
    }
}

fn wrap_and_print<'a, T: fmt::Display>(val: &'a T) -> Wrapper<'a, T> {
    let w = Wrapper { value: val };
    println!("{}", w);
    w
}
```

### 4.3 Trait 对象与生命周期

```rust
// trait 对象默认有 'static 生命周期约束（某些场景下）
trait Greet {
    fn greet(&self) -> String;
}

struct Person { name: String }

impl Greet for Person {
    fn greet(&self) -> String {
        format!("Hello, I'm {}", self.name)
    }
}

// 返回拥有所有权的 trait 对象
fn create_greeter() -> Box<dyn Greet> {
    Box::new(Person { name: "Alice".into() })
}

// 返回有生命周期约束的 trait 对象
fn get_greeter<'a>(people: &'a [Person]) -> Box<dyn Greet + 'a> {
    Box::new(&people[0]) // 需要为 &Person 也实现 Greet
}
```

---

## 5. 常见误解与陷阱

### 5.1 泛型相关

| 误解 | 事实 |
|------|------|
| 泛型有运行时开销 | 单态化确保零运行时开销 |
| 泛型总是最好的选择 | 过多的泛型参数导致代码膨胀，trait 对象可能更合适 |
| `impl Trait` 和 `dyn Trait` 一样 | 前者是静态分发（编译期），后者是动态分发（运行期） |

### 5.2 Trait 相关

| 误解 | 事实 |
|------|------|
| Trait 等同于接口 | Trait 更强大：支持默认实现、关联类型、覆盖实现等 |
| 所有 Trait 都可以作为 trait 对象 | 只有对象安全的 Trait 才行 |
| `impl Trait` 返回类型可以返回不同类型 | 只能返回单一具体类型 |

### 5.3 生命周期相关

| 误解 | 事实 |
|------|------|
| 生命周期注解改变引用的存活时间 | 注解是描述性的，不会延长或缩短引用的生命周期 |
| `T: 'static` 意味着 T 必须是 `&'static` 引用 | `T: 'static` 包括所有拥有所有权的类型（String、Vec 等） |
| 生命周期省略规则总是正确的 | 省略规则是启发式的，某些情况下编译器的推断可能过于保守 |
| 更长的生命周期总是更好 | 使用比必要更长的生命周期会限制代码的灵活性 |
| `&'a T` 和 `T: 'a` 一样 | `&'a T` 是对 T 的引用；`T: 'a` 要求 T 中的所有引用至少存活 'a |

### 5.4 常见编译错误及解决方案

```rust
// 错误 1：缺少生命周期标注
// fn first_word(s: &str) -> &str { ... }
// 这个实际上是合法的！省略规则第 2 条：单一输入生命周期 → 赋予输出

// 错误 2：返回局部变量的引用
fn bad() -> &String {           // 编译错误！
    let s = String::from("hi");
    &s                          // s 在函数结束时被释放
}
// 修复：返回拥有所有权的值
fn good() -> String {
    String::from("hi")
}

// 错误 3：生命周期约束不足
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x  // 只能返回 x，因为只有 x 与返回值共享生命周期 'a
    // y  ← 编译错误！y 没有 'a 约束
}
```

---

## 6. 参考资料

### 官方文档

- [The Rust Programming Language - Ch.10: 泛型、Trait 和生命周期](https://doc.rust-lang.org/book/ch10-00-generics.html)
- [The Rust Programming Language - Ch.20: 高级 Trait](https://doc.rust-lang.org/book/ch20-02-advanced-traits.html)
- [The Rust Reference - Trait Bounds](https://doc.rust-lang.org/reference/trait-bounds.html)
- [The Rust Reference - Lifetime Elision](https://doc.rust-lang.org/reference/lifetime-elision.html)
- [The Rustonomicon - Higher-Ranked Trait Bounds](https://doc.rust-lang.org/nomicon/hrtb.html)
- [Rust By Example - Traits](https://doc.rust-lang.org/rust-by-example/trait.html)

### 中文资源

- [Rust 程序设计语言简体中文版 - 泛型、Trait 和生命周期](https://kaisery.github.io/trpl-zh-cn/ch10-00-generics.html)
- [Rust 语言圣经 - 泛型 Generics](https://course.rs/basic/trait/generic.html)
- [菜鸟教程 - Rust 泛型与特性](https://www.runoob.com/rust/rust-generics.html)

### 深度阅读

- [Common Rust Lifetime Misconceptions (pretzelhammer)](https://github.com/pretzelhammer/rust-blog/blob/master/posts/common-rust-lifetime-misconceptions.md)
- [Effective Rust - Item 14: Understand Lifetimes](https://lurklurk.org/effective-rust/lifetimes.html)
- [dyn Trait and impl Trait in Rust (Nick Cameron)](https://www.ncameron.org/blog/dyn-trait-and-impl-trait-in-rust/)
- [Rust Static vs Dynamic Dispatch (SoftwareMill)](https://softwaremill.com/rust-static-vs-dynamic-dispatch/)
