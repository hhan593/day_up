# Rust 集合类型与迭代器手册

> Rust 标准库提供了丰富的集合类型和强大的迭代器系统。本手册系统介绍常用集合和迭代器的使用方法。

---

## 目录

1. [集合类型概览](#1-集合类型概览)
2. [Vector](#2-vector)
3. [String](#3-string)
4. [HashMap](#4-hashmap)
5. [HashSet](#5-hashset)
6. [其他集合](#6-其他集合)
7. [迭代器](#7-迭代器)
8. [常用模式](#8-常用模式)

---

## 1. 集合类型概览

```
┌────────────────────────────────────────────────────────────────┐
│                     Rust 集合类型                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  序列类型              映射类型              集合类型            │
│  ├─ Vec               ├─ HashMap            ├─ HashSet          │
│  ├─ VecDeque          ├─ BTreeMap           ├─ BTreeSet         │
│  └─ LinkedList                                      │
│                                                     │
│  特殊类型                                          │
│  ├─ String (UTF-8 文本)                          │
│  └─ BinaryHeap (优先队列)                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

| 集合类型 | 特点 | 适用场景 |
|----------|------|----------|
| `Vec` | 连续存储，支持随机访问 | 默认选择，通用动态数组 |
| `VecDeque` | 双端队列 | 两端都需要 push/pop |
| `LinkedList` | 双向链表 | 频繁在中间插入删除 |
| `HashMap` | 平均 O(1) 查找 | 键值对存储 |
| `BTreeMap` | 有序，O(log n) 查找 | 需要有序遍历 |
| `HashSet` | 去重集合 | 检查元素是否存在 |
| `BTreeSet` | 有序去重集合 | 有序集合操作 |

---

## 2. Vector

### 2.1 创建 Vec

```rust
// 1. new() 创建空 Vec
let mut v1: Vec<i32> = Vec::new();

// 2. vec! 宏（推荐）
let v2 = vec![1, 2, 3];

// 3. 预分配容量
let mut v3 = Vec::with_capacity(100);

// 4. 重复元素
let v4 = vec![0; 100]; // 100 个 0
```

### 2.2 添加与删除元素

```rust
let mut v = Vec::new();

// 添加元素
v.push(1);
v.push(2);

// 弹出最后一个元素
let last = v.pop(); // Some(2)

// 在指定位置插入
v.insert(0, 0); // [0, 1]

// 移除指定位置元素
let removed = v.remove(0); // 0, v 现在是 [1]

// 追加另一个 Vec
v.extend([2, 3, 4]);
v.append(&mut vec![5, 6]); // 清空传入的 Vec
```

### 2.3 访问元素

```rust
let v = vec![1, 2, 3, 4, 5];

// 1. 索引访问（越界会 panic）
let first = v[0];

// 2. get 方法（安全，返回 Option）
let maybe = v.get(100); // None

// 3. 切片访问
let slice = &v[1..3]; // [2, 3]

// 4. 首尾元素
let first = v.first();  // Option<&T>
let last = v.last();    // Option<&T>

// 5. 条件获取
let even = v.iter().find(|&&x| x % 2 == 0);
```

### 2.4 遍历 Vec

```rust
let mut v = vec![1, 2, 3];

// 1. 不可变遍历
for item in &v {
    println!("{}", item);
}

// 2. 可变遍历
for item in &mut v {
    *item *= 2; // v 变成 [2, 4, 6]
}

// 3. 获取索引
for (i, item) in v.iter().enumerate() {
    println!("{}: {}", i, item);
}

// 4. 消费遍历（消耗 Vec）
for item in v {
    println!("{}", item);
}
// v 在这里已经被 move
```

### 2.5 常用方法

```rust
let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];

// 长度与容量
assert_eq!(v.len(), 8);
assert!(v.capacity() >= 8);

// 检查是否为空
assert!(!v.is_empty());

// 排序
v.sort();           // 原地排序 [1, 1, 2, 3, 4, 5, 6, 9]
v.sort_by(|a, b| b.cmp(a)); // 降序

// 反转
v.reverse();

// 去重（需要先排序）
v.dedup(); // 相邻重复元素只保留一个

// 查找
let pos = v.iter().position(|&x| x == 5);
let contains = v.contains(&5);

// 过滤并收集
let evens: Vec<_> = v.iter().filter(|&&x| x % 2 == 0).cloned().collect();

// 清空
v.clear();
assert!(v.is_empty());
```

### 2.6 内存管理

```rust
let mut v = Vec::with_capacity(100);
for i in 0..100 {
    v.push(i);
}

// 收缩容量以匹配长度
v.shrink_to_fit();

// 保留至少 50 的容量
v.reserve(50);

// 截断到指定长度
v.truncate(10); // 只保留前 10 个元素

// 使用 Vec 作为栈
v.push(11);
let top = v[v.len() - 1];
```

---

## 3. String

> 注意：Rust 中的 `String` 是 UTF-8 编码的可变字符串。已有一份专门的 String 知识手册，此处简要回顾。

### 3.1 创建 String

```rust
// 1. new()
let s1 = String::new();

// 2. from 字符串字面量
let s2 = String::from("hello");
let s3 = "hello".to_string();

// 3. 重复字符
let s4 = "a".repeat(10); // "aaaaaaaaaa"
```

### 3.2 修改 String

```rust
let mut s = String::from("hello");

// 追加字符串
s.push(' ');           // 追加字符
s.push_str("world");   // 追加字符串切片

// 连接（+ 运算符）
let s1 = String::from("hello");
let s2 = String::from(" world");
let s3 = s1 + &s2; // s1 被 move，注意 &s2

// 格式化（推荐）
let s = format!("{} {}", "hello", "world");

// 插入与删除
s.insert(5, ',');      // 在位置 5 插入
s.insert_str(6, " ");
s.remove(0);           // 删除并返回字符
s.pop();               // 删除最后一个字符
truncate();            // 截断到指定长度
clear();               // 清空
```

### 3.3 String 与 &str

```rust
let s = String::from("hello world");

// String → &str（解引用强制转换）
let slice: &str = &s;
let slice = &s[..];    // 完整切片
let slice = &s[0..5];  // 前 5 个字节（注意不是字符）

// &str → String
let owned = slice.to_string();
let owned = String::from(slice);
```

---

## 4. HashMap

### 4.1 创建 HashMap

```rust
use std::collections::HashMap;

// 1. new()
let mut map1 = HashMap::new();

// 2. 预分配容量
let mut map2 = HashMap::with_capacity(100);

// 3. 从迭代器创建
let teams = vec![("Blue", 10), ("Red", 20)];
let map: HashMap<_, _> = teams.into_iter().collect();

// 4. 自定义 hasher（高级）
use std::collections::hash_map::DefaultHasher;
let mut map = HashMap::with_hasher(DefaultHasher::new());
```

### 4.2 插入与更新

```rust
let mut map = HashMap::new();

// 插入
map.insert("key", "value");

// 只有在 key 不存在时才插入
map.entry("key").or_insert("default");

// 更新现有值
let count = map.entry("key").or_insert(0);
*count += 1;

// 合并两个 HashMap
let mut map1 = HashMap::new();
map1.insert("a", 1);
let mut map2 = HashMap::new();
map2.insert("b", 2);
map1.extend(map2);
```

### 4.3 访问元素

```rust
let mut map = HashMap::new();
map.insert("key", "value");

// 1. get（返回 Option）
match map.get("key") {
    Some(value) => println!("{}", value),
    None => println!("Not found"),
}

// 2. 索引访问（不存在会 panic）
let value = map["key"];

// 3. 检查是否存在
if map.contains_key("key") {
    println!("Found!");
}
```

### 4.4 遍历 HashMap

```rust
let mut map = HashMap::new();
map.insert("a", 1);
map.insert("b", 2);

// 1. 遍历键值对（顺序不固定）
for (key, value) in &map {
    println!("{}: {}", key, value);
}

// 2. 只遍历键
for key in map.keys() {
    println!("{}", key);
}

// 3. 只遍历值
for value in map.values() {
    println!("{}", value);
}

// 4. 可变遍历
for (key, value) in map.iter_mut() {
    *value *= 2;
}
```

### 4.5 删除与清空

```rust
let mut map = HashMap::new();
map.insert("a", 1);
map.insert("b", 2);

// 删除并返回值
let removed = map.remove("a"); // Some(1)

// 只删除不返回值
map.remove_entry("b");

// 保留满足条件的元素
map.retain(|key, value| *value > 0);

// 清空
map.clear();
```

### 4.6 自定义键类型

```rust
use std::collections::HashMap;
use std::hash::Hash;

#[derive(Debug, Hash, Eq, PartialEq)]  // 必须实现这些 trait
struct Point {
    x: i32,
    y: i32,
}

let mut map = HashMap::new();
map.insert(Point { x: 0, y: 0 }, "origin");
map.insert(Point { x: 1, y: 1 }, "diagonal");
```

---

## 5. HashSet

### 5.1 创建与使用

```rust
use std::collections::HashSet;

let mut set = HashSet::new();

// 插入
set.insert(1);
set.insert(2);
set.insert(1); // 重复，不会插入

// 检查存在
assert!(set.contains(&1));
assert!(!set.contains(&3));

// 删除
set.remove(&1);
```

### 5.2 集合运算

```rust
let set1: HashSet<_> = [1, 2, 3].iter().cloned().collect();
let set2: HashSet<_> = [2, 3, 4].iter().cloned().collect();

// 交集
let intersection: HashSet<_> = set1.intersection(&set2).cloned().collect();
assert_eq!(intersection, [2, 3].iter().cloned().collect());

// 并集
let union: HashSet<_> = set1.union(&set2).cloned().collect();

// 差集（在 set1 中但不在 set2 中）
let difference: HashSet<_> = set1.difference(&set2).cloned().collect();

// 对称差集（只在一个集合中）
let symmetric: HashSet<_> = set1.symmetric_difference(&set2).cloned().collect();

// 是否是子集/超集
assert!(set1.is_subset(&union));
assert!(union.is_superset(&set1));

// 是否不相交
assert!(!set1.is_disjoint(&set2));
```

---

## 6. 其他集合

### 6.1 VecDeque（双端队列）

```rust
use std::collections::VecDeque;

let mut deque = VecDeque::new();

// 两端操作
deque.push_back(1);
deque.push_back(2);
deque.push_front(0);

assert_eq!(deque, [0, 1, 2]);

let front = deque.pop_front(); // Some(0)
let back = deque.pop_back();   // Some(2)

// 旋转
let mut deque = VecDeque::from([1, 2, 3, 4, 5]);
deque.rotate_left(2);  // [3, 4, 5, 1, 2]
deque.rotate_right(1); // [2, 3, 4, 5, 1]
```

### 6.2 LinkedList

```rust
use std::collections::LinkedList;

let mut list = LinkedList::new();

list.push_back(1);
list.push_back(2);
list.push_front(0);

// 拼接（O(1)）
let mut list2 = LinkedList::new();
list2.push_back(3);
list2.push_back(4);
list.append(&mut list2); // list2 变为空

// 分割
let mut list = LinkedList::from([1, 2, 3, 4, 5]);
let split = list.split_off(2); // list=[1, 2], split=[3, 4, 5]
```

### 6.3 BinaryHeap（优先队列）

```rust
use std::collections::BinaryHeap;

let mut heap = BinaryHeap::new();

heap.push(3);
heap.push(1);
heap.push(4);
heap.push(1);
heap.push(5);

// 最大堆，peek 返回最大值
assert_eq!(heap.peek(), Some(&5));

// 弹出最大值
while let Some(max) = heap.pop() {
    println!("{}", max); // 5, 4, 3, 1, 1
}

// 从 Vec 创建（堆化，O(n)）
let heap = BinaryHeap::from(vec![3, 1, 4, 1, 5]);
```

### 6.4 BTreeMap 和 BTreeSet

```rust
use std::collections::{BTreeMap, BTreeSet};

// BTreeMap - 有序的键值对
let mut map = BTreeMap::new();
map.insert("c", 3);
map.insert("a", 1);
map.insert("b", 2);

// 遍历时按键的顺序
for (k, v) in &map {
    println!("{}: {}", k, v); // a, b, c
}

// 范围查询
let range = map.range("a"..="b");

// BTreeSet - 有序集合
let mut set = BTreeSet::new();
set.insert(3);
set.insert(1);
set.insert(4);

// 获取第一个/最后一个
assert_eq!(set.first(), Some(&1));
assert_eq!(set.last(), Some(&4));

// 范围
let range: Vec<_> = set.range(2..=4).cloned().collect();
assert_eq!(range, vec![3, 4]);
```

---

## 7. 迭代器

### 7.1 迭代器基础

```rust
let v = vec![1, 2, 3];

// 1. iter() - 返回 &T
for item in v.iter() {
    println!("{}", item); // &i32
}

// 2. iter_mut() - 返回 &mut T
for item in v.iter_mut() {
    *item += 1;
}

// 3. into_iter() - 返回 T（消耗集合）
for item in v.into_iter() {
    println!("{}", item); // i32
}

// 简化写法
for item in &v { }     // 等价于 v.iter()
for item in &mut v { } // 等价于 v.iter_mut()
for item in v { }      // 等价于 v.into_iter()
```

### 7.2 迭代器适配器

```rust
let v = vec![1, 2, 3, 4, 5];

// map - 转换每个元素
let doubled: Vec<_> = v.iter().map(|x| x * 2).collect();

// filter - 过滤元素
let evens: Vec<_> = v.iter().filter(|&&x| x % 2 == 0).collect();

// enumerate - 获取索引
for (i, x) in v.iter().enumerate() {
    println!("{}: {}", i, x);
}

// zip - 合并两个迭代器
let names = vec!["Alice", "Bob"];
let scores = vec![85, 90];
for (name, score) in names.iter().zip(scores.iter()) {
    println!("{}: {}", name, score);
}

// skip / take - 跳过/取前 n 个
let skipped: Vec<_> = v.iter().skip(2).collect(); // [3, 4, 5]
let taken: Vec<_> = v.iter().take(3).collect();   // [1, 2, 3]

// step_by - 步长
let stepped: Vec<_> = v.iter().step_by(2).collect(); // [1, 3, 5]

// chain - 连接两个迭代器
let chained: Vec<_> = v.iter().chain([6, 7].iter()).collect();

// flatten - 扁平化
let nested = vec![vec![1, 2], vec![3, 4]];
let flat: Vec<_> = nested.iter().flatten().collect(); // [1, 2, 3, 4]

// rev - 反转
let reversed: Vec<_> = v.iter().rev().collect();

// cloned / copied - 复制引用
let owned: Vec<i32> = v.iter().cloned().collect();
```

### 7.3 消费迭代器的方法

```rust
let v = vec![1, 2, 3, 4, 5];

// collect - 收集到集合
let collected: Vec<_> = v.iter().collect();

// count - 计数
let count = v.iter().count();

// sum / product
let sum: i32 = v.iter().sum();
let product: i32 = v.iter().product();

// fold - 累积
let sum = v.iter().fold(0, |acc, x| acc + x);
let max = v.iter().fold(i32::MIN, |max, x| *x.max(&max));

// reduce（类似 fold，但初始值是第一个元素）
let max = v.iter().reduce(|a, b| if a > b { a } else { b });

// any / all
let has_even = v.iter().any(|&x| x % 2 == 0);      // true
let all_positive = v.iter().all(|&x| x > 0);       // true

// find / find_map
let first_even = v.iter().find(|&&x| x % 2 == 0);  // Some(&2)

// position / rposition
let pos = v.iter().position(|&x| x == 3);          // Some(2)

// max / min
let max = v.iter().max(); // Some(&5)
let min = v.iter().min(); // Some(&1)

// max_by / min_by
let max = v.iter().max_by(|a, b| a.cmp(b));

// cmp / partial_cmp（比较两个迭代器）
let result = v.iter().cmp([1, 2, 3, 4, 5].iter());

// nth - 获取第 n 个元素
let third = v.iter().nth(2); // Some(&3)

// last - 最后一个元素
let last = v.iter().last(); // Some(&5)

// for_each
v.iter().for_each(|x| println!("{}", x));
```

### 7.4 自定义迭代器

```rust
struct Counter {
    count: u32,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: 0 }
    }
}

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

// 使用
let counter = Counter::new();
let sum: u32 = counter.sum(); // 1+2+3+4+5 = 15
```

---

## 8. 常用模式

### 8.1 分组

```rust
use std::collections::HashMap;

let data = vec![("a", 1), ("b", 2), ("a", 3), ("b", 4)];

let mut groups: HashMap<&str, Vec<i32>> = HashMap::new();
for (key, value) in data {
    groups.entry(key).or_insert_with(Vec::new).push(value);
}
// groups = {"a": [1, 3], "b": [2, 4]}
```

### 8.2 计数

```rust
use std::collections::HashMap;

let words = vec!["apple", "banana", "apple", "orange", "banana", "apple"];

let mut counts = HashMap::new();
for word in words {
    *counts.entry(word).or_insert(0) += 1;
}
// counts = {"apple": 3, "banana": 2, "orange": 1}
```

### 8.3 去重

```rust
use std::collections::HashSet;

let nums = vec![1, 2, 2, 3, 3, 3];
let unique: Vec<_> = nums.into_iter().collect::<HashSet<_>>().into_iter().collect();

// 或者保持顺序
let mut seen = HashSet::new();
let unique: Vec<_> = nums.into_iter().filter(|x| seen.insert(*x)).collect();
```

### 8.4 查找最值

```rust
let scores = vec![85, 92, 78, 95, 88];

// 最高分
let max_score = scores.iter().max();

// 最高分的学生（假设有对应关系）
let students = vec!["Alice", "Bob", "Charlie", "David", "Eve"];
let top_student = scores.iter()
    .zip(students.iter())
    .max_by_key(|(score, _)| *score);
```

### 8.5 分块处理

```rust
// 每 n 个元素一组
fn chunks<T: Clone>(list: &[T], size: usize) -> impl Iterator<Item = Vec<T>> + '_ {
    list.chunks(size).map(|chunk| chunk.to_vec())
}

let nums = vec![1, 2, 3, 4, 5, 6, 7, 8, 9];
for chunk in chunks(&nums, 3) {
    println!("{:?}", chunk); // [1, 2, 3], [4, 5, 6], [7, 8, 9]
}
```

### 8.6 类型转换链

```rust
let s = "1 2 3 4 5";

let nums: Vec<i32> = s.split_whitespace()
    .map(|x| x.parse().expect("Parse error"))
    .collect();

// 或者处理错误
let nums: Result<Vec<i32>, _> = s.split_whitespace()
    .map(|x| x.parse())
    .collect();
```

---

## 参考资料

- [Rust 标准库文档 - Collections](https://doc.rust-lang.org/std/collections/)
- [Rust 程序设计语言 - 集合](https://doc.rust-lang.org/book/ch08-00-common-collections.html)
- [Rust 语言圣经 - 集合类型](https://course.rs/basic/collections/intro.html)
