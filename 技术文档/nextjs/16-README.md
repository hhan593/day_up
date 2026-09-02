# Next.js 知识文档索引

> 全部基于 **Next.js 官方文档（nextjs.org，App Router，Next.js 16.3.4，© 2026 Vercel, Inc.）** 抓取整理（2026-08 更新）。
> 知识点均标注官网来源 URL；官网某页未展开的内容已注明「官网未展开」或「标准补充」。

---

## 学习顺序（编号即阅读顺序）

| 编号 | 文件 | 主题 | 官网来源 |
|---|---|---|---|
| 01 | `nextjs-learning-roadmap.md` | 学习路线图（已有） | 综合 |
| 02 | `nextjs-learning-plan.md` | 学习计划（已有） | 综合 |
| 03 | `nextjs-cheatsheet.md` | 速查表（已有） | 综合 |
| 04 | `nextjs-for-react-devs.md` | 给 React 开发者（已有） | 综合 |
| 05 | `nextjs-i18n-guide.md` | 国际化指南（已有） | 综合 |
| 06 | `routing-layout-page.md` | 文件系统路由：layout/page/loading/error | /api-reference/file-conventions/{layout,page,loading,error} |
| 07 | `dynamic-routes.md` | 动态路由：[slug]/[...slug]/[[...slug]]、generateStaticParams | /building-your-application/routing/dynamic-routes |
| 08 | `route-handlers.md` | 路由处理程序 route.js：GET/POST、NextRequest、CORS、流式 | /api-reference/file-conventions/route |
| 09 | `proxy-middleware.md` | 中间件 proxy.js（原 middleware 已废弃） | /building-your-application/routing/middleware |
| 10 | `metadata-api.md` | Metadata API：metadata / generateMetadata / title 模板 | /api-reference/functions/generate-metadata |
| 11 | `server-client-components.md` | Server/Client 组件与 'use client' | /building-your-application/rendering/server-components |
| 12 | `server-actions.md` | Server Actions 与表单：'use server'、useActionState | /building-your-application/data-fetching/server-actions |
| 13 | `caching.md` | 缓存体系：旧模型 + Cache Components 新模型(use cache) | /building-your-application/caching、/api-reference/directives/use-cache |
| 14 | `server-functions.md` | 服务端函数：cookies() / headers() | /api-reference/functions/{cookies,headers} |
| 15 | `next-config.md` | next.config.js 配置 | /api-reference/config/next-config-js |
| 16 | `README.md` | 本索引 | — |

---

## 机制全景图

```
App Router (app/)
  ├─ 文件系统路由（06）：layout/page/loading/error/not-found/template
  │     └─ 动态段（07）：[slug] / [...slug] / [[...slug]] + generateStaticParams
  ├─ 数据获取
  │     ├─ Server Component 取数（11）
  │     ├─ Route Handler route.js（08）
  │     ├─ Server Actions（12）：'use server' + 表单
  │     └─ 缓存（13）：fetch revalidate / use cache / cacheLife / cacheTag
  ├─ 服务端 API（14）：cookies() / headers()
  ├─ 跨切面
  │     ├─ proxy.ts 中间件（09）：鉴权/重定向/重写/CORS
  │     ├─ Metadata（10）：SEO/OG
  │     └─ next.config（15）：headers/redirects/rewrites/images
  └─ 客户端交互：'use client' + React hooks（见 技术文档/react）
```

---

## 7 条高频坑速查（Next.js 16 版）

1. ⚠️ **middleware 已废弃改名 proxy.js**：Next.js 16 起用 `proxy.ts`（可用 codemod 迁移），API 一致。
2. ⚠️ **params 是 Promise**：v15+ 起 `params`/`searchParams` 必须 `await` 或 `use`，旧同步写法将弃用。
3. ⚠️ **cookies()/headers() 异步**：v15+ 起须 `await`；headers 始终只读；二者均触发动态渲染。
4. ⚠️ **error.js 必须是 Client Component**：且 `retry()`（v16.3 稳定）替代旧 `reset()`。
5. ⚠️ **use cache 内禁止请求 API**：`cookies()`/`headers()`/`searchParams` 不能在 `'use cache'` 内调用栈使用。
6. ⚠️ **Server→Client props 须可序列化**：Context 在 Server Component 不支持，需 Client Provider 包裹。
7. ⚠️ **Cache Components 需显式开启**：`experimental.cacheComponents: true` + `'use cache'` 才有组件级缓存。

---

## 与已有文档衔接

- `01-05` 是路线图/计划/速查/React 开发者/i18n，建议先读；`06-15` 是 App Router 官方 API 详述。
- 与 `技术文档/react`（16 篇）衔接：Next.js Client Component 的 hooks/state/Effect 即 React 运行时机制；Server Component 是 Next 特有抽象。
- 与 `技术文档/typescript`（16 篇）衔接：`PageProps`/`LayoutProps`/`RouteContext` 等类型助手是 TS 配合；`'use cache'` 的序列化限制涉及 TS 类型。
- 与 `技术文档/nest`（9 章）衔接：Next Route Handler（08）/ Server Actions（12）充当 BFF 层，Nest 作后端 API；cookies/headers（14）对应 Nest 的 `@Req()`/`@Res()` 与守卫。
