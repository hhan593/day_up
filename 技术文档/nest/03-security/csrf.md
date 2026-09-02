# NestJS CSRF 跨站请求伪造防护技术详解

> 来源：https://docs.nestjs.cn/security/csrf
> 作用：防御 CSRF（XSRF）——攻击者借已登录用户的浏览器，向本服务发非自愿请求（改密码、转账）。
> 推荐包：Express 用 `csrf-csrf`（double-csrf），Fastify 用 `@fastify/csrf-protection`。
> 最后更新：2026/8/9（文档日期）
> ⚠️ 文档未给完整路由级令牌下发/校验示例，下方补充标准用法。

---

## 一、CSRF 攻击原理

- 浏览器访问 `a.com` 登录后带 Cookie；用户又访问恶意 `evil.com`，页面偷偷发请求到 `a.com`（自动带 Cookie），服务端误以为是本人操作。
- 防护核心：**要求请求携带只有本页面 JS 能拿到的 CSRF 令牌**（Cookie 自动带，令牌手动带 → 攻击网站拿不到令牌）。

**对比**：类似 **Spring Security 的 `CsrfFilter` + `CookieCsrfTokenRepository`**、**Django 的 `{% csrf_token %}`**，思路都是"双提交令牌"。

---

## 二、Express 中使用（csrf-csrf / double-csrf）

```bash
npm i csrf-csrf
```
```ts
import { doubleCsrf } from 'csrf-csrf';

const {
  invalidCsrfTokenError,
  generateToken,       // 在路由中生成/下发令牌
  validateRequest,     // 自定义中间件可用
  doubleCsrfProtection, // 默认保护中间件
} = doubleCsrf({
  getSecret: () => 'session-secret', // 生产用每用户随机 secret（配合 session）
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: { sameSite: 'lax', path: '/', secure: true },
  tokenCookieName: '__Host-psifi.x-csrf-token',
});

app.use(doubleCsrfProtection);
```

### 下发令牌（路由级，标准补充）
```ts
@Get('csrf/token')
getToken(@Req() req, @Res() res) {
  const token = generateToken(req, res);
  res.json({ token });
}
```
- 前端：先 GET 拿令牌，之后状态变更请求（POST/PUT/DELETE）在 header 带 `x-csrf-token: <token>`。

> ⚠️ 文档警告：`csrf-csrf` 需**先初始化会话中间件或 cookie-parser**，否则不工作。

---

## 三、Fastify 中使用

```bash
npm i --save @fastify/csrf-protection
```
```ts
import fastifyCsrf from '@fastify/csrf-protection';
// 需先注册存储插件（如会话存储）
await app.register(fastifyCsrf);
```
> ⚠️ 需先初始化存储插件（如 `@fastify/session` / 会话），详见官方文档。

---

## 四、何时需要 CSRF 防护

| 认证方式 | 是否需要 CSRF 防护 |
|---|---|
| Cookie/Session 登录（浏览器自动带 Cookie） | ✅ 需要 |
| JWT 放 `Authorization` 头（非 Cookie） | ❌ 基本不需要（无自动携带的凭据） |

> 关键点：CSRF 只对"浏览器自动附带凭据"的场景有效。纯 JWT Bearer 令牌（存在 localStorage、手动加头）不受 CSRF 影响，但要防 XSS 偷令牌（用 Helmet CSP + HttpOnly Cookie 存 token 更佳）。

---

## 五、最佳实践

1. Cookie/Session 认证务必开 CSRF 防护。
2. 令牌用 double-submit + HttpOnly Cookie 存密值，前端只拿明文令牌放请求头。
3. CSRF 防护**不能替代**认证，二者叠加（见 `authentication.md` / `helmet.md`）。

> 口诀：**"Cookie 登录怕 CSRF，双提交令牌来防；JWT 走头不中招，XSS 偷令牌要警惕。"**
