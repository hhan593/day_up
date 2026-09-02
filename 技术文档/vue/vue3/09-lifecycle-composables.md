# Vue 3 生命周期与组合式函数（Lifecycle & Composables）

> 来源：Vue 官方文档
> - Lifecycle Hooks（https://vuejs.org/guide/essentials/lifecycle）
> - Composables（https://vuejs.org/guide/reusability/composables）
> 版本：Vue 3

---

## 一、生命周期钩子（Lifecycle Hooks）

组件实例经历初始化→编译模板→挂载→更新→卸载，期间调用钩子函数。

### 最常用（Composition API）
```vue
<script setup>
import { onMounted, onUpdated, onUnmounted } from 'vue'
onMounted(() => { /* DOM 已创建 */ })
onUpdated(() => { /* DOM 因数据变化已更新 */ })
onUnmounted(() => { /* 实例卸载 */ })
</script>
```

### 完整钩子对照（选项式 ↔ 组合式）
| 选项式 | 组合式 | 时机 |
|---|---|---|
| beforeCreate / created | setup 内直接写 | 创建前/后 |
| beforeMount | onBeforeMount | 挂载前 |
| mounted | onMounted | 挂载后 |
| beforeUpdate | onBeforeUpdate | 更新前 |
| updated | onUpdated | 更新后 |
| beforeUnmount | onBeforeUnmount | 卸载前 |
| unmounted | onUnmounted | 卸载后 |
| activated / deactivated | onActivated / onDeactivated | KeepAlive 缓存组件 |
| errorCaptured | onErrorCaptured | 捕获后代错误 |
| renderTracked / renderTriggered | onRenderTracked / onRenderTriggered | 调试 |

### 注册规则
- 组合式钩子**必须同步注册**于 `<script setup>`/`setup()` 内（`onMounted(() => setTimeout(...))` 无效）。
- 选项式钩子避免箭头函数（依赖 `this`）。
- 组合式钩子回调普通函数即可，无 `this` 依赖。

---

## 二、组合式函数（Composables）

封装**有状态逻辑**（stateful logic）的 `useX` 约定函数。

```js
// mouse.js
import { ref, onMounted, onUnmounted } from 'vue'
export function useMouse() {
  const x = ref(0); const y = ref(0)
  function update(e) { x.value = e.pageX; y.value = e.pageY }
  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))
  return { x, y } // 返回普通对象含多个 ref
}
```
```vue
<script setup>
import { useMouse } from './mouse.js'
const { x, y } = useMouse() // 解构仍保持响应
</script>
```

### 约定与最佳实践
- 命名 `useXxx`（camelCase）；
- 返回**普通对象含多个 ref**（解构不丢响应；返回 reactive 会丢）；
- 可互相嵌套组合（`useEventListener` 被 `useMouse` 调用）；
- 副作用须在 `onMounted` 设、`onUnmounted` 清（SSR 安全）；
- 输入可接收 ref/getter，用 `toValue()` 规范化。

### 对比
- vs Mixins：解决来源不清/命名冲突/隐式通信；
- vs 无渲染组件：无额外实例开销，纯逻辑复用更佳；
- 生态：VueUse 提供大量现成组合式函数。

---

## 小结（Recap）

- 钩子须同步注册；onMounted/onUpdated/onUnmounted 最常用；
- 组合式函数 `useX` 封装状态逻辑，返回含 ref 的对象；
- 嵌套组合 + 生命周期清理副作用。

---

## 衔接

- 响应式/计算：`04`、`06`
- 事件/插槽：`07`
- 与 React 对比：useMouse≈React 自定义 Hook（useEffect + useState）
