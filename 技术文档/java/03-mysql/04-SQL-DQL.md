# 04 - SQL-DQL（数据查询语言）

> 目标：掌握 SELECT 查询的全部核心语法，理解 SQL 执行顺序。**这是 SQL 最重要的一章**。

---

## 4.1 基本查询

```sql
-- 查询所有列
select * from student;

-- 查询指定列
select name, score from student;

-- 起别名（as 可省略）
select name as 姓名, score as 成绩 from student;

-- 去重
select distinct gender from student;

-- 常量列 / 计算列
select name, score, score + 10 as bonus from student;
```

> 实际开发**不要用 `select *`**：多查无用列、无法走覆盖索引、表结构变化易出问题。

---

## 4.2 条件查询 WHERE

```sql
select * from student where score >= 80;
select * from student where gender = '男' and score > 80;
select * from student where score between 60 and 90;   -- 闭区间 [60,90]
select * from student where gender in ('男', '女');
select * from student where name like '张%';          -- % 任意多字符
select * from student where name like '_三';          -- _ 单个字符
select * from student where phone is null;
select * from student where phone is not null;
select * from student where score >= 80 or gender = '女';
select * from student where not (score < 60);
```

| 运算符 | 说明 |
|--------|------|
| `= != <> < <= > >=` | 比较 |
| `between ... and ...` | 区间（闭区间） |
| `in (…)` | 集合内 |
| `like` | 模糊匹配（`%` 多字符，`_` 单字符） |
| `is null` / `is not null` | 判空（**不能用 `= null`**） |
| `and` / `or` / `not` | 逻辑运算 |

> **易错点**：`where phone = null` 永远查不到结果，必须用 `is null`。NULL 参与任何比较结果都是 NULL（不是 true）。

---

## 4.3 排序 ORDER BY

```sql
select * from student order by score desc;             -- 降序
select * from student order by score asc;              -- 升序（默认）
select * from student order by gender asc, score desc; -- 多字段：先按性别，再按成绩
```

- `asc` 升序（默认），`desc` 降序。
- 多字段排序：**前面的字段优先**。

---

## 4.4 分页 LIMIT

```sql
-- 第 1 页，每页 3 条
select * from student limit 0, 3;      -- 格式：limit 起始索引, 条数
select * from student limit 3;         -- 只写一个数 = 前 N 条

-- 第 2 页
select * from student limit 3, 3;

-- 通用公式：limit (页码-1)*每页条数, 每页条数
```

> **注意**：MySQL 的 limit 起始索引从 **0** 开始；Oracle 用 `rownum`，SQL Server 用 `offset ... fetch`，用法不同。

---

## 4.5 聚合函数与分组

```sql
-- 聚合函数
select count(*) from student;              -- 总行数
select count(phone) from student;          -- 非 NULL 的 phone 数
select avg(score) from student;            -- 平均分
select max(score), min(score) from student;
select sum(score) from student;

-- 分组 GROUP BY
select gender, count(*) as 人数, avg(score) as 平均分
from student
group by gender;

-- 分组后过滤 HAVING
select gender, avg(score) as avg_score
from student
group by gender
having avg_score > 80;
```

**WHERE 与 HAVING 的区别**：

| 对比 | WHERE | HAVING |
|------|-------|--------|
| 执行时机 | 分组**前**过滤 | 分组**后**过滤 |
| 能否用聚合函数 | ❌ | ✅ |
| 作用对象 | 行 | 分组结果 |

```sql
-- 组合使用：先 where 过滤行，再 group by 分组，最后 having 过滤组
select gender, count(*) as cnt
from student
where score >= 60
group by gender
having cnt >= 2;
```

---

## 4.6 SQL 执行顺序（重点）

书写顺序与**执行顺序不同**：

```text
书写：select → from → where → group by → having → order by → limit
执行：from → where → group by → having → select → order by → limit
```

示例：

```sql
select gender, avg(score) as avg_score     -- 5. 计算 select（可起别名）
from student                               -- 1. 确定表
where score >= 60                          -- 2. 过滤行
group by gender                            -- 3. 分组
having avg_score > 75                      -- 4. 过滤组
order by avg_score desc                    -- 6. 排序
limit 1;                                   -- 7. 分页
```

> **理解意义**：为什么 `where` 里不能用 `select` 的别名？因为 `where` 执行时 `select` 还没执行；而 `having` 可以，因为它在 `select` 之后。

---

## 4.7 案例：学生成绩统计

```sql
-- 建表与数据
drop table if exists score;
create table score (
    id     int primary key auto_increment,
    name   varchar(20),
    course varchar(20),
    score  decimal(5,2)
);
insert into score (name, course, score) values
('张三', '语文', 88), ('张三', '数学', 95),
('李四', '语文', 76), ('李四', '数学', 82),
('王五', '语文', 92), ('王五', '数学', 68);

-- 1. 每门课平均分
select course, avg(score) as 平均分 from score group by course;

-- 2. 平均分 > 80 的课程
select course, avg(score) as 平均分
from score group by course having 平均分 > 80;

-- 3. 每个学生总分，按总分降序
select name, sum(score) as 总分
from score group by name order by 总分 desc;

-- 4. 数学成绩前 2 名
select name, score from score
where course = '数学' order by score desc limit 2;
```

---

## 小结

- 基本结构：`select 列 from 表 where 条件 group by 分组 having 组条件 order by 排序 limit 分页`。
- 判空用 `is null`，不能用 `= null`。
- 分组前过滤用 `WHERE`，分组后过滤用 `HAVING`。
- **执行顺序**：`from → where → group by → having → select → order by → limit`。
- 开发避免 `select *`。

## 练习

1. 查询成绩在 60-90 之间的学生，按成绩降序。
2. 统计男女学生人数和平均分。
3. 查询平均分大于 80 的课程。
4. 查询每个学生总分并取前 3 名。

→ 下一篇：[05-SQL-DCL](./05-SQL-DCL.md)
