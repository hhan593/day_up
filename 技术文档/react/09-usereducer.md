# React useReducer 参考

> 来源：React 官方文档（https://react.dev/reference/react/useReducer）— Reference / Hooks
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、签名

```js
const [state, dispatch] = useReducer(reducer, initialArg, init?);
```

**参数**：
- `reducer`：纯函数 `(state, action) => nextState`，任意类型。
- `initialArg`：计算初始状态的值。
- `init`（可选）：初始化函数，接收 `initialArg` 返回初始状态；不传则初始状态即 `initialArg`。

**返回值**：`[当前 state, dispatch 函数]`。

**注意**：
- 只能在组件/自定义 Hook 顶层调用。
- `dispatch` 身份稳定，可省略进 Effect 依赖。
- Strict Mode 下 reducer 与 initializer 会调用两次（仅开发，检测不纯函数）。

---

## 二、reducer 函数

```js
function reducer(state, action) {
  switch (action.type) {
    case 'incremented_age':
      return { ...state, age: state.age + 1 }; // ✅ 返回新对象
    case 'changed_name':
      return { ...state, name: action.nextName };
    default:
      throw Error('Unknown action: ' + action.type);
  }
}
```

- 状态只读，**不可直接修改**原对象/数组，必须返回新对象（⚠️ `state.age = ...` 是错误写法）。
- 未返回或 type 不匹配 → 状态变 `undefined`，建议 `default` 抛错。

---

## 三、dispatch

```js
function handleClick() {
  dispatch({ type: 'incremented_age' });
}
```

- 调用 dispatch 后，当前代码中读取的 `state` 仍是旧值（快照）。
- 若新状态与旧状态 `Object.is` 相等，React 跳过重渲染。
- React 批量更新，事件处理完成后才刷新屏幕。

---

## 四、懒初始化（initializer）

直接传初始状态会在每次渲染都计算：

```js
// 🚩 每次渲染调用 createInitialState
const [state, dispatch] = useReducer(reducer, createInitialState(username));
```

改用第三个参数（传函数本身）：

```js
// ✅ 仅初始化时运行
const [state, dispatch] = useReducer(reducer, username, createInitialState);
// 无需参数时：useReducer(reducer, null, createInitialState)
```

---

## 五、与 useState 对比

- 二者非常相似。
- 区别：`useReducer` 将状态更新逻辑从事件处理移入组件外单一函数（reducer）。
- 官方建议：复杂状态逻辑或多个子值关联更新时更适合 `useReducer`。

---

## 六、action 模式

- action 任意形状，约定含 `type` 属性 + 额外信息。
- 应只包含 reducer 计算所需最少信息。

```js
dispatch({ type: 'changed_name', nextName: e.target.value });
```

> 多个数据变更可由单个 action 触发，保持「事件语义」而非「数据语义」。

---

## 小结（Recap）

- useReducer 把更新逻辑集中到纯函数 reducer；
- reducer 必须返回新状态（不可 mutate）；
- dispatch 是稳定的；用懒初始化避免重复计算；
- 与 Context 组合可构建全局状态（见 `07-managing-state.md`）。

---

## 跨框架对比

| React 概念 | 对应物 |
|---|---|
| reducer(state, action) | Redux reducer、Pinia action/mutation |
| dispatch({type}) | store.dispatch、action 触发 |
| 懒初始化 init | 工厂函数 / lazy init |
