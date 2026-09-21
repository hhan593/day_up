# 34 - 并发底层原理：JMM、volatile 与锁（synchronized / AQS / CAS）

> 来源：JSR-133 / Java Language Specification §17（Java Memory Model）；The Java HotSpot VM 实现（markOop / lock ratio）；`java.util.concurrent.locks.AbstractQueuedSynchronizer` 源码（OpenJDK 21）
> 官方：https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html 、https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/concurrent/locks/AbstractQueuedSynchronizer.java
> 补充：synchronized 锁升级与偏向锁移除（JEP 374, JDK 15）属 HotSpot 实现细节，非 JLS 规范内容，已按 OpenJDK 变更日志标注。

本篇回答「`volatile` 为什么不保证原子性」「`synchronized` 凭什么从重量级降到对象头两个 bit」「`ReentrantLock` 为什么快」。`15-并发进阶.md` 讲怎么用，本篇讲**为什么**。

---
## 一、并发问题的三个根源：原子性 / 可见性 / 有序性

### 1. 原子性：`count++` 丢更新

```java
private static int count = 0;   // 两线程各执行 1 万次 count++，结果 < 20000
count++;   // 字节码 getfield → iconst_1 → iadd → putfield，读-改-写四步之间可被插入
```

### 2. 可见性：JIT 把 `while (flag)` 的读取提升出循环

```java
private static boolean flag = false;      // 无 volatile
while (!flag) { }                          // 线程 A：循环体无内存访问，JIT 将读取 hoist 出循环 → 死循环
flag = true;                               // 线程 B 的写入 A 永远看不见
```

### 3. 有序性：DCL 不加 volatile 拿到半初始化对象

```java
instance = new Singleton();  // 分三步①分配内存②执行构造③引用赋值，重排成①③②后另一线程判非 null，却拿到②未完成的半成品
```

---
## 二、硬件层面成因：缓存一致性、store buffer、乱序执行

- **可见性 ← 缓存**：L1/L2 每核私有、仅 L3 共享，核心 1 改数据只更新自己的 cache line，核心 2 读到旧副本。**MESI 协议**（Modified/Exclusive/Shared/Invalid）维护缓存行一致，但写入先落 **store buffer**、异步处理他核失效通知后才可见 → 最终一致而非立即一致。
- **有序性 ← 乱序**：CPU 乱序流水线与 store buffer 延迟排空造成**运行期内存重排**；编译期 javac/JIT 另做常量折叠、**表达式提升**（见 1.2）、内联。**原子性 ← 指令粒度**：自增跨多条访存，唯有 `lock cmpxchg` 类指令保证单周期不可分。
- x86 强序（TSO，仅允许 StoreLoad 重排）、ARM 弱序，但 **Java 层看不到硬件差异——JMM 是 JVM 与硬件的契约**：程序按 JMM 写，JVM 按平台发对应屏障。

---
## 三、JMM（JSR-133）核心模型

- 模型：共享变量存于**主内存**，每线程有私有**工作内存**副本；交互抽象为 8 动作：`read`/`load`/`use`（主→工）、`assign`/`store`/`write`（工→主）、`lock`/`unlock`。**JMM 只约束重排与可见性，不保证执行顺序**：无线程间 happens-before 关系时，JMM 不承诺 A 先于 B，只承诺「单线程内看起来按程序序（as-if-serial）、跨线程重排受规则限制」。

> 注意：主内存/工作内存是 JSR-133 的**教学模型**，HotSpot 物理上不存在这两块区域，工作内存约对应寄存器与 CPU 缓存。

---
## 四、happens-before 八大规则（必考）

「A happens-before B ⇒ A 的结果对 B 必然可见、且看起来 A 先完成」——只有建立了下列关系之一，可见性才有保证：

| # | 规则 | 一行例 |
|---|---|---|
| 1 | **程序次序规则**：同线程内前码 hb 后码 | `a=1` 后的 `print(a)` 必见 1 |
| 2 | **监视器锁规则**：unlock hb 后一线程对同一把锁的 lock | `synchronized` 区改动，下一个持锁者必见 |
| 3 | **volatile 规则**：volatile 写 hb 后一次读 | `data=x; ready=true;`（ready 为 volatile）读侧见 true 必见 data |
| 4 | **传递性规则**：A hb B、B hb C ⇒ A hb C | 规则 2/3 连用即靠它 |
| 5 | **start() 规则**：`t.start()` hb 线程 t 内所有动作 | start 前的赋值子线程必见 |
| 6 | **join() 规则**：线程内所有动作 hb 其他线程**成功**从该线程 `join()` 返回 | `t.join(); print(x);` 必见 t 改的 x |
| 7 | **中断规则**：`interrupt()` 调用 hb 被中断线程 `catch InterruptedException` | |
| 8 | **终结器规则**：构造函数结束 hb 其他线程读该对象的 **final 字段** | 见下段 |

**规则 8 / final 语义**：构造函数结束后 final 字段**冻结**，任何线程无需额外同步即见正确值——这正是 `String` 不可变即线程安全的根基（呼应 `33-字符串与常用API.md`）。前提：构造期间 `this` 未逃逸。

**判断题式反例**：写线程 `a=1; flag=true;`，读线程 `if (flag) print(a);`。即使物理上写先完成，flag 非 volatile 且无锁时两条链无 HB 关系，**不保证正确**——只有 happens-before 才保证可见性，**时间先后 ≠ happens-before**。给 flag 加 volatile 后经规则 3+4 建立链。

---
## 五、内存屏障与 volatile 的实现

| 屏障 | 语义 |
|---|---|
| `LoadLoad` / `LoadStore` | 屏障前的读必须先于后续读 / 后续写 |
| `StoreStore` | 后续写不得重排到屏障前（volatile 写前的普通写先出去） |
| **`StoreLoad`** | 最昂贵：前置 store 排空到可见后才允许后续 load（x86 用 lock 前缀实现） |

volatile 写：前插 `StoreStore`、后插 `StoreLoad`；volatile 读：后插 `LoadLoad` + `LoadStore`。**x86（TSO）实际开销——仅限 x86 平台的结论**：硬件原生只乱 StoreLoad → volatile **读**的屏障全是空指令、**几乎零成本**；**写**编译成 `lock addl $0x0,(rsp)` 类指令 → **store buffer 排空 + cache 一致性同步**，代价明显。「读廉价、写昂贵」由此而来。

---
## 六、volatile 三条保证与两条不能

保证：**可见性**、**禁止重排**、派生的**一次性安全发布**；不能：**不保证原子性**（`i++` 是 read-modify-write）、**不保护复合条件**（check-then-act 是两步）。正确用法清单：**状态标志位**（`volatile boolean stopped`）、**DCL 单例**、**一次性安全发布**（对象完全初始化后才 volatile 写发布引用）、**单写多读的无锁状态机**。易错两条：volatile 数组只保证**引用**可见、不保证元素可见（用 `AtomicIntegerArray`）；`if (v == null) v = new Object();` 对 volatile v 仍不安全。

```java
public class Singleton {
    private static volatile Singleton instance;   // 去掉 volatile 即 1.3 的半初始化 bug
    public static Singleton get() {
        if (instance == null) {                    // 一检：已创建时无锁快速返回
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();  // 二检：防重复创建
            }
        }
        return instance;
    }
}
```

---
## 七、synchronized 三种用法与「锁到底加在谁身上」

| 写法 | 锁的对象 | 说明 |
|---|---|---|
| `synchronized void m()` | `this` | 不同实例互不阻塞 |
| `static synchronized void m()` | `X.class` 对象 | 全 JVM 一把锁 |
| `synchronized (obj) {…}` | `obj` **指向的对象** | 两线程锁同一对象才互斥 |

- `synchronized (null)` 抛 **NPE**（`monitorenter` 对空引用求值即抛）；锁**可重入**：监视器记录**持有线程 ID + 计数器**，重入 +1、退出 -1 归零才释放，故同线程 `this` 内嵌套调用 synchronized 方法不死锁。

```java
synchronized (this) { … }           // ✓ 同一实例互斥
synchronized (integerField) { … }   // ✗ Integer 装箱：字段一改锁对象就换；小整数命中缓存，无关对象被误并成同一把锁
synchronized ("LOCK") { … }         // ✗ 字面量入常量池，全 JVM 引用该字面量的代码意外共享一把全局锁
```

---
## 八、对象头与 Mark Word 布局（64 位 JVM，压缩类指针）

```
[Mark Word 8B][klass pointer 4B][实例数据…][补齐到 8B 倍数]   →  new Object() = 12B + 4B = 16B
状态（JDK 15 前经典形态，18+ 已无偏向态）      高位内容                                  低位标记
无锁       25b 匿名 hash + 4b 分代年龄 + 余未用                                          01
偏向       54b 线程 ID + 2b epoch + 4b 年龄 + 1b                                        101
轻量级     61b 指线程栈 Lock Record 的指针                                               00
重量级     61b ObjectMonitor 指针                                                        10
```

> 注意：`hashCode()` 算出后写回 Mark Word 即挤占线程 ID 空间、**偏向锁无法成立**（JDK 15+ 无偏向，此坑已成历史）；4bit 分代年龄上限 15，到阈值晋升老年代。

---
## 九、锁的演化：面向 JDK 21 的准确现状

**偏向锁时间线（最易答错）**：JDK 6 引入，解决「**同一线程**反复进出」：CAS 把线程 ID 写进 Mark Word，重入只需一次比对。但**撤销要等到 safepoint、代价远超收益**，现代共享代码少有受益 → **JEP 374：JDK 15 起默认禁用并标记废弃，JDK 18 起实现移除**。因此今天的准确链条是三级：`无锁 → 轻量级（自适应自旋的栈锁）→ 重量级（ObjectMonitor）`；答题可复述四级历史，结论必须落在 JDK 21 现状。

- **轻量级**：进入时在当前线程栈建 **Lock Record**，CAS 把 Mark Word 搬入（displaced header）并以 `00`+指针覆盖对象头；竞争者**自适应自旋**（JIT 按近期加锁历史动态调整自旋时长），成功即持锁。
- **重量级**：自旋失败/竞争持续则**膨胀**：建 `ObjectMonitor`（Mark Word 变 `10`+指针），`Owner` 持锁、`_cxq` 与 `_EntryList` 排队候锁、`wait()` 后进 `_WaitSet`，挂起依赖 OS 原语（futex）→ **用户态/内核态切换**是「重量级慢」的根源。**何时膨胀**的现实答案：CAS 失败且自旋超时、或等待者已多个——轻量级只赢得「低竞争」窗口。
- JIT 附带：**锁消除**（逃逸分析证明锁对象不逃出当前线程则直接删 monitorenter/exit，如方法内局部 `StringBuffer`）、**锁粗化**（连续多次加解锁合并为一次，避免频繁膨胀）。

---
## 十、CAS 与原子类

- 硬件为 `lock cmpxchg`；Java 入口 **JDK 9 起推荐 `VarHandle`**（`Unsafe` 仍存在但持续内部化、访问受限是长期方向，新代码保守使用）。`incrementAndGet` 即 **CAS 自旋循环**：读旧值 → 算新值 → `compareAndSet(old,new)` 失败重试。

| 三大问题 | 表现 | 解法 |
|---|---|---|
| **ABA** | 值 A→B→A，CAS 无从感知中间被改过 | `AtomicStampedReference`（值+版本号双比对，见下） |
| 自旋开销 | 高竞争全员 CAS 失败空转、烧 CPU | `LongAdder` 分散 / 退回加锁 |
| 单变量局限 | 多字段复合操作仍不原子 | `AtomicReference` 打包**不可变对象**整体替换，或加锁 |

```java
AtomicStampedReference<String> ref = new AtomicStampedReference<>("A", 0);
int[] ver = new int[1]; String oldVal = ref.get(ver);               // get 同时带回当前版本
ref.compareAndSet(oldVal, "B", ver[0], ver[0] + 1);   // 值与版本同时匹配才写，ABA 可辨
```

- **`LongAdder`（JDK 8）**：`AtomicLong` 单点 CAS 高竞争下疯狂失败；`LongAdder` 把写打散进 `Cell[]`（线程散列到各自 Cell、Cell 内 CAS、冲突则扩容），**写显著更快**；代价是 `sum()` 顺序累加 base + 所有 Cell，结果是**近似值**，不适合强一致瞬时读。`AtomicIntegerFieldUpdater`：对对象内特定 volatile int 字段的免额外对象无锁更新，框架热路径用。

---
## 十一、AQS：一个类撑起 JUC 的半壁江山

`AbstractQueuedSynchronizer` = **`volatile int state`（资源）+ CLH 变体双向等待队列 + 模板方法**。子类只实现 `tryAcquire/tryRelease`（独占）或 `tryAcquireShared/tryReleaseShared`（共享），入队、自旋、park、唤醒、取消全由 AQS 继承下来。

### 1. 独占模式获取流程

CAS 改 state 成功即持锁 → 失败则把线程封装为 `Node(EXCLUSIVE)` **CAS 入队尾** → 队内循环：**前驱是 head** 且 tryAcquire 成功则升为新 head；否则在 `waitStatus=SIGNAL` 的前驱后面 `LockSupport.park()` → 释放时 state 减到 0，`unparkSuccessor` 唤醒 head 之后第一个未取消后继。

```
head(哨兵) ⇄ Node(t2, ws=-1, park 中) ⇄ Node(t3, ws=0, park 中) ⇄ tail
ws: 0 / SIGNAL(-1 释放后唤醒我) / CANCELLED(+1) / CONDITION(-2) / PROPAGATE(-3 共享传播)
```

### 2. 可重入、公平与锁家族

- **可重入**：state 是**计数器**不是开关（重入 +1、unlock -1 至 0 才释放），配合 `exclusiveOwnerThread` 记录持有者，重入只对持有线程有效。
- **公平 vs 非公平**：公平版 tryAcquire 先查 **`hasQueuedPredecessors()`**，队首有人就不插队 → FIFO 但每次交接都要唤醒+重调度，**吞吐低**；非公平版（`ReentrantLock` 默认）线程一进来先 CAS 抢一把 → **吞吐高**、有饿死风险。
- `ReentrantReadWriteLock`：**单个 int state 拆两半——高 16 位读锁计数、低 16 位写锁计数**（`s >>> 16`、`s & 0xFFFF`），写独占、读共享。写锁**可降级**为读锁（持写→取读→放写）；读锁**不可升级**为写锁（各持读等写 → 互等死锁）。
- `StampedLock`（JDK 8）：**乐观读** `tryOptimisticRead()` 取 stamp → 读完 `validate(stamp)` 检验期间无写 → 失败转悲观重读；读临界区无锁无屏障、**读最快**，但**不可重入、不支持 Condition**，高频写会让乐观读持续失败。
- 与虚拟线程（JDK 21，很新很爱考）：AQS 阻塞走 `LockSupport.park()`，其 park/unpark 已适配虚拟线程——挂起时从载体**卸载** → `ReentrantLock` 不钉住载体；`synchronized` 内阻塞则**钉住（pinning）**载体（JEP 444 已知限制）→ 虚拟线程上的长临界区应换 JUC 锁，见 `10-虚拟线程.md`。

### 3. 同步工具类对照

| 工具 | state 含义 | 共享/独占 | 可复用 | 基于 AQS？ |
|---|---|---|---|---|
| `Semaphore` | 许可数 | 共享 | 是 | 是 |
| `CountDownLatch` | 初始计数，countDown 减 1 | 共享 | **否** | 是 |
| `CyclicBarrier` | ——（内部计数） | —— | 是 | **否**：`ReentrantLock` + `Condition` |

---
## 十二、锁的选型与优化

| 场景 | 选择 | 理由 |
|---|---|---|
| 常规互斥 | **默认 `synchronized`** | 忘释放也不泄漏锁；独享 JVM 内建的消除/粗化/升降优化 |
| 超时 / 可中断 / 公平 / 多条件队列 | `ReentrantLock` | `tryLock`、`lockInterruptibly`、多个 `newCondition()` |
| 读多写少 | RRWL / `StampedLock` | 读并行、乐观读零屏障 |
| 高并发计数 | `LongAdder` | Cell 分散写竞争 |
| 虚拟线程 + 会阻塞的临界区 | `ReentrantLock` | 避免 pinning |

优化阶梯：**缩小临界区**（移出 RPC 与日志）→ **锁分段**（`ConcurrentHashMap` 桶级锁思路，见 `36-集合底层源码剖析.md`）→ **无锁结构**（CAS/原子类）→ **消灭共享**（`ThreadLocal` 每线程一份，见 `35-线程池与线程协作.md`）。

`Condition` 有界缓冲：判断条件必须写在 **`while` 里而不是 `if`**——虚假唤醒、多消费者只有一个抢到数据时，其余靠循环复检兜底：

```java
lock.lock();
try { while (queue.size() == CAPACITY) notFull.await();   // ✓ 唤醒后循环复检；if 则虚假唤醒直接越界
      queue.put(x); notEmpty.signal(); } finally { lock.unlock(); }
```

---
## 十三、易错与面试答题模板

> - `volatile` 三性：**可见性、有序性（禁重排）有，原子性没有**；`i++` 用 `AtomicInteger` 或加锁。
> - `synchronized` vs `ReentrantLock` 五维：实现层级（JVM 内建 / Java API）、释放（自动 / `finally` 手动）、中断-超时-公平（无 / 有）、条件队列（单 wait set / 多 Condition）、虚拟线程（pinning / 不 pinning）。
> - AQS 一句话：**volatile `state` + CLH 变体双向队列 + 模板方法**，子类只实现 tryXxx。
> - CAS 三问题：**ABA**（`AtomicStampedReference`）、自旋烧 CPU（`LongAdder`）、只管单变量（打包不可变对象 / 加锁）。
> - 锁升级：讲 JDK 6 历史四级，**结论必须是 JEP 374 后 JDK 21 只剩「无锁→轻量级→重量级」三级**。
> - RRWL 的 state：**高 16 读、低 16 写**；写可降级、读不可升级；`CyclicBarrier` 不是 AQS 实现。
> - `wait`/`await` 必须配 `while`：虚假唤醒 + 唤醒转移后条件可能已不成立。
> - 答题显式带版本：偏向锁、JEP 编号、`VarHandle` 建议都是版本敏感点，报出版本即证明答案时效。

---
## 十四、与系列其他文档的关系

> **概念澄清（全知识库混淆风险最高的一处）**：本篇的 JMM 指 **Java Memory Model（JSR-133 并发语义规范）**；`16-JVM内存模型与GC.md` 标题里的「内存模型」指 **JVM 运行时内存区域**（堆 / 虚拟机栈 / 方法区）。同名不同物，面试先报澄清再展开。

- `15-并发进阶.md`：API 用法层（怎么用）；本篇：底层原理层（为什么）。
- `10-虚拟线程.md`：synchronized pinning 与 AQS/LockSupport 适配的用法后果。
- `35-线程池与线程协作.md`：wait/notify 与同步工具类的用法层、`ThreadLocal` 避免共享。
- `36-集合底层源码剖析.md`：`ConcurrentHashMap` 的 CAS + `synchronized` 分桶锁、`size()` 的 CounterCell 与 `LongAdder` 同源。
- `37-JVM调优与故障排查.md`：jstack 看 BLOCKED 线程定位锁竞争。
- `33-字符串与常用API.md`：final 语义与不可变对象的线程安全发布；字符串常量池是 `synchronized("字面量")` 误锁全局的根源。
- `31-反射与注解.md`：动态代理下 synchronized 方法——锁加在被代理目标实例上，代理对象之间互不加锁。
