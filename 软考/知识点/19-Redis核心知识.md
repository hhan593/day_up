# 19 — Redis 核心知识

> 系统架构设计师常考中间件知识，与 [07-分布式系统与中间件.md](07-分布式系统与中间件.md) 第5节互补

## 1. Redis 基础

### 1.1 核心特性

| 特性 | 说明 |
|------|------|
| **内存存储** | 数据存在内存中，读写极快（微秒级） |
| **持久化** | 支持RDB快照和AOF日志，重启后恢复数据 |
| **丰富数据结构** | String, Hash, List, Set, ZSet, Stream, Geo, Bitmap等 |
| **单线程** | 命令执行单线程（Redis 6.0+ 网络IO多线程），避免锁开销 |
| **高可用** | 主从复制 + Sentinel哨兵 + Cluster集群 |
| **功能丰富** | 发布订阅、Lua脚本、事务、过期策略、Pipeline管道 |
| **原子操作** | 每个命令原子执行 |

**单线程为什么快**：
1. 纯内存操作（主要因素）
2. 高效的数据结构（跳表/压缩列表等）
3. 非阻塞IO多路复用（epoll）
4. 无锁竞争和上下文切换

### 1.2 应用场景

| 场景 | 使用的数据结构 | 典型实现 |
|------|--------------|---------|
| **缓存** | String, Hash | 热点数据缓存，页面缓存 |
| **分布式锁** | String (SET NX EX) | Redlock算法 |
| **计数器** | String (INCR) | 点赞、PV/UV统计 |
| **排行榜** | ZSet (ZADD/ZRANGE) | 游戏排行、热搜榜 |
| **消息队列** | List (LPUSH/BRPOP)、Stream | 轻量MQ |
| **分布式Session** | Hash | Session共享 |
| **限流** | String (INCR+EXPIRE)、ZSet | 滑动窗口限流 |
| **去重/布隆过滤** | HyperLogLog, Bitmap | UV统计、黑名单 |
| **地理位置** | Geo | 附近的人、距离计算 |
| **发布订阅** | Pub/Sub | 实时消息推送 |

---

## 2. Redis 数据结构

### 2.1 核心数据结构

| 结构 | 内部编码 | 常用命令 | 典型场景 |
|------|---------|---------|---------|
| **String** | int / raw / embstr | GET/SET/INCR/DECR/APPEND | 缓存、计数、分布式锁 |
| **Hash** | ziplist / hashtable | HSET/HGET/HGETALL/HINCRBY | 对象缓存、Session |
| **List** | quicklist | LPUSH/RPUSH/LPOP/BRPOP/LRANGE | 消息队列、时间线 |
| **Set** | intset / hashtable | SADD/SMEMBERS/SINTER/SUNION/SDIFF | 标签、共同好友 |
| **ZSet** | ziplist / skiplist+dict | ZADD/ZRANGE/ZRANK/ZSCORE | 排行榜、延迟队列 |
| **Stream** | — | XADD/XREAD/XGROUP | 可靠消息队列（Redis 5.0+） |
| **Bitmap** | String | SETBIT/GETBIT/BITCOUNT | 签到、布隆过滤 |
| **HyperLogLog** | String | PFADD/PFCOUNT | UV去重统计（误差0.81%） |
| **Geo** | ZSet | GEOADD/GEORADIUS/GEODIST | LBS地理计算 |

### 2.2 底层数据结构

| 底层结构 | 说明 | 用于 |
|----------|------|------|
| **SDS（简单动态字符串）** | C字符串的增强版，O(1)取长度、防溢出、二进制安全 | String |
| **双向链表** | 标准双向链表 | List（早期） |
| **压缩列表（ziplist）** | 连续内存存储、节省空间 | Hash/ZSet小数据量 |
| **quicklist** | ziplist节点组成的双向链表 | List（3.2+） |
| **跳表（skiplist）** | 多层有序索引链表，O(logN)查找 | ZSet |
| **整数集合（intset）** | 有序整数数组 | Set纯整数 |
| **哈希表（dict）** | 标准哈希表+渐进式rehash | Hash/Set/ZSet |
| **listpack** | ziplist的替代（Redis 7.0+） | Hash/ZSet小量数据 |

**ZSet 为什么有两个内部结构**：
- **Dict**：存储成员→分数的映射，O(1)查分数
- **Skiplist**：存储成员按分数排序，O(logN)范围查询

### 2.3 数据结构时间复杂度速查

| 结构 | 操作 | 复杂度 |
|------|------|--------|
| String | GET/SET | O(1) |
| Hash | HGET/HSET | O(1) |
| Hash | HGETALL | O(N) N=field数量 |
| List | LPUSH/RPUSH/LPOP/RPOP | O(1) |
| List | LRANGE | O(S+N) S=start, N=返回数 |
| Set | SADD/SREM/SISMEMBER | O(1) |
| Set | SINTER/SUNION/SDIFF | O(N×M) |
| ZSet | ZADD/ZREM/ZSCORE | O(logN) |
| ZSet | ZRANGE | O(logN+M) M=返回数 |

---

## 3. Redis 持久化

### 3.1 RDB（Redis Database Backup）

**RDB**：在指定时间间隔内将内存数据快照写入磁盘（二进制文件 `dump.rdb`）。

| 触发方式 | 命令/配置 |
|----------|---------|
| 自动触发 | `save 900 1`（900秒至少1次修改）|
| 手动触发 | `SAVE`（阻塞）/ `BGSAVE`（fork子进程非阻塞） |

**RDB 优缺点**：

| 优点 | 缺点 |
|------|------|
| 文件紧凑，适合备份 | 可能丢失最后一次快照后的数据 |
| 恢复大数据集比AOF快 | fork子进程耗时，大内存可能卡顿 |
| 对性能影响小（fork子进程） | 不是实时持久化 |

### 3.2 AOF（Append Only File）

**AOF**：记录每条写命令到日志文件，重启时重放命令恢复数据。

**AOF 写入策略（appendfsync）**：

| 策略 | 说明 | 性能 | 安全性 |
|------|------|------|--------|
| **always** | 每条命令同步写盘 | 最慢 | 最高 |
| **everysec** | 每秒同步一次 | 中 | 中（默认，最多丢1秒） |
| **no** | 由OS决定何时同步 | 最快 | 最低 |

**AOF 重写（Rewrite）**：压缩AOF文件体积（`BGREWRITEAOF`）。

**重写原理**：fork子进程，根据当前内存数据生成最小命令集，不是读旧AOF文件。

### 3.3 混合持久化（Redis 4.0+）

**混合模式**：AOF重写时，将RDB二进制内容写入AOF文件开头，后续增量为AOF格式。兼顾恢复速度和数据安全性。

### 3.4 RDB vs AOF 选型

| 场景 | 推荐 | 理由 |
|------|------|------|
| 缓存（可容忍丢失） | 只用RDB或不用持久化 | 简化、高性能 |
| 数据不能丢 | RDB + AOF（everysec） | 兼顾 |
| 追求极致恢复速度 | RDB | 恢复最快 |
| 追求极致数据安全 | AOF（always） | 最多丢一个命令 |

---

## 4. Redis 高可用架构

### 4.1 主从复制（Replication）

```
     ┌──────────┐
     │  Master   │  ← 写
     └────┬─────┘
   ┌──────┼──────┐
   ▼      ▼      ▼
┌─────┐┌─────┐┌─────┐
│Slave││Slave││Slave│  ← 读（数据异步复制）
└─────┘└─────┘└─────┘
```

**复制流程**：
1. Slave连接Master，发送PSYNC命令
2. Master fork子进程生成RDB快照
3. Master将RDB发送给Slave + 期间缓存写命令
4. Slave加载RDB后，Master发送缓冲区命令
5. 进入增量复制阶段

**主从复制问题**：Master故障需手动切换，写能力无扩展。

### 4.2 Sentinel（哨兵模式）

**Sentinel 职责**：
- **监控**：检测Master和Slave是否正常
- **通知**：故障时通知应用程序
- **自动故障转移**：Master故障时选举新Master
- **配置提供者**：客户端通过Sentinel获取Master地址

**故障转移流程**：
```
Master宕机 → 多个Sentinel检测到（超过quorum）→ 确认Master客观下线
→ 选举Leader Sentinel → Leader选最优Slave为新Master
→ 通知其他Slave复制新Master → 通知客户端新Master地址
```

**Sentinel 本身也需要部署多节点**（≥3个，奇数个）。

### 4.3 Cluster（集群模式，Redis 3.0+）

**Redis Cluster**：去中心化的分片方案。

```
                    ┌───────────┐
                    │  Client   │
                    └─────┬─────┘
             ┌────────────┼────────────┐
             ▼            ▼            ▼
       ┌──────────┐┌──────────┐┌──────────┐
       │ Node A   ││ Node B   ││ Node C   │
       │(0-5460)  ││(5461-    ││(10923-   │
       │          ││ 10922)   ││ 16383)   │
       └──────────┘└──────────┘└──────────┘
         每个节点负责一部分槽位（共16384个槽）
```

**Cluster 核心概念**：

| 概念 | 说明 |
|------|------|
| **哈希槽** | 共16384个槽，CRC16(key) % 16384 → 槽号 → 节点 |
| **MOVED** | 重定向，Key不在本节点，告诉客户端正确节点 |
| **ASK** | 槽迁移中的临时重定向 |
| **Gossip协议** | 节点间通过Gossip协议交换信息 |
| **主从模式** | 每个主节点有1-N个从节点 |

**Cluster 特性**：
- 自动数据分片
- 部分节点故障时集群可用（只要主+至少一个从存活）
- 不支持多Key跨槽操作（需hash tag `{user}xxx` 将多key映射到同一槽）

### 4.4 三种架构对比

| 模式 | 数据分片 | 高可用 | 扩展性 | 复杂度 |
|------|---------|--------|--------|--------|
| **主从** | 无（全量复制） | 需手动切换 | 读写分离 | 低 |
| **Sentinel** | 无 | 自动故障转移 | 读写分离 | 中 |
| **Cluster** | 16384槽 | 自动故障转移 | 水平扩展 | 高 |

---

## 5. Redis 关键机制

### 5.1 内存淘汰策略

| 策略 | 说明 | 适用 |
|------|------|------|
| **noeviction** | 不淘汰，内存满时写入报错 | 数据不能丢 |
| **allkeys-lru** | 所有Key中LRU淘汰 | 通用缓存（推荐） |
| **volatile-lru** | 有过期时间的Key中LRU淘汰 | 混合持久键+缓存键 |
| **allkeys-lfu** | 所有Key中LFU淘汰 | 热点数据保护（4.0+） |
| **volatile-lfu** | 有过期时间的Key中LFU淘汰 | — |
| **allkeys-random** | 所有Key中随机淘汰 | — |
| **volatile-random** | 有过期时间的Key中随机淘汰 | — |
| **volatile-ttl** | 有过期时间的Key中选TTL最短的 | — |

**LRU vs LFU**：

| | LRU | LFU |
|------|-----|-----|
| 含义 | 最近最少使用 | 最少频率使用 |
| 判断 | 访问时间 | 访问次数 |
| 适合 | 缓存一般场景 | 保护高频热点数据 |

### 5.2 过期删除策略

| 策略       | 说明                        |
| -------- | ------------------------- |
| **惰性删除** | 访问Key时才检查是否过期（省CPU，可能占内存） |
| **定期删除** | 每隔一段时间随机抽检删除过期Key（折衷方案）   |
| **定时删除** | 每个Key设定时器到期即删（Redis未采用）   |

**Redis实际使用**：惰性删除 + 定期删除的组合。

### 5.3 Pipeline（管道）

一次性发送多条命令，减少RTT，非事务（不保证原子）。

```
单条：Client → Redis（RTT）
      Client ← Redis（RTT）

管道：Client → 命令1,命令2,命令3... → Redis
      Client ← 结果1,结果2,结果3... → Redis（一次RTT）
```

### 5.4 Redis 事务

| 命令 | 说明 |
|------|------|
| MULTI | 开启事务 |
| EXEC | 执行事务中所有命令 |
| DISCARD | 放弃事务 |
| WATCH | 监视Key，如果Key被修改则事务失败（乐观锁） |

**Redis 事务特点**：不支持回滚（某条命令失败，其余命令仍执行）；WATCH提供CAS乐观锁。

### 5.5 Lua 脚本

| 特点 | 说明 |
|------|------|
| **原子性** | 脚本执行期间不执行其他命令 |
| **减少RTT** | 多条命令一次发送 |
| **条件逻辑** | 可在Redis端执行if/else逻辑 |
| **注意** | 脚本不应长时间运行（阻塞） |

**典型场景**：原子库存扣减、分布式锁的安全释放。

```lua
-- 示例：原子库存扣减
local stock = redis.call('GET', KEYS[1])
if tonumber(stock) >= tonumber(ARGV[1]) then
    return redis.call('DECRBY', KEYS[1], ARGV[1])
else
    return -1
end
```

### 5.6 发布-订阅（Pub/Sub）

```
Publisher → Channel → Subscriber A
                   → Subscriber B
```

**缺点**：消息不持久化（离线丢失），无ACK确认。

**Redis Stream**（5.0+）解决了Pub/Sub的以上问题，支持消费者组和ACK。

---

## 6. Redis 常见问题与解决方案

### 6.1 缓存三大问题

> 详见 [07-分布式系统与中间件.md](07-分布式系统与中间件.md) 5.2节，此处补充Redis特定实现

| 问题 | Redis 解决方案 |
|------|-------------|
| **缓存穿透** | ① 布隆过滤器（RedisBloom）；② 缓存空值（短TTL） |
| **缓存击穿** | ① `SETNX`加互斥锁；② 热点Key永不过期+异步更新 |
| **缓存雪崩** | ① 过期时间加随机值（±15%）；② 多级缓存；③ 限流降级 |

### 6.2 缓存与数据库一致性

| 方案 | 操作顺序 | 特点 |
|------|---------|------|
| **Cache Aside** | 先更DB → 再删缓存 | 最常用 |
| **延迟双删** | 删缓存 → 更DB → 延迟(如1s)再删缓存 | 降低读写并发不一致概率 |
| **订阅Binlog** | 监听DB binlog → 异步更新缓存 | 解耦、最终一致 |
| **Write Through** | 同时更新缓存和DB | 缓存数据永远最新，但写性能低 |

**Cache Aside 为什么先更DB再删缓存**？
- 若先删缓存再更DB：删缓存后、更新DB前，有其他请求读到旧数据回写缓存 → 缓存中是旧数据
- 先更DB再删缓存：即使删缓存失败，下次读取最多读到旧数据，有TTL兜底

### 6.3 大Key与热Key

| 问题       | 定义                       | 危害           | 解决方案            |
| -------- | ------------------------ | ------------ | --------------- |
| **大Key** | 单个Key的Value很大（如Hash百万字段） | 阻塞Redis，迁移超时 | 拆分、压缩、定期清理      |
| **热Key** | QPS集中在少数Key上             | 单节点CPU过载     | 本地缓存、多副本分片、读写分离 |

### 6.4 BigKey排查

```bash
redis-cli --bigkeys          # 粗略扫描
redis-cli --memkeys          # 内存使用扫描
MEMORY USAGE <key>           # 精确内存占用（4.0+）
```

---

## 7. Redis 生产调优

### 7.1 性能优化

| 优化项 | 建议 |
|--------|------|
| **连接池** | 使用JedisPool/Lettuce，避免频繁建连接 |
| **Pipeline** | 批量操作使用管道减少RTT |
| **慢查询日志** | `slowlog-log-slower-than 10000`（>10ms记录） |
| **键设计** | 短但有意义，用`:`分隔（如`user:1001:profile`） |
| **禁用危险命令** | `rename-command FLUSHALL ""` 重命名或禁用 |
| **使用批量命令** | MGET/MSET代替循环GET/SET |

### 7.2 内存优化

| 优化项 | 说明 |
|--------|------|
| **短结构编码** | 小数据使用ziplist/listpack节省内存 |
| **共享对象池** | 小整数(0-9999)共享同一对象 |
| **过期时间** | 设定合理TTL，避免无用Key常驻内存 |
| **碎片整理** | Redis 4.0+ 支持`activedefrag yes`自动碎片整理 |

### 7.3 安全配置

- 设置密码 `requirepass`
- 禁止外网访问 `bind 127.0.0.1`
- 使用非默认端口
- 禁用/重命名危险命令（FLUSHDB, CONFIG, KEYS等）
- 使用TLS加密通信（Redis 6.0+）

---

## 8. 常考考点速查

### 8.1 Redis 数据类型选择

| 需求       | 选型                 |
| -------- | ------------------ |
| 简单缓存/计数  | String             |
| 对象缓存     | Hash               |
| 消息队列（简单） | List (BRPOP)       |
| 消息队列（可靠） | Stream             |
| 排行榜/延迟队列 | ZSet               |
| 共同好友/去重  | Set                |
| UV统计     | HyperLogLog        |
| 签到/布隆过滤  | Bitmap             |
| 附近的人     | Geo                |
| 分布式锁     | String (SET NX PX) |

### 8.2 架构选型

| 场景 | 推荐架构 |
|------|---------|
| 单机、读多写少 | 主从复制 |
| 需要自动故障切换 | Sentinel |
| 数据量大、需水平扩展 | Cluster |
| 持久化+高性能 | RDB + AOF (everysec)混合 |

### 8.3 Redis vs Memcached

| 维度 | Redis | Memcached |
|------|-------|-----------|
| 数据结构 | 丰富 | 仅String |
| 持久化 | 支持 | 不支持 |
| 集群 | Cluster原生支持 | 客户端分片 |
| 线程模型 | 单线程 | 多线程 |
| 内存管理 | jemalloc | Slab（碎片多） |
| 最大Value | 512MB | 1MB |

### 8.4 Redis 常见配置速查

```conf
maxmemory 4gb                   # 最大内存
maxmemory-policy allkeys-lru    # 淘汰策略
save 900 1                      # RDB触发
appendonly yes                  # 开启AOF
appendfsync everysec            # AOF同步策略
slowlog-log-slower-than 10000   # 慢查询阈值(微秒)
```
### 8.5 Redis持久化机制
redis是基于内存的非关系型K-V数据库，因为是基于内存，所以当redis服务器挂了之后，数据就丢失了，redis提供的持久化知识就是把数据存储在硬盘上，分为RDB和AOF两种
rdb:实际上是把内存数据以快照的形式的保存到磁盘上，就是在指定的时间间隔内，执行指定次数的写操作，将内存的数据集快照写入磁盘，这是redis的默认的实现方式，会生成一个drum.rdb的文件，redis重启的时候通过加载导入drum.rdb来恢复数据，触发方式：手动触发（save同步，bgsave异步），自动触发

优点:适合大规模数据的恢复场景，如备份和全量复制
确定，没办法做到实时持久化，以及新老版本rdb的兼容性问题


AOF:采用日志形式来每个写操作，追加到文件中，重启时在执行aof文件的命令来回复数据，解决了数据持久化的实时性问题
优点：数据的一致性和完整性更高
缺点：记录越多文件越大，数据恢复变慢



### 8.6 哨兵模式
◆哨兵模式，由一个或多个Sentinel实例组成的Sentinel系统，它可以监视所有的Redis主节点和从节点，并在被监视的主节点进入下线状态时，自动将下线主服务器属下的某个从节点升级为新的主节点。但是呢，一个哨兵进程对Redis节点进行监控，就可能会出现问题（单点问题），因此，可以使用多个哨兵来进行监控Redis节点，并且各个哨兵之间还会进行监控。

简单来说，哨兵模式就三个作用：  
发送命令，等待Redis服务器（包括主服务器和从服务器）返回监控其运行状态；  
哨兵监测到主节点宕机，会自动将从节点切换成主节点，然后通过==发布订阅==模式通知其他的从节点，修改配置文件，让它们切换主机；  
哨兵之间还会相互监控，从而达到高可用。

故障切换的过程是怎样的呢  
假设主服务器宕机，哨兵1先检测到这个结果，系统并不会马上进行 failover 过程，==仅仅是哨兵1主观的认为主服务器不可用，这个现象成为主观下线==。当后面的哨兵也检测到主服务器不可用，并且数量达到一定值时，那么哨兵之间就会进行一次投票，投票的结果由一个哨兵发起，进行 failover 操作。切换成功后，就会通过==发布订阅==模式，让各个哨兵把自己监控的从服务器实现切换主机，这个过程称为客观下线。这样对于客户端而言，一切都是透明的。

◆哨兵的工作模式如下：
