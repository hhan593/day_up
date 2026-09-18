# 03 - SQL-DML（数据操纵语言）

> 目标：掌握数据的增（INSERT）、改（UPDATE）、删（DELETE）。

---

## 3.1 DML 概述

DML（Data Manipulation Language）用于**操作表中的数据**：

| 操作 | 语句 |
|------|------|
| 插入 | `INSERT` |
| 修改 | `UPDATE` |
| 删除 | `DELETE` |

DML 操作**可以回滚**（配合事务，见 09 章）。

---

## 3.2 INSERT 插入

```sql
-- 指定列插入（推荐，列变化时不易出错）
insert into student (name, gender, birthday, score)
values ('张三', '男', '2005-03-15', 88.5);

-- 全列插入（需按表定义顺序给出所有列）
insert into student
values (null, '李四', '女', '2005-07-20', 92.0, '13800138000', now());

-- 一次插入多条（性能优于多条单插）
insert into student (name, gender, score) values
('王五', '男', 76.0),
('赵六', '女', 95.5),
('孙七', '男', 60.0);

-- 插入查询结果（INSERT ... SELECT）
insert into student_backup (name, score)
select name, score from student where score >= 60;
```

> **易错点**：
> - 主键 `id` 是自增时，可用 `null` 占位（会分配新 ID）。
> - 字符串和日期必须用**单引号**。
> - 批量插入比逐条插入快得多（减少网络与事务开销）。

---

## 3.3 UPDATE 修改

```sql
-- 修改指定行（务必带 WHERE！）
update student set score = 90 where name = '张三';

-- 同时改多个字段
update student set gender = '男', score = 85 where id = 1;

-- 基于原值计算
update student set score = score + 5 where gender = '女';
```

> **⚠️ 致命易错点**：`update` 不带 `where` 会**更新全表**！生产环境误操作事故高发点。执行前先用 `select` 验证条件。

```sql
-- 安全习惯：先 select 确认影响行
select * from student where gender = '女';
-- 确认无误后再 update
update student set score = score + 5 where gender = '女';
```

---

## 3.4 DELETE 删除

```sql
-- 删除指定行
delete from student where name = '孙七';

-- 删除所有数据（保留表结构，可回滚，自增不重置）
delete from student;

-- 按条件删除
delete from student where score < 60;
```

> **⚠️** `delete from 表` 不带 `where` 删除全部数据。清空整表优先用 `truncate table`（更快，但不可回滚）。

---

## 3.5 三种删除方式对比

| 语句 | 类型 | 可加 WHERE | 可回滚 | 自增重置 | 速度 | 触发器 |
|------|------|-----------|--------|---------|------|--------|
| `DELETE` | DML | ✅ | ✅ | ❌ | 慢（逐行） | 触发 |
| `TRUNCATE` | DDL | ❌ | ❌ | ✅ | 快 | 不触发 |
| `DROP` | DDL | ❌ | ❌ | — | 快 | 不触发 |

---

## 3.6 案例：商品表增删改

```sql
drop table if exists tb_goods;
create table tb_goods (
    id       int           primary key auto_increment comment '商品ID',
    name     varchar(50)   not null comment '商品名',
    price    decimal(10,2) not null comment '价格',
    stock    int           default 0 comment '库存',
    category varchar(20)   comment '分类'
) comment '商品表';

-- 插入
insert into tb_goods (name, price, stock, category) values
('iPhone 15', 5999.00, 100, '手机'),
('小米14', 3999.00, 200, '手机'),
('MacBook Air', 8999.00, 50, '电脑');

-- 修改：手机分类降价 500
update tb_goods set price = price - 500 where category = '手机';

-- 删除：库存为 0 的商品
delete from tb_goods where stock = 0;

-- 验证
select * from tb_goods;
```

---

## 小结

- `INSERT` 推荐指定列名，批量插入性能更好。
- `UPDATE` / `DELETE` **必须带 WHERE**，否则影响全表；执行前先 `SELECT` 验证。
- `TRUNCATE` 清空更快但不可回滚、自增重置。
- DML 可回滚，DDL 不可。

## 练习

1. 向 `student` 表插入 5 条数据，其中一条用全列插入。
2. 把成绩低于 60 的学生成绩改为 60（及格线）。
3. 删除姓「张」的学生。
4. 说出 `delete from t` 与 `truncate table t` 的 4 点区别。

→ 下一篇：[04-SQL-DQL](./04-SQL-DQL.md)
