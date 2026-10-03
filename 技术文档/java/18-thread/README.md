# Java 线程知识总纲

> 定位：线程是 CPU 调度的最小单位，Java 并发的一切起点。本篇聚焦**线程本身**：创建、状态、核心方法、中断、协作与虚拟线程。
> 衔接：锁与 JMM 深入见 `04-concurrency/README.md`、`02-java-middle/34-并发底层原理JMM与锁.md`；线程池与协作工具深入见 `02-java-middle/35-线程池与线程协作.md`；虚拟线程见 `02-java-middle/10-虚拟线程.md`；线程栈与内存见 `05-jvm/README.md`。

---

## 目录

- [一、线程与进程](#一线程与进程)
- [二、线程的创建方式](#二线程的创建方式)
- [三、线程的生命周期与状态](#三线程的生命周期与状态)
- [四、Thread 核心方法](#四thread-核心方法)
- [五、线程中断](#五线程中断)
- [六、线程协作](#六线程协作)
- [七、守护线程与线程优先级](#七守护线程与线程优先级)
- [八、线程安全初探](#八线程安全初探)
- [九、ThreadLocal 与线程封闭](#九threadlocal-与线程封闭)
- [十、虚拟线程（JDK 21）](#十虚拟线程jdk-21)
- [十一、常见面试考点](#十一常见面试考点)

---

## 一、线程与进程

- **进程**：资源分配的基本单位，拥有独立内存空间。
- **线程**：CPU 调度的基本单位，同一进程内多个线程**共享堆和方法区**，各自独有**虚拟机栈、程序计数器**（见 `05-jvm/README.md`）。
- 共享带来的便利：数据交换容易；共享带来的问题：**线程安全**（竞态、可见性）。
- 一个 Java 进程至少有线程：main 线程 + GC 线程等后台线程。

---

## 二、线程的创建方式

```java
// 1. 继承 Thread
class MyThread extends Thread {
    @Override public void run() { System.out.println("extend Thread"); }
}
new MyThread().start();

// 2. 实现 Runnable（推荐：任务与线程解耦，可复用线程池）
Runnable task = () -> System.out.println("runnable");
new Thread(task).start();

// 3. 实现 Callable + FutureTask（有返回值、可抛异常）
Callable<Integer> callable = () -> 42;
FutureTask<Integer> future = new FutureTask<>(callable);
new Thread(future).start();
Integer result = future.get();          // 阻塞获取结果

// 4. 线程池（生产推荐，见 02/35）
ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(task);

// 5. 虚拟线程（JDK 21+，见第十节）
Thread.startVirtualThread(() -> System.out.println("virtual"));
```

> 面试要点：**本质上创建线程只有一种方式——`new Thread().start()`**，其余都是"任务"的不同封装形态（Runnable/Callable 只是任务抽象）。

---

## 三、线程的生命周期与状态

`Thread.State` 六种状态：

```text
NEW ──start()──▶ RUNNABLE ──抢不到锁──▶ BLOCKED ──获得锁──▶ RUNNABLE
                     │  ▲
        wait()/join()│  │notify()/join结束/超时
                     ▼  │
                  WAITING
                     │  ▲
      sleep(n)/wait(n)│  │超时/notify
                     ▼  │
              TIMED_WAITING
                     │
                  run()结束
                     ▼
                 TERMINATED
```

| 状态 | 触发条件 | 典型场景 |
|------|----------|----------|
| NEW | 已创建未 start | `new Thread()` |
| RUNNABLE | 可运行（含等 CPU 时间片） | start 后、就绪队列 |
| BLOCKED | 等待获取 `synchronized` 锁 | 锁竞争 |
| WAITING | 无限等待 | `wait()` / `join()` / `LockSupport.park()` |
| TIMED_WAITING | 限时等待 | `sleep(n)` / `wait(n)` / `join(n)` |
| TERMINATED | run 执行完毕 | 结束后不可再 start |

- **BLOCKED vs WAITING**：BLOCKED 是等锁（被动、由锁释放唤醒）；WAITING 是主动等待，需 `notify`/`join` 完成/中断唤醒。
- `getState()` 可观察；`jstack` 可看真实线程栈状态（见 `05-jvm/README.md`）。

---

## 四、Thread 核心方法

| 方法 | 说明 |
|------|------|
| `start()` | 启动线程，JVM 新建调用栈并调用 run；**只能调用一次** |
| `run()` | 普通方法，直接调用=在当前线程执行（不会新起线程） |
| `sleep(ms)` | 静态方法，**当前线程**暂停，**不释放锁**，抛 `InterruptedException` |
| `join()` | 当前线程等待目标线程结束；**底层是目标线程 `wait(0)`** |
| `yield()` | 提示调度器让出 CPU，**不保证**生效，不释放锁 |
| `interrupt()` | 设置中断标志（协作式中断，见第五节） |
| `isInterrupted()` | 查询中断标志（不清除） |
| `Thread.interrupted()` | 静态，查询**并清除**当前线程中断标志 |
| `setDaemon(true)` | 设为守护线程（必须在 `start()` 前） |
| `setPriority(1-10)` | 优先级仅是提示，跨平台不可依赖 |
| `currentThread()` | 静态，获取当前线程引用 |

**`sleep` vs `wait`（高频）**：

| 对比 | `sleep` | `wait` |
|------|---------|--------|
| 所属 | `Thread` 静态方法 | `Object` 成员方法 |
| 锁 | 不释放 | **释放** |
| 调用前提 | 任意 | 必须在 `synchronized` 内 |
| 唤醒 | 超时自动 | `notify`/`notifyAll`/超时 |

**`start` vs `run`**：`start` 才是真正启动新线程；直接调 `run` 只是普通方法调用，仍是单线程顺序执行。

---

## 五、线程中断

Java 中断是**协作式**的：`interrupt()` 只设置标志位，不强制停止线程。

```java
Thread worker = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {   // ① 轮询标志
        // 业务逻辑
    }
});
worker.start();
worker.interrupt();                                      // ② 请求中断

// 阻塞中的正确姿势：捕获后恢复中断标志（或直接 return）
Thread blocked = new Thread(() -> {
    while (true) {
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();          // ③ 恢复标志，让上层感知
            return;
        }
    }
});
```

- 阻塞方法（`sleep`/`wait`/`join`）被中断时**抛 `InterruptedException` 并清除标志**。
- **无法被 interrupt 打断**的阻塞：`synchronized` 等锁（BLOCKED）、普通 IO；需要可中断等待用 `Lock.lockInterruptibly()`（见 `04-concurrency/README.md`）。
- 优雅停机推荐顺序：标志位轮询 > 中断 > （万不得已）`stop()` 已废弃，会破坏数据一致性。

---

## 六、线程协作

### 6.1 wait / notify / notifyAll

```java
class Buffer {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int cap = 10;

    public synchronized void put(int v) throws InterruptedException {
        while (queue.size() == cap) wait();        // 用 while 防虚假唤醒
        queue.offer(v);
        notifyAll();                                // 唤醒消费者
    }

    public synchronized int take() throws InterruptedException {
        while (queue.isEmpty()) wait();
        int v = queue.poll();
        notifyAll();
        return v;
    }
}
```

- 必须在 `synchronized` 块内调用（否则 `IllegalMonitorStateException`）；`wait` 释放锁进入 WAITING。
- **判断条件用 `while` 而非 `if`**（防虚假唤醒/被抢事件）。

### 6.2 JUC 协作工具（深入见 02/35）

| 工具 | 一句话 | 典型场景 |
|------|--------|----------|
| `CountDownLatch` | 倒计数门闩，等 N 个事件完成 | 主线程等子任务全部就绪 |
| `CyclicBarrier` | 循环栅栏，N 个线程互相等齐 | 分阶段并行计算，可复用 |
| `Semaphore` | 信号量，控制并发数 | 限流、资源池 |
| `Exchanger` | 两线程交换数据 | 遗传算法/流水线成对交换 |
| `Condition` | Lock 版 wait/notify，多条件队列 | 阻塞队列多条件唤醒 |

---

## 七、守护线程与线程优先级

- **守护线程（Daemon）**：为用户线程服务的后台线程（如 GC）；**所有用户线程结束时 JVM 直接退出**，不等守护线程，且守护线程被"戛然而止"（finally 不保证执行）。
- 用途：心跳、监控、自动保存等可被随时中断的任务。
- `setDaemon(true)` 必须在 `start()` 之前调用，否则抛 `IllegalThreadStateException`。

---

## 八、线程安全初探

```java
class Counter {
    private int count;                     // 共享变量在堆中，所有线程可见
    public void increment() { count++; }   // 非原子：读-改-写 三步
}
```

- 多线程下 `count++` 会丢失更新 → **竞态条件**；可见性问题由 **JMM** 引入（工作内存/主内存，指令重排）。
- 三大性质：**原子性、可见性、有序性**；对应工具：`synchronized`/`Lock`（原子+可见）、`volatile`（可见+有序）、原子类（原子）。
- 深入：JMM、happens-before、锁升级见 `02-java-middle/34-并发底层原理JMM与锁.md` 与 `04-concurrency/README.md`。

---

## 九、ThreadLocal 与线程封闭

```java
private static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();
CTX.set(user);          // 当前线程独享副本
CTX.get();
CTX.remove();           // 线程池场景必须清理
```

- 原理：每个 `Thread` 内部有 `ThreadLocalMap`，以 ThreadLocal 为弱引用 key。
- **线程池复用线程**：不 `remove()` 会导致脏数据串号与内存泄漏（Entry 的 value 是强引用）。
- 这是"线程封闭"思想的代表——避免共享而非同步共享。深入见 `04-concurrency/README.md`。

---

## 十、虚拟线程（JDK 21）

```java
// 直接创建
Thread v = Thread.ofVirtual().name("v-").start(() -> handle());

// Executor 风格（每个任务一个虚拟线程）
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> callRemoteApi());
}
```

- **虚拟线程**由 JVM 调度，挂载到少量平台线程（载体线程）上，阻塞时**自动卸载**，创建成本极低（可百万级）。
- 适用：**IO 密集**（大量阻塞调用）；CPU 密集无收益。
- 与平台线程对比：

| 对比 | 平台线程 | 虚拟线程 |
|------|----------|----------|
| 映射 | 1:1 内核线程 | M:N（JVM 调度到载体线程） |
| 成本 | ~MB 栈、千级数量 | ~几百字节起步、百万级 |
| 阻塞代价 | 占住内核线程 | 便宜（卸载让出载体） |
| 建议 | CPU 密集 | IO 密集、高并发请求处理 |

- 详见 `02-java-middle/10-虚拟线程.md`。

---

## 十一、常见面试考点

1. **创建线程有几种方式？** → 本质一种（`new Thread().start()`），Runnable/Callable/线程池只是任务封装。
2. **start 和 run 区别？** → start 新建调用栈真正并发；run 是普通调用。
3. **线程有哪几种状态？BLOCKED 与 WAITING 区别？** → 六态；BLOCKED 等锁，WAITING 主动等待需唤醒。
4. **sleep 和 wait 区别？** → 归属、是否释放锁、调用前提、唤醒方式。
5. **join 的原理？** → 底层 `wait(0)`，调用方等目标线程终止；可被 interrupt 打断。
6. **interrupt 机制？** → 协作式标志位；`isInterrupted` 不清除、`Thread.interrupted()` 清除；阻塞方法抛异常并清标志。
7. **守护线程特点？** → JVM 退出不等待；`setDaemon` 须在 start 前；finally 不保证执行。
8. **wait 为什么要放在 while 里？** → 防虚假唤醒与条件被其他线程改变。
9. **多线程一定更快吗？** → 不一定；上下文切换开销，CPU 密集 ≈ 核数，IO 密集才受益。
10. **虚拟线程解决了什么？** → IO 密集场景下"线程太贵"的问题，写同步代码获得高并发吞吐。
