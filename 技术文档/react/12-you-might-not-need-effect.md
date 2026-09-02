# React 你可能不需要 Effect（You Might Not Need an Effect）

> 来源：React 官方文档（https://react.dev/learn/you-might-not-need-an-effect）— Learn / Escape Hatches
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、概述：哪些场景不需要 Effect

Effect 是「逃生舱」，用于同步外部系统（非 React 组件、网络、DOM）。若不涉及外部系统，只是根据 props/state 变化更新自身状态，**不应使用 Effect**。

两种常见不需要 Effect 的情况：
1. **转换数据用于渲染**：过滤/计算列表应在渲染时直接计算，不用 Effect 更新 state。
2. **处理用户事件**：用户交互（点按钮发请求）放事件处理函数，Effect 运行时已无法得知用户行为。

---

## 二、派生状态（渲染时计算）

```js
// ❌ 冗余 state + Effect
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const [fullName, setFullName] = useState('');
useEffect(() => { setFullName(firstName + ' ' + lastName); }, [firstName, lastName]);

// ✅ 渲染时计算
const [firstName, setFirstName] = useState('Taylor');
const [lastName, setLastName] = useState('Swift');
const fullName = firstName + ' ' + lastName;
```

> 能从现有 props/state 算出的，不要放 state，渲染时算即可。更快、更简单、不易不同步。

---

## 三、缓存昂贵计算：useMemo

```js
// ❌ Effect + state
const [visibleTodos, setVisibleTodos] = useState([]);
useEffect(() => { setVisibleTodos(getFilteredTodos(todos, filter)); }, [todos, filter]);

// ✅ 直接计算；昂贵时用 useMemo（见 14-performance-memo.md）
const visibleTodos = useMemo(() => getFilteredTodos(todos, filter), [todos, filter]);
```

- `useMemo` 仅在 `todos`/`filter` 变化时重算，避免无关 state（如 `newTodo`）触发重复计算。
- React Compiler 可自动记忆化，减少手动 `useMemo`。

---

## 四、重置与调整 State

### 用 key 重置整个组件树

```js
// ❌ Effect 清空
useEffect(() => { setComment(''); }, [userId]);

// ✅ 传不同 key
function ProfilePage({ userId }) {
  return <Profile userId={userId} key={userId} />;
}
```

### 调整部分 state

```js
// 最佳：通过计算避免调整（存选中 ID，渲染时查找）
function List({ items }) {
  const [selectedId, setSelectedId] = useState(null);
  const selection = items.find(i => i.id === selectedId) ?? null;
}
```

---

## 五、事件处理函数间共享逻辑

```js
// ❌ 放 Effect：刷新页面若已在购物车会重复通知
useEffect(() => { if (product.isInCart) showNotification(...); }, [product]);

// ✅ 提取函数，在事件处理函数中调用
function buyProduct() {
  addToCart(product);
  showNotification(`Added ${product.name}`);
}
```

**准则**：因特定交互产生的逻辑 → 事件处理函数；因组件展示给用户而产生的逻辑 → Effect。

---

## 六、其他要点

- 发送 POST：分析类请求（挂载打点）放 Effect；表单提交放事件处理函数。
- 订阅外部 store：用 `useSyncExternalStore` 而非手动 Effect。
- 获取数据：Effect 中 fetch 需清理函数避免竞态；推荐框架内置或 `useData` 自定义 Hook。

---

## 小结（Recap）

- 渲染时能算出的，不需要 Effect；
- 缓存昂贵计算用 `useMemo`；
- 重置整棵树 state：传不同 `key`；
- 因组件显示而运行的代码放 Effect，其余放事件；
- Effect 中获取数据需清理避免竞态。

---

## 衔接

- Effect 的正确用法：`11-effects-useEffect.md`。
- `useMemo` 详解：`14-performance-memo.md`。
- 把 Effect 封装为自定义 Hook：`13-custom-hooks.md`。
