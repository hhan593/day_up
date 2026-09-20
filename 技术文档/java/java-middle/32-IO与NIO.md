# 32 - IO 与 NIO（流式 I/O 与多路复用）

> 来源：Oracle《The Java™ Tutorials》— Basic I/O、Trail: Learning the Java Language > IO；JSR 203（NIO.2 / `java.nio.file`）；JEP 353（Reentrant Read/Write Lock，可选提及）
> 官方：https://docs.oracle.com/javase/tutorial/essential/io/ 、https://openjdk.org/jeps/353
> 补充：零拷贝与 Reactor 部分基于 Linux `sendfile`/`mmap` 语义与 Netty/Kafka 官方设计文档的标准实践整理。

IO 是一条从「读一个文件」直通「Netty/Kafka 高吞吐」的主线：`java.io` 解决怎么读写，`java.nio` 解决怎么高并发地读写，零拷贝与 Reactor 解决怎么不浪费一次内存复制和一个线程。本篇覆盖 `java.io` 与 `java.nio` 两大包（JDK 21）。

---
## 一、IO 的分类坐标

| 分类维度 | 两端的值 | 代表 |
|---|---|---|
| 按流向 | 输入流 / 输出流（方向以**程序**为中心，勿按文件系统理解） | `InputStream` / `OutputStream` |
| 按单位 | 字节流（8 bit）/ 字符流（16 bit 字符） | `FileInputStream` / `FileReader` |
| 按角色 | 节点流（直连数据源）/ 处理流（包装增强，**装饰器模式**） | `FileInputStream` / `BufferedInputStream` |
| 按模型 | BIO（同步阻塞）/ NIO（同步非阻塞多路复用）/ AIO（异步） | `java.io` / `java.nio` / `AsynchronousChannel` |

---
## 二、字节流体系

`InputStream`/`OutputStream` 是抽象基类，核心即 `read()`/`write()`；常用实现：`FileInputStream`（文件）、`ByteArrayInputStream`（内存数组）、`ObjectInputStream`（反序列化，见第五节）。**单字节读 vs 批量读**：逐字节 `read()` 拷 1MB 文件比 `byte[]` 一次 8KB 通常慢一到两个数量级——批量化是 IO 优化第一定律。所有流实现 `Closeable`（继承 `AutoCloseable`），try-with-resources 按构造**逆序**关闭（语法详见 `04-异常处理.md`）。

```java
try (InputStream in = Files.newInputStream(src);
     OutputStream out = Files.newOutputStream(dst)) {
    byte[] buf = new byte[8192]; int n;                        // 批量读，勿逐字节
    while ((n = in.read(buf)) != -1) out.write(buf, 0, n);     // -1=EOF；按 n 写防脏尾
}
```

---
## 三、字符流体系

`Reader`/`Writer` 处理文本。**字节↔字符的桥梁是 `InputStreamReader`/`OutputStreamWriter`，必须显式指定 `Charset`**，否则跟随平台默认字符集——中文乱码头号根因（JDK 18 起 JEP 400 将默认字符集定为 UTF-8，但跑老 JDK 或被显式覆盖的机器依旧翻车）。

| 场景 | 选择 | 理由 |
|---|---|---|
| 图片/视频/任意二进制 | 字节流 | 没有「字符」概念，转码即破坏数据 |
| Java 对象序列化 | 字节流（`ObjectOutputStream`） | 写的是字节 |
| 文本、CSV、日志 | 字符流 + 显式 UTF-8 | 按字符处理，天然对齐多字节边界 |

```java
try (var r = new BufferedReader(new InputStreamReader(
        Files.newInputStream(p), StandardCharsets.UTF_8))) {   // 桥接并钉死 UTF-8
    String line; while ((line = r.readLine()) != null) process(line);  // r.lines() 转 Stream<String>，PrintWriter 负责 printf
}
```

> 注意：JDK 17 才给 `FileReader`/`FileWriter` 加了带 `Charset` 的构造；老代码裸 `new FileReader(f)` 读中文要条件反射怀疑乱码。

---
## 四、四大抽象基类与装饰器模式

四大基类 `InputStream`/`OutputStream`/`Reader`/`Writer`；处理流**组合而非继承**地包装节点流，即装饰器模式（对照 `25-设计模式与面试专项.md`）：`new BufferedReader(new InputStreamReader(new FileInputStream(f), UTF_8))` 三层各司其职。

- `Buffered*` 为什么快：**把 N 次小系统调用聚成 1 次大系统调用 + N 次内存读**，默认缓冲 8KB；`readLine()` 还省掉逐字符找行尾的循环。
- `DataInputStream`/`DataOutputStream`：平台无关地读写 `int`/`double` 基本类型（`readInt()`、`writeUTF()`），做简易二进制协议时有用。

---
## 五、对象序列化

`Serializable` 是**标记接口**（无方法，靠反射识别）。**`serialVersionUID` 是版本指纹**：不显式声明时 JVM 按类结构自动生成，改一个字段签名就变化 → 反序列化旧流抛 `InvalidClassException`，**生产必写 `private static final long serialVersionUID = 1L;`**。

- `transient` 跳过字段（敏感数据）；自定义 `writeObject`/`readObject` 可加密字段、补父类状态；`Externalizable` 完全接管（需无参构造）；`readResolve()` 反序列化时返回既有实例，**保证单例不被破坏**。
- 安全一句话：反序列化不可信字节流可触发 gadget 链执行任意代码（Commons-Collections 即典型），默认视为高危入口。

| 方案 | 体积 | 速度 | 跨语言 | 典型场景 |
|---|---|---|---|---|
| JDK 原生 | 大（含类元数据） | 慢 | 否 | 淘汰中，仅 RMI 等兜底 |
| JSON（Jackson） | 中 | 中 | 是 | Web API、可读配置 |
| Protobuf | 小（varint） | 快 | 是 | RPC、Kafka 消息 |
| Kryo | 小 | 很快 | 否（JVM 系） | 内存缓存、Spark |

> 结论：JDK 原生序列化因体积大、跨语言差、不安全，生产上被 JSON/Protobuf/Kryo 取代；Redis value 选 `GenericJackson2JsonRedisSerializer` 还是 `JdkSerializationRedisSerializer` 见 `23-Redis缓存.md`。

---
## 六、File 与 NIO.2 文件 API

`java.io.File`（JDK 1.0）只能表示绝对/相对路径、`listFiles()` 失败静默返回 null；JDK 7 的 NIO.2（JSR 203）用 `Path` + `Files` 全面替代：小文本 `Files.readString`/`writeString`（**JDK 11**）、逐行 `Files.lines`（返回 Stream **需关闭**）、遍历 `Files.walk`/`find`、`Files.copy/move/delete`，路径运算用 `Path.resolve`/`normalize` 而非拼字符串。

```java
static long countJavaLines(Path dir) throws IOException {   // 递归统计 .java 行数
    try (var paths = Files.walk(dir)) {                     // walk 持目录流，必须关
        return paths.filter(p -> p.toString().endsWith(".java")).mapToLong(p -> {
            try (var l = Files.lines(p)) { return l.count(); } catch (IOException e) { return 0; } }).sum();
    }
}
```

---
## 七、编码与换行踩坑清单

| 坑 | 成因 | 对策 |
|---|---|---|
| 中文乱码 | UTF-8 写、GBK 读：汉字分别占 3/2 字节，字节数对不齐 | 读写两端显式钉死 `StandardCharsets.UTF_8` |
| 换行不一致 | `\r\n`(Windows CRLF) vs `\n`(Unix LF) | 文本模式转换；`readLine()` 两者都兼容 |
| BOM 头 `EF BB BF` | 部分编辑器给 UTF-8 文件头加 3 字节 | 解析首行前剥离，手写流尤其注意 |

---
## 八、BIO / NIO / AIO 三种模型（本篇核心）

| 维度 | BIO | NIO | AIO |
|---|---|---|---|
| 同步性/阻塞性 | 同步阻塞 | 同步非阻塞 + 多路复用 | 异步不阻塞 |
| 谁等待数据就绪 | 应用线程自己 | Selector（内核轮询） | 操作系统 |
| 谁拷数据进 buffer | 应用线程 read 时拷 | 应用线程 read 时拷 | OS 拷完再回调 |
| JDK API | `java.io` Socket/Stream | `java.nio` Channel+Selector | `AsynchronousChannel`（JDK 7） |
| 适用场景 | 连接少且固定 | 连接多、短请求、高并发 | Windows IOCP 成熟；Linux 不完整 |

**BIO：一连接一线程**，线程数 ≈ 连接数，万连接就要万线程（每个约 1MB 栈 + 调度开销），吞吐被锁死，实践上配 `ThreadPoolExecutor` 限流（参数与队列选型见 `35-线程池与线程协作.md`）。**NIO：一线程多连接**，三大组件如下。

### 1. Buffer：capacity / position / limit 三指针

```text
写入后:   [ d1 d2 d3 d4 _ _ _ _ ]  position=4, limit=8(capacity)
flip()后: [ d1 d2 d3 d4 _ _ _ _ ]  position=0, limit=4  ← flip=写完切读: limit=原position, position=0
clear()后: [ _ _ _ _ _ _ _ _ _ ]  position=0, limit=8  ← 回写模式(数据未擦除)
```

`compact()` 把 [position, limit) 未读部分挪到开头再进写模式，适合半包场景；`allocate()` 堆内（读写时多一次临时拷贝）vs **`allocateDirect()` 堆外、少一次拷贝**，适合长期复用的大缓冲。

```java
try (FileChannel ch = FileChannel.open(path, StandardOpenOption.READ)) {
    ByteBuffer buf = ByteBuffer.allocate(8192);
    while (ch.read(buf) != -1) {      // 通道→buffer（写模式）
        buf.flip(); consume(buf);     // 切读模式并消费
        buf.clear();                  // 切回写模式
    }
}
```

### 2. Channel：双向数据通道

`FileChannel`/`SocketChannel`（TCP 客户端）/`ServerSocketChannel`（TCP 服务端）/`DatagramChannel`（UDP）。对比 Stream 单向，Channel **双向可读可写**；`FileChannel.transferTo/transferFrom` 是**零拷贝入口**（见第九节）。

### 3. Selector：IO 多路复用

单线程 + 一个 `Selector` 监听成千上万 Channel，`select()` 阻塞直到就绪 key 集合非空；`SelectionKey` 四种事件：`OP_CONNECT`（连接完成）/`OP_ACCEPT`（新连接到达）/`OP_READ`（可读）/`OP_WRITE`（缓冲可写）。

```java
Selector sel = Selector.open();                              // 最小 NIO echo server 骨架
try (ServerSocketChannel ssc = ServerSocketChannel.open()) {
    ssc.bind(new InetSocketAddress(9000)); ssc.configureBlocking(false); // 非阻塞是注册前提
    ssc.register(sel, SelectionKey.OP_ACCEPT);
    while (true) { sel.select();            // 阻塞等待就绪事件
        for (SelectionKey k : sel.selectedKeys()) {
            sel.selectedKeys().remove(k);    // 处理后必须手动移除
            if (k.isAcceptable()) {
                var c = ssc.accept(); c.configureBlocking(false);
                c.register(sel, SelectionKey.OP_READ);
            } else if (k.isReadable()) {
                var c = (SocketChannel) k.channel(); ByteBuffer buf = ByteBuffer.allocate(1024);
                if (c.read(buf) == -1) { c.close(); continue; }  // -1=对端关闭
                c.write(buf.flip());         // echo；生产需处理半包
            }
        }
    }
}
```

> 注意：Linux 上 JDK epoll 实现有「空轮询 bug」（无事件也返回，净烧 CPU），**Netty 靠「连续空轮询超阈值就重建 Selector」自愈**——这是 Netty 稳定的原因之一。

**AIO（JDK 7，`AsynchronousChannel`）**：注册 `CompletionHandler`，OS 读完数据回调 `completed()`，真异步；但 Linux 底层用信号模拟 IOCP、语义不完整，高负载性能反不如 NIO，**所以 Netty 不支持 AIO，生产选 NIO/Netty**。

---
## 九、零拷贝（面试必考）

传统 `read(f) + write(sock)` 传文件：**4 次上下文切换 + 4 次拷贝**——DMA 拷磁盘→内核 page cache、CPU 拷内核→用户 buffer、CPU 拷用户→socket buffer、DMA 拷 socket buffer→网卡。

- **`sendfile`**（Linux 2.1+）：内核内完成 page cache→socket，省掉两次 CPU 拷贝；网卡支持 **scatter/gather** DMA 时只传描述符 → **2 次上下文切换、1 次 DMA 拷贝**。
- **`mmap + write`**：文件映射进用户虚拟内存，读变内存访问；2 次切换 3 次拷贝，折中方案（需改文件内容时用）。

Java 落点：**`FileChannel.transferTo`**（内部即 sendfile）、**`FileChannel.map()` 返回 `MappedByteBuffer`**（mmap；回收不受控，大文件慎用）。应用价值：**Kafka 追加快、Netty 文件服务器吞吐高，根因都是零拷贝**（详见 `27-Kafka流式处理.md`）。

---
## 十、Reactor 线程模型

| 模型 | 结构 | 瓶颈 |
|---|---|---|
| 单 Reactor 单线程 | 1 线程跑 accept + IO + 业务 | 业务一慢全停 |
| 单 Reactor 多线程 | IO 单线程，业务丢线程池 | accept + IO 仍单点 |
| **主从 Reactor**（Netty） | `mainReactor` 只 accept，`subReactor` 池处理 IO，业务再进 worker 池 | 复杂，吞吐随核数线性扩 |

主从分工：mainReactor 注册 `OP_ACCEPT` → 建连后 Channel 哈希分给某 subReactor → subReactor 读写解码 → 投递业务线程池。跨语言对照：Go netpoll 把这套循环藏进 runtime 调度；Node.js libuv 单线程事件循环 + 线程池，等价于被 OS 封装的主从 Reactor。

---
## 十一、网络薄层与 JDK HttpClient

`java.net.Socket` 即 BIO socket（一行 `new Socket(host, port)`，读写全阻塞）；JDK 11 的 `java.net.http.HttpClient` 是应用层 HTTP 封装（**底层仍走 NIO**），同步/异步/流式三种调用。**Netty 是网络框架、不在本篇展开**（底座已在八、九、十节铺垫，生态见 `27-Kafka流式处理.md`、`26-WebFlux响应式编程.md`）。

```java
HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder(URI.create("https://example.com")).build();
client.send(req, HttpResponse.BodyHandlers.ofString());            // ① 同步阻塞
client.sendAsync(req, HttpResponse.BodyHandlers.ofString())        // ② 异步
      .thenAccept(r -> System.out.println(r.body()));
// ③ 流式：BodyHandlers.ofLines() 得 Stream<String>，边收边处理
```

---
## 十二、实战选型清单

> - 小文本整个读 → `Files.readString`（JDK 11）
> - 大文本逐行 → `BufferedReader.lines()` / `Files.lines()`（记得关流）
> - 图片/音视频/任意二进制 → 字节流 + `byte[]` 缓冲
> - 高并发网络服务 → Netty（NIO + 主从 Reactor），别手写 Selector 上生产
> - 文件服务器/大文件转发 → `FileChannel.transferTo` 零拷贝

---
## 十三、与系列其他文档的关系

- `04-异常处理.md`：try-with-resources 语法在 04 讲透，本篇是应用方。
- `25-设计模式与面试专项.md`：流的包装链即**装饰器模式**，IO 家族还暗含模板方法（`read()` 骨架）。
- `10-虚拟线程.md`：**Java 21 后最重要的观念变化**——虚拟线程让「一连接一线程」的 BIO 编程模型重新可行：
  百万虚拟线程各挂各的阻塞 socket，阻塞即自动让出载体线程，不写 NIO 回调也能扛高并发；
  NIO 由此从「唯一的高并发答案」降级为「Netty 等框架的底座」。
- `27-Kafka流式处理.md`：Kafka 高吞吐的核心就是第九节 `sendfile` 零拷贝 + 第十节 Reactor 网络线程。
- `26-WebFlux响应式编程.md`：WebFlux 跑在 Netty（NIO 主从 Reactor）之上，背压是 IO 模型的上一段抽象。
- `31-反射与注解.md`：序列化靠反射遍历字段，同为本知识库各框架的底座。
