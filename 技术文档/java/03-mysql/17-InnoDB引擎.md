# 17 - InnoDB 引擎

> 目标：理解 InnoDB 的存储结构、架构、事务实现（redo/undo）与 MVCC。**面试深水区**。

---

## 17.1 逻辑存储结构

```text
表空间 Tablespace
  └─ 段 Segment
      └─ 区 Extent（1MB = 64 个页）
          └─ 页 Page（16KB，InnoDB 最小 IO 单位）
              └─ 行 Row
```

| 层级 | 说明 |
|------|------|
| 表空间 | 一个 `.ibd` 文件（独立表空间） |
| 段 | 索引段、数据段、回滚段 |
| 区 | 1MB，64 个连续页 |
| **页** | **16KB，磁盘与内存交互的最小单位** |
| 行 | 数据行，格式有 Compact、Dynamic（默认）等 |

> 记住：**InnoDB 读磁盘是按 16KB 页读的**，这是 B+Tree 树高与 IO 次数的关键。

---

## 17.2 内存结构

| 组件 | 作用 |
|------|------|
| **Buffer Pool（缓冲池）** | 缓存数据页与索引页，**最重要**，减少磁盘 IO |
| Change Buffer | 缓存非唯一二级索引的写操作，后续合并 |
| Log Buffer | 缓存 redo log，定期刷盘 |
| Adaptive Hash Index | 自适应哈希索引，热点页加速 |

```sql
-- 查看缓冲池大小（默认 128MB，生产要调大）
show variables like 'innodb_buffer_pool_size';
-- 建议设为物理内存的 50%~70%
```

> **核心**：查询时先看 Buffer Pool，命中则直接返回，未命中才读磁盘（并把页载入 Buffer Pool）。

---

## 17.3 磁盘结构

### 双写缓冲区 Doublewrite Buffer

- 先把页写到双写区，再写到真实位置。
- 防止**页断裂**（写入过程中崩溃导致页损坏）。

### redo log（重做日志）

- **物理日志**，记录「在某个页做了什么修改」。
- 用途：**崩溃恢复**，保证**持久性 D**。
- 循环写（固定大小），有 `write pos` 和 `checkpoint`。

```sql
show variables like 'innodb_log%';
```

### undo log（回滚日志）

- **逻辑日志**，记录「数据修改前的样子」。
- 用途：**事务回滚**（保证原子性 A）+ **MVCC 版本链**。

---

## 17.4 事务实现原理

| 特性 | 实现 |
|------|------|
| 原子性 A | **undo log**：回滚到修改前 |
| 持久性 D | **redo log**：崩溃后重放恢复 |
| 隔离性 I | **锁 + MVCC** |
| 一致性 C | 由 A/I/D 共同保证 |

### redo log 与 binlog 的区别（高频面试）

| 对比 | redo log | binlog |
|------|----------|--------|
| 归属 | InnoDB 引擎层 | MySQL Server 层 |
| 类型 | 物理日志（页的修改） | 逻辑日志（SQL/行变更） |
| 用途 | 崩溃恢复 | 主从复制、数据恢复 |
| 写入 | 循环写 | 追加写 |
| 大小 | 固定 | 持续增长 |

**两阶段提交**：redo log 与 binlog 必须一致，采用「prepare → 写 binlog → commit」两阶段提交保证一致性（详见 19 章）。

---

## 17.5 MVCC 详解（重点）

MVCC = 多版本并发控制，实现**读写不阻塞**。

### 三大要素

**① 隐藏字段**

InnoDB 每行有两个隐藏字段：

| 字段 | 作用 |
|------|------|
| `DB_TRX_ID` | 最近修改该行的事务 ID |
| `DB_ROLL_PTR` | 回滚指针，指向 undo log 中的上一个版本 |

**② undo log 版本链**

每次修改都把旧版本写入 undo log，`DB_ROLL_PTR` 串成链表：

```text
当前行 (trx_id=30)
   ↓ roll_ptr
undo: 旧版本 (trx_id=20)
   ↓
undo: 更旧版本 (trx_id=10)
```

**③ ReadView（读视图）**

事务执行快照读时生成，记录**当前活跃（未提交）的事务 ID 列表**，用于判断版本可见性：

- 版本 trx_id < 最小活跃 ID → 可见（已提交）。
- 版本 trx_id 在活跃列表中 → 不可见（未提交）。
- 版本 trx_id > 最大 ID → 不可见（之后的事务）。
- 不可见时沿版本链往前找，直到找到可见版本。

### RC 与 RR 的差异

| 隔离级别 | ReadView 生成时机 | 效果 |
|---------|------------------|------|
| **READ COMMITTED** | **每次快照读都生成** | 能读到别人最新提交 → 不可重复读 |
| **REPEATABLE READ** | **第一次快照读生成，之后复用** | 同一事务读到的版本固定 → 可重复读 |

> 这就是 MySQL 默认 RR 级别能实现可重复读的底层原因。

### 快照读 vs 当前读（回顾 09 章）

| 对比 | 快照读 | 当前读 |
|------|--------|--------|
| 语句 | 普通 `select` | `for update` / `lock in share mode` / 增删改 |
| 读版本 | ReadView 判断的历史版本 | 最新版本 |
| 加锁 | 不加锁 | 加锁 |
| 机制 | MVCC | 锁 |

---

## 17.6 案例：查看 InnoDB 状态

```sql
-- 查看 InnoDB 运行状态（事务、锁、死锁、缓冲池）
show engine innodb status\G

-- 查看缓冲池命中率相关
show status like 'Innodb_buffer_pool%';

-- 查看 undo 表空间
show variables like 'innodb_undo%';

-- 查看当前事务
select * from information_schema.innodb_trx;
```

---

## 小结

- InnoDB 存储：表空间 → 段 → 区 → **页(16KB)** → 行。
- 内存核心是 **Buffer Pool**；磁盘有双写、redo、undo。
- redo log 保持久性，undo log 保原子性 + 支撑 MVCC。
- **MVCC = 隐藏字段 + undo 版本链 + ReadView**。
- RC 每次快照读生成 ReadView，RR 复用第一次的 → RR 可重复读。
- redo 是引擎层物理日志，binlog 是 Server 层逻辑日志，靠**两阶段提交**保持一致。

## 练习

1. 说出 InnoDB 逻辑存储结构的五个层级。
2. 解释 Buffer Pool 的作用，生产环境如何设置。
3. 对比 redo log 与 binlog 的 4 点区别。
4. 说明 MVCC 三大要素，以及 RC 与 RR 在 ReadView 上的差异。

→ 下一篇：[18-MySQL管理](./18-MySQL管理.md)
