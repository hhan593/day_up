# Next.js Server Components 与 Client Components

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/building-your-application/rendering/server-components，2026-08-25）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、默认行为

App Router 中 **layouts 和 pages 默认是 Server Components**——可在服务端获取数据、选择性缓存、流式发送到客户端。需要交互/浏览器 API 时叠加 Client Components。

---

## 二、何时用哪种

| 用 Client Component | 用 Server Component |
|---|---|
| 状态与事件（`onClick`/`onChange`） | 靠近数据源取数 |
| 生命周期（`useEffect`） | 用密钥而不暴露给客户端 |
| 浏览器 API（`localStorage`/`window`） | 减少发往浏览器的 JS |
| 自定义 Hooks | 改善 FCP、渐进流式 |

**典型组合**：Server Component 取数 → 把数据当 props 传给 Client Component 处理交互。

```tsx
// app/[id]/page.tsx（Server）
import LikeButton from '@/app/ui/like-button';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  return <LikeButton likes={post.likes} />;
}
// app/ui/like-button.tsx（Client）
'use client';
import { useState } from 'react';
export default function LikeButton({ likes }: { likes: number }) { /* ... */ }
```

---

## 三、'use client' 指令

- 文件顶部（imports 前）加 `'use client'` 声明为 Client Component。
- 一旦标记，其所有 imports 与直接渲染组件纳入客户端 bundle，**无需逐文件加指令**。
- **仅对需要交互的组件加**，减小 JS 体积（如 Layout 仅 `<Search>` 加）。

```tsx
'use client';
import { useState } from 'react';
export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## 四、工作机制

- Server Component 渲染为 **RSC Payload**（序列化表示）；Client Component 占位符 + JS 引用随之一起。
- 客户端首屏：HTML 快速预览 → RSC Payload 协调 → JS 水合 Client Component。
- 后续导航：RSC Payload 预取缓存，即时导航。

---

## 五、数据传递限制

- Server → Client 的 props 必须是 **React 可序列化** 的。
- React Context **在 Server Component 不支持**：需建 Client Component 作 Provider 再在 Server 引入包裹。
- 第三方包若依赖客户端特性但无 `'use client'`，需包装一层 Client Component 再用。

```tsx
// app/carousel.tsx
'use client';
import { Carousel } from 'acme-carousel';
export default Carousel;
```

---

## 六、交错（Interleaving）

Server Component 可作为 `children`/`props` 传给 Client Component：先在服务端预渲染，结果编入 RSC Payload。

```tsx
'use client';
export default function Modal({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
// Server Page: <Modal><Cart /></Modal> —— Cart 在服务端预渲染后传入
```

---

## 七、环境隔离

- 仅 `NEXT_PUBLIC_` 前缀环境变量进入客户端 bundle，其余服务端替换为空串。
- `server-only` 包防止服务端代码误入客户端（构建报错）；对应有 `client-only`。

---

## 小结（Recap）

- 默认 Server Component；交互用 `'use client'`；
- 指令声明 Server/Client 边界，imports 一并纳入；
- 传 Client 的 props 须可序列化；Context 不支持于 Server。

---

## 衔接

- 数据获取：`13-caching.md`
- Server Actions：`12-server-actions.md`
- 文件约定：`06-routing-layout-page.md`
- 与 React 章节：`技术文档/react` 的 hooks/state 是 Client Component 基础
