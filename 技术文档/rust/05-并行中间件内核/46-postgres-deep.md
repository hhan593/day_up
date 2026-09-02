# 46. Rust + PostgreSQL 深入（sqlx 实战）

> 来源可信度：**完整正文级**（基于 docs.rs `sqlx 0.9.0`，2026-07-20 文档；sqlx-postgres 0.9.0）
> 关联：`36-data-redis-sqlx.md`（已含 sqlx 入门）

## 1. 为什么选 sqlx（而非 diesel）

| 特性 | sqlx | diesel |
|------|------|--------|
| 编译期 SQL 检查 | ✅（通过宏连库校验） | ✅（DSL 类型安全） |
| 异步 | ✅ 原生 async | 需 `async` feature |
| 运行时 | tokio/async-std | 同步为主 |
| 写法 | 原生 SQL 字符串 | 查询 DSL |

sqlx = **编译期校验的纯 SQL** + **原生异步**，适合已经熟悉 SQL、想保留手写语句灵活性的场景。

```toml
sqlx = { version = "0.9", features = ["runtime-tokio", "postgres", "macros", "migrate", "chrono"] }
```

## 2. 连接池（PgPool）

```rust
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool: PgPool = PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(std::time::Duration::from_secs(3))
        .idle_timeout(std::time::Duration::from_secs(60))
        .connect("postgres://user:pass@localhost:5432/app")
        .await?;

    Ok(())
}
```

- `PgPool` = `Pool<Postgres>` 别名；`PgPoolOptions` 配置连接数、超时。
- 池是 `Clone` 且 `Send + Sync`，可放进 axum 的 `State`（`22-web-framework-axum.md` / `37-actix-web-deep.md`）。
- `PgTransaction` = `Transaction<Postgres>`，用于事务。

## 3. 查询：query / query_as

```rust
use sqlx::Row;

// 原始行：query（返回 PgRow）
let row = sqlx::query("SELECT id, name FROM users WHERE id = $1")
    .bind(1_i32)
    .fetch_one(&pool)
    .await?;
let name: &str = row.try_get("name")?;

// 映射到结构体：query_as（编译期校验字段）
#[derive(sqlx::FromRow)]
struct User { id: i32, name: String }

let user = sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE id = $1")
    .bind(1_i32)
    .fetch_one(&pool)
    .await?;
```

- `query` 用 `Row::try_get` 手动取列；`query_as` + `FromRow` 自动映射。
- **编译期校验**：`query!` / `query_as!` 宏（注意带 `!`）会在编译时连库检查 SQL 与列类型；需 `DATABASE_URL` 环境变量与可达数据库。
- `fetch_one` / `fetch_optional` / `fetch_all` / `fetch`(流式)。

## 4. 编译期校验宏 vs 运行时 API

```rust
// 编译期校验：SQL 错或列类型不符 → 编译失败（需 DATABASE_URL 可达）
let u = sqlx::query_as!(User, "SELECT id, name FROM users WHERE id = $1", 1_i32)
    .fetch_one(&pool).await?;

// 运行时：不连库，灵活但错误推迟到运行期
let u = sqlx::query_as::<_, User>("SELECT id, name FROM users WHERE id = $1")
    .bind(1_i32).fetch_one(&pool).await?;
```

**取舍**：CI 里用校验宏保证 SQL 正确；本地快速迭代可用运行时 API。

## 5. 事务

```rust
let mut tx = pool.begin().await?;
sqlx::query("INSERT INTO accounts (name, balance) VALUES ($1, $2)")
    .bind("alice").bind(100_i64)
    .execute(&mut *tx).await?;
sqlx::query("UPDATE accounts SET balance = balance - $1 WHERE name = $2")
    .bind(50_i64).bind("bob")
    .execute(&mut *tx).await?;
tx.commit().await?;   // 或 tx.rollback().await?
```

## 6. 类型映射与 JSONB

```rust
use serde_json::Value;
use sqlx::types::Json;

// JSONB 列直接用 Json<T> 包裹
let v: Json<Value> = row.try_get::<Json<Value>, _>("payload")?;

// 自定义类型实现 Type + Decode + Encode 即可映射
```

sqlx 支持 `chrono`/`time`/`uuid`/`json`/`decimal` 等，通过 feature 开启（如 `chrono`、`uuid`、`json`、`decimal`）。

## 7. 迁移（migrate）

```bash
# 初始化迁移目录
sqlx migrate add create_users

# 编写 up.sql / down.sql
# 执行迁移
sqlx migrate run
# 或代码内执行
sqlx::migrate!("./migrations").run(&pool).await?;
```

- `migrate` feature 提供 `sqlx::migrate!` 宏，在运行时自动执行 `./migrations` 下脚本。
- 也可用 `sqlx-cli` 离线管理迁移，CI 中 `sqlx migrate run`。

## 8. 与 axum 组合（State 注入）

```rust
use axum::{State, routing::get, Router};

async fn list(State(pool): State<PgPool>) -> String {
    let n = sqlx::query_scalar::<_, i64>("SELECT count(*) FROM users")
        .fetch_one(&pool).await.unwrap();
    format!("users: {n}")
}

fn app(pool: PgPool) -> Router {
    Router::new().route("/count", get(list)).with_state(pool)
}
```

## 9. 一句话总结

> sqlx 0.9 提供编译期校验的纯异步 SQL：用 `PgPool` 做池、`query_as!` 编译期查列、`fetch_*` 流式取数、事务 `begin/commit`，迁移用 `sqlx::migrate!`。注入 axum `State` 即可服务化。
