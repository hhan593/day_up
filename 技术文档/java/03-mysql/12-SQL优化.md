# 12 - SQL 优化

> 目标：掌握插入、主键、排序、分页、计数、更新的优化手段，配合 EXPLAIN 定位问题。

---

## 12.1 优化思路

```text
1. 定位慢 SQL：慢查询日志（19 章）
2. 分析：EXPLAIN 看执行计划（11 章）
3. 优化手段：
   - 加/改索引（最有效）
   - 改写 SQL（避免失效场景）
   - 减少数据量（分页/归档）
   - 架构层（读写分离/分库分表，见 20-22 章）
```

---

## 12.2 插入优化（INSERT）

```sql
-- ❌ 逐条插入：每次一个事务，网络与日志开销大
insert into t values (1);
insert into t values (2);
insert into t values (3);

-- ✅ 批量插入
insert into t values (1), (2), (3);

-- ✅ 手动事务包裹（减少提交次数）
start transaction;
insert into t values (1);
insert into t values (2);
insert into t values (3);
commit;

-- ✅ 主键顺序插入（避免页分裂，见 12.3）
-- ✅ 大批量可用 load data infile 导入（比 insert 快得多）
```

| 方式 | 相对速度 |
|------|---------|
| 逐条 insert | 慢（基准） |
| 批量 insert | 快数倍 |
| 事务包裹 | 更快 |
| `load data infile` | 最快 |

---

## 12.3 主键优化

InnoDB 按主键顺序组织数据（聚簇索引）：

| 插入方式 | 效果 |
|---------|------|
| **顺序主键**（自增） | 顺序追加，**无页分裂**，写入快 |
| 乱序主键（如 UUID） | 随机插入，**频繁页分裂**，性能差 |

```sql
-- ❌ 用 UUID 作主键（随机、占空间、页分裂）
-- ✅ 用自增 BIGINT 作主键
create table t (id bigint primary key auto_increment, ...);
```

> 分库分表场景可用**雪花算法**生成趋势递增的 ID，兼顾唯一与顺序性。

---

## 12.4 ORDER BY 优化

排序有两种：

| 方式 | 说明 | 性能 |
|------|------|------|
| `Using index` | 索引本身有序，直接读 | ✅ 好 |
| `Using filesort` | 无合适索引，内存/磁盘排序 | ❌ 需优化 |

```sql
-- 建索引
create index idx_age on tb_user(age);

-- ✅ 走索引排序（Extra: Using index）
select * from tb_user order by age;

-- ❌ Using filesort
select * from tb_user order by name;   -- name 无索引
```

**优化手段**：
1. 给排序字段建索引。
2. 联合索引时，`where` 和 `order by` 字段顺序要符合**最左前缀**。
3. 排序字段尽量都用**同方向**（都升或都降）。

---

## 12.5 GROUP BY 优化

```sql
-- GROUP BY 本质是先排序后分组，可用索引优化
create index idx_gender_age on tb_user(gender, age);

-- ✅ 走索引
select gender, count(*) from tb_user group by gender;
```

> 8.0 之前会隐式排序，8.0 起 `group by` 不再隐式排序（想排序要显式 `order by`）。

---

## 12.6 LIMIT 深分页优化

```sql
-- ❌ 深分页慢：要扫描前 1000000 行再丢弃
select * from tb_user limit 1000000, 10;

-- ✅ 优化一：主键连续时用 WHERE 定位（推荐）
select * from tb_user where id > 1000000 order by id limit 10;

-- ✅ 优化二：覆盖索引 + 关联（延迟关联）
select u.* from tb_user u
inner join (select id from tb_user order by id limit 1000000, 10) t
on u.id = t.id;
```

> 深分页的核心问题：`limit 大偏移` 要扫描并丢弃大量行。用「**游标分页**（记住上次最大 id）」最优。

---

## 12.7 COUNT 优化

| 语句 | 说明 | 速度 |
|------|------|------|
| `count(*)` | 统计所有行（含 NULL） | InnoDB 优化过，**推荐** |
| `count(1)` | 同上 | 与 `count(*)` 接近 |
| `count(主键)` | 统计非 NULL 主键 | 稍慢 |
| `count(字段)` | 统计该字段非 NULL 的行 | 最慢（需判断 NULL） |

> InnoDB 不像 MyISAM 保存了行数，`count(*)` 需遍历索引（选**最小的索引**扫描）。大数据量计数建议用**缓存/计数表**，不要实时 `count`。

---

## 12.8 UPDATE 优化

```sql
-- InnoDB 行锁是基于索引的
-- ✅ 走索引：只锁匹配行
update tb_user set age = 20 where id = 1;

-- ❌ 不走索引：锁全表所有行（行锁升级为表锁效果）
update tb_user set age = 20 where name = '张三';   -- name 无索引
```

> **重点**：`UPDATE` 的条件**必须走索引**，否则 InnoDB 会给所有扫描到的行加锁，造成大面积阻塞。

---

## 12.9 综合案例

```sql
-- 场景：订单表深分页 + 排序慢
create table tb_order (
    id          bigint primary key auto_increment,
    user_id     bigint,
    status      tinyint,
    create_time datetime,
    amount      decimal(10,2)
);

-- 问题 SQL
select * from tb_order where status = 1 order by create_time desc limit 1000000, 10;

-- 优化 1：建联合索引（最左 status，再 create_time）
create index idx_status_time on tb_order(status, create_time);

-- 优化 2：延迟关联（先查主键，再取整行）
select o.* from tb_order o
inner join (
    select id from tb_order
    where status = 1
    order by create_time desc
    limit 1000000, 10
) t on o.id = t.id;

-- 优化 3：游标分页（记住上次最大 create_time / id）
select * from tb_order
where status = 1 and id < 上次最大id
order by id desc limit 10;
```

---

## 小结

- 优化第一步：**慢查询日志 + EXPLAIN**。
- 插入：批量 + 事务 + `load data infile`；主键用**自增顺序**。
- 排序分组：建索引避免 `Using filesort` / `Using temporary`。
- 深分页：用**游标分页**或**延迟关联**。
- 计数：`count(*)` + 缓存；更新：条件**必须走索引**。

## 练习

1. 用 EXPLAIN 对比普通分页与延迟关联分页的执行计划。
2. 说明为什么 UUID 作主键性能差。
3. 为什么 `update ... where 非索引列` 会锁很多行？
4. 写出 `count(*)` / `count(1)` / `count(字段)` 的区别。

→ 下一篇：[13-视图](./13-视图.md)
