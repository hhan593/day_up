# 29 · Actor 框架（RActor / Actix）

> 官方来源：RActor（https://github.com/slawlor/ractor，受 Erlang gen_server 启发）、Actix（https://actix.rs/）
> 说明：基于 RActor/Actix 官方文档结构与标准 API 整理；actor 模型并发是 Rust 生态重要范式。

Actor 模型：每个 actor 是独立计算单元，**通过消息通信、串行处理自身邮箱**，避免共享状态——与 `17-concurrency-parallel.md` 的 channel 思想一致但更结构化。

## 一、RActor（现代、tokio 异步 actor）

```rust
use ractor::{Actor, ActorRef, async_trait};
use ractor::ActorProcessingErr;

struct Counter;
#[derive(Debug)]
enum Msg { Inc, Get(ActorRef<i32>) }

#[async_trait]
impl Actor for Counter {
    type Msg = Msg;
    type State = i32;
    type Arguments = ();

    async fn create(_: Self::Arguments) -> Result<Self::State, ActorProcessingErr> {
        Ok(0)                       // 初始状态
    }
    async fn handle(&self, msg: Self::Msg, _: ActorRef<Self::Msg>, state: &mut Self::State)
        -> Result<(), ActorProcessingErr> {
        match msg {
            Msg::Inc => *state += 1,
            Msg::Get(reply) => { let _ = reply.send(*state); }
        }
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    let (pid, handle) = Actor::spawn(None, Counter, ()).await.unwrap();
    pid.send_message(Msg::Inc).unwrap();
    // 监督树、优雅停止：handle.stop()
}
```

- `Actor::spawn` 在 tokio 上运行；消息串行处理（无锁）。
- **监督树（supervision）**：actor 崩溃由父 actor 重启（Erlang 哲学）。
- 适合：状态机、长连接、分布式节点（类 Erlang/Elixir）。

## 二、Actix（actor + Web 一体）

```rust
use actix::prelude::*;
struct MyActor { count: usize }
impl Actor for MyActor { type Context = Context<Self>; }
#[derive(Message)]
#[rtype(result = "usize")]
struct Add(usize);
impl Handler<Add> for MyActor {
    type Result = usize;
    fn handle(&mut self, msg: Add, _: &mut Self::Context) -> usize {
        self.count += msg.0; self.count
    }
}
```
- Actix 是 `actix-web`（22-Web 框架）的底层 actor 库。
- `Addr` 发消息、`Handler<M>` 处理、`Message` 定义协议。

## 三、Actor vs 其他并发模型

| 模型 | 通信 | 状态 | 典型 |
|---|---|---|---|
| 共享内存 + 锁 | 共享 `Mutex` | 共享 | Rust 17 并发、Java synchronized |
| channel | 消息传递 | 各自 | Go channel、Rust mpsc |
| Actor | 邮箱消息 | 封装 | Erlang、RActor、Actix |
| async | Future 协作 | 各自 | Rust 18、Java 虚拟线程 |

- Actor 优势：**位置透明**（本地/远程同 API）、**容错**（监督树）、**无锁串行**。
- 劣势：消息序列化开销、调试链路长。

## 四、分布式 actor

- RActor + 远程传输（如 libp2p/QUIC）可构建分布式 actor 系统。
- 类比：Java Akka（JVM actor）、Go 的 protoactor。
- 与 `技术文档/java/24-messaging-microservices.md` 的微服务/消息队列结合：actor 适合进程内状态，Kafka 适合跨进程事件。

## 五、与系列对照

| Rust actor | 其他 |
|---|---|
| RActor/Actix | Erlang/Elixir actor、Java Akka |
| `send_message` | Go channel send、Rust mpsc send |
| 监督树 | Kubernetes pod 重启、Java 无原生 |
| tokio 底层 | Java 虚拟线程（java/10） |

> 延伸：`17-concurrency-parallel.md`、`18-async-await.md`、`22-web-framework-axum.md`、`技术文档/java/24-messaging-microservices.md`。
