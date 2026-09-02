# NestJS Cookie 技术详解

> 来源：https://docs.nestjs.cn/techniques/cookies
> 作用：读写 HTTP Cookie（存储会话 ID、偏好、追踪标识）。Express / Fastify 用法不同。

---

## 一、与 Express 配合（默认）

### 安装与注册中间件
```bash
npm i cookie-parser
npm i -D @types/cookie-parser
```
```ts
import * as cookieParser from 'cookie-parser';
app.use(cookieParser());
```
- 可传 `secret` 解析签名 Cookie；解析后 `req.cookies`（普通）/ `req.signedCookies`（签名）。

### 读取 Cookie
```ts
import { Req } from '@nestjs/common';
import { Request } from 'express';

@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // 或 request.cookies['key']
}
```

### 设置 Cookie
```ts
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value');
}
```
> ⚠️ 必须 `passthrough: true`，否则框架不再接管响应（拦截器、状态码都会失效）。

---

## 二、与 Fastify 配合

```bash
npm i @fastify/cookie
```
```ts
import fastifyCookie from '@fastify/cookie';
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(fastifyCookie, { secret: 'my-secret' });
```
```ts
// 读取
@Get() findAll(@Req() request: FastifyRequest) { console.log(request.cookies); }
// 设置
@Get() findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value');
}
```

---

## 三、自定义 @Cookies 装饰器（跨平台）

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? request.cookies?.[data] : request.cookies;
  },
);

@Get()
findAll(@Cookies('name') name: string) {}
```

> 说明：Nest 的 `@nestjs/common` **没有**直接读 Cookie 的装饰器（不像 `@Session()`），需自行 `createParamDecorator` 封装，这也是官方推荐写法。

**对比**：类似 **ASP.NET 的 `Request.Cookies["key"]`**、**Express 的 `req.cookies`**，Nest 把它收敛成声明式装饰器。

---

## 四、最佳实践

1. 敏感 Cookie 设 `httpOnly`、`secure`、`sameSite` 防 XSS/CSRF。
2. 用 `passthrough: true` 避免破坏 Nest 响应管线。
3. 跨平台项目用自定义 `@Cookies` 装饰器，业务代码不依赖底层框架类型。

> 口诀：**"Express 用 cookie，Fastify 用 setCookie；要声明式，装饰器自己写；passthrough 别忘了。"**
