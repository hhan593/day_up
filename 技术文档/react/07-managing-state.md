# React 管理状态（Managing State）

> 来源：React 官方文档（https://react.dev/learn/managing-state）— Learn / Managing State（Intermediate）
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、状态结构选择原则（Choosing the State Structure）

**核心**：state 不应包含冗余或重复信息，不必要的 state 易导致忘记更新而引入 bug。

```js
// ❌ 冗余：需手动同步 fullName
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const [fullName, setFullName] = useState('');

// ✅ 派生：渲染时计算
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const fullName = firstName + ' ' + lastName;
```

> 移除冗余 state、在渲染期派生数据，可修复大量 React 应用 bug。

---

## 二、提升 State（Sharing State Between Components）

**场景**：两个组件的状态需要始终一起变化。

**做法（Lifting State Up）**：
1. 从两个组件中删除各自 state；
2. 将 state 移至它们**最近的公共父组件**；
3. 通过 props 将 state 和变更函数传给子组件。

```js
function Accordion() {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <>
      <Panel isActive={activeIndex === 0} onShow={() => setActiveIndex(0)} />
      <Panel isActive={activeIndex === 1} onShow={() => setActiveIndex(1)} />
    </>
  );
}
```

---

## 三、向下传递数据：Context（Passing Data Deeply with Context）

**问题**：props 逐级透传（prop drilling）在多层嵌套时繁琐。

**方案**：Context 允许父组件向任意深层子组件提供数据，无需显式 props 传递（详见 `08-usecontext.md`）。

```js
// 层级标题自动递增示例
function Section({ children }) {
  const level = useContext(LevelContext);
  return <LevelContext.Provider value={level + 1}>{children}</LevelContext.Provider>;
}
```

---

## 四、状态逻辑提取：useReducer（Extracting State Logic into a Reducer）

**场景**：组件内多个事件处理函数中散落大量状态更新，难以维护。

**做法**（详见 `09-usereducer.md`）：
- 用 `useReducer` 把所有状态更新逻辑移到组件外的 `reducer` 函数；
- 事件处理函数只 `dispatch` 用户「动作」（action）；
- `reducer` 根据 `action.type` 返回新 state。

```js
function tasksReducer(tasks, action) {
  switch (action.type) {
    case 'added': return [...tasks, { id: action.id, text: action.text }];
    case 'changed': return tasks.map(t => t.id === action.id ? { ...t, text: action.text } : t);
    case 'deleted': return tasks.filter(t => t.id !== action.id);
    default: throw Error('Unknown action: ' + action.type);
  }
}
```

---

## 五、Reducer + Context 组合（Scaling Up）

- Reducer 整合复杂状态更新逻辑；
- Context 将 state/dispatch 深度下发。

```js
function TasksProvider({ children }) {
  const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
  return (
    <TasksContext.Provider value={tasks}>
      <TasksDispatchContext.Provider value={dispatch}>
        {children}
      </TasksDispatchContext.Provider>
    </TasksContext.Provider>
  );
}
```

子组件用 `useContext` 读 state、派发 action，无需 props 透传。

---

## 六、其他要点

- **Reacting to Input with State**：以状态机思维描述 UI（typing / submitting / success）。
- **Preserving and Resetting State**：用 `key` 强制重置组件状态（如切换聊天对象 `<Chat key={to.email} />`）。

---

## 小结（Recap）

- 用 props 派生数据，移除冗余 state；
- 兄弟组件共享 state → 提升到公共父组件；
- 跨多层传递 → Context；
- 复杂更新逻辑 → useReducer；
- useReducer + Context 是全局状态的经典组合。

---

## 跨框架对比

| React 概念 | 对应物 |
|---|---|
| 提升 state（lift up） | 任何框架通用：状态上移 + 回调下发 |
| Context | Vue 的 `provide/inject`、Angular 的 DI、Svelte 的 context |
| useReducer | Redux / Zustand 的 reducer 模式、Vuex/Pinia 的 mutation |
| Reducer + Context | 简化版 Redux（无中间件），Pinia store |
