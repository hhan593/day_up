# JVM 与性能调优知识总纲

> 定位：Java 程序运行基石，排查 OOM、GC 停顿、内存泄漏的必备知识，面试高频。
> 衔接：`java-middle/16-JVM内存模型与GC.md`、`concurrency/README.md`（内存模型差异）、`linux/README.md`（排查命令）。

---

## 目录

- [一、JVM 内存结构](#一jvm-内存结构)
- [二、类加载机制](#二类加载机制)
- [三、垃圾回收基础](#三垃圾回收基础)
- [四、GC 算法与收集器](#四gc-算法与收集器)
- [五、对象存活判定](#五对象存活判定)
- [六、常见 OOM 与排查](#六常见-oom-与排查)
- [七、常用调优参数](#七常用调优参数)
- [八、排查工具](#八排查工具)
- [九、常见面试考点](#九常见面试考点)

---

## 一、JVM 内存结构

- **堆（Heap）**：对象实例，GC 主战场，分新生代（Eden/S0/S1）+ 老年代。
- **方法区（元空间 Metaspace）**：类元信息、常量、静态变量（JDK 8 用本地内存）。
- **虚拟机栈**：每个方法栈帧（局部变量、操作数栈、动态链接、返回地址）；`StackOverflowError` 深递归。
- **本地方法栈**：Native 方法。
- **程序计数器**：当前线程字节码行号；唯一不会 OOM 的区域。

---

## 二、类加载机制

- 加载 → 链接（验证/准备/解析）→ 初始化。
- **双亲委派**：子加载器先委托父加载器，父找不到才自己加载（防止核心类被篡改）。
  - 破坏场景：SPI（JDBC）、Tomcat、OSGi 需要反向委派。
- 类加载器：`Bootstrap` → `Extension` → `Application`（AppClassLoader）。
- 触发初始化：new/getstatic/反射/主类等。

---

## 三、垃圾回收基础

- GC 主要回收**堆**中无引用对象。
- 分代收集理论：弱分代假说（多数对象朝生夕死）→ 新生代用复制；强分代假说 → 老年代用标记整理。

---

## 四、GC 算法与收集器

| 算法 | 思路 | 缺点 |
|------|------|------|
| 标记-清除 | 标记后清除 | 碎片 |
| 标记-整理 | 标记后压缩 | 移动对象开销 |
| 复制 | 存活对象复制到新空间 | 浪费一半空间（新生代用） |

收集器（JDK 各版本演进）：
- **Serial / Parallel**：单/多线程，吞吐优先。
- **CMS**（已废弃）：并发标记清除，低停顿但碎片、CPU 敏感。
- **G1**（JDK 9+ 默认）：分 Region，可预测停顿，兼顾吞吐与延迟。
- **ZGC / Shenandoah**：亚毫秒级停顿，大堆友好（JDK 21 生产可用 ZGC）。

---

## 五、对象存活判定

- **引用计数**：简单但有循环引用问题，JVM 不用。
- **可达性分析**：从 GC Roots（栈帧变量、静态变量、JNI 等）出发，不可达即回收。
- 引用类型：`强`（不回收）/ `软`（OOM 前回收）/ `弱`（下次 GC 回收）/ `虚`（追踪回收）。
- `finalize()`：对象死亡前的最后一次自救机会（不推荐依赖）。

---

## 六、常见 OOM 与排查

| 错误 | 原因 | 处理 |
|------|------|------|
| `Java heap space` | 堆对象过多/泄漏 | 堆 dump 分析（`jmap`/`MAT`） |
| `Metaspace` | 类加载过多（动态代理/groovy） | 限制 `-XX:MaxMetaspaceSize` |
| `GC overhead limit exceeded` | 98% 时间 GC 却回收 <2% | 同堆问题 |
| `Unable to create new native thread` | 线程数超限 | 调系统 `ulimit`/降线程 |
| `Direct buffer memory` | NIO 堆外内存 | `-XX:MaxDirectMemorySize` |

---

## 七、常用调优参数

```bash
# 堆
-Xms2g -Xmx2g                  # 初始=最大，避免动态扩容抖动
# 元空间
-XX:MaxMetaspaceSize=256m
# GC 选择（JDK 17+ 推荐 G1/ZGC）
-XX:+UseG1GC
-XX:+UseZGC
# 日志
-Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=100M
# 堆溢出自动 dump
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/dump.hprof
```

- 经验：堆大小设为容器内存的 60~70%（留出元空间/线程/堆外）。

---

## 八、排查工具

- 命令行：`jps`（进程）、`jstat -gcutil`（GC 统计）、`jmap -histo`（对象）、`jstack`（线程栈/死锁）、`jinfo`。
- 图形：`jvisualvm`、`MAT`（堆分析）、`JProfiler`、`Arthas`（`dashboard`/`thread`/`watch` 在线诊断）。
- 容器场景：`kubectl exec` + 上述命令，或 Sidecar 采集（见 `kubernetes/README.md`）。

---

## 九、常见面试考点

1. **JVM 内存分哪几块？** → 堆/元空间/栈/本地栈/PC。
2. **双亲委派及如何打破？** → 委托父加载；SPI/Tomcat 反向委派。
3. **GC Roots 有哪些？** → 栈变量、静态变量、常量、JNI 引用。
4. **G1 特点？** → Region 化、可预测停顿、无碎片整理。
5. **ZGC 为什么停顿低？** → 染色指针 + 读屏障，并发 relocate。
6. **强/软/弱/虚引用？** → 回收时机递进。
7. **CPU 100% 怎么排查？** → `top` → `top -Hp pid` → `printf %x` → `jstack` 找线程 → 定位代码。
8. **OOM 怎么排查？** → 开 HeapDumpOnOutOfMemoryError，`MAT` 看支配树/大对象。
