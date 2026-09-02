# 08 · 泛型、Trait 与生命周期

> 体系定位：Rust 实现"零成本抽象"的三件套。本文建立直觉，详细挖潜见 `补充知识点/07-泛型Trait与生命周期知识手册.md`、`12-Rust_Trait知识手册.md`。
> 生命周期是借用规则的标注，配套 [04-借用与引用](./04-借用与引用.md)。

---

## 1. 泛型：不丢失性能的参数化类型

```rust
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {  // T 是类型参数 + 约束
    let mut max = list[0];
    for &item in list {
        if item > max { max = item; }
    }
    max
}
```

泛型在编译期**单态化（monomorphization）**：为用到的每种类型各生成一份代码。所以泛型函数与手写具体类型版本**运行速度完全一致**——零成本抽象（对比 Java 泛型有装箱/类型擦除开销）。

---

## 2. Trait：定义共享行为（≈ interface）

```rust
trait Summary {
    fn summarize(&self) -> String;          // 必须实现

    fn default_tag(&self) -> String {        // 默认实现，可覆盖
        String::from("(read more...)")
    }
}

struct News { headline: String }
impl Summary for News {
    fn summarize(&self) -> String {
        format!("{}", self.headline)
    }
}

fn notify(item: &impl Summary) {            // trait bound：接受任何实现 Summary 的
    println!("Breaking: {}", item.summarize());
}
```

- `impl Trait`（参数）是 `T: Trait` 的语法糖。
- `dyn Trait`（返回/装箱）用于运行时多态（见 `补充知识点/12-Rust_Trait知识手册.md`）。
- 常用派生：`#[derive(Debug, Clone, PartialEq, Default)]`。

---

## 3. 生命周期：借用关系的标注

问题：返回引用时，编译器要知道返回的引用活多久：

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` 读作"生命周期 a"，约束：**返回的引用有效期 ≤ x 和 y 中较短的那个**。多数时候编译器能自动推断（生命周期省略规则），只有函数签名返回引用且来源不明时才需手写。

> 直觉：生命周期**不延长也不缩短**任何东西，只是向编译器证明"返回的引用不会比输入活得更久"，从而安全。

---

## 4. 三者合体

```rust
fn notify_latest<T: Summary + Clone>(item: &T) -> T {  // 泛型 + trait bound
    item.clone()
}
```

---

## ✅ 验收清单

- [ ] 解释泛型为何"零成本"
- [ ] 用 `trait` 定义行为并 `impl` 给结构体
- [ ] 理解 `'a` 是"约束"而非"延长"

→ 下一篇：[09-集合类型VecStringHashMap](./09-集合类型VecStringHashMap.md)
