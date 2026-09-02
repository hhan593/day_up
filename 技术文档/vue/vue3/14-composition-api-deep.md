# 14. Vue 3 Composition API 深入

> 来源可信度：**官方文档确认**（基于 Vue 3 `reactivity` / `<script setup>` 官方文档；与 `04-reactivity-fundamentals.md`/`09-lifecycle-composables.md` 衔接）
> 关联：React `13-custom-hooks.md`、Solid/Qwik 信号思想

## 1. 为什么 Composition API

Options API（data/methods/computed）在大型组件里逻辑分散；Composition API 按**逻辑关注点**组织代码，可提取为 composable 复用。

```ts
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);
function inc() { count.value++; }

onMounted(() => console.log('mounted'));
</script>

<template>
  <button @click="inc">{{ count }} / {{ double }}</button>
</template>
```

- `<script setup>` 编译期语法糖，顶层绑定自动暴露模板。

## 2. 响应式原理（Vue 3 vs Vue 2）

- **Vue 2**：`Object.defineProperty` 劫持（见根 README 源码分析），无法监听新增属性/数组索引。
- **Vue 3**：`Proxy` 代理整个对象，天然支持新增/删除/数组/Map/Set。

```ts
import { reactive } from 'vue';
const state = reactive({ count: 0, list: [] as number[] });
state.list.push(1); // 自动响应（Vue 2 需 $set）
```

- `ref` 包装基本类型（`{ value }`），`reactive` 代理对象；`toRefs` 解构保响应。

## 3. Composable 复用

```ts
// useCounter.ts
import { ref } from 'vue';
export function useCounter() {
  const n = ref(0);
  return { n, inc: () => n.value++ };
}

// 组件内
const { n, inc } = useCounter();
```

- composable 是 Vue 版 custom hook（对比 React `13-custom-hooks.md`），命名约定 `useXxx`。

## 4. 依赖注入 provide/inject

```ts
// 祖先
import { provide, ref } from 'vue';
provide('theme', ref('dark'));

// 后代
import { inject } from 'vue';
const theme = inject('theme', ref('light')); // 默认值
```

- 与 React Context 类似（`08-usecontext.md`）；响应值自动穿透。

## 5. 与 React Hooks 对照

| Vue 3 | React |
|-------|-------|
| `ref`/`reactive` | `useState` |
| `computed` | `useMemo` |
| `watch` | `useEffect` |
| `composable` | custom hook |
| `onMounted` | `useEffect(()=>{...},[])` |

## 6. 一句话总结

> Vue 3 Composition API 用 `Proxy` 响应式、`ref`/`reactive` 状态、`<script setup>` 语法糖，按逻辑关注点组织；composable 复用对标 React custom hook。Vue 2 的 defineProperty 局限在 Vue 3 彻底解决。
