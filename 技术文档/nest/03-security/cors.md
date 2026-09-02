# NestJS CORS 跨域资源共享技术详解

> 来源：https://docs.nestjs.cn/security/cors
> 作用：允许浏览器从其他源（域名/端口/协议）访问本服务接口。默认同源策略禁止跨域。
> Nest 按平台自动选用 `cors`（Express）或 `@fastify/cors`（Fastify）。
> 最后更新：2026/8/9（文档日期）
> ⚠️ 文档仅给出基础调用，未列配置字段；下方配置对象示例为基于官方 CORS 包的标准实践补充。

---

## 一、CORS 是什么

- 浏览器同源策略：协议 + 域名 + 端口 任一不同即"跨域"，默认禁止前端 JS 读响应。
- CORS 通过响应头 `Access-Control-Allow-Origin` 等告诉浏览器"允许某源访问"。

**对比**：类似 **Spring 的 `@CrossOrigin` / `CorsConfiguration`**、**ASP.NET 的 `CorsPolicy`**，都是"白名单指定哪些前端能调我"。

---

## 二、启用 CORS 两种方式

### 方式 1：`app.enableCors()`
```ts
const app = await NestFactory.create(AppModule);
app.enableCors(); // 默认允许所有源（生产慎用）
await app.listen(3000);
```

### 方式 2：create 的 cors 选项
```ts
const app = await NestFactory.create(AppModule, { cors: true });
// 也可传配置对象或回调函数
```

---

## 三、常用配置对象（标准实践补充）

> 文档说"属性见官方 CORS 文档"，以下为 Express `cors` 包常用字段：

```ts
app.enableCors({
  origin: ['https://example.com', 'https://admin.example.com'], // 白名单（数组或函数）
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,   // 允许跨域携带 Cookie / Authorization（前端需 withCredentials）
  maxAge: 3600,        // 预检结果缓存秒数
  exposedHeaders: ['X-Custom-Header'],
});
```

### 动态/异步判定（回调）
```ts
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || WHITELIST.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
});
```

### 凭据（credentials）要点
- `credentials: true` 时，`origin` **不能为 `*`**（必须显式域名），否则浏览器拒绝。
- 前端 fetch 需 `credentials: 'include'`。

---

## 四、Express vs Fastify

| 项 | Express | Fastify |
|---|---|---|
| 包 | `cors` | `@fastify/cors` |
| 启用 | `app.enableCors()` | `app.enableCors()`（一致） |
| 配置字段 | 同（底层包不同） | 同 |

---

## 五、最佳实践

1. 生产**绝不**用 `enableCors()` 默认全开，必须配 `origin` 白名单。
2. 带 Cookie 认证时用 `credentials: true` + 显式 origin（不用 `*`）。
3. 只暴露必要 methods/headers。

> 口诀：**"跨域默认禁止，enableCors 放开；origin 白名单，credentials 显式源；生产别用星。"**
