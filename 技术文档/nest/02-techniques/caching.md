# NestJS 缓存（Caching）技术详解

> 来源：https://docs.nestjs.cn/techniques/caching
> 作用：在应用与数据源之间加一层临时存储，加速重复读取、降低数据库/下游服务压力。
> 底层基于 `cache-manager`（Keyv），默认内存，可切换 Redis。

---

## 一、安装

```bash
npm install @nestjs/cache-manager cache-manager
```

- 默认内存存储；想换 Redis 再加 `@keyv/redis`。
- 对比其他缓存框架：这类似 **Spring 的 `@Cacheable` + Caffeine/Redis**，但 Nest 把"缓存读/写"和"响应拦截"分成了两套 API。

---

## 二、CacheModule 基础

### 2.1 启用（内存）
```ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

@Module({ imports: [CacheModule.register()] })
export class AppModule {}
```

### 2.2 全局模块
```ts
CacheModule.register({ isGlobal: true }); // 根模块加载后其他模块无需再导入
```

### 2.3 自定义 TTL（毫秒）
```ts
CacheModule.register({ ttl: 5000 }); // 默认 0 = 永不过期
```

---

## 三、手动读写缓存（CACHE_MANAGER）

```ts
import { Inject, Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

const value = await this.cacheManager.get('key');   // 不存在返回 undefined
await this.cacheManager.set('key', 'value');         // 默认 TTL
await this.cacheManager.set('key', 'value', 1000);  // 覆盖 TTL（毫秒）
await this.cacheManager.set('key', 'value', 0);      // 0 = 禁用过期
await this.cacheManager.del('key');                  // 删除
await this.cacheManager.clear();                     // 清空
```

> 注意：内存存储只支持结构化克隆算法支持的类型（不能存函数、class 实例等）。

---

## 四、自动缓存响应（CacheInterceptor）

### 4.1 局部使用
```ts
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] { return []; }
}
```
- 仅 **GET** 端点被缓存
- 注入了原生 `@Res()` 的路由不可用（拦截器无法决定响应）
- GraphQL 中拦截器按字段执行，无法正常工作

### 4.2 全局绑定
```ts
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  providers: [{ provide: APP_INTERCEPTOR, useClass: CacheInterceptor }],
})
export class AppModule {}
```

> 对比：这正是 Spring 的 `@Cacheable` 思路——"声明式缓存"，但 Nest 用拦截器实现，粒度在路由层。

---

## 五、@CacheKey / @CacheTTL 覆盖

```ts
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller()
@CacheTTL(50)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] { return []; }
}
```
- 方法级 TTL 优先于控制器级
- 未覆盖的用全局默认

WebSocket/微服务需配合 `@CacheKey` + `@CacheTTL` 使用；不要缓存写操作。

---

## 六、调整追踪 key（trackBy）

默认用 URL 关联缓存，可重写 `trackBy` 自定义：
```ts
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
```

---

## 七、切换到 Redis 等存储

```bash
npm install @keyv/redis
```
```ts
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';

CacheModule.registerAsync({
  useFactory: async () => ({
    stores: [
      new Keyv({ store: new KeyvCacheableMemory({ ttl: 60000, lruSize: 5000 }) }),
      new KeyvRedis('redis://localhost:6379'),
    ],
  }),
});
```
- 第一个 store 为默认；多 store 形成"多层缓存"（内存 → Redis）。

---

## 八、异步配置

```ts
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
// 也支持 useClass / useExisting（实现 CacheOptionsFactory）
```

---

## 九、最佳实践速记

1. 生产用 Redis 而不是内存（内存不跨进程、重启丢失）。
2. 只读、重复计算多的 GET 端点用 `CacheInterceptor`。
3. 写操作后记得 `del`/`clear` 相关 key，避免脏数据。
4. 敏感数据别进缓存（除非加密）。
5. 用 `@CacheKey` 避免不同参数共用同一 key 造成串数据。

> 口诀：**"读多写少才上缓存，内存默认 Redis 换，拦截器管 GET，写后记得清。"**
