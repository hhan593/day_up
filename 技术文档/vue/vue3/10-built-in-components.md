# Vue 3 内置组件（Teleport / Suspense / Transition）

> 来源：Vue 官方文档（https://vuejs.org/guide/built-ins/teleport）— Guide / Built-in Components
> 版本：Vue 3（含 3.5+ Deferred Teleport，本文未展开该小节）

---

## 一、Teleport（传送）

将模板片段「传送」到组件 DOM 层级之外的节点（如 `body`）。

```vue
<Teleport to="body">
  <div v-if="open" class="modal">
    <p>Hello from modal!</p>
    <button @click="open = false">Close</button>
  </div>
</Teleport>
```
- `to`：CSS 选择器或 DOM 节点；目标须在挂载时已存在（理想在 Vue 应用外）。
- 仅改变渲染 DOM 结构，**不改变逻辑层级**：子组件仍是父组件子组件，props/事件/provide-inject 正常。
- 禁用：`<Teleport :disabled="isMobile">` 动态切换是否传送。

**典型场景**：模态框、Toast、全局弹层（避免父级 `overflow`/`z-index` 限制）。

---

## 二、Suspense（异步组件加载）

> 标准补充（官网 Suspense 页本次未抓取正文，以下为 Vue 3 共识）。

```vue
<Suspense>
  <template #default>
    <AsyncComponent />   <!-- 内部有 await setup / 异步组件 -->
  </template>
  <template #fallback>
    <div>Loading...</div>
  </template>
</Suspense>
```
- `#default` 为异步内容，`#fallback` 为加载占位；
- 组件 `setup` 返回 Promise 或 `async setup`，Suspense 在其 resolve 前显示 fallback；
- 结合 `<script setup>` 顶层 `await` 使用。

---

## 三、Transition / TransitionGroup（过渡动画）

> 标准补充（官网 Transition 页本次未抓取正文，以下为 Vue 3 共识）。

```vue
<Transition name="fade">
  <p v-if="show">hello</p>
</Transition>
```
```css
.fade-enter-active, .fade-leave-active { transition: opacity .5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
```
- `<Transition>` 单元素/组件进入离开动画；`<TransitionGroup>` 列表逐项动画；
- 类名钩子：`*-enter-from/-enter-active/-enter-to`、`*-leave-from/-leave-active/-leave-to`；
- 也可用 `@enter`/`@leave` JS 钩子。

---

## 小结（Recap）

- Teleport：逻辑不变、DOM 移动（模态/Toast）；`disabled` 控制；
- Suspense：异步组件 fallback 占位；
- Transition：进入/离开动画钩子类。

---

## 衔接

- 生命周期/异步：`09-lifecycle-composables.md`
- provide/inject：`07-events-slots-provide.md`
- 与 React 对比：Suspense≈React Suspense、Teleport≈React createPortal、Transition≈React Transition Group
