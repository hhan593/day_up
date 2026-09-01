# Vue 3 响应式基础（Reactivity Fundamentals）

> 来源：Vue 官方文档（https://vuejs.org/guide/essentials/reactivity-fundamentals）— Guide / Essentials
> 版本：Vue 3（Composition API + Options API，vuejs.org 最新）
> 说明：computed 在本页未涉及，见 `06-computed-and-watchers.md`（Computed Properties 章节）。

---

## 一、声明响应式状态

### Options API：data()
```js
export default {
  data() { return { count: 1 } },
  mounted() { console.log(this.count) /* 1 */; this.count = 2 }
}
```
- `data()` 返回对象被响应式系统（Proxy）包裹，顶层属性代理到 `this`。
- 所有响应式属性须预先声明于 `data`；直接给 `this` 加新属性不触发更新。

### Composition API：ref()（官方推荐主 API）
```vue
<script setup>
import { ref } from 'vue'
const count = ref(0)
console.log(count.value) // 0
count.value++
</script>
```
- `ref()` 返回带 `.value` 的 ref 对象；模板中**自动解包**（无需 `.value`）。
- 为何需要 ref：普通 JS 变量无法被追踪存取，ref 通过 `.value` getter/setter 实现依赖追踪。

### reactive()（对象本身响应式）
```js
import { reactive } from 'vue'
const state = reactive({ count: 0 })
state.count++ // 响应式
```
- 返回原始对象的 Proxy（`proxy !== raw`）。
- 局限性：①仅支持对象类型；②整体替换会丢失响应连接；③解构丢失响应性。

### ref vs reactive 选择（官方建议用 ref）
| 特性 | ref | reactive |
|---|---|---|
| 包装 | 带 `.value` 的对象 | 对象本身变 Proxy |
| 原始类型 | ✅ | ❌ |
| 整体替换 | ✅ | ❌ 丢失连接 |
| 解构 | 模板解包/`.value` | ❌ 丢失响应 |
| 官方推荐 | ✅ 主 API | 受限时用 |

> 因 reactive 的局限，官网建议用 `ref()` 作为声明响应式状态的主要 API。

---

## 二、深层响应（Deep Reactivity）

ref/reactive 默认深层响应，嵌套对象/数组变更均可检测：
```js
const obj = ref({ nested: { count: 0 }, arr: ['foo'] })
obj.value.nested.count++
obj.value.arr.push('baz')
```
性能敏感场景可用 `shallowRef` / `shallowReactive` 退出深层响应。

---

## 三、ref 解包细节

- 作为 `reactive` 对象属性时自动解包：`state.count` 等价于 `count.value`。
- 在数组/Map 等集合中**不**解包（需 `.value`）。
- 模板中仅顶层属性解包。

---

## 四、DOM 更新时机

状态变更后 DOM **不**同步更新，缓冲至下一 tick。用 `nextTick()` 等待：
```js
import { nextTick } from 'vue'
async function increment() {
  count.value++
  await nextTick() // DOM 已更新
}
```

---

## 五、声明方法（Methods）

- Options API：`methods` 选项（避免箭头函数，免丢失 `this`）。
- Composition API：直接在 `<script setup>` 声明函数并暴露。

---

## 小结（Recap）

- 响应式基于 Proxy（Vue 3）；
- 推荐 `ref()` 为主，`reactive()` 受限于对象类型/整体替换/解构；
- 模板中 ref 自动解包；DOM 更新在 nextTick。

---

## 衔接

- computed / watch：`06-computed-and-watchers.md`
- 模板语法：`05-template-syntax.md`
- 与 React 对比：`技术文档/react` 的 useState（可变引用 vs React 不可变快照）
