# 18. Next.js 部署与运维

> 来源可信度：**官方文档确认**（基于 Next.js 部署文档：Vercel / Node / Docker / 静态导出）
> 关联：`13-caching.md`、`17-app-router-patterns.md`

## 1. 渲染模式决定部署

| 模式 | 要求 |
|------|------|
| 纯静态导出 | `output: 'export'`，无 Server Actions/动态 |
| Node 服务 | 自托管 `next start` |
| Serverless | Vercel/云函数（拆分路由为函数） |
| Edge | 中间件/边缘运行时 |

## 2. 自托管 Node 服务

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]   # next start
```

```bash
next build && next start -p 3000
```

- 多实例需共享 `.next` 构建产物 + 外部缓存（Redis）存 fetch 缓存。

## 3. 环境变量与构建

- `NEXT_PUBLIC_*`：构建期注入客户端。
- 服务端变量：仅 server 可用，不进 bundle。
- `next.config` 区分 `env`/`publicRuntimeConfig`。

## 4. 缓存与 CDN

- 全站 CDN：静态资源 + ISR 页面边缘缓存（见 `13-caching.md`）。
- 自托管需自己配反向代理（Nginx）做缓存与 gzip。

## 5. 健康检查与扩缩容

- `next start` 提供 HTTP 服务，K8s 探活 `/` 或专门 `/api/health`（Route Handler）。
- Serverless 天然按请求扩缩；Node 服务用 PM2/容器编排。

## 6. 迁移 Pages → App Router 注意

- `getServerSideProps` → async Server Component。
- `getStaticProps` → 默认静态 + `generateStaticParams`。
- API Routes → `route.ts` Route Handlers（见 `08-route-handlers.md`）。
- `_app.tsx`/`_document.tsx` → `layout.tsx`。

## 7. 一句话总结

> 部署：Vercel 零配置最优；自托管 `next build && next start` + Docker；静态用 `output: 'export'`。注意 `NEXT_PUBLIC_` 进客户端、缓存靠 CDN/Redis，迁移 App Router 用 RSC 替 `get*` props。
