# Rust 迭代器（Iterators）完全指南

## 目录

1. [Iterator Trait 定义](#1-iterator-trait-定义)
2. [创建迭代器的三种方式](#2-创建迭代器的三种方式)
3. [消费适配器](#3-消费适配器consuming-adaptors)
4. [迭代器适配器](#4-迭代器适配器iterator-adaptors)
5. [自定义迭代器](#5-自定义迭代器)
6. [惰性求值特性](#6-惰性求值特性)
7. [迭代器 vs for 循环性能](#7-迭代器-vs-for-循环性能)
8. [常用模式和实际场景](#8-常用模式和实际场景)

---

## 1. Iterator Trait 定义

### 核心接口

```rust
pub trait Iterator {
    type Item;  // 关联类型：迭代器产生的元素类型

    fn next(&mut self) -> Option<Self::Item>;
    // 返回 Some(item) 表示还有元素
    // 返回 None 表示迭代结束

    // 标准库提供了大量默认方法（map、filter、collect 等）
}
```

### 关键点

- **Item 关联类型**：定义迭代器产生的元素类型
  - `Vec<i32>::iter()` 的 `Item` 是 `&i32`
  - `Vec<i32>::into_iter()` 的 `Item` 是 `i32`
- **next() 需要 `&mut self`**：因为迭代是有状态操作（内部维护位置）
- 所有其他迭代器方法都基于 `next()` 实现

### 为什么要用迭代器？

```rust
// 命令式风格
let nums = vec![1, 2, 3, 4, 5];
let mut sum = 0;
for n in &nums {
    if n % 2 == 0 { sum += n; }
}

// 函数式风格（更清晰、更可组合）
let sum: i32 = nums.iter().filter(|&&n| n % 2 == 0).sum();
```

---

## 2. 创建迭代器的三种方式

### iter() — 不可变借用

```rust
let nums = vec![1, 2, 3];
for &n in nums.iter() {  // 等价于 for n in &nums
    println!("{}", n);    // n: &i32
}
println!("{:?}", nums);  // ✅ 原集合仍可用
```

### iter_mut() — 可变借用

```rust
let mut nums = vec![1, 2, 3];
for n in nums.iter_mut() {  // 等价于 for n in &mut nums
    *n *= 2;                 // 修改每个元素
}
println!("{:?}", nums);  // [2, 4, 6]
```

### into_iter() — 消费（获取所有权）

```rust
let nums = vec![1, 2, 3];
for n in nums.into_iter() {  // 等价于 for n in nums
    println!("{}", n);        // n: i32（值，非引用）
}
// println!("{:?}", nums);  // ❌ 错误！所有权已转移
```

### 对比表

| 方法          | Item 类型 | 原集合可用？ | 适用场景     |
| ------------- | --------- | ------------ | ------------ |
| `iter()`      | `&T`      | ✅ 是        | 只读遍历     |
| `iter_mut()`  | `&mut T`  | ✅ 是        | 修改元素     |
| `into_iter()` | `T`       | ❌ 否        | 获取所有权   |

---

## 3. 消费适配器（Consuming Adaptors）

消费适配器会**消耗迭代器**，调用 `next()` 直至结束，返回最终结果。

### collect() — 收集为集合

```rust
let nums = vec![1, 2, 3, 4, 5];

let doubled: Vec<i32> = nums.iter().map(|&x| x * 2).collect();
// [2, 4, 6, 8, 10]

// 也可以收集为其他类型
use std::collections::HashSet;
let set: HashSet<i32> = nums.iter().copied().collect();

// 从范围创建
let v: Vec<i32> = (0..10).filter(|x| x % 2 == 0).collect();
// [0, 2, 4, 6, 8]
```

### sum() / product() — 聚合运算

```rust
let nums = vec![1, 2, 3, 4, 5];
let total: i32 = nums.iter().sum();      // 15
let product: i32 = nums.iter().product(); // 120
```

### count() — 计数

```rust
let nums = vec![1, 2, 3, 4, 5];
let evens = nums.iter().filter(|&&x| x % 2 == 0).count();  // 2
```

### any() / all() — 条件判断

```rust
let nums = vec![2, 4, 6, 8];

let has_large = nums.iter().any(|&x| x > 5);    // true
let all_even = nums.iter().all(|&x| x % 2 == 0); // true
```

### find() / position() — 查找

```rust
let nums = vec![10, 20, 30, 40, 50];

let found = nums.iter().find(|&&x| x > 25);      // Some(&30)
let pos = nums.iter().position(|&x| x == 30);     // Some(2)
```

### max() / min() — 极值

```rust
let nums = vec![3, 1, 4, 1, 5, 9];
let max = nums.iter().max();  // Some(&9)
let min = nums.iter().min();  // Some(&1)

// 自定义排序
let max_by = nums.iter().max_by_key(|&&x| x % 3);  // 按模 3 的余数
```

### fold() / reduce() — 归约

```rust
let nums = vec![1, 2, 3, 4, 5];

// fold: 需要初始值
let sum = nums.iter().fold(0, |acc, &x| acc + x);  // 15

// reduce: 用第一个元素作初始值
let sum = nums.iter().copied().reduce(|acc, x| acc + x);  // Some(15)

// fold 的强大用法：同时计算多个值
let (sum, count) = nums.iter().fold((0, 0), |(s, c), &x| (s + x, c + 1));
```

### partition() — 分区

```rust
let nums = vec![1, 2, 3, 4, 5, 6];

let (evens, odds): (Vec<i32>, Vec<i32>) =
    nums.into_iter().partition(|x| x % 2 == 0);

println!("偶数: {:?}", evens);  // [2, 4, 6]
println!("奇数: {:?}", odds);   // [1, 3, 5]
```

---

## 4. 迭代器适配器（Iterator Adaptors）

迭代器适配器**不消费**迭代器，而是返回一个新的迭代器。支持链式调用。

### map() — 变换

```rust
let nums = vec![1, 2, 3];
let doubled: Vec<i32> = nums.iter().map(|&x| x * 2).collect();
// [2, 4, 6]

let words = vec!["hello", "world"];
let upper: Vec<String> = words.iter().map(|w| w.to_uppercase()).collect();
// ["HELLO", "WORLD"]
```

### filter() — 过滤

```rust
let nums = vec![1, 2, 3, 4, 5, 6];
let evens: Vec<&i32> = nums.iter().filter(|&&x| x % 2 == 0).collect();
// [&2, &4, &6]
```

### filter_map() — 过滤 + 变换

```rust
let strings = vec!["1", "2", "abc", "4"];

// 解析成功的保留，失败的丢弃
let numbers: Vec<i32> = strings
    .iter()
    .filter_map(|s| s.parse().ok())
    .collect();
// [1, 2, 4]
```

### enumerate() — 带索引

```rust
let fruits = vec!["苹果", "香蕉", "橙子"];

for (i, fruit) in fruits.iter().enumerate() {
    println!("{}: {}", i, fruit);
}
// 0: 苹果
// 1: 香蕉
// 2: 橙子
```

### zip() — 配对

```rust
let keys = vec!["a", "b", "c"];
let vals = vec![1, 2, 3];

let pairs: Vec<(&&str, &i32)> = keys.iter().zip(vals.iter()).collect();
// [("a", 1), ("b", 2), ("c", 3)]

// 如果长度不同，以较短的为准
```

### skip() / take() — 跳过和截取

```rust
let nums: Vec<i32> = (1..=10).collect();

let skipped: Vec<i32> = nums.iter().copied().skip(3).collect();
// [4, 5, 6, 7, 8, 9, 10]

let taken: Vec<i32> = nums.iter().copied().take(3).collect();
// [1, 2, 3]

// 组合：跳过 2 个，取 3 个
let slice: Vec<i32> = nums.iter().copied().skip(2).take(3).collect();
// [3, 4, 5]
```

### chain() — 连接

```rust
let a = vec![1, 2, 3];
let b = vec![4, 5, 6];

let combined: Vec<i32> = a.iter().copied().chain(b.iter().copied()).collect();
// [1, 2, 3, 4, 5, 6]
```

### flat_map() / flatten() — 扁平化

```rust
// flat_map：映射后扁平化
let nums = vec![1, 2, 3];
let result: Vec<i32> = nums.iter().flat_map(|&x| vec![x, x * 10]).collect();
// [1, 10, 2, 20, 3, 30]

// flatten：直接扁平化嵌套结构
let nested = vec![vec![1, 2], vec![3, 4], vec![5, 6]];
let flat: Vec<i32> = nested.into_iter().flatten().collect();
// [1, 2, 3, 4, 5, 6]
```

### peekable() — 窥视下一个元素

```rust
let nums = vec![1, 2, 3, 4, 5];
let mut iter = nums.iter().peekable();

// peek() 查看下一个元素但不消费
while let Some(&&x) = iter.peek() {
    if x > 3 { break; }
    println!("{}", iter.next().unwrap());
}
// 输出: 1, 2, 3
```

### rev() — 反向迭代

```rust
let nums = vec![1, 2, 3, 4, 5];
let reversed: Vec<i32> = nums.iter().copied().rev().collect();
// [5, 4, 3, 2, 1]
```

### windows() / chunks() — 窗口和分块

```rust
let nums = vec![1, 2, 3, 4, 5];

// windows: 滑动窗口（重叠）
for w in nums.windows(3) {
    println!("{:?}", w);
}
// [1,2,3], [2,3,4], [3,4,5]

// chunks: 不重叠分块
for c in nums.chunks(2) {
    println!("{:?}", c);
}
// [1,2], [3,4], [5]
```

### cloned() / copied() — 复制元素

```rust
let nums = vec![1, 2, 3];

// copied: 用于 Copy 类型（推荐，更高效）
let result: Vec<i32> = nums.iter().copied().collect();

// cloned: 用于 Clone 类型
let strings = vec![String::from("a"), String::from("b")];
let result: Vec<String> = strings.iter().cloned().collect();
```

---

## 5. 自定义迭代器

### 实现 Iterator Trait

```rust
struct Counter {
    count: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Counter {
        Counter { count: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

fn main() {
    // 直接在 for 循环中使用
    for num in Counter::new(5) {
        println!("{}", num);  // 1, 2, 3, 4, 5
    }

    // 也可以使用所有迭代器方法
    let sum: u32 = Counter::new(5).sum();  // 15

    let doubled: Vec<u32> = Counter::new(3)
        .map(|x| x * 2)
        .collect();  // [2, 4, 6]

    // 组合两个自定义迭代器
    let pairs: Vec<(u32, u32)> = Counter::new(3)
        .zip(Counter::new(3).map(|x| x * 10))
        .collect();  // [(1, 10), (2, 20), (3, 30)]
}
```

### 实现 IntoIterator

为自定义类型实现 `IntoIterator`，使其可以直接用于 `for` 循环：

```rust
struct NumberRange {
    start: i32,
    end: i32,
}

struct NumberRangeIter {
    current: i32,
    end: i32,
}

impl IntoIterator for NumberRange {
    type Item = i32;
    type IntoIter = NumberRangeIter;

    fn into_iter(self) -> Self::IntoIter {
        NumberRangeIter {
            current: self.start,
            end: self.end,
        }
    }
}

impl Iterator for NumberRangeIter {
    type Item = i32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.end {
            let val = self.current;
            self.current += 1;
            Some(val)
        } else {
            None
        }
    }
}

fn main() {
    let range = NumberRange { start: 1, end: 4 };
    for n in range {
        println!("{}", n);  // 1, 2, 3
    }
}
```

---

## 6. 惰性求值特性

### 核心概念

迭代器适配器**不会立即执行**，只有在调用消费适配器时才真正计算。

```rust
let nums = vec![1, 2, 3, 4, 5];

// ❌ 这不会执行任何操作！只定义了管道
let _iter = nums.iter()
    .map(|x| {
        println!("映射: {}", x);  // 不会打印
        x * 2
    })
    .filter(|x| x > &4);

// ✅ 调用 collect() 后才真正执行
let result: Vec<i32> = nums.iter()
    .map(|&x| x * 2)
    .filter(|x| x > &4)
    .collect();
// [6, 8, 10]
```

### 惰性的优势：短路计算

```rust
// 只需计算前 5 个偶数，不需遍历全部 10 亿个数
let result: Vec<i32> = (0..1_000_000_000)
    .filter(|x| x % 2 == 0)
    .take(5)
    .collect();
// [0, 2, 4, 6, 8] — 瞬间完成
```

### 执行顺序：逐元素而非逐步骤

```rust
let nums = vec![1, 2, 3];

let result: Vec<i32> = nums.iter()
    .filter(|&&x| {
        println!("filter: {}", x);
        x > 1
    })
    .map(|&x| {
        println!("map: {}", x);
        x * 2
    })
    .collect();

// 输出（注意是逐元素处理，不是先全部 filter 再全部 map）：
// filter: 1          ← 被过滤掉，不进入 map
// filter: 2
// map: 2
// filter: 3
// map: 3
```

---

## 7. 迭代器 vs for 循环性能

### 零开销抽象

Rust 的迭代器在 **release 编译** 下与手写 for 循环生成**相同的机器码**。

```rust
// 方式 1：for 循环
fn sum_loop(nums: &[i32]) -> i32 {
    let mut sum = 0;
    for &n in nums {
        if n % 2 == 0 { sum += n; }
    }
    sum
}

// 方式 2：迭代器
fn sum_iter(nums: &[i32]) -> i32 {
    nums.iter().filter(|&&n| n % 2 == 0).sum()
}

// 两者在 --release 编译后生成的汇编完全相同
```

### 选择建议

| 场景                     | 推荐         | 原因                     |
| ------------------------ | ------------ | ------------------------ |
| 数据转换、过滤、聚合     | 迭代器       | 表意清晰、可链式         |
| 简单遍历和打印           | for 循环     | 清晰直白                 |
| 需要提前 break           | for / find() | 两者都支持短路           |
| 复杂嵌套逻辑             | for 循环     | 避免过深链式调用         |
| 性能关键路径             | 两者均可     | release 下性能相同       |

---

## 8. 常用模式和实际场景

### 模式 1：数据转换管道

```rust
let raw_data = vec!["  Alice ", "bob", "  CHARLIE  "];

let processed: Vec<String> = raw_data
    .iter()
    .map(|s| s.trim())                // 去空格
    .map(|s| s.to_lowercase())        // 转小写
    .filter(|s| !s.is_empty())        // 过滤空串
    .collect();

println!("{:?}", processed);  // ["alice", "bob", "charlie"]
```

### 模式 2：字符串搜索（minigrep 风格）

```rust
fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents
        .lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

### 模式 3：分组统计

```rust
let scores = vec![85, 92, 78, 95, 88, 76, 91];

let (passed, failed): (Vec<_>, Vec<_>) =
    scores.iter().partition(|&&s| s >= 80);

let average = scores.iter().sum::<i32>() as f64 / scores.len() as f64;
let max = scores.iter().max();
let min = scores.iter().min();

println!("通过: {:?}, 不通过: {:?}", passed, failed);
println!("平均: {:.1}, 最高: {:?}, 最低: {:?}", average, max, min);
```

### 模式 4：处理嵌套数据

```rust
struct Person { name: String, age: u32 }

let people = vec![
    Person { name: "Alice".into(), age: 30 },
    Person { name: "Bob".into(), age: 25 },
    Person { name: "Charlie".into(), age: 35 },
];

// 提取满足条件的字段
let names: Vec<&str> = people
    .iter()
    .filter(|p| p.age > 26)
    .map(|p| p.name.as_str())
    .collect();
// ["Alice", "Charlie"]
```

### 模式 5：避免多次遍历

```rust
let nums = vec![1, 2, 3, 4, 5];

// ❌ 多次遍历
let sum = nums.iter().sum::<i32>();
let count = nums.iter().count();

// ✅ 单次遍历，fold 同时计算
let (sum, count, max) = nums.iter().fold(
    (0, 0, i32::MIN),
    |(s, c, m), &n| (s + n, c + 1, m.max(n)),
);
```

### 模式 6：生成序列

```rust
// 使用范围
let evens: Vec<i32> = (0..20).step_by(2).collect();
// [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

// 使用 repeat + take
let zeros: Vec<i32> = std::iter::repeat(0).take(5).collect();
// [0, 0, 0, 0, 0]

// 使用 successors 生成递推序列
let powers: Vec<u64> = std::iter::successors(Some(1u64), |&n| {
    n.checked_mul(2)
}).take(10).collect();
// [1, 2, 4, 8, 16, 32, 64, 128, 256, 512]
```

### 模式 7：HashMap 构建

```rust
use std::collections::HashMap;

let names = vec!["Alice", "Bob", "Charlie"];
let ages = vec![30, 25, 35];

let map: HashMap<&str, i32> = names.into_iter().zip(ages).collect();
// {"Alice": 30, "Bob": 25, "Charlie": 35}
```

---

## 总结

| 核心概念       | 要点                                                              |
| -------------- | ----------------------------------------------------------------- |
| Iterator Trait | `next()` + `Item` 关联类型，所有方法基于 `next()` 实现           |
| 三种创建方式   | `iter()`(&T) / `iter_mut()`(&mut T) / `into_iter()`(T)           |
| 消费适配器     | `collect`、`sum`、`fold`、`find`、`any`、`all` 等，消耗迭代器    |
| 迭代器适配器   | `map`、`filter`、`zip`、`enumerate`、`take` 等，返回新迭代器     |
| 自定义迭代器   | 实现 `Iterator` trait，重写 `next()` 方法                        |
| 惰性求值       | 适配器不立即执行，消费适配器触发计算                              |
| 零开销抽象     | release 编译下与 for 循环性能相同                                |
