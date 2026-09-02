# 09 · 集合类型：Vec / String / HashMap

> 体系定位：标准库最常用的三个集合。它们都**在堆上分配数据**，因此与所有权/借用规则紧密相关。
> 迭代器用法见 [11-迭代器与闭包](./11-迭代器与闭包.md)；深入见 `补充知识点/06-Rust_String知识手册.md`、`09-Rust集合类型与迭代器手册.md`。

---

## 1. Vec<T>：可增长数组

```rust
let mut v: Vec<i32> = Vec::new();
v.push(1); v.push(2);
let v2 = vec![1, 2, 3];          // 宏快速构造

let third = &v[2];               // ❌ 越界会 panic
let third = v.get(2);            // ✅ 返回 Option<&T>，安全
match third {
    Some(x) => println!("{x}"),
    None => println!("no third"),
}

for i in &v { println!("{i}"); } // 不可变借用遍历
for i in &mut v { *i += 1; }     // 可变借用修改
```

> 下标 `[i]` 越界直接 panic；`get(i)` 返回 `Option` 让你优雅处理。生产代码优先 `get` + `match`/`if let`。

---

## 2. String 与 &str

```rust
let mut s = String::from("hello");
s.push_str(" world");            // 追加
s.push('!');
let s2 = format!("{s}-{s}");     // 格式化拼接

let slice: &str = &s[0..5];      // &str：不拥有数据的视图
```

- `String`：可增长、堆分配、拥有所有权。
- `&str`：字符串切片，常作为函数参数（接受字面量与 `String` 都能自动借用）。
- 细节：`补充知识点/06-Rust_String知识手册.md`。

---

## 3. HashMap<K, V>

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Red"), 50);

let team = String::from("Blue");
let score = scores.get(&team).copied().unwrap_or(0);  // Option<&V> -> V

for (k, v) in &scores {              // 遍历
    println!("{k}: {v}");
}
```

注意插入时 `String` 的**所有权被移动进 HashMap**；若要保留原变量，先 `.clone()`。

---

## 4. 所有权提醒

集合把元素**移动**进来：

```rust
let s = String::from("x");
let mut v = vec![s];          // s 被移动进 v
// println!("{s}");          // ❌ s 已失效
```

---

## ✅ 验收清单

- [ ] 区分 `v[i]` 与 `v.get(i)` 的安全性差异
- [ ] 用 `&str` 作为函数参数
- [ ] 理解 `insert` 会移动元素所有权

→ 下一篇：[10-错误处理Result与Option](./10-错误处理Result与Option.md)
