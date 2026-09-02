# Next.js 文件系统路由（layout / page / loading / error）

> 来源：Next.js 官方文档（App Router）
> - File Conventions: layout.js（https://nextjs.org/docs/app/api-reference/file-conventions/layout）
> - File Conventions: page.js（https://nextjs.org/docs/app/api-reference/file-conventions/page）
> - File Conventions: loading.js（https://nextjs.org/docs/app/api-reference/file-conventions/loading，2026-06-08）
> - File Conventions: error.js（https://nextjs.org/docs/app/api-reference/file-conventions/error，2026-07-10）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、文件系统路由（概览）

App Router 用 `app/` 目录下的**文件夹**定义路由段，每个文件夹对应 URL 路径段。特殊文件约定赋予路由行为。

| 文件 | 作用 |
|---|---|
| `layout.js` | 布局，包裹子路由，跨导航保持状态 |
| `page.js` | 该路由段的可视页面 |
| `loading.js` | Suspense fallback（自动包裹 page） |
| `error.js` | 错误边界（Client Component） |
| `global-error.js` | 根级错误边界（需自带 html/body） |
| `not-found.js` | 404 页面 |
| `route.js` | 路由处理程序（API，见 `08-route-handlers.md`） |
| `template.js` | 每次导航都重新挂载的布局变体 |
| `default.js` | 并行路由未匹配时的兜底 |

---

## 二、layout.js（布局）

- 默认导出 React 组件，接收 `children` prop（嵌套布局/page 的内容）。
- **root layout**（`app/layout.js`）必须包含 `<html>` 和 `<body>` 标签，且是必须的。
- 布局在子段间导航时**不重新渲染**，保持状态与交互。

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh"><body>{children}</body></html>;
}
```

- 嵌套布局（如 `app/dashboard/layout.tsx`）只用 `<div>` 等包裹，无需 html/body。
- 可导出 `metadata` / `generateMetadata`（见 `10-metadata-api.md`）。

### Props
`{ children, params? }`：`params` 为 Promise（Next.js 15+ 异步）。

---

## 三、page.js（页面）

- 默认导出组件，定义路由的可视 UI。
- 默认是 **Server Component**（见 `11-server-client-components.md`）。

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>文章：{slug}</div>;
}
```

### 可导出
- `metadata` / `generateMetadata`
- `generateStaticParams`（动态路由静态生成，见 `07-dynamic-routes.md`）
- 路由段配置：`dynamic`、`revalidate`、`dynamicParams` 等

---

## 四、loading.js（加载 UI）

- 基于 React Suspense，在路由内容流式传输时展示即时加载态。
- 自动将同级 `page.js`、嵌套 `layout.js`、`not-found.js` 包裹在 `<Suspense>` 内。
- 不包裹同级 `layout.js`、`template.js`、`error.js`。

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="skeleton">加载中…</div>;
}
```

> 导航可中断；切换路由无需等目标内容加载完——这是 App Router 流式渲染的核心体验。

---

## 五、error.js（错误边界）

- 必须是 **Client Component**（`'use client'`），用 React Error Boundary 包裹 page/loading/not-found/嵌套 layout。
- 不包裹同级 `layout.js` / `template.js`。

```tsx
'use client'
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div>
      <h2>出错了</h2>
      <button onClick={() => retry()}>重试</button>
    </div>
  );
}
```

### retry（v16.3.0 稳定）
- `retry()`：重新获取并重渲染错误边界内容（推荐）。
- `reset()`：不重新请求，仅重置错误边界重渲染已有内容（特殊场景用）。
- 错误可 `throw` 冒泡到父级 `error.js`。

### global-error.js
- 位于根 `app/` 目录，捕获根布局错误；必须自带 `<html><body>`，不支持 metadata。

---

## 六、route groups 与平行路由（补充）

- **路由分组** `(folder)`：不影响 URL，用于组织共享 layout（如 `(marketing)`、`(shop)` 各用不同布局）。
- **平行路由** `@slot` + `default.js`：同一布局并行渲染多个 slot，每个 slot 可有独立 `loading.js`。

---

## 小结（Recap）

- `layout` 跨导航保持，`page` 是页面，`loading`/`error` 是 Suspense/Error Boundary 约定；
- root layout 必须含 html/body；error 必须是 Client Component；
- `params` 在 Next.js 15+ 为 Promise，需 `await`。

---

## 衔接

- 动态段与静态生成：`07-dynamic-routes.md`
- API 路由：`08-route-handlers.md`
- 中间件：`09-proxy-middleware.md`
- 元数据：`10-metadata-api.md`
- Server/Client：`11-server-client-components.md`
