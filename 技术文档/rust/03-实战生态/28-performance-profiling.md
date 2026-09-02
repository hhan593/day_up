# 28 · 性能剖析与优化（Performance Book）

> 官方来源：The Rust Performance Book（https://nnethercote.github.io/perf-book/，Nicholas Nethercote，2026-04-23 更新）
> 说明：本文基于官方 Performance Book 的 profiling 章节结构与标准工具整理（flamegraph/perf/dhat/tokio-console）。

Rust 以性能著称，但仍需剖析定位瓶颈。官方 Performance Book 是权威指南。

## 一、基准测试（micro-bench）

```toml
# Cargo.toml
[dev-dependencies]
criterion = "0.5"
```
```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
fn bench(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fib(black_box(20))));
}
criterion_group!(benches, bench);
criterion_main!(benches);
```
- `criterion`：统计严谨的基准（vs `test::Bencher` 需 nightly）。
- `black_box` 防止编译器优化掉被测代码。

## 二、火焰图（flamegraph）

```bash
cargo install flamegraph
cargo flamegraph --bin myapp       # Linux: perf；Mac: dtrace
# 生成 flamegraph.svg，浏览器打开看热点
```
- 火焰图横向=调用栈耗时，自上而下=调用链，宽=耗时长。
- 适合定位**CPU 热点函数**（算法/序列化/分配）。
- 与 Java 的 `async-profiler`、Node 的 `--prof` 同类（java/16 JVM 调优、node/09）。

## 三、perf（Linux 系统剖析器）

```bash
perf record --call-graph dwarf ./target/release/myapp
perf report
perf stat ./target/release/myapp    # 指令数/缓存命中/分支预测
```
- `perf stat` 看 CPU 缓存命中率、IPC——判断是计算密集还是内存带宽瓶颈。

## 四、堆分配分析（dhat / DHAT）

```bash
cargo install dhat
DHAT_DO_RUN=1 ./target/release/myapp   # 或 valgrind --tool=massif
```
- 定位**过多/过长生命周期的堆分配**：Rust 高频小对象分配会拖慢（对比 `15-Rust智能指针知识手册.md` 的 Box/Rc 选择）。
- 优化：用 `Cow`、对象池、栈上数组、避免 `clone`。

## 五、异步程序：tokio-console

```toml
[dependencies]
tokio = { version = "1", features = ["full", "tracing"] }
console-subscriber = "0.4"
```
```rust
console_subscriber::init();     // 启动后在另一终端
cargo run -p console-subscriber & tokio-console
```
- `tokio-console` 可视化：任务阻塞、唤醒延迟、空闲任务、低效 `spawn_blocking`（见 `18-async-await.md`）。
- 定位 async 卡点（如某任务长期占用线程、误用阻塞 I/O）。

## 六、常见优化手段

| 手段 | 说明 |
|---|---|
| 减少堆分配 | 用栈/`Cow`/`arrayvec` |
| 避免克隆 | 借用代替 `clone`（05 借用） |
| 选择合适集合 | `Vec` vs `SmallVec` vs `array` |
| 并行化 | rayon（数据并行）/ tokio（I/O 并行） |
| 编译优化 | `lto=true`、`codegen-units=1`、`opt-level=3`（20-Cargo） |
| 无锁结构 | 原子类型（17 并发） |

## 七、与系列对照

| Rust | 其他 |
|---|---|
| flamegraph/criterion | Java JMH（java/16）、Node benchmark |
| tokio-console | Java JFR / async-profiler、Node `--inspect` |
| perf/dhat | Java VisualVM / JOL（对象布局） |
| `opt-level`/`lto` | Java `-Xcompile`、GraalVM |

- Rust 无 GC 停顿，性能剖析更聚焦**算法与分配**（vs Java 关注 GC，java/16）。

> 延伸：`17-concurrency-parallel.md`、`18-async-await.md`、`20-cargo-advanced.md`、`技术文档/java/16-jvm-memory-model.md`。
