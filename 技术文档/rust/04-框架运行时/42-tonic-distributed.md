# 42 · 分布式 tonic gRPC 集群

> 官方来源：tonic crate docs.rs（tonic-0.14.6，2026-07-12，完整）；基于 gRPC 标准 + 微服务架构知识整理（联动 `技术文档/java/24-messaging-microservices.md`）
> 说明：tonic 单机用法见 `32-tonic-grpc.md`；本文补「分布式/集群/服务治理」实战（负载均衡/服务发现/拦截器/重试/可观测），基于 gRPC 标准与 Rust 生态。

单 tonic 服务（32 章）如何扩展为**生产级分布式集群**——对标 Java 微服务（java/24）。

## 一、负载均衡（客户端）

tonic 的 `Channel` 内建 LB：

```rust
use tonic::transport::Channel;
use tower::balance::p2c::Balance;
use tower::discover::Change;

// 静态多端点
let endpoints = vec!["http://node1:50051", "http://node2:50051"];
let (mut tx, rx) = tokio::sync::mpsc::channel(10);
for ep in endpoints { tx.send(Change::Insert(ep.to_string(), ())).await.unwrap(); }
let discover = tower::discover::Change::...;   // 动态发现
let balancer = Balance::new(rx);
let channel = Channel::balance_list(vec![...].into_iter());  // 轮询
let mut client = GreeterClient::new(channel);
```

- **更常用**：服务发现（etcd/consul/k8s）动态更新端点 → `Balance` + `Discover`。
- 对比 Java：gRPC-Java 的 `NameResolver` + `LoadBalancer`（java/24）。

## 二、服务发现（Kubernetes / Consul）

- **K8s**：Headless Service 返回多个 Pod IP，客户端 watch Endpoints 变更 → 重连 `Channel`。
- **Consul**：定期查询 `catalog/services`，更新 `Discover` 流。
- **etcd**：watch key 前缀获取实例列表。
- 用 `tokio::sync::watch` 广播端点变更（见 `39-tokio-deep.md`）。

## 三、拦截器（Interceptor，类比中间件）

```rust
use tonic::{service::interceptor::Interceptor, Status, Request, Response};

#[derive(Clone)]
struct AuthInterceptor;
impl Interceptor for AuthInterceptor {
    fn intercept(&self, mut req: Request<()>) -> Result<Request<()>, Status> {
        let token = req.metadata().get("authorization").ok_or_else(|| Status::unauthenticated("no token"))?;
        req.metadata_mut().insert("x-user", token.clone());
        Ok(req)
    }
}
let svc = GreeterServer::with_interceptor(MyGreeter::default(), AuthInterceptor);
```

- 服务端拦截器做鉴权/日志/链路追踪（类比 Spring Security `java/22`、Nest 守卫 `nest/03`、Express 中间件 `node/11`）。
- 客户端拦截器注入 token（类比 `java/22` JWT 客户端）。

## 四、重试与超时

```rust
use tower::timeout::TimeoutLayer;
use tower::retry::RetryLayer;
use tower::limit::concurrency::ConcurrencyLimitLayer;

Server::builder()
    .layer(TimeoutLayer::new(Duration::from_secs(3)))      // 超时
    .layer(RetryLayer::new(...) )                           // 重试（幂等接口）
    .add_service(svc)
```

- tower 中间件栈（22 章）统一处理超时/限流/重试。
- gRPC 原生支持 `retry_policy`（via `grpc-retry`）。

## 五、可观测性

- **tracing**（tokio 官方）：结构化日志 + span，配合 `tracing-opentelemetry` 导出 Jaeger/OTLP。
- **metrics**：`tonic` 自带的 status/traffic metrics，接 Prometheus（见 `技术文档/java/23` Redis 监控同源）。
- **健康检查**：`grpc_health_probe` + `tonic_health` 实现 `grpc.health.v1.Health`（K8s liveness/readiness）。

## 六、与消息队列结合

- 同步 RPC（tonic）适合请求-响应；异步事件用 Kafka/RabbitMQ（java/24）。
- 模式：gRPC 写命令 → 发 Kafka 事件 → 其他服务消费（CQRS）。
- Rust 侧 Kafka：`rdkafka`（librdkafka 绑定，21-unsafe-ffi 风格）。

## 七、与系列对照

| 能力 | Rust (tonic+tower) | Java (gRPC+Spring) |
|---|---|---|
| 负载均衡 | Channel + Balance | gRPC-Java NameResolver |
| 拦截器 | `Interceptor` | gRPC ServerInterceptor |
| 服务发现 | K8s/Consul watch | Spring Cloud Discovery（java/24） |
| 超时/重试 | tower Layer | Resilience4j（java/24） |
| 可观测 | tracing + OTel | Micrometer + OTel |
| 健康检查 | tonic_health | Spring Actuator（java/13） |

> 至此 rust 微服务栈完整：axum(22)/tonic(32)/async-graphql(31) + tokio(39) + sqlx/redis(36) + 服务治理(42)。

> 延伸：`32-tonic-grpc.md`、`39-tokio-deep.md`、`22-web-framework-axum.md`、`技术文档/java/24-messaging-microservices.md`、`java/22-spring-security.md`。
