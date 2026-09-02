# Next.js 中间件：proxy.js（原 middleware.js）

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/building-your-application/routing/middleware，2026-08-25）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

> ⚠️ **重要版本变更**：Next.js 16 起 **`middleware.js` 已废弃**，更名为 **`proxy.js`**（可用 codemod `npx @next/codemod@canary middleware-to-proxy .` 迁移）。本文以官方当前命名 `proxy` 为主，API 与原 middleware 一致。

---

## 一、文件位置与基本结构

- 项目**根目录**（或 `src` 内，与 `app`/`pages` 同级）创建 `proxy.ts`。
- 必须导出单个函数（默认或命名 `proxy`），不支持同文件多个 proxy。

```ts
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}

export const config = { matcher: '/about/:path*' };
```

---

## 二、matcher 配置（路径匹配）

- **不配 matcher 会对每个请求执行**（含静态/CSS/图片），建议负向排除。
- 单路径：`matcher: '/about'`；多路径：`matcher: ['/about', '/contact']`。
- 正则负向排除：

```js
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
```

- 对象形式支持 `source`/`locale`/`has`/`missing`：`has` 匹配存在条件（header/query/cookie），`missing` 匹配缺失条件。
- matcher 值必须**常量**（构建时静态分析）。

---

## 三、NextRequest / NextFetchEvent

- `request`：NextRequest，含 `request.nextUrl`、`request.cookies`、`request.headers`。
- `event`：NextFetchEvent，提供 `event.waitUntil(promise)` 延长生命周期（日志/分析后台任务）。

```ts
export function proxy(request: NextRequest, event: NextFetchEvent) {
  event.waitUntil(fetch('https://example.com/log', { method: 'POST' }));
}
```

---

## 四、NextResponse 响应处理

- 重定向：`NextResponse.redirect(new URL('/home', request.url))`
- 重写：`NextResponse.rewrite(new URL('/about-2', request.url))`（不改 URL）
- 直接响应：`return Response.json({ success: false }, { status: 401 })`
- 设 Cookie：`const res = NextResponse.next(); res.cookies.set('vercel', 'fast', { path: '/' })`
- 设头：
  - 请求头（上游）：`new Headers(request.headers)` 改后 `NextResponse.next({ request: { headers } })`
  - 响应头（客户端可见）：`res.headers.set('x-hello', 'hello')`

---

## 五、Cookie 与 Header 设置

```ts
const response = NextResponse.next();
response.cookies.set('vercel', 'fast', { path: '/' });
const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-hello-from-proxy1', 'hello');
const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set('x-hello-from-proxy2', 'hello');
```

> ⚠️ 避免过大请求头导致 431 错误。

---

## 六、运行时与执行顺序

- **v16.0.0 起 proxy 默认 Node.js 运行时**（不再强制 Edge）；proxy 文件**不支持 `runtime` 配置项**（设会报错）。
- 执行顺序：`next.config` headers → redirects → proxy → beforeFiles → 文件系统路由 → afterFiles → 动态路由 → fallback。
- CORS 可在 proxy 设 `Access-Control-Allow-*` 头。

---

## 七、典型用途

- 鉴权：未登录重定向到登录页；
- 国际化：根据 `Accept-Language` 重写到对应 locale 路由；
- A/B 实验、日志、请求头注入；
- 与 `metadata` 文件同用时需 matcher 排除元数据文件。

---

## 小结（Recap）

- middleware 已废弃改 proxy.js，API 相同；
- 默认 Node.js 运行时，不支持 runtime 配置；
- matcher 必须常量，建议负向排除静态资源；
- 用 NextResponse 重定向/重写/设头。

---

## 衔接

- 路由文件约定：`06-routing-layout-page.md`
- 配置（redirects/headers）：`15-next-config.md`
- Cookie：与 `14-server-functions.md` 的 cookies() 互补
