# NestJS 压缩（Compression）技术详解

> 来源：https://docs.nestjs.cn/techniques/compression
> 作用：压缩响应体（gzip/brotli），减小传输体积、加快加载。Express / Fastify 用法不同。

---

## 一、与 Express 配合（默认）

```bash
npm i --save compression
npm i --save-dev @types/compression
```
```ts
import * as compression from 'compression';
app.use(compression()); // 作为全局中间件
```

---

## 二、与 Fastify 配合

```bash
npm i --save @fastify/compress
```
```ts
import compression from '@fastify/compress';
await app.register(compression);
```
- Node ≥ 11.7 默认用 **Brotli**（质量最大 11，较慢）。
- 自定义 Brotli 质量（质量 4，换速度）：
```ts
import { constants } from 'zlib';
await app.register(compression, {
  brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } },
});
```
- 仅用 gzip/deflate：
```ts
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

---

## 三、生产建议

> **高流量生产环境建议把压缩交给反向代理（Nginx）处理**，应用层不启用压缩中间件，避免占用 Node CPU。

**对比**：类似 **Nginx 的 `gzip on;`**、**ASP.NET Core 的 `ResponseCompression`**，是"边缘压缩"还是"应用压缩"的取舍。

> 口诀：**"Express 用 compression 中间件，Fastify 用 @fastify/compress；生产让 Nginx 压，Node 别添乱。"**
