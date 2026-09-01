# Recipes - 缓存（Caching）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/caching`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第五章。缓存降低重复计算/查询压力，衔接 `01-fundamentals/interceptors.md`（CacheInterceptor 本质是拦截器）。

## 一、安装

```bash
npm i @nestjs/cache-manager cache-manager
# redis 存储（可选）
npm i cache-manager-redis-store redis
```

> 文档标注：Nest v10+ 用 `@nestjs/cache-manager`（基于 `cache-manager` v5+）。旧版 `@nestjs/common` 内建 `CacheModule` 已拆出。

## 二、注册 CacheModule

```ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register({ ttl: 5, max: 100 })],  // ttl 秒；max 最大条数
})
export class AppModule {}
```

- `ttl`：条目存活时间（秒），默认不限。
- `max`：最大缓存条目，超出 LRU 淘汰。

## 三、全局缓存 + 拦截器

```ts
// main.ts
app.useGlobalInterceptors(new CacheInterceptor());
```

```ts
// 控制器方法上加 @UseInterceptors(CacheInterceptor)
@Get()
@UseInterceptors(CacheInterceptor)
findAll() {
  return this.catsService.findAll();
}
```

- 第一次请求查 DB 并缓存；之后 5 秒内的请求直接返回缓存（按 URL 作 key）。
- `CacheInterceptor` 是 `01-fundamentals/interceptors.md` 的内置实现，原理是 `intercept` 里先看缓存命中。

## 四、代码内手动读写

```ts
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CatsService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCat(id: string) {
    const cached = await this.cacheManager.get(`cat-${id}`);
    if (cached) return cached;
    const cat = await this.repo.find(id);
    await this.cacheManager.set(`cat-${id}`, cat, 30); // ttl 30s
    return cat;
  }
  async clear(id: string) {
    await this.cacheManager.del(`cat-${id}`);
  }
}
```

- `get/set/del` 均返回 Promise（async）。
- `set(key, val, ttl)` 可覆盖默认 ttl。

## 五、改用 Redis 存储

```ts
CacheModule.register({
  store: redisStore,            // 或 'redis'（按版本）
  host: 'localhost',
  port: 6379,
  ttl: 60,
}),
```

- 分布式/多实例部署必用 Redis，否则各实例缓存不共享。
- 异步：`registerAsync({ useFactory, inject })` 接 ConfigModule。

## 六、要点

| 场景 | 方式 |
|------|------|
| URL 级缓存 | `@UseInterceptors(CacheInterceptor)` |
| 精细化控制 | 注入 `CACHE_MANAGER` 手动 get/set/del |
| 共享缓存 | Redis store |
| 生命周期 | `ttl` + `max` 控制失效与容量 |

> 跨框架对比：Spring 的 `@Cacheable`、Laravel 的 Cache Facade、Express 的 `apicache`——Nest 用拦截器 + 缓存管理器统一，拦截器方案最贴近 Spring AOP 风格。

## 下一篇

→ `serialization.md`：序列化（隐藏敏感字段）。
