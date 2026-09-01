# Recipes - CORS（跨域资源共享）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/security/cors/`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第十四章。CORS 是浏览器安全机制，Nest 在平台层（Express `cors` / Fastify `@fastify/cors`）封装启用。衔接 `03-security`。

## 一、概念

CORS（Cross-Origin Resource Sharing）允许浏览器从**另一个域**请求资源。Nest 底层用对应平台的 CORS 包，提供全局开关与可配置选项。

## 二、启用 CORS

```ts
const app = await NestFactory.create(AppModule);
app.enableCors();                  // 全局启用（默认配置）
await app.listen(process.env.PORT ?? 3000);
```

## 三、传入配置对象

```ts
app.enableCors({
  origin: 'https://example.com',   // 允许的源（⚠️ 官方页未列字段，此处为底层 CORS 标准用法补充）
  credentials: true,               // 允许跨域带 Cookie
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

> ⚠️ 来源说明：中文文档 `security/cors` 页只写到"可用属性见官方 CORS 文档"，未列 `origin`/`credentials` 具体字段。上面 `origin`/`credentials` 是底层 `cors` 包的标准用法（已在生产广泛验证），标注为**标准实践补充**。

## 四、另一种写法：create 的 cors 选项

```ts
const app = await NestFactory.create(AppModule, {
  cors: true,                 // 默认启用
  // cors: { origin: '...', credentials: true },  // 或传对象
});
await app.listen(3000);
```

两种方式等价，都是**全局**生效（所有路由，无需每控制器单独配）。

## 五、生产建议

| 场景 | 配置 |
|------|------|
| 指定前端域名 | `origin: 'https://your-frontend.com'` |
| 允许多个源 | `origin: ['https://a.com', 'https://b.com']` |
| 带登录态 | `credentials: true`（同时前端 fetch 设 `credentials: 'include'`） |
| 开发临时 | `origin: true`（反射请求来源，方便但不建议上生产） |

⚠️ 切勿生产用 `origin: '*'` + `credentials: true`（浏览器会拒绝，且不安全）。需要凭据时 `origin` 必须显式列出。

## 六、要点

| 关注点 | 做法 |
|--------|------|
| 全局启用 | `app.enableCors()` 或 `create(..., { cors: true })` |
| 自定义 | `enableCors(options)` / `cors: {...}` |
| 凭据 | `credentials: true` + 显式 `origin` |
| 安全 | 不用 `*` + credentials |

> 跨框架对比：Spring 的 `@CrossOrigin` / `CorsRegistry`、Express 的 `cors()` 中间件——Nest 用 `enableCors` 全局开关，最贴近 Express 原生封装。

## 下一篇

→ `prisma.md`：Prisma ORM（现代类型安全数据库工具）。
