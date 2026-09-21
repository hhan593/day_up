# Java 并发编程知识总纲

> 定位：Java 后端高并发的基石，面试必考。涉及线程、内存模型、锁、线程池、并发容器。
> 衔接：`02-java-middle/15-并发进阶.md`（API 用法）、`02-java-middle/34-并发底层原理JMM与锁.md`（happens-before/内存屏障/Mark Word 与锁状态/AQS/CAS，**总纲第二、三、四、七节的深挖全在那**）、`02-java-middle/35-线程池与线程协作.md`（七参数/流程推演/wait-notify/三大同步工具/ThreadLocal 泄漏，对应总纲第五、九节）、`02-java-middle/36-集合底层源码剖析.md`（并发容器底层，对应总纲第六节）、`02-java-middle/16-JVM内存模型与GC.md`、`10-distributed/README.md`（分布式并发）。

---

## 目录

- [一、线程基础](#一线程基础)
- [二、JMM 与 volatile](#二jmm-与-volatile)
- [三、synchronized](#三synchronized)
- [四、Lock 与 AQS](#四lock-与-aqs)
- [五、线程池](#五线程池)
- [六、并发容器](#六并发容器)
- [七、原子类与 CAS](#七原子类与-cas)
- [八、CompletableFuture 异步编排](#八completablefuture-异步编排)
- [九、ThreadLocal](#九threadlocal)
- [十、常见面试考点](#十常见面试考点)

---

## 一、线程基础

- 进程 vs 线程：进程是资源分配单位，线程是 CPU 调度单位，同进程线程共享堆/方法区，独有栈/PC。
- 创建线程：`Thread`、`Runnable`、`Callable`（有返回值 + `FutureTask`）、线程池（推荐）。
- 状态：NEW → RUNNABLE → BLOCKED / WAITING / TIMED_WAITING → TERMINATED。
- `wait()` / `notify()` 必须在 `synchronized` 内调用，释放锁并等待；`sleep()` 不释放锁。
- 守护线程（`setDaemon(true)`）：JVM 退出时不等待它。

---

## 二、JMM 与 volatile

- **JMM（Java 内存模型）**：线程有工作内存，变量从主内存拷贝；`volatile` 保证**可见性 + 有序性（禁止指令重排）**，但不保证原子性。
- `volatile` 经典用法：状态标志位、双重检查锁单例。

```java
public class Singleton {
    private static volatile Singleton instance;
    public static Singleton get() {
        if (instance == null) {                 // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null)           // 第二次检查
                    instance = new Singleton();
            }
        }
        return instance;
    }
}
```

- `synchronized` 保证原子性 + 可见性 + 有序性（锁的 happens-before）。

---

## 三、synchronized

- 锁对象：普通方法锁 `this`，静态方法锁 `Class`，代码块锁指定对象。
- 锁升级（JDK 6+，偏向锁已废弃趋势）：无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁（OS 互斥）。
- 可重入：同一线程可重复进入已持有的锁。
- 缺点：不可中断、非公平、无法多条件等待（相对 `Lock`）。

---

## 四、Lock 与 AQS

```java
ReentrantLock lock = new ReentrantLock();   // 默认非公平，可传 true 公平
lock.lock();
try {
    // 临界区
} finally {
    lock.unlock();                          // 必须 finally 释放
}
```

- `ReentrantLock`：可中断（`lockInterruptibly`）、可超时（`tryLock`）、公平可选、配合 `Condition` 多条件。
- `AQS`（AbstractQueuedSynchronizer）：JUC 同步器基石，`ReentrantLock`/`Semaphore`/`CountDownLatch` 都基于它（state + CLH 队列 + CAS）。
- `ReadWriteLock`：`ReentrantReadWriteLock` 读共享写独占，适合读多写少。

---

## 五、线程池

```java
ThreadPoolExecutor pool = new ThreadPoolExecutor(
    2,                                    // corePoolSize
    4,                                    // maximumPoolSize
    60, TimeUnit.SECONDS,                 // keepAliveTime
    new LinkedBlockingQueue<>(100),       // workQueue
    Executors.defaultThreadFactory(),
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
);
```

- 执行流程：核心线程 → 队列 → 非核心线程 → 拒绝策略。
- 拒绝策略：`AbortPolicy`（抛异常）、`CallerRunsPolicy`（调用者线程执行）、`DiscardPolicy`（丢弃）、`DiscardOldestPolicy`（丢弃最老）。
- **禁止使用 `Executors.newFixedThreadPool` 等**（可能 OOM，队列无界）；手动 `ThreadPoolExecutor` 更可控。
- `CompletableFuture` 可指定线程池避免共用 ForkJoinPool。

---

## 六、并发容器

| 容器 | 说明 |
|------|------|
| `ConcurrentHashMap` | 分段/CAS+synchronized，高并发 KV（JDK 8 弃分段锁） |
| `CopyOnWriteArrayList` | 写时复制，读无锁，适合读多写少 |
| `ConcurrentLinkedQueue` | 无锁 CAS 队列 |
| `BlockingQueue` | `ArrayBlockingQueue`/`LinkedBlockingQueue`/`SynchronousQueue`（线程池用） |
| `ConcurrentSkipListMap` | 跳表，有序并发 Map |

---

## 七、原子类与 CAS

```java
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();              // CAS 自旋，无锁
```

- CAS（Compare And Swap）：V 期望 A 则更新为 B，失败重试。
- ABA 问题：用 `AtomicStampedReference`（版本号）解决。
- 原子类：`AtomicInteger`/`LongAdder`（高并发计数更优，分段 Cell）/`AtomicReference`。

---

## 八、CompletableFuture 异步编排

```java
CompletableFuture<User> u = CompletableFuture.supplyAsync(() -> getUser(id), pool);
CompletableFuture<Order> o = CompletableFuture.supplyAsync(() -> getOrder(id), pool);
u.thenCombine(o, (user, order) -> merge(user, order))
 .thenAccept(System.out::println);
```

- 编排：`thenApply`/`thenAccept`/`thenCompose`/`thenCombine`/`allOf`/`anyOf`。
- 指定自定义线程池，避免阻塞 ForkJoinPool.commonPool。

---

## 九、ThreadLocal

```java
private static final ThreadLocal<SimpleDateFormat> FMT =
    ThreadLocal.withInitial(SimpleDateFormat::new);
```

- 每个线程独立副本，常用于**跨方法传参**（如请求上下文、事务连接）。
- 风险：线程池场景下需 `remove()` 清理，否则**内存泄漏/数据串号**（value 强引用，key 弱引用）。
- 替代：阿里建议 `TransmittableThreadLocal`（跨线程池传递）。

---

## 十、常见面试考点

1. **volatile 能保原子性吗？** → 不能，仅可见性+有序性；`i++` 非原子。
2. **synchronized 和 Lock 区别？** → Lock 可中断/超时/公平/多条件，synchronized 自动释放、JVM 优化。
3. **线程池参数与执行流程？** → 核心→队列→最大→拒绝。
4. **为什么不用 Executors？** → 无界队列可能 OOM。
5. **CAS 是什么、ABA 怎么解？** → 比较交换；版本号 `AtomicStampedReference`。
6. **ThreadLocal 内存泄漏？** → 不 remove 导致 value 泄漏，线程池尤甚。
7. **双重检查锁为何要 volatile？** → 防止指令重排导致拿到未初始化完成的对象。
8. **AQS 原理？** → state + CLH 队列 + CAS 入队/出队。
