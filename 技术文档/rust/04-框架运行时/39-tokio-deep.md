# 39 · Tokio 深度（异步运行时内核）

> 官方来源：Tokio crate docs.rs（tokio-1.53.1，2026-07-20，文档覆盖率 100%）
> 本文**完整抓取 tokio 官方文档页正文**（Runtime/Scheduler/I-O driver/spawn_blocking/sync primitives/time/io/feature flags），结合标准实战整理。联动 `18-async-await.md`。

Tokio 是 Rust 异步生态的事实标准运行时（axum/actix/tonic/sqlx 全部建其上）。理解其内部是异步编程关键。

## 一、Runtime 组成

Tokio runtime 包含三大件：
1. **任务调度器（Scheduler）**：决定哪个 task 在何时运行。
2. **I/O 驱动**：基于 OS 事件队列（epoll/kqueue/IOCP）的非阻塞 I/O（文档称 "I/O driver backed by the operating system's event queue"）。
3. **定时器**：高精度时钟。

> 注：官方文档不用 "Reactor" 一词，而称 "I/O driver"；底层即 epoll/kqueue/IOCP 封装（类比 Node 的 libuv `node/02`、Java NIO `java/13`）。

## 二、调度器（两种）

| 调度器 | 特性 flag | 适用 |
|---|---|---|
| 当前线程（current-thread） | `rt` | 轻量/测试/单线程 |
| 多线程工作窃取（work-stealing） | `rt-multi-thread` | 默认生产（每 CPU 一 worker） |

- `#[tokio::main]` = `rt-multi-thread` + `macros`。
- 任务仅在 `.await` 点切换（协作式）；worker 间可窃取任务（提升吞吐）。
- 核心线程数：`TOKIO_WORKER_THREADS` 环境变量覆盖。

## 三、阻塞线程与 spawn_blocking

```rust
#[tokio::main]
async fn main() {
    let r = tokio::task::spawn_blocking(|| {
        // 运行在专用阻塞线程，允许阻塞
        std::thread::sleep(std::time::Duration::from_secs(1));
        42
    }).await.unwrap();
}
```

- 核心线程跑异步任务；阻塞代码必须 `spawn_blocking` 丢到**阻塞线程池**，否则卡住整个 worker（见 `18-async-await.md` 第 7 节坑）。
- CPU 密集建议 rayon 或独立 runtime（`Blocking` 章节）。

## 四、Sync 原语（tokio::sync）

需 `sync` 特性：

| 类型 | 说明 | 对比 |
|---|---|---|
| `mpsc` | 多生产者单消费 channel | `17-concurrency-parallel.md` 标准库 mpsc |
| `oneshot` | 单值一次性 | 类似 Go 的 done channel |
| `watch` | 广播最新值 | 配置热更新 |
| `broadcast` | 多消费者广播 | 事件总线 |
| `Mutex`（异步） | 非阻塞互斥锁 | 标准库 `Mutex` 会阻塞线程 |
| `RwLock` | 读写锁 | — |
| `Semaphore` | 信号量 | 限流并发 |

- **关键**：`tokio::sync::Mutex` 是**异步**的（`.lock().await`），不会阻塞线程；标准库 `Mutex` 在 async 中用了会卡 worker（常见错误）。

## 五、Time 与 IO

- `tokio::time`：`sleep`/`timeout`/`interval`（需 `time`）。
- `tokio::io`：`AsyncRead`/`AsyncWrite` trait（始终可用）。
- `tokio::net`：`TcpListener`/`TcpStream`/`UdpSocket`（非阻塞，需 `net`）。
- `tokio::fs`：异步文件 I/O。

## 六、Feature flags

```
full = rt + rt-multi-thread + macros + sync + time + io-util + net + fs + signal + process
```
- 生产用 `full`；极致精简按需开。
- 不稳定特性需 `tokio_unstable`（如 io-uring/tracing/taskdump）。

## 七、与系列对照

| tokio | 其他 |
|---|---|
| work-stealing scheduler | Go runtime 调度器 |
| epoll/kqueue I/O driver | Node libuv（node/02）、Java NIO（java/13） |
| `spawn_blocking` | Java 虚拟线程（java/10）分流阻塞 |
| 异步 Mutex | Java `ReentrantLock`（java/15） |
| `mpsc`/`broadcast` | Rust std channel（17）、Go channel |

- tokio 的"单 runtime + 多 worker + epoll"模型与 Node 事件循环（node/02）目标一致：高并发 I/O 不阻塞。

## 八、实战

```rust
use tokio::sync::Semaphore;
use std::sync::Arc;
let sem = Arc::new(Semaphore::new(10));   // 限流 10 并发
for _ in 0..100 {
    let permit = sem.clone().acquire_owned().await.unwrap();
    tokio::spawn(async move { /* 任务 */ drop(permit); });
}
```

> 延伸：`18-async-await.md`、`17-concurrency-parallel.md`、`22-web-framework-axum.md`、`32-tonic-grpc.md`、`技术文档/java/10-virtual-threads.md`。
