# Next.js 动态路由与静态生成

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes，2026-06-09）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、动态段 `[slug]`

- 文件夹名用方括号定义：`app/blog/[slug]/page.js`。
- 捕获值作为 `params` 传给 page/layout/route/generateMetadata。
- **Next.js 15+ 起 `params` 为 Promise**，需 `await`（或客户端用 `use`）。

```tsx
// app/blog/[slug]/page.tsx
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>文章：{slug}</div>;
}
```

| 路由 | 示例 URL | params |
|---|---|---|
| app/blog/[slug]/page.js | /blog/a | `{ slug: 'a' }` |
| app/shop/[categoryId]/[itemId]/page.js | /shop/1/2 | `{ categoryId: '1', itemId: '2' }` |

**客户端组件取参**：用 `useParams()` 或 `use(params)`。

---

## 二、Catch-all `[...slug]`

```tsx
// app/shop/[...slug]/page.js
```

| 示例 URL | params |
|---|---|
| /shop/a | `{ slug: ['a'] }` |
| /shop/a/b/c | `{ slug: ['a','b','c'] }` |

---

## 三、可选 Catch-all `[[...slug]]`

- 双层方括号，额外匹配不带参数的根路径（如 `/shop`）。

| 示例 URL | params |
|---|---|
| /shop | `{ slug: undefined }` |
| /shop/a/b | `{ slug: ['a','b'] }` |

---

## 四、generateStaticParams（静态生成）

- 构建时预渲染动态路由，避免请求时按需生成。

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://.../posts').then(r => r.json());
  return posts.map(p => ({ slug: p.slug }));
}
```

- 在 `generateStaticParams` 内的 `fetch` 自动去重，加速构建。
- Route Handler 同样可用（见 `08-route-handlers.md`）。

### dynamicParams
- 路由段配置项（同组还有 `instant`、`maxDuration`、`prefetch`、`runtime`）。
- `true`（默认）：未预定义参数在请求时动态生成；`false`：未预定义参数直接 404。

```tsx
export const dynamicParams = false; // 只允许 generateStaticParams 中的参数
```

---

## 五、TypeScript 类型

| 路由 | params 类型 |
|---|---|
| [slug] | `{ slug: string }` |
| [...slug] | `{ slug: string[] }` |
| [[...slug]] | `{ slug?: string[] }` |

- 推荐用 `PageProps<'/route'>`、`LayoutProps<'/route'>`、`RouteContext<'/route'>` 类型助手。
- 固定枚举参数（如 `[locale]`）可用运行时校验 + `notFound()` 收窄类型：

```tsx
import { notFound } from 'next/navigation';
function assertValidLocale(v: string): asserts v is Locale {
  if (!isValidLocale(v)) notFound();
}
```

---

## 六、Cache Components 下的行为

- **不使用 generateStaticParams**：所有 params 为运行时数据，必须在 `<Suspense>` 内访问（否则构建报错）。
- **使用 generateStaticParams**：构建时校验并生成静态 HTML；首次成功请求后的运行时页面也存盘。
- 未覆盖分支中的运行时 API（如 `cookies()`）需放进 `<Suspense>`。

---

## 小结（Recap）

- `[slug]` 单段、`[...slug]` 多段、`[[...slug]]` 可选；
- `params` 是 Promise（v15+），必须 await；
- `generateStaticParams` 构建时预渲染；`dynamicParams=false` 仅允许预定义参数。

---

## 衔接

- 文件约定：`06-routing-layout-page.md`
- 缓存失效：`13-caching.md`（revalidateTag/revalidatePath）
- 路由处理程序：`08-route-handlers.md`
