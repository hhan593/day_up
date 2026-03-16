# Rust 引用与借用（References & Borrowing）

## 一、为什么需要引用？

在所有权系统下，把变量传给函数会发生**移动（Move）**，原变量失效：

```rust
fn calculate_length(s: String) -> usize {
    s.len()
}

let s1 = String::from("hello");
let len = calculate_length(s1);
// println!("{}", s1);  // 错误！s1 已被移动，所有权转走了
```

每次调用都转移所有权再返回太麻烦。**引用**就是为了解决这个问题——允许你**使用值但不获取所有权**。

## 二、引用的定义

引用（Reference）用 `&` 创建，像一个指针，指向某个值的地址，但**编译器保证引用永远指向有效的值**（不会悬垂）。

```rust
fn calculate_length(s: &String) -> usize {  // s 是一个引用
    s.len()
}  // s 离开作用域，但因为它没有所有权，所以什么也不会发生

let s1 = String::from("hello");
let len = calculate_length(&s1);  // &s1 创建一个指向 s1 的引用
println!("{}", s1);  // OK！s1 依然有效
```

创建引用的行为叫做**借用（Borrowing）**。就像现实生活中借东西——你借了别人的东西，用完要还，东西不是你的。

> We call the action of creating a reference **borrowing**. As in real life, if a person owns something, you can borrow it from them. When you're done, you have to give it back. You don't own it.
>
> — *The Rust Programming Language*

## 三、两种引用与读写权限

### 1. 不可变引用 `&T` — 只有读权限

正如变量默认不可变，引用也默认不可变。不可变引用**只借走读权限**，没有写权限。

```rust
fn change(some_string: &String) {
    some_string.push_str(", world");  // 编译错误！不可变引用不能修改
}
```

可以同时存在**多个不可变引用**，因为多个读者不会互相干扰：

```rust
let s = String::from("hello");
let r1 = &s;  // OK
let r2 = &s;  // OK，多个不可变引用可以共存
println!("{} and {}", r1, r2);
```

### 2. 可变引用 `&mut T` — 拥有读权限 + 写权限

```rust
fn change(some_string: &mut String) {
    some_string.push_str(", world");  // OK！可以修改
}

let mut s = String::from("hello");
change(&mut s);
```

注意两个前提条件：

- 变量本身必须声明为 `mut`
- 引用必须用 `&mut` 创建

### 3. 权限总结表

| 角色 | 语法 | 读 | 写 | 能同时存在多个？ |
|------|------|:--:|:--:|:----------------:|
| 拥有者（owner） | `let mut x` | Yes | Yes | — |
| 不可变引用 | `&T` | Yes | No | Yes |
| 可变引用 | `&mut T` | Yes | Yes | No（同一时刻只能一个） |

### 4. 权限借出模型

从"权限借出"的角度理解：

```
原始变量拥有：读权限 + 写权限 + 所有权

创建 &T 时：
  → 原始变量：暂时失去写权限（保留读权限）
  → 引用 &T：获得读权限
  → 效果：数据变成只读，谁都不能改

创建 &mut T 时：
  → 原始变量：暂时失去读权限和写权限
  → 引用 &mut T：获得读权限 + 写权限
  → 效果：只有可变引用能访问数据（排他性）
```

示例：

```rust
let mut v = vec![1, 2, 3];
let r = &v[0];   // 不可变借用 → v 失去写权限
v.push(4);       // 编译错误！v 当前没有写权限
println!("{}", r);
```

`v.push()` 需要 `&mut self`（写权限），但不可变借用 `r` 存活期间，`v` 的写权限已被冻结。

## 四、借用的核心规则

Rust 官方文档明确了两条规则：

> **At any given time, you can have either one mutable reference or any number of immutable references.**
>
> **References must always be valid.**

翻译：

1. **在任意时刻**，要么只能有**一个可变引用**，要么只能有**任意数量的不可变引用**，二者不能同时存在。
2. **引用必须始终有效**（不允许悬垂引用）。

### 规则 1：可变引用的排他性

```rust
let mut s = String::from("hello");

let r1 = &mut s;
let r2 = &mut s;  // 编译错误！不能同时有两个可变引用

println!("{}, {}", r1, r2);
```

**为什么？** 防止**数据竞争（data race）**。数据竞争在以下三个条件同时满足时发生：

- 两个或更多指针同时访问同一数据
- 至少有一个指针被用来写入数据
- 没有同步机制

Rust 在**编译期**就杜绝了数据竞争。

### 可变引用与不可变引用不能共存

```rust
let mut s = String::from("hello");

let r1 = &s;      // OK：不可变引用
let r2 = &s;      // OK：不可变引用
let r3 = &mut s;  // 编译错误！已有不可变引用时不能创建可变引用

println!("{}, {}, and {}", r1, r2, r3);
```

持有不可变引用的人不会预期值突然被改变。

### 规则 2：不允许悬垂引用

```rust
fn dangle() -> &String {           // 返回一个引用
    let s = String::from("hello"); // s 在此函数内创建
    &s                             // 返回 s 的引用
}  // s 离开作用域被释放，引用指向无效内存！编译错误！
```

编译器保证引用永远不会悬垂——如果你引用了某个数据，编译器会确保数据不会在引用之前离开作用域。

正确做法是直接返回所有权：

```rust
fn no_dangle() -> String {
    let s = String::from("hello");
    s  // 返回 String，所有权转移给调用者
}
```

## 五、NLL（Non-Lexical Lifetimes）

Rust 1.31 之后引入了 NLL，引用的作用域不再是到 `}` 结束，而是到**最后一次使用**为止：

```rust
let mut s = String::from("hello");

let r1 = &s;
let r2 = &s;
println!("{} and {}", r1, r2);
// r1 和 r2 在此之后不再使用，它们的作用域到此结束

let r3 = &mut s;  // OK！因为 r1 和 r2 已经"死了"
println!("{}", r3);
```

编译器在作用域结束之前判断不再使用的引用的能力，被称为**非词法作用域生命周期（Non-Lexical Lifetimes，简称 NLL）**。

## 六、总结

| 概念 | 说明 |
|------|------|
| `&T`（不可变引用） | 借走读权限，可多个共存 |
| `&mut T`（可变引用） | 借走读+写权限，排他，同时只能有一个 |
| 借用不转移所有权 | 引用离开作用域时，原数据不会被释放 |
| NLL | 引用的生命周期到最后一次使用为止，不是到 `}` |
| 悬垂引用 | 编译器禁止引用指向已释放的数据 |
| 数据竞争 | 借用规则在编译期阻止了数据竞争 |

## 参考资料

- [References and Borrowing - The Rust Programming Language](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [引用与借用 - Rust语言圣经](https://course.rs/basic/ownership/borrowing.html)
- [引用与借用 - Rust 程序设计语言 中文版](https://rustwiki.org/zh-CN/book/ch04-02-references-and-borrowing.html)
- [Borrowing - Rust By Example](https://doc.rust-lang.org/rust-by-example/scope/borrow.html)
- [理解可变引用的排他性 - Rust入门秘籍](https://rust-book.junmajinlong.com/ch6/04_understand_mutable_ref.html)
