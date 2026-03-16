# Vue 3 易混淆知识点与常见陷阱

> Vue 2 与 Vue 3 的区别，以及容易混淆的概念对比

---

## 📊 Vue 2 vs Vue 3 核心区别

### 响应式系统

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 实现方式 | Object.defineProperty | Proxy |
| 新增属性 | 需要 Vue.set | 自动响应 |
| 删除属性 | 需要 Vue.delete | 自动响应 |
| 数组索引 | 不支持直接修改 | 支持 |
| Map/Set | 不支持 | 原生支持 |

```javascript
// Vue 2
this.items[0] = 'new'           // ❌ 不响应
this.$set(this.items, 0, 'new') // ✅
delete this.user.name           // ❌ 不响应
this.$delete(this.user, 'name') // ✅

// Vue 3
items[0] = 'new'                // ✅ 自动响应
delete user.name                // ✅ 自动响应
```

### 创建应用

```javascript
// Vue 2
import Vue from 'vue'
import App from './App.vue'

new Vue({
  render: h => h(App)
}).$mount('#app')

// Vue 3
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

### 全局配置

```javascript
// Vue 2
Vue.component('MyComponent', MyComponent)
Vue.directive('focus', focusDirective)
Vue.use(VueRouter)
Vue.prototype.$http = axios

// Vue 3
const app = createApp(App)

app.component('MyComponent', MyComponent)
app.directive('focus', focusDirective)
app.use(VueRouter)
app.config.globalProperties.$http = axios

// Vue 3 推荐：使用 provide
app.provide('$http', axios)
```

---

## 🔄 ref vs reactive 详解

### 使用场景对比

```javascript
// ✅ ref 适用场景

// 1. 基本类型
const count = ref(0)
const name = ref('Alice')
const isActive = ref(true)

// 2. 需要替换整个对象
const user = ref({ name: 'Alice' })
user.value = { name: 'Bob' }  // 替换整个对象

// 3. 从函数返回响应式数据
function useCounter() {
  return {
    count: ref(0)  // 可以解构保持响应式
  }
}
const { count } = useCounter()  // count 仍是响应式

// 4. 模板引用
const inputRef = ref(null)
```

```javascript
// ✅ reactive 适用场景

// 1. 复杂对象，属性操作多
const form = reactive({
  name: '',
  email: '',
  address: {
    city: '',
    street: ''
  }
})
// 直接修改属性
form.name = 'Alice'
form.address.city = 'Beijing'

// 2. 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 3. 状态对象（不会整体替换）
const state = reactive({
  users: [],
  loading: false,
  error: null
})
```

### 常见陷阱

```javascript
// ❌ 陷阱 1：reactive 解构丢失响应式
const state = reactive({ count: 0, name: 'Alice' })
const { count, name } = state  // ❌ 失去响应式

count++  // 不会更新视图

// ✅ 解决方案 1：使用 toRefs
import { toRefs } from 'vue'
const { count, name } = toRefs(state)
count.value++  // ✅ 响应式

// ✅ 解决方案 2：使用 ref
const state = {
  count: ref(0),
  name: ref('Alice')
}
const { count, name } = state  // ✅ 保持响应式

// ✅ 解决方案 3：不解构，直接访问
state.count++  // ✅ 响应式
```

```javascript
// ❌ 陷阱 2：reactive 不能直接赋值
const state = reactive({ count: 0 })
state = { count: 1 }  // ❌ 错误！不能重新赋值

// ✅ 解决方案 1：修改属性
state.count = 1

// ✅ 解决方案 2：使用 Object.assign
Object.assign(state, { count: 1 })

// ✅ 解决方案 3：使用 ref
const state = ref({ count: 0 })
state.value = { count: 1 }  // ✅ 可以重新赋值
```

```javascript
// ❌ 陷阱 3：数组操作
const state = reactive({ items: [1, 2, 3] })

// ✅ 这些操作都是响应式的
state.items.push(4)
state.items[0] = 10
state.items.length = 0

// ❌ 但直接赋值数组会丢失响应式
const state = reactive([1, 2, 3])
state = [4, 5, 6]  // ❌ 错误

// ✅ 使用 ref 包装数组
const items = ref([1, 2, 3])
items.value = [4, 5, 6]  // ✅
```

---

## 📝 watch vs watchEffect

### 核心区别

```javascript
import { ref, watch, watchEffect } from 'vue'

const count = ref(0)
const name = ref('Alice')

// ✅ watch - 懒执行，精确控制
// 初始不会执行，只有监听源变化才执行
watch(count, (newVal, oldVal) => {
  console.log(`count 变化: ${oldVal} -> ${newVal}`)
})

// 监听多个源
watch([count, name], ([newCount, newName], [oldCount, oldName]) => {
  console.log('count 或 name 变化')
})

// ✅ watchEffect - 立即执行，自动追踪
// 初始化立即执行，自动追踪依赖
watchEffect(() => {
  console.log(count.value)  // 自动追踪 count
  // 不访问 name，所以 name 变化不会触发
})

// 执行顺序
console.log('1')
watchEffect(() => {
  console.log('watchEffect:', count.value)
})
console.log('2')
watch(count, () => {
  console.log('watch:', count.value)
})
console.log('3')

// 输出：
// 1
// watchEffect: 0  （立即执行）
// 2
// 3
// 当 count 变化时：
// watchEffect: 1  （先执行）
// watch: 1        （后执行）
```

### 使用场景

```javascript
// ✅ watch 场景

// 1. 需要旧值
watch(count, (newVal, oldVal) => {
  if (newVal > oldVal) {
    console.log('增加了')
  }
})

// 2. 精确控制监听源
watch(() => user.age, (newAge) => {
  console.log('年龄变化，但名字变化不触发')
})

// 3. 深度监听特定对象
watch(
  () => state.nested,
  (newVal) => { ... },
  { deep: true }
)

// 4. 一次性监听
watch(count, (val) => {
  if (val > 10) {
    console.log('达到阈值')
    // 可以在这里停止监听
  }
}, { once: true })
```

```javascript
// ✅ watchEffect 场景

// 1. 依赖关系复杂，自动追踪更方便
watchEffect(() => {
  console.log(count.value, user.name, items.length)
  // 自动追踪所有用到的响应式数据
})

// 2. 需要同步执行
watchEffect(() => {
  // DOM 操作
  document.title = `Count: ${count.value}`
})

// 3. 清理副作用
watchEffect((onCleanup) => {
  const timer = setInterval(() => {
    console.log(count.value)
  }, 1000)

  onCleanup(() => {
    clearInterval(timer)
  })
})
```

### 常见陷阱

```javascript
// ❌ 陷阱 1：watch 监听 reactive 对象属性
const state = reactive({ count: 0 })

watch(state.count, (val) => {  // ❌ 错误！监听的是值，不是响应式引用
  console.log(val)
})

// ✅ 正确写法
watch(() => state.count, (val) => {
  console.log(val)
})

// 或者直接监听整个对象
watch(state, (val) => {
  console.log(val.count)
}, { deep: true })
```

```javascript
// ❌ 陷阱 2：异步 watchEffect 中的依赖
watchEffect(async () => {
  // ❌ 问题：await 之后的代码可能依赖已过期数据
  const response = await fetch(`/api/user/${userId.value}`)
  const data = await response.json()

  // 如果 userId 在此期间变化，这里使用的是过期的 userId
  console.log(userId.value, data)
})

// ✅ 解决方案
watch(userId, async (newId, oldId, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })

  const response = await fetch(`/api/user/${newId}`)
  const data = await response.json()

  if (!cancelled) {
    console.log(newId, data)
  }
})
```

---

## 🎯 computed 注意事项

### 正确使用

```javascript
// ✅ 只读 computed
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// ✅ 可写 computed
const fullName = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newValue) {
    [firstName.value, lastName.value] = newValue.split(' ')
  }
})
```

### 常见陷阱

```javascript
// ❌ 陷阱 1：在 computed 中修改数据
const badComputed = computed(() => {
  count.value++  // ❌ 错误！computed 不应该有副作用
  return count.value * 2
})

// ✅ 纯函数
const goodComputed = computed(() => {
  return count.value * 2  // 只读取，不修改
})
```

```javascript
// ❌ 陷阱 2：返回非响应式对象
const items = ref([1, 2, 3])

const processed = computed(() => {
  items.value.push(4)  // ❌ 修改原数组！
  return items.value.filter(i => i > 2)
})

// ✅ 不要修改原数据
const processed = computed(() => {
  return [...items.value, 4].filter(i => i > 2)
})
```

```javascript
// ❌ 陷阱 3：computed 中异步操作
const data = computed(async () => {  // ❌ 返回的是 Promise！
  const res = await fetch('/api/data')
  return res.json()
})

// ✅ 使用 ref + watch
const data = ref(null)
watch(someDep, async () => {
  const res = await fetch('/api/data')
  data.value = await res.json()
})

// 或使用异步 computed（vueuse）
import { computedAsync } from '@vueuse/core'
const data = computedAsync(async () => {
  const res = await fetch('/api/data')
  return res.json()
}, null)  // 初始值
```

---

## 📦 script setup 常见问题

### Props 和 Emits

```vue
<!-- ✅ 正确声明 -->
<script setup>
// 运行时声明
defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update', 'delete'])
</script>

<!-- TypeScript -->
<script setup lang="ts">
// 类型声明
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
}>()
</script>
```

### 常见错误

```vue
<script setup>
// ❌ 错误：defineProps 不能解构
const { title } = defineProps(['title'])

// ✅ 正确：获取 props 对象
const props = defineProps(['title'])
console.log(props.title)

// ❌ 错误：不能在 defineProps 中使用导入的类型（非 TS 时）
import type { User } from './types'
defineProps<User>()  // ❌ 仅 TS 支持

// ✅ 正确：运行时声明
defineProps({
  user: Object
})
</script>
```

### defineExpose

```vue
<script setup>
const count = ref(0)
const increment = () => count.value++

// 默认 script setup 不暴露任何东西给父组件
// 需要显式暴露
defineExpose({
  count,
  increment
})
</script>
```

---

## 🎭 v-if vs v-show

```vue
<template>
  <!--
    v-if: 条件渲染
    - 条件为 false 时不渲染（DOM 中不存在）
    - 切换成本高（需要销毁/重建）
    - 适合条件很少改变的场景
  -->
  <div v-if="type === 'A'">A</div>
  <div v-else-if="type === 'B'">B</div>
  <div v-else>Other</div>

  <!--
    v-show: 显示/隐藏
    - 始终渲染（DOM 中始终存在）
    - 切换成本低（只是修改 CSS display）
    - 适合频繁切换的场景
  -->
  <div v-show="isVisible">内容</div>
</template>
```

### 优先级问题

```vue
<!-- ❌ v-if 优先级高于 v-for（Vue 2） -->
<!-- ✅ Vue 3 中 v-if 优先级低于 v-for -->
<!-- 但仍不建议一起使用 -->

<!-- 不推荐 -->
<li v-for="item in items" v-if="item.visible">
  {{ item.name }}
</li>

<!-- ✅ 推荐：使用 computed 过滤 -->
<script setup>
const visibleItems = computed(() =>
  items.value.filter(item => item.visible)
)
</script>

<template>
  <li v-for="item in visibleItems" :key="item.id">
    {{ item.name }}
  </li>
</template>

<!-- 或者使用 template -->
<template v-for="item in items" :key="item.id">
  <li v-if="item.visible">
    {{ item.name }}
  </li>
</template>
```

---

## 🔄 组件通信方式对比

| 方式 | 方向 | 适用场景 |
|------|------|----------|
| Props / Emits | 父子 | 基本通信 |
| v-model | 父子 | 双向绑定 |
| refs | 父子 | 直接访问子组件 |
| Provide / Inject | 祖孙 | 深层嵌套 |
| Event Bus | 任意 | 简单全局通信 |
| Pinia/Vuex | 全局 | 状态管理 |
| attrs / listeners | 父子 | 透传 |

```vue
<!-- Props / Emits -->
<!-- 父 -->
<Child :data="parentData" @update="handleUpdate" />

<!-- 子 -->
<script setup>
defineProps(['data'])
const emit = defineEmits(['update'])
emit('update', newValue)
</script>
```

```vue
<!-- v-model 多个 -->
<!-- 父 -->
<UserForm
  v-model:name="user.name"
  v-model:email="user.email"
/>

<!-- 子 -->
<script setup>
defineProps(['name', 'email'])
defineEmits(['update:name', 'update:email'])
</script>
```

```vue
<!-- Provide / Inject -->
<!-- 祖先 -->
<script setup>
provide('user', readonly(user))
provide('updateUser', updateUser)
</script>

<!-- 后代 -->
<script setup>
const user = inject('user')
const updateUser = inject('updateUser')
</script>
```

---

## ⚡ 生命周期变化

### 命名变化

| Vue 2 | Vue 3 |
|-------|-------|
| beforeDestroy | beforeUnmount |
| destroyed | unmounted |

### 使用方式对比

```javascript
// Vue 2 Options API
export default {
  data() { return { count: 0 } },
  computed: { double() { return this.count * 2 } },
  watch: { count(val) { console.log(val) } },
  mounted() { console.log('mounted') },
  methods: { increment() { this.count++ } }
}

// Vue 3 Options API（兼容）
export default {
  data() { return { count: 0 } },
  // ... 相同
}

// Vue 3 Composition API
<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)
watch(count, (val) => console.log(val))
onMounted(() => console.log('mounted'))
const increment = () => count.value++
</script>
```

### 生命周期对应关系

```javascript
// Vue 2          -> Vue 3 Composition API
beforeCreate     -> setup()
created          -> setup()
beforeMount      -> onBeforeMount
mounted          -> onMounted
beforeUpdate     -> onBeforeUpdate
updated          -> onUpdated
beforeDestroy    -> onBeforeUnmount
destroyed        -> onUnmounted
activated        -> onActivated
deactivated      -> onDeactivated
errorCaptured    -> onErrorCaptured
```

---

## 🎨 插槽变化

### 语法变化

```vue
<!-- Vue 2 -->
<template>
  <slot name="header" :data="data"></slot>
</template>

<!-- 父组件 -->
<template v-slot:header="{ data }">
  {{ data }}
</template>

<!-- Vue 3 -->
<template>
  <slot name="header" :data="data"></slot>
</template>

<!-- 父组件 -->
<template #header="{ data }">
  {{ data }}
</template>

<!-- 或者解构 -->
<template #header="slotProps">
  {{ slotProps.data }}
</template>
```

### 动态插槽名

```vue
<base-layout>
  <template v-slot:[dynamicSlotName]>
    ...
  </template>

  <!-- 简写 -->
  <template #[dynamicSlotName]>
    ...
  </template>
</base-layout>
```

---

## 🚫 移除的特性

### 1. filter

```javascript
// Vue 2
{{ message | capitalize }}

// Vue 3 - 使用 computed 或方法
{{ capitalizedMessage }}
{{ capitalize(message) }}

// 或者全局属性
app.config.globalProperties.$filters = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
```

### 2. $on, $off, $once（实例方法）

```javascript
// Vue 2
this.$on('event', handler)
this.$off('event', handler)
this.$once('event', handler)

// Vue 3 - 使用 mitt 或自定义实现
import mitt from 'mitt'
const emitter = mitt()

emitter.on('event', handler)
emitter.off('event', handler)
emitter.emit('event')
```

### 3. $children

```javascript
// Vue 2
this.$children[0].method()

// Vue 3 - 使用 refs 或 provide/inject
const childRef = ref(null)
// childRef.value.method()
```

### 4. inline-template

```html
<!-- Vue 2 -->
<my-component inline-template>
  <div>{{ msg }}</div>
</my-component>

<!-- Vue 3 - 使用插槽或普通组件 -->
```

### 5. keyCode 修饰符

```vue
<!-- Vue 2 -->
<input @keyup.13="submit">

<!-- Vue 3 -->
<input @keyup.enter="submit">
```

---

## 🔧 迁移检查清单

### 必须修改
- [ ] 使用 `createApp` 代替 `new Vue`
- [ ] 全局配置改为应用实例方法
- [ ] 移除 `Vue.set` / `Vue.delete`
- [ ] 生命周期钩子重命名（destroy -> unmount）
- [ ] 移除 filters，改用 computed 或 methods
- [ ] 移除 `$on` / `$off` / `$once`

### 推荐修改
- [ ] 使用 Composition API 替代 Options API
- [ ] 使用 `<script setup>` 语法
- [ ] 使用 ref / reactive 替代 data
- [ ] 使用 Pinia 替代 Vuex
- [ ] 使用 Vue Router 4

### 可选优化
- [ ] 使用 Teleport
- [ ] 使用 Suspense
- [ ] 使用 Fragment（多根节点）
- [ ] 使用 Emits 选项
- [ ] 使用 TypeScript

---

## 🐛 常见错误及解决方案

### 错误 1："Property 'X' was accessed during render but is not defined on instance"

```javascript
// ❌ 原因：忘记从 setup 返回
<script setup>
const count = ref(0)
// 忘记 return
</script>

// ✅ script setup 自动返回
// 或者使用普通 setup
<script>
export default {
  setup() {
    const count = ref(0)
    return { count }
  }
}
</script>
```

### 错误 2："Avoid app logic that relies on enumerating keys on a component instance"

```javascript
// ❌ 问题：遍历组件实例
Object.keys(this).forEach(key => { ... })

// ✅ 使用显式定义的数据
```

### 错误 3：模板中响应式数据不更新

```javascript
// ❌ 解构 reactive 对象
const state = reactive({ count: 0 })
const { count } = state  // 失去响应式

// ✅ 使用 toRefs
const { count } = toRefs(state)
// 或者
const state = reactive({ count: ref(0) })
const { count } = state  // 保持响应式
```

### 错误 4：watch 不触发

```javascript
// ❌ 监听 reactive 对象属性
const state = reactive({ count: 0 })
watch(state.count, () => { ... })  // 监听的是值 0

// ✅ 使用 getter
watch(() => state.count, () => { ... })
```

---

**记住这些区别和陷阱，Vue 3 开发更顺畅！** 🚀
