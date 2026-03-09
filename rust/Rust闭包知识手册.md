# Rust 闭包（Closures）完全指南

## 目录

1. [闭包的定义和语法](#1-闭包的定义和语法)
2. [闭包捕获环境变量的三种方式](#2-闭包捕获环境变量的三种方式)
3. [move 关键字的使用](#3-move-关键字的使用)
4. [闭包作为函数参数和返回值](#4-闭包作为函数参数和返回值)
5. [闭包的类型推断](#5-闭包的类型推断)
6. [闭包与函数指针的区别](#6-闭包与函数指针的区别)
7. [实际使用场景和示例代码](#7-实际使用场景和示例代码)

---

## 1. 闭包的定义和语法

### 什么是闭包？

闭包是一个能够**捕获周围环境变量**的**匿名函数**。它是 Rust 中强大的函数式编程特性。

### 闭包的多种写法

```rust
fn main() {
    // 1. 最简洁的单行闭包
    let square = |x| x * x;
    println!("{}", square(5));  // 25

    // 2. 带类型注解的闭包
    let add = |x: i32, y: i32| -> i32 { x + y };
    println!("{}", add(3, 4));  // 7

    // 3. 多行闭包（使用花括号）
    let greet = |name: &str| {
        let greeting = format!("你好, {}", name);
        println!("{}", greeting);
        greeting
    };
    greet("小明");

    // 4. 捕获环境变量的闭包
    let num = 5;
    let add_num = |x| x + num;
    println!("{}", add_num(3));  // 8

    // 5. 没有参数的闭包
    let get_value = || 42;
    println!("{}", get_value());  // 42

    // 6. 捕获多个变量的闭包
    let x = 10;
    let y = 20;
    let combine = || x + y;
    println!("{}", combine());  // 30
}
```

### 闭包 vs 普通函数语法对比

```rust
// 普通函数
fn add_one_fn(x: i32) -> i32 { x + 1 }

// 闭包的等价写法（从完整到简化）
let add_one_v1 = |x: i32| -> i32 { x + 1 };  // 完整注解
let add_one_v2 = |x: i32|          x + 1  ;   // 省略返回类型和花括号
let add_one_v3 = |x|               x + 1  ;   // 省略参数类型（由编译器推断）
```

---

## 2. 闭包捕获环境变量的三种方式

Rust 中闭包捕获变量的方式对应三个 trait：`Fn`、`FnMut`、`FnOnce`。编译器根据闭包如何使用环境变量来自动推断。

### 2.1 Fn — 不可变借用

闭包只读取环境变量，不做任何修改。可以调用多次。

```rust
fn main() {
    let config = vec![1, 2, 3];

    // 闭包只读取 config，不修改它
    let print_config = || {
        println!("配置: {:?}", config);
        println!("配置长度: {}", config.len());
    };

    print_config();
    print_config();  // 可以多次调用

    // 原变量仍然可用
    println!("config 仍然存在: {:?}", config);
}
```

### 2.2 FnMut — 可变借用

闭包需要修改环境变量。可以调用多次，但在闭包活动期间，环境变量被可变借用。

```rust
fn main() {
    let mut numbers = vec![1, 2, 3];

    // 闭包需要修改 numbers
    let mut add_to_list = |x| {
        numbers.push(x);
        println!("添加 {}，列表现在有 {} 个元素", x, numbers.len());
    };

    add_to_list(4);
    add_to_list(5);

    // 闭包活动结束后才能使用 numbers
    drop(add_to_list);
    println!("最终列表: {:?}", numbers);
}
```

### 2.3 FnOnce — 所有权转移

闭包捕获变量的所有权，只能调用一次。

```rust
fn main() {
    let s = String::from("hello");

    // 这个闭包获取 s 的所有权
    let consume = || {
        let upper = s.to_uppercase();
        println!("消费: {}", upper);
        drop(s);  // s 在闭包中被消费
    };

    consume();
    // consume();  // 错误！FnOnce 只能调用一次
    // println!("{}", s);  // 错误！s 的所有权已被转移
}
```

### 三种 Trait 对比表

| Trait    | 捕获方式   | 可调用次数 | 使用场景         |
| -------- | ---------- | ---------- | ---------------- |
| `Fn`     | 不可变借用 | 无限       | 只读取环境变量   |
| `FnMut`  | 可变借用   | 无限       | 修改环境变量     |
| `FnOnce` | 所有权转移 | 一次       | 消耗或转移所有权 |

### Trait 之间的继承关系

```text
FnOnce  ←  FnMut  ←  Fn
（最宽泛）          （最严格）
```

- 所有闭包都实现了 `FnOnce`
- 实现了 `Fn` 的闭包也自动实现了 `FnMut` 和 `FnOnce`
- 实现了 `FnMut` 的闭包也自动实现了 `FnOnce`

---

## 3. move 关键字的使用

`move` 关键字强制闭包**获取其捕获变量的所有权**，而不是借用。

### 基本用法

```rust
fn main() {
    let s = String::from("hello");

    // 没有 move：编译器推断借用
    let closure1 = || println!("{}", s);  // 不可变借用
    closure1();
    println!("{}", s);  // 仍然可以使用 s

    let s2 = String::from("world");

    // 使用 move：强制转移所有权
    let closure2 = move || println!("{}", s2);
    closure2();
    // println!("{}", s2);  // 错误！所有权已被转移
}
```

### 最常见场景：多线程

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    // 必须使用 move，确保变量所有权转移到新线程
    let handle = thread::spawn(move || {
        println!("线程中的向量: {:?}", v);
    });

    // println!("{:?}", v);  // 错误！v 已被移入线程
    handle.join().unwrap();
}
```

### move 对 Copy 类型的影响

```rust
fn main() {
    let x = 42;  // i32 实现了 Copy

    // move 对 Copy 类型会复制值，原变量仍可用
    let closure = move || println!("{}", x);
    closure();
    println!("{}", x);  // 仍然可以使用 x（因为 i32 是 Copy 类型）
}
```

---

## 4. 闭包作为函数参数和返回值

### 4.1 闭包作为函数参数

```rust
// 使用泛型 + trait bound
fn apply<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}

// 使用 where 子句（更清晰）
fn apply_mut<F>(mut f: F, x: i32) -> i32
where
    F: FnMut(i32) -> i32,
{
    f(x)
}

// 使用 FnOnce
fn apply_once<F: FnOnce(i32) -> i32>(f: F, x: i32) -> i32 {
    f(x)
}

fn main() {
    let double = |x| x * 2;
    println!("{}", apply(double, 5));  // 10
}
```

### 4.2 闭包作为返回值

```rust
// 方式1：使用 impl Fn（静态分发，推荐）
fn create_multiplier(factor: i32) -> impl Fn(i32) -> i32 {
    move |x| x * factor
}

// 方式2：使用 Box<dyn Fn>（动态分发，可返回不同类型的闭包）
fn create_operation(op: &str) -> Box<dyn Fn(i32, i32) -> i32> {
    match op {
        "add" => Box::new(|a, b| a + b),
        "sub" => Box::new(|a, b| a - b),
        "mul" => Box::new(|a, b| a * b),
        _     => Box::new(|a, b| a / b),
    }
}

fn main() {
    let triple = create_multiplier(3);
    println!("{}", triple(5));  // 15

    let add = create_operation("add");
    println!("{}", add(10, 20));  // 30
}
```

---

## 5. 闭包的类型推断

### 推断规则

```rust
fn main() {
    // 编译器推断参数类型为 i32
    let add = |x, y| x + y;
    let result = add(3, 4);  // 推断为 i32

    // 一旦确定了类型，就不能改变
    // let result2 = add(3.0, 4.0);  // 错误！已推断为 i32
}
```

### 每个闭包都有独特的类型

```rust
fn main() {
    let closure_a = |x: i32| x + 1;
    let closure_b = |x: i32| x + 1;

    // closure_a 和 closure_b 是不同的类型，即使签名相同！
    // let mut f = closure_a;
    // f = closure_b;  // 错误！类型不匹配

    // 如果需要统一类型，可使用函数指针或 Box<dyn Fn>
    let funcs: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(closure_a),
        Box::new(closure_b),
    ];
}
```

---

## 6. 闭包与函数指针的区别

| 特性     | 闭包                                | 函数指针           |
| -------- | ----------------------------------- | ------------------ |
| 捕获变量 | 可以                                | 不能               |
| 大小     | 可变（无捕获时为 0）                | 固定（通常 8 字节）|
| 语法     | `\|x\| x + 1`                      | `fn(i32) -> i32`   |
| 存储     | 需要泛型或 `Box<dyn Fn>`           | 可直接存储         |
| 类型     | 每个闭包是独特的匿名类型           | `fn(...)` 是具体类型|

```rust
fn double(x: i32) -> i32 { x * 2 }

fn main() {
    // 函数指针：固定大小，不能捕获变量
    let func_ptr: fn(i32) -> i32 = double;

    // 闭包：可以捕获变量
    let factor = 3;
    let closure = |x: i32| x * factor;

    // 函数指针可以直接存储在 Vec 中
    let operations: Vec<fn(i32) -> i32> = vec![
        |x| x + 1,
        |x| x * 2,
    ];

    // 闭包需要 Box<dyn Fn> 才能存储在集合中
    let closures: Vec<Box<dyn Fn(i32) -> i32>> = vec![
        Box::new(|x| x + 1),
        Box::new(closure),
    ];

    println!("函数指针大小: {} 字节", std::mem::size_of_val(&func_ptr));
    // 8 字节
}
```

---

## 7. 实际使用场景和示例代码

### 场景 1：懒加载（Option::unwrap_or_else）

```rust
struct Inventory {
    shirts: Vec<String>,
}

impl Inventory {
    fn giveaway(&self, user_preference: Option<String>) -> String {
        // 闭包只在 None 时才执行（惰性求值）
        user_preference.unwrap_or_else(|| self.most_stocked())
    }

    fn most_stocked(&self) -> String {
        // 复杂计算...
        "Red".to_string()
    }
}
```

### 场景 2：迭代器链

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    let result: Vec<i32> = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)   // 闭包1：过滤偶数
        .map(|&x| x * x)             // 闭包2：平方
        .collect();

    println!("{:?}", result);  // [4, 16, 36, 64, 100]
}
```

### 场景 3：回调和事件处理

```rust
struct Button {
    label: String,
    on_click: Option<Box<dyn Fn()>>,
}

impl Button {
    fn new(label: &str) -> Self {
        Button { label: label.to_string(), on_click: None }
    }

    fn set_on_click<F: 'static + Fn()>(&mut self, handler: F) {
        self.on_click = Some(Box::new(handler));
    }

    fn click(&self) {
        if let Some(handler) = &self.on_click {
            handler();
        }
    }
}
```

### 场景 4：Result / Option 的高级用法

```rust
fn main() {
    let strings = vec!["1", "2", "abc", "4"];

    // filter_map 结合闭包：过滤并转换
    let numbers: Vec<i32> = strings
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();

    println!("{:?}", numbers);  // [1, 2, 4]

    // map_err 转换错误类型
    let result: Result<i32, String> = "42"
        .parse::<i32>()
        .map_err(|e| format!("解析错误: {}", e));
}
```

### 场景 5：多线程

```rust
use std::thread;
use std::sync::{Arc, Mutex};

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..5 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
            println!("线程 {} 完成", i);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数: {}", *counter.lock().unwrap());
}
```

### 场景 6：函数组合

```rust
fn compose<F, G, A, B, C>(f: F, g: G) -> impl Fn(A) -> C
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    move |x| g(f(x))
}

fn main() {
    let add_one = |x: i32| x + 1;
    let double = |x: i32| x * 2;

    let add_one_then_double = compose(add_one, double);
    println!("{}", add_one_then_double(5));  // (5 + 1) * 2 = 12
}
```

---

## 总结

| 核心概念       | 要点                                                    |
| -------------- | ------------------------------------------------------- |
| 语法           | `\|参数\| 表达式`，支持类型注解和多行                   |
| 三种捕获方式   | `Fn`(不可变借用) → `FnMut`(可变借用) → `FnOnce`(所有权) |
| move 关键字    | 强制获取所有权，跨作用域（多线程）必需                  |
| 作为参数       | 泛型 + `Fn`/`FnMut`/`FnOnce` trait bound               |
| 作为返回值     | `impl Fn(...)` 或 `Box<dyn Fn(...)>`                    |
| 类型推断       | 编译器自动推断，一旦确定不可更改                        |
| vs 函数指针    | 闭包可捕获环境、大小可变；函数指针固定大小、不可捕获    |
