# 37 - JVM 调优与故障排查（引用 / 类加载 / 诊断工具 / 实战案例）

> 来源：《The Java Virtual Machine Specification》Java SE 21 版（§2.5 运行时数据区、§5 类加载与链接、§7.4）；OpenJDK HotSpot 官方文档与 `java`/`jcmd`/`jstat` 命令手册；JEP 421（`finalize` 废弃待移除，JDK 18）、JEP 439（分代 ZGC，JDK 21）
> 官方：https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html 、https://openjdk.org/groups/hotspot/docs/HotSpotGlossary.html
> 补充：第九/十一节的 MAT、JProfiler、Arthas、async-profiler 用法与八个案例属业界标准实践与工具官方文档整理，**非 JVM 规范内容**，各节单独标注；具体 `-XX` 参数在不同 JDK 版本存在增删，标注「需按版本核对」者以 `java -XX:+PrintFlagsFinal -version | grep <Name>` 实测为准。

16 篇回答「内存长什么样、有哪些收集器」，本篇回答另外三问：**对象死活怎么判、类怎么被加载、线上出事怎么查**。所有诊断命令与案例都可直接复制执行。

---
## 一、先分清两个「JMM」

> 澄清（全知识库现存命名混淆点）：**Java Memory Model（JMM）** 指 JSR-133 并发内存模型（`volatile`/happens-before/重排），见 `34-并发底层原理JMM与锁.md`；而 `16-JVM内存模型与GC.md` 标题里的「内存模型」其实是 **JVM 运行时内存结构（runtime memory areas）**。两者除共享缩写外**无任何关系**：前者是「多线程读写可见性规范」，后者是「字节码怎么装字节、GC 怎么回收」。面试被问「JMM 是什么」时，先反问对方指哪一个，是加分项。

---
## 二、运行时内存区域速览（排查地基）

16 篇已给划分图，这里只保留「出错时报哪个区」这一维度：程序计数器是唯一**不 OOM** 的区；线程栈是 `StackOverflowError` 的唯一来源；方法区的 HotSpot 实现即**元空间 Metaspace**，JDK 8 起取代永久代 PermGen，且**住在本地内存（native）而非堆里**——所以 `-Xmx` 管不到它。

| 区域 | 线程私有? | 由什么限制 | 典型异常 |
|---|---|---|---|
| 堆 Heap | 共享 | `-Xms`/`-Xmx` | `OutOfMemoryError: Java heap space`、`GC overhead limit exceeded` |
| 元空间 Metaspace | 共享 | `-XX:MaxMetaspaceSize`（默认≈本机内存） | `OOM: Metaspace`、压缩指针耗尽 |
| 虚拟机栈 | **私有** | `-Xss`（默认 512K~1M/线程） | `StackOverflowError`、`OOM: unable to create native thread` |
| 本地方法栈 | **私有** | 同上 + native 库 | `OOM`、JVM crash（`hs_err_pid*.log`） |
| 程序计数器 | **私有** | 固定小值 | 规范规定无 OOM |
| 直接内存（非规范区） | 共享 | `-XX:MaxDirectMemorySize`（默认≈`-Xmx`）+ OS 内存 | `OOM: Direct buffer memory`；不配则表现为 **RSS 涨但堆很空** |

> 注意：直接内存不是运行时数据区的一员，是 `ByteBuffer.allocateDirect` 走的 `Unsafe` 分配，不受 `-Xmx` 约束、由 `Cleaner`（虚引用）在对象被回收时释放 —— Netty/Kafka client 是消耗大户，详见 `32-IO与NIO.md`。

---
## 三、对象怎么访问、内存怎么分配

- **句柄 vs 直接指针**：句柄方式（对象存句柄池，引用指向句柄）GC 移动对象时只改句柄、引用不变；直接指针（**HotSpot 采用**）少一次间接寻址、访问更快，代价是移动对象要修引用（ZGC 用染色指针缓解）。
- **TLAB（Thread Local Allocation Buffer）**：每个线程在 Eden 里预占一小段私有缓冲区分配，避免并发 `new` 争抢同一指针做 CAS；`-XX:+UseTLAB` 默认开。TLAB 用完才在共享 Eden 上 CAS。
- **长对象/大数组直入老年代**：`-XX:PretenureSizeThreshold`（需按版本核对）传统上仅对 Serial/ParNew 生效，**G1 不认它**，G1 用 Humongous（超过 Region 一半即直入 Humongous Region）。
- **逃逸分析 + 标量替换**：JIT 判定对象不逃逸出方法/线程时，把字段拆成标量放栈帧甚至寄存器 —— **压根不在堆上分配**，因此「栈上分配」是效果说法而非真有栈上对象。`-XX:+DoEscapeAnalysis`、`-XX:+EliminateLocks`（锁消除）同源，见 `34-并发底层原理JMM与锁.md`。热点不达标（未 C2 编译）时优化不会发生，别拿它当确定性保证。

---
## 四、对象死活怎么判：可达性分析与 GC Roots

**引用计数法**（每个对象一个计数器）在 Java 里被否掉：`a.ref = b; b.ref = a;` 断开后计数仍为 1，**循环引用永不回收**，且每次赋值都要改计数（写放大、非原子）。HotSpot 用 **可达性分析（tracing）**：从一组必须存活的根出发遍历，遍历不到即死。

### 1. GC Roots 有哪些（重点，16 篇未展开）

| Root 类别 | 具体是什么 |
|---|---|
| **虚拟机栈中 tableslot 引用的对象** | 各活线程栈帧里的局部参数、局部变量、临时对象（`jstack` 里 `at ...` 那一堆帧的 args） |
| **`Thread` 对象本身** | 活线程的 `java.lang.Thread` 实例是 Root，连带它栈上引用全存活 |
| **本地方法栈 / JNI 引用** | native 代码持有的局部/全局引用（GlobalRef 尤其易漏） |
| **类的静态属性** | 每个已初始化类的 `static` 引用字段 —— 静态集合泄漏的根源 |
| **类对象本身（`Class`）** | 已加载且被引用的 `java.lang.Class` 实例，连带其类加载器 |
| **被 `synchronized` 持有的监视器对象** | 正在被 `monitorenter` 且未退出的对象 |
| **JVM 内部常量与结构** | 基本类型包装缓存、intern 字符串、常用 `ClassLoader`、永久异常对象（NPE/OOM 单例） |

### 2. Root 怎么被找出来：OopMap + Safepoint

JIT 为每个栈上/寄存器上的引用位置生成 **OopMap**，GC 时按它精确枚举 Root。枚举必须停在**安全点（Safepoint）**（方法返回、回边、异常抛出等），线程靠轮询标志位进入；**安全点过少会让长循环迟迟不响应，GC 只能干等 → STW 被拉长**。同理，`jstack`/`jmap`/Arthas 快照同样要等安全点，所以**有线程在安全点极稀的长循环里迟迟不响应时，`jstack` 会卡住不出输出** —— 这不是工具坏了，而是那个线程的问题。`-Xlog:safepoint`（需按版本核对）可直接观测同步耗时。

---
## 五、四种引用（必考，强度递减）

```java
Strong   Object o = new Object();                     // 可达即不回收；置 null 才可能回收
Soft     SoftReference<byte[]> s = new SoftReference<>(new byte[8<<20]);
         byte[] back = s.get();                        // 内存不足（抛 OOM 前）才回收 → 适合缓存
Weak     WeakReference<Class<?>> w = new WeakReference<>(String.class);
         // 只被弱引用指向 → 下次 GC 即回收
Phantom  PhantomReference<Object> p = new PhantomReference<>(obj, queue);
         p.get();                                      // 永远返回 null，只能靠 queue 得知「已被回收」
```

| 引用 | 回收时机 | `get()` | 典型用途 |
|---|---|---|---|
| 强 | 只要可达就不回收 | 正常 | 普通字段 |
| 软 `SoftReference` | **内存不够时**先回收软引用 | 可能 null | 图片/本地缓存（现多换 Caffeine 的容量策略） |
| 弱 `WeakReference` | **下一次 GC** 即回收 | 可能 null | `WeakHashMap` key、`ThreadLocalMap` 的 key、`ClassValue` |
| 虚 `PhantomReference` | 任意时刻，且回收前不清空 | **恒为 null** | 跟踪「对象已被回收」这一事件，配合 `ReferenceQueue` 释放堆外资源（`DirectByteBuffer` 的 `Cleaner` 即此机制） |

- **`ReferenceQueue`**：引用被清除时，该 `Reference` 对象被挂到关联队列，程序轮询它做善后；不入队则只能靠 GC 自动清理。
- **`ThreadLocal` 泄漏闭环**：`ThreadLocalMap.Entry` 继承弱引用且 **key 是弱引用、value 是强引用** —— 外部 `ThreadLocal` 变量一消失，key 被回收成 null，value 仍被线程（Root）引用链挂着 → 线程池里线程不死则永久泄漏。**必须 `remove()`**，见 `35-线程池与线程协作.md`。
- **`finalize` 已废弃**：JDK 9 起 `@Deprecated`，JEP 421（JDK 18）正式 deprecated-for-removal 且中心路径退化，后续版本持续去功能化（JDK 版本细节需按版本核对）。**新代码禁止使用**，改 `try-with-resources`（`AutoCloseable`）或 `java.lang.ref.Cleaner`。

---
## 六、内存泄漏的典型 Java 场景（工程视角）

| 场景 | 一段典型代码 | dump 里怎么认出它 |
|---|---|---|
| 长生命周期集合无上限 | `static Map<String,Row> CACHE = new HashMap<>();` | Dominator Tree 顶上一个 `HashMap$Node[]`，retained 占大头 |
| `ThreadLocal` 未 remove | `TL.set(bigList)` 后线程归还池 | GC Roots 链路：`Thread` → `threadLocals` → `Entry[]` → value |
| 连接/流未关 | 手写 `new FileInputStream` 无 try-with | 大量 `FileDescriptor`/`Socket` 与 direct buffer 记录并存 |
| 监听器/回调未注销 | `eventBus.register(this)` 无 `unregister` | 同一 listener List 里堆积已「逻辑销毁」的视图对象 |
| 非静态内部类持有外部 | `class Inner { }` 被静态集合存走 | `Inner$1.this$0` 字段指向整个外部对象图 |
| `String.intern` 滥用 | 循环 `intern()` 拼出来的长字符串 | `String` 实例数异常多、常量区（JDK 7+ 在堆）占比高 |
| `ClassLoader` 泄漏 | Web 容器热部署后旧 loader 未释放 | `Class` 实例数量只增不减，`-Xlog:class+load` 可对照 |

---
## 七、类加载机制（本篇补齐的专章）

### 1. 什么时候才初始化（笔试真题集中区）
「主动使用」才触发初始化（表述取 JLS §12.4.1 语义，保守归纳）：`new` 读/写静态字段、调静态方法、反射 `Class.forName`、初始化其子类、JVM 指定的启动主类。三个反直觉结论：
- **子类方法访问父类静态字段 → 只初始化父类**，子类不被初始化。
- `new Foo[10]` **不初始化** `Foo`，只初始化数组的组件类型描述符（数组类由 JVM 生成）。
- `static final int N = 100;` 编译期常量**已折叠进调用方常量池**，读它不触发初始化；`static final String S = new String("x")` 非编译期常量，读它会。

### 2. 类加载过程七步（规范列 5 大块，其中「链接」拆 3）

| 阶段 | 干什么 | 关键细节 |
|---|---|---|
| 加载 Loading | 字节流 → 方法区结构 + 堆内 `Class` 对象 | 数组类由 JVM 直接构造，不走 loader |
| 验证 Verification | 格式/元数据/字节码/符号引用四道校验 | `ClassFormatError`、`VerifyError` |
| 准备 Preparation | 静态字段分配内存并置**类型零值** | `static int a=1` 此步 `a==0`；`static final` 编译期常量**此步即终值** |
| 解析 Resolution | 符号引用 → 直接引用 | **顺序并非严格**，为支持动态绑定可推迟到初始化之后 |
| 初始化 Initialization | 执行 `<clinit>`（类构造器） | 静态赋值 + static 块按源码序 |

`<clinit>`（类构造器，JVM 加锁保证**一个类只初始化一次**，两个类互相触发可造成初始化死锁）vs `<init>`（实例构造器，每个对象各跑一次，含父类 `<init>` 链）。

### 3. 类加载器四层

```
Bootstrap（C/C++ 实现，加载 java.base 等核心模块；Java 层看到 String.class.getClassLoader() == null）
   ↑ 委派
Platform（JDK 9 起取代 Extension；java.sql、部分 CORBA 遗留）
   ↑ 委派
Application / System（-classpath / 模块路径，main 类在此）
   ↑ 委派（可自定义）
自定义 ClassLoader（热部署、插件隔离、加密类解密）
```
`-Xbootclasspath`（含 `/a`）在 JDK 9 模块化后已移除（需按版本核对），改 `--patch-module`。

### 4. 双亲委派（必考）
**过程**：收到加载请求先委派父 loader，父返回 `ClassNotFoundException` 才自己加载。**好处**：① 核心类不可被篡改（你写个 `java.lang.String` 也永远轮不到自己加载）；② 类的唯一性与命名空间分层，同一 `Class` 只被加载一次。**四个真实破坏场景**：

| 场景 | 为什么破坏 | 手段 |
|---|---|---|
| SPI（`JDBC`/`Logging`/`META-INF/services`） | 接口由 Bootstrap 加载，实现在 classpath，父无法加载子 | `ServiceLoader` 用 `Thread.currentThread().getContextClassLoader()` 反向委派 |
| JNDI / 名字服务 | 核心类要引用用户提供的类，同上 | 线程上下文类加载器 |
| OSGi / **Tomcat Webapp 隔离** | 需要「每个应用一份自己的类」，共享优先不满足 | `WebappClassLoader` 先查自己（Local First），多 parent 网状模型 |
| JDK 9 模块系统 | `Module`/`Layer` 引入按模块定向加载，不再是单链委派 | `ClassLoader` 的模块定向方法（`loadClass(Module, name)` 等，需按版本核对） |

### 5. `Class.forName` vs `loadClass`（常考，写准）
`Class.forName("X")` 等价 `forName(name, true, loader)` → **默认执行初始化**（JDBC 老写法 `forName("com.mysql...")` 靠它跑静态块自注册）；`ClassLoader.loadClass("X")` **只加载到链接前段，不初始化**。三参重载 `Class.forName("X", false, loader)` 可关掉初始化。

### 6. 类身份 = 类加载器 + 类名
不同 loader 加载同一份字节码是**两个不同的类**：`instanceof` 为 false、互相强转抛 `ClassCastException: A cannot be cast to A`（同名不同类型的信号）。诊断：Arthas `sc -d <类>` 看 `classLoaderHash` 与 `CodeSource`（或 `jcmd <pid> VM.classloaders`，该子命令需按版本核对）。热部署、插件框架的转型异常九成是这个。

### 7. 自定义 loader 模板（覆写 `findClass`，不要覆写 `loadClass`）
```java
public class DiskLoader extends ClassLoader {
  private final Path base;
  DiskLoader(Path base, ClassLoader parent) { super(parent); this.base = base; }
  @Override protected Class<?> findClass(String name) throws ClassNotFoundException {
    try {
      byte[] bytes = Files.readAllBytes(base.resolve(name.replace('.', '/') + ".class"));
      return defineClass(name, bytes, 0, bytes.length);   // 先 findClass 再 defineClass
    } catch (IOException e) { throw new ClassNotFoundException(name, e); }
  }
}
// 小实验：new DiskLoader(p1, null).loadClass("Foo") != new DiskLoader(p2, null).loadClass("Foo")
// → f1 instanceof f2 为 false，f2.cast(f1) 抛 ClassCastException
```
观测：JDK 9+ `-Xlog:class+load=info`（`-XX:+TraceClassLoading` 为 JDK 8 老写法，需按版本核对）。

---
## 八、GC 与调优目标：怎么定、怎么调

- **三角权衡**：吞吐（GC 时间占比）、停顿（单次 STW 与 P99/P999）、footprint（堆占用）。三者不可兼得，**先写 SLO 再选收集器**（收集器差异见 16 篇）。
- **G1 心智模型**：堆切成等大 Region（1~32MB），E/S/O/Humongous 只是角色标签；`RSet` 记「谁指向我」以免全堆扫描（**用内存换时间**，RSet 自身要占若干百分点的堆内存）；Young GC → 老年代占比达 `-XX:InitiatingHeapOccupancyPercent`（默认 45）起**并发标记**（初始标记 STW → 并发标记三色 + **SATB** 保快照活性 → 最终标记/清理，其中「重新标记」靠 SATB 增量化做成并发）→ 后续 Young GC **顺带 Mixed GC** 回收性价比最高的老年代 Region。`-XX:MaxGCPauseMillis` 是**唯一该设的目标值**：G1 据它自适应挪 Young 大小，手设 `-Xmn` 反而会废掉停顿预测模型。
- **为什么 Full GC 要重点治理**：G1 的 Full GC 传统上是**单线程 Serial Old 兜底**（并发失败/to-space exhausted 时触发），几百 ms~秒级；后续版本已改并行（`ParallelFullGC`，需按版本核对），但结论不变 —— **看到 Full GC 就是调优失败信号**。
- 分代 ZGC（JDK 21，JEP 439，默认关闭，`-XX:+UseZGC -XX:+ZGenerational` 写法需按版本核对）与 Shenandoah 一句：目标都是停顿与堆大小解耦。

| 目的 | 参数 |
|---|---|
| 堆大小固定，避免运行期扩缩抖动 | `-Xms4g -Xmx4g`（生产通常设等） |
| 元空间上限 | `-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m`（前者是「首次触发 GC 的阈值」不是初始大小） |
| 栈/直接内存 | `-Xss512k`、`-XX:MaxDirectMemorySize=1g` |
| G1 | `-XX:+UseG1GC -XX:MaxGCPauseMillis=100 -XX:InitiatingHeapOccupancyPercent=40` |
| OOM 自动 dump | `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/log/` |
| GC 日志 **JDK 8** | `-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:gc.log -XX:+UseGCLogFileRotation -XX:NumberOfGCLogFiles=5 -XX:GCLogFileSize=20M` |
| GC 日志 **JDK 9+** | `-Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=20M` |

> 注意：JDK 9+ 统一日志框架后 `-XX:+PrintGCDetails` 之类**失效并打印一条 warning**（`-Xlog` 取代）；两套写法不可混用 —— 这是排错时「日志没出来」的第一嫌疑。

---
## 九、诊断工具箱（命令可直接复制）

### 1. 命令行三板斧
```bash
jps -lvm                                  # 找 pid（-m 看主类参数）
jstat -gcutil <pid> 1000 10               # 每 1s 采 10 次：分区使用率 + GC 次数/耗时
jstat -gc  <pid> 1000 10                  # 同上但给 KB 绝对值，看容量基线更准
jmap -histo:live <pid> | head -30         # 存活对象类排行（:live 会先触发一次 Full GC！）
jmap -dump:format=b,file=heap.hprof <pid> # 全量堆 dump（不带 :live，STW，磁盘=堆大小）
jstack -l <pid> > thread.txt              # 线程快照：死锁、BLOCKED、线程数
jcmd <pid> Thread.print                   # 等价 jstack，推荐（走诊断框架）
jcmd <pid> GC.heap_info                   # 堆各区容量/已用（JDK 9+ 取代 jmap -heap）
jcmd <pid> VM.flags -all | grep -i meta  # 看生效参数；VM.version 看版本
jinfo -flag MaxHeapSize <pid>             # 查单个 flag；-flag:+Name 只对 manageable flag 有效
jhsdb jmap --heap --pid <pid>             # JDK 9+ 原 jmap -heap 的替代（sa-jdwp 后端）
```
`jstat -gcutil` 列义：`S0/S1` Survivor 使用%、`E` Eden 使用%、`O` 老年代使用%、`M` 元空间使用%、`CCS` 已压缩类空间%、`YGC/YGCT` Young 次数/累计秒、`FGC/FGCT` Full 次数/累计秒、`GCT` 总 GC 秒。**判读口诀**：`O` 或 `M` 只涨不跌 = 泄漏；`FGC` 递增且 `FGCT/FGC` 变大 = 老年代/元空间在逼 GC。

### 2. 图形与采样
`jconsole`/`VisualVM`（`jvisualvm`）看趋势与 MBean；**JFR（JDK 11+ 开源版生产免费）**：`jcmd <pid> JFR.start name=r settings=profile duration=60s filename=/tmp/r.jfr` → `jcmd <pid> JFR.dump name=r filename=/tmp/r2.jfr`，用 JDK Mission Control 打开。`async-profiler`（第三方，新版入口为 `asprof`）：`./profiler.sh -d 30 -f cpu.html <pid>` 出火焰图（也支持 `-e alloc` 分配热点、`-e lock` 锁竞争）。

### 3. Arthas 八条常用（阿里开源，生产可 attach）
```bash
dashboard                    # 总览：线程/内存/GC 一屏
thread -b                    # 直接打印死锁的持锁环（比 jstack 快）
thread -n 5                  # 最忙的 5 个线程栈；thread <id> 看单个
sc -d com.foo.OrderService   # 类由哪个 loader 加载、来自哪个 jar（查同名类冲突）
watch com.foo.Repo find '{params,returnObj,#cost}' 'params[0]==1L' -n 5  # 线上入参/耗时
trace com.foo.Service doBiz  # 方法内各调用耗时，定位慢在哪一跳
jad --source-only com.foo.C  # 反编译线上真正跑的字节码（确认发布版本）
heapdump /tmp/d.hprof --live # 触发 dump（同样 STW）；profiler start/stop 出火焰图
```
`ognl -c <hash> '@Cfg@flag'` 读静态字段、`logger --name` 动态改日志级别、`mc`+`redefine` 可热替换类方法体（**限制**：不能增删字段/方法、不改继承、被替换的实例状态保留、重启失效 —— 应急用，不是发布手段）。

### 4. MAT（Eclipse Memory Analyzer，第三方）
`Leak Suspects` 报告先看（给出「一个对象占了 78%」的怀疑链）；**Dominator Tree** 按 **retained heap**（保留大小：它一死能连带释放多少）排序 —— 与 **shallow heap**（自身大小）区分是 MAT 第一道考题；右键 → `Path to GC Roots → exclude all phantom/weak/soft/other unnecessary references` 剥掉弱引用噪声，剩下的就是真凶引用链；OQL：`SELECT * FROM java.util.ArrayList a WHERE a.size > 10000`。

| 工具/命令 | 用途 | STW? | 生产可用 |
|---|---|---|---|
| `jstat -gcutil` | GC 频率/各区水位 | 否 | ✅ 可常开 |
| `jstack`/`jcmd Thread.print` | 线程/死锁 | 短暂（需安全点） | ✅ |
| `jmap -histo:live` | 类占用排行 | **是**（Full GC） | ⚠️ 慎用/低峰 |
| `jmap -dump`/`heapdump` | 泄漏根因 | **是**，且耗 IO | ⚠️ 优先用 OOM 自动 dump |
| GC 日志 / JFR | 长期观测 | 极小（<1% 开销） | ✅ 推荐常开 |
| async-profiler | CPU/alloc 火焰图 | 否（安全点采样） | ✅ |
| Arthas `watch/trace` | 方法级定位 | 否（有字节码增强开销） | ⚠️ 用完 `stop` |

---
## 十、GC 日志怎么读

```
[23.417s][info][gc] GC(12) Pause Young (Normal) (G1 Evacuation Pause) 24M->7M(256M) 5.123ms
[41.902s][info][gc] GC(57) Pause Young (Concurrent Start) (G1 Humongous Allocation) 198M->181M(256M) 12.4ms
[61.120s][info][gc] GC(63) Pause Young (Normal) (G1 Preventive Collection) 205M->203M(256M) 88.1ms
[62.010s][info][gc,start] GC(64) Pause Young (Normal) (G1 Evacuation Pause) Evacuation Failure
[62.155s][info][gc] GC(64) Pause Young (Normal) (to-space exhausted) 240M->238M(256M) 145.2ms
[62.160s][info][gc] GC(65) Pause Full (G1 Compaction Pause) 238M->120M(256M) 1203.7ms
```
逐字段：`GC(65)` 是 GC 序号（配对 `gc,start` 看阶段耗时）；括号一 = 类型（`Normal`/`Concurrent Start`/`Prepare Mixed`），括号二 = **触发原因**，`240M->238M(256M)` = 回收前 → 回收后(堆总量)，末尾 = 该次 STW 停顿。`24M->7M` 是漂亮的小年轻 GC；**回收后几乎不降就是问题**。

| 日志信号 | 结论 / 下一步 |
|---|---|
| `GCT / 运行时长 > 5%`，或 `Pause Full` 频繁 | GC 时间占比过高 → 看堆是否太小 / 分配率太高（JFR `jdk.ObjectAllocationInNewTLAB` 或 async-profiler `-e alloc`） |
| 每次 GC 后 `->` 后的值持续爬升 | **老年代基线只涨不跌 = 泄漏**，去 dump |
| `(G1 Humongous Allocation)` 成串 | 大数组/大 byte[] 直入 Humongous，放大 Region 或改分页 |
| `to-space exhausted` / `Evacuation Failure` | 无空 Region 可复制 → 堆偏小或晋升过猛，紧接着常有 Full GC |
| `Pause Full (Metadata GC Threshold)`、`M` 列≈100% | **元空间满触发的 Full GC**，不是堆的问题，调 `-XX:MaxMetaspaceSize` 并查类加载泄漏 |
| 停顿远大于 `gc,phases` 内各阶段之和 | STW 时间花在**安全点同步**（某线程迟迟不到安全点）：`-Xlog:safepoint` |

---
## 十一、实战案例库（现象 → 定位 → 根因 → 解决）

**案例 1 `OutOfMemoryError: Java heap space`（一次性查全表）**
```bash
# 现象：夜间批量任务跑 40 分钟后进程死掉，hs_err 无、日志有 OOM
jstat -gcutil <pid> 1000 5         # 死前 O≈99%、FGC 连击、GCT 飞涨
# 已配 -XX:+HeapDumpOnOutOfMemoryError → 直接 MAT 打开 heap.hprof
```
MAT Dominator Tree 首位：单个 `ArrayList` retained ≈ 80%，元素是 100 万条 `OrderRow`。根因：`selectList` 无分页、`queryForList` 拉全表（见 `21-持久层进阶JPA与MyBatisPlus.md`）。解决：游标/分页（`limit` + 断点）+ 流式处理（MyBatis `ResultHandler`），并对集合设容量上限；`-Xmx` 只是止痛药。

**案例 2 `OutOfMemoryError: Metaspace`**
定位：`jstat -gcutil` 的 `M` 列 98%+ 且 `FGC` 缓增；`jcmd <pid> GC.class_stats`（需按版本核对）或 Arthas `sc -d * | wc -l`、`jmap -histo` 里 `java.lang.Class`/`ClassLoader` 数量异常。根因：① CGLIB/Javassist 每次调用生成新代理类并被静态 Map 缓存（`@Async`/`@Cacheable` 滥用 + 动态类名）；② Groovy/脚本热加载；③ fastjson 每次 `new ParserConfig()`（自带类缓存）。解决：修根因（复用 `ParserConfig`/代理、脚本 `Binding` 复用）+ 显式 `-XX:MaxMetaspaceSize=512m` 让问题早暴露；热部署场景配 `-XX:ClassUnloadingWithConcurrentMark`（默认已开，需按版本核对）。

**案例 3 `OutOfMemoryError: unable to create new native thread`**
定位：`ls /proc/<pid>/task | wc -l` 看线程数；`jstack <pid> | grep 'tid=' | awk '{print $2}' | sort | uniq -c | sort -rn | head` 统计同名线程（`pool-N-thread-M` 数量揭示有多少个池）。根因：一个服务里 8 个中间件各建自己的 `Executors.newCachedThreadPool()`（无上限）、且 `-Xss` 偏大导致每线程 native 预留过高；或容器 `ulimit -u` / cgroup pids 限制。解决：**统一走有界线程池**（`35-线程池与线程协作.md`），`-Xss256k` 足够纯 Java 栈，必要时提 `ulimit -u` 与 `/proc/sys/vm/max_map_count`；堆给太大挤压 native 也会诱发此错。

**案例 4 `StackOverflowError`**
定位：`grep -A 40 StackOverflowError app.log` 看重复帧 —— 栈深 5000 层重复同一方法是递归特征。根因：① Jackson 双向实体（`Order ↔ Customer`）未配 `@JsonIdentityInfo`/`@JsonIgnore` 无限互引；② `toString()` 拼接了含自身的集合（Lombok `@Data` + 双向关系）；③ 递归遍历极深树。解决：DTO 层切断引用（不要直接序列化 JPA 实体）、加 `@JsonManagedReference/@JsonBackReference`、递归改显式栈 + 深度上限。

**案例 5 CPU 100%**
```bash
top -Hp <pid>                       # 看该进程内各线程 CPU（L 键切线程视图）
printf '%x\n' <十进制tid>            # → 0x1a2b（jstack 里是十六进制 nid）
jstack <pid> | grep -A 25 'nid=0x1a2b'
```
分三种：① 栈顶是 GC 线程（`G1 Young RemSet Sampling`/`VM Thread`）→ 转去看 GC 日志，本质是内存问题；② 用户线程栈反复出现在自己业务方法（`while`/深调用）→ 死循环；③ 栈顶在 `java.util.regex`（`Pattern$Cur.match`）→ **正则灾难性回溯 ReDoS**（`33-字符串与常用API.md`），改占有量词或前缀固化。Arthas 快捷路径：`thread -n 5` 直接给最忙栈，或 `profiler start; profiler stop --format html`。

**案例 6 频繁 Full GC / RT 毛刺**
定位顺序：`jstat -gcutil <pid> 1000` 看 `FGC` 增速 → 从 `gc.log` 抓 Full GC 前的**原因括号**：`(Allocation Failure)`/`Evacuation Failure` + `to-space exhausted` = 老年代真满；`(Metadata GC Threshold)` = 元空间；`(System.gc())` = **代码/框架显式调用** —— RMI DGC 默认每小时一次、`ByteBuffer` 的 `Cleaner` 在 direct 内存吃紧时也调 `System.gc()`。根因与解决：堆太小或大对象直入老年代 → 扩堆/分页；`System.gc()` → 不要粗暴 `-XX:+DisableExplicitGC`（**副作用：直接内存无法及时回收，最终 `OOM: Direct buffer memory`**），改用 `-XX:+ExplicitGCInvokesConcurrent -Dsun.rmi.dgc.server.gcInterval=2592000000`；分配率过高 → 见第十三节。

**案例 7 死锁**
```
Found one Java-level deadlock:
=============================
"order-1": waiting to lock monitor 0x7f.. (object 0x..e51, a java.lang.Integer), which is held by "order-2"
"order-2": waiting to lock monitor 0x7f.. (object 0x..e41, a java.lang.Integer), which is held by "order-1"
```
复现：`transfer(a,b)` 与 `transfer(b,a)` 并发按参数顺序加两把锁。根因：加锁顺序不一致。解决：**全局按固定序加锁**（如按账户 ID 排序）、或用 `lock.tryLock(50, MILLISECONDS)` 超时后回退重试、或合并成一把粗粒度锁。预防：`jstack` 或 Arthas `thread -b` 纳入巡检脚本；建议 JFR 常开（安全点/线程相关事件可回溯死锁与长 STW，事件名需按版本核对）。

**案例 8 RSS 持续上涨但堆很空（无 OOM 却被 K8s 杀）**
定位：`jstat` 一切正常 → `pmap -x <pid> | sort -k3 -n -r | head -20` 找大匿名段；`jcmd <pid> VM.native_memory summary`（**需启动时带 `-XX:NativeMemoryTracking=summary`，不能动态加**，开销约 5%）对比 `thread`/`class`(Metaspace)/`internal`/`other` 分类；`VM.native_memory baseline` + 一段时间后 `... summary.diff` 看谁在长。根因常见：① 直接内存/Netty `PoolChunk` 未设 `-XX:MaxDirectMemorySize`；② glibc `malloc` 多 arena 碎片（`M_ARENA`/`MALLOC_ARENA_MAX=2`，或换 jemalloc/tcmalloc）；③ 每个 `URLClassLoader` 泄漏（第六节）。解决：限制 direct、复用 buffer、`-XX:MaxRAMPercentage` 留余量，别让容器 limit 卡着 native 内存（第十二节）。

---
## 十二、生产配置基线（可直接抄）

| 项 | 建议 | 为什么 |
|---|---|---|
| 容器感知 | JDK 10+ 默认 `-XX:+UseContainerSupport`（8u191+/11+ 默认开，需按版本核对） | JVM 读 cgroup limit 而非宿主机内存；关掉它曾是大厂血泪 |
| 堆占比 | `-XX:MaxRAMPercentage=60~75`，**绝不 100%** | 堆之外还有 Metaspace + 线程栈 + CodeCache + direct + GC 自身结构；超 limit 被 **OOMKilled（exit 137）且不产生 heap dump**，见 `29-Kubernetes部署.md` |
| 初始=最大 | 传统 `-Xms=-Xmx`；容器内按百分比时二者同源 | 免扩缩抖动；但小堆/密集实例下 `-Xms` 太大会白占 RSS，需评估 |
| 收集器 | JDK 9+ 默认 G1（无需显式 `-XX:+UseG1GC`） | 低延迟 + 可预测停顿 |
| 观测 | `-Xlog:gc*:file=...:time,uptime,level,tags:filecount=5,filesize=20M` + JFR 常开 | 出事时唯一回溯材料 |
| 兜底 | `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/log`、`-XX:+ExitOnOutOfMemoryError` | OOM 后进程已不可信，快速失败让编排器重启（`29`）比僵着更好 |
| 关 ExplicitGC | 用 `ExplicitGCInvokesConcurrent` 而非 `DisableExplicitGC` | 见案例 6 |

```bash
JAVA_OPTS="-XX:MaxRAMPercentage=70.0 -XX:+UseG1GC -XX:MaxGCPauseMillis=100 \
 -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=384m -XX:MaxDirectMemorySize=512m -Xss512k \
 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/data/log -XX:+ExitOnOutOfMemoryError \
 -Xlog:gc*:file=/data/log/gc.log:time,uptime,level,tags:filecount=5,filesize=20M \
 -XX:NativeMemoryTracking=summary -XX:StartFlightRecording=maxsize=512m,maxage=24h \
 -Djava.security.egd=file:/dev/./urandom -Duser.timezone=Asia/Shanghai"
```

---
## 十三、调优方法论（避免玄学）

1. **先定 SLO**：吞吐目标（如 3000 TPS）、RT 目标（P99 < 200ms）、GC 停顿预算（单次 < 50ms）→ 无目标则「调优」= 猜参数。
2. **再补观测**：GC 日志 + JFR + Micrometer 的 `jvm_gc_*` 指标进 Prometheus/Grafana（`30-可观测性.md`），复现环境用同样参数。
3. **一次只改一个变量**，留基线对照跑压测；改动记录写进部署说明，包括 JDK 小版本。
4. **优先减少垃圾产生，而不是让 GC 扫更快**：多数 Java 性能问题是**分配率/对象生命周期**问题 —— 复用 `byte[]`/`StringBuilder` 容量、避免自动装箱与 `Stream` 上的 `Integer`（用 `IntStream`）、少造临时对象与 `Optional` 链、日志/序列化避免 `toString` 大对象、**对象池要谨慎**（延长生命周期反而把垃圾搬进老年代）。
5. **反模式清单**：照抄博客参数不核 JDK 版本（8 与 17 的默认值/flag 差异很大）；只看 `-XX:+PrintFlagsFinal` 不确认哪个是 `manageable/diagnostic`；上生产前不评估 `-XX:+AlwaysPreTouch`（启动即 touch 全部堆，内存超卖环境会立刻把 RSS 打满）；调 `-Xmn` 破坏 G1 自适应；给容器 `-XX:MaxRAMPercentage=100`；OOM 后靠 `sleep + 重启` 掩盖而不 dump；把「Full GC 次数」当唯一 KPI 而忽视单次停顿与吞吐。

---
## 十四、常见面试题速答

> **1. 怎么判断对象可以被回收？** 引用计数法（有循环引用缺陷）不被 HotSpot 采用；实际用可达性分析，从 GC Roots 出发不可达即可回收。旧教材的「标记两次 + `finalize` 一次逃生」流程随 `finalize` 废弃已不具实践意义。
> **2. GC Roots 有哪些？** 各线程栈 tableslot 引用、`Thread` 对象、JNI 引用、静态属性、`Class` 对象、被 `synchronized` 持有的监视器、JVM 内部常量与类加载器；枚举靠 OopMap + 安全点。
> **3. 四种引用？** 强（不回收）/软（内存不足才回收，缓存）/弱（下次 GC 即回收，`WeakHashMap`、`ThreadLocalMap` key）/虚（`get()` 恒 null，配合 `ReferenceQueue` 感知回收，如 `Cleaner`）。
> **4. 双亲委派？怎么打破？** 先委派父、父失败才自己加载 —— 保核心类与类唯一性；SPI 用线程上下文类加载器、Tomcat/OSGi 本地优先、JDK 9 模块层定向加载都算打破。
> **5. `Class.forName` vs `loadClass`？** 前者默认**初始化**（可三参关掉），后者只加载不初始化。
> **6. 哪些区会 OOM？** 堆、元空间、栈（native thread 创建失败）、直接内存都抛 `OutOfMemoryError`；栈深抛 `StackOverflowError`；只有程序计数器规范上不 OOM。
> **7. 一次 Full GC 频繁的排查步骤？** `jstat -gcutil` 看 `O/M/FGC` 趋势 → `gc.log` 看**括号里的原因** → 分堆因（dump + MAT Dominator）/元空间因（类加载数）/显式 `System.gc()` 调用/大对象 Humongous 四路处理 → 改完复测同一压测。
> **8. 容器里为什么 `-XX:MaxRAMPercentage` 不能 100%？** JVM 内存 = 堆 + Metaspace + CodeCache + 线程栈 + GC 结构 + 直接内存 + native 库；堆满 100% 必然超 cgroup limit → OOMKilled（137），且没有 heap dump，问题变成玄学。留 25~40% 给非堆。

---
## 十五、与系列其他文档的关系

- `16-JVM内存模型与GC.md`：内存划分、GC 算法与收集器选型在 16；本篇是「引用判定 + 类加载 + 诊断命令 + 案例」，两者互补不重复。
- `34-并发底层原理JMM与锁.md`：另一个「JMM」（JSR-133）、`volatile`/锁消除与本篇第三节逃逸分析同源。
- `35-线程池与线程协作.md`：线程数失控 → 案例 3 native thread OOM/SOF；`ThreadLocal` 弱引用泄漏（第五、六节）。
- `36-集合底层源码剖析.md`：泄漏场景里的 `HashMap`/`ArrayList` 扩容与持有行为。
- `32-IO与NIO.md`：直接内存、`Cleaner`、零拷贝与案例 8 的 RSS 增长。
- `33-字符串与常用API.md`：`intern` 对常量区的影响、正则回溯导致案例 5 CPU 100%。
- `29-Kubernetes部署.md`：容器内存/`MaxRAMPercentage`/OOMKilled 137 与探针重启策略。
- `28-云原生GraalVM.md`：Native Image 无传统 JIT/类加载，内存特征与本篇基线完全不同。
- `30-可观测性.md`：GC 与内存指标接入 Prometheus/Grafana 告警，替代人肉 `jstat`。
- `21-持久层进阶JPA与MyBatisPlus.md`：案例 1「一次查 100 万行」的常见来源与分页/流式方案。
- `04-异常处理.md`：`Error` 家族（`StackOverflowError`/`OutOfMemoryError`）不该被 `catch` 后吞掉。
