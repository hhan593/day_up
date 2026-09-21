# Redis 缓存与分布式锁知识总纲

> 定位：高性能缓存 + 计数器 + 分布式锁 + 消息/排行榜，后端高频组件。
> 衔接：`02-java-middle/23-Redis缓存.md`（Spring Data Redis / `@Cacheable` 用法层）、`02-java-middle/39-Spring事务与传播机制.md`（缓存与 DB 一致性与事务提交时机的配合）、`08-springboot/README.md#九缓存抽象`（Spring Cache 接 Redis）、`10-distributed/README.md`（分布式锁）。

---

## 目录

- [一、Redis 是什么](#一redis-是什么)
- [二、数据类型与场景](#二数据类型与场景)
- [三、持久化](#三持久化)
- [四、缓存设计问题](#四缓存设计问题)
- [五、缓存与数据库一致性](#五缓存与数据库一致性)
- [六、分布式锁](#六分布式锁)
- [七、高可用与集群](#七高可用与集群)
- [八、常见面试考点](#八常见面试考点)

---

## 一、Redis 是什么

- 基于内存的**键值**数据库，单线程模型（网络 IO + 命令执行），6.0+ 引入多线程 IO。
- 性能极高（~10w QPS），支持持久化、主从、哨兵、集群。
- 用途：缓存、会话、计数器、限流、排行榜、消息队列（轻量）、分布式锁。

---

## 二、数据类型与场景

| 类型 | 说明 | 典型场景 |
|------|------|----------|
| String | 字符串/整数 | 缓存对象(JSON)、计数器(`INCR`)、限流 |
| Hash | 字段-值 | 用户信息、购物车 |
| List | 双向链表 | 消息队列、最新列表 |
| Set | 无序去重 | 点赞、共同好友 |
| ZSet | 有序集合 | 排行榜、延迟队列 |
| Bitmap/HyperLogLog | 位图/基数 | 签到、UV 统计 |

---

## 三、持久化

- **RDB**：定时快照，恢复快，可能丢最近数据；适合备份。
- **AOF**：记录写命令，可每秒/每次刷盘，数据更全，文件大；支持 `rewrite` 压缩。
- 生产：RDB + AOF 混合（Redis 4+ `aof-use-rdb-preamble`）。

---

## 四、缓存设计问题

1. **缓存穿透**：查不存在的 key，打到 DB。
   - 解决：布隆过滤器、缓存空值（短 TTL）。
2. **缓存击穿**：热点 key 失效瞬间大量请求打到 DB。
   - 解决：互斥锁重建、逻辑过期、热点不过期。
3. **缓存雪崩**：大量 key 同时失效 / Redis 宕机。
   - 解决：TTL 加随机、多级缓存、Redis 高可用。

---

## 五、缓存与数据库一致性

- 推荐 **Cache Aside（旁路缓存）**：
  - 读：cache 命中返回；未命中读 DB 并写 cache。
  - 写：**先更新 DB，再删除 cache**（不是更新 cache）。
- 延迟双删：更新 DB → 删 cache → 延时再删一次（应对并发脏读）。
- 强一致需求：用 binlog 订阅（Canal）异步刷新缓存。

---

## 六、分布式锁

```java
// SET key value NX EX：原子加锁
Boolean ok = redisTemplate.opsForValue()
    .setIfAbsent("lock:order", uuid, Duration.ofSeconds(30));
if (!ok) return "获取锁失败";

try {
    // 业务逻辑
} finally {
    // 用 Lua 脚本保证「判断+删除」原子，防止误删他人锁
    String script = "if redis.call('get',KEYS[1])==ARGV[1] then return redis.call('del',KEYS[1]) else return 0 end";
    redisTemplate.execute(new DefaultRedisScript<>(script, Long.class),
        List.of("lock:order"), uuid);
}
```

- 要点：加锁用 `SET NX EX`（原子）、value 唯一（防误删）、解锁用 Lua 原子、必须**兜底过期**（防宕机死锁）。
- 更完善：Redisson 看门狗自动续期（`lock()` 默认 30s，每 10s 续期）。
- 对比：`10-distributed/README.md` 中 ZooKeeper/DB 方案。

---

## 七、高可用与集群

- **主从**：读写分离，从库备份；主宕需手动/哨兵切换。
- **哨兵（Sentinel）**：监控+自动故障转移+配置中心。
- **Cluster**：数据分片（16384 槽），多主多从，水平扩展；客户端重定向（MOVED）。
- 内存淘汰：`maxmemory-policy`（LRU/LFU/随机/TTL 等）。

---

## 八、常见面试考点

1. **为什么快？** → 内存 + 单线程无锁竞争 + IO 多路复用 + 高效数据结构。
2. **缓存三大问题？** → 穿透/击穿/雪崩及各自解法。
3. **缓存与 DB 一致性？** → 旁路缓存，先 DB 后删 cache。
4. **分布式锁怎么实现？** → `SET NX EX` + 唯一 value + Lua 解锁 + 过期兜底；推荐 Redisson。
5. **Redis 是单线程为何快？** → 内存操作 + 非阻塞 IO + 避免上下文切换。
6. **RDB vs AOF？** → 快照 vs 命令日志；混合最佳。
7. **集群如何分片？** → 16384 槽，key 经 CRC16 映射。
8. **大 key / 热 key 危害？** → 阻塞、倾斜；拆分/本地缓存/多副本。
