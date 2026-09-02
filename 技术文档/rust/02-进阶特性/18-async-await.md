# 18 · 异步编程（async / await）

> 官方来源：Asynchronous Programming in Rust（https://rust-lang.github.io/async-book/，Rust 官方社区书）；标准库 std::future
> 说明：官方 async-book 为章节导言（确认全书范围：基础/控制流/生态），本文基于标准库 Future trait 与 tokio/async-std 生态标准知识整理。

Rust 的 async 用于**高并发 I/O**（大量连接、少量计算），与 OS 线程互补：线程适合 CPU 密集，async 适合 I/O 密集。

## 一、Future 与 async/await

```rust
async fn fetch() -> String {
    // 模拟异步：实际中 await 网络调用
    "data".to_string()
}

fn main() {
    let fut = fetch();   // 返回 Future，尚未执行
    // 需要 executor 驱动
}
```

- `async fn` / `async {}` 返回实现 `Future` 的值，**惰性**：不 `.await` 不执行。
- `Future` 核心：`fn poll(self: Pin<&mut Self>, cx: &mut Context) -> Poll<T>`。
- `.await`：挂起当前 Future 直到完成，不阻塞线程（让出执行权）。

## 二、Executor / Runtime（tokio）

Rust 标准库**只定义 Future，不提供执行器**，需运行时（tokio 是事实标准）：

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]                 // 宏：生成 async main + 启动 tokio runtime
async fn main() {
    let h1 = tokio::spawn(async {         // 在 runtime 内生成任务
        sleep(Duration::from_millis(100)).await;
        1
    });
    let h2 = tokio::spawn(async { 2 });
    let (a, b) = tokio::join!(h1, h2);    // 并发等待
    println!("{} {}", a.unwrap(), b.unwrap());
}
```

- `tokio::spawn`：生成轻量任务（类似 Go goroutine、Java 虚拟线程 java/10）。
- `#[tokio::main]`：把 `async fn main` 包进 `block_on` 启动 runtime。
- 多任务在少量 OS 线程上**协作式**调度，I/O 等待时切换，故高吞吐。

## 三、Pin 与 Unpin

- `Future` 通常包含自引用（状态机持有对自己字段的引用），移动会失效 → 需 `Pin<&mut Future>` 固定内存。
- 绝大多数 `.await` 由编译器/执行器处理 `Pin`，用户少见；写自定义 Future 或 `Stream` 时才需手动 `Pin::new_unchecked`（unsafe）。
- `Unpin`：可安全移动的类型标记（多数类型默认 `Unpin`）。

## 四、Stream（异步迭代器）

```rust
use tokio_stream::wrappers::ReceiverStream;
// 或 futures::StreamExt：.next().await、.map、.filter 等
```

- `Stream` = 异步版 `Iterator`（反复产出 `Option<Item>`），配合 `while let Some(x) = s.next().await`。
- 与同步迭代器（`14-Rust迭代器知识手册.md`）对照。

## 五、异步与多线程的选择

| 场景 | 用 |
|---|---|
| CPU 密集 / 计算 | `thread::spawn`（17章）或多线程 runtime |
| I/O 密集 / 高并发 | `tokio::spawn` async 任务 |
| 两者混合 | `spawn_blocking` 把阻塞计算丢到专用线程池 |

## 六、与系列对照

- Java：`java/10` 虚拟线程——Java 21 用"线程"模型达成类似高并发，Rust 用"Future+poll"模型；二者都避免每个连接一个 OS 线程。
- Go：goroutine 由 runtime 调度，Rust async 由 tokio 调度，模型相似。
- Node：`node/02` 事件循环 + `node/07` http——Node 天生异步单线程，Rust async 需显式 runtime。
- C#：`async/await` 语法同源（均借鉴 F#）。

## 七、常见坑

- **阻塞 runtime 线程**：在 async 中调用同步阻塞 I/O 会卡住整个线程池 → 用 `spawn_blocking`。
- **忘记 `.await`**：Future 不执行。
- **生命周期**：`async fn` 返回的 Future 可能比引用的数据活得久 → 需 `'static` 或 `move`。

> 延伸：`17-concurrency-parallel.md`、`22-web-framework-axum.md`（tokio 驱动 Web）、`技术文档/java/10-virtual-threads.md`。
