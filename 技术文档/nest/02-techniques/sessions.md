# NestJS 会话（Sessions）技术详解

> 来源：https://docs.nestjs.cn/techniques/sessions
> 作用：在多次请求间存储用户状态（购物车、登录态）。Express / Fastify 用法不同。

---

## 一、与 Express 配合（默认）

```bash
npm i express-session
npm i -D @types/express-session
```
```ts
import * as session from 'express-session';
app.use(session({
  secret: 'my-secret',
  resave: false,
  saveUninitialized: false,
}));
```
- `secret`：签署会话 ID cookie（用随机难猜字符串）。
- `resave`：强制未修改会话重存（默认 true 已弃用，设 false）。
- `saveUninitialized`：设 false 可减少存储、满足法律 consent、避免竞态。
- `secure: true`：需 HTTPS；Node 在代理后需设 trust proxy。
- ⚠️ 默认内存存储**只适合开发**，生产有内存泄漏、无法多进程扩展（换 Redis 等）。

### 读取/写入
```ts
// 方式 A：@Req()
@Get() findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
// 方式 B：@Session() 装饰器
@Get() findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
```
- `@Session()` 始终来自 `@nestjs/common`。

---

## 二、与 Fastify 配合

```bash
npm i @fastify/secure-session
```
```ts
import secureSession from '@fastify/secure-session';
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(secureSession, { secret: 'averylogphrase...', salt: 'mq9hDxBVDbspDR6n' });
```
```ts
// 方式 A：@Req()
@Get() findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
// 方式 B：@Session()
@Get() findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
```

---

## 三、关键差异对照

| 项 | Express | Fastify |
|---|---|---|
| 中间件 | `express-session` | `@fastify/secure-session` |
| 读取 | `request.session.x` | `request.session.get('x')` |
| 写入 | `session.x = y` | `session.set('x', y)` |
| `@Session` 类型 | `Record<string,any>` | `secureSession.Session` |

**对比**：类似 **PHP 的 `$_SESSION`**、**Express 原生 session**、**ASP.NET Core 的 `HttpContext.Session`**，Nest 统一用 `@Session()` 装饰器抽象。

> 口诀：**"Express 用 express-session，Fastify 用 secure-session；@Session 装饰器统一拿，生产记得换 Redis。"**
