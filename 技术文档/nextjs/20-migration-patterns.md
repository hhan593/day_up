# 20. Next.js 最佳实践与常见坑

> 来源可信度：**经验总结**（基于官方文档与社区最佳实践；与 `04-nextjs-for-react-devs.md`/`11-server-client-components.md` 衔接）
> 关联：React `17-server-components.md`

## 1. Server Component 优先

- 默认写 Server Component，仅在需要交互/状态/浏览器 API 时加 `'use client'`。
- `'use client'` 边界越靠叶越好（减少客户端 bundle）。

## 2. 数据获取位置

- 服务端数据：放 Server Component 或 Server Action（见 `12-server-actions.md`）。
- 客户端交互刷新：React Query/SWR。
- 不要在 Server Component 里用 `useEffect` 取数（无意义）。

## 3. 常见坑

| 坑 | 现象 | 解决 |
|----|------|------|
| 把整个页标 `'use client'` | bundle 暴涨 | 边界下移 |
| 在 Server 读 `localStorage` | 报错 | 移客户端 |
| fetch 未设缓存 | 每次重建 | 配 `revalidate`/`no-store` |
| 过度 `'use client'` 导致 props 不可序列化 | RSC payload 失败 | Server 组件传可序列化数据 |
| 中间件匹配过宽 | 循环重定向 | 精确 matcher |

## 4. 状态管理

- 服务端状态：RSC + cache。
- 客户端全局状态：Zustand/Jotai（轻量）或 Context（小）。
- URL 即状态：用 searchParams 表达筛选（可分享、可刷新）。

## 5. 安全

- Server Action 需校验权限（任何客户端都能调）。
- 密钥只在服务端，绝前缀 `NEXT_PUBLIC_`。
- 用 `zod` 校验 Server Action 入参（见 React `18-forms-validation.md`）。

## 6. 一句话总结

> Next 最佳实践：Server Component 优先且边界靠叶、服务端取数不混 useEffect、缓存策略显式、Server Action 必鉴权。避坑核心是分清服务端/客户端边界与可序列化约束。
