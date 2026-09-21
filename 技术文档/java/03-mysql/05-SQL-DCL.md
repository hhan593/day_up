# 05 - SQL-DCL（数据控制语言）

> 目标：掌握用户管理与权限控制，理解角色与权限模型。

---

## 5.1 DCL 概述

DCL（Data Control Language）用于**管理用户和权限**：

| 操作 | 语句 |
|------|------|
| 创建/删除用户 | `CREATE USER` / `DROP USER` |
| 授权/回收 | `GRANT` / `REVOKE` |
| 角色 | `CREATE ROLE` / `GRANT role` |

> 生产环境的原则：**最小权限原则**——只给必需的权限。

---

## 5.2 用户管理

```sql
-- 创建用户（主机决定从哪连接：% 任意，localhost 本机）
create user 'dev'@'%' identified by 'Dev@123456';
create user 'dev'@'localhost' identified by 'Dev@123456';

-- 查询用户
select user, host from mysql.user;

-- 修改密码
alter user 'dev'@'%' identified by 'NewPass@123';

-- 删除用户
drop user 'dev'@'%';
```

| 主机写法 | 含义 |
|---------|------|
| `'user'@'localhost'` | 只能本机连接 |
| `'user'@'%'` | 任意主机（生产慎用） |
| `'user'@'192.168.1.%'` | 指定网段 |

> **易错点**：MySQL 的「用户」是 `用户名@主机` 整体，`'dev'@'localhost'` 与 `'dev'@'%'` 是**两个不同用户**，权限互不影响。

---

## 5.3 权限控制

### 授权 GRANT

```sql
-- 授予 study 库所有表的查询、插入权限
grant select, insert on study.* to 'dev'@'%';

-- 授予所有库所有表所有权限（开发环境可，生产慎用）
grant all privileges on *.* to 'dev'@'%';

-- 加上授权选项（允许该用户把权限再授给别人）
grant select on study.* to 'dev'@'%' with grant option;

-- 刷新权限（8.0 一般不需要，改权限表后需要）
flush privileges;
```

### 查看权限

```sql
show grants for 'dev'@'%';
```

### 回收权限 REVOKE

```sql
revoke insert on study.* from 'dev'@'%';
revoke all privileges on study.* from 'dev'@'%';
```

### 常见权限

| 权限 | 说明 |
|------|------|
| `select` / `insert` / `update` / `delete` | 表数据操作 |
| `create` / `alter` / `drop` | 结构变更 |
| `index` | 建删索引 |
| `create user` | 创建用户 |
| `all privileges` | 除 grant 外所有权限 |

---

## 5.4 角色（MySQL 8.0+）

角色 = **权限的集合**，便于批量管理（类似「岗位」）：

```sql
-- 创建角色
create role 'read_only'@'%';

-- 给角色授权
grant select on study.* to 'read_only'@'%';

-- 把角色授予用户
grant 'read_only'@'%' to 'dev'@'%';

-- 激活角色（否则不生效）
set default role 'read_only'@'%' to 'dev'@'%';

-- 查看角色权限
show grants for 'read_only'@'%';
```

> 8.0 之前没有角色，只能逐个用户授权；8.0 起推荐用角色管理。

---

## 5.5 权限表

MySQL 权限存在 `mysql` 系统库的表中：

| 表 | 作用 |
|----|------|
| `mysql.user` | 用户账号、全局权限 |
| `mysql.db` | 数据库级权限 |
| `mysql.tables_priv` | 表级权限 |
| `mysql.columns_priv` | 列级权限 |

> 一般通过 `GRANT`/`REVOKE` 操作，**不建议直接改权限表**（易出错，且要 `flush privileges`）。

---

## 5.6 案例：给开发同学开账号

```sql
-- 1. 创建用户
create user 'zhangsan'@'%' identified by 'Zs@123456';

-- 2. 创建只读角色
create role 'read_role'@'%';
grant select on study.* to 'read_role'@'%';

-- 3. 授予角色
grant 'read_role'@'%' to 'zhangsan'@'%';
set default role 'read_role'@'%' to 'zhangsan'@'%';

-- 4. 验证
show grants for 'zhangsan'@'%';
```

---

## 小结

- MySQL 用户 = `用户名@主机`，不同主机是不同账号。
- `GRANT` 授权，`REVOKE` 回收，最小权限原则。
- 8.0 用**角色**批量管理权限，需 `set default role` 激活。
- 权限存于 `mysql` 系统库，用 DCL 语句操作而非直接改表。

## 练习

1. 创建用户 `test@'%'`，只授予 `study` 库的 `select` 权限。
2. 创建角色 `write_role`，授予 `insert/update/delete`，再把角色给 `test`。
3. 查看 `test` 的权限，然后回收 `select` 权限。

→ 下一篇：[06-函数](./06-函数.md)
