# 17. React Server Components (RSC)

> 来源可信度：**官方文档确认**（基于 React 19 / RSC 官方文档；与 `11-服务器组件.md`/Next `11-server-client-components.md` 衔接）
> 关联：`15-suspense-concurrency.md`

## 1. 什么是 RSC

Server Components 在服务端渲染（不进 bundle），可直接 `async` 读数据库/调 API，零客户端 JS。

```tsx
// app/page.tsx (Server Component, 默认)
async function Page() {
  const data = await db.users.findMany(); // 服务端直接查库
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

- 默认 `.tsx` 在 App Router 下是 Server Component。
- 加 `'use client'` 才变 Client Component。

## 2. 'use client' 边界

```tsx
'use client';
import { useState } from 'react';

export function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>{n}</button>;
}
```

- 边界是**单向**的：Client 可 import Server Component 作 children，但 Server 不能 import 交互 Client 逻辑反向。
- 交互、状态、浏览器 API 必须 `'use client'`。

## 3. Server vs Client 数据流

- Server Component 把数据**序列化**传过网络给客户端（RSC payload）。
- Client Component 用 props 接收服务端数据：服务端先渲染占位，客户端 hydrate。

```tsx
// Server
async function Page() {
  const posts = await getPosts();
  return <PostList initial={posts} />; // PostList 是 'use client'
}
```

## 4. 与 Suspense 协作

```tsx
<Suspense fallback={<Skeleton />}>
  <AsyncFeed />   // async Server Component
</Suspense>
```

- 服务端可流式（streaming）逐步吐出 Suspense 内容（见 `15-suspense-concurrency.md`）。

## 5. 何时用哪种

| 用 Server | 用 Client |
|-----------|-----------|
| 读数据库/API | 事件/状态 |
| 重渲染不需交互 | 用 hooks |
| 减少 bundle | 用浏览器 API |

## 6. 一句话总结

> RSC 默认服务端渲染、`async` 直接取数、零客户端 JS；`'use client'` 划交互边界。Server 把数据序列化传给 Client，配合 Suspense 流式输出。bundle 体积与取数位置是核心权衡。
