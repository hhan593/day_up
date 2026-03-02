# Vue 3 开发技巧与最佳实践

> 提升 Vue 3 开发效率的实用技巧

---

## 🛠️ 开发技巧

### 1. 组合式函数（Composables）最佳实践

**命名规范：**
```javascript
// 使用 use 前缀
useMouse()           // ✅
useLocalStorage()    // ✅
useFetch()           // ✅

getUser()            // ❌ 不符合规范
fetchData()          // ❌ 不符合规范
```

**参数设计：**
```javascript
// 使用对象参数（便于扩展）
export function useFetch(url, options = {}) {
  const {
    method = 'GET',
    immediate = true,
    initialData = null
  } = options

  // ...
}

// 使用
useFetch('/api/user', {
  method: 'POST',
  immediate: false
})
```

**返回值设计：**
```javascript
// 返回对象，便于解构
export function useCounter(initial = 0) {
  const count = ref(initial)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initial

  return {
    count: readonly(count),  // 防止外部直接修改
    increment,
    decrement,
    reset
  }
}
```

### 2. 响应式优化

**避免深层响应式（性能优化）：**
```javascript
import { shallowRef, shallowReactive } from 'vue'

// 大型列表不需要深层响应式
const largeList = shallowRef([
  { id: 1, name: 'Item 1', /* ...很多属性 */ },
  { id: 2, name: 'Item 2', /* ...很多属性 */ }
])

// 修改整个对象会触发更新
largeList.value = newList  // ✅

// 修改内部属性不会触发
largeList.value[0].name = 'New Name'  // ❌ 不会触发更新

// 需要时手动触发
largeList.value = [...largeList.value]  // ✅
```

**使用 toRaw 处理原始数据：**
```javascript
import { reactive, toRaw } from 'vue'

const state = reactive({ name: 'Alice', items: [1, 2, 3] })

// 发送给 API 时不需要响应式
fetch('/api/user', {
  method: 'POST',
  body: JSON.stringify(toRaw(state))
})
```

### 3. 类型安全技巧（TypeScript）

**为 Props 添加类型：**
```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
  callback?: (id: number) => void
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

**为 Emits 添加类型：**
```vue
<script setup lang="ts">
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number, confirm: boolean]
}>()

// 使用时有类型提示
emit('update', 'new value')     // ✅
emit('update', 123)             // ❌ 类型错误
</script>
```

**为 Ref 添加类型：**
```typescript
import { ref } from 'vue'

interface User {
  id: number
  name: string
  email: string
}

// 初始为 null
const user = ref<User | null>(null)

// 初始有值
const count = ref<number>(0)

// 数组
const users = ref<User[]>([])
```

**为 Provide/Inject 添加类型：**
```typescript
// types.ts
import { InjectionKey, Ref } from 'vue'

export interface Theme {
  color: string
  size: 'small' | 'medium' | 'large'
}

export const ThemeKey: InjectionKey<Ref<Theme>> = Symbol('theme')

// provider
import { provide, ref } from 'vue'
import { ThemeKey, type Theme } from './types'

const theme = ref<Theme>({ color: '#333', size: 'medium' })
provide(ThemeKey, theme)

// injector
import { inject } from 'vue'
import { ThemeKey } from './types'

const theme = inject(ThemeKey, ref({ color: '#000', size: 'small' }))
```

### 4. 组件通信技巧

**v-model 多个值简化：**
```vue
<!-- 父组件 -->
<template>
  <UserForm v-bind="userForm" @update="updateField" />
</template>

<script setup>
import { reactive } from 'vue'

const userForm = reactive({
  name: '',
  email: '',
  age: 0
})

const updateField = (field, value) => {
  userForm[field] = value
}
</script>

<!-- 子组件 -->
<template>
  <input
    v-for="(value, key) in modelValue"
    :key="key"
    :value="value"
    @input="$emit('update', key, $event.target.value)"
  />
</template>

<script setup>
defineProps(['modelValue'])
defineEmits(['update'])
</script>
```

**使用 mitt 进行事件总线：**
```javascript
// utils/eventBus.js
import mitt from 'mitt'

const emitter = mitt()

export default emitter

// 使用
import emitter from '@/utils/eventBus'

// 发送
emitter.emit('user:login', { name: 'Alice' })

// 监听
emitter.on('user:login', (user) => {
  console.log(user.name)
})

// 取消监听
emitter.off('user:login', handler)

// 全部取消
emitter.all.clear()
```

### 5. 性能优化技巧

**v-once 和 v-memo：**
```vue
<template>
  <!-- 只渲染一次，不再更新 -->
  <div v-once>
    {{ heavyComputation() }}
  </div>

  <!-- 条件满足时才重新渲染 -->
  <div v-memo="[user.name, user.age]">
    <!-- 只有 name 或 age 变化时才更新 -->
    <p>{{ user.name }} - {{ user.age }}</p>
    <p>{{ user.description }}</p>  <!-- 这个变化不会触发重新渲染 -->
  </div>
</template>
```

**虚拟列表（大量数据）：**
```vue
<template>
  <RecycleScroller
    class="scroller"
    :items="list"
    :item-size="32"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="user">
      {{ item.name }}
    </div>
  </RecycleScroller>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
</script>
```

**函数式组件（简单展示）：**
```javascript
// FunctionalComponent.js
export default {
  functional: true,
  props: ['name', 'avatar'],
  render(props) {
    return h('div', { class: 'user' }, [
      h('img', { src: props.avatar }),
      h('span', props.name)
    ])
  }
}
```

**异步组件 + 加载状态：**
```vue
<script setup>
import { defineAsyncComponent } from 'vue'
import Loading from './Loading.vue'
import Error from './Error.vue'

const AsyncComp = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: Loading,
  delay: 200,
  errorComponent: Error,
  timeout: 3000
})
</script>

<template>
  <AsyncComp />
</template>
```

### 6. 代码组织技巧

**按功能组织 Composables：**
```
composables/
├── useUser.js          # 用户相关
├── useCart.js          # 购物车
├── useAuth.js          # 认证
├── useLocalStorage.js  # 本地存储
└── useFetch.js         # 数据获取
```

**组合多个 Composables：**
```javascript
// composables/useUserCart.js
import { useUser } from './useUser'
import { useCart } from './useCart'

export function useUserCart() {
  const { user, isLoggedIn } = useUser()
  const { cart, addToCart } = useCart()

  // 用户专属购物车功能
  const addToUserCart = (product) => {
    if (!isLoggedIn.value) {
      throw new Error('请先登录')
    }
    addToCart(product, user.value.id)
  }

  return {
    cart,
    addToUserCart
  }
}
```

### 7. 表单处理技巧

**自动解包 v-model：**
```vue
<script setup>
const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

// 使用 computed 简化
const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <input v-model="value" />
</template>
```

**表单验证 Composable：**
```javascript
// composables/useForm.js
export function useForm(initialValues, validators) {
  const values = reactive({ ...initialValues })
  const errors = reactive({})
  const touched = reactive({})

  const validate = (field) => {
    if (validators[field]) {
      errors[field] = validators[field](values[field])
    }
  }

  const validateAll = () => {
    Object.keys(validators).forEach(validate)
    return !Object.values(errors).some(Boolean)
  }

  const handleBlur = (field) => {
    touched[field] = true
    validate(field)
  }

  return {
    values,
    errors,
    touched,
    validate,
    validateAll,
    handleBlur
  }
}

// 使用
const { values, errors, validateAll } = useForm(
  { email: '', password: '' },
  {
    email: (v) => !v.includes('@') ? '邮箱格式错误' : null,
    password: (v) => v.length < 6 ? '密码至少6位' : null
  }
)
```

### 8. 路由技巧

**路由守卫封装：**
```javascript
// router/guards.js
export function setupRouterGuards(router) {
  // 进度条
  router.beforeEach((to, from, next) => {
    NProgress.start()
    next()
  })

  // 认证检查
  router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (to.meta.guestOnly && token) {
      next({ name: 'Home' })
    } else {
      next()
    }
  })

  // 权限检查
  router.beforeEach((to, from, next) => {
    const user = useUserStore()

    if (to.meta.permissions) {
      const hasPermission = to.meta.permissions.some(
        p => user.permissions.includes(p)
      )
      if (!hasPermission) {
        next({ name: 'Forbidden' })
        return
      }
    }
    next()
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
```

**路由懒加载优化：**
```javascript
// 按模块分组
const UserRoutes = {
  path: '/user',
  component: () => import(/* webpackChunkName: "user" */ '@/views/User/index.vue'),
  children: [
    {
      path: 'profile',
      component: () => import(/* webpackChunkName: "user" */ '@/views/User/Profile.vue')
    },
    {
      path: 'settings',
      component: () => import(/* webpackChunkName: "user" */ '@/views/User/Settings.vue')
    }
  ]
}
```

### 9. 测试技巧

**测试 Composables：**
```javascript
import { describe, it, expect } from 'vitest'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('should increment', () => {
    const { count, increment } = useCounter()
    expect(count.value).toBe(0)
    increment()
    expect(count.value).toBe(1)
  })

  it('should respect initial value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })
})
```

**组件测试：**
```javascript
import { mount } from '@vue/test-utils'
import Counter from './Counter.vue'

describe('Counter', () => {
  it('renders correctly', () => {
    const wrapper = mount(Counter, {
      props: { initial: 10 }
    })
    expect(wrapper.text()).toContain('10')
  })

  it('increments when clicked', async () => {
    const wrapper = mount(Counter)
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('1')
  })
})
```

### 10. 调试技巧

**开发环境日志：**
```javascript
// composables/useLogger.js
export function useLogger(namespace) {
  const isDev = import.meta.env.DEV

  return {
    log: (...args) => isDev && console.log(`[${namespace}]`, ...args),
    warn: (...args) => isDev && console.warn(`[${namespace}]`, ...args),
    error: (...args) => console.error(`[${namespace}]`, ...args)
  }
}

// 使用
const logger = useLogger('UserStore')

logger.log('用户登录', user)  // 开发环境显示
logger.error('登录失败', err) // 所有环境显示
```

**Vue DevTools 技巧：**
- 使用时间旅行调试状态
- 检查组件 props/emits
- 查看性能分析
- 编辑状态实时预览

---

## 🎨 代码风格指南

### 组件文件结构
```vue
<!-- 1. template -->
<template>
  <div class="component-name">
    <!-- 内容 -->
  </div>
</template>

<!-- 2. script setup -->
<script setup>
// 导入（按类型分组）
import { ref, computed } from 'vue'
import { useStore } from '@/stores'
import ChildComponent from './ChildComponent.vue'

//  props/emits
const props = defineProps({ ... })
const emit = defineEmits([...])

// 响应式数据
const count = ref(0)
const user = reactive({ name: '' })

// computed
const double = computed(() => count.value * 2)

// methods
const increment = () => { count.value++ }

// lifecycle
onMounted(() => { ... })

// watchers
watch(count, (newVal) => { ... })
</script>

<!-- 3. style scoped -->
<style scoped>
.component-name { ... }
</style>
```

### 命名规范
```javascript
// 组件名：PascalCase
UserProfile.vue          // ✅
user-profile.vue         // ❌

// 组合式函数：camelCase，use 前缀
useLocalStorage.js       // ✅
use-local-storage.js     // ❌

// Props：camelCase
defineProps({
  userName: String,      // ✅
  'user-name': String    // ❌
})

// 事件名：camelCase
emit('updateUser')       // ✅
emit('update-user')      // ❌

// 常量：SNAKE_CASE
const MAX_COUNT = 100    // ✅
const maxCount = 100     // ❌
```

---

**善用这些技巧，让 Vue 3 开发更高效！** 🚀
