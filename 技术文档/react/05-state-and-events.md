# React 状态与事件（State & Events）

> 来源：React 官方文档
> - State: A Component's Memory（https://react.dev/learn/state-a-components-memory）
> - State as a Snapshot（https://react.dev/learn/state-as-a-snapshot）
> - Responding to Events（https://react.dev/learn/responding-to-events）
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、State：组件的记忆

- 组件常需根据交互改变屏幕内容（表单输入、轮播图切换、加入购物车）。这类「组件需要记住的事情」称为 **state（状态）**。
- 普通局部变量（`let index = 0`）在点击修改时**不会**触发重渲染，且重渲染时不会保留——React 每次从零渲染组件。因此需要 state。

### useState 基础

```js
import { useState } from 'react';

function Gallery() {
  const [index, setIndex] = useState(0);
  // index：状态变量；setIndex：设置函数
}
```

- 参数：状态的初始值（仅首次渲染使用）。
- 返回值：固定两项的数组 `[状态值, 设置函数]`，通过解构获取。
- 命名约定：`const [something, setSomething]`（非强制但利于协作）。

### Hooks 规则

- 以 `use` 开头的函数称为 Hook（如 `useState`）。
- **只能在组件顶层或自定义 Hook 顶层调用**，禁止在条件、循环、嵌套函数中调用。
- 原因：React 依赖每次渲染时 Hook 的**稳定调用顺序**来匹配状态。

### 多个状态变量

```js
const [index, setIndex] = useState(0);
const [showMore, setShowMore] = useState(false);
```

- 不相关的状态建议分开；若常一起变更，可合并为对象。
- React 为每个组件维护状态对数组，按调用顺序匹配。

### State 的隔离与私有性

- 同一组件渲染两次（如两个 `<Gallery />`），各自拥有完全独立的 state。
- State 仅属于声明它的组件，父组件不知道也不能修改子组件 state（不同于 props）。

---

## 二、State 作为快照（State as a Snapshot）

- 状态变量写法类似普通变量，但行为更像**快照**。
- 调用 `setState` **不会修改当前已有的状态变量**，而是通知 React 触发重渲染。
- 每次渲染，React 提供一份该时刻的状态快照；返回的 JSX 即基于这次快照计算的 UI。

### 事件处理函数不会读取「未来」state

```js
<button onClick={() => {
  setNumber(number + 1); // number 为 0 → 准备更新为 1
  setNumber(number + 1); // number 仍为 0 → 准备更新为 1
  setNumber(number + 1); // number 仍为 0 → 准备更新为 1
}}>+3</button>
```

点击后只增加 1（详见 `06-queueing-state-updates.md`）。

### 异步场景同样适用

```js
setNumber(number + 5);
setTimeout(() => {
  alert(number); // 仍是本次渲染的 0
}, 3000);
```

> 结论：状态变量在单次渲染内永不改变，事件处理函数「固定」了创建它那次渲染的状态值。

---

## 三、事件处理（Responding to Events）

### onXxx 约定

- 通过向 JSX 标签传递函数作为 prop 添加事件处理：`<button onClick={handleClick}>`。
- 内置元素只支持浏览器事件名（`onClick`、`onMouseEnter`）；自定义组件的事件 prop 约定以 `on` 开头后接大写（`onPlayMovie`）。
- 处理函数名多以 `handle` 开头（`handleClick`）。

### 传递 vs 调用

```js
// ✅ 传递函数
<button onClick={handleClick}>
// ❌ 渲染时立即调用（会在渲染时执行而非点击时）
<button onClick={handleClick()}>
// 内联需包装为函数
<button onClick={() => alert('...')}>
```

### 阻止默认行为

```js
<form onSubmit={e => {
  e.preventDefault();
  alert('Submitting!');
}}>
```

- `e.preventDefault()`：阻止浏览器默认动作（如表单刷新）。
- `e.stopPropagation()`：阻止事件冒泡（见下）。

### 事件传播与停止

- React 事件**冒泡**：从触发元素向上层树传递。
- 例外：`onScroll` 不冒泡。
- 用 `e.stopPropagation()` 阻止继续向上：

```js
function Button({ onClick, children }) {
  return (
    <button onClick={e => {
      e.stopPropagation(); // 阻断父级
      onClick();           // 显式调用父级传入的 handler
    }}>{children}</button>
  );
}
```

- 捕获阶段：`onClickCapture` 在目标阶段前向下调用，应用代码极少使用。

---

## 小结（Recap）

- 需要跨渲染记住的信息用 state（`useState`）；
- state 是快照，setState 请求重渲染，不修改当前变量；
- Hook 必须在顶层无条件调用；
- 事件通过 `onXxx` 函数 prop 处理，传函数而非调用；
- `e.preventDefault()` 阻默认行为，`e.stopPropagation()` 阻冒泡。

---

## 跨框架对比

| React 概念 | 对应物 |
|---|---|
| useState | Vue 的 `ref`/`reactive`、Solid 的 `createSignal`、Svelte 的 `let` 响应式变量 |
| 事件 `onClick={fn}` | Vue `@click="fn"`、原生 `addEventListener` |
| 状态快照 | Vue 的响应式是「可变引用」，React 是「不可变快照」（心智模型差异） |
| e.stopPropagation | DOM 原生 `stopPropagation`（React 合成事件同样支持） |
