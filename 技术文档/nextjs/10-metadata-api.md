# Next.js Metadata API（metadata / generateMetadata）

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/api-reference/functions/generate-metadata，2026-08-25）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、静态 metadata 对象

在 `layout.js` / `page.js` 导出 `Metadata` 类型对象（**仅 Server Component**）。

```ts
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '...',
  description: '...',
};

export default function Page() {}
```

- 同路由段不能同时导出 `metadata` 与 `generateMetadata`。
- 文件型元数据（如 `opengraph-image`）优先级更高，覆盖对象/函数。

---

## 二、generateMetadata（动态元数据）

依赖动态信息（路由参数、外部数据、父段元数据）时导出函数返回 `Metadata`。

```ts
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const product = await fetch(`https://.../${id}`).then(r => r.json());
  const previousImages = (await parent).openGraph?.images || [];
  return {
    title: product.title,
    openGraph: { images: ['/some-specific-page-image.jpg', ...previousImages] },
  };
}
```

### 参数
- `params`：从根到当前段的动态参数（Promise）。
- `searchParams`：查询参数（**仅 page 段可用**，Promise）。
- `parent`：父段已解析元数据（Promise，`ResolvingMetadata`）。

### 行为
- 必须在服务端渲染前解析以纳入初始 HTML；
- `fetch` 在 generateMetadata/generateStaticParams/layout/page 间自动记忆化；
- 可用 `redirect()` / `notFound()`。

---

## 三、title 字段

| 形式 | 示例 | 效果 |
|---|---|---|
| 字符串 | `title: 'Next.js'` | `<title>Next.js</title>` |
| default（子段回退） | `title: { default: 'Acme' }` | 子段无 title 时用 |
| template（前缀/后缀） | `title: { template: '%s | Acme', default: 'Acme' }` | 子段 `About` → `About | Acme` |
| absolute（忽略父 template） | `title: { absolute: 'About' }` | 直接 `<title>About</title>` |

- `template` 仅作用于**子段**，不影响自身；`page.js` 定义 `template` 无效（页为终止段）。
- 必须有 `default` 才能用 `template`。

---

## 四、description 与 metadataBase

```ts
export const metadata = {
  metadataBase: new URL('https://acme.com'),
  alternates: { canonical: '/' },
  openGraph: { images: '/og-image.png' }, // 自动拼接为 https://acme.com/og-image.png
  description: 'The React Framework for the Web',
};
```

- `metadataBase`：通常放根 layout，为需绝对 URL 的字段提供基准。
- ⚠️ 用 `'use cache'` 时 `metadataBase` 需返回字符串（URL 不可序列化）。
- OG 图 URL 必须绝对（除非用 metadataBase + 相对路径）；相对路径未配 metadataBase 构建报错。

---

## 五、openGraph

```ts
export const metadata = {
  openGraph: {
    title: 'Next.js',
    description: '...',
    url: 'https://nextjs.org',
    siteName: 'Next.js',
    images: [{ url: 'https://nextjs.org/og.png', width: 800, height: 600 }],
    locale: 'en_US',
    type: 'website',
  },
};
```

- `article` 类型支持 `publishedTime` / `authors`；
- 推荐用文件型 Metadata API 自动生成 OG 图。

---

## 六、合并规则与版本

- 从根 layout 到 page 顺序浅合并，后段覆盖前段同名嵌套字段（`openGraph` 整体替换）。
- v15.2+ 流式元数据：`generateMetadata` 不阻塞初始 UI，解析后追加（对无 JS 爬虫仍阻塞）。
- 不支持 `<base>`/`<noscript>`/`<script>` 等，需手写于组件。

---

## 小结（Recap）

- 静态用 `export const metadata`，动态用 `generateMetadata`；
- title 的 default/template/absolute 控制继承；
- `metadataBase` 提供绝对 URL 基准；
- 仅 Server Component 可用。

---

## 衔接

- 文件约定：`06-routing-layout-page.md`
- 文件型元数据：官网 Metadata Files（favicon/icon/opengraph-image/robots/sitemap）
- 动态参数：`07-dynamic-routes.md`
