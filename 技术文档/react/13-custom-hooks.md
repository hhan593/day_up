# React 自定义 Hook（Custom Hooks）

> 来源：React 官方文档（https://react.dev/learn/reusing-logic-with-custom-hooks）— Learn / Escape Hatches
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、概述

React 没有内置某些需求（获取数据、跟踪在线状态、连接聊天室）的 Hook，这时可自己编写**自定义 Hook**。

**价值**：
- 在组件间**复用状态逻辑（stateful logic）**，避免重复代码；
- 将复杂副作用/EOM 同步细节隐藏，组件只表达「意图」。

---

## 二、从组件提取自定义 Hook

```js
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}

// 组件变得简洁
function StatusBar() {
  const isOnline = useOnlineStatus();
  return <h1>{isOnline ? '✅ Online' : '❌ Disconnected'}</h1>;
}
```

---

## 三、命名约定：必须以 use 开头

- 组件名首字母大写，返回可渲染内容；
- Hook 名必须以 `use` + 大写字母开头（`useState`、`useOnlineStatus`），通常返回任意值；
- 不调用任何 Hook 的普通函数**不应**加 `use` 前缀（如 `getSorted` 而非 `useSorted`），以便能条件调用；
- 仅当函数内部至少用一个 Hook 才用 `use` 前缀（计划未来加 Hook 也可先命名 `useX`）。

---

## 四、自定义 Hook 共享「逻辑」而非「状态本身」

每次调用自定义 Hook 都**完全独立**：

```js
function StatusBar() { const isOnline = useOnlineStatus(); }
function SaveButton() { const isOnline = useOnlineStatus(); }
```

等价于两个组件各自声明独立 `useState`+`Effect`。值相同只是都被同步到同一外部状态（网络）。若要在组件间共享同一份 state，应**提升状态**（见 `07-managing-state.md`）而非依赖 Hook 共享。

---

## 五、传递响应式值

- Hook 代码随组件重渲染重新执行，总接收到最新 props/state；
- 一个 Hook 的返回值可作另一个 Hook 的输入；
- 所有 Hook 必须保持纯函数（同组件体）。

---

## 六、传递事件处理函数：useEffectEvent

```js
import { useEffect, useEffectEvent } from 'react';

export function useChatRoom({ serverUrl, roomId, onReceiveMessage }) {
  const onMessage = useEffectEvent(onReceiveMessage);
  useEffect(() => {
    const connection = createConnection({ serverUrl, roomId });
    connection.connect();
    connection.on('message', msg => onMessage(msg));
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // 不含 onMessage
}
```

> 直接把 `onReceiveMessage` 作依赖会导致频繁重连；用 `useEffectEvent` 包装使其不在依赖中。

---

## 七、何时使用

- 不必为每处小重复都提取（如包装单个 `useState` 的 `useFormInput` 可能没必要）；
- 编写 Effect 时应考虑是否包装为自定义 Hook，使数据流显式；
- ⚠️ 避免 `useMount`/`useEffectOnce` 等「生命周期」抽象，应直接按用途提取（`useChatRoom`、`useImpressionLog`）。

---

## 小结（Recap）

- 自定义 Hook 让组件间共享逻辑；
- 命名须以 `use` + 大写开头；
- 仅共享状态逻辑，不共享状态本身；
- 传入 Hook 的事件处理函数用 `useEffectEvent` 包装；
- 不写 `useMount` 类 Hook，保持用途具体。

---

## 衔接

- Effect 是自定义 Hook 的主要封装对象：`11-effects-useEffect.md`、`12-you-might-not-need-effect.md`。
- `useEffectEvent` 是 React 19 新增 API（稳定后可放心使用）。
