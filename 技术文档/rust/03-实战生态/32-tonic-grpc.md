an# 32 · tonic / gRPC（高性能 RPC）

> 官方来源：tonic crate docs.rs（tonic-0.14.6，2026-07-12，hyperium，文档覆盖率 100%）
> 本文**完整抓取 tonic 官方文档页正文**（transport/Server/Client/Request/Response/Status/Streaming/codegen/feature flags/tokio 集成），结合标准实战整理。

tonic 是 Rust 的 **gRPC 实现**，基于 HTTP/2，对 async/await 一等支持，构建于 tokio/hyper/tower——适合微服务间高性能通信（见 `技术文档/java/24-messaging-microservices.md`）。

## 一、定义服务（.proto）

```proto
syntax = "proto3";
package hello;
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}
message HelloRequest { string name = 1; }
message HelloReply { string message = 1; }
```

```toml
# build.rs
fn main() {
    tonic_build::compile_protos("proto/hello.proto").unwrap();
}
[dependencies]
tonic = "0.14"
prost = "0.14"
[build-dependencies]
tonic-build = "0.14"
```

## 二、服务端

```rust
use tonic::{transport::Server, Request, Response, Status};

pub mod hello { tonic::include_proto!("hello"); }
use hello::{greeter_server::{Greeter, GreeterServer}, HelloRequest, HelloReply};

#[derive(Default)]
struct MyGreeter {}

#[tonic::async_trait]
impl Greeter for MyGreeter {
    async fn say_hello(&self, req: Request<HelloRequest>) -> Result<Response<HelloReply>, Status> {
        let name = req.into_inner().name;
        Ok(Response::new(HelloReply { message: format!("Hello {name}!") }))
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "0.0.0.0:50051".parse()?;
    let greeter = MyGreeter::default();
    Server::builder()
        .add_service(GreeterServer::new(greeter))
        .serve(addr)
        .await?;
    Ok(())
}
```

- `#[tonic::async_trait]`：生成 async trait impl（重导出 async-trait，见 `26-proc-macro-deep.md`）。
- `include_proto!("hello")`：编译期引入生成代码（含 `Greeter` trait 与消息类型）。
- `Server::builder().add_service(...)`：基于 axum `router` feature。

## 三、客户端

```rust
use hello::greeter_client::GreeterClient;

let mut client = GreeterClient::connect("http://0.0.0.0:50051").await?;
let resp = client.say_hello(HelloRequest { name: "Rust".into() }).await?;
println!("{}", resp.into_inner().message);
```

- `GreeterClient::connect`：返回 `Channel`（HTTP/2 连接，带负载均衡/TLS）。
- 一元 RPC 直接 `await`；流式用 `Streaming` 类型。

## 四、核心类型（官方）

| 类型 | 说明 |
|---|---|
| `Request<T>` | RPC 请求 + 元数据 |
| `Response<T>` | RPC 响应 + 元数据 |
| `Status` | gRPC 状态（类似 HTTP 状态码，含 message/details） |
| `Streaming<T>` | 流式请求/响应 |
| `Code` | 状态码枚举（OK/NotFound/Internal 等） |

## 五、Feature flags（官方）

- `transport`（默认）：完整 client+server（tokio/hyper/tower）。
- `router`（默认）：基于 axum 的服务路由。
- `codegen`（默认）：tonic-build 支持。
- `tls-*`（rustls 提供方）、`gzip/deflate/zstd`：压缩（非默认）。
- 最大消息：解码默认 4MB、编码 `usize::MAX`（防内存耗尽）。

## 六、与系列对照

| tonic gRPC | Java |
|---|---|
| tonic + prost | gRPC-Java / grpc-spring（java/24） |
| `.proto` 同规范 | 跨语言互通（Java 客户端调 Rust 服务） |
| `Channel` | ManagedChannel |
| `Status` | io.grpc.Status |
| tokio 底层 | Netty EventLoop |

- gRPC 适合内部微服务（vs Kafka 事件驱动，java/24）；Rust gRPC 服务内存占用低、无 GC 停顿。

> 延伸：`18-async-await.md`、`22-web-framework-axum.md`、`技术文档/java/24-messaging-microservices.md`、`26-proc-macro-deep.md`。
