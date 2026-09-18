# 18 - MySQL 管理

> 目标：了解系统数据库与常用管理工具，掌握备份与恢复。

---

## 18.1 系统数据库

MySQL 安装后自带四个系统库：

| 库名 | 作用 |
|------|------|
| `mysql` | 核心库，存**用户、权限、存储过程**等 |
| `information_schema` | **元数据**：库、表、列、索引、权限信息（虚拟库） |
| `performance_schema` | **性能监控**：运行时的各类统计 |
| `sys` | 基于 performance_schema 的**易用视图**，便于排查 |

```sql
-- 常用元数据查询
select table_name, table_rows from information_schema.tables
where table_schema = 'study';

select column_name, data_type from information_schema.columns
where table_schema = 'study' and table_name = 'student';
```

---

## 18.2 常用客户端工具

| 工具 | 作用 |
|------|------|
| `mysql` | 命令行客户端，连接执行 SQL |
| `mysqladmin` | 管理工具：状态、变量、进程、关闭服务 |
| `mysqldump` | **逻辑备份**（导出 SQL） |
| `mysqlimport` / `source` | 数据导入 |
| `mysqlshow` | 查看库/表结构 |

```bash
# 查看状态
mysqladmin -u root -p status
mysqladmin -u root -p variables
mysqladmin -u root -p processlist    # 查看连接/慢查询进程
```

---

## 18.3 备份与恢复

### mysqldump 逻辑备份

```bash
# 备份单个库
mysqldump -u root -p study > study.sql

# 备份多库
mysqldump -u root -p --databases study school > multi.sql

# 备份所有库
mysqldump -u root -p --all-databases > all.sql

# 只备份表结构
mysqldump -u root -p --no-data study > study_schema.sql

# 只备份数据
mysqldump -u root -p --no-create-info study > study_data.sql

# InnoDB 一致性备份（不锁表，推荐）
mysqldump -u root -p --single-transaction study > study.sql
```

### 恢复

```bash
# 方式一：命令行导入
mysql -u root -p study < study.sql

# 方式二：登录后 source
mysql -u root -p
mysql> source /path/study.sql;
```

> **重点**：
> - 逻辑备份 = 导出 SQL 语句，可读可改，但**大数据量慢**。
> - 物理备份 = 直接拷贝数据文件（需停库或用 XtraBackup），**快**。
> - InnoDB 备份加 `--single-transaction` 避免锁表（利用一致性快照）。

---

## 18.4 权限与安全建议

| 建议 | 说明 |
|------|------|
| 不用 root 跑应用 | 应用用独立低权限账号 |
| 最小权限 | 只授必需的库/表权限（见 05 章） |
| 限制来源 IP | 用 `'user'@'192.168.1.%'` 而非 `%` |
| 定期备份 + 校验 | 备份要验证可恢复 |
| 关闭危险功能 | 如 `local_infile`（按需） |

---

## 18.5 案例：完整备份与恢复演练

```bash
# 1. 备份 study 库（一致性）
mysqldump -u root -p --single-transaction --databases study > /backup/study_$(date +%F).sql

# 2. 模拟误删
mysql -u root -p -e "drop database study;"

# 3. 恢复
mysql -u root -p < /backup/study_2026-09-18.sql

# 4. 验证
mysql -u root -p -e "select count(*) from study.student;"
```

---

## 小结

- 四个系统库：`mysql`（权限）、`information_schema`（元数据）、`performance_schema`（性能）、`sys`（易用视图）。
- `mysqldump` 逻辑备份，`mysql <` 或 `source` 恢复。
- InnoDB 用 `--single-transaction` 实现不锁表备份。
- 生产遵循最小权限 + 定期备份 + 恢复演练。

## 练习

1. 用 `information_schema` 查询 study 库所有表及行数。
2. 备份 study 库，删除后恢复并验证。
3. 只导出 student 表的结构（不含数据）。
4. 说出逻辑备份与物理备份的区别。

→ 下一篇：[19-日志](./19-日志.md)
