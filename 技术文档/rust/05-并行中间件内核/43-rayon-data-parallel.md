# 43. Rayon 数据并行（Data Parallelism）

> 来源可信度：**完整正文级**（基于 docs.rs `rayon 1.12.0`，2026-07-09 文档；rayon-core 1.13.0）
> 适用：需要把"对集合的循环/变换"轻松并行化，又不想手写线程与 channel 的场景。

## 1. Rayon 是什么

Rayon 是 Rust 的**数据并行**库，由 Niko Matsakis 与 Josh Stone（cuviper）维护。核心理念：

- 把顺序 `iter()` 换成 `par_iter()`，理想情况下**只改一行**就能并行。
- 底层使用**工作窃取（work-stealing）线程池**，自动把任务分摊到 CPU 核。
- 提供 `join` 原语做递归分治（fork-join）。

```toml
# Cargo.toml
rayon = "1.12"
# 依赖 rayon-core ^1.13
```

## 2. 最简单的并行迭代

```rust
use rayon::prelude::*;

fn main() {
    let v: Vec<i32> = (1..=10_000).collect();

    // 顺序写法
    // let sum: i32 = v.iter().map(|x| x * 2).sum();

    // 并行写法：仅把 iter() 换成 par_iter()
    let sum: i32 = v.par_iter().map(|x| x * 2).sum();

    println!("sum = {sum}");
}
```

`rayon::prelude` 导出了：

- `ParallelIterator`：并行迭代器通用方法（`map`/`filter`/`for_each`/`fold`/`reduce`/`sum`/`collect` 等）。
- `IndexedParallelIterator`：支持随机访问的并行迭代器（可 `par_sort`、`zip`、长度感知）。
- `IntoParallelIterator` / `IntoParallelRefIterator`：为 `Vec`/`slice`/`array`/`Range` 等实现，提供 `into_par_iter()` 与 `par_iter()`。

## 3. 常用并行操作

```rust
use rayon::prelude::*;

let v: Vec<i32> = (1..=1_000_000).collect();

// 过滤 + 映射 + 求和
let r = v.par_iter()
    .filter(|&&x| x % 2 == 0)
    .map(|x| x * x)
    .sum::<i64>();

// 短路查找（find_any 并行，find_first 保证顺序）
let found = v.par_iter().find_any(|&&x| x > 999_990);

// 归约：reduce 需要可结合且可交换的运算
let max = v.par_iter().cloned().reduce(|| 0, |a, b| a.max(b));

// 分组折叠 fold + 再 reduce（适合非交换运算，如字符串拼接）
let concatenated = v.par_iter()
    .fold(String::new, |mut s, x| { s.push_str(&x.to_string()); s })
    .reduce(String::new, |mut a, b| { a.push_str(&b); a });
```

> 注意：`fold` 在每个线程本地累积，`reduce` 再合并各线程结果。若运算**不满足交换律**（如浮点加法、顺序敏感拼接），优先用 `fold`+`reduce` 或接受 `find_any` 的非确定性。

## 4. 并行排序（par_sort）

```rust
use rayon::prelude::*;

let mut data = vec![5, 3, 8, 1, 9, 2];
data.par_sort();          // 稳定并行排序
data.par_sort_unstable(); // 不稳定但更快
println!("{:?}", data);
```

`par_sort` 直接作用于 `&mut [T]`（以及 `Vec`），对大数据集显著快于单线程 `sort`。

## 5. join 分治原语

`join(a, b)` 接收两个闭包，潜在并行执行，返回 `(A, B)` 元组：

```rust
use rayon::join;

fn fib(n: u64) -> u64 {
    if n < 2 { return n; }
    let (a, b) = join(|| fib(n - 1), || fib(n - 2));
    a + b
}

fn main() {
    println!("fib(20) = {}", fib(20));
}
```

- `join` 比"spawn 两个线程 + join 句柄"开销小得多，是 Rayon 递归任务的基础。
- 变体 `join_context` 可感知当前任务是否被其他线程**窃取**（用于任务调度感知逻辑）。

## 6. 自定义线程池（ThreadPoolBuilder）

```rust
use rayon::ThreadPoolBuilder;

fn main() -> Result<(), rayon::ThreadPoolBuildError> {
    let pool = ThreadPoolBuilder::new()
        .num_threads(4)
        .thread_name(|i| format!("rayon-worker-{i}"))
        .build()?;

    let result = pool.install(|| {
        (1..=1_000).into_par_iter().sum::<i64>()
    });
    println!("result = {result}");
    Ok(())
}
```

- 默认 Rayon 有一个**全局线程池**（按 CPU 核数），`par_iter()` 即用它。
- 用 `ThreadPoolBuilder::build()` 创建独立池，再用 `pool.install(|| ...)` 在指定作用域内运行并行代码，避免影响全局池。
- `spawn_handler` 可定制线程创建（如设置栈大小、绑定亲和性）。

## 7. 性能与正确性要点

| 场景 | 建议 |
|------|------|
| 数据量小（< 数千） | 并行开销可能大于收益，保持顺序 `iter()` |
| 闭包里有共享可变状态 | Rayon 要求 `Send + Sync`，用 `Mutex`/`RwLock` 或换 `fold` |
| 运算非交换（浮点） | 用 `fold`+`reduce`，接受顺序不确定性 |
| I/O 密集并行 | Rayon 不适合阻塞 I/O，交给 tokio/线程池 |
| panic 传播 | 某个任务 panic 会令 `par_iter` 整体 panic（类似线程） |

## 8. 与其他目录对照

- 与 `17-concurrency-parallel.md` 的 `std::thread` + `mpsc`：Rayon 适合**数据并行**（同一操作作用于集合），`std::thread` 适合**任务并行**（不同逻辑）。
- 与 `18-async-await.md` / `39-tokio-deep.md`：CPU 密集计算放 Rayon（避免阻塞 async runtime），I/O 并发放 tokio。二者常组合——`async` 中 `spawn_blocking` 调 Rayon 池。

## 9. 一句话总结

> 把 `iter()` 改成 `par_iter()`，Rayon 用工作窃取线程池替你并行化数据管道；递归任务用 `join`，需要隔离资源时用 `ThreadPoolBuilder`。
