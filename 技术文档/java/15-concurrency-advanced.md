# 15 - 并发进阶（synchronized / Lock / JUC / CompletableFuture）

> 来源：Oracle 官方《The Java™ Tutorials》— Essential Classes > Concurrency（标准 JUC 知识补充）
> 补充：JEP 444 虚拟线程（已详述于 `10-virtual-threads.md`）
> 说明：Oracle 并发教程为 JS 渲染页，下列机制基于 Java SE 标准 API 与官方教程结构整理。

Java 并发从底层锁到高层异步编排，工具链完整。本文覆盖传统并发核心，与 `10-virtual-threads.md` 互补。

---

## 一、线程基础

```java
Thread t = new Thread(() -> System.out.println("run"));
t.start();           // 启动（平台线程）
t.join();            // 等待结束
```

- `Runnable` 接口（单方法）是传统任务抽象；Java 21 后优先用虚拟线程（见 10）。

---

## 二、synchronized（内置锁）

```java
public class Counter {
    private int count = 0;
    public synchronized void inc() { count++; }       // 方法锁（锁 this）
    public void dec() {
        synchronized (this) { count--; }              // 代码块锁
    }
}
```

- JVM 内置监视器锁，**可重入**，自动加锁/释放。
- 缺点：不能中断等待、不能超时、颗粒度固定。

---

## 三、Lock 接口（java.util.concurrent.locks）

```java
ReentrantLock lock = new ReentrantLock();
lock.lock();
try { /* 临界区 */ }
finally { lock.unlock(); }          // 必须手动释放

// 高级能力
if (lock.tryLock(1, TimeUnit.SECONDS)) { ... }   // 超时获取
lock.lockInterruptibly();                        // 可中断
```

- `ReentrantLock`：可重入，比 `synchronized` 灵活（超时、中断、公平锁）。
- `ReadWriteLock` / `ReentrantReadWriteLock`：读多写少场景，读共享、写独占。
- `StampedLock`（Java 8）：乐观读，更高并发。

---

## 四、线程安全集合（JUC）

| 类 | 说明 |
|---|---|
| `ConcurrentHashMap` | 高并发 Map（Java 8 起 CAS + `synchronized` 桶锁） |
| `CopyOnWriteArrayList` | 读多写少，写时复制 |
| `ConcurrentLinkedQueue` | 无锁队列 |
| `BlockingQueue`（`ArrayBlockingQueue`/`LinkedBlockingQueue`） | 生产者-消费者 |

```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.computeIfAbsent("k", k -> heavyInit());   // 原子操作
```

---

## 五、Executor 框架（线程池）

```java
ExecutorService pool = Executors.newFixedThreadPool(8);
Future<Integer> f = pool.submit(() -> 1 + 2);
int r = f.get();                  // 阻塞获取
pool.shutdown();
```

- 常见工厂：`newFixedThreadPool`、`newCachedThreadPool`、`newSingleThreadExecutor`。
- **避免使用 `newFixedThreadPool(Integer.MAX_VALUE)`** 类无线程上限；生产用 `ThreadPoolExecutor` 自定义。
- `ScheduledExecutorService`：定时/周期任务。

---

## 六、CompletableFuture（异步编排，Java 8+）

链式异步，避免回调地狱：

```java
CompletableFuture.supplyAsync(() -> fetchUser(id))
    .thenApplyAsync(user -> enrich(user))
    .thenAccept(result -> System.out.println(result))
    .exceptionally(ex -> { ex.printStackTrace(); return null; });

// 组合
CompletableFuture<Void> both = CompletableFuture.allOf(task1, task2);
```

- `supplyAsync` / `runAsync`：提交异步任务。
- `thenApply` / `thenAccept` / `thenCompose` / `thenCombine`：链式与组合。
- `exceptionally` / `handle`：错误处理。

> 注意：默认用 `ForkJoinPool.commonPool()`；IO 密集任务建议传入自定义 `Executor`（或 Java 21 虚拟线程执行器）。

---

## 七、原子类与可见性

- `volatile`：保证可见性、禁止重排序（不保证复合操作原子性）。
- `AtomicInteger` / `AtomicReference` / `LongAdder`（Java 8，高并发计数更优）：CAS 无锁。

```java
AtomicInteger ai = new AtomicInteger(0);
ai.incrementAndGet();             // 原子自增
```

---

## 八、与虚拟线程的关系

- 虚拟线程（`10-virtual-threads.md`）下，**同步阻塞代码即高吞吐**，多数场景无需手动 `CompletableFuture` 编排。
- `synchronized` 在虚拟线程中若阻塞会「钉住」载体，长临界区应换 `ReentrantLock`。

---

## 九、与系列其他文档的关系

- 虚拟线程是现代并发首选 → `10-virtual-threads.md`
- 对比 JS/TS（Node 单线程事件循环）：Java 是真多线程 + 锁，复杂但有并行能力；
  对比 Go：goroutine ≈ 虚拟线程，channel ≈ `BlockingQueue`。
- Spring 中 `@Async` 注解底层即线程池 + `CompletableFuture` → `13-spring-boot.md`
