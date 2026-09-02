# 44. Tower 中间件全解（Service / Layer 抽象）

> 来源可信度：**完整正文级**（基于 docs.rs `tower 0.5.3`，2026-06-20 文档）
> 适用：理解 axum/tonic/hyper 底层中间件模型，或自己写可组合的 RPC/HTTP 中间件。

## 1. Tower 是什么

Tower 是 Rust 异步中间件的**标准抽象层**，由 tower-rs 维护（seanmonstar、carllerche 等）。它的两个核心 trait 构成了整个生态（axum、tonic、hyper-util）的中间件基础：

- `Service`：一个 `async fn(Request) -> Result<Response, Error>`。
- `Layer`：装饰（decorate）一个 `Service`，返回另一个 `Service`。

```toml
tower = { version = "0.5", features = ["full"] }
# 依赖 tower-layer ^0.3.3, tower-service ^0.3.3
```

## 2. Service trait

```rust
use std::task::{Context, Poll};
use std::future::Future;

pub trait Service<Request> {
    type Response;
    type Error;
    type Future: Future<Output = Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>>;
    fn call(&mut self, req: Request) -> Self::Future;
}
```

关键语义：

- `poll_ready`：在 `call` 之前必须 `Ready(Ok(()))`。用于背压（backpressure）——下游忙时返回 `Pending`，上游停止发送。
- `call`：消费请求，返回 `Future`。**同一个 Service 可多次 `call`**（需 `&mut self`）。

最小实现示例（记录日志的 Service）：

```rust
use tower::{Service, BoxError};
use std::task::{Context, Poll};
use std::future::Future;
use std::pin::Pin;

struct LogService<S> {
    inner: S,
}

impl<S, Req, Resp> Service<Req> for LogService<S>
where
    S: Service<Req, Response = Resp>,
    S::Future: Send + 'static,
    S::Error: std::fmt::Debug,
{
    type Response = Resp;
    type Error = S::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Resp, S::Error>> + Send>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, req: Req) -> Self::Future {
        println!("-> request received");
        let fut = self.inner.call(req);
        Box::pin(async move {
            let res = fut.await;
            println!("<- response: {:?}", res.is_ok());
            res
        })
    }
}
```

## 3. Layer trait

```rust
pub trait Layer<S> {
    type Service;
    fn layer(&self, inner: S) -> Self::Service;
}
```

`Layer` 把"旧 Service"包成"新 Service"。配合 `ServiceBuilder` 可声明式组合：

```rust
use tower::{ServiceBuilder, Service, service_fn};
use tower::timeout::Timeout;
use tower::limit::RateLimit;
use std::time::Duration;

async fn handle(_req: ()) -> Result<&'static str, tower::BoxError> {
    Ok("ok")
}

#[tokio::main]
async fn main() -> Result<(), tower::BoxError> {
    let svc = ServiceBuilder::new()
        .timeout(Duration::from_secs(5))      // 超时
        .rate_limit(100, Duration::from_secs(1)) // 限流
        .service(service_fn(handle));

    let resp = svc.oneshot(()).await?;
    println!("{resp}");
    Ok(())
}
```

## 4. 内置 util 中间件（feature-gated）

| 模块 | 作用 | 启用 feature |
|------|------|-------------|
| `timeout` | 给请求加超时 | `timeout` |
| `retry` | 失败重试 | `retry` |
| `limit` | 限流（RateLimit / ConcurrencyLimit） | `limit` |
| `buffer` | 用 channel 缓冲请求，解耦调用方 | `buffer` |
| `util` | `ServiceExt`、`service_fn`、`AndThen`/`Then`/`Map` 等组合子 | `util` |

### 4.1 Timeout

```rust
use tower::timeout::Timeout;
use tower::ServiceExt;
use std::time::Duration;

let svc = Timeout::new(inner_svc, Duration::from_secs(3));
// 超时返回 Err(TimeoutError)
```

### 4.2 Retry

```rust
use tower::retry::{Retry, Policy};
use tower::ServiceExt;

// 自定义策略：对特定错误重试 3 次
struct MyPolicy;
impl<S, Req, Resp, E> Policy<Req, Resp, E> for MyPolicy {
    type Future = std::future::Ready<Self>;
    fn retry(&self, _req: &Req, result: &Result<Resp, E>) -> Option<Self> {
        match result {
            Err(_) => Some(MyPolicy), // 失败重试
            Ok(_) => None,
        }
    }
    fn clone(&self) -> Self { MyPolicy }
}
```

## 5. ServiceExt 便捷方法

`util` 模块导出的 `ServiceExt` 提供：

- `oneshot(req)`：一次性 `call`（内部已 `poll_ready`）。
- `ready()`：等待 `poll_ready`。
- `and_then` / `then` / `map_request` / `map_response`：函数式组合。
- `boxed()`：擦除类型，得到 `BoxService`。

## 6. 与 axum / tonic 的关系

- **axum**：每个路由 handler 在底层就是 `Service<Request>`；axum 的 `Router` 本身实现 `Service`，`axum::middleware::from_fn` 最终也落在 tower `Layer` 模型上。
- **tonic**（`32-tonic-grpc.md` / `42-tonic-distributed.md`）：tonic 的拦截器（interceptor）本质是 tower `Layer`；gRPC 服务端/客户端都用 `ServiceBuilder` 串中间件。
- **hyper**：hyper 的 `service` 模块直接复用 tower `Service`。

> 理解 Tower，就理解了 Rust 整个异步网络栈的中间件通用语言。

## 7. 一句话总结

> `Service` = `async fn(req) -> res`，`Layer` = 装饰 `Service`；用 `ServiceBuilder` 把 timeout/retry/limit 串成管道。axum、tonic、hyper 全部建立在这套抽象上。
