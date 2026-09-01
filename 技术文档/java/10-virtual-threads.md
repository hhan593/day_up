# 10 - 虚拟线程（Virtual Threads，Java 21）

> 来源：JEP 444 Virtual Threads（Java 21 正式 GA）
> 官方：https://openjdk.org/jeps/444
> 补充：结合 web 资料（阿里云/百度云 Java 21 深度解析）对 API 用法做示例补充，已标注非 JEP 原文部分。

虚拟线程是 Java 21 最重要的并发革新，让**高吞吐并发**编写变得简单。

---

## 一、问题背景

- **平台线程（Platform Thread）**：1:1 映射 OS 线程，昂贵（默认栈 1MB），数量受限于 OS（几千个就吃紧）。
- 传统并发靠**线程池 + 回调**或 `CompletableFuture` 异步链，代码复杂、易错。
- 大量请求若每个都 `blocking`（DB / HTTP / 锁），平台线程被占满 → 吞吐崩溃。

虚拟线程：**M:N 调度**，海量（百万级）轻量用户态线程由 JVM 调度到少量平台线程（carrier），阻塞时自动让出载体，不浪费 OS 资源。

---

## 二、基本用法（JEP 444 原文 API）

### 1. 直接创建
```java
Thread vt = Thread.startVirtualThread(() -> {
    System.out.println("Hello Virtual Thread");
});
vt.join();
```

### 2. Thread.Builder（可配置名称、异常处理器）
```java
Thread vt = Thread.ofVirtual()
    .name("worker-", 0)                       // 名称前缀 + 序号
    .uncaughtExceptionHandler((t, e) -> e.printStackTrace())
    .start(() -> doWork());
```

### 3. ExecutorService（推荐，便于批量与生命周期）
```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> {
            Thread.sleep(1000);   // 阻塞也不占 OS 线程
            return doTask();
        });
    }
} // 离开 try 块自动等待所有任务完成（ExecutorService 实现了 AutoCloseable）
```

> `Executors.newVirtualThreadPerTaskExecutor()` 为每个任务创建一个虚拟线程，无需池大小调优。

---

## 三、核心原则（官方建议）

1. **不要用线程池限制虚拟线程数量**：每个任务一线程即可，调度交给 JVM。
2. **保持代码同步阻塞风格**：虚拟线程下，`sleep`/` blocking IO` 自动让出载体，无需改成异步 `CompletableFuture`。
3. **避免 `synchronized`  pinning**：`synchronized` 块内若阻塞，会「钉住（pin）」载体线程，削弱优势。建议用 `ReentrantLock` 替代长临界区 `synchronized`。
4. **不要在虚拟线程里做 CPU 密集长任务**且不放 yield；CPU 密集场景与平台线程相同。
5. **Thread-local 变重**：百万虚拟线程下 `ThreadLocal` 开销放大，建议改用 `ScopedValue`（Java 21 预览 / 22 孵化）。

---

## 四、与平台线程对比

| 维度 | 平台线程 | 虚拟线程 |
|---|---|---|
| 映射 | 1:1 OS 线程 | M:N 到载体线程 |
| 数量上限 | 数千 | 数百万 |
| 创建成本 | 高（MB 栈） | 极低 |
| 阻塞代价 | 占满 OS 线程 | 让出载体，几乎免费 |
| 调试 | 传统 | 支持 `jcmd` 诊断、堆栈可读 |

---

## 五、适用场景

- 高并发 Web 服务（每个请求一虚拟线程）。
- 大量阻塞 IO（DB、HTTP、消息队列）。
- 替代复杂异步回调，代码回归「顺序易读」。

> 不适合：极大量 CPU 计算（无并行加速）、或每任务极小且需极致低延迟（仍有调度开销）。

---

## 六、与系列其他文档的关系

- 虚拟线程让「同步阻塞代码」获得异步吞吐，配合 `07-lambda-functional.md` 的 Stream 适合 CPU 密集、虚拟线程适合 IO 密集。
- 对比 Go：`go func()` ≈ `Thread.startVirtualThread()`，理念一致（轻量协程）。
- 对比 Node.js：Node 用单线程事件循环 + 异步；Java 虚拟线程用多线程 + 同步，更直观。
- 对比 Kotlin 协程：概念相近，Java 21 原生无需额外库。

> 注：本篇第 2、5 节部分示例为社区资料补充（非 JEP 逐字原文），核心 API 与原则来自 JEP 444。
