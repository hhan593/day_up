# React 状态更新排队（Queueing a Series of State Updates）

> 来源：React 官方文档（https://react.dev/learn/queueing-a-series-of-state-updates）— Learn / Adding Interactivity
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、React 批处理状态更新（Batching）

```js
function Counter() {
  const [number, setNumber] = useState(0);
  return (
    <button onClick={() => {
      setNumber(number + 1);
      setNumber(number + 1);
      setNumber(number + 1);
    }}>+3</button>
  );
}
```

**现象**：计数器只增加 1，而不是 3。

**原因**：
1. 每次渲染中的 `number` 都是固定的（快照）。在第一次渲染的事件处理函数中 `number` 始终为 0，三次调用等价于 `setNumber(1)` × 3。
2. React 等待事件处理函数所有代码执行完毕，才处理 state 更新——类似服务员等顾客点完所有菜再去厨房。

**批处理的好处**：
- 一次事件中对多个 state（甚至多组件 state）更新，只触发一次重渲染；
- 避免「半成品」渲染；
- React **不会**跨多个独立事件（如多次点击）批处理，保证安全（第一次点击禁用表单，第二次不会提交）。

---

## 二、函数式更新（Functional Updates）

若要在下次渲染前对**同一 state 变量**更新多次，传**更新函数**：

```js
<button onClick={() => {
  setNumber(n => n + 1);
  setNumber(n => n + 1);
  setNumber(n => n + 1);
}}>+3</button>
```

**执行机制**：React 将每个 `n => n + 1` 加入队列，下次渲染时按顺序处理，上一个返回值作为下一个的入参：

| 队列中的更新 | n（入参） | 返回 |
|---|---|---|
| n => n + 1 | 0 | 1 |
| n => n + 1 | 1 | 2 |
| n => n + 1 | 2 | 3 |

最终 state = 3。

---

## 三、替换与更新混用

### 先替换再更新

```js
setNumber(number + 5);  // number 为 0 → 队列: "替换为 5"
setNumber(n => n + 1);  // 队列: 函数
```

| 队列中的更新 | n | 返回 |
|---|---|---|
| 替换为 5 | 0（未用） | 5 |
| n => n + 1 | 5 | 6 |

最终 = 6。

### 先更新再替换

```js
setNumber(number + 5);
setNumber(n => n + 1);
setNumber(42);
```

最终 = 42（后面的「替换」覆盖前面所有排队结果）。

**规则**：
- 传入**函数**（如 `n => n + 1`）：作为更新函数加入队列，基于前一个结果计算；
- 传入**其他值**（如 `5`）：作为「替换为该值」加入队列。

> ⚠️ 更新函数必须是纯函数，不能在其中调用 setState 或执行副作用。严格模式（Strict Mode）下 React 会调用两次更新函数（丢弃第二次结果）以排查错误。

---

## 四、命名约定

```js
setEnabled(e => !e);
setLastName(ln => ln.reverse());
setFriendCount(fc => fc * 2);
// 也可写全称
setEnabled(enabled => !enabled);
setEnabled(prevEnabled => !prevEnabled);
```

---

## 小结（Recap）

- 设置 state 不会改变当前渲染的变量，而是请求新渲染；
- React 在事件处理函数运行完成后才处理更新（批处理）；
- 同一事件内多次更新同一 state，用函数式更新 `setNumber(n => n + 1)`。

---

## 与 `05-state-and-events.md` 衔接

- `05` 讲 state 是快照、事件不读未来值；
- 本文是 `05` 中「为什么 +3 只加 1」的机制展开，并给出正确写法 `setNumber(n => n + 1)`。

---

## 跨框架对比

| React 概念 | 对应物 |
|---|---|
| 批处理（batching） | Vue 的异步更新队列（nextTick 后合并） |
| 函数式更新 `n => n+1` | 函数式语言 reducer / Redux `state => newState`、Vue `ref.value++` 直接改 |
| 严格模式双调用 | 开发期「故意跑两次」检测副作用，同 React 18+ 设计 |
