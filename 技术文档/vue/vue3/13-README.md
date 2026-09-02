# Vue 3 知识文档索引

> 全部基于 **Vue 官方文档（vuejs.org，Vue 3 最新版）**、**Vue Router 4（router.vuejs.org）**、**Pinia（pinia.vuejs.org，v3.x）** 抓取整理。
> 知识点均标注官网来源 URL；官网某页未展开的内容已注明「官网未展开」或「标准补充」。

---

## 学习顺序（编号即阅读顺序）

| 编号 | 文件 | 主题 | 官网来源 |
|---|---|---|---|
| 01 | `vue3-learning-roadmap.md` | 学习路线图（已有） | 综合 |
| 02 | `vue3-common-pitfalls.md` | 易混淆点与陷阱（已有） | 综合 |
| 03 | `vue3-tips-and-tricks.md` | 技巧（已有） | 综合 |
| 04 | `reactivity-fundamentals.md` | 响应式基础：ref / reactive / 深层响应 / 解包 | /guide/essentials/reactivity-fundamentals |
| 05 | `template-syntax.md` | 模板语法：{{}} / v-bind / 动态参数 / 修饰符 | /guide/essentials/template-syntax |
| 06 | `computed-and-watchers.md` | computed / watch / watchEffect | /guide/essentials/computed、/watchers（补充） |
| 07 | `events-slots-provide.md` | 事件 / 表单 v-model / 插槽 / provide-inject | /guide/essentials/{event-handling,forms}、/components/{slots,provide-inject} |
| 08 | `components-props-events.md` | 组件与 Props / defineEmits | /guide/components/props |
| 09 | `lifecycle-composables.md` | 生命周期钩子 / 组合式函数 useX | /guide/essentials/lifecycle、/reusability/composables |
| 10 | `built-in-components.md` | Teleport / Suspense / Transition | /guide/built-ins/teleport（余为标准补充） |
| 11 | `routing-vue-router.md` | Vue Router 4：routes / RouterView / 守卫 | router.vuejs.org/guide |
| 12 | `state-pinia.md` | Pinia：defineStore / state-getters-actions | pinia.vuejs.org/introduction |
| 13 | `README.md` | 本索引 | — |

---

## 机制全景图

```
Vue 3 应用
  ├─ 响应式（04）：ref / reactive / computed（06）/ watch（06）
  ├─ 模板（05）：{{}} / : / @ / # / 修饰符
  ├─ 组件通信
  │     ├─ props（08）：defineProps + 单向数据流 + 校验
  │     ├─ emit（08）：defineEmits
  │     ├─ 插槽（07）：#name / 作用域插槽
  │     └─ provide/inject（07）：跨层级
  ├─ 事件/表单（07）：@ 修饰符 / v-model
  ├─ 生命周期与复用（09）：onMounted / useX composables
  ├─ 内置组件（10）：Teleport / Suspense / Transition
  ├─ 路由（11）：Vue Router 4
  └─ 状态（12）：Pinia（替代 Vuex）
```

---

## 7 条高频坑速查

1. ⚠️ **ref 需 .value**：JS 中 `count.value++`，模板中自动解包；reactive 解构会丢响应。
2. ⚠️ **props 单向**：子不可改 prop，用 `ref(props.x)` 作初始值 / `computed` 转换。
3. ⚠️ **响应式 props 解构**：3.5+ 才支持（`const { x } = defineProps()` 随变重算），3.4- 仅常量。
4. ⚠️ **v-model 忽略初始值**：始终以 JS 状态为准，初始值在 JS 侧声明；`.number`/`.trim`/`.lazy` 修饰符。
5. ⚠️ **Teleport 只移 DOM 不改逻辑**：provide/inject、事件仍按逻辑层级工作。
6. ⚠️ **Pinia 无 mutations**：直接改 state 或调 action，无 Vuex 的 mutation/namespace。
7. ⚠️ **nextTick**：DOM 不在状态变更后同步更新，需 `await nextTick()`。

---

## 与已有文档衔接

- `01-03` 是路线图/坑/技巧（用户原创向），建议先读；`04-12` 是官网 API 详述。
- 与 `技术文档/react`（16 篇）衔接：Vue 组合式 API ≈ React Hooks——`ref`≈`useState`（可变引用）、`computed`≈`useMemo`、`watch`≈`useEffect` 依赖、`useX` composable≈自定义 Hook、`provide/inject`≈Context、`<Teleport>`≈`createPortal`、`<Suspense>`≈React Suspense。
- 与 `技术文档/typescript`（16 篇）衔接：`defineProps<{...}>()` 是 TS 类型驱动。
- 与 `技术文档/nextjs`（16 篇）衔接：Next 文件系统路由 vs Vue Router 显式 routes 数组；Pinia 对应 Next 无内置（常用 Zustand）。
- 与 `技术文档/nest`（9 章）衔接：Vue+Pinia 作前端，Nest 作后端 API，二者通过 HTTP/Server Actions 通信。
```
