# 55. Rust 异步运行时生态与选型

> 来源可信度：**完整正文级**（`async-std 1.13.2` 官方 docs.rs 首页声明原文；`tokio` 见 `39-tokio-deep.md`）
> ⚠️ **重要更正**：`async-std` 官方已宣布**停止维护**，本文据此调整选型建议，请勿在新项目中使用 async-std。
> 关联：`18-async-await.md`、`39-tokio-deep.md`、`53-no-std-embedded.md`

## 1. 官方声明：async-std 已停止维护

docs.rs `async-std 1.13.2`（2026-06-24）首页第一条即：

> **async-std has been discontinued; use smol instead**
>
> We created async-std to demonstrate the value of making a library as close to std as possible, but async. We think that demonstration was successful... However, in the meantime, the **smol** project came about and provided a great executor and libraries for asynchronous use in the Rust ecosystem. We think that resources would be better spent consolidating around **smol**, rather than continuing to provide occasional maintenance of async-std. As such, we recommend that all users of async-std, and all libraries built on async-std, **switch to smol instead**.

官方推荐的其他替代：`futures-concurrency`、`async-io`、`futures-lite`、`async-compat`。

## 2. 为什么 Rust 没有"官方运行时"

`std` 只提供 `Future` trait 与 `async/await` 语法，**不含执行器**。原因是 Rust 想让运行时成为**可替换的库**，服务从嵌入式到数据中心的全部场景。

代价是生态分裂（"函数颜色"问题）：为 tokio 写的库在 smol 上可能不工作，反之亦然。

## 3. 运行时选型

| 运行时 | 定位 | 调度 | 生态 | 适用 |
|--------|------|------|------|------|
| **tokio** | 工业标准 | 多线程 work-stealing | ⭐⭐⭐ 最大 | 服务端默认首选 |
| **smol** | 轻量（async-std 官方推荐接替者） | 简单 executor | ⭐⭐ | 轻量应用、嵌入式 |
| `async-std` | ⛔ **已停止维护** | — | ⭐⭐ | 仅存量项目 |
| `glommio` | 基于 io_uring，单线程分片 | thread-per-core | ⭐ | Linux 高性能存储 |
| `monoio` | io_uring，字节跳动维护 | thread-per-core | ⭐ | Linux 高性能网络 |
| `embassy-executor` | no_std 嵌入式 | 中断驱动协作 | ⭐⭐ | MCU（见 `53`） |
| `compio` | IOCP/io_uring 跨平台 | proactor | ⭐ | 跨平台高性能 |
| `futures::executor` | 最小实现 | 单线程 | ⭐ | 测试/学习 |

**默认建议**：服务端选 **tokio**；需要轻量/自定义选 **smol**；Linux 极致 I/O 看 **glommio/monoi**o；嵌入式选 **Embassy**。

## 4. tokio 回顾（详见 39）

```toml
tokio = { version = "1", features = ["full"] }
```

```rust
#[tokio::main]
async fn main() {
    let h = tokio::spawn(async { 42 });
    println!("{}", h.await.unwrap());
}
```

## 5. smol（async-std 的官方接替者）

```toml
smol = "2"
futures-lite = "2"
async-net = "2"        # 网络
async-fs = "2"         # 文件
async-io = "2"         # I/O 驱动
async-channel = "2"    # channel
async-process = "2"    # 进程
```

```rust
// 方式一：block_on（最简单）
fn main() {
    smol::block_on(async {
        println!("hello from smol");
    });
}

// 方式二：显式 Executor（更可控）
use smol::Executor;

fn main() {
    let ex = Executor::new();
    // 多 worker 线程跑同一个 executor
    for _ in 0..num_cpus() {
        let ex = ex.clone();
        std::thread::spawn(move || smol::block_on(ex.run(futures_lite::future::pending::<()>())));
    }
    smol::block_on(async { /* 主逻辑 */ });
}

// 派生任务
let task = smol::spawn(async { 1 + 1 });
```

**smol 特点**：

- 极简，模块可单独选用（`async-io` 是驱动力核心）。
- **不自带 reactor 线程**——需要你显式驱动 executor。
- 定时器：`smol::Timer`；I/O：`async-io`/`async-net`。

### smol 完整例子：TCP echo 服务

```rust
use async_net::TcpListener;
use futures_lite::{AsyncReadExt, AsyncWriteExt, StreamExt};

fn main() -> std::io::Result<()> {
    smol::block_on(async {
        let listener = TcpListener::bind("127.0.0.1:8080").await?;
        println!("listening on {}", listener.local_addr()?);

        let mut incoming = listener.incoming();
        while let Some(stream) = incoming.next().await {
            let mut stream = stream?;
            smol::spawn(async move {
                let mut buf = vec![0u8; 1024];
                loop {
                    match stream.read(&mut buf).await {
                        Ok(0) | Err(_) => break,
                        Ok(n) => { stream.write_all(&buf[..n]).await.ok(); }
                    }
                }
            }).detach();
        }
        Ok(())
    })
}
```

## 6. 跨运行时兼容

### 6.1 async-compat（tokio ↔ 其他）

```rust
use async_compat::Compat;

fn main() {
    // 让 tokio 的代码能在非 tokio 运行时上跑（反之亦然）
    smol::block_on(Compat::new(async {
        // 这里可以安全使用 tokio 的库
    }));
}
```

### 6.2 写运行时无关的库

**库不应绑定运行时**，只依赖 `futures`：

```toml
[dependencies]
futures = "0.3"     # 只有 trait 与组合子，无执行器
```

```rust
// 好：接受任何实现了 AsyncRead 的类型
use futures::AsyncRead;

pub async fn process<R: AsyncRead + Unpin>(reader: R) -> std::io::Result<()> {
    // ...
}
```

> 反模式：库里出现 `tokio::spawn` / `#[tokio::main]`——会把使用者锁死在 tokio。

### 6.3 需要 spawn 时怎么办

用 `async-executor` 或让调用方传入 executor；或者提供 feature 开关：

```toml
[features]
tokio-rt = ["dep:tokio"]
smol-rt  = ["dep:smol"]
```

## 7. thread-per-core 模型（glommio / monoio）

传统 work-stealing 多线程在**极高 I/O** 下有锁竞争。thread-per-core 每核绑一个线程跑独立任务队列，无跨核同步。

```rust
// glommio 风格
use glommio::{LocalExecutorBuilder, Latency};

fn main() {
    let ex = LocalExecutorBuilder::new()
        .pin_to_cpu(0)
        .spawn(|| async move {
            // 这个 executor 只在 CPU 0 上跑
        }).unwrap();
    ex.join().unwrap();
}
```

**适用**：Redis/Nginx 级性能要求的存储/代理服务（**仅 Linux，依赖 io_uring**）。

## 8. 运行时配置

### tokio

```rust
#[tokio::main(flavor = "multi_thread", worker_threads = 4)]
async fn main() {}

#[tokio::main(flavor = "current_thread")]     // 单线程（省资源，适合客户端）
async fn main() {}
```

### async-std（存量项目）

官方文档列出的环境变量（仅维护存量时参考）：

- `ASYNC_STD_THREAD_COUNT` — runtime 线程数，默认每逻辑核一个；非正整数会 panic。
- `ASYNC_STD_THREAD_NAME` — 线程名，默认 `async-std/runtime`。

## 9. 迁移建议：async-std → smol

官方给出的对应关系：

| async-std | smol 生态 |
|-----------|-----------|
| `async_std::task::spawn` | `smol::spawn` |
| `async_std::net::TcpListener` | `async_net::TcpListener` |
| `async_std::fs` | `async_fs` |
| `async_std::io` | `futures_lite::io` / `async_io` |
| `async_std::channel` | `async_channel` |
| `async_std::stream` | `futures_lite::stream` |
| `async_std::future` | `futures_lite::future` |
| `async_std::process` | `async_process` |
| `#[async_std::main]` | `smol::block_on` / `Executor` |
| `async_std::task::sleep` | `smol::Timer::after` |

> 平滑迁移可用 `async-compat` 临时包裹，逐步替换。

## 10. 选型决策树

```
需要写网络服务？
├─ 是 → 生态优先（axum/tonic/sqlx 都绑 tokio）→ 选 tokio
├─ 想要轻量/可控/嵌入式 Linux → 选 smol
├─ Linux 极致 I/O 性能 → glommio / monoio / compio
├─ MCU no_std → Embassy（53）
└─ 写库 → 只依赖 futures，不绑运行时

存量 async-std 项目 → 按官方建议迁移到 smol
```

## 11. 一句话总结

> ⚠️ **async-std 官方已停止维护，推荐 smol**。服务端默认 **tokio**（生态最大）；轻量选 **smol**（模块可拆分、需显式驱动 executor）；Linux 极致性能看 **glommio/monoio**（thread-per-core + io_uring）；嵌入式用 **Embassy**；写库只依赖 `futures` 不绑运行时；跨运行时用 `async-compat` 或让调用方注入 executor。
