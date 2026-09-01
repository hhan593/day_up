# Vue 3 计算属性与侦听（Computed & Watch）

> 来源：Vue 官方文档
> - Computed Properties（https://vuejs.org/guide/essentials/computed）
> - Watchers（https://vuejs.org/guide/essentials/watchers，标准补充部分标注）
> 版本：Vue 3（getter 接收 previous 值特性为 3.4+）

---

## 一、computed 计算属性

模板中放过多逻辑会臃肿；含响应式数据的复杂逻辑用 computed。

### 基本用法
```vue
<script setup>
import { reactive, computed } from 'vue'
const author = reactive({ books: ['Vue 2', 'Vue 3'] })
const publishedBooksMessage = computed(() => author.books.length > 0 ? 'Yes' : 'No')
</script>
```
- `computed()` 接受 getter，返回 computed ref；模板自动解包。
- 自动追踪 `author.books` 依赖，仅依赖变化才重算。

### 缓存 vs Methods（重点）
| 特性 | Computed | Method |
|---|---|---|
| 缓存 | 依赖不变不重算 | 每次渲染都执行 |
| 适用 | 派生状态、昂贵计算 | 不希望缓存 |

```js
computed: { now() { return Date.now() } } // 永不更新（Date.now 非响应式）
```

### 可写 computed（getter + setter）
```vue
<script setup>
import { ref, computed } from 'vue'
const firstName = ref('John'); const lastName = ref('Doe')
const fullName = computed({
  get() { return firstName.value + ' ' + lastName.value },
  set(v) { [firstName.value, lastName.value] = v.split(' ') }
})
</script>
```
- 默认只读；赋值触发 setter。

### getter 接收 previous（3.4+）
```js
const alwaysSmall = computed((previous) => count.value <= 3 ? count.value : previous)
```

### 最佳实践
- getter 保持无副作用（不改状态/不发请求/不操作 DOM）；
- 视为只读派生快照，要改去改源状态。

---

## 二、watch 侦听器（标准补充 + 官网共识）

> ⚠️ 官网 Watchers 页本次抓取未返回正文，以下为 Vue 3 标准 API 共识整理。

### watch 基础
```vue
<script setup>
import { ref, watch } from 'vue'
const count = ref(0)
watch(count, (newVal, oldVal) => { console.log(newVal, oldVal) })
</script>
```
- 侦听一个或多个源（ref/getter），回调 `(newVal, oldVal)`。
- 默认懒执行（仅变化时）；`{ immediate: true }` 立即执行；`{ deep: true }` 深度侦听。

### watchEffect（自动追踪）
```js
watchEffect(() => { console.log(count.value) }) // 立即执行 + 依赖变化重跑
```
- 自动收集回调内响应式依赖，无需显式指定源。

### watch vs watchEffect
| 维度 | watch | watchEffect |
|---|---|---|
| 依赖声明 | 显式指定源 | 自动从回调收集 |
| 旧值 | 提供 oldVal | 不提供 |
| 立即执行 | 需 immediate | 总是立即 |

---

## 小结（Recap）

- computed 缓存派生值，getter 无副作用，可读写双形态；
- watch 显式侦听源（带旧值），watchEffect 自动收集依赖；
- 3.4+ computed getter 可接收 previous。

---

## 衔接

- 响应式基础：`04-reactivity-fundamentals.md`
- 组合式函数封装 watch：`09-lifecycle-composables.md`
- 与 React 对比：computed≈useMemo，watch≈useEffect 依赖
