# React Refs 与 useRef

> 来源：React 官方文档（https://react.dev/learn/referencing-values-with-refs）— Learn / Escape Hatches
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、useRef 基本用法

当组件需要「记住」某些信息，但不希望触发重渲染时用 **ref**。

```js
import { useRef } from 'react';

function Counter() {
  const ref = useRef(0);
  function handleClick() {
    ref.current = ref.current + 1;
    alert('You clicked ' + ref.current + ' times!');
  }
  return <button onClick={handleClick}>Click me!</button>;
}
```

- `useRef(initialValue)` 返回 `{ current: initialValue }`。
- 修改 `ref.current` **不触发重渲染**（区别于 state）。

---

## 二、ref 与 state 的区别

| 对比维度 | Refs (`useRef`) | State (`useState`) |
|---|---|---|
| 返回值 | `{ current: initialValue }` | `[value, setValue]` |
| 变更触发重渲染 | 否 | 是 |
| 可变性 | 可变，随时改 `current` | 必须通过 setter 修改 |
| 渲染期读写 | **不应**在渲染期读写 `current` | 每次渲染有独立快照 |

> 渲染依赖的数据必须用 state；仅事件处理需要、不需重渲染的数据用 ref 更高效（如定时器 ID、DOM 元素、外部句柄）。

---

## 三、ref 作为值引用

- ref 可指向任意值：数字、字符串、对象、函数。
- 与 state 类似，ref 跨重渲染由 React 保留；不同于 state，它是含 `current` 的普通对象，可直接读写。

**案例：秒表**

```js
const intervalRef = useRef(null);
intervalRef.current = setInterval(() => setNow(Date.now()), 10);
// 停止
clearInterval(intervalRef.current);
```

---

## 四、可变 ref（Mutable Ref）

```js
ref.current = 5;
console.log(ref.current); // 5（同步、立即生效）
```

- 不像 state 表现为快照或异步。
- 只要该对象不参与渲染，React 不关心其内容变化。
- ⚠️ 不要在渲染期间读写 `ref.current`（例外：首次渲染惰性初始化 `if (!ref.current) ref.current = new Thing()`）。

---

## 五、命令式操作 DOM

- ref 最常见用途是访问 DOM 元素：`<div ref={myRef}>`，React 把对应 DOM 放入 `myRef.current`。
- 元素移除后 `myRef.current` 设为 `null`。
- 典型应用：编程方式聚焦输入框 `inputRef.current.focus()`。

---

## 小结（Recap）

- ref 保存不参与渲染的值，不常需；
- ref 是含 `current` 的普通对象，跨渲染保留；
- 改 `current` 不触发重渲染；
- 渲染中不读写 `ref.current`；
- refs 是「逃生舱」，仅在与外部系统/浏览器 API 通信时使用。

---

## 衔接

- Refs 常与 Effects 配合（如 `11-effects-useEffect.md` 中订阅外部系统、操作 DOM）。
- 命令式 DOM 操作是 React 声明式之外的「逃生舱」，应克制使用。
