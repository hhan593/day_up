# 36 · 数据层深入：Redis 与 SQLx

> 官方来源：redis crate docs.rs（redis-1.6.0，2026-08-15，文档覆盖率 100%）；sqlx crate docs.rs（sqlx-0.9.0，2026-07-20，文档覆盖率 100%）
> 本文**完整抓取 redis-rs 与 sqlx 官方文档页正文**（连接/池/Commands/TypedCommands/PubSub/异步 + query!宏/事务/Pool/编译期检查），结合标准实战整理。

Rust 数据层两大主流：**redis-rs**（缓存，对照 `技术文档/java/23-redis-cache.md`）、**sqlx**（异步 SQL，对照 `技术文档/java/19-jpa.md`/`20-mybatis.md`）。

## 一、redis-rs（缓存）

### 同步连接
```rust
use redis::Commands;
let client = redis::Client::open("redis://127.0.0.1/")?;
let mut con = client.get_connection()?;
con.set("key", 42)?;
let v: i32 = con.get("key")?;
```

### 异步（tokio）
```rust
use redis::AsyncTypedCommands;
let client = redis::Client::open("redis://127.0.0.1/")?;
let mut con = client.get_multiplexed_async_connection().await?;   // 廉价可克隆
con.set("key1", b"foo").await?;
```

### 连接池
- 同步：`r2d2` / `bb8` feature（多线/断线处理）。
- 异步：`MultiplexedConnection` 本身线程安全、可廉价 clone，通常无需池；需自动重连用 `connection-manager` feature。

### 类型转换
- `FromRedisValue`（Redis → Rust）、`ToRedisArgs`（Rust → Redis）：支持 `Vec`/`HashMap`/`Option`/`HashSet`。

### PubSub（发布订阅）
```rust
let (mut sink, mut stream) = client.get_async_pubsub().await?.split();
sink.subscribe("ch1").await?;
while let Some(msg) = stream.next().await { /* 处理 */ }
```

### Feature 摘要
- `tokio-comp`/`smol-comp`：异步运行时
- `r2d2`/`bb8`：连接池；`cluster`/`sentinel`/`json`：按需启用
- RESP3 PubSub（Redis 6+）同连接收消息

## 二、sqlx（异步 SQL，编译期检查）

### query! 宏（核心特性）
```rust
// 编译期连接数据库校验 SQL 语法/列类型（需 DATABASE_URL 或离线 .sqlx）
let rows = sqlx::query!("SELECT id, name FROM users WHERE id = $1", 1i32)
    .fetch_all(&pool).await?;
for r in rows { println!("{}: {}", r.id, r.name); }   // 类型安全！
```

- `query!`：编译期检查 SQL（语法+列+绑定），返回强类型行（字段即 `r.id: i32`）。
- `query_as!`：映射到结构体；`query_scalar!`：取单列；`query_file!`：SQL 走外部文件。
- `query_unchecked!`：跳过检查（仅语法解析）。

### 连接池
```rust
use sqlx::postgres::PgPoolOptions;
let pool = PgPoolOptions::new()
    .max_connections(5)
    .connect("postgres://user:pass@localhost/db").await?;
// 注入 axum State 共享（22-web-framework-axum.md）
```

- 类型别名：`PgPool`/`MySqlPool`/`SqlitePool`。
- 异步运行时：feature `runtime-tokio`（默认优先）/ `runtime-async-std`。

### 事务
```rust
let mut tx = pool.begin().await?;
sqlx::query!("INSERT INTO t (v) VALUES ($1)", 1).execute(&mut *tx).await?;
tx.commit().await?;          // 或 tx.rollback()
```

### 数据库支持
- Postgres / MySQL / SQLite / Any（运行时选择）。
- 迁移：`sqlx::migrate!()` 内嵌迁移脚本。

## 三、与系列对照

| Rust | Java | Node |
|---|---|---|
| redis-rs | Spring Data Redis（java/23） | ioredis |
| sqlx `query!` | JPA/Hibernate（java/19）类型安全 | prisma（运行时） |
| `PgPool` + axum `State` | HikariCP + Spring（java/13） | pg Pool |
| 编译期 SQL 检查 | 无（运行时） | 无 |

- sqlx 的「编译期校验」是 Rust 类型安全哲学在 DB 层的延伸（对比 Java MyBatis 字符串 SQL 风险，`20-mybatis.md`）。
- redis-rs 与 `java/23` 缓存三大问题（穿透/击穿/雪崩）对策完全一致。

## 四、实战组合

```
axum(22) → sqlx/PgPool(36) + redis-rs(36) + tokio(18)
         → gRPC(32) 或 GraphQL(31) 暴露
```

> 至此 rust 数据层与 Web/微服务形成完整后端栈。

> 延伸：`22-web-framework-axum.md`、`18-async-await.md`、`技术文档/java/19-jpa.md`、`20-mybatis.md`、`23-redis-cache.md`、`32-tonic-grpc.md`、`31-async-graphql.md`。
