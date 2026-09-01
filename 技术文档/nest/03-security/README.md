# NestJS 安全（Security）知识库

> 内容来源：https://docs.nestjs.cn/security（官方文档「安全」章节）
> 整理风格：通俗解释 + 跨框架对比（Spring Security / Express / Django 等）+ 代码示例
> 最后更新：2026-09-01（文档页本身最后更新 2026/8/9）

---

## 📑 文档索引（共 7 篇）

| 文档 | 核心内容 | 高频考点 |
|---|---|---|
| [authentication.md](./authentication.md) | JWT 认证 + 自定义 AuthGuard、@Public 装饰器、Passport 入口 | 密码哈希、secret 走环境变量、Bearer 校验 |
| [authorization.md](./authorization.md) | RBAC（RolesGuard）、基于声明、CASL 属性级授权 + 资源归属 | 403、Reflector 读元数据、Ownership |
| [encryption-hashing.md](./encryption-hashing.md) | crypto AES 加密、bcrypt/argon2 哈希 | 加密可逆 vs 哈希不可逆 |
| [helmet.md](./helmet.md) | 安全响应头中间件（CSP/HSTS 等） | Express use / Fastify register |
| [cors.md](./cors.md) | 跨域配置、origin 白名单、credentials | 生产别用 `*`、credentials 显式源 |
| [csrf.md](./csrf.md) | double-csrf / @fastify/csrf-protection、双提交令牌 | Cookie 登录才需要、JWT 不需 |
| [rate-limiting.md](./rate-limiting.md) | @nestjs/throttler、ThrottlerGuard、多定义、Redis | ttl/limit、代理取真 IP |

---

## 🔗 安全纵深防御（Defense in Depth）

```
                         请求进入
                            │
        ┌───────────────────┼───────────────────────┐
        │                   │                       │
   CORS（cors.md）    Helmet 响应头（helmet.md）  限流（rate-limiting.md）
   谁能让浏览器调我   浏览器安全策略加固          防刷/防爆破
        │                   │                       │
        └───────────────────┴───────────────────────┘
                            │
                   认证 AuthGuard（authentication.md）
                   "你是谁"：JWT + 哈希密码
                            │
                   授权 RolesGuard/CASL（authorization.md）
                   "你能做什么"：角色/权限/归属
                            │
                   数据层：加密（encryption-hashing.md）+ 校验（validation.md）
```

---

## 💡 与 02-techniques 的衔接

- **认证 ↔ 校验**：登录用 `@Body()` DTO 时，建议叠加 `ValidationPipe`（见 `../02-techniques/validation.md`）校验用户名/密码格式。
- **认证 ↔ 哈希**：登录密码比对用 `bcrypt.compare`（见 `encryption-hashing.md`），绝不明文。
- **授权 ↔ 序列化**：返回用户时脱敏用 `ClassSerializerInterceptor` 的 `@Exclude()`（见 `../02-techniques/serialization.md`）。
- **CORS ↔ CSRF**：Cookie/Session 认证才需 CSRF；JWT Bearer 不中招但要配好 CORS 白名单。

---

## 📌 使用建议

1. 入门：先读 `authentication.md` + `authorization.md`（认证授权是安全基础）。
2. 面试：重点 `authentication`（JWT+Guard）、`authorization`（RBAC vs CASL）、`encryption-hashing`（bcrypt/argon2 区别）、`csrf`（何时需要）。
3. 排错：按索引表定位对应文档末尾"口诀/最佳实践"。
