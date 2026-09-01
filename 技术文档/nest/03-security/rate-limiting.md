# NestJS 速率限制（Rate Limiting / 限流）技术详解

> 来源：https://docs.nestjs.cn/security/rate-limiting
> 作用：限制单位时间内的请求次数，防御暴力破解、刷接口、DDoS。
> 基于 `@nestjs/throttler`。

---

## 一、安装与全局配置

```bash
npm install --save @nestjs/throttler
```
```ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 10 }] })],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }], // 必须绑守卫才生效
})
export class AppModule {}
```
- `ttl`：时间窗口（毫秒）；`limit`：窗口内最大请求数（如 60 秒内最多 10 次）。

**对比**：类似 **Spring 的 `Bucket4j` / `RateLimiter`**、**Nginx 的 `limit_req`**、**Redis + Lua 令牌桶**，Nest 用守卫统一拦截。

---

## 二、多个限流定义

```ts
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },
  { name: 'medium', ttl: 10000, limit: 20 },
  { name: 'long', ttl: 60000, limit: 100 },
]);
```

---

## 三、装饰器

### @SkipThrottle —— 跳过限流
```ts
@SkipThrottle()               // 整个控制器跳过
@Controller('users')
export class UsersController {
  @SkipThrottle({ default: false }) // 此类中这个路由不跳过
  dontSkip() { return 'limited'; }
  doSkip() { return 'unlimited'; }
}
```

### @Throttle —— 覆盖全局
```ts
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get() findAll() { return 'custom'; }
```

---

## 四、代理与支持

- 在代理后需信任代理，否则拿到的 IP 是代理 IP：
```ts
app.set('trust proxy', 'loopback'); // Express
```
```ts
// 自定义提取真实 IP
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
```

---

## 五、分布式（Redis 存储）

- 默认内存存储**不跨实例**，多副本部署需共享存储（Redis 社区存储）。
- 自定义：实现 `ThrottlerStorage` 接口传 `storage` 选项。

---

## 六、异步配置

```ts
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config) => [{ ttl: config.get('THROTTLE_TTL'), limit: config.get('THROTTLE_LIMIT') }],
});
```

---

## 七、其他要点

- 时间助手：`seconds(5)`、`minutes(1)`、`hours(1)` 返回毫秒，提升可读性（替代手写 `ttl: 60000`）。
- WebSockets / GraphQL 需扩展 `ThrottlerGuard` 覆写 `handleRequest` / `getRequestResponse`。
- 配置项：`blockDuration`、`ignoreUserAgents`、`skipIf`、`errorMessage`、`getTracker`、`generateKey`。

---

## 八、最佳实践

1. 登录/注册/发短信等敏感接口必须限流，防暴力破解。
2. 多实例部署用 Redis 存储，否则限流失效。
3. 代理后正确取真实 IP，否则限流被绕过或误伤。

> 口诀：**"ttl 窗口 limit 次数，守卫绑了才生效；多实例上 Redis，代理取真 IP。"**
