# NestJS 性能（Fastify 适配器）技术详解

> 来源：https://docs.nestjs.cn/techniques/performance
> 作用：用 Fastify 替换默认 Express HTTP 提供程序，提升吞吐量（基准测试快近 2 倍）。
> 注意：本页只讲 Fastify 适配器，未涉及 cluster / 压缩 / 缓存（见各自独立章节）。

---

## 一、为什么用 Fastify

- Nest 默认 Express，但通过适配器实现框架无关。
- Fastify 基准测试快近两倍，适合高性能场景。
- 迁移到 `FastifyAdapter` 通常**无需改业务代码**。

**对比**：类似 **Java 换 Undertow/Netty 替代 Tomcat**、**Node 换 `uWebSockets.js`**，都是"换底层 HTTP 引擎换性能"。

---

## 二、安装与基础用法

```bash
npm i --save @nestjs/platform-fastify
```
```ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.listen(process.env.PORT ?? 3000);
// 监听其他主机：await app.listen(3000, '0.0.0.0');
```

---

## 三、平台特定注意点

### 依赖 Express 的包需换 Fastify 版
- 用了 Express 中间件/包（如 `multer`、`compression`）需换 `@fastify/multipart`、`@fastify/compress` 等。

### 重定向响应
```ts
@Get() index(@Res() res) { res.status(302).redirect('/login'); }
```

### 适配器配置
```ts
new FastifyAdapter({ logger: true });
```

### 中间件拿到原生 req/res（middie 机制）
```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Request...');
    next();
  }
}
```

### 路由配置（@RouteConfig / @RouteConstraints，v10.3.0+）
```ts
import { RouteConfig, RouteConstraints } from '@nestjs/platform-fastify';

@RouteConfig({ output: 'hello world' })
@Get() index(@Req() req) { return req.routeConfig.output; }

@RouteConstraints({ version: '1.2.x' })
newFeature() { return 'works for >= 1.2.x'; }
```

---

## 四、性能建议

1. 高并发纯 API 服务优先选 Fastify。
2. 注意平台不兼容的中间件要替换。
3. 真要压榨性能，再叠加：集群模式（`cluster`）、Nginx 压缩、缓存（见缓存/压缩章节）。

> 口诀：**"性能不够换 Fastify，近两倍吞吐；中间件要换包，配置 adapter 传；集群缓存再叠加。"**
