# 31 · async-graphql（GraphQL 服务）

> 官方来源：async-graphql Book（https://async-graphql.github.io/async-graphql/en/，项目作者 sunli829）
> 说明：官方首页确认其为「Rust 实现的 GraphQL 服务端库，类型安全、高性能、兼容 GraphQL 规范」，但子章节（schema/object/axum 集成）为目录式未抓取正文；本文基于官方文档结构与标准 API 整理。

async-graphql 是 Rust 生态主流 **GraphQL 服务端**库，配合 `22-web-framework-axum.md` 的 axum + tokio 提供 HTTP 服务。

## 一、核心概念

| GraphQL | async-graphql Rust 写法 |
|---|---|
| Schema | `#[derive(SimpleObject)]` / `Schema::build(Query, Mutation, Subscription)` |
| Query | `#[Object] impl Query { async fn ... }` |
| Mutation | `#[Object] impl Mutation { ... }` |
| Input | `#[derive(InputObject)]` |
| 标量 | `String`/`i32`/`ID` 等自动映射 |

## 二、定义 Query / Mutation

```rust
use async_graphql::{Object, SimpleObject, InputObject, Schema, Context};

#[derive(SimpleObject)]
struct User { id: i32, name: String }

#[derive(InputObject)]
struct NewUser { name: String }

struct Query;
#[Object]
impl Query {
    async fn users(&self) -> Vec<User> { vec![User { id: 1, name: "Alice".into() }] }
}

struct Mutation;
#[Object]
impl Mutation {
    async fn create_user(&self, input: NewUser) -> User {
        User { id: 2, name: input.name }
    }
}

type AppSchema = Schema<Query, Mutation, async_graphql::EmptySubscription>;

#[tokio::main]
async fn main() {
    let schema = Schema::new(Query, Mutation, async_graphql::EmptySubscription);
    // 用 axum 暴露
    let app = axum::Router::new().route("/", axum::routing::get(...));
}
```

- `#[derive(SimpleObject)]`：自动生成 GraphQL 类型（过程宏，见 `26-proc-macro-deep.md`）。
- `#[Object]`：把 impl 块方法暴露为 GraphQL resolver。
- `Context`：注入共享数据（类似 axum 的 `State`，`22-web-framework-axum.md`）。

## 三、与 axum 集成

```rust
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::extract::State;

async fn graphql_handler(
    State(schema): State<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}
```

- `async-graphql-axum` 提供 `GraphQLRequest`/`GraphQLResponse` 提取器。
- 配合 axum 路由：`router.route("/graphql", post(graphql_handler))`。
- 支持 GraphQL Playground / GraphiQL 调试 UI。

## 四、Subscription（订阅，WebSocket）

```rust
struct Subscription;
#[Subscription]
impl Subscription {
    async fn ticks(&self) -> impl futures::Stream<Item = i32> {
        futures::stream::iter(0..100)
    }
}
```

- 基于 `async-stream`，通过 WebSocket 推送（见 `18-async-await.md` 的 Stream）。

## 五、与系列对照

| async-graphql | 其他 |
|---|---|
| `#[Object]` resolver | Node GraphQL Yoga、Java GraphQL Java |
| Schema 构建 | Apollo Server、Spring GraphQL（java/13） |
| axum 集成 | Express + Apollo（node/11） |
| 类型安全编译期 | Java 需运行时 schema-first |

- GraphQL 适合前端灵活取数（对比 REST：`22-web-framework-axum.md`）；SQLx（`36-data-redis-sqlx.md`）常作 resolver 数据源。

> 延伸：`22-web-framework-axum.md`、`26-proc-macro-deep.md`、`18-async-await.md`、`技术文档/java/13-spring-boot.md`。
