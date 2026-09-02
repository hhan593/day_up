# 22 · Web 框架与后端生态（axum / Actix / tokio）

> 官方来源：axum（https://docs.rs/axum/）、Actix Web（https://actix.rs/）、tokio（https://tokio.rs/）
> 说明：基于官方文档结构与标准 API 整理；tokio 异步运行时见 `18-async-await.md`。

Rust 后端生态以 **tokio（异步 runtime）+ axum/Actix（Web 框架）** 为主，性能对标 Go/Java，内存安全无 GC。

## 一、axum（推荐，基于 tokio + tower）

axum 用 `tower` 中间件栈、`hyper` 作为 HTTP 底层，与 tokio 无缝集成。

```rust
use axum::{
    routing::{get, post},
    Json, Router, extract::Path,
};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct User { id: u32, name: String }

async fn get_user(Path(id): Path<u32>) -> Json<User> {
    Json(User { id, name: "Alice".into() })
}

async fn create_user(Json(user): Json<User>) -> Json<User> {
    user
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/users/:id", get(get_user))
        .route("/users", post(create_user));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

- 路由用 `Router::new().route(path, method(handler))`。
- handler 是 `async fn`，参数用 `extract`（Path/Json/Query/State），返回 `Json`/字符串/响应。
- **类型安全路由**：`:id` 自动解析为 `Path<u32>`，编译期校验。

## 二、中间件（tower）

```rust
use tower::ServiceBuilder;
use tower_http::trace::TraceLayer;

let app = Router::new()
    .route("/", get(|| async { "ok" }))
    .layer(ServiceBuilder::new().layer(TraceLayer::new_for_http()));
```

- `tower_http` 提供 CORS、限流、超时、压缩、追踪。
- 与 Express 中间件（`node/11-express.md`）、Nest 守卫（`nest/03`）对照：axum 用 `layer` 组合，Nest 用装饰器。

## 三、状态共享

```rust
use axum::extract::State;
use std::sync::Arc;

#[derive(Clone)]
struct AppState { db: Arc<Db> }

async fn handler(State(state): State<AppState>) { /* 用 state.db */ }

let app = Router::new().route("/", get(handler)).with_state(AppState { db: Arc::new(Db) });
```

- `State` 提取器注入共享状态（类似 Spring 的 `@Autowired`、Nest 的注入）。

## 四、Actix Web（老牌高性能）

```rust
use actix_web::{get, App, HttpServer, Responder};

#[get("/")]
async fn index() -> impl Responder { "Hello" }

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(index))
        .bind(("127.0.0.1", 8080))?
        .run().await
}
```

- Actix 用 actor 模型（独立 `actix` crate），性能极高；axum 更现代、与 tokio 生态统一。

## 五、ORM / 数据库

- `sqlx`：异步、编译期检查 SQL（无宏运行时解析），支持 Postgres/MySQL/SQLite。
- `diesel`：同步、类型安全查询构建（类 Java JPA `java/19`）。
- `sea-orm`：基于 sqlx 的 ActiveRecord 风格 ORM。

## 六、与系列对照

| Rust (axum) | 其他 |
|---|---|
| `Router` + `route` | Express `app.get`（`node/11`）、Nest `@Controller` |
| `extract` (Path/Json) | Spring `@PathVariable`/`@RequestBody`（java/13） |
| `State` | Spring `@Autowired` / Nest DI |
| `layer` 中间件 | Express 中间件 / Nest 拦截器 |
| `tokio::spawn` | Java 虚拟线程（java/10）/ Go goroutine |
| `sqlx` | Java JDBC/JPA、Node prisma |

- Rust Web 服务内存占用低、无 GC 停顿、编译期并发安全——适合高并发网关/微服务（java/24）。

> 延伸：`18-async-await.md`（tokio）、`17-concurrency-parallel.md`、`技术文档/java/13-spring-boot.md`、`技术文档/nest/03-NestJS守卫.md`。
