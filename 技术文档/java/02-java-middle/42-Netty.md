# 42 - Netty 异步事件驱动框架

> 来源：Netty 4.x Reference Guide（netty/netty 仓库官方用户指南 `ReferenceGuide_V4`）—「Writing a Server」「ChannelPipeline and ChannelHandlers」「ByteBuf API」「Dealing with a stream transport」各章；`IdleStateHandler`、`LengthFieldBasedFrameDecoder`、`ResourceLeakDetector` 语义按 Netty 4.x 官方 API 文档
> 官方：Netty 4.x Reference Guide（netty.io 官方 User Guide）—「The Big Picture」「Writing a Server」「ChannelPipeline and ChannelHandlers」「The ByteBuf API」「Dealing with a stream transport」各章
> 补充：池化分配器 Arena/Chunk/Page 结构、默认线程数、空轮询自愈等实现层结论基于 Netty 4.x 源码公开行为与业界标准实践整理，个别默认值随版本微调，正文已用「默认/通常」等措辞留余地。

`32-IO与NIO.md` 讲清了 JDK NIO 的 Selector/Buffer 三指针和手写 Reactor，并给出结论「别手写 Selector 上生产」。本篇接住这个结论：**Netty 就是 JDK NIO 的生产级封装**——它不发明新的 IO 模型，而是把 epoll 空轮询、线程编排、Buffer 管理、黏包拆包这些「自己搭必然踩坑」的部分全部产品化。

---
## 一、为什么不用原生 NIO

`32` 篇末尾的手写 echo server 骨架能跑 demo，但离生产差四件事：

| # | JDK NIO 痛点 | 具体表现 | Netty 的解法 |
|---|---|---|---|
| 1 | API 原始、状态要手管 | `ByteBuffer` 读写切换必须 `flip()/clear()`，`read()` 返回半包要自己攒 | `ByteBuf` 双指针免 flip；解码器基类内置累积缓冲 |
| 2 | epoll 空轮询 bug | Linux 上 Selector 无事件也返回，净烧 CPU（`32` 第八节已提） | 连续空轮询超阈值（默认 512 次量级）自动重建 Selector 自愈 |
| 3 | 线程模型全靠自己搭 | accept/读写/业务的线程编排、跨线程任务投递、无锁化都要手写 | `EventLoopGroup` 主从 Reactor 开箱即用，Channel 与线程绑定 |
| 4 | 没有编解码抽象 | 协议帧的拆包/组包、序列化全自理 | `ChannelPipeline` + 一套 `FrameDecoder`/`Codec` 家族 |

**谁在用 Netty**：Dubbo（默认通信层之一）、gRPC-Java、RocketMQ（NameServer/Broker 通信）、Spring WebFlux（经 Reactor Netty，见 `26-WebFlux响应式编程.md`）、Spring Cloud Gateway、Elasticsearch 节点间 transport 协议。
> 注意：**Kafka 不用 Netty**——它自研了一套基于 JDK NIO 的 `Selector`（`kafka.network` 包）按自己的场景定制，高吞吐靠的正是 `32` 篇讲的 `sendfile` 零拷贝 + 自研 Reactor（见 `27-Kafka流式处理.md`）。面试说「Java 高并发网络框架基本都基于 Netty」会漏掉 Kafka 这个最著名的反例。

---
## 二、组件与线程模型（本篇最重要）

核心组件速查：

| 组件 | 职责 | 类比 JDK/日常概念 |
|---|---|---|
| `Bootstrap` / `ServerBootstrap` | 组装并启动客户端 / 服务端（链式配置） | 餐厅的开店筹备清单 |
| `Channel` | 一条连接的抽象（NIO `SocketChannel` 的包装） | 一根水管 |
| `ChannelPipeline` | 该连接的 handler 责任链，事件流经它 | 流水线上的工序站 |
| `ChannelHandler` | 业务/编解码逻辑，分 Inbound（读方向）与 Outbound（写方向） | 工序站上的工人 |
| `EventLoop` | 单线程 + 一个 Selector + 一个任务队列，`implements ScheduledExecutorService` | 一个只干两件事的工人：轮询 IO + 执行排队任务 |
| `EventLoopGroup` | EventLoop 数组，负责挑选/分配 | 班组 |
| `ChannelFuture` | 异步结果回调，监听器默认在 EventLoop 线程执行 | 不阻塞的 `Future` + listener |

**三条绑定关系（方向绝不能背反）**：

1. 一个 `EventLoop` **终身绑定一个线程**（构造时起不变）；
2. 一个 `Channel` 一旦注册就**固定绑定一个 `EventLoop`**（因此同一 Channel 的所有事件都在同一线程上**串行执行，天然无需加锁**）；
3. 反过来，一个 `EventLoop` 可以**同时服务多个 Channel**（多路复用的本质）。

```text
ServerBootstrap
 └─ bossGroup (EventLoopGroup, 通常 1 线程)
 │    EventLoop-0: select(OP_ACCEPT) → accept 出新连接
 │                                        │ register（按轮询/哈希挑选）
 └─ workerGroup (EventLoopGroup, 默认 CPU×2)↓
      ┌──── EventLoop-A（线程A：Selector + taskQueue）────┐
      │  Channel-1 ══ Pipeline ══ [解码→业务→编码]        │   一个 EventLoop
      │  Channel-2 ══ Pipeline ══ [...]                  │   服务多个 Channel
      └──────────────────────────────────────────────────┘
      EventLoop-B（线程B）: Channel-3 ══ Pipeline ══ [...]   …以此类推
  不变式：EventLoop↔线程 1:1；Channel→EventLoop 多:1 且终身不换
```

**主从 Reactor 与 `32` 第十节手写模型的逐项对照**：
| `32` 手写 Reactor 里的角色 | Netty 对应物 | 手写时漏掉的坑 |
|---|---|---|
| `mainReactor` 线程 + `OP_ACCEPT` | bossGroup 的 EventLoop | 忘了把新 Channel 设非阻塞 |
| `subReactor` 线程池 + `OP_READ/OP_WRITE` | workerGroup 的 EventLoop 数组 | 每线程各建 Selector、无自愈 |
| 「accept 后哈希分给某 subReactor」 | `workerGroup.next()` 注册 Channel | 分配不均、Channel 中途换线程 |
| 跨线程投递业务池 `executor.submit(...)` | `channel.eventLoop().execute(task)` 投回本 Channel 的 EventLoop | 业务线程直接碰 Channel 状态，线程安全崩坏 |
| `selectedKeys` 手动 `remove` | EventLoop 内部处理 | 忘移除导致重复处理 |

---
## 三、最小可运行 Echo 服务端 + 客户端

```java
public final class EchoServer {
    public static void main(String[] args) throws Exception {
        NioEventLoopGroup boss = new NioEventLoopGroup(1);      // 只干 accept，1 线程足够
        NioEventLoopGroup worker = new NioEventLoopGroup();     // 不传参 = 默认 CPU核数×2
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(boss, worker)
             .channel(NioServerSocketChannel.class)
             .option(ChannelOption.SO_BACKLOG, 1024)            // 服务端：全连接队列长度，压测场景先想它
             .option(ChannelOption.SO_REUSEADDR, true)          // 服务端：重启时允许绑定 TIME_WAIT 端口，防 "Address already in use"
             .childOption(ChannelOption.SO_KEEPALIVE, true)     // 子连接：TCP 层保活探测（内核级，周期约 2 小时，远慢于业务心跳）
             .childOption(ChannelOption.TCP_NODELAY, true)      // 子连接：关 Nagle，小包立即发（RPC/IM 必开，省约 40ms 攒包延迟）
             .childHandler(new ChannelInitializer<SocketChannel>() {
                 @Override protected void initChannel(SocketChannel ch) {
                     ch.pipeline()                             // 每条连接一条全新 Pipeline
                       .addLast(new LineBasedFrameDecoder(1024))
                       .addLast(new StringDecoder())
                       .addLast(new SimpleChannelInboundHandler<String>() {
                           @Override protected void channelRead0(ChannelHandlerContext ctx, String msg) {
                               ctx.writeAndFlush(msg + "\n");  // 原样回弹
                           }
                       });
                 }
             });
            b.bind(9000).sync().channel().closeFuture().sync(); // bind 是异步的，sync 等它完成
        } finally { boss.shutdownGracefully(); worker.shutdownGracefully(); }
    }
}
```

客户端用 `Bootstrap`（无 group 主从之分，只一个 group）：`.group(g).channel(NioSocketChannel.class).remoteAddress(...).connect(...)`，Pipeline 里放 `StringEncoder`/`StringDecoder` + 读 handler 即可，结构与服务端对称。
> 注意：`option()` 作用于**服务端监听 Channel**，`childOption()`/`childHandler()` 作用于 **accept 出来的每条连接**——写反了不报错、只是静默不生效，是新手第一大坑。

---
## 四、ByteBuf vs ByteBuffer

`32` 第八节背过 JDK `ByteBuffer` 的 capacity/position/limit 三指针和 flip 仪式；`ByteBuf` 的设计目标就是让它消失：

| 维度 | JDK ByteBuffer | Netty ByteBuf |
|---|---|---|
| 读写指针 | 单 `position` + `flip()` 切换 | `readerIndex`/`writerIndex` **双指针**，读写互不干扰 |
| 可读长度 | `remaining()`，且依赖当前模式 | `readableBytes()` 永远直白 |
| 扩容 | 不可能（capacity 固定），写满 `BufferOverflowException` | 写操作自动扩到 `maxCapacity` |
| 标记回退 | `mark()/reset()` 只有一层 | `markReaderIndex()/resetReaderIndex()`，读写的 mark 分开 |
| 引用计数 | 无 | 有（`refCnt()`，见第五节） |

```text
ByteBuf:  [ 已读垃圾 | 可读区域 readableBytes | 可写区域 | 垃圾 ]
          0        readerIndex               writerIndex  capacity
          writeXxx 往右推 writerIndex；readXxx 往右推 readerIndex；无需 flip
```

**三类内存形态**：

| 形态 | API | 特点 |
|---|---|---|
| 堆内 | `Unpooled.heapBuffer()` | 数组在 JVM 堆，GC 管；每次系统调用要经 `GetPrimitiveArrayCritical` 临时 pin |
| 堆外（直接内存） | `.directBuffer()` | `malloc` 在堆外，读写少一次 heap↔native 拷贝；不受堆 GC 直接管，但**回收靠 Cleaner，滥用会堆外 OOM** |
| 池化 | `PooledByteBufAllocator` | 上面两种都可以池化分配，对象复用 |

`PooledByteBufAllocator` 借鉴 **jemalloc** 的分层结构：**Arena（按线程数预建的内存池，线程局部复用，避免锁竞争）→ Chunk（默认 16MB 量级的大块，一次向 OS 申请）→ Page（默认 8KB，Chunk 内分配的最小单位）→ 小于 Page 的走 tiny/small 分级池**。池化的收益：① 高频小 Buffer 不反复 `malloc/free` native 内存（这对直接内存尤其贵）；② Buffer 对象本身复用，**JVM 堆里的分配/垃圾数量随之下降**；③ Arena 线程局部化避免全局锁。
> 注意：默认用什么分配器与平台有关——64 位 Linux 等平台上服务端 Channel 默认即**池化直接内存**，但措辞别绝对化（不同版本/平台可能回退堆内或非池化），面试可加一句「可用 `-Dio.netty.allocator.type` 与 `ChannelOption.ALLOCATOR` 显式指定」。

> 注意：**堆外内存不受 `-Xmx` 管**，`-XX:MaxDirectMemorySize` 未显式设置时 HotSpot 默认取一个与最大堆相当的上限。Netty 的池化直接内存在 `refCnt` 归零后靠 `Cleaner` 归还，如果泄漏的是 Buffer 引用（第五节），GC 不回收、`-Xmx` 也看不见，症状是**堆使用率正常、进程 RSS 一路涨到被 OS 或容器 OOMKill**（`37-JVM调优与故障排查.md` 第八节的容器 RSS 案例即此类）。排查抓手：`MaxDirectMemorySize` 显式设小让它抛 `OutOfDirectMemoryError` 而不是静默涨，再配合 `-Dio.netty.leakDetection.level=ADVANCED`。

---
## 五、引用计数与泄漏

池化 Buffer 不能等 GC 回收（native 内存 GC 看不见），所以 `ByteBuf` 用**引用计数**手工管理：`alloc` 时 `refCnt=1`，`retain()` 加一，`release()` 减一，**减到 0 立刻归还内存池**。之后任何人再读它就是 `IllegalReferenceCountException` 或更糟——读到已被复用的脏数据。

**谁负责 release——最容易背反的责任差别**：

| Handler 基类 | 收到 `channelRead(msg)` 后 | 你该做什么 |
|---|---|---|
| `SimpleChannelInboundHandler` | **自动**在 `channelRead0` 返回后释放 msg | 若要把 msg 传出去，必须先 `retain()` |
| `ChannelInboundHandlerAdapter` | **不释放** msg | 用完自己 `ReferenceCountUtil.release(msg)`（或 `msg.release()`） |

```java
// 错误：把 msg 丢给业务线程池，msg 是池化 ByteBuf
public void channelRead(ChannelHandlerContext ctx, Object msg) {
    bizPool.execute(() -> process(msg));            // ✗ 返回后 SimpleChannelInboundHandler
}                                                   //   自动 release → 业务线程用到已回收对象

// 修正：跨线程传递前先 retain，消费者消费完 release
public void channelRead(ChannelHandlerContext ctx, Object msg) {
    msg.retain();                                   // 引用计数 1→2
    bizPool.execute(() -> { try { process(msg); } finally { ReferenceCountUtil.release(msg); } });
}
```

**泄漏检测**：`ResourceLeakDetector` 对**抽样**的 Buffer 挂幽灵对象，GC 时若发现 refCnt>0 却没被 release 就打印 `LEAK: ByteBuf.release() was not called`。四级：`DISABLED` < `SIMPLE`（默认，约 1% 抽样，只报发现泄漏）< `ADVANCED`（记录访问栈）< `PARANOID`（每次访问都跟踪，仅调试用）。调级：`-Dio.netty.leakDetection.level=PARANOID`。
> 注意：默认 SIMPLE 抽样意味着**测试环境把级别调到 ADVANCED 才能稳定抓到泄漏现场**；且日志里 `LEAK` 是「曾经泄漏」的事后追报，不是当下崩溃。

---
## 六、零拷贝的四个层次

先把概念劈开：`32` 第九节的零拷贝是**内核态**的（`sendfile`/DMA，省内核↔用户态的 CPU 拷贝）；**Netty 宣传的零拷贝主要是用户态（JVM 内）的零拷贝**——省的是「Buffer 对象之间互相拷贝字节」这一层。只有 `FileRegion` 一个例外，它内部才真正落到内核 `transferTo`。

| # | 手段 | 省掉了什么 | 发生在哪 |
|---|---|---|---|
| 1 | `CompositeByteBuf` | 把 header+body 拼成「逻辑上」一个 Buffer——它只存成员数组，**不做 memcpy**（对比 `ByteBuffer` 拼接必须先分配大块再逐个 put） | JVM 用户态 |
| 2 | `buf.slice()/duplicate()`、`Unpooled.wrappedBuffer(bytes)` | 子 Buffer 与父 Buffer **共享同一块 memory**，只各自的读写指针独立；包装 `byte[]` 不拷贝 | JVM 用户态 |
| 3 | 直接内存收发 | socket 读写时 OS 直接访问堆外 buffer，省掉「堆内 buffer → 临时 native buffer」的中间复制 | JVM 用户态↔内核边界 |
| 4 | `FileRegion`（包装 `FileChannel.transferTo`） | 传文件时内核内 page cache→socket，即 `32` 篇的 **sendfile** | **内核态**（唯一） |
> 注意：准确说法是「Netty 的零拷贝主要是用户态概念（Composite/slice/wrap），传文件场景通过 `FileRegion` 才用到内核 sendfile」。直接背「Netty 实现了 sendfile 所以零拷贝」会被追问穿。

---
## 七、ChannelPipeline 责任链

Pipeline 是**每条 Channel 一条**的双向链表，head（Unsafe，对接 EventLoop）与 tail 哨兵居中：

```text
 入站（读，fireChannelRead 传播：head → tail）
 head ──→ ByteToMessageDecoder(拆帧) ──→ StringDecoder ──→ 业务Handler ──→ tail
                                                                     未消费到底 = 静默吞掉
 tail ←── StringEncoder ←── LengthFieldPrepender ←── 业务Handler ctx.write ──→ head(→socket)
 出站（写，ctx.write 传播：从当前节点 → head）
```

- **传播起点差别**：`ctx.writeAndFlush()` 从**当前 handler 的下一个**出站 handler 开始；`channel.writeAndFlush()`（即 `ctx.channel().write...`）从 **tail 开始走整条出站链**。想让某个前置出站 handler（如日志、编码）仍被经过，用 `ctx.write` 还是 `channel.write` 结果完全不同。
- **`@Sharable`**：没标 `@ChannelHandler.Sharable` 的 handler 实例不能 `addLast` 到多条 Pipeline（Netty 会抛异常）；标了之后实例被多 Channel 并发访问，**成员变量必须线程安全**（`Atomic*` 或干脆无状态）。
- **`exceptionCaught`** 是入站事件，沿链向 head 传播，最后 tail 默认只打一行 `LoggingHandler` 日志——**不重写它就等于异常静默**，生产必写。

> 注意：**handler 里做同步 DB/RPC 调用或 `Thread.sleep`，会阻塞的正是这条 Channel 所属 EventLoop 的线程——而该线程上还挂着几十上百条其他 Channel（第二节的多对一绑定），它们全部停摆。** 这正是 `32` 篇「业务一慢全停」的具象化。正确做法三种：① 敏感 handler 挂载时指定独立执行组 `pipeline.addLast(bizExecGroup, handler)`，`bizExecGroup` 用 `DefaultEventExecutorGroup`，该节点逻辑被卸载到别的线程执行；② 自己 `ctx.eventLoop()` 之外提交业务线程池（配合第五节 retain/release）；③ 全链路异步（`AsyncHandler`/`CompletableFuture`），Web 侧对应 `26-WebFlux响应式编程.md`。业务线程池参数怎么定见 `35-线程池与线程协作.md`；若阻塞模型换成虚拟线程发起 RPC，见 `10-虚拟线程.md` 的讨论。

---
## 八、编解码与黏包拆包

**根因**：TCP 是**无消息边界的字节流**（`32` 篇反复强调的流式语义），`read` 到的字节数与对端 `write` 的次数没有对应关系——一次 read 可能半个包（拆包/半包），也可能两个包粘一起。UDP 有边界，没这个问题。所以任何 TCP 协议都必须先 **framing（定帧）**，这是解码器的职责；编码器的职责是反向把消息写成字节。

| 方案 | 解码器 | 适用 | 代价 |
|---|---|---|---|
| 固定长度 | `FixedLengthFrameDecoder(n)` | 报文定长的私有协议 | 浪费或不够，几乎不用 |
| 分隔符 | `LineBasedFrameDecoder(max)`（`\n`/`\r\n`）、`DelimiterBasedFrameDecoder(max, 自定义分隔)` | 文本行协议（HTTP 头部、Redis RESP） | 转义问题：内容含分隔符须业务层处理 |
| **长度前缀** | `LengthFieldBasedFrameDecoder`（收）+ `LengthFieldPrepender`（发） | **生产首选**：二进制/自定义协议 | 需协议预留长度字段 |

为什么生产首选长度前缀：不挑内容（无转义问题）、O(1) 判断帧边界、天然充当大小上限防恶意巨帧打爆内存。

`LengthFieldBasedFrameDecoder` 五个构造参数按顺序，配一张标准报文：

```text
 帧结构:  [ 其他头 | 长度字段 L  |   主体 payload   ]
 参数:     maxFrameLength       ← 超限直接抛 TooLongFrameException，兜底防 OOM
           lengthFieldOffset =2 ← 长度字段前跳过 2 字节
           lengthFieldLength =4 ← 长度字段本身占 4 字节
           lengthAdjustment  =0 ← 对长度字段值的修正：长度字段之后还有多少字节 = 字段值 + 本调整值
           initialBytesToStrip=6← 交付给下游前，从帧首剥掉 6 字节（=2+4，只留 payload）

 解码时字节账: 帧总长 = lengthFieldOffset + lengthFieldLength + lengthFieldValue(+lengthAdjustment)；收不够就攒着（半包），收齐才切一帧 fireChannelRead 向下交付
```

典型用法（2 字节头 + 4 字节长度 + body，交付纯 body）：`new LengthFieldBasedFrameDecoder(1024*1024, 2, 4, 0, 6)`，出站侧配对 `new LengthFieldPrepender(4)`（在 body 前写 4 字节长度）。
> 注意：`maxFrameLength` 不是可选装饰，是**必须**的安全阀；对端恶意或 bug 发一个长度字段=2GB 的帧时，它就是最后一道防线。

**半包到底"攒"在哪——`ByteToMessageDecoder` 的 cumulation**：解码器每次收到字节，会把它和上一次的残余合并成一个累积缓冲 `ByteBuf cumulation`，然后在循环里反复调用 `decode()`，**只要 `out` 里.add 了消息就继续解**，直到某次 `decode` 什么也产不出（说明帧没收齐）才返回等下一次 `channelRead`。默认使用 `MERGE_CUMULATOR`（把新字节追加进一个可扩容 buffer），另有 `COMPOSITE_CUMULATOR`（用 `CompositeByteBuf` 拼接省拷贝，但下游 handler 拿到的是组合视图，某些按 `nioBuffer`/`hasNioBuffer` 走快路径的写法会退化）。

```java
// 自定义解码器的正确姿势：够一帧就 readBytes 消费掉并 return；不够就直接 return（不消费）
protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) {
    if (in.readableBytes() < HEADER_LEN) return;      // 半包：原样留着，下次再攒
    in.markReaderIndex();                             // 探测式读取前要 mark
    int len = in.readInt();
    if (in.readableBytes() < len) { in.resetReaderIndex(); return; }  // 记得回退
    out.add(in.readBytes(len));                       // 放进 out = 交付一帧
}
```

> 注意：两个高频错法——① 在 `decode` 里对 `in` 读了又不 `resetReaderIndex`，半包时把「半个头」当成已消费，协议永久错位；② 把 `in`（或 `in.slice()` 的结果）存进成员变量/交给别的线程，函数返回后这块 buffer 归下游所有并被 release，你手里就是已回收对象（第五节）。要留就 `retain()` 或 `copy()`。

---
## 九、心跳与断线重连

TCP 层 `SO_KEEPALIVE`（第三节配过）周期约两小时且探测不到「应用假死」，所以应用层心跳是标配。Netty 把「多久没流量」做成事件：

```java
pipeline.addLast(new IdleStateHandler(60, 75, 0, TimeUnit.SECONDS));
//                     ↑读空闲     ↑写空闲    ↑读写空闲 —— 参数顺序是 读/写/读写，别写反
pipeline.addLast(new SimpleChannelInboundHandler<String>() {
    @Override public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        if (evt instanceof IdleStateEvent e) {                   // 空闲到时 Netty 发此用户事件
            if (e.state() == IdleState.WRITER_IDLE) ctx.writeAndFlush(HEARTBEAT_MSG);  // 客户端：到点发心跳
            else if (e.state() == IdleState.READER_IDLE) ctx.close();                  // 服务端：读超时判死对端
        } else super.userEventTriggered(ctx, evt);               // 其余用户事件别吞
    }
    @Override public void channelInactive(ChannelHandlerContext ctx) { scheduleReconnect(ctx.channel()); }
});
```

三种空闲语义：READER_IDLE=60s 内没读到任何字节；WRITER_IDLE=75s 内没写出任何字节；ALL_IDLE=读写都没有。**心跳包本身会重置读空闲计时**，所以「对端死了」才会触发读空闲。

**断线重连（客户端）**：`channelInactive` 里用**本 Channel 所属的 EventLoop** 延迟调度重连，配指数退避（防恢复瞬间惊群、防重试风暴）：

```java
private int attempts = 0;
private void scheduleReconnect(Channel ch) {
    long delay = Math.min(30, 1L << Math.min(attempts++, 5));            // 1,2,4,8,16,30 秒封顶
    ch.eventLoop().schedule(() -> bootstrap.connect(remote).addListener((ChannelFuture f) -> {
        if (!f.isSuccess()) scheduleReconnect(f.channel());              // 失败则加大退避再来
    }), delay, TimeUnit.SECONDS);
}
```

> 注意：重连调度**必须回到本 Channel 的 EventLoop（`ctx.channel().eventLoop().schedule(...)`）或复用一个既有的 EventLoopGroup**——`new Thread().sleep()` 后再 connect、或每次重连新建一个 Group，都是给自己造野线程/野 Selector，连接一多就是线程泄漏事故。EventLoop 本身就实现了 `ScheduledExecutorService`，现成的定时器不用白不用。

---
## 十、写回压（Backpressure）

`ctx.writeAndFlush()` 是异步的：数据先入 Channel 的**Socket 发送缓冲对应的出站队列**，写不写得动取决于对端收得多快。对端是慢消费者（网络差、它自己 EventLoop 被阻塞）时，TCP 窗口收缩 → 内核发送缓冲排空不动 → Netty 出站队列**无上限堆积** → 堆（或堆外）OOM，且 OOM 现场离案发现场（那个 write 循环）很远。

正确姿势是「看水位写」：

```java
b.childOption(ChannelOption.WRITE_BUFFER_WATER_MARK,
              new WriteBufferWaterMark(32 * 1024, 64 * 1024));   // low=32KB, high=64KB
if (channel.isWritable()) channel.writeAndFlush(nextChunk());    // 水位以下：正常推
else pendingQueue.put(nextChunk());   // 队列超 high → isWritable 翻 false，自己缓存/降速/拒绝

@Override public void channelWritabilityChanged(ChannelHandlerContext ctx) {
    if (ctx.channel().isWritable()) drainPendingQueue(ctx);      // 回落到 low 以下时恢复推送
    ctx.fireChannelWritabilityChanged();                         // 继续沿链传播，别吞
}
```

机理：`isWritable()` 超 high 水位翻 false 并触发 `channelWritabilityChanged`，回落到 low 以下翻回 true。生产者循环**必须检查 `isWritable` 并响应翻转事件**，而不是无脑 write。这与 `26` 篇 Reactor 背压、`27` 篇 Kafka 拉模式是同一思想在不同层的体现：**下游消化不动时，上游必须能感知并减速**。

**`write()` 与 `writeAndFlush()` 的分工就是这里最容易浪费的性能**：`write*` 只把数据压进 Channel 的出站队列，`flush` 才真正触发 `socket.write` 系统调用。所以：

```java
for (Chunk c : chunks) ch.write(c);   // 连续 write：只入队，0 次系统调用
ch.flush();                           // 最后一次 flush：一次系统调用推完
// 循环里每次都 writeAndFlush → N 次 syscall，吞吐可能直接腰斩
```

代价是队列堆积（回到水位问题）。Netty 内部也做了两件事防饿死：单轮 flush 里 socket 写不完时按 `ChannelOption.WRITE_SPIN_COUNT`（默认 16 量级）重试若干次，超过就注册 `OP_WRITE` 等内核通知，**而不是在 EventLoop 里死循环写**；同时把剩余数据留在出站队列（这正是水位要管的对象）。

> 注意：批量 `write` + 一次 `flush` 适合服务端主动推送；请求-响应式的 RPC 通常在 `channelRead0` 里 `writeAndFlush` 一次即可（本来就要立刻回）。别为了"优化"把响应也攒起来——那会直接加延迟。

---
## 十一、生产落地：传输层、读分配与协议栈

**1）Linux 上换 native transport（`EpollEventLoopGroup`）**——生产服务端几乎都该这么做，代价只是多一个平台相关依赖：

```java
EventLoopGroup boss  = new EpollEventLoopGroup(1);
EventLoopGroup worker = new EpollEventLoopGroup();
b.channel(EpollServerSocketChannel.class)     // 对应 NioServerSocketChannel
 .childOption(EpollChannelOption.SO_REUSEPORT, true)   // NIO 传输拿不到的内核能力
```

| | NIO 传输 | Epoll 原生传输 |
|---|---|---|
| 底层 | JDK `Selector`（`epoll_select` JNI） | 直接 `epoll` + `eventfd` |
| 空轮询自愈 | 需要（`32` 第八节那个 bug） | 不需要，压根不用 `Selector.wakeup()` |
| 额外能力 | — | `SO_REUSEPORT`（多进程/多线程同端口分摊 accept）、Unix 域套接字、OOB read、`EPOLLET` 边沿触发 |
| 可移植性 | 全平台 | 仅 Linux（另有 `kqueue`/BSD，Windows 无） |

> 注意：`SO_REUSEPORT` 配 `bossGroup` 多线程同端口监听才是它正确的用法（内核帮你在多个 accept 线程间分流）；把它当 `SO_REUSEADDR`（第二、三节那个"重启抢 TIME_WAIT 端口"）用是常见误解，两者解决的是完全不同的问题（TCP 层语义见 `../12-network/README.md`）。

**2）一次到底读多少：`RecvByteBufAllocator`**。Netty 不预先分配"最大报文"，而是**根据上一次实际读到多少来动态估算下一次的接收 buffer 大小**，默认 `AdaptiveRecvByteBufAllocator` 沿一条容量阶梯（十几字节起、逐级翻倍到 1MB 量级）升降。收益：连接安静时不占大块内存，突发时自动升档。

```java
b.childOption(ChannelOption.RCVBUF_ALLOCATOR, new AdaptiveRecvByteBufAllocator(64, 1024, 65536));
// 固定大小场景（协议帧长稳定）：new FixedRecvByteBufAllocator(8192)
```

> 注意：`RCVBUF_ALLOCATOR` 管的是**应用侧一次 recv 给内核多大的容器**，`SO_RCVBUF` 管的是**内核 socket 接收缓冲**，两者不是一回事；后者是 OS 层参数（`../12-network/README.md` 的滑动窗口）。

**3）协议别自己造轮子**：Netty 自带常用协议编解码器，面试常考的 HTTP 就是一条 pipeline：

```java
ch.pipeline()
  .addLast(new HttpServerCodec())                        // 请求/响应编解码（HTTP 1.x）
  .addLast(new HttpObjectAggregator(64 * 1024))          // 把聚合的 HttpResponse head + 多个 HttpContent 合成一个 FullHttpRequest
  .addLast(new ChunkedWriteHandler())                    // 可选：配 HttpChunkedInput 分块写大响应
  .addLast(bizHandler);
```

`HttpObjectAggregator(maxContentLength)` 的入参就是**内存安全阀**——不设或设太大，一个大 body 直接把该 EventLoop 上所有连接拖死（第七节的阻塞放大 + 第十节的水位）。同族还有 `WebSocketServerProtocolHandler`、`ProtobufVarint32FrameDecoder`（第八节长度前缀的 protobuf 版）、`SslHandler`（TLS 握手也是一个 handler，`32` 篇说的"TLS 必须包在 framing 之前"就是它）。

**4）几个值得知道的内部机制**：

| 机制 | 说明 | 为什么值得记 |
|---|---|---|
| `FastThreadLocal` | Netty 自实现的 ThreadLocal，配合 `FastThreadLocalThread`（EventLoop 线程就是这种）用数组替代哈希探测 | 比 JDK `ThreadLocal` 快，但**只在 Netty 线程上有优势**；业务线程池里退回普通实现。与 `35-线程池与线程协作.md` 的 ThreadLocal 泄漏路径对照 |
| `SingleThreadEventExecutor` 任务队列 | `execute()`/`schedule()` 投来的任务与 IO 事件在同一线程按轮次交替执行 | 解释了「为什么 `ChannelFuture` 回调不保证立刻执行」「为什么 IO 会等一个长任务」 |
| IO 与定时任务的配额 | 每轮先处理 IO 再跑定时/普通任务，普通任务默认有配额上限，防止队列饥饿 IO | `schedule` 密集使用时的隐性延迟来源 |
| `shutdownGracefully(quietPeriod, timeout, unit)` | 平滑关闭：拒新任务 → 静默期确认无新任务 → 跑完存量 | 配合 `../15-kubernetes/README.md` 的 `preStop` + SIGTERM，才是"零丢包下线"（详见 `29-Kubernetes部署.md`） |

---
## 十二、常见坑与速答

| 问题 | 速答 |
|---|---|
| worker 默认几个线程？ | CPU 核数 × 2（可由系统属性 `io.netty.eventLoopThreads` 覆盖；部分版本会向上取整到 2 的幂，以实际版本为准）；boss 常用 1 |
| 连上了但完全没反应？ | 十有八九忘了 `childHandler(...)`——连接注册了但 Pipeline 是空的，读到的字节被静默丢弃 |
| 能一直用 `Unpooled.buffer()` 吗？ | 不能，`Unpooled` 是**非池化**，高频路径下等于放弃第四节整套池化收益；写 demo 可以，生产从 `ctx.alloc()` / `ChannelHandlerContext` 拿分配器 |
| `close()` vs `shutdownGracefully()`？ | 前者对单条 Channel；后者关整个 Group：先停止接收新任务、跑完存量（quietPeriod 内无新任务才真关），返回 Future，**必须 `await()`/`sync()`** 否则资源没释放就退出 |
| 「Channel 可以跨线程 write」和「EventLoop 不能被阻塞」矛盾吗？ | 不矛盾：跨线程 `write` 只是把任务**塞进该 Channel 所属 EventLoop 的队列**（线程安全靠投递而非加锁），真正执行 IO 的仍是那一个 EventLoop 线程；正因为 IO 全挤在这一个线程，它才不能被阻塞 |
| `ChannelFuture.await()` 能在 handler 里调吗？ | 不能——await 的正是当前 EventLoop 线程，自己等自己 = 死锁，Netty 直接抛 `BlockingOperationException`；用 `addListener`。经验值一个 EventLoop 扛几百到几千条活跃连接没问题，瓶颈通常在业务是否阻塞 |

---
## 与系列其他文档的关系

- `32-IO与NIO.md`：**先修**。本篇的 EventLoop = 它对 Selector 的封装，主从 Reactor 对照表在第二节；epoll 空轮询 bug、Buffer 三指针、内核 sendfile 零拷贝都在那边定义。
- `26-WebFlux响应式编程.md`：WebFlux 默认跑在 **Reactor Netty** 上，第十节写回压与它的 Flux 背压是同一问题在网络层/流层的两张脸。
- `24-消息队列与微服务.md`、`27-Kafka流式处理.md`：RocketMQ 通信层基于 Netty；Kafka 是「高性能也不用 Netty」的自研反例，两者对照着记。
- `34-并发底层原理JMM与锁.md`、`35-线程池与线程协作.md`：第二节「Channel 绑 EventLoop 故无锁」用并发原理解释为什么成立；第七节阻塞卸载的业务线程池参数在 35。
- `10-虚拟线程.md`：handler 里同步阻塞的老问题，虚拟线程提供另一条出路（对照 `32` 篇结尾的降级论断）。
- `../12-network/README.md`：TCP 三次握手、滑动窗口、epoll 的 OS 层原理在总纲；本篇只讲这些机制在 Netty API 上的投影（`SO_BACKLOG`≈全连接队列、`isWritable`≈发送缓冲水位）。
