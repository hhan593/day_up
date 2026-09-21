# 26 - Spring WebFlux 与响应式编程

> 来源：Spring Framework Reference — «Web on Reactive Stack»（WebFlux 注解式控制器 / 函数式端点 / 编解码器 / `WebClient`）；Project Reactor Reference Documentation —「Reactive Streams (TM) and backpressure」「Which operator for what」「Packaging and blocking」「Context propagation」「StepVerifier」各章；Reactive Streams 规范四接口与订阅规则
> 官方：Spring Framework Reference — Web Reactive 章、Project Reactor Reference Documentation、Reactive Streams Specifications（reactive-streams.org）
> 补充：`flatMap` 默认并发度、`Schedulers` 各实现默认上限、双 starter 共存时 `WebApplicationType` 推导顺序，来自 Reactor / Spring Boot 公开源码常量与业界事故复盘；个别默认值随版本微调，正文一律用「默认/量级/以所用版本为准」措辞。
> 关联：Go `16-grpc-microservices.md`、Rust `18-async-await.md`

主线不是"WebFlux 怎么写接口"，而是**一条契约如何贯通全程**：`request(n)` 定义背压、cold 语义决定 `retry` 会重放副作用、`Context` 反向写入决定 traceId 会不会丢、`NonBlocking` 标记决定 `block()` 为什么原地抛异常。把这四条因果讲清楚，API 只是投影。边界：事件循环与写回压的 OS 机制见 `42-Netty.md`（第七、十节），Servlet 栈请求流程见 `38`，虚拟线程这条替代路线见 `10`。

---
## 一、为什么要 WebFlux：两种吞吐模型
- 传统 Spring MVC 是**线程池模型**：每请求一线程，阻塞 I/O 时线程干等（Tomcat 工作线程数量级 200，见 `38`），并发上限 ≈ 线程数。
- WebFlux 基于 **Reactor**（Project Reactor），非阻塞、事件循环（底层默认 Reactor Netty，即 `42` 那套 `EventLoop`），少量线程扛高并发。适合三类：**高并发 I/O 密集、流式、需要真背压**——纯 CRUD + JDBC 不在这三类里。
```
MVC（thread-per-request）                     WebFlux（event-loop + 非阻塞链）
线程1 ═ 读请求 → 查DB(干等20ms) → 写响应        EL-1 ─┬─ 请求A: 发DB请求 ┄让出┄ 结果到→写响应
线程2 ═ 同上，等待期间线程 100% 空转            EL-1  ├─ 请求B: 发HTTP请求 ┄让出┄ 结果到→写响应
线程3 ═ 并发≈线程数，1万连接=1万线程             EL-2 ─┴─ …  核数级线程 + 在途请求表，并发≈连接数
```
代价写在最后一列：**"等待"从线程栈搬进了回调/操作符链**，于是执行时序不再等于代码书写顺序——本篇后半所有坑都从这一句长出来。

---
## 二、Reactive Streams：四个接口与一条订阅契约
Reactive Streams 只是一份**极小的接口规范**，Reactor 是其实现之一（另有 RxJava、Akka、Mutiny）。

| 接口 | 关键方法 | 职责 |
|---|---|---|
| `Publisher<T>` | `subscribe(Subscriber)` | 数据源，**只在被订阅时开始工作** |
| `Subscriber<T>` | `onSubscribe`/`onNext`/`onError`/`onComplete` | 消费者，一个订阅一套回调 |
| `Subscription` | `request(long n)`/`cancel()` | **需求通道**：下游告诉上游"我能再吃 n 个" |
| `Processor<T,R>` | = `Subscriber` + `Publisher` | 中间变换环节（Reactor 里已由 `Sinks` 取代，见第四节） |
```
Subscriber                                      Publisher
    │ subscribe() → onSubscribe(subscription)   │ ① 每个订阅恰好一次，onSubscribe 必须先于任何 onNext
    │ request(3) ─────────────────────────────> │ ② n 必须 > 0；request(MAX_VALUE)=放弃额度约束
    │ <─── onNext ×k（k ≤ 3）────────────────── │ ③ 已发出的 n 就是配额，上游多发即违规
    │ request(n) 续额度 / cancel()               │ ④ 配额可续期；cancel 由下游随时发起
    │ <─── onComplete() 或 onError(Throwable) ── │ ⑤ 终态二选一、至多一次，此后不得再发任何信号
```
> 注意：**背压的技术定义就是 `request(n)` 这个需求信号**——下游按自身处理能力定量授权，上游据此节流。"限流""队列变短"都只是它的表现；把背压答成"防止下游被打爆的限流"等于没答。两条**没有 `request(n)` 通道**的路都不是背压：阻塞（线程停在原地的天然反压）与缓冲/丢弃策略（第八节，在已断裂的契约上补救）。

---
## 三、懒执行：不订阅，什么都不发生
```java
Mono<String> one = Mono.just("a");          // 0..1 元素
Flux<Integer> many = Flux.range(1, 10);     // 0..N 元素
many.map(i -> i * 2).filter(i -> i > 5).subscribe(System.out::println);  // ← 只有这行让上面全部生效
```
`map`/`filter` 只是在**组装一张描述表**（谁接谁），不触发任何计算。最直观的证据：
```java
Flux<Integer> p = Flux.just(1, 2).doOnNext(i -> log.info("处理 {}", i));  // 到这里一条日志都没有
p.subscribe();   // 处理 1 / 处理 2
p.subscribe();   // 处理 1 / 处理 2   ← 又跑了一遍
```
"构建 = 执行一次"是最高频误解，两个推论：① 每次 `subscribe` 都**从源头重跑整条链**（上例两次订阅 = 发了两次请求）；② 只想跑一次就得 `cache()` 或只订阅一次。**第九节 `retry` 重放副作用正是这条 cold 语义的直接后果。**

`Mono` 常被类比成 `CompletableFuture`，形似神不似：

| | `CompletableFuture<T>` | `Mono<T>` |
|---|---|---|
| 冷/热 | **热**：提交即跑，不关心有没有人听 | **冷**：不订阅不跑（`Sinks` 造的例外，第四节） |
| 是否自动执行 | 是，构造即执行 | 否，`subscribe`（或框架订阅）才执行 |
| 跑在哪条线程 | 自带执行器（默认 `ForkJoinPool.commonPool`） | **不含任何调度器**，同线程直跑；换线程必须显式 `subscribeOn/publishOn` |
| 信号 | 单个结果或异常、一次性 | 0..1 / 0..N（`Flux`），带 `request(n)` 背压 |
| 组合子规模 | 十余个 | 数百量级（错误、重试、背压、调度、上下文） |
| 取消 | `cancel` 不影响已在跑的任务 | `Subscription.cancel()` 沿链上传播，上游可释放资源 |
> 注意：把返回 `Mono` 的方法当"更花哨的 Future"，就会写出 `service.doAsync()` 却从不返回也从不订阅——它一行都不执行。

---
## 四、冷流与热流：什么时候必须转热

| 来源 | 冷/热 | 说明 |
|---|---|---|
| `just`/`range`/`defer`/`fromIterable`、`WebClient` | 冷 | 每个订阅者一条独立新流；`defer` 每次重新求值 |
| `Flux.generate` | 冷 | 同步逐个生成，严格按下游 `request(n)` 供货 |
| `Flux.create` | 冷（形式），配额要自己补 | 桥接回调式非响应源（MQ listener、UI 事件）；生产者通常**不看** `sink.requestedFromDownstream()`，契约在边界上断掉 |
| `Sinks.many().multicast().onBackpressureBuffer()` / `.replay()` | **热** | 一生产多消费；`replay(n)` 给晚到者补历史（旧 `*Processor` 已废弃，用 `Sinks`） |
| `.cache()` | 转热 | 首个订阅触发，之后重放全部元素——**无上限缓存 = 堆上定时炸弹** |
| `ConnectableFlux`：`publish()`/`replay(n)` + `refCount()`/`autoConnect(n)`/`share()` | 转热 | 显式控制"几个订阅者到场才开始取上游" |

必须转热的判据只有一条：**上游是共享资源或只有一个真实来源，却被多个下游消费**——WebSocket 广播、行情推送、SSE 群发、单 Kafka consumer 分发给多业务流；每个下游各起一条 cold 链 = 建 N 个连接、消费 N 遍。反之"每请求独立查一次 DB"必须保持 cold，转热等于把别人的数据返回给你。

---
## 五、操作符按用途归类，以及 `flatMap` 的并发度

| 类别 | 常用操作符 | 选型要点 |
|---|---|---|
| 创建 | `just`/`fromIterable`/`defer`/`generate`/`create` | "订阅时才算值"必须 `defer`，否则参数被组装期固化 |
| 转换 | `map`/`handle`/`flatMap`/`flatMapSequential`/`concatMap`/`flatMapIterable` | 一对一 `map`；一对多 `flatMap` 家族；顺序敏感 `concatMap` |
| 聚合 | `reduce`/`collectList`/`collect`/`count`/`scan` | `collectList` 把全量装进内存，大流上等价于 OOM |
| 组合 | `zipWith`/`merge`/`concat`/`mergeSequential` | `merge` 交错、`concat` 严格先后、`mergeSequential` 并发执行但按源序输出 |
| 过滤 | `filter`/`take`/`skip`/`distinct`/`takeUntil` | `distinct` 的去重集合无上限，长流慎用 |
| 错误 | `onErrorReturn`/`onErrorResume`/`onErrorMap`/`retry`/`retryWhen` | 第九节专讲 |
| 副作用与基础设施 | `doOnNext`/`doOnEach`/`doFinally`/`contextWrite`/`delayElements`/`delaySequence`/`timeout` | 所有 `doOnXxx` **只能观察、不能改流** |

**`map` vs `flatMap` 一句话说透**：`map` 是同步一对一换算（元素进、元素出，不引入异步）；`flatMap` 是"把每个元素换成一个**新的 `Publisher`**、订阅它、把内部元素合并回主链"——于一对多扇出、并发、异步等待全只发生在 `flatMap` 里。它是响应式版的 `await`，也是唯一需要关心并发度的常规操作符。这套操作符心智与 JS/RxJS、Rust `futures` 的 `Stream`（`map`/`and_then`/`zip`）几乎一一对应，跨语言迁移基本只是换名字。
> 注意：`Flux.flatMap(fn)` 的**默认并发度是 256 量级**（源码取 `Queues.SMALL_BUFFER_SIZE` 常量，可由系统属性覆盖，数值以所用 Reactor 版本为准），含义是同一时刻允许 256 个内部 Publisher 在途。经典事故：把 `list.forEach(id -> client.get(id))` 翻成 `flux.flatMap(id -> webClient...)` 处理 5 万个 id，瞬间变成 256 并发且"完成一个立刻补一个"，把下游打挂；DB 场景则抢爆 10 个连接、报 `pendingAcquireTimeout`。正解是显式传并发度：`flux.flatMap(item -> callDownstream(item), 20)`（必写，别信默认值）；要并发但乱序输出用 `flatMapSequential(fn, 16)`，要严格串行用 `concatMap(fn)`（等价 `flatMap(fn, 1)`）。

---
## 六、线程调度：`subscribeOn` 与 `publishOn`
方向是这一节的全部考点：
```
   subscribeOn(parallel())  ← 订阅动作 + 它【上游】跑在 parallel
        │
Flux.range(1,100) ─ map(A) ─ publishOn(boundedElastic) ─ map(B) ─ map(C) ─ subscribe()
                                      │
                                      └─ 从这一点起【下游】B、C 全部切到 boundedElastic
记忆：publishOn 往下推（影响下游），subscribeOn 往上拽（影响上游，直到订阅动作）。
```
两条易忽略的规则：① **各只作用第一次**——链上多个 `subscribeOn` 只有最靠近上游那次生效，而多个 `publishOn` 逐个生效（后面的能再切回去）；② 调度器不改变"订阅才执行"，只决定执行落在哪条线程。

| `Schedulers` | 默认规模 | 用途 |
|---|---|---|
| `parallel()` | CPU 核数量级、固定 | **CPU 密集**：压缩、聚合、序列化。队列短，塞阻塞任务会拖垮所有流 |
| `boundedElastic()` | 线程上限约 10×CPU 核数、排队任务 10 万量级（Reactor 3.4 起的思路，数值以版本为准） | **把阻塞调用挪出去的唯一正道**：JDBC、老 SDK、文件 IO；线程按组复用且有上限 |
| `single()` / `immediate()` | 1 条 / 0（不新建） | 少量串行任务、就地当前线程执行（测试常用） |
| `fromExecutor(ExecutorService)` | 你说了算 | 接业务自建池（`35`）统一监控限流；注意 Reactor 不负责关闭它 |

---
## 七、阻塞红线：EventLoop 上 `block()` 为什么原地炸
```java
@GetMapping("/bad")
public Mono<User> bad(@PathVariable Long id) {
    return Mono.just(repo.findById(id).block());   // ✗ IllegalStateException: block()/blockFirst()/blockLast() are
}                                                 //   blocking, which is not supported in thread reactor-http-nio-3
```
Reactor Netty 的 EventLoop 线程实现了 `NonBlocking` 标记接口，`block()` 入口先做 `Schedulers.isInNonBlockingThread()` 检测，命中即抛 `IllegalStateException`。这是**保护性设计**：一个 EventLoop 承载成百上千条连接，被卡住 200ms 这批准请求全部超时——`42` 第七节"handler 里不许阻塞"是同一条物理定律的另一层表述。
```java
return repo.findMono(id)                                        // ✓ 整链异步（首选）
        .flatMap(u -> webClient.get().uri("/o/" + u.id()).retrieve().bodyToMono(Order.class));
return Mono.fromCallable(() -> jdbcRepo.findById(id))            // ✓ 只有阻塞版本：显式卸载（收益见第十五节）
           .subscribeOn(Schedulers.boundedElastic())
           .timeout(Duration.ofSeconds(2));
// ✓ 测试 / main / 批处理：这些线程不带 NonBlocking 标记，block() 合法（别在 WebFlux handler 里用）
```
> 注意：`block()` 不是坏 API，而是"只许在非 `NonBlocking` 线程用的 API"。真正防不住的是第三方库里的**隐性阻塞**（同步落盘日志、DNS、`synchronized` 里等锁），集成测试里装一次 **BlockHound**（`reactor.tools`）探针即可首次阻塞就打印完整链路栈。

---
## 八、背压策略：契约断裂之后怎么补
真实项目里背压链常在源头就断了（`Flux.create`、外部推送），此时只能靠补救策略决定"上游比下游快"时丢什么：

| 操作符 | 语义 | 什么时候用 |
|---|---|---|
| `onBackpressureBuffer()` | 无界排队，暂时都保住 | **默认无界 = 堆爆路线**。必须 `onBackpressureBuffer(10_000, dropped -> log.warn(...), BufferOverflowStrategy.DROP_OLDEST)` |
| `onBackpressureDrop()` | 丢**新到**元素 | 配丢弃回调计入指标；行情/度量这类丢一帧无所谓的流 |
| `onBackpressureLatest()` | 只保最新，旧的被覆盖 | UI/SSE 状态推送、"只要当前值"的广播 |
| `onBackpressureError()` | 立刻 `OverflowException` 终止 | 宁可 500 也不能错数据（与 `retryWhen` 搭配要极谨慎） |

**`limitRate(n)` 与背压的区别**：它不是策略，而是**把一次性 `request(MAX)` 拆成分批配额**（消耗过半再续），**不丢任何数据**，只把上游缓冲压小。`limitRate` = 让 `request(n)` 更保守；`onBackpressureXxx` = 上游根本不守 `request(n)` 时的兜底。SSE/长连接这类慢消费者实践：`onBackpressureBuffer(200, DROP_OLDEST)`（补历史但不涨内存）或 `onBackpressureLatest()`（只推最新），配心跳防中间层空闲断连（第十一节）。

对照其他语言：Go 的 buffered channel、Rust `tokio::mpsc::channel(n)` 是**用固定容量队列近似背压**——队列满时发送方自然挂起，属阻塞式天然反压；Reactive Streams 把容量协商写进 API，所以能在"没有线程可挂"的事件循环模型里做到同一件事。

---
## 九、错误处理与重试：`retry` 会重放整条链
```java
mono.onErrorReturn(NotFoundException.class, User.EMPTY)                            // 指定异常类型 → 兜底值
    .onErrorResume(TimeoutException.class, e -> fallbackCall())                     // 换一条链继续（≈ catch 里再调一次）
    .onErrorMap(IoException.class, e -> new BizException("库存服务不可用", e))      // 包装，不外泄底层异常
    .doOnError(e -> metric.increment("inventory.fail"))                          // 只观察
    .retryWhen(Retry.backoff(3, Duration.ofMillis(200))
            .maxBackoff(Duration.ofSeconds(2)).jitter(0.5)                        // 抖动，打散重试风暴
            .filter(e -> e instanceof IOException)                                // 只重试可恢复异常
            .doBeforeRetry(s -> log.warn("retry #{}", s.totalRetries() + 1)));
```
1. **`doOnError` 只能观察、不能吞**：`doOnXxx` 没有"返回值改变流"的语义；改流必须用 `onErrorReturn`/`onErrorResume`/`onErrorMap`。要从"错误后收尾再切另一条流"用 `mono.onErrorResume(e -> Mono.empty()).thenMany(fallbackFlux)`（`thenMany` 是 Mono→Flux 的桥）。
2. **`retry` = 从头把整条 cold 链再订阅一遍**（第三节语义的直接后果）：链上的 `doOnNext` 日志、`flatMap` 里的 POST 扣款、消息发送、计数器自增**全部重放**。所以 `retry`/`retryWhen` 只能压在**幂等**片段之下；非幂等写之后的失败要靠业务补偿，不是 `retry`。
3. `retry(n)` vs `retryWhen(Retry...)`：生产几乎总用后者，因为要**退避 + 抖动 + 按异常过滤 + 次数告警**四件套；只有纯本地偶发失败才允许裸 `retry(2)`。另：`.timeout(...)` 放在 `retry` 上游还是下游，决定超时后是整链重跑还是仅重跑远程调用——顺序即语义。

---
## 十、WebFlux 编程模型：注解式与函数式
```java
@RestController
public class UserController {
    private final UserRepository repo;                                 // ReactiveCrudRepository
    @GetMapping("/users/{id}") public Mono<User> get(@PathVariable Long id) { return repo.findById(id); }
    @GetMapping("/users")      public Flux<User> all()  { return repo.findAll(); }   // 边到边编码，不排完不返回
    @PostMapping("/users")
    public Mono<User> create(@RequestBody Mono<User> body) { return body.flatMap(repo::save); }
}
```
- 返回 `Mono`/`Flux`，WebFlux 自动编解码并**流式写出**（元素到一帧编一帧）；`flatMap` 承担异步串联，位置相当于 `async/await` 的 `await`。
- `@RequestBody User` 也合法，但更推荐 `@RequestBody Mono<User>`/`Flux<T>`：**body 读取本身就是异步的**，声明成 `Mono` 才如实表达"字节尚未到达"，也便于解析后立刻接 `timeout`/`map` 改写。（Servlet 栈的 `HttpMessageConverter` 在这里换成 `HttpMessageReader/Writer` + `DataBuffer`，对照 `38` 第五节。）

函数式 `RouterFunction`/`HandlerFunction` 是同一内核的另一层 API（Spring Cloud Gateway 用的正是它）：
```java
@Component public class UserRoutes {
    private final UserService svc;
    @Bean RouterFunction<ServerResponse> userRoutes() {   // RequestPredicates 静态导入：GET/POST/accept
        return route(GET("/users/{id}"), this::getOne)
                .andRoute(POST("/users", accept(MediaType.APPLICATION_JSON)), this::create);
    }
    // HandlerFunction = Function<ServerRequest, Mono<ServerResponse>>：入参请求，出参仍是 Mono
    private Mono<ServerResponse> getOne(ServerRequest req) {
        return ServerResponse.ok().contentType(MediaType.APPLICATION_JSON)
                .body(svc.get(Long.valueOf(req.pathVariable("id"))), User.class);
    }
    private Mono<ServerResponse> create(ServerRequest req) {
        return req.bodyToMono(User.class)                        // 等价：req.body(BodyExtractors.toMono(User.class))
                .flatMap(svc::create)
                .flatMap(u -> ServerResponse.created(URI.create("/users/" + u.id())).bodyValue(u));
    }
}
```
穿透全链的句柄是 **`ServerWebExchange`**（Servlet 里 request+response 的合体）：`req.exchange()` 取到它，再 `getRequest().getHeaders()`、`getFormData()`、`attributes()`——`WebFilter` 与 handler 之间传值只能走 `attributes()`，不能走 `ThreadLocal`（第十四节）。

---
## 十一、流式响应三种：JSON 数组 / SSE / 原始分块

| 形态 | 声明 | 何时用 | 关键点 |
|---|---|---|---|
| JSON 数组流 | `APPLICATION_JSON` + `Flux<User>` | 列表接口想提前吐首屏 | 客户端仍看到完整数组，只有服务端提前编码，**不能当增量协议** |
| SSE | `TEXT_EVENT_STREAM` + `Flux<ServerSentEvent<T>>` | 浏览器推送、进度、行情 | 帧边界天然、自带 `id/event/retry`；要发心跳防空闲断连 |
| NDJSON / 二进制分块 | `Flux<DataBuffer>`（`x-ndjson`、octet-stream） | 大文件、导出、自定义协议 | 完全自控字节，配 `limitRate` 才不涨内存 |
```java
@GetMapping(path = "/ticks", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> ticks() {
    Flux<ServerSentEvent<String>> data = marketFeed()
            .map(t -> ServerSentEvent.builder(t.symbol()).event("tick").data(t.json()).build());
    Flux<ServerSentEvent<String>> hb = Flux.interval(Duration.ofSeconds(15))
            .map(i -> ServerSentEvent.<String>builder().comment("hb").build()); // 注释帧，浏览器忽略
    return Flux.merge(data, hb).onBackpressureLatest();                          // 慢订阅者只留最新一帧
}
```
大 CSV 导出：不 `collectList`、不拼大 `String`，把每块编码成 `DataBuffer` 交给写出侧——框架最终走的就是 `ServerHttpResponse.writeWith(Publisher<DataBuffer>)`，它按下游（TCP 发送缓冲水位，即 `42` 第十节的 `isWritable`）的额度回头向你的 `Flux` 要下一块。**这就是导出千万行不 OOM 的全部原理**：内存里任何时刻只有配额内那几块。
```java
@GetMapping("/orders.csv")
public Mono<ServerResponse> exportOrders(OrderRepo repo) {
    Flux<DataBuffer> head = Flux.just(buf("id,amount,created_at\n"));
    Flux<DataBuffer> body = repo.findOrdersAsBuffers(500)      // 游标分页，返回 Flux<DataBuffer>：一次一页
            .limitRate(2).publishOn(Schedulers.boundedElastic());  // 只多预取 2 页；编码离开 EventLoop
    return ServerResponse.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.csv")
            .body(BodyInserters.fromDataBuffers(Flux.concat(head, body)));
}
private static DataBuffer buf(String s) {   // wrap 不复制；池化 buffer 用完要 DataBufferUtils.release
    return DefaultDataBufferFactory.sharedInstance.wrap(s.getBytes(StandardCharsets.UTF_8));
}
```
> 注意：客户端断开（关掉下载页）时 `writeWith` 会向上游 `cancel()`；若取数链裹着不可取消的阻塞 JDBC 查询，它会一路跑完才退出——导出类接口必须带超时/`takeUntilOther`，并在 `doFinally` 里清游标。

---
## 十二、横切层与共存：`WebFilter`，以及"两个 starter 都在"
**WebFlux 里没有 `HandlerInterceptor`**——那是 Servlet/`DispatcherServlet` 栈的东西，对应物是 `WebFilter`（`filter(ServerWebExchange, WebFilterChain) → Mono<Void>`）。与 `38` 第九节那张选型表对照：

| Servlet 栈（`38`） | WebFlux 对应物 | 说明 |
|---|---|---|
| `Filter`（容器层，改原始报文） | `WebFilter` | 唯一"最早进/最晚出"的挂点；用 `Mono` 组合代替 `chain.doFilter` 前后写代码 |
| `HandlerInterceptor.preHandle/postHandle/afterCompletion` | **无直接对应**：`WebFilter` + `attributes()`，或 Advice/AOP | "preHandle 返回 false 短路" = `WebFilter` 里不换 `chain`、直接返回自己的 `Mono` |
| `@ControllerAdvice`/`@ExceptionHandler` | 同名存在，另有 `WebExceptionHandler` bean | 异常是 `onError` 信号，`ErrorWebExceptionHandler` 才是终出口 |
| Spring AOP（`14`） | 完全一致 | AOP 与栈无关，仍是代理 |
| `RequestContextHolder`/MDC | `Context` + context-propagation（十四节） | 没有"请求线程"，`@RequestScope` 语义受限 |

同时引 `starter-web` 与 `starter-webflux` 时，**应用按 Servlet 起**：`SpringApplication` 推导 `WebApplicationType` 时 servlet 标记优先（只要 `Servlet` + WebMVC 在类路径就判为 `SERVLET`），WebFlux 自动配置大多不生效。要 reactive 必须显式设：
```yaml
spring:
  main:
    web-application-type: reactive    # 显式覆盖推导结果（默认 servlet 胜出）
  reactor:
    context-propagation: auto         # Boot 3.x：MDC/SecurityContext 随 Context 自动搬运（以所用版本为准）
```
> 注意：这条推导顺序也解释了"加 `starter-webflux` 只为了注入 `WebClient`，结果 `@GetMapping` 全跑在 Tomcat 上"——引依赖不等于换栈。真要混用：Tomcat worker 允许阻塞，此时"响应式"只是客户端 API 的形状，收益按第十七节重估。

---
## 十三、`WebClient`：非阻塞 HTTP 客户端
```java
HttpClient http = HttpClient.create(ConnectionProvider.builder("inventory")
                .maxConnections(200).maxIdleTime(Duration.ofSeconds(20))
                .pendingAcquireTimeout(Duration.ofSeconds(2)).build())  // 池里等不到连接就报错，别无限等
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2000)
        .responseTimeout(Duration.ofSeconds(3));                // ★ 不配 = 默认无限等，线上挂死第一名
WebClient client = WebClient.builder().clientConnector(new ReactorClientHttpConnector(http))
        .baseUrl("https://inventory.internal")
        .codecs(c -> c.defaultCodecs().maxInMemorySize(256 * 1024))  // bodyToMono 缓冲上限，防大响应撑爆
        .build();
Mono<Item> item = client.get().uri("/items/{id}", id).accept(MediaType.APPLICATION_JSON)
        .retrieve()                                              // ← 用 retrieve()，不是 exchange()
        .onStatus(HttpStatusCode::is5xxServerError, r -> r.bodyToMono(String.class).map(BizException::new))
        .bodyToMono(Item.class).timeout(Duration.ofSeconds(5))
        .retryWhen(Retry.backoff(2, Duration.ofMillis(100)).filter(e -> e instanceof IOException));
```
`exchange()` 已 **deprecated**（后续版本移除）：它把 `ClientResponse` 的释放责任交给你——body 必须被消费或手动 `release()`，忘了就泄漏 `ByteBuf`/DirectBuffer。要读状态码分流用 `retrieve()` + `onStatus`，或 `exchangeToMono(...)`（框架仍保证释放），而不是老 `exchange()`。与 `RestTemplate` 的取舍：后者阻塞、每次调用占一条线程，在 EventLoop 上直接调用撞第七节红线；纯 Servlet 栈老应用继续用它没问题（新代码推荐 `RestClient`），WebFlux/网关内一律 `WebClient`。依赖与超时外部化的装配见 `13-SpringBoot.md`。

---
## 十四、上下文传播：`Context` 从下游写、给上游读
MVC 里横切信息住在 `ThreadLocal`（`RequestContextHolder`、MDC、`SecurityContextHolder`）。响应式里一次请求会跨多个线程（第六节 `publishOn`），而且**没有"请求线程"这个概念**，于是 `ThreadLocal` 全线失效：写进 EventLoop 线程的 MDC 被下一个请求复用（串号，机制见 `35` 第十二节），traceId 在换线程的算子后消失（后果见 `30`）。Reactor 的答案是 `Context`：**沿订阅方向反向上行**的不可变映射。
```java
Mono<String> chain = Mono.deferContextual(cv -> Mono.just("tenant=" + cv.get(TENANT)))  // 读，拿 ContextView
        .flatMap(s -> callRemote(s));
chain.contextWrite(Context.of(TENANT, "acme"))     // 写：放在链的【下游】（更靠近 subscribe 的一侧）
     .subscribe();
```
> 注意（方向最易写反）：`contextWrite` 必须写在**它下游**，写入后对**它上游的所有算子可见**；写在链中间，则中间之前的算子读不到。`Context` 不可变——`contextWrite` 返回的是"带着新 Context 的那次订阅"，不是往全局 map 塞东西，这也正是它能安全跨线程的原因。

`ThreadLocal` 与 `Context` 的桥接靠 **Micrometer context-propagation**：注册 `ThreadLocalAccessor`（MDC、`SecurityContext` 已内置），在算子信号前后用 `ContextSnapshot.setThreadLocals()/restore()` 搬运；Boot 3.x 可开 `spring.reactor.context-propagation=auto`（等价 `Hooks.enableAutomaticContextPropagation()`，版本以所用 Boot 为准）。代价是每个信号都过一遍搬运——热路径上要么接受，要么显式把 traceId 放进 `Context` 由日志自己取。

---
## 十五、数据库这一环在 WebFlux 里是断的
JDBC、MyBatis、JPA/Hibernate 全是阻塞 API（`18`/`19`/`20`/`21`），不认 `request(n)`，也不给 Reactor 协商余地。两条路：
```java
return Mono.fromCallable(() -> jdbcTemplate.query(sql, mapper))    // 路 A：包一层，卸载到 boundedElastic
           .subscribeOn(Schedulers.boundedElastic())                 // 不阻塞 EventLoop，但天花板仍在连接池
           .timeout(Duration.ofSeconds(1));
```
```yaml
# 路 B：R2DBC（响应式驱动 + ReactiveConnectionPool），链路才真正端到端非阻塞
spring.r2dbc.url: r2dbc:mysql://db:3306/app
spring.r2dbc.pool: { initial-size: 10, max-size: 50 }
```
> 注意（措辞不能含糊）：路 A 只解决"别把 EventLoop 卡死"这一件事。DB 连接数与 `boundedElastic` 线程数仍是硬上限，1 万并发查询照样排队超时——**不要写成"这样就有响应式收益了"**。它的定位是渐进迁移：WebFlux 外壳 + 阻塞内核，收益大约只到"连接占用减少"。事务方面，R2DBC 由 `R2dbcTransactionManager` 承担 `@Transactional`，而"事务不能跨线程"在响应式里体现为事务上下文必须绑在 `Connection` 而非 `ThreadLocal` 上（呼应 `39` 第一节的 `TransactionSynchronizationManager`）。

---
## 十六、测试：`StepVerifier` 与虚拟时间
```java
StepVerifier.create(service.list(10))
        .expectNext("a", "b").expectNextCount(7)
        .expectErrorMessage("boom")        // 断言终态错误（也可 expectError() 只断类型）
        .verifyComplete();
StepVerifier.withVirtualTime(() -> Flux.just("x").delayElements(Duration.ofHours(6)))
        .thenAwait(Duration.ofHours(6))    // 时钟"拨快"，测试毫秒级完成
        .expectNext("x").verifyComplete();
```
要点：`StepVerifier` 自己就是那个**合规订阅者**——按期望逐个 `request(1)`，因此能在测试里暴露生产上被快速消费者掩盖的背压 bug；`withVirtualTime` 必须传 **`Supplier`**（否则 `delayElements` 在组装期就把真实 Scheduler 定死了），它换的是虚拟时钟而非跳过等待。冷语义同样可断言：同一 publisher 订阅两次、上游计数 +1（Mockito 配合见 `17`）。

---
## 十七、选型三方案：Java 21 之后多数场景不该选 WebFlux

| 维度 | MVC + 平台线程池（默认 Tomcat） | MVC + 虚拟线程（`10`） | WebFlux（本篇） |
|---|---|---|---|
| 吞吐模型 | 并发 ≈ 线程数，阻塞即占位，C10K 吃力 | 并发 ≈ 连接数，百万虚拟线程挂在阻塞点 | 并发 ≈ 连接数，核数级 EventLoop + 在途请求表 |
| 栈开销 | 平台线程栈量级 1MB，几千条就吃紧 | 续体几 KB 量级；早期 JDK 上 `synchronized` 内阻塞会钉住载体线程（后续版本已改进，以所用 JDK 为准） | 无每请求栈，但链对象/操作符包装带来分配与 GC 压力 |
| 调试难度 | 线程栈直观，dump/Arthas 全兼容 | 栈被拆成挂载片段，工具需虚拟线程感知 | **最难**：栈全是 Reactor 内部帧，要 `Hooks.onOperatorDebug`/`DebugAgent`（有性能代价） |
| 生态兼容（阻塞库） | 全部（JDBC/MyBatis/JPA/各类 SDK） | **同样全部**，这是它最大的优势 | 只有响应式客户端；JDBC/MyBatis/JPA 需第十五节路 A 打折 |
| 背压 | 无契约，靠线程数与队列硬扛 | 无契约，靠海量挂起掩盖 | **真背压 `request(n)` 端到端**（第二、八节） |
| 团队心智 | 现成 | 现成，主要改 executor + 审 `synchronized`/`ThreadLocal` | 组合子思维重写：cold 重放（九）、`Context` 反向（十四）、`block` 红线（七）全要重学 |

结论与 `10-虚拟线程.md` 呼应：**Java 21 之后，多数"IO 密集但逻辑同步"的业务服务应选 MVC + 虚拟线程**——同样拿到"少量 OS 线程扛高并发"，却不必重写数据访问层，也不承担响应式的调试税。**WebFlux 留给三类硬需求**：① 真背压（上游速率不可控：推送、导出、消息分发）；② 流式协议（SSE/WS/NDJSON/网关转发，第十一节）；③ 长期演进的平台组件——**Spring Cloud Gateway 就是 WebFlux 实现**（`24`）。第四种理由是"已有响应式资产"，但它不构成"新起一个 CRUD 服务"的理由。

---
## 十八、常见坑与速答

| 问题 | 速答 |
|---|---|
| 构建了 `Flux` 却没反应 / 却跑两遍？ | cold + 懒执行：没订阅就是张图，订阅两次就跑两次（第三节） |
| `flatMap` 把下游打挂？ | 默认并发 256 量级，`flatMap(fn, 20)` 显式限；要严格顺序换 `concatMap` |
| 两个 `subscribeOn` 只生效一个？ | 符合设计：只有最上游那次生效；`publishOn` 可多次、逐个生效（第六节） |
| `block()` 抛 `IllegalStateException`？ | 当前线程带 `NonBlocking` 标记；换 `subscribeOn(boundedElastic())` 或整链异步（第七节） |
| 重试后重复扣款？ | `retry` 重新订阅整条 cold 链 = 副作用重放；重试只能压在幂等片段之下（第九节） |
| `onBackpressureBuffer()` 还 OOM？ | 无参版本是**无界**；给容量 + 溢出策略，或用 `limitRate` 从源头压配额（第八节） |
| traceId 丢了 / 串了别人的 tenant？ | `ThreadLocal` 在响应式里必然失效，要 `Context` + context-propagation（十四节） |
| 加了 `starter-webflux` 还是 Tomcat？ | servlet 优先推导；`spring.main.web-application-type=reactive` 显式覆盖（十二节） |
| 能用 MyBatis 写 WebFlux 吗？ | 只能 `boundedElastic` 包，吞吐上限仍是连接池；要端到端非阻塞换 R2DBC（十五节） |
| **一句话总结** | WebFlux = Reactor（`Mono`/`Flux`）+ 非阻塞事件循环 + `request(n)` 契约化背压：少量线程扛高并发，代价是懒执行、cold 重放、`Context` 反向、阻塞红线四套新因果。它与虚拟线程是**二选一**：要响应式流式与真背压选 WebFlux，想保留同步写法升并发选 MVC + 虚拟线程。 |

---
## 与系列其他文档的关系
- `10-虚拟线程.md`：**本篇结论的另一半**。虚拟线程用"阻塞写法 + M:N 调度"拿到相近吞吐，第十七节表格是正面比较；选型先问"需不需要真背压"，不需要就选虚拟线程。
- `42-Netty.md`：WebFlux 的底座是 Reactor Netty。第七节 `block()` 红线的物理原因、第十一节 `writeWith` 的水位反压，分别是 `42` 第七节（handler 不许阻塞）与第十节（写回压/`isWritable`）在流层的复现。
- `32-IO与NIO.md`：事件循环与 Selector 的原始模型在那边定义，本篇只讲它们在 Reactor API 上的投影。
- `38-SpringMVC请求流程与Web层.md`：对照篇。第十二节分层表就是 `38` 第九节逐项翻成响应式；`@RequestBody`、消息转换、异常出口的 Servlet 侧语义以 `38` 为准。
- `18`/`19`/`20`/`21`（JDBC、JPA、MyBatis、持久层进阶）：**边界所在**。这四篇 API 全是阻塞的，第十五节说明为什么接不上、包一层能拿到什么、拿不到什么。
- `39-Spring事务与传播机制.md`、`35-线程池与线程协作.md`、`30-可观测性.md`：`@Transactional` 靠 `ThreadLocal` 绑连接（十四、十五节讲它如何失效）；`fromExecutor` 的池参数与串号机制在 35，traceId 断链的用户可见后果在 30。
- `24`/`27`、`13`/`17`：第四节"单上游多下游"与第八节缓冲策略在消息场景才有真实压力（Gateway 属 WebFlux 阵营）；`WebClient`/`spring.main.*` 装配在 13，`StepVerifier` 与 Mockito 的配合在 17。
