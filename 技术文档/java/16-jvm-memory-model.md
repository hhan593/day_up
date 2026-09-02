# 16 - JVM 内存模型与 GC

> 来源：Oracle 官方《The Java™ Virtual Machine Specification》及 Java SE 标准运行模型
> 补充：JEP 333（ZGC）、JEP 439（分代 ZGC，Java 21）、JEP 318（Epsilon GC）标准知识
> 说明：JVM 规范为权威标准，下列结构基于规范与 HotSpot 实现整理；具体 JEP 特性已标注版本。

理解 JVM 内存布局与垃圾回收，是 Java 性能调优与排错的基础。

---

## 一、运行时数据区（JVM 内存划分）

```
┌─────────────────────────────────────────────┐
│ 线程私有                                        │
│  · 程序计数器 PC                                │
│  · 虚拟机栈（Stack）：每个方法一栈帧，存局部变量 │
│  · 本地方法栈（Native Method Stack）            │
├─────────────────────────────────────────────┤
│ 线程共享                                        │
│  · 堆（Heap）：对象实例，GC 主战场              │
│  · 方法区（Method Area / 元空间 Metaspace）     │
│     - 类信息、常量、静态变量、JIT 代码缓存       │
└─────────────────────────────────────────────┘
```

- **虚拟机栈**：`StackOverflowError`（递归过深）、`OutOfMemoryError`（栈扩容失败）。
- **堆**：最大的一块，所有 `new` 的对象在此；`-Xms` / `-Xmx` 调节大小。
- **元空间（Metaspace，Java 8+ 取代永久代 PermGen）**：存类元数据，默认受本机内存限制。

---

## 二、堆的分代（Generational Heap）

HotSpot 采用**分代收集**假设：绝大多数对象朝生夕死。

```
Young Gen（新生代）
├── Eden        // 新对象先到 Eden
├── S0 (Survivor)
└── S1 (Survivor)
Old Gen（老年代）  // 存活久的对象
```

- **Minor GC**：Eden 满时触发，存活对象复制到 Survivor，年龄+1。
- **Major / Full GC**：老年代满时，回收整个堆（耗时较长，应尽量避免频繁 Full GC）。
- **对象晋升**：Survivor 中年龄达阈值（`-XX:MaxTenuringThreshold`）的对象进入老年代。

---

## 三、垃圾回收算法

| 算法 | 思想 |
|---|---|
| 标记-清除 | 标记存活，清除未用（易碎片化） |
| 标记-整理 | 标记后压缩，消除碎片 |
| 复制 | 活对象复制到新空间（用于新生代） |
| 分代 | 新生代复制 + 老年代标记整理 |

---

## 四、常见 GC 收集器

| 收集器 | 特点 | 适用 |
|---|---|---|
| Serial | 单线程，简单 | 小型/客户端 |
| Parallel（Throughput） | 多线程，重吞吐 | 后台计算 |
| **G1（Java 9+ 默认）** | 分区、可预测停顿 | 多数服务端 |
| **ZGC（Java 15 实验，21 分代正式）** | 超低延迟（<10ms），TB 级堆 | 低延迟大内存 |
| Shenandoah | 并发压缩，低延迟 | 低延迟 |
| Epsilon | 不回收（诊断用） | 测试 |

- **G1**：将堆分为多个 Region，优先回收价值高的，目标停顿时间可控（`-XX:MaxGCPauseMillis`）。
- **ZGC（JEP 439 分代，Java 21）**：并发标记/重定位，停顿与堆大小无关，亚毫秒级。

```bash
java -XX:+UseZGC -Xmx16g MyApp      # 启用 ZGC
java -XX:+UseG1GC MyApp             # 启用 G1（默认）
```

---

## 五、对象创建与内存布局

- `new` 对象：类加载检查 → 分配内存（指针碰撞 / 空闲列表）→ 初始化零值 → 构造器。
- 对象头（Mark Word + 类型指针）+ 实例数据 + 对齐填充。
- `Mark Word` 存哈希、GC 年龄、锁状态（与 `synchronized` 锁升级相关，见 15）。

---

## 六、常见调优与诊断参数

```bash
-Xms512m -Xmx2g        # 堆初始/最大
-XX:MaxMetaspaceSize=256m
-Xlog:gc*              # Java 9+ 统一 GC 日志
-XX:+HeapDumpOnOutOfMemoryError   # OOM 时自动 dump
```

- 诊断工具：`jps`（进程）、`jstack`（线程栈）、`jmap`（堆 dump）、`jstat`（GC 统计）、`jcmd`、`jvisualvm`、`arthas`。

---

## 七、与并发的关系

- `synchronized` 锁状态存于对象头 Mark Word，有**锁升级**（无锁→偏向锁→轻量锁→重量锁）优化。
- 逃逸分析：方法内未逃逸的对象可在**栈上分配**，减少堆压力（JIT 优化）。

---

## 八、与系列其他文档的关系

- 并发锁机制见 `15-concurrency-advanced.md`；虚拟线程调度与载体线程见 `10-virtual-threads.md`。
- 对比 Go：Go 的 GC 也是并发三色标记、低延迟，但 Go 无分代（1.19 前）；Java ZGC 停顿更可控。
- Spring 应用 OOM/Full GC 频繁时，本篇是排错起点 → `13-spring-boot.md`
