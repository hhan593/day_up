# 17. Next.js App Router 实战模式

> 来源可信度：**官方文档确认**（基于 Next.js 15 App Router 官方文档；与 `06-routing-layout-page.md`/`11-server-client-components.md` 衔接）
> 关联：React `17-server-components.md`

## 1. 文件约定（App Router）

```
app/
  layout.tsx        # 根布局（必含 <html><body>）
  page.tsx          # 路由页
  loading.tsx       # Suspense fallback（自动）
  error.tsx         # error boundary（'use client'）
  not-found.tsx     # 404
  route.tsx         # Route Handler（API）
  [slug]/page.tsx   # 动态段
```

- 每个文件夹默认导出 `page.tsx` 即路由。
- `loading.tsx`/`error.tsx` 基于 Suspense/Error Boundary 自动包裹。

## 2. 并行路由与拦截路由

```tsx
// app/@modal/(.)photo/[id]/page.tsx  // 拦截：从列表点开照片弹 modal
// app/photo/[id]/page.tsx            // 直接访问是完整页
```

- 并行路由（`@slot`）：同一 URL 渲染多个插槽（`layout` 收 `children` + `modal`）。
- 拦截路由（`(.)`/`(..)`）：软导航时拦截到 modal，硬刷新仍是整页。

## 3. 数据获取与缓存

```tsx
async function Page() {
  const res = await fetch('https://api', { next: { revalidate: 60 } }); // ISR 60s
  const data = await res.json();
}
```

- `cache: 'no-store'` 动态渲染；`revalidate` ISR；默认 `fetch` 被缓存（见 `13-caching.md`）。

## 4. Metadata 与 SEO

```tsx
export async function generateMetadata({ params }) {
  return { title: `Post ${params.id}` };
}
```

- 与 `10-metadata-api.md` 衔接：动态 metadata 用 `generateMetadata`。

## 5. 认证与中间件

```ts
// middleware.ts
export function middleware(req: NextRequest) {
  if (!req.cookies.get('token')) return NextResponse.redirect('/login');
}
export const config = { matcher: ['/dashboard/:path*'] };
```

- 与 `09-proxy-middleware.md` 衔接：Edge Middleware 做鉴权/重定向。

## 6. 一句话总结

> App Router 用约定文件（layout/page/loading/error/route）+ 并行/拦截路由；取数用 `fetch` 缓存策略，SEO 用 `generateMetadata`，鉴权放 Edge Middleware。RSC 默认服务端渲染是核心范式。
