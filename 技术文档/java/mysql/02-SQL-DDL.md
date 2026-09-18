# 02 - SQL-DDL（数据定义语言）

> 目标：掌握库、表的创建与修改，熟悉常用数据类型。

---

## 2.1 DDL 概述

DDL（Data Definition Language）用于**定义数据库对象**：库、表、字段、索引。

| 操作 | 语句 |
|------|------|
| 创建 | `CREATE` |
| 查看 | `SHOW` / `DESC` |
| 修改 | `ALTER` |
| 删除 | `DROP` / `TRUNCATE` |

---

## 2.2 数据库操作

```sql
-- 创建
create database if not exists study
  default character set utf8mb4;

-- 查看
show databases;
show create database study;      -- 查看建库语句

-- 切换
use study;

-- 修改字符集
alter database study default character set utf8mb4;

-- 删除（危险！）
drop database if exists study;
```

> **易错点**：`drop database` 会删除库中所有表和数据，生产环境禁用（或严格权限控制）。

---

## 2.3 数据类型

### 数值类型

| 类型 | 字节 | 说明 |
|------|------|------|
| `tinyint` | 1 | 小整数，常用作状态/布尔（0/1） |
| `smallint` | 2 | |
| `int` | 4 | **最常用整数** |
| `bigint` | 8 | 大整数，如雪花 ID |
| `float` / `double` | 4 / 8 | 浮点，有精度误差 |
| `decimal(m,d)` | — | **精确小数**，金额必用（如 `decimal(10,2)`） |

> **重点**：金额**不要用** `float`/`double`（二进制浮点有误差），用 `decimal`。

### 字符串类型

| 类型 | 说明 |
|------|------|
| `char(n)` | 定长，不足补空格，适合固定长度（如身份证、手机号） |
| `varchar(n)` | 变长，按实际长度存储，**最常用** |
| `text` | 长文本 |
| `blob` | 二进制数据（图片等，实际很少用） |

> `varchar` 长度是**字符数**不是字节数（UTF-8 下一个汉字占 3~4 字节，但 varchar(10) 能存 10 个汉字）。

### 日期时间类型

| 类型 | 格式 | 说明 |
|------|------|------|
| `date` | YYYY-MM-DD | 日期 |
| `time` | HH:MM:SS | 时间 |
| `datetime` | YYYY-MM-DD HH:MM:SS | **最常用**，范围 1000~9999 |
| `timestamp` | YYYY-MM-DD HH:MM:SS | 范围 1970~2038，**随时区变化**，自动更新 |
| `year` | YYYY | 年份 |

> `datetime` 存**字面值**，`timestamp` 存**UTC 时间戳**并按会话时区转换。跨时区系统注意选型。

---

## 2.4 表操作

### 创建表

```sql
create table tb_user (
    id        bigint       primary key auto_increment comment '主键',
    username  varchar(20)  not null unique       comment '用户名',
    password  varchar(64)  not null              comment '密码',
    name      varchar(20)                        comment '姓名',
    gender    tinyint                            comment '性别 1男 2女',
    age       tinyint unsigned                   comment '年龄',
    balance   decimal(10,2) default 0.00         comment '余额',
    create_time datetime   default current_timestamp comment '创建时间',
    update_time datetime   default current_timestamp on update current_timestamp comment '更新时间'
) comment '用户表';
```

### 查看表

```sql
show tables;                       -- 当前库所有表
desc tb_user;                      -- 表结构
show create table tb_user;         -- 建表语句
```

### 修改表（ALTER）

```sql
-- 加字段
alter table tb_user add email varchar(50) comment '邮箱';

-- 改字段类型
alter table tb_user modify email varchar(100);

-- 改字段名和类型
alter table tb_user change email mail varchar(100);

-- 删字段（危险）
alter table tb_user drop mail;

-- 改表名
alter table tb_user rename to user_info;

-- 加索引
alter table tb_user add index idx_username (username);
```

### 删除表

```sql
drop table if exists tb_user;      -- 删表（结构和数据都没了）
truncate table tb_user;            -- 清空数据，保留结构，速度快
```

**DELETE / TRUNCATE / DROP 对比**：

| 语句 | 类型 | 删除内容 | 可回滚 | 自增计数器 |
|------|------|---------|--------|-----------|
| `DELETE` | DML | 数据（可加 WHERE） | ✅ | 不重置 |
| `TRUNCATE` | DDL | 全部数据 | ❌ | 重置为 1 |
| `DROP` | DDL | 表结构 + 数据 | ❌ | — |

---

## 2.5 案例：学生表

```sql
create database if not exists school default charset utf8mb4;
use school;

create table student (
    id        int          primary key auto_increment comment '学号',
    name      varchar(20)  not null comment '姓名',
    gender    char(1)      default '男' comment '性别',
    birthday  date         comment '出生日期',
    score     decimal(5,2) comment '入学成绩',
    phone     varchar(11)  unique comment '手机号',
    create_time datetime  default current_timestamp
) comment '学生表';
```

---

## 小结

- DDL 管结构：`CREATE` / `ALTER` / `DROP` / `TRUNCATE`。
- 金额用 `decimal`，定长用 `char`，变长用 `varchar`，时间用 `datetime`。
- 字符集统一 `utf8mb4`。
- `TRUNCATE` 快但不可回滚，`DELETE` 可带条件可回滚。

## 练习

1. 创建 `school` 库和 `student` 表（含学号、姓名、性别、生日、成绩）。
2. 给 `student` 表增加 `email` 字段，再修改为 `varchar(100)`。
3. 说出 `DELETE` / `TRUNCATE` / `DROP` 的区别。

→ 下一篇：[03-SQL-DML](./03-SQL-DML.md)
