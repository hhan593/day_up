# React Effects 与 useEffect

> 来源：React 官方文档（https://react.dev/learn/synchronizing-with-effects）— Learn / Escape Hatches
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、Effect 与事件的区别

组件内有两类逻辑：

- **渲染代码**：组件顶层，纯计算返回 JSX，必须保持纯净，不能有副作用。
- **事件处理函数**：用户操作触发，可包含副作用（改状态、发请求）。
- **Effect**：由**渲染本身**而非特定交互引起的副作用。例如聊天室组件出现在屏幕上时连接服务器；根据 `isPlaying` prop 控制视频播放。

> Effect 在**提交结束、屏幕更新后**运行，用于让组件与外部系统（网络、浏览器 API、第三方库）同步。

---

## 二、何时需要 Effect

典型用途（「走出」React 同步外部系统）：
- 控制非 React 组件（`<video>`、jQuery 插件、地图）；
- 建立/断开服务器连接；
- 发送分析日志、订阅事件、触发动画、获取数据。

⚠️ 若仅根据其他 state 调整 state，可能不需要 Effect（见 `12-you-might-not-need-effect.md`）。

---

## 三、useEffect 基础

```js
import { useEffect } from 'react';

function MyComponent() {
  useEffect(() => {
    // 每次渲染后运行
  });
  return <div />;
}
```

### 依赖数组

```js
useEffect(() => {
  // 仅当 isPlaying 变化时重新运行
}, [isPlaying]);
```

- `[]`：仅挂载时运行（组件首次出现）；
- `[a, b]`：挂载时及 a/b 变化时运行；
- 依赖由 Effect 内部所用变量决定，不可随意选，否则 linter 报错；
- ref 与 setState 函数身份稳定，常可省略。

### 清理函数

```js
useEffect(() => {
  const connection = createConnection();
  connection.connect();
  return () => connection.disconnect(); // 下次执行前及卸载时调用
}, []);
```

---

## 四、开发环境 Effect 执行两次

Strict Mode 下 React **故意重新挂载组件一次**以暴露缺少清理的 bug（挂载→清理→再挂载）。

- ⚠️ 禁止用 ref 阻止 Effect 执行来「修复」二次运行，这无法解决卸载时未断开等真实 bug。
- 正确做法：实现清理函数，使 setup→cleanup→setup 无用户可感知差异。

---

## 五、常见外部系统同步模式

| 场景 | 写法要点 |
|---|---|
| 控制非 React 部件 | 如 `map.setZoomLevel(zoom)`；`<dialog>.showModal()` 需返回 `close()` 清理 |
| 订阅事件 | `addEventListener` 后返回 `removeEventListener` |
| 触发动画 | 设置样式后，清理函数重置为初始值 |
| 获取数据 | 用 `AbortController` 忽略过期响应；推荐框架内获取或 TanStack Query |
| 发送分析 | 开发模式发两次，生产仅一次 |

---

## 小结（Recap）

- Effect 由渲染本身引起，用于同步外部系统；
- 默认每次渲染后运行；依赖数组相同则跳过；
- 空数组 `[]` 对应「挂载」；
- 严格模式开发环境双调用，需清理函数；
- 每个渲染有其独立的 Effect 与清理（闭包捕获对应渲染值）。

---

## 衔接

- 什么时候**不该**用 Effect：`12-you-might-not-need-effect.md`。
- Effect 封装为自定义 Hook：`13-custom-hooks.md`。
- Effect 中操作 DOM / 持有句柄常用 `useRef`：`10-refs-and-useRef.md`。
