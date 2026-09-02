# 23 - Redis / 缓存（Spring Data Redis、@Cacheable）

> 来源：Spring Data Redis 官方文档（Spring Data 2025.1 / 对应 Spring Boot 3.5，docs.spring.io）
> 补充：Redis 官方命令（redis.io）、Spring Cache 抽象（@Cacheable 等）
> 说明：Spring 官方页为 JS 渲染，下列基于 Spring Data Redis 标准 API 与官方参考结构整理；Redis 命令语义来自 redis.io 标准。

Redis 是高性能内存键值库，常用作缓存、会话存储、消息队列（Stream/List）、分布式锁。

---

## 一、Spring Data Redis 核心

### 1. 依赖与配置
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: ""
      database: 0
```

### 2. RedisTemplate（底层操作）
```java
@Autowired RedisTemplate<String, Object> redisTemplate;

// 五种结构对应 ops
redisTemplate.opsForValue().set("k", "v", 10, TimeUnit.MINUTES);  // String
redisTemplate.opsForValue().get("k");
redisTemplate.opsForHash().put("user:1", "name", "Tom");          // Hash
redisTemplate.opsForList().leftPush("queue", "msg");              // List
redisTemplate.opsForSet().add("tags", "a","b");                   // Set
redisTemplate.opsForZSet().add("rank", "u1", 100);                // Sorted Set
```

- 默认 `RedisTemplate` 用 JDK 序列化（二进制不可读）；生产应配 `StringRedisSerializer` + `Jackson2JsonRedisSerializer`：
```java
@Bean
public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory f) {
    RedisTemplate<String, Object> t = new RedisTemplate<>();
    t.setConnectionFactory(f);
    t.setKeySerializer(new StringRedisSerializer());
    t.setValueSerializer(new GenericJackson2JsonRedisSerializer());
    return t;
}
```

### 3. StringRedisTemplate（推荐，键值为字符串）
```java
@Autowired StringRedisTemplate stringRedisTemplate;
stringRedisTemplate.opsForValue().set("name", "Tom");
```

---

## 二、Spring Cache 抽象（@Cacheable）

声明式缓存，底层可接 Redis / Caffeine / Ehcache。

```java
@Configuration
@EnableCaching
public class CacheConfig { }     // 引入 spring-boot-starter-cache + data-redis 即自动用 Redis

@Service
public class UserService {
    @Cacheable(value = "user", key = "#id")              // 命中则返回缓存
    public User findById(Long id) { return repo.findById(id); }

    @CachePut(value = "user", key = "#user.id")          // 更新缓存
    public User save(User user) { return repo.save(user); }

    @CacheEvict(value = "user", key = "#id")             // 删除缓存
    public void delete(Long id) { repo.deleteById(id); }

    @Caching(evict = { @CacheEvict("a"), @CacheEvict("b") })  // 组合
    public void clear() { }
}
```

| 注解 | 作用 |
|---|---|
| `@Cacheable` | 方法结果缓存，先查后存 |
| `@CachePut` | 总是执行并更新缓存 |
| `@CacheEvict` | 删除缓存（如 `allEntries=true` 清整个空间） |
| `@Caching` | 组合多个缓存操作 |
| `@CacheConfig` | 类级别统一 `cacheNames` |

- `key`：SpEL 表达式（`#id`、`#user.id`、`#root.methodName`）。
- `condition` / `unless`：条件缓存（如 `unless = "#result == null"` 不缓存空值）。
- `TTL` 通过 Redis 配置或自定义 `RedisCacheManager` 设置（`setDefaultExpiration`）。

---

## 三、缓存典型问题与对策

| 问题 | 说明 | 对策 |
|---|---|---|
| 缓存穿透 | 查不存在的 key 打穿 DB | 缓存空值 / 布隆过滤器 |
| 缓存击穿 | 热点 key 失效瞬间大量请求 | 互斥锁 / 逻辑过期 |
| 缓存雪崩 | 大量 key 同时失效 | TTL 加随机抖动 |
| 双写一致性 | 更新 DB 与缓存顺序 | 先更新 DB 再删缓存（Cache-Aside） |

> 推荐模式：**Cache-Aside（旁路缓存）**——读时查缓存未命中查 DB 并回填；写时更新 DB + 删缓存。

---

## 四、分布式锁（Redis）

```java
// SET key value NX EX seconds —— 原子加锁
Boolean ok = stringRedisTemplate.opsForValue()
    .setIfAbsent("lock:order:1", uuid, 30, TimeUnit.SECONDS);
if (ok) { try { /* 临界区 */ } finally { releaseLock(); } }
```

- `SET NX`（不存在才设）+ 过期时间防死锁；释放需用 Lua 脚本校验 uuid 防误删他人锁。
- 也可用 Redisson 的 `RLock`（封装了看门狗自动续期）。

---

## 五、Redis 其他用途

- **会话存储**：Spring Session + Redis 实现集群共享 Session（替代 JWT 服务端状态）。
- **限流**：`INCR` + `EXPIRE` 或 Redis Cell 模块。
- **消息队列**：`List`(LPUSH/BRPOP) 或 `Stream`（XADD/XREAD，支持消费组）。
- **发布订阅**：`PUBLISH` / `SUBSCRIBE`。

---

## 六、与系列其他文档的关系

- 缓存注解常与 JPA/MyBatis 配合（21 篇分页结果缓存、19/20 实体缓存）。
- JWT 注销黑名单存 Redis（22 篇）。
- 微服务间共享缓存 / 限流见 `24-消息队列-微服务.md`。
- 对比前端：Redis 类似浏览器 `localStorage` 但服务端共享、可过期、结构化；性能关键路径（热点数据）放 Redis 类比 React 的 `useMemo` 记忆化（`技术文档/react`）。
