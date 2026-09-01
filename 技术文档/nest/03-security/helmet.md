# NestJS Helmet 安全响应头技术详解

> 来源：https://docs.nestjs.cn/security/helmet
> 作用：通过设置安全 HTTP 响应头，防御常见 Web 漏洞（XSS、点击劫持、MIME 嗅探等）。
> 本质是一组设置响应头的中间件集合（含 CSP、HSTS 等）。
> 最后更新：2026/8/9（文档日期）

---

## 一、为什么需要 Helmet

浏览器按响应头决定安全策略。Helmet 帮你自动加一组"安全默认值"：
- `Content-Security-Policy`：防 XSS（限制脚本来源）
- `Strict-Transport-Security`：强制 HTTPS
- `X-Frame-Options`：防点击劫持
- `X-Content-Type-Options: nosniff`：防 MIME 嗅探
- `X-XSS-Protection` 等

**对比**：类似 **Spring Security 的 `headers()` 默认安全头**、**Nginx 的 `add_header X-Frame-Options`**，Nest 用中间件统一做。

> ⚠️ 顺序重要：在 `app.use(helmet())` 之后定义的路由不会受影响。务必在注册路由前调用。

---

## 二、Express 中使用（默认）

```bash
npm i --save helmet
```
```ts
import helmet from 'helmet';
app.use(helmet()); // 全局中间件
```

### 与 Apollo Server 4.x 冲突处理
```ts
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
      scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
      frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
    },
  },
}));
```

---

## 三、Fastify 中使用

```bash
npm i --save @fastify/helmet
```
```ts
import helmet from '@fastify/helmet';
await app.register(helmet); // 注意：是 app.register 插件，不是 app.use
```
```ts
// 配置 CSP 示例
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: [`'self'`, 'unpkg.com'],
      styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'unpkg.com'],
      scriptSrc: [`'self'`, `https: 'unsafe-inline'`, `cdn.jsdelivr.net`, `'unsafe-eval'`],
    },
  },
});
// 完全禁用 CSP：await app.register(helmet, { contentSecurityPolicy: false });
```

---

## 四、Express vs Fastify 差异

| 项 | Express | Fastify |
|---|---|---|
| 包 | `helmet` | `@fastify/helmet` |
| 注册 | `app.use(helmet())` | `await app.register(helmet)` |
| 配置 | 同（CSP 指令等） | 同 |

---

## 五、最佳实践

1. 默认全开 Helmet，再用 CSP 按需放宽（前端有 CDN/内联脚本时）。
2. 生产环境务必保留 `Strict-Transport-Security`（HSTS）。
3. CSP 是防御 XSS 的关键，优先用 `'self'` + 明确白名单，避免 `'unsafe-inline'`。

> 口诀：**"Helmet 自动加安全头，Express use / Fastify register；CSP 是 XSS 防线，CDN 要放行。"**
