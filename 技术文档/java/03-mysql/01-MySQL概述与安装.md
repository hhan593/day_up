# 01 - MySQL 概述与安装

> 目标：理解数据库基本概念与 MySQL 架构，完成安装、连接，建立练习数据库。

---

## 1.1 数据库基本概念

| 概念 | 全称 | 说明 |
|------|------|------|
| **DB** | Database | 数据库，有组织地存储数据的仓库 |
| **DBMS** | Database Management System | 数据库管理系统（MySQL 就是 DBMS） |
| **SQL** | Structured Query Language | 结构化查询语言，操作数据库的标准语言 |

常见关系型数据库：**MySQL**、Oracle、PostgreSQL、SQL Server。非关系型（NoSQL）：Redis、MongoDB。

---

## 1.2 MySQL 简介与版本

MySQL 是**开源、免费、高性能**的关系型数据库，LAMP/LNMP 架构核心，互联网公司最常用的数据库。

| 版本 | 说明 |
|------|------|
| 5.7 | 老项目仍在使用 |
| **8.0** | **当前主流 LTS**，支持窗口函数、CTE、JSON、角色、原子 DDL |
| 8.4 | 新 LTS |
| 9.x | 创新版（非 LTS） |

> 学习与面试按 **8.0** 为准，本文全部基于 8.0。

MySQL 8.0 重要变化：
- 默认字符集为 `utf8mb4`（5.7 是 `latin1`）。
- 引入**窗口函数**、**CTE（WITH）**、**降序索引**、**不可见索引**。
- 引入**角色（ROLE）**权限模型。

---

## 1.3 安装

### Windows

1. 下载 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)（选 ZIP 或 MSI）。
2. MSI 安装时选择 `Server only` 或 `Custom`，设置 root 密码。
3. 配置环境变量：把 `MySQL\bin` 加入 `Path`。
4. 验证：

```bash
mysql --version
# mysql  Ver 8.0.xx for Win64
```

### Linux（CentOS/Ubuntu）

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql     # 开机自启

# 安全初始化
sudo mysql_secure_installation
```

### Docker（推荐，最省事）

```bash
docker run -d --name mysql8 \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=study \
  mysql:8.0
```

---

## 1.4 连接与常用命令

```bash
# 连接
mysql -h 127.0.0.1 -P 3306 -u root -p

# 常用内置命令（注意以分号或 \G 结束）
status;          -- 查看状态
show databases;  -- 查看所有库
use study;       -- 切换库
show tables;     -- 查看当前库的表
select version();-- 查看版本
exit;            -- 退出
```

服务管理：

```bash
# Windows
net start mysql
net stop mysql

# Linux
systemctl start|stop|restart|status mysql
```

---

## 1.5 MySQL 架构概览

```text
客户端
  ↓
① 连接层：连接池、认证、权限校验
  ↓
② 服务层：SQL 接口、解析器、优化器、缓存（8.0 已移除查询缓存）
  ↓
③ 引擎层：可插拔存储引擎（InnoDB 默认 / MyISAM / Memory ...）
  ↓
④ 存储层：文件系统（.ibd / .frm / redo log ...）
```

- **连接层**：管理连接，`max_connections` 控制最大连接数。
- **服务层**：SQL 解析 → 优化（生成执行计划）→ 调用引擎。
- **引擎层**：真正读写数据，**InnoDB 是默认且最常用引擎**。
- **存储层**：数据最终落在磁盘文件上。

> 面试常问：MySQL 一条 SQL 的执行流程 → 连接器 → 分析器 → 优化器 → 执行器 → 引擎。

---

## 1.6 字符集与排序规则

```sql
-- 查看字符集
show variables like 'character%';
show variables like 'collation%';

-- 建库时指定（推荐 utf8mb4）
create database study
  default character set utf8mb4
  default collate utf8mb4_0900_ai_ci;
```

| 字符集 | 说明 |
|--------|------|
| `utf8` | MySQL 中最多 3 字节，**不支持 emoji** |
| **`utf8mb4`** | 真正的 UTF-8，最多 4 字节，**支持 emoji**，推荐 |

> **易错点**：MySQL 的 `utf8` 是「阉割版」（3 字节），存 emoji 会报 `Incorrect string value`。一律用 `utf8mb4`。

---

## 1.7 SQL 语言分类

| 分类 | 全称 | 作用 | 代表语句 |
|------|------|------|---------|
| **DDL** | Data Definition Language | 定义数据库对象 | `CREATE` / `ALTER` / `DROP` |
| **DML** | Data Manipulation Language | 操作数据 | `INSERT` / `UPDATE` / `DELETE` |
| **DQL** | Data Query Language | 查询数据 | `SELECT` |
| **DCL** | Data Control Language | 控制权限 | `GRANT` / `REVOKE` |

> 本套文档按 **DDL(02) → DML(03) → DQL(04) → DCL(05)** 展开。

---

## 小结

- DB / DBMS / SQL 三个概念；MySQL 是最常用的关系型数据库。
- 学习按 8.0 LTS，字符集一律 `utf8mb4`。
- 架构：连接层 → 服务层 → 引擎层 → 存储层，InnoDB 是默认引擎。
- SQL 分四类：DDL / DML / DQL / DCL。

## 练习

1. 用 Docker 启动一个 MySQL 8.0，用命令行连接成功。
2. 查看当前数据库的字符集与版本。
3. 说出 MySQL 一条查询 SQL 的完整执行流程。

→ 下一篇：[02-SQL-DDL](./02-SQL-DDL.md)
