# 16. Vue 3 SSR 与 Nuxt

> 来源可信度：**官方文档确认**（基于 Vue SSR 官方指南、Nuxt 3 文档；与 `11-routing-vue-router.md` 衔接）
> 关联：Next `17-app-router-patterns.md`、React `17-server-components.md`

## 1. 为什么 SSR

- SEO 友好、首屏快（直接返回 HTML）、弱网体验好。
- 代价：服务端需跑 Vue、状态序列化、注意服务端/客户端差异（window 不可用）。

## 2. Vue SSR 原理

```ts
// server entry
import { createSSRApp } from 'vue';
import App from './App.vue';

export async function render() {
  const app = createSSRApp(App);
  const html = await renderToString(app); // 服务端渲染成字符串
  return html;
}
```

- `createSSRApp` 创建可服务端渲染应用；`renderToString` 生成 HTML。
- 客户端 `createApp` + `hydrate` 复用 HTML（注水）。

## 3. 数据预取与状态转移

```ts
// 服务端取数后序列化到 window.__INITIAL_STATE__
const state = await store.fetchAll();
const serialized = JSON.stringify(state).replace(/</g, '\\u003c');
```

- 客户端读取 `__INITIAL_STATE__` 还原 Pinia（见 `12-state-pinia.md`），避免重复取。

## 4. Nuxt 3（Vue 的全栈框架）

- 文件路由：`pages/` 自动生成路由（对标 Next App Router `17-app-router-patterns.md`）。
- 服务端：`server/api/` 写 API、`useFetch` 自动服务端取数。
- 混合渲染：ISR/SSR/SSG 可配。

```vue
<script setup>
const { data } = await useFetch('/api/users'); // 服务端执行，客户端 hydration
</script>
```

## 5. 与 Next.js 对照

| | Nuxt 3 | Next.js |
|---|--------|---------|
| 框架 | Vue 3 | React |
| 路由 | 文件 `pages/` | 文件 `app/` |
| 取数 | `useFetch` | RSC async / Server Action |
| 渲染 | SSR/SSG/ISR | RSC/SSG/ISR |

## 6. 一句话总结

> Vue SSR 用 `createSSRApp`+`renderToString`，Nuxt 3 提供文件路由+`useFetch` 全栈体验，对标 Next.js。注意服务端无 window、状态需序列化转移避免客户端重复取。
