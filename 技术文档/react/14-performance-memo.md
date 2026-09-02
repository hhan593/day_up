# React 性能优化与记忆化（useMemo / useCallback）

> 来源：React 官方文档（https://react.dev/reference/react/useMemo）— Reference / Hooks
> 版本：React v19.2（© Meta Platforms, Inc）
> 说明：useCallback 用法与 useMemo 对称，本文合并说明。

---

## 一、useMemo 签名

```js
const cachedValue = useMemo(calculateValue, dependencies);
```

- `calculateValue`：计算要缓存值的纯函数，不接受参数，返回任意类型。首次渲染调用；依赖未变返回缓存值，否则重算。
- `dependencies`：依赖数组，含 `calculateValue` 内部引用的所有响应式值（props/state/局部变量），用 `Object.is` 比较。

### 注意事项

- 仅在组件/自定义 Hook 顶层调用；
- Strict Mode 下开发环境故意调用计算函数两次（检测不纯），生产无此行为；
- React 可能丢弃缓存（如编辑文件、初始挂载 Suspense），不应作为语义保证。

---

## 二、缓存计算（Memoization）

```js
const visibleTodos = useMemo(() => filterTodos(todos, tab), [todos, tab]);
```

**适用场景**：
1. 跳过昂贵重算（过滤/转换大数组）；
2. 跳过子组件重渲染（缓存值作为 `memo` 组件的 prop）；
3. 防止 Effect 频繁触发（把对象用 `useMemo` 包裹）；
4. 作为其他 Hook 的依赖。

> ⚠️ 仅作性能优化手段，不可用于修正逻辑错误。

---

## 三、与 useCallback 的区别

- `useMemo` 缓存「计算结果」（值），`useCallback` 缓存「函数本身」。

```js
// useMemo 记忆函数（冗余）
const handleSubmit = useMemo(() => {
  return (orderDetails) => { post(...); };
}, [productId, referrer]);

// useCallback 等价且简洁
const handleSubmit = useCallback((orderDetails) => {
  post('/product/' + productId + '/buy', { referrer, orderDetails });
}, [productId, referrer]);
```

> 本质相同，`useCallback` 是避免嵌套函数的语法糖。

---

## 四、何时使用

**推荐**：
- 计算明显缓慢且依赖很少改变；
- 值作为 prop 传给 `memo` 组件，需跳过重渲染；
- 值作为其他 Hook（useEffect/useMemo）的依赖。

**不推荐**：
- 大多数粗粒度交互应用无需大量 memoization；
- 不要盲目外包 `useMemo`：降低可读性，且任一「总是新」的值会破坏整组缓存；
- 优先：用 children 传 JSX、局部 state、保持渲染纯、避免 Effect 更新 state、精简 Effect 依赖。

**React Compiler**：自动 memoize 值和函数，减少手动 `useMemo`（使用编译器后效果更佳）。

---

## 五、React.memo（组件记忆化）

```js
import { memo } from 'react';
const Child = memo(function Child({ data }) {
  return <div>{data}</div>;
});
```

- props 浅比较（`Object.is`）未变则跳过重渲染；
- 配合 `useMemo`/`useCallback` 稳定引用才能生效。

---

## 六、常见坑

- 箭头函数 `() => {` 后接 `{` 被解析为函数体，返回对象需 `() => ({...})` 或显式 `return`；
- 循环中不能调用 useMemo，应抽取子组件；
- 漏写依赖数组会每次重算。

---

## 小结（Recap）

- useMemo 缓存值、useCallback 缓存函数，本质是避免重复计算/重渲染；
- 仅作性能优化，不要用来修 bug；
- 配合 `memo` 组件 + 稳定引用才有效；
- React Compiler 可自动记忆化。

---

## 衔接

- 昂贵计算替代 Effect：`12-you-might-not-need-effect.md`。
- Context value 稳定引用：`08-usecontext.md`。
