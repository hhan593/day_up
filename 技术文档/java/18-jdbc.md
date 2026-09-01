# 18 - JDBC（Java 数据库连接）

> 来源：Oracle 官方 Java SE 21 API 文档 — `java.sql` 包
> 官方 API：https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/Connection.html
> 补充：Oracle《The Java™ Tutorials》JDBC 章节结构 + 标准 JDBC 用法
> 说明：Connection/DriverManager 页为 Java SE 21 官方 API（含 auto-commit 行为说明），下列机制基于官方 API 与标准 JDBC 整理。

JDBC 是 Java 访问关系型数据库的**最底层标准 API**，所有 ORM（JPA/MyBatis）最终都建立在它之上。

---

## 一、核心 API 体系

```
DriverManager        // 管理驱动、获取连接
   └─ Connection      // 一条数据库连接（含事务）
        └─ Statement / PreparedStatement / CallableStatement  // 执行 SQL
             └─ ResultSet          // 结果集（游标）
```

- Java 7+ 用 `try-with-resources` 自动关闭 `Connection`/`Statement`/`ResultSet`（均实现 `AutoCloseable`）。

---

## 二、获取连接（DriverManager）

```java
String url = "jdbc:mysql://localhost:3306/demo?useSSL=false&serverTimezone=UTC";
String user = "root", pwd = "123456";

try (Connection conn = DriverManager.getConnection(url, user, pwd)) {
    // 使用连接
}
```

- JDBC 4.0+ 驱动通过 SPI 自动注册，**无需 `Class.forName("com.mysql.cj.jdbc.Driver")`**。
- URL 格式：`jdbc:<子协议>:<子名称>`，如 `jdbc:mysql://host:port/db`、`jdbc:postgresql://...`、`jdbc:h2:mem:test`。
- 生产环境应用**连接池**（HikariCP / Druid），而非每次 `DriverManager.getConnection`（见 `13-spring-boot.md` 数据源自动配置）。

---

## 三、Statement vs PreparedStatement

### 1. Statement（拼接，有注入风险，少用）
```java
Statement st = conn.createStatement();
ResultSet rs = st.executeQuery("SELECT * FROM user WHERE id=" + id); // 危险！
```

### 2. PreparedStatement（预编译，推荐）
```java
String sql = "SELECT id, name FROM user WHERE age > ? AND city = ?";
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    ps.setInt(1, 18);
    ps.setString(2, "BJ");
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getInt("id") + ", " + rs.getString("name"));
        }
    }
}
```

- `?` 占位符预编译，**防 SQL 注入**、可复用、性能更好。
- 设置参数：`setInt` / `setString` / `setObject`（索引从 1 开始）。
- 读取结果：`rs.next()` 移动游标，`rs.getInt("列名")` / `rs.getString(列序号)`。

### 3. 增删改
```java
try (PreparedStatement ps = conn.prepareStatement(
        "INSERT INTO user(name, age) VALUES(?, ?)",
        Statement.RETURN_GENERATED_KEYS)) {
    ps.setString(1, "Tom"); ps.setInt(2, 20);
    ps.executeUpdate();
    try (ResultSet keys = ps.getGeneratedKeys()) {
        if (keys.next()) System.out.println("新主键=" + keys.getInt(1));
    }
}
```

- `executeUpdate()` 返回受影响行数；`RETRURN_GENERATED_KEYS` 可取自增主键。

---

## 四、事务控制

> 官方 API 明确（Connection 页）：**默认 `auto-commit` 模式**，每条语句执行后自动提交。

```java
conn.setAutoCommit(false);          // 关闭自动提交
try {
    ps1.executeUpdate();
    ps2.executeUpdate();
    conn.commit();                  // 手动提交
} catch (SQLException e) {
    conn.rollback();                // 回滚
}
```

- `setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED)` 设置隔离级别。
- `conn.setSavepoint()` 设保存点（部分回滚）。

---

## 五、ResultSet 遍历与元数据

```java
ResultSetMetaData md = rs.getMetaData();
int cols = md.getColumnCount();     // 列数
String name = md.getColumnName(1);  // 列名

while (rs.next()) {
    for (int i = 1; i <= cols; i++) {
        System.out.print(rs.getObject(i) + "\t");
    }
}
```

- `ResultSet` 默认**前向只读**；可设 `ResultSet.TYPE_SCROLL_INSENSITIVE` / `CONCUR_UPDATABLE` 增强。

---

## 六、批处理（Batch）

```java
try (PreparedStatement ps = conn.prepareStatement("INSERT INTO t(a) VALUES(?)")) {
    for (int i = 0; i < 1000; i++) {
        ps.setInt(1, i);
        ps.addBatch();              // 入批
    }
    int[] counts = ps.executeBatch();   // 一次性提交
}
```

- 大幅减少网络往返，导入场景必备。

---

## 七、与系列其他文档的关系

- JDBC 是 JPA / MyBatis 的底层，本篇是 19/20 的基础。
- Spring 的 `JdbcTemplate` 封装了 JDBC 样板（`13-spring-boot.md`）；`DataSource` 由连接池提供。
- 对比其他语言：JDBC ≈ Python `DB-API` / Node `mysql2` 驱动，但 Java 强类型、`ResultSet` 游标式。
- 并发执行 DB 操作时配合虚拟线程（`10-virtual-threads.md`）可提升吞吐。
