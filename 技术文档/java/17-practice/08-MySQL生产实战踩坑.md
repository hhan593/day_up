# 08 · MySQL 生产实战踩坑

> SQL 语法都懂，生产照样翻车。本篇收的是"上线后才会遇到"的坑：DDL、隐式转换、锁等待、大事务。
> 基础见 `../03-mysql/`（00-22）；优化手段见 `../03-mysql/12-SQL优化.md`。

---

## 一、大表 DDL：凌晨改表翻车的正确打开方式

**坑**：直接 `alter table add column` 在千万级大表上会长时间锁表（低版本），业务写入阻塞全站报错。

| 方案 | 原理 | 适用 |
|------|------|------|
| **MySQL 8.0 INSTANT** | `add column` 仅改元数据，秒级 | 8.0+ 加列场景（默认算法即 instant） |
| **gh-ost** | 影子表 + binlog 迁移，可暂停可限流 | 大表首选，可控性最好 |
| pt-online-schema-change | 触发器同步，老牌 | gh-ost 不可用时的替代 |

```bash
# gh-ost 示例：在线改表，限流保护主库
gh-ost --host=... --database=shop --table=tb_order \
  --alter="ADD COLUMN remark varchar(200)" \
  --max-load=Threads_running=50 \
  --chunk-size=1000 --allow-on-master --execute
```

**规程**：任何 DDL 先在预发同量级数据上演练 → 评估时长 → 低峰执行 → 备好回滚方案。`rename table` 秒级原子，是"换表"类变更的利器。

---

## 二、隐式类型转换：索引悄悄失效的第一杀手

```sql
-- phone 是 varchar(11)，建了索引
explain select * from tb_user where phone = 13800138000;   -- ❌ 传了数字
-- type=ALL，全表扫描！MySQL 把每行的 phone 转成数字比较，索引作废
explain select * from tb_user where phone = '13800138000'; -- ✅ type=ref
```

**为什么危险**：SQL 完全能跑、单测/测试库数据少感知不到、数据量涨上去后突然全表超时。代码层是 MyBatis 参数类型传错（`#{phone}` 传了 Long）。

**排查**：
```sql
show index from tb_user;    -- 确认索引在
explain ...                  -- type=ALL + key=NULL → 疑似隐式转换
```

同类坑：`where date_col = '2026-09-20'` 与 `datetime` 比较 OK，但 `where date_col = 20260920` 失效；联合索引里字符集不一致（utf8 vs utf8mb4）导致 join 走不了索引。

---

## 三、锁等待与死锁：线上排查 SOP

现象：接口偶发超时，日志有 `Lock wait timeout exceeded`。

```sql
-- 1. 谁在持有/等待锁
select * from information_schema.innodb_trx\G     -- 运行中事务（看 trx_started，找长事务）
select * from sys.innodb_lock_waits\G             -- 8.0 现成的等待关系视图
--   能直接看到 blocking_pid / waiting_pid

-- 2. 杀掉肇事长事务（先确认业务无影响）
kill <blocking_pid>;

-- 3. 看最近死锁细节
show engine innodb status\G    -- LATEST DETECTED DEADLOCK 段
```

**高频根因**（与 `../03-mysql/16-锁.md` 对应）：
1. **事务里混入远程调用/慢逻辑** → 事务拖长 → 锁持有久（呼应 `03-Spring事务失效实战清单.md` ⑥）。
2. **两个事务以不同顺序更新同一批行** → 死锁。修：固定按主键排序更新。
3. **无索引更新** → 行锁锁全表所有扫描行。修：条件走索引。

---

## 四、大事务：undo 膨胀与主从延迟的元凶

一次事务插/改 10 万行：
- undo log 巨大 → 回滚代价高、 MVCC 链长；
- binlog 一次写一大坨 → **从库单线程回放这一大坨，主从延迟飙到分钟级**（`../03-mysql/20-主从复制.md`）；
- 锁持有数分钟 → 沿途业务全阻塞。

**改造**：批处理改分批提交（每 1000~5000 行一个事务）：

```java
for (List<Row> batch : Lists.partition(rows, 2000)) {
    transactionTemplate.executeWithoutResult(s -> rowMapper.batchUpsert(batch));
}
```

可中断、可观察（每批打进度日志），失败可从断点续跑。

---

## 五、COUNT/深分页的线上形态

`../03-mysql/12-SQL优化.md` 讲了手段，这里是**线上真实体验**：

- 运营后台列表页翻到 500 页变 8 秒 → 延迟关联改造（先查 id 再回表）；
- "订单总数"首页数字 → **不要实时 count 千万表**，落计数表/Redis 异步维护，容忍分钟级误差；
- 游标分页（`where id < lastId`）是 App 端无限滚动的标配，"跳到第 N 页"的交互本身就该在产品层面被质疑。

---

## 六、字段与索引设计红线（血的教训浓缩）

| 红线 | 后果 |
|------|------|
| 金额用 float/double | 精度丢失对不上账，**必须 decimal** |
| 用 UUID varchar 当主键 | 随机写入页分裂 + 二级索引膨胀（`../03-mysql/12-SQL优化.md`） |
| text 存大 JSON 还频繁更新 | 行溢出、binlog 膨胀；拆表或换存储 |
| 状态字段不建索引却当 WHERE 高频条件 | 全表扫 |
| 没有超时意识：默认 `innodb_lock_wait_timeout=50s` | 死等 50 秒拖垮上游；业务库建议调成 3~5s 快速失败 |
| 备份没验证过 | "有备份"≠"能恢复"：定期演练恢复（`../03-mysql/18-MySQL管理.md`） |

---

## 七、线上 SQL 治理流程（固化成制度）

```text
1. 慢查询日志（阈值 1s）每日巡检 → top N（../03-mysql/19-日志.md）
2. EXPLAIN 分析：type/rows/Extra（../03-mysql/11-索引.md）
3. 归因：索引缺失 / 隐式转换 / 数据量增长 / 统计信息过期
4. 修复优先级：加索引 > 改写 SQL > 缓存 > 架构（读写分离/分表）
5. 上线后观察慢日志趋势确认收敛
6. 新 SQL 上线前：生产量级数据 EXPLAIN 评审（DBA/负责人）
```

**统计信息过期的坑**：执行计划突然变差但 SQL 没改过 → `analyze table tb_x;` 更新统计信息。

## 关联文档

- 索引与 EXPLAIN：`../03-mysql/11-索引.md`
- 锁与死锁：`../03-mysql/16-锁.md`
- 日志与慢查询：`../03-mysql/19-日志.md`
- 长事务的 Java 侧根因：`03-Spring事务失效实战清单.md` ⑥⑫
