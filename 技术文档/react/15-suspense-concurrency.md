# React Suspense 与并发特性（Suspense & Concurrency）

> 来源：React 官方文档（https://react.dev/reference/react/Suspense）— Reference / React APIs
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、<Suspense> 概述

`<Suspense>` 在子组件加载完成前显示「兜底 UI」（fallback）。

```jsx
<Suspense fallback={<Loading />}>
  <SomeComponent />
</Suspense>
```

当 `SomeComponent` 渲染中「挂起（suspend）」时，React 切到 fallback；数据或代码就绪后自动切回真实内容。

### Props

- `children`：实际要渲染的 UI。
- `fallback`：未加载完成时显示的替代 UI（spinner、骨架屏），可为任意节点。
- `defer`（实验）：为 `true` 时即使未挂起也可能先显示 fallback，用于昂贵渲染。

### 注意事项

- Suspense **不检测** Effect 或事件处理函数中发起的数据获取。
- 挂起且未首次挂载的渲染，React 不保留状态，加载后重试。
- 已显示内容再次挂起会再显 fallback，除非更新来自 `startTransition`/`useDeferredValue`。

---

## 二、什么会激活 Suspense 边界

- 用 `lazy` **懒加载组件代码**；
- 用 `use`（React 19）读取 Promise（含 Server Components 流式数据）；
- 加载带 `precedence` 的 `<link rel="stylesheet">`；
- 流式 SSR 大边界 HTML 到达前（按块揭示）。

---

## 三、懒加载（lazy）

```js
import { lazy, Suspense } from 'react';

const Albums = lazy(() => import('./Albums'));

function ArtistPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Albums />
    </Suspense>
  );
}
```

通过 `React.lazy` 动态导入组件代码，触发最近 `<Suspense>` 显示 fallback，直到代码分片加载完成。

---

## 四、数据获取集成

- **正确**：组件内用 `use(promise)`（或框架数据钩子）读取缓存的 Promise，自然激活边界。
- **错误**：在 `useEffect`/事件内 fetch 不会激活 Suspense（见 `12-you-might-not-need-effect.md`）。
- SSR：流式渲染先发 shell + fallback，后流式填入 HTML 替换。

---

## 五、并发渲染典型用法

1. **整体揭示**：单边界内多组件作为整体，全部就绪后同时弹出。
2. **嵌套揭示**：多层 `<Suspense>` 形成顺序加载（先 Biography，后 Albums）。
3. **陈旧内容**：`useDeferredValue` 避免 fallback，显示半透明旧结果。
4. **防止已显内容隐藏**：`startTransition` 包裹导航更新，React 保留旧 UI 直至新内容足够。
5. **Transition 指示**：`useTransition` 的 `isPending` 做视觉反馈。
6. **重置边界**：导航不同内容时加 `key`，强制 fallback 而非旧内容。

---

## 六、防止更新时 UI 被 fallback 替换

- 用 `startTransition` 或 `useDeferredValue` 标记为非紧急更新，React 等待数据足够再更新，避免闪烁。
- 紧急更新不延迟；Suspense 路由库应默认包 Transition。

---

## 小结（Recap）

- Suspense 是「加载时显示 fallback」的边界；
- 代码懒加载（`lazy`）与 `use(promise)` 数据获取会激活它；
- 并发特性（`useTransition`/`useDeferredValue`）避免已显内容被 fallback 闪烁替换；
- 路由切换不同内容时加 `key` 强制重新加载。

---

## 跨框架对比

| React 概念 | 对应物 |
|---|---|
| Suspense + lazy | Vue 的 `defineAsyncComponent` + `<Suspense>`、Route 懒加载 |
| useTransition | Solid 的 `useTransition`、Svelte 的待办过渡 |
| useDeferredValue | 防抖（但语义不同，不丢失输入） |
| 流式 SSR | Next.js / Remix 的 streaming，Astro 的 islands |
