# 49. tracing 可观测性（结构化日志与分布式追踪）

> 来源可信度：**完整正文级**（基于 docs.rs `tracing 0.1.44`，2026-06-14 文档；MSRV 1.65）
> 适用：需要结构化日志、异步上下文追踪、对接 OpenTelemetry 的服务（配合 `22-web-framework-axum.md`、`39-tokio-deep.md`）

## 1. tracing 是什么

官方定义：*"tracing is a framework for instrumenting Rust programs to collect structured, event-based diagnostic information."*

核心动机（官方原文）：

> 在 Tokio 这类异步系统中，传统日志很难解读——多个任务复用同一线程，事件与日志行交织。tracing 通过记录带**时序与因果关系**的结构化事件来解决：与日志消息不同，**span 有开始和结束时间**，可被进入/退出，且能嵌套成树。

三大核心概念：**Span（时间段）**、**Event（时间点）**、**Subscriber（收集器）**。

```toml
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
```

## 2. Span：表示一段时间

```rust
use tracing::{span, Level};

let span = span!(Level::TRACE, "my_span");
// enter 返回 RAII guard，drop 时退出 span
let _enter = span.enter();
// ... 在 my_span 上下文中执行 ...
```

官方警告：

> ⚠️ 在 async/await 异步代码中，若把 `enter()` 返回的 guard **跨 await 点持有**，会产生错误的 trace。异步场景应改用 `#[instrument]` 或 `Instrument` trait。

## 3. Event：表示某个时刻

```rust
use tracing::{event, span, Level};

event!(Level::INFO, "something happened");   // span 外

let span = span!(Level::INFO, "my_span");
let _guard = span.enter();
event!(Level::DEBUG, "something happened inside my_span");
```

## 4. #[instrument] 属性（最常用）

```rust
use tracing::{Level, event, instrument};

#[instrument]
pub fn my_function(my_arg: usize) {
    // 每次调用自动创建并进入名为 my_function 的 span
    // 参数 my_arg 会作为字段以 fmt::Debug 记录
    event!(Level::INFO, "inside my_function!");
}
```

无法加属性的外部函数，用 `in_scope` 包裹同步代码：

```rust
use tracing::info_span;
let json = info_span!("json.parse").in_scope(|| serde_json::from_slice(&buf))?;
```

## 5. 记录字段

```rust
// 命名字段
event!(Level::INFO, answer = 42, question = "life, the universe, and everything");

// 局部变量简写（类似结构体初始化）
let user = "ferris";
span!(Level::TRACE, "login", user);          // 等价 user = user

// 点号字段名 + 结构体字段简写
let user = User { name: "ferris", email: "ferris@rust-lang.org" };
span!(Level::TRACE, "login", user.name, user.email);

// 非标识符/保留字用引号
span!(Level::TRACE, "api", "guid:x-request-id" = "abcdef", "type" = "request");

// 常量作字段名（用花括号）
const RESOURCE_NAME: &str = "foo";
span!(Level::TRACE, "get", { RESOURCE_NAME } = "some_id");

// ? = Debug，% = Display
event!(Level::TRACE, greeting = ?my_struct);        // Debug
event!(Level::TRACE, greeting = %my_struct.field);  // Display

// 延迟记录（Empty）
use tracing::{trace_span, field};
let span = trace_span!("my_span", greeting = "hello world", parting = field::Empty);
span.record("parting", &"goodbye world!");

// 带格式化消息
event!(
    Level::DEBUG,
    question.answer = answer,
    question.tricky = true,
    "the answer to {} is {}.", question, answer
);
```

> 官方说明：以这种方式指定格式化消息**默认不分配内存**。

## 6. 简写宏

| 事件 | Span |
|------|------|
| `trace!` | `trace_span!` |
| `debug!` | `debug_span!` |
| `info!` | `info_span!` |
| `warn!` | `warn_span!` |
| `error!` | `error_span!` |

## 7. Subscriber：收集数据

官方明确：**tracing 本 crate 不含任何 Subscriber 实现**，由其他 crate 提供（如 `tracing-subscriber`）。

```rust
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

// 简单：输出到 stdout，用 RUST_LOG 控制级别
tracing_subscriber::fmt()
    .with_env_filter(EnvFilter::from_default_env())   // RUST_LOG=info
    .init();

// 生产：JSON 格式 + 多 layer
tracing_subscriber::registry()
    .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
    .with(fmt::layer().json())
    .init();
```

> ⚠️ 官方警告：**库不应调用 `set_global_default()`**，否则可执行文件再设置时会冲突。只有 bin crate 才初始化 subscriber。

## 8. 完整例子：axum + tracing 请求追踪

```rust
use axum::{routing::get, Router};
use tracing::{info, instrument, warn, Level};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() {
    // 初始化 subscriber（只在 bin 里做一次）
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new().route("/users/:id", get(get_user));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    info!("server listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

#[instrument]                       // 自动建 span，记录 id
async fn get_user(id: u32) -> String {
    // span 内再建子 span
    let _db = tracing::info_span!("db.query", table = "users").entered();
    let name = query_db(id).await;
    info!(user = %name, "loaded user");
    name
}

#[instrument(err)]                  // err：出错时自动记录 error 字段
async fn query_db(id: u32) -> Result<String, sqlx::Error> {
    if id == 0 {
        warn!("invalid id");
    }
    Ok(format!("user-{id}"))
}
```

`#[instrument]` 常用参数：`err`（记录错误）、`ret`（记录返回值）、`skip(field)`（跳过字段）、`fields(...)`（加自定义字段）、`level = "debug"`。

## 9. 对接 OpenTelemetry

官方列出的生态 crate 中，`tracing-opentelemetry` 提供向 OTel 兼容系统导出 trace。

```toml
tracing-opentelemetry = "0.31"
opentelemetry = "0.30"
opentelemetry_sdk = { version = "0.30", features = ["rt-tokio"] }
```

```rust
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

let tracer = /* 初始化 OTel tracer */;
tracing_subscriber::registry()
    .with(tracing_opentelemetry::layer().with_tracer(tracer))
    .init();
```

> 与 Java `30-可观测性.md`、Node `19-诊断与追踪.md`、Next `19-监控.md` 同走 OTLP 体系，跨语言链路可串。

## 10. 生态 crate（官方列出，节选）

| crate | 用途 |
|-------|------|
| `tracing-subscriber` | Subscriber 实现 + `FmtSubscriber`、过滤、格式化 |
| `tracing-futures` | 给 Future/Stream/Executor 附加 span |
| `tracing-log` | 把 `log` 记录转为 tracing Event |
| `tracing-appender` | 文件输出、非阻塞 writer |
| `tracing-opentelemetry` | 导出到 OpenTelemetry |
| `tracing-actix-web` | actix-web 集成（见 `37-actix-web-deep.md`） |
| `tracing-tracy` | Tracy 性能剖析 |
| `tracing-loki` | 发到 Grafana Loki |
| `tracing-wasm` / `tracing-web` | 浏览器 console + User Timing API |

## 11. 与 log crate 互操作

- feature `log`：若**没有**活跃 tracing Subscriber，事件会发出 log 记录（适合库）。
- feature `log-always`：即使有 Subscriber 也发 log（适合应用）。
- `tracing-log`：让 tracing Subscriber 消费 `log` 记录（依赖用了 log 时有用）。

## 12. 一句话总结

> tracing 用 **Span（时间段）+ Event（时刻）+ Subscriber（收集）** 三件套做结构化诊断；`#[instrument]` 自动给函数加 span（注意别跨 await 持有 guard）；字段用 `?`（Debug）/`%`（Display）标记；库只依赖 tracing，可执行程序才装 Subscriber；`tracing-opentelemetry` 对接分布式追踪。
