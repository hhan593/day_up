# Rust String 全面知识手册

> 基于 Rust 官方文档、The Rust Book、Rust By Example 等权威来源整理

---

## 目录

1. [核心概念：String 与 &str](#1-核心概念string-与-str)
2. [内存布局](#2-内存布局)
3. [创建字符串](#3-创建字符串)
4. [更新字符串](#4-更新字符串)
5. [字符串拼接](#5-字符串拼接)
6. [UTF-8 编码详解](#6-utf-8-编码详解)
7. [索引与切片](#7-索引与切片)
8. [遍历字符串](#8-遍历字符串)
9. [常用方法速查](#9-常用方法速查)
10. [字符串类型转换](#10-字符串类型转换)
11. [Deref 强制转换](#11-deref-强制转换)
12. [Cow&lt;str&gt; 写时复制](#12-cowstr-写时复制)
13. [字符串格式化](#13-字符串格式化)
14. [Rust 中的其他字符串类型](#14-rust-中的其他字符串类型)
15. [性能优化技巧](#15-性能优化技巧)
16. [常见陷阱与最佳实践](#16-常见陷阱与最佳实践)
17. [字符串与集合](#17-字符串与集合)
18. [正则表达式](#18-正则表达式)
19. [生命周期与字符串](#19-生命周期与字符串)

---

## 1. 核心概念：String 与 &str

Rust 中有 **两种核心字符串类型**：

### `&str`（字符串切片）

- Rust 语言核心中唯一的字符串类型
- 是对 UTF-8 编码数据的**不可变引用**（胖指针）
- 字符串字面值（如 `"hello"`）的类型就是 `&str`，存储在程序的二进制文件中
- 大小固定，不可增长

```rust
let s: &str = "hello world"; // 字符串字面值，类型为 &str
```

### `String`（拥有所有权的字符串）

- 来自标准库，不是语言核心类型
- 可增长、可修改、拥有所有权
- UTF-8 编码
- 本质是 `Vec<u8>` 的封装，附加了 UTF-8 有效性保证
- 数据存储在**堆**上

```rust
let s: String = String::from("hello world"); // 拥有所有权的字符串
```

### 何时使用哪个？

| 场景 | 推荐类型 |
|------|---------|
| 函数参数（只读） | `&str` |
| 需要拥有所有权 | `String` |
| 结构体字段 | `String`（拥有数据） |
| 结构体 getter 返回值 | `&str` |
| 字符串字面值 | `&str` |
| 需要修改内容 | `String`（可变） |
| 有时借用有时拥有 | `Cow<str>` |
| 泛型 API | `impl AsRef<str>` 或 `T: AsRef<str>` |

---

## 2. 内存布局

在 64 位系统上：

### `&str`：16 字节（胖指针）

```
┌──────────────┬──────────────┐
│ ptr (8字节)  │ len (8字节)  │
│ 指向数据的指针│ 字节长度     │
└──────────────┴──────────────┘
        │
        ▼
   ┌─┬─┬─┬─┬─┐
   │h│e│l│l│o│  (UTF-8 字节，存储在栈/堆/静态区)
   └─┴─┴─┴─┴─┘
```

### `String`：24 字节（栈上）

```
┌──────────────┬──────────────┬──────────────┐
│ ptr (8字节)  │ len (8字节)  │ cap (8字节)  │
│ 指向堆数据   │ 当前字节长度 │ 已分配容量   │
└──────────────┴──────────────┴──────────────┘
        │
        ▼
   ┌─┬─┬─┬─┬─┬─┬─┬─┐
   │h│e│l│l│o│ │ │ │  (堆上的 UTF-8 字节，cap=8, len=5)
   └─┴─┴─┴─┴─┴─┴─┴─┘
```

---

## 3. 创建字符串

```rust
// 1. 空字符串
let s = String::new();

// 2. 从字符串字面值创建
let s = String::from("hello");        // 最常用
let s = "hello".to_string();          // 等价方式
let s = "hello".to_owned();           // 语义更明确：创建拥有所有权的副本
let s: String = "hello".into();       // 通过 Into trait

// 3. 预分配容量（已知大致长度时，避免多次重新分配）
let s = String::with_capacity(100);   // 预分配 100 字节

// 4. 从字节创建
let bytes = vec![72, 101, 108, 108, 111]; // "Hello"
let s = String::from_utf8(bytes).unwrap();           // 检查 UTF-8 有效性
let s = String::from_utf8_lossy(&[0xff, 0xfe]);      // 无效字节用 U+FFFD 替换
// unsafe: 跳过检查（仅在确定数据有效时使用）
let s = unsafe { String::from_utf8_unchecked(vec![72, 101]) };

// 5. 从 UTF-16 创建
let v = vec![0x0048, 0x0065, 0x006C]; // "Hel"
let s = String::from_utf16(&v).unwrap();
let s = String::from_utf16_lossy(&v);

// 6. 使用 format! 宏
let s = format!("{}-{}-{}", "tic", "tac", "toe"); // "tic-tac-toe"

// 7. 从字符迭代器收集
let s: String = "hello".chars().collect();

// 8. 重复字符串
let s = "ab".repeat(3); // "ababab"

// 9. UTF-8 支持任何语言
let hello = String::from("你好");
let hello = String::from("こんにちは");
let hello = String::from("مرحبا");
let hello = String::from("Привет");
```

---

## 4. 更新字符串

### 追加内容

```rust
let mut s = String::from("hello");

// push_str() — 追加字符串切片 (&str)，不获取所有权
s.push_str(" world");     // "hello world"

let other = " Rust";
s.push_str(other);        // other 仍然可用，因为 push_str 只借用

// push() — 追加单个字符 (char)，注意用单引号
s.push('!');              // "hello world Rust!"
```

> **重要区别**：
> - `push_str(&str)` — 追加字符串切片（双引号 `"..."`）
> - `push(char)` — 追加单个字符（单引号 `'...'`）
> - `char` 固定占 4 字节（Unicode 标量值），可以是 `'a'`、`'心'`、`'😊'`
> - `&str` 是 UTF-8 编码序列，每个字符 1~4 字节不等

### 插入内容

```rust
let mut s = String::from("hello");

// insert() — 在字节索引处插入字符
s.insert(0, 'H');            // "Hhello"

// insert_str() — 在字节索引处插入字符串切片
s.insert_str(1, "ey ");      // "Hey hello"
// ⚠️ 索引必须在 UTF-8 字符边界上，否则 panic
```

### 删除内容

```rust
let mut s = String::from("hello");

// pop() — 移除并返回最后一个字符
let ch = s.pop();           // Some('o'), s = "hell"

// remove() — 移除指定字节索引处的字符并返回
let ch = s.remove(0);       // 'h', s = "ell"
// ⚠️ 索引必须在字符边界上

// truncate() — 截断到指定字节长度
s.truncate(2);              // s = "el"
// ⚠️ 长度必须在字符边界上

// clear() — 清空内容，保留已分配的容量
s.clear();                  // s = "", capacity 不变

// drain() — 移除指定范围并返回迭代器
let mut s = String::from("hello");
let drained: String = s.drain(1..3).collect(); // drained = "el", s = "hlo"

// retain() — 只保留满足条件的字符
let mut s = String::from("h1e2l3l4o5");
s.retain(|c| c.is_alphabetic());  // s = "hello"
```

### 替换内容

```rust
let mut s = String::from("hello world");

// replace_range() — 替换指定范围（原地修改）
s.replace_range(0..5, "Hi");  // s = "Hi world"

// replace() — 替换所有匹配（返回新 String，不修改原字符串）
let new_s = s.replace("Hi", "Hello"); // "Hello world"

// replacen() — 替换前 n 个匹配
let s = "aabbcc".replacen("a", "x", 1); // "xabbcc"
```

---

## 5. 字符串拼接

### 方式一：`+` 运算符

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2;  // s1 被移动！之后不能再使用 s1
                     // s2 只是借用，仍然可用
```

**`+` 运算符的原理**：
```rust
// + 运算符实际调用的方法签名：
fn add(self, s: &str) -> String
// self 获取了 s1 的所有权（移动），&str 借用了 s2
// Rust 通过 Deref 强制转换将 &String 转为 &str
```

> ⚠️ **注意**：`+` 左边必须是 `String`，右边必须是 `&str`（或可转换为 `&str` 的引用）。左边的 `String` 会被**移动**（所有权转移），之后不可再使用。

### 方式二：`format!` 宏（推荐多个字符串拼接）

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{s1}-{s2}-{s3}");  // "tic-tac-toe"
// ✅ 不会移动任何参数的所有权！s1、s2、s3 仍然可用
// ✅ 代码更清晰易读
```

### 方式三：`push_str` 链式调用

```rust
let mut s = String::from("Hello");
s.push_str(", ");
s.push_str("world");
s.push('!');
// s = "Hello, world!"
```

### 方式四：从迭代器收集

```rust
let parts = vec!["hello", "world", "rust"];
let s = parts.join(" ");        // "hello world rust"
let s = parts.join(", ");       // "hello, world, rust"
let s = parts.concat();         // "helloworldrust"（无分隔符）
```

---

## 6. UTF-8 编码详解

Rust 的 `String` 和 `&str` **始终是有效的 UTF-8**。UTF-8 是变长编码：

| 字符范围 | 字节数 | 示例 |
|---------|--------|------|
| U+0000 ~ U+007F | 1 字节 | ASCII：`'a'` = `[97]` |
| U+0080 ~ U+07FF | 2 字节 | 西里尔字母：`'Й'` = `[208, 153]` |
| U+0800 ~ U+FFFF | 3 字节 | 中文：`'你'` = `[228, 189, 160]` |
| U+10000 ~ U+10FFFF | 4 字节 | Emoji：`'😊'` = `[240, 159, 152, 138]` |

### 三个层次理解字符串

以印地语 `"नमस्ते"` 为例：

```rust
let s = "नमस्ते";

// 第一层：字节 (bytes) — 18 个 u8 值
s.bytes(); // [224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164, 224, 165, 135]

// 第二层：Unicode 标量值 (chars) — 6 个 char
s.chars(); // ['न', 'म', 'स', '्', 'त', 'े']  — 包含组合字符（如变音符号）

// 第三层：字素簇 (grapheme clusters) — 4 个视觉上的"字母"
// ["न", "म", "स्", "ते"] — 需要 unicode-segmentation crate
```

### `.len()` 返回的是字节数，不是字符数！

```rust
let s1 = String::from("Hola");         // .len() = 4 （每个字符 1 字节）
let s2 = String::from("Здравствуйте"); // .len() = 24（每个西里尔字符 2 字节）
let s3 = String::from("你好");          // .len() = 6 （每个中文字符 3 字节）
let s4 = String::from("😊");           // .len() = 4 （emoji 4 字节）

// 获取字符数量
s3.chars().count(); // 2
```

---

## 7. 索引与切片

### 为什么不能用索引访问字符串？

```rust
let s = String::from("hello");
// let h = s[0];  // ❌ 编译错误！Rust 不支持字符串索引
```

**三个原因**：
1. **返回类型不明确**：应该返回字节、字符还是字素簇？
2. **UTF-8 变长编码**：`s[0]` 可能只是多字节字符的一部分
3. **性能保证**：索引操作应该是 O(1)，但 UTF-8 中确定第 n 个字符需要从头遍历

### 字符串切片（使用范围）

```rust
let hello = "Здравствуйте"; // 每个西里尔字母 2 字节

let s = &hello[0..4];  // ✅ "Зд" — 前 4 个字节 = 2 个字符
// let s = &hello[0..1]; // ❌ panic! 字节索引 1 在字符 'З' 的内部

// 安全的切片方式（不会 panic）
let s = hello.get(0..4);    // Some("Зд")
let s = hello.get(0..1);    // None（不在字符边界上）
```

> ⚠️ **切片索引必须在 UTF-8 字符边界上**，否则会 panic。使用 `.get()` 方法可以安全处理。

### 字符边界检测

```rust
let s = "你好世界";
s.is_char_boundary(0);  // true  — 第一个字符的开始
s.is_char_boundary(3);  // true  — 第二个字符的开始
s.is_char_boundary(1);  // false — 在 '你' 字符的中间

// 找到最近的字符边界
s.floor_char_boundary(4);  // 3  — 向下取到最近的边界
s.ceil_char_boundary(4);   // 6  — 向上取到最近的边界
```

---

## 8. 遍历字符串

### 按字符遍历 (chars)

```rust
for c in "你好Rust".chars() {
    println!("{c}");
}
// 你
// 好
// R
// u
// s
// t
```

### 按字节遍历 (bytes)

```rust
for b in "你好".bytes() {
    println!("{b}");
}
// 228, 189, 160, 229, 165, 189
```

### 带索引遍历 (char_indices)

```rust
for (i, c) in "你好".char_indices() {
    println!("字节索引 {i}: {c}");
}
// 字节索引 0: 你
// 字节索引 3: 好
```

### 按行遍历 (lines)

```rust
let text = "第一行\n第二行\n第三行";
for line in text.lines() {
    println!("{line}");
}
```

### 按空白分割 (split_whitespace)

```rust
let s = "  hello   world  rust  ";
let words: Vec<&str> = s.split_whitespace().collect();
// ["hello", "world", "rust"]
```

### 字素簇遍历（需要外部 crate）

```rust
// Cargo.toml: unicode-segmentation = "1.10"
use unicode_segmentation::UnicodeSegmentation;

let s = "नमस्ते";
let graphemes: Vec<&str> = s.graphemes(true).collect();
// ["न", "म", "स्", "ते"]
```

---

## 9. 常用方法速查

### String 自身方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `String::new()` | 创建空字符串 | `let s = String::new();` |
| `String::from(s)` | 从 &str 创建 | `let s = String::from("hi");` |
| `String::with_capacity(n)` | 预分配容量 | `let s = String::with_capacity(10);` |
| `.len()` | 字节长度 | `"你好".len()` → `6` |
| `.is_empty()` | 是否为空 | `"".is_empty()` → `true` |
| `.capacity()` | 已分配容量 | |
| `.push(char)` | 追加字符 | `s.push('!');` |
| `.push_str(&str)` | 追加字符串切片 | `s.push_str("hi");` |
| `.pop()` | 弹出末尾字符 | `s.pop()` → `Some('o')` |
| `.remove(idx)` | 移除指定位置字符 | `s.remove(0)` → `'h'` |
| `.insert(idx, char)` | 插入字符 | `s.insert(0, 'H');` |
| `.insert_str(idx, &str)` | 插入字符串 | `s.insert_str(0, "Hi");` |
| `.truncate(len)` | 截断到指定长度 | `s.truncate(5);` |
| `.clear()` | 清空（保留容量） | `s.clear();` |
| `.drain(range)` | 移除范围并返回迭代器 | `s.drain(0..3)` |
| `.retain(f)` | 保留满足条件的字符 | `s.retain(char::is_alphanumeric)` |
| `.reserve(n)` | 额外预留 n 字节 | `s.reserve(100);` |
| `.shrink_to_fit()` | 收缩容量到长度 | `s.shrink_to_fit();` |
| `.as_str()` | 转为 &str | `let r: &str = s.as_str();` |
| `.as_bytes()` | 转为 &[u8] | `let b = s.as_bytes();` |
| `.into_bytes()` | 消耗并转为 Vec<u8> | `let v = s.into_bytes();` |
| `.split_off(idx)` | 在索引处分割 | |
| `.replace_range(range, &str)` | 原地替换范围 | |

### str 切片方法（String 通过 Deref 继承）

#### 搜索

| 方法 | 说明 | 示例 |
|------|------|------|
| `.contains(pat)` | 是否包含 | `"hello".contains("ell")` → `true` |
| `.starts_with(pat)` | 是否以...开头 | `"hello".starts_with("he")` → `true` |
| `.ends_with(pat)` | 是否以...结尾 | `"hello".ends_with("lo")` → `true` |
| `.find(pat)` | 查找首次出现的字节索引 | `"hello".find('l')` → `Some(2)` |
| `.rfind(pat)` | 从后往前查找 | `"hello".rfind('l')` → `Some(3)` |
| `.matches(pat)` | 所有匹配的迭代器 | `"abcabc".matches("ab")` |
| `.match_indices(pat)` | 匹配的 (索引, 文本) 对 | |

#### 分割

| 方法 | 说明 | 示例 |
|------|------|------|
| `.split(pat)` | 按模式分割 | `"a,b,c".split(',')` → `["a","b","c"]` |
| `.splitn(n, pat)` | 最多分成 n 份 | `"a,b,c".splitn(2, ',')` → `["a","b,c"]` |
| `.rsplit(pat)` | 从后往前分割 | |
| `.split_once(pat)` | 只分割一次 | `"a=b=c".split_once('=')` → `Some(("a","b=c"))` |
| `.split_whitespace()` | 按空白分割 | |
| `.lines()` | 按行分割 | |

#### 裁剪

| 方法 | 说明 | 示例 |
|------|------|------|
| `.trim()` | 去两端空白 | `" hi ".trim()` → `"hi"` |
| `.trim_start()` | 去左侧空白 | `" hi ".trim_start()` → `"hi "` |
| `.trim_end()` | 去右侧空白 | `" hi ".trim_end()` → `" hi"` |
| `.trim_matches(pat)` | 去两端匹配字符 | `"xxhixx".trim_matches('x')` → `"hi"` |
| `.strip_prefix(pat)` | 去掉前缀 | `"hello".strip_prefix("he")` → `Some("llo")` |
| `.strip_suffix(pat)` | 去掉后缀 | `"hello".strip_suffix("lo")` → `Some("hel")` |

#### 大小写转换

| 方法 | 说明 |
|------|------|
| `.to_uppercase()` | Unicode 大写（返回新 String） |
| `.to_lowercase()` | Unicode 小写（返回新 String） |
| `.to_ascii_uppercase()` | 仅 ASCII 大写 |
| `.to_ascii_lowercase()` | 仅 ASCII 小写 |
| `.eq_ignore_ascii_case(other)` | ASCII 不区分大小写比较 |

#### 替换

| 方法 | 说明 | 示例 |
|------|------|------|
| `.replace(from, to)` | 替换所有匹配 | `"aabb".replace("a", "x")` → `"xxbb"` |
| `.replacen(from, to, n)` | 替换前 n 个 | `"aabb".replacen("a", "x", 1)` → `"xabb"` |

#### 其他

| 方法 | 说明 |
|------|------|
| `.repeat(n)` | 重复 n 次 |
| `.chars()` | 字符迭代器 |
| `.bytes()` | 字节迭代器 |
| `.char_indices()` | (字节索引, 字符) 迭代器 |
| `.is_ascii()` | 是否全是 ASCII |
| `.is_char_boundary(idx)` | 索引是否在字符边界 |
| `.parse::<T>()` | 解析为其他类型 |
| `.encode_utf16()` | 转为 UTF-16 迭代器 |

### 模式 (Pattern) 参数支持的类型

上面标注 `pat` 的参数都支持以下类型：

```rust
// 1. &str — 子字符串匹配
"hello world".contains("world");

// 2. char — 单字符匹配
"hello".find('l');

// 3. &[char] — 字符集匹配（任意一个字符即可）
"hello".trim_matches(&['h', 'o'][..]);   // "ell"

// 4. 闭包 FnMut(char) -> bool — 自定义匹配条件
"h3ll0".matches(|c: char| c.is_numeric()); // ["3", "0"]
```

---

## 10. 字符串类型转换

### 基础转换

```rust
// &str → String（需要分配堆内存）
let s: String = "hello".to_string();
let s: String = String::from("hello");
let s: String = "hello".to_owned();
let s: String = "hello".into();

// String → &str（零成本，不分配内存）
let s = String::from("hello");
let r: &str = &s;          // 通过 Deref 强制转换
let r: &str = s.as_str();  // 显式转换
let r: &str = &s[..];      // 通过切片
```

### 数值 ↔ 字符串

```rust
// 数值 → String
let s = 42.to_string();           // "42"
let s = format!("{:.2}", 3.14);   // "3.14"
let s = 255_u8.to_string();       // "255"

// String → 数值（使用 parse）
let n: i32 = "42".parse().unwrap();          // 42
let f: f64 = "3.14".parse().unwrap();        // 3.14
let n = "42".parse::<i32>().unwrap();        // turbofish 语法
let n: Result<i32, _> = "not_a_number".parse(); // Err(...)
```

### 字节 ↔ 字符串

```rust
// &[u8] → &str
let bytes: &[u8] = &[104, 101, 108, 108, 111];
let s = std::str::from_utf8(bytes).unwrap();        // "hello"

// &[u8] → String
let s = String::from_utf8(bytes.to_vec()).unwrap();  // "hello"
let s = String::from_utf8_lossy(bytes);              // Cow<str>，无效字节替换为 �

// String → Vec<u8>
let bytes: Vec<u8> = String::from("hello").into_bytes();

// &str → &[u8]
let bytes: &[u8] = "hello".as_bytes();
```

### 常见类型转换表

| 从 | 到 | 方法 |
|----|-----|------|
| `&str` | `String` | `.to_string()` / `String::from()` / `.to_owned()` |
| `String` | `&str` | `&s` / `.as_str()` / `&s[..]` |
| `&[u8]` | `&str` | `std::str::from_utf8(bytes)?` |
| `&[u8]` | `String` | `String::from_utf8(vec)?` |
| `String` | `Vec<u8>` | `.into_bytes()` |
| `&str` | `&[u8]` | `.as_bytes()` |
| `i32` 等 | `String` | `.to_string()` / `format!()` |
| `&str` | `i32` 等 | `.parse::<i32>()?` |
| `String` | `Box<str>` | `.into_boxed_str()` |
| `&CStr` | `&str` | `.to_str()?` |
| `CString` | `String` | `.into_string()?` |
| `&str` | `CString` | `CString::new(s)?` |
| `&OsStr` | `&str` | `.to_str()` (可能失败) |
| `OsString` | `String` | `.into_string()` (可能失败) |
| `String` | `OsString` | `OsString::from(s)` / `.into()` |
| `&Path` | `&str` | `.to_str()` (可能失败) |
| `PathBuf` | `String` | `.into_os_string().into_string()?` |
| `String` | `PathBuf` | `PathBuf::from(s)` |

---

## 11. Deref 强制转换

`String` 实现了 `Deref<Target = str>`，这意味着：

```rust
fn greet(name: &str) {
    println!("Hello, {name}!");
}

let s = String::from("Rust");

greet(&s);      // ✅ &String 自动转为 &str（Deref 强制转换）
greet("Rust");  // ✅ &str 直接传入
```

### 关键点

1. **零成本**：编译时解析，无运行时开销。只是复用 String 内部的指针和长度
2. **链式转换**：`&Rc<String>` → `&String` → `&str` 可以自动完成
3. **也适用于**：`Box<String>`、`Arc<String>` 等智能指针
4. **函数参数建议**：优先使用 `&str` 而非 `&String`，这样既能接受 `String` 也能接受字符串字面值

```rust
// ❌ 不推荐 — 只能接受 &String
fn bad(s: &String) { ... }

// ✅ 推荐 — 同时接受 &String 和 &str
fn good(s: &str) { ... }
```

### `Deref` vs `AsRef`

```rust
// Deref: 隐式转换
fn takes_str(s: &str) {}
let s = String::from("hi");
takes_str(&s);  // 自动 Deref

// AsRef: 显式泛型约束
fn takes_asref(s: impl AsRef<str>) {
    let s: &str = s.as_ref();
}
takes_asref("hello");           // &str
takes_asref(String::from("hi")); // String
```

---

## 12. Cow<str> 写时复制

`Cow<str>`（Clone-on-Write）是一个枚举，可以同时处理借用和拥有的字符串：

```rust
use std::borrow::Cow;

enum Cow<'a, str> {
    Borrowed(&'a str),     // 借用，不分配内存
    Owned(String),         // 拥有，已分配内存
}
```

### 典型用例：可能不需要修改的场景

```rust
use std::borrow::Cow;

fn normalize_whitespace(input: &str) -> Cow<str> {
    if input.contains("  ") {
        // 需要修改，分配新的 String
        Cow::Owned(input.split_whitespace().collect::<Vec<_>>().join(" "))
    } else {
        // 不需要修改，零成本借用
        Cow::Borrowed(input)
    }
}

let s1 = normalize_whitespace("hello world");     // Cow::Borrowed — 无分配
let s2 = normalize_whitespace("hello  world");    // Cow::Owned — 有分配

// Cow<str> 实现了 Deref<Target = str>，可以当 &str 使用
println!("{}", s1.len());
```

### 何时使用 Cow<str>

- 函数大多数情况返回借用，偶尔需要返回新创建的字符串
- 避免不必要的内存分配
- 配置值可能有默认值（借用），也可能有用户自定义值（拥有）

---

## 13. 字符串格式化

### format! 宏

```rust
// 基本格式化
let s = format!("Hello, {}!", "world");

// 命名参数
let name = "Rust";
let s = format!("Hello, {name}!");

// 位置参数
let s = format!("{0} is {1} and {0} is cool", "Rust", "fast");

// 数值格式化
let s = format!("{:.2}", 3.14159);      // "3.14" — 2 位小数
let s = format!("{:08}", 42);           // "00000042" — 补零到 8 位
let s = format!("{:>10}", "hi");        // "        hi" — 右对齐 10 宽
let s = format!("{:<10}", "hi");        // "hi        " — 左对齐
let s = format!("{:^10}", "hi");        // "    hi    " — 居中
let s = format!("{:#b}", 42);           // "0b101010" — 二进制
let s = format!("{:#o}", 42);           // "0o52" — 八进制
let s = format!("{:#x}", 255);          // "0xff" — 十六进制
let s = format!("{:#X}", 255);          // "0xFF" — 大写十六进制
let s = format!("{:e}", 1000.0);        // "1e3" — 科学计数法
```

### Display 和 Debug trait

```rust
use std::fmt;

struct Point {
    x: f64,
    y: f64,
}

// Display — 用户友好的格式化（用于 {} ）
impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

// Debug — 调试格式化（用于 {:?} ）— 通常用 derive 自动实现
#[derive(Debug)]
struct Color {
    r: u8, g: u8, b: u8,
}

let p = Point { x: 1.0, y: 2.0 };
println!("{p}");    // Display: (1.0, 2.0)
println!("{p:?}");  // 如果也实现了 Debug

let c = Color { r: 255, g: 0, b: 128 };
println!("{c:?}");    // Debug: Color { r: 255, g: 0, b: 128 }
println!("{c:#?}");   // 美化 Debug（多行缩进）
```

### write! 宏（写入到实现了 Write 的类型）

```rust
use std::fmt::Write;

let mut buf = String::new();
write!(buf, "Hello, {}!", "world").unwrap();
writeln!(buf, " Line 2").unwrap();
// buf = "Hello, world! Line 2\n"
```

---

## 14. Rust 中的其他字符串类型

| 类型 | 用途 | 编码 |
|------|------|------|
| `String` / `&str` | 通用文本处理 | UTF-8（保证有效） |
| `OsString` / `&OsStr` | 操作系统交互（文件名、环境变量） | 平台相关 |
| `CString` / `&CStr` | C 语言互操作（FFI） | 以 null 结尾，无内部 null |
| `PathBuf` / `&Path` | 文件路径 | 基于 OsString |
| `Vec<u8>` / `&[u8]` | 原始字节序列 | 无编码保证 |
| `Box<str>` | 不可变的堆分配字符串 | UTF-8 |

### OsString / OsStr

```rust
use std::ffi::{OsString, OsStr};

let os_str = OsStr::new("hello");
let os_string = OsString::from("hello");

// OsStr → &str （可能失败，非 UTF-8 时返回 None）
let s: Option<&str> = os_str.to_str();

// OsString → String （可能失败）
let s: Result<String, OsString> = os_string.into_string();
```

### CString / CStr

```rust
use std::ffi::{CString, CStr};

// Rust → C
let c_string = CString::new("hello").unwrap(); // 添加 null 终止符
// ⚠️ 如果字符串中间包含 null 字节会返回错误

// C → Rust
let c_str: &CStr = c_string.as_c_str();
let s: &str = c_str.to_str().unwrap();
```

---

## 15. 性能优化技巧

### 1. 预分配容量

```rust
// ❌ 可能多次重新分配
let mut s = String::new();
for i in 0..1000 {
    s.push_str(&i.to_string());
}

// ✅ 一次性分配足够空间
let mut s = String::with_capacity(4000);
for i in 0..1000 {
    s.push_str(&i.to_string());
}
```

### 2. 避免不必要的 clone/to_string

```rust
// ❌ 不必要的克隆
fn process(s: String) {
    println!("{s}");
}
let s = String::from("hello");
process(s.clone()); // 如果后面还需要 s，才需要 clone

// ✅ 借用即可
fn process(s: &str) {
    println!("{s}");
}
let s = String::from("hello");
process(&s); // 零成本
```

### 3. 使用 Cow<str> 避免不必要的分配

```rust
use std::borrow::Cow;

// 大多数情况不分配，只在需要修改时分配
fn escape_html(input: &str) -> Cow<str> {
    if input.contains('&') || input.contains('<') || input.contains('>') {
        Cow::Owned(input.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;"))
    } else {
        Cow::Borrowed(input)
    }
}
```

### 4. 用 format! 替代多次 + 拼接

```rust
// ❌ 多次分配和拷贝
let s = s1 + " " + &s2 + " " + &s3;

// ✅ 一次分配
let s = format!("{s1} {s2} {s3}");
```

### 5. 收缩不再变化的字符串

```rust
let mut s = String::with_capacity(1000);
s.push_str("short text");
s.shrink_to_fit(); // 释放多余的容量
```

### 6. 字符串拼接大量片段时使用 join

```rust
let parts: Vec<&str> = vec!["a", "b", "c", "d"];
let result = parts.join(", "); // 比循环 push_str 更高效
```

---

## 16. 常见陷阱与最佳实践

### 陷阱 1：`.len()` 不是字符数

```rust
let s = "你好";
println!("{}", s.len());         // 6（字节数）
println!("{}", s.chars().count()); // 2（字符数）
```

### 陷阱 2：切片 panic

```rust
let s = "你好";
// let bad = &s[0..1]; // ❌ panic! 1 不是字符边界
let good = &s[0..3];   // ✅ "你"
let safe = s.get(0..1); // ✅ None（不会 panic）
```

### 陷阱 3：`+` 移动左操作数

```rust
let s1 = String::from("hello");
let s2 = String::from(" world");
let s3 = s1 + &s2;
// println!("{s1}"); // ❌ 编译错误：s1 已被移动
println!("{s2}");    // ✅ s2 只是借用
```

### 陷阱 4：字符串比较是字节级别的

```rust
// Unicode 规范化问题
let a = "café";  // é 是单个码点 U+00E9
let b = "café";  // é 是 e + 组合变音符 U+0065 U+0301
// a 和 b 视觉上相同，但字节不同，== 可能返回 false
// 需要使用 unicode-normalization crate 进行规范化比较
```

### 陷阱 5：忘记 String 是堆分配的

```rust
// 在热路径中避免频繁创建 String
// ❌
for _ in 0..100000 {
    let s = String::from("temp");  // 每次循环都堆分配
    process(&s);
}
// ✅
let s = String::from("temp");
for _ in 0..100000 {
    process(&s);  // 复用同一个 String
}
```

### 最佳实践总结

1. **函数参数用 `&str`**，不要用 `&String`
2. **需要所有权时才用 `String`**
3. **用 `format!` 拼接多个字符串**，比 `+` 更清晰且不移动所有权
4. **注意 `.len()` 是字节长度**，用 `.chars().count()` 获取字符数
5. **切片时确保在字符边界上**，或使用 `.get()` 安全切片
6. **预分配容量**减少重新分配
7. **使用 `Cow<str>`** 在可能不需要分配时避免分配
8. **明确你需要的是字节、字符还是字素簇**

---

## 17. 字符串与集合

### 作为 HashMap 的键

```rust
use std::collections::HashMap;

let mut map = HashMap::new();

// String 作为键
map.insert(String::from("name"), "Alice");

// 用 &str 查找（得益于 Borrow trait）
let value = map.get("name"); // ✅ 不需要创建 String

// 用 .entry() API
map.entry(String::from("age")).or_insert("30");
```

### 从迭代器收集

```rust
// 收集字符为字符串
let s: String = vec!['h', 'e', 'l', 'l', 'o'].into_iter().collect();

// 字符串向量拼接
let words = vec!["hello", "world"];
let sentence: String = words.join(" ");

// 用 Iterator 处理字符串
let upper: String = "hello".chars().map(|c| c.to_uppercase().next().unwrap()).collect();
// "HELLO"

// 过滤字符
let digits: String = "h3ll0 w0rld".chars().filter(|c| c.is_numeric()).collect();
// "300"
```

---

## 18. 正则表达式

Rust 标准库不包含正则表达式，需要使用 `regex` crate：

```toml
# Cargo.toml
[dependencies]
regex = "1"
```

```rust
use regex::Regex;

// 基本匹配
let re = Regex::new(r"^\d{4}-\d{2}-\d{2}$").unwrap();
assert!(re.is_match("2024-01-15"));

// 查找
let re = Regex::new(r"\d+").unwrap();
let text = "年龄: 25, 身高: 175";
for mat in re.find_iter(text) {
    println!("{}", mat.as_str()); // "25", "175"
}

// 捕获组
let re = Regex::new(r"(\w+)=(\w+)").unwrap();
let text = "name=Alice age=30";
for cap in re.captures_iter(text) {
    println!("键: {}, 值: {}", &cap[1], &cap[2]);
}

// 替换
let re = Regex::new(r"\d+").unwrap();
let result = re.replace_all("foo123bar456", "NUM");
// "fooNUMbarNUM"
```

> **性能提示**：`Regex::new()` 会编译正则表达式，应该避免在循环中重复调用。使用 `lazy_static!` 或 `std::sync::LazyLock` 缓存编译后的正则。

```rust
use std::sync::LazyLock;
use regex::Regex;

static EMAIL_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$").unwrap()
});

fn is_valid_email(email: &str) -> bool {
    EMAIL_RE.is_match(email)
}
```

---

## 19. 生命周期与字符串

### &str 的生命周期

```rust
// 字符串字面值有 'static 生命周期（存活于整个程序运行期间）
let s: &'static str = "hello";

// 从 String 借用的 &str 生命周期受限于 String
let string = String::from("hello");
let slice: &str = &string;  // slice 的生命周期 <= string 的生命周期
// drop(string);  // ❌ 如果这样做，slice 就悬空了

// 函数中的生命周期
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

### 结构体中的字符串

```rust
// 拥有所有权 — 简单安全，无生命周期问题
struct User {
    name: String,
}

// 借用 — 需要标注生命周期
struct UserRef<'a> {
    name: &'a str,
}

// 灵活方式 — Cow
use std::borrow::Cow;
struct Config<'a> {
    name: Cow<'a, str>,
}
```

### 常见生命周期模式

```rust
// 返回 &str 时，生命周期必须来自输入参数
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    s
}

// 不能返回局部变量的 &str
fn bad() -> &str {
    let s = String::from("hello");
    // &s  // ❌ s 在函数结束时被释放
    // 应该返回 String 或 Cow<str>
    unreachable!()
}
```

---

## 附录：速查对照表

| 操作 | 方法 | 返回类型 |
|------|------|---------|
| 创建空字符串 | `String::new()` | `String` |
| 从字面值创建 | `String::from("...")` / `"...".to_string()` | `String` |
| 获取字节长度 | `.len()` | `usize` |
| 获取字符数 | `.chars().count()` | `usize` |
| 是否为空 | `.is_empty()` | `bool` |
| 追加字符串 | `.push_str(&str)` | `()` |
| 追加字符 | `.push(char)` | `()` |
| 拼接 | `format!("{}{}", a, b)` | `String` |
| 包含检查 | `.contains("...")` | `bool` |
| 查找位置 | `.find("...")` | `Option<usize>` |
| 替换 | `.replace("old", "new")` | `String` |
| 去空白 | `.trim()` | `&str` |
| 分割 | `.split(',')` | `Split<char>` |
| 大写 | `.to_uppercase()` | `String` |
| 小写 | `.to_lowercase()` | `String` |
| 转为 &str | `.as_str()` / `&s` | `&str` |
| 转为字节 | `.as_bytes()` | `&[u8]` |
| 解析数值 | `.parse::<i32>()` | `Result<i32, _>` |
| 按字符遍历 | `.chars()` | `Chars` |
| 按字节遍历 | `.bytes()` | `Bytes` |
| 按行遍历 | `.lines()` | `Lines` |

---

> **参考来源**：
> - [The Rust Book - Ch.8.2 Strings](https://doc.rust-lang.org/book/ch08-02-strings.html)
> - [String in std::string - Rust 官方文档](https://doc.rust-lang.org/std/string/struct.String.html)
> - [str primitive - Rust 官方文档](https://doc.rust-lang.org/std/primitive.str.html)
> - [Rust By Example - Strings](https://doc.rust-lang.org/rust-by-example/std/str.html)
> - [Rust Conversions Reference](https://nicholasbishop.github.io/rust-conversions/)
