# 47. RActor 集群与 Actor 实战

> 来源可信度：**完整正文级**（基于 docs.rs `ractor 0.16.5`，2026-08-07 文档；MSRV 1.85）
> 关联：`29-actor-frameworks.md`（Actor 模型总览）

## 1. RActor 是什么

RActor 是受 Erlang `gen_server` 启发的 Rust Actor 框架，由 Sean Lawlor（slawlor）维护。特点：

- 类型安全的消息（`Actor::Msg`）。
- 监督树（supervision）：父 Actor 监控子 Actor 生命周期。
- 可选 `cluster` feature 支持分布式（节点发现、RPC）。
- `async-trait` feature 支持异步 handler。

```toml
ractor = { version = "0.16", features = ["cluster"] }
```

## 2. 定义 Actor

```rust
use ractor::{Actor, ActorRef, ActorProcessingErr, async_trait};

// 消息
enum Message {
    Increment,
    GetCount(ActorRef<Message>),
}

// 状态
struct Counter { count: u32 }

// Actor 定义
struct CounterActor;

#[async_trait]
impl Actor for CounterActor {
    type Msg = Message;
    type State = Counter;
    type Arguments = ();

    async fn pre_start(&self, _myself: ActorRef<Self::Msg>, _args: ()) -> Result<Self::State, ActorProcessingErr> {
        Ok(Counter { count: 0 })
    }

    async fn handle(&self, myself: ActorRef<Self::Msg>, msg: Self::Msg, state: &mut Self::State) -> Result<(), ActorProcessingErr> {
        match msg {
            Message::Increment => state.count += 1,
            Message::GetCount(reply_to) => {
                let _ = reply_to.send(Message::Increment); // 简化示例：回传
                println!("count = {}", state.count);
            }
        }
        Ok(())
    }
}
```

- `pre_start`：初始化状态（panic 会令 spawn 失败，不触发监督）。
- `handle`：处理消息、修改状态（单线程顺序处理，无锁）。
- 可选 `post_start` / `post_stop` / `handle_supervisor_evt`。

## 3. 启动与发消息

```rust
use ractor::{spawn, call, cast};

#[tokio::main]
async fn main() {
    let (actor_ref, _handle) = spawn::<CounterActor>((), ()).await.unwrap();

    // 异步发（cast，不等待）
    actor_ref.cast(Message::Increment).unwrap();

    // 同步调用（call，等待回复，带超时）
    // let reply = call!(&actor_ref, Message::GetCount(_), 1000).unwrap();
}
```

- `cast`：fire-and-forget，对应 Erlang `!`。
- `call!` 宏：请求-响应，带超时。
- 消息优先级：Signal（如 `Kill`）> Stop > SupervisionEvent > 普通 Message。

## 4. 监督（Supervision）

RActor 通过 **linking** 建立监督关系：

```rust
use ractor::{Actor, ActorRef, SupervisionEvent};

// 监督者收到子 Actor 的失败/停止事件
#[async_trait]
impl Actor for Supervisor {
    // ...
    async fn handle_supervisor_evt(&self, myself: ActorRef<Self::Msg>, event: SupervisionEvent, state: &mut Self::State) -> Result<(), ActorProcessingErr> {
        match event {
            SupervisionEvent::ActorFailed(who, err) => {
                println!("child {who:?} failed: {err:?}");
                // 决策：重启 / 停止 / 忽略
            }
            _ => {}
        }
        Ok(())
    }
}
```

- 监督者通过 `actor_ref.link(supervisor_ref)` 建立链接。
- 子 Actor 在 `post_start`/`handle`/`post_stop` 中 panic 会通知监督者；`pre_start` panic 则 spawn 失败（尚未 link）。
- 若 `panic = "abort"`，panic 直接终止进程，监督流无法捕获——务必用 `panic = "unwind"`（默认）。

## 5. 集群（cluster feature）

开启 `cluster` 后可跨进程/跨机通信：

- `ractor_cluster` 提供节点（NodeServer）与 RPC。
- 消息需 `impl ractor::Message`（满足 `Send + 'static`，集群下还需序列化）。
- `pg`（process group）模块做进程分组与发现，`registry` 做命名注册。

```toml
ractor-cluster = "0.16"
```

```rust
// 简化概念：启动节点 + 注册 Actor，远端通过名称 RPC
// 详见 ractor_cluster crate 文档（node server / rpc）
```

> 集群是 RActor 的高级能力，生产使用需注意：序列化格式、网络分区、节点发现（etcd/consul 等外部协调）。

## 6. 与 tokio 的关系

- RActor 自己内置 `tokio` runtime；`spawn` 在 tokio 上运行 Actor。
- 每个 Actor 的 `handle` 是 async，但**单 Actor 内消息顺序处理**（不并行），天然无数据竞争。
- 需要并行计算时可 spawn 多个 Actor 或调用 `43-rayon-data-parallel.md`。

## 7. 何时用 Actor

| 场景 | 适合度 |
|------|--------|
| 有状态服务（连接、会话、游戏实体） | ⭐⭐⭐ |
| 需要监督/故障重启 | ⭐⭐⭐ |
| 纯无状态 HTTP 处理 | ⭐（用 axum 更直接） |
| CPU 密集并行 | 配合 Rayon |

## 8. 一句话总结

> RActor 0.16 把 Erlang gen_server 搬进 Rust：`Actor::Msg/State/handle` 定义行为，`cast/call!` 通信，link 建立监督树，`cluster` feature 跨节点 RPC。单 Actor 内顺序处理，天然无锁。
