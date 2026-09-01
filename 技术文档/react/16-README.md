# React 知识文档索引

> 全部基于 **React 官方文档（react.dev，React v19.2，© Meta Platforms, Inc）** 抓取整理。
> 知识点均标注官网来源 URL；官网某页未展开的内容已注明「官网未展开」或「标准补充」。

---

## 学习顺序（编号即阅读顺序）

| 编号 | 文件 | 主题 | 官网来源 |
|---|---|---|---|
| 01 | `react-learning-roadmap.md` | 学习路线图 | 综合 |
| 02 | `react-cheatsheet.md` | 速查表 | 综合 |
| 03 | `react-core-concepts.md` | 核心概念（React + TypeScript 类型） | 综合 |
| 04 | `describing-the-ui.md` | 描述 UI：JSX、组件、props、children、条件渲染、列表、纯组件 | /learn/describing-the-ui |
| 05 | `state-and-events.md` | 状态与事件：useState、state 快照、onXxx 事件 | /learn/state-a-components-memory、/state-as-a-snapshot、/responding-to-events |
| 06 | `queueing-state-updates.md` | 状态更新排队：批处理、函数式更新 | /learn/queueing-a-series-of-state-updates |
| 07 | `managing-state.md` | 管理状态：状态结构、提升 state、Context、useReducer 组合 | /learn/managing-state |
| 08 | `usecontext.md` | useContext 参考：createContext、Provider、默认值、性能优化 | /reference/react/useContext |
| 09 | `usereducer.md` | useReducer 参考：签名、reducer、dispatch、懒初始化 | /reference/react/useReducer |
| 10 | `refs-and-useRef.md` | Refs 与 useRef：值引用、命令式 DOM | /learn/referencing-values-with-refs |
| 11 | `effects-useEffect.md` | Effects 与 useEffect：依赖、清理、严格模式双调用 | /learn/synchronizing-with-effects |
| 12 | `you-might-not-need-effect.md` | 何时不需要 Effect：派生状态、useMemo、key 重置 | /learn/you-might-not-need-an-effect |
| 13 | `custom-hooks.md` | 自定义 Hook：use 命名、逻辑复用、useEffectEvent | /learn/reusing-logic-with-custom-hooks |
| 14 | `performance-memo.md` | 性能优化：useMemo、useCallback、memo | /reference/react/useMemo |
| 15 | `suspense-concurrency.md` | Suspense 与并发：lazy、use、useTransition | /reference/react/Suspense |
| 16 | `README.md` | 本索引 | — |

---

## 机制全景图

```
组件（函数返回 JSX）
  ├─ 描述 UI（04）：JSX / props / children / 条件 / 列表 / 纯函数
  ├─ 交互（05/06）：useState 快照 + 批处理 + 函数式更新
  │     └─ 事件（05）：onXxx、preventDefault、stopPropagation
  ├─ 状态管理（07）：提升 state → Context（08）/ useReducer（09）
  ├─ 逃生舱（10/11/12）：useRef / useEffect / 「何时不用 Effect」
  │     └─ 复用逻辑（13）：自定义 Hook
  ├─ 性能（14）：useMemo / useCallback / memo
  └─ 并发（15）：Suspense / lazy / useTransition
```

---

## 7 条高频坑速查

1. ⚠️ **+3 只加 1**：同事件内 `setNumber(number+1)` 三次都基于旧快照 → 用 `setNumber(n => n+1)`（06）。
2. ⚠️ **严格模式 Effect 跑两次**：开发期故意，必须写清理函数，别用 ref 屏蔽（11）。
3. ⚠️ **渲染时算 vs Effect**：能从 props/state 派生的不要放 state + Effect（12）。
4. ⚠️ **reducer 不可 mutate**：必须返回新对象 ` {...state, age: state.age+1}`（09）。
5. ⚠️ **Context 只向上找**：Provider 必须在消费组件上方（08）。
6. ⚠️ **useMemo 非语义保证**：仅性能优化，React 可能丢弃缓存（14）。
7. ⚠️ **Suspense 不感知 useEffect 内 fetch**：用 `use(promise)` 或框架数据钩子（15）。

---

## 与已有文档衔接

- `03-react-core-concepts.md` 偏 React + TypeScript **类型**（props/state/event 类型声明），本文档 04-15 偏**纯 React 运行时机制**，互补不重复。
- `01/02` 是路线图与速查，建议在读完 04-15 后回看速查表巩固。
- 与 `技术文档/typescript` 衔接：组件 props/state 的类型标注见 typescript 部分 `03-everyday-types` / `06-classes` / 已有 `03-react-core-concepts`。
- 与 `技术文档/nest` 衔接：若用 React 作前端、Nest 作后端，状态管理（07-09）对应后端 DTO/Service 分层，Suspense 数据获取（15）对应 HTTP 客户端（nest `09-recipes/http-module`）。
```
