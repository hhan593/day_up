# Pinia 状态管理

> 来源：Pinia 官方文档（https://pinia.vuejs.org/introduction.html）— Introduction
> 版本：Pinia v3.x（Vue 3 配套，MIT License, © Eduardo San Martin Morote）
> 说明：持久化不在 Introduction 本页范围，需 Plugins 扩展，已在下方标注。

---

## 一、Pinia 是什么

Vue 官方状态管理库，跨组件/页面共享状态。无 `mutations`，仅 `state`+`getters`+`actions`；天生 TS 推断；扁平 store 结构（无 namespaced modules）。

---

## 二、defineStore 定义 Store

### 选项式写法
```js
// stores/counter.js
import { defineStore } from 'pinia'
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() { this.count++ },
  },
})
```

### Setup 写法（Composition API 风格）
```js
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  function increment() { count.value++ }
  return { count, increment }
})
```

---

## 三、State / Getters / Actions

- **state**：返回状态对象的函数（支持 TS 推断）；
- **getters**：派生状态，接收 `state`、通过 `this` 访问其他 getter；
- **actions**：修改状态的方法，可直接 mutate state、可接收参数、可返回 Promise。

```js
getters: {
  finishedTodos(state) { return state.todos.filter(t => t.isFinished) },
  filteredTodos() { return this.filter === 'finished' ? this.finishedTodos : this.todos },
},
actions: {
  addTodo(text) { this.todos.push({ text, id: this.nextId++ }) },
}
```

---

## 四、在组件中使用（useStore）

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
const counter = useCounterStore()
counter.count++            // 直接改（带补全）
counter.$patch({ count: counter.count + 1 })
counter.increment()        // 调 action
</script>
<template><div>{{ counter.count }} / {{ counter.double }}</div></template>
```

### Options API 兼容：map 辅助
```js
computed: { ...mapStores(useCounterStore), ...mapState(useCounterStore, ['count', 'double']) },
methods: { ...mapActions(useCounterStore, ['increment']) },
```

---

## 五、持久化（⚠️ 官网本页未覆盖）

> Pinia Introduction 未提供 persist/本地存储 API。持久化需通过 **Plugins** 扩展（如 `pinia-plugin-persistedstate`），属 Cookbook/Plugins 章节，非本文范围。

典型第三方用法（标准补充）：
```js
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
pinia.use(piniaPluginPersistedstate)
// store 中：{ persist: true }
```

---

## 小结（Recap）

- `defineStore(id, options | setup)`；
- state/getters/actions 三段式；无 mutations；
- `useStore()` 在 setup 直接用；扁平结构优于 Vuex modules。

---

## 衔接

- 组合式函数：`09-lifecycle-composables.md`（store 即跨组件状态封装）
- 与 React 对比：Pinia≈Zustand/Redux Toolkit、getters≈reselect/useMemo、actions≈reducer/action
- 与 Nest 对比：`技术文档/nest` 的 Service 是后端状态，Pinia 是前端共享 store
