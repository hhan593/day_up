# React useContext 参考

> 来源：React 官方文档（https://react.dev/reference/react/useContext）— Reference / Hooks
> 版本：React v19.2（© Meta Platforms, Inc）

---

## 一、createContext

- `createContext` 创建 Context 对象，**本身不保存数据**，仅代表「可被提供或读取的某类信息」。

```js
import { createContext } from 'react';
const ThemeContext = createContext('light'); // 默认值为 'light'
```

- `defaultValue`：当组件树中**没有匹配的 Provider** 时，`useContext` 返回该值。

---

## 二、useContext 用法

在组件**顶层**调用读取并订阅 Context：

```js
import { useContext } from 'react';

function Button() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>...</button>;
}
```

- **参数**：`SomeContext`（createContext 创建的对象）。
- **返回值**：最近的 `<SomeContext.Provider>` 的 `value`；找不到则返回 `defaultValue`。
- 返回值始终最新，Provider 的 `value` 变化时会自动重渲染消费组件。

### 注意事项（Caveats）

1. `useContext` **只向上查找**，不考虑调用组件自身内部渲染的 Provider。
2. Provider `value` 变化 → 所有消费后代组件自动重渲染（即使被 `memo` 包裹也无法阻止）；新旧值用 `Object.is` 比较。
3. 若构建工具产生重复模块（如 symlink），会破坏 Context：提供与消费的 `SomeContext` 必须 `===` 完全相同。

---

## 三、Provider

```js
function MyPage() {
  return (
    <ThemeContext.Provider value="dark">
      <Form />
    </ThemeContext.Provider>
  );
}
```

- 无论 `Button` 与 Provider 之间隔多少层，调用 `useContext(ThemeContext)` 即获 `"dark"`。
- 可嵌套覆盖：某子树外包裹不同 `value` 的 Provider 即局部重写。

### 更新 Context 数据

```js
function MyPage() {
  const [theme, setTheme] = useState('dark');
  return (
    <ThemeContext.Provider value={theme}>
      <Form />
      <button onClick={() => setTheme('light')}>Switch</button>
    </ThemeContext.Provider>
  );
}
```

---

## 四、默认值陷阱

- 若树中存在 `<SomeContext value={undefined}>`，消费组件收到 `undefined`，**而非** `createContext` 的默认值。
- 推荐设合理默认值（而非 `null`）便于测试。

```js
const ThemeContext = createContext('light'); // ✅
```

---

## 五、性能优化（Optimizing Re-renders）

每次父组件重渲染生成新对象/新函数引用，会导致所有消费组件重渲染。用 `useMemo`/`useCallback` 稳定引用：

```js
import { useCallback, useMemo } from 'react';

function MyApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const login = useCallback((res) => {
    storeCredentials(res.credentials);
    setCurrentUser(res.user);
  }, []);
  const contextValue = useMemo(() => ({ currentUser, login }), [currentUser, login]);
  return <AuthContext.Provider value={contextValue}><Page /></AuthContext.Provider>;
}
```

---

## 六、常见问题

- **读不到 Provider 的值**：Provider 在下方或同组件 → 上移；忘记包裹 → 用 DevTools 检查；模块重复 → 检查引用一致性。
- **总是 `undefined`**：漏写 `value` 或误用其他属性名（应 `<ThemeContext value={theme}>`）。

---

## 小结（Recap）

- Context 解决 prop drilling，Provider 在树上提供，消费组件向上读取；
- 默认值是「无 Provider」时的兜底，非 `value={undefined}` 的兜底；
- 大对象/函数作 value 时用 `useMemo`/`useCallback` 避免无谓重渲染。

---

## 衔接

- 与 `07-managing-state.md`（Context 提升状态）、`09-usereducer.md`（reducer + Context 全局状态）配合阅读。
