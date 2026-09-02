# 37 · Actix Web 深入

> 官方来源：Actix Web Docs（https://actix.rs/docs/，Actix Team，2026）
> 说明：官方文档欢迎页确认章节结构（Introduction/Basics/Advanced/Protocols/Patterns），本文基于标准 Actix Web API 整理（Handler/extractors/middleware/state/error/WebSocket/testing）。

`22-web-framework-axum.md` 已讲 axum；Actix Web 是更老牌、性能极高的 Rust Web 框架，底层用 **actor 模型**（见 `29-actor-frameworks.md`）。

## 一、应用与路由

```rust
use actix_web::{web, App, HttpServer, Responder};
use actix_web::get;

#[get("/")]
async fn index() -> impl Responder {
    "Hello Actix"
}

async fn create_user(body: web::Json<User>) -> impl Responder {
    web::Json(body.into_inner())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(index)
            .route("/users", web::post().to(create_user))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
```

- `#[get("/")]` 属性宏定义路由（过程宏，见 `26-proc-macro-deep.md`）。
- `#[actix_web::main]`：在 actix runtime 上运行（基于 tokio，见 `39-tokio-deep.md`）。

## 二、Extractors（提取器）

- `web::Json<T>`、`web::Path<T>`、`web::Query<T>`、`web::Data<T>`、`web::Bytes`。
- 与 axum 的 `extract`（22 章）对应；Actix 用 `web::` 命名空间。

```rust
async fn show(path: web::Path<u32>, q: web::Query<Search>) -> impl Responder { ... }
```

## 三、应用状态（App State）

```rust
let data = web::Data::new(AppState::default());
App::new().app_data(data.clone()).service(...)
// handler 中 web::Data<AppState>
```

- `web::Data<T>` 是 `Arc<T>` 包装，类似 axum `State`、Spring `@Autowired`（java/13）。

## 四、中间件

```rust
use actix_web::middleware::Logger;
App::new().wrap(Logger::default())
```

- `wrap` 包裹（类似 axum `layer`、Express 中间件 node/11）。
- 自定义：实现 `Transform` trait（actor 式中间件）。

## 五、错误处理

- 实现 `ResponseError` trait 让类型直接作为响应：

```rust
impl actix_web::ResponseError for MyError { /* 映射状态码 */ }
async fn handler() -> Result<impl Responder, MyError> { ... }
```

- 与 `08-Rust错误处理知识手册.md` 的 `Result` 哲学一致。

## 六、WebSocket

```rust
use actix_web::{web, App, HttpServer, HttpRequest, HttpResponse};
use actix_web_actors::ws;
// 用 actor 处理 ws 帧（见 29-actor-frameworks.md）
```

- Actix Web 的 WebSocket 建立在 actor 之上，性能极高。

## 七、测试

- `actix_web::test`：构造 `TestRequest`、`call_service`，配合 `trybuild`。
- 对比 Nest 的 e2e（nest 测试）、JUnit（java/17）、node:test（13 章）。

## 八、axum vs Actix 选型

| 维度 | axum（22） | Actix Web（本文） |
|---|---|---|
| 底层 | tower/hyper | actix actor |
| 中间件 | `layer`（tower） | `wrap`（Transform） |
| 生态统一性 | 与 tokio 全家桶统一 | 自成体系 |
| 性能 | 高 | 极高（actor） |

- 新项目多选自 axum（与 tokio 统一）； Actix 仍大量存量系统。

> 延伸：`22-web-framework-axum.md`、`29-actor-frameworks.md`、`39-tokio-deep.md`、`技术文档/java/13-spring-boot.md`。
