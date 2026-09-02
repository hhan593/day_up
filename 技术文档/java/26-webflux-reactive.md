# 26. Spring WebFlux 响应式编程

> 来源可信度：**官方文档确认**（基于 Spring WebFlux 官方文档；与 `10-virtual-threads.md`/`14-spring-core.md` 衔接）
> 关联：Go `16-grpc-microservices.md`、Rust `18-async-await.md`

## 1. 为什么 WebFlux

- 传统 Spring MVC 是**线程池模型**：每请求一线程，阻塞 I/O 时线程干等。
- WebFlux 基于 **Reactor**（Project Reactor），非阻塞、事件循环，少量线程扛高并发。
- 适合：高并发 I/O 密集、流式、背压场景。

## 2. Mono 与 Flux

```java
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;

Mono<String> one = Mono.just("a");          // 0..1 元素
Flux<Integer> many = Flux.range(1, 10);     // 0..N 元素

many.map(i -> i * 2)
    .filter(i -> i > 5)
    .subscribe(System.out::println);
```

- `Mono<T>`：异步 0/1 结果；`Flux<T>`：异步 0..N 序列。
- 操作符链（`map`/`flatMap`/`filter`/`zip`）与 JS RxJS / Rust `futures` Stream 思想相通。

## 3. 响应式 Controller

```java
@RestController
public class UserController {
    private final UserRepository repo;

    @GetMapping("/users/{id}")
    public Mono<User> get(@PathVariable Long id) {
        return repo.findById(id);
    }

    @GetMapping("/users")
    public Flux<User> all() {
        return repo.findAll();
    }
}
```

- 返回 `Mono`/`Flux`，WebFlux 自动编解码（JSON 流式）。
- `flatMap` 做异步串联（类似 `async/await` 的 `await`）。

## 4. 背压（Backpressure）

- Reactor 内置背压：下游慢时上游减速（`onBackpressureBuffer`/`Drop`/`Latest`）。
- 对比：Go channel 用 `buffered` 近似；Rust tokio 用 `mpsc` bounded。

## 5. WebFlux vs 虚拟线程

| | WebFlux | MVC + 虚拟线程 (`10-virtual-threads.md`) |
|---|---------|----------------------------------------|
| 模型 | 事件循环非阻塞 | 每请求一虚拟线程（阻塞写法） |
| 心智 | 响应式操作符 | 传统同步代码 |
| 生态 | Reactor 专用 | 全部阻塞库通用 |
| 选谁 | 已用响应式 | 想保留同步写法升并发 |

> Java 21 虚拟线程兴起后，很多场景用 **MVC + 虚拟线程** 即可，不必强上 WebFlux。

## 6. 一句话总结

> WebFlux = Reactor（`Mono`/`Flux`）+ 非阻塞事件循环，少量线程扛高并发，背压内置。与虚拟线程二选一：要响应式流式选 WebFlux，想保留同步写法选 MVC+虚拟线程。
