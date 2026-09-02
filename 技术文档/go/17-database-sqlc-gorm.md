# 17. Go 数据库：database/sql、sqlc 与 GORM

> 来源可信度：**标准实践**（基于 `database/sql` 标准库、sqlc 官方、GORM 官方文档结构）
> 关联：`08-json-files-io.md`、`15-performance-benchmark-race.md`

## 1. 标准库 database/sql

Go 官方提供**泛型化**的数据库接口，具体驱动插件式接入（如 `lib/pq`、`go-sql-driver/mysql`、`pgx`）。

```go
import (
    "database/sql"
    _ "github.com/lib/pq" // 仅副作用注册驱动
)

db, _ := sql.Open("postgres", "user=... dbname=...")
defer db.Close()

var name string
db.QueryRow("SELECT name FROM users WHERE id = $1", 1).Scan(&name)

rows, _ := db.Query("SELECT id, name FROM users")
defer rows.Close()
for rows.Next() {
    var id int; var n string
    rows.Scan(&id, &n)
}
```

- 用 `DB` 连接池（`SetMaxOpenConns`/`SetMaxIdleConns`）。
- 防注入：永远用参数占位（`$1`/`?`），不要字符串拼接。

## 2. sqlc：编译期生成类型安全查询

sqlc 让你写**纯 SQL**，自动生成 Go 类型安全代码（类似 Rust sqlx 的 `query_as!`，但更偏 DSL 无关）：

```sql
-- queries/user.sql
-- name: GetUser :one
SELECT id, name, email FROM users WHERE id = $1;
```

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "queries/"
    schema:  "migrations/"
    gen:
      go:
        package: "db"
        out:    "internal/db"
```

```bash
sqlc generate
```

生成 `GetUser(ctx, id)` 返回 `(User, error)`——**SQL 错误在生成时暴露**，运行期无需手写 `Scan`。适合需要强类型且信任 SQL 的团队。

## 3. GORM：全功能 ORM

```go
import "gorm.io/gorm"

type User struct {
    ID    uint   `gorm:"primaryKey"`
    Name  string
    Email string `gorm:"uniqueIndex"`
}

db.Where("name = ?", "alice").First(&user)
db.Create(&User{Name: "bob", Email: "b@x.com"})
db.Model(&user).Update("name", "bobby")
db.Delete(&user)
```

- 优点：迁移（`AutoMigrate`）、关联、钩子、软删除开箱即用。
- 缺点：抽象泄漏、N+1 风险、复杂查询不直观。
- 实践：**简单 CRUD 用 GORM，复杂报表/高性能走 sqlc/原生 SQL**。

## 4. 选型对照

| 方案 | 类型安全 | 灵活度 | 学习成本 | 适用 |
|------|---------|--------|---------|------|
| database/sql | 手动 Scan | ⭐⭐⭐ | 低 | 一切 |
| sqlc | 编译期生成 | ⭐⭐⭐ | 中 | 重 SQL、要安全 |
| GORM | 运行时 | ⭐⭐ | 中 | 快速 CRUD |

## 5. 事务

```go
tx := db.Begin()
defer func() {
    if r := recover(); r != nil { tx.Rollback() }
}()
tx.Create(&u1); tx.Create(&u2)
tx.Commit()
```

`database/sql` 与 GORM 都支持 `Begin/Commit/Rollback`；sqlc 生成的函数接受 `db Tx` 接口，事务/连接池通用。

## 6. 一句话总结

> Go 数据库三层：标准库 `database/sql`（_pool + 参数化）打底；sqlc 把 SQL 编译成类型安全代码；GORM 提供 ORM 便利。重 SQL 选 sqlc，重速度选 GORM，永远参数化防注入。
