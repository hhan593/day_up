# Vue 3 零基础学习路线图

> 从 Vue 2 迁移或从零开始学习 Vue 3
> 预计学习周期：6-8 周

---

## 🎯 写给初学者

**Vue 3 是什么？**
Vue 3 是渐进式 JavaScript 框架 Vue 的最新版本，使用 TypeScript 重写，带来了更好的性能、更小的体积和更强大的组合式 API。

**Vue 3 vs Vue 2 的主要变化：**
- ✅ **Composition API** - 更灵活的代码组织方式
- ✅ **性能提升** - 更快的渲染，更小的打包体积
- ✅ **TypeScript 支持** - 更好的类型推断
- ✅ **Teleport** - 更灵活的 DOM 挂载
- ✅ **Suspense** - 异步组件加载

**学习 Vue 3 需要什么基础？**
- ✅ HTML、CSS、JavaScript 基础
- ✅ ES6+ 语法（箭头函数、解构、Promise 等）
- ✅ 了解 TypeScript 更佳（非必须）

---

## 📍 学习路线图概览

```
阶段一：Vue 3 基础（第 1-2 周）
    ├── 项目创建与配置
    ├── 模板语法
    ├── 响应式基础（ref/reactive）
    ├── 计算属性与侦听器
    └── 生命周期钩子

阶段二：Composition API（第 2-4 周）
    ├── setup 函数
    ├── 组合式函数（Composables）
    ├── 生命周期钩子
    ├── Provide/Inject
    └── 模板引用

阶段三：组件开发（第 4-5 周）
    ├── 组件通信
    ├── 插槽（Slots）
    ├── 异步组件
    ├── Teleport
    └── Suspense

阶段四：进阶与生态（第 6-8 周）
    ├── Vue Router 4
    ├── Pinia 状态管理
    ├── 动画与过渡
    ├── 自定义指令
    └── 项目实战
```

---

## 阶段一：Vue 3 基础（第 1-2 周）

### 第 1 周：认识 Vue 3

#### Day 1：创建 Vue 3 项目

**使用 create-vue（官方推荐）：**
```bash
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm run dev
```

**选项配置：**
```
✔ TypeScript? … Yes
✔ JSX Support? … No
✔ Vue Router? … Yes
✔ Pinia? … Yes
✔ Vitest? … Yes
✔ Cypress? … No
✔ ESLint? … Yes
✔ Prettier? … Yes
```

**使用 Vite：**
```bash
npm create vite@latest my-vue-app -- --template vue
cd my-vue-app
npm install
npm run dev
```

**项目结构：**
```
my-vue-app/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 组件
│   ├── App.vue          # 根组件
│   └── main.js/main.ts  # 入口文件
├── index.html
├── vite.config.js
└── package.json
```

#### Day 2：单文件组件（SFC）

**基础结构：**
```vue
<!-- App.vue -->
<template>
  <div class="app">
    <h1>{{ message }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = 'Hello Vue 3!'
const count = ref(0)

const increment = () => {
  count.value++
}
</script>

<style scoped>
.app {
  text-align: center;
  padding: 20px;
}

h1 {
  color: #42b883;
}
</style>
```

**script setup 语法：**
```vue
<script setup>
// 编译器宏，自动暴露给模板
// 无需 return，无需 components 注册
import { ref, computed } from 'vue'
import MyComponent from './MyComponent.vue'

const count = ref(0)
const double = computed(() => count.value * 2)
</script>
```

#### Day 3：响应式基础 - ref

**什么是 ref？**
```javascript
import { ref } from 'vue'

// 创建一个响应式引用
const count = ref(0)

// 访问值需要 .value
console.log(count.value)  // 0

// 修改值
count.value++

// 在模板中自动解包（不需要 .value）
// <template>
//   <div>{{ count }}</div>
// </template>
```

**ref 的不同类型：**
```javascript
import { ref } from 'vue'

// 基本类型
const num = ref(0)
const str = ref('hello')
const bool = ref(true)

// 对象（深度响应式）
const user = ref({
  name: 'Alice',
  age: 25,
  address: {
    city: 'Beijing'
  }
})

user.value.name = 'Bob'        // ✅ 响应式
user.value.address.city = 'Shanghai'  // ✅ 也是响应式的

// 数组
const list = ref([1, 2, 3])
list.value.push(4)            // ✅ 响应式
```

**ref 在模板中的解包：**
```vue
<template>
  <div>
    <!-- 自动解包，不需要 .value -->
    <p>{{ count }}</p>

    <!-- 在表达式中也自动解包 -->
    <p>{{ count + 1 }}</p>

    <!-- 访问对象属性 -->
    <p>{{ user.name }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)
const user = ref({ name: 'Alice' })
</script>
```

#### Day 4：响应式基础 - reactive

**什么是 reactive？**
```javascript
import { reactive } from 'vue'

// 只对对象有效
const state = reactive({
  count: 0,
  user: {
    name: 'Alice',
    age: 25
  }
})

// 访问和修改不需要 .value
state.count++
state.user.name = 'Bob'
```

**ref vs reactive：**
```javascript
// ref - 可以包装任何类型
const num = ref(0)
const obj = ref({ name: 'Alice' })
const arr = ref([1, 2, 3])

// reactive - 只对对象有效
const state = reactive({ count: 0 })
// const num = reactive(0)  // ❌ 错误！

// 解构会丢失响应式
const state = reactive({ x: 1, y: 2 })
const { x, y } = state  // x, y 不再是响应式的

// ref 的解决方案
const x = ref(state.x)  // ✅ 创建一个 ref
```

**选择指南：**
| 场景 | 推荐 |
|------|------|
| 基本类型（string, number, boolean）| ref |
| 对象/数组，需要整体替换 | ref |
| 复杂对象，大量属性操作 | reactive |
| 表单数据 | reactive |

#### Day 5：计算属性 computed

**基础用法：**
```vue
<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// 只读计算属性
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})

// 可写计算属性
const fullNameWritable = computed({
  get() {
    return `${firstName.value} ${lastName.value}`
  },
  set(newValue) {
    [firstName.value, lastName.value] = newValue.split(' ')
  }
})

// 使用
fullNameWritable.value = 'Jane Smith'  // 会更新 firstName 和 lastName
</script>
```

**computed vs method：**
```vue
<script setup>
import { ref, computed } from 'vue'

const items = ref([1, 2, 3, 4, 5])

// ✅ computed - 有缓存，依赖不变不会重新计算
const evenItems = computed(() => {
  console.log('computed 执行')
  return items.value.filter(item => item % 2 === 0)
})

// ❌ method - 每次渲染都执行
const getEvenItems = () => {
  console.log('method 执行')
  return items.value.filter(item => item % 2 === 0)
}
</script>
```

#### Day 6：侦听器 watch

**监听 ref：**
```javascript
import { ref, watch } from 'vue'

const count = ref(0)

// 基础用法
watch(count, (newValue, oldValue) => {
  console.log(`count 从 ${oldValue} 变为 ${newValue}`)
})

// 立即执行
watch(count, (newVal, oldVal) => {
  console.log('立即执行一次，然后监听变化')
}, { immediate: true })

// 深度监听（对对象是默认的）
const user = ref({ name: 'Alice', age: 25 })
watch(user, (newVal) => {
  console.log('user 变化:', newVal)
}, { deep: true })
```

**监听 reactive 对象的属性：**
```javascript
import { reactive, watch } from 'vue'

const state = reactive({
  name: 'Alice',
  age: 25
})

// 监听整个对象
watch(state, (newVal) => {
  console.log('state 变化:', newVal)
})

// 监听单个属性（需要用 getter 函数）
watch(() => state.name, (newVal, oldVal) => {
  console.log(`name 从 ${oldVal} 变为 ${newVal}`)
})

// 监听多个源
watch([() => state.name, () => state.age], ([newName, newAge], [oldName, oldAge]) => {
  console.log('name 或 age 变化')
})
```

**watchEffect：**
```javascript
import { ref, watchEffect } from 'vue'

const count = ref(0)
const user = ref({ name: 'Alice' })

// 自动追踪依赖
watchEffect(() => {
  // 依赖了 count 和 user.value.name
  console.log(`count: ${count.value}, user: ${user.value.name}`)
  // 当 count 或 user.value.name 变化时会执行
})

// 清理副作用
watchEffect((onCleanup) => {
  const timer = setInterval(() => {
    console.log(count.value)
  }, 1000)

  // 下次执行前或组件卸载时清理
  onCleanup(() => {
    clearInterval(timer)
  })
})
```

**watch vs watchEffect：**
| 特性 | watch | watchEffect |
|------|-------|-------------|
| 懒执行 | ✅ 是 | ❌ 立即执行 |
| 依赖追踪 | 手动指定 | 自动追踪 |
| 获取旧值 | ✅ 可以 | ❌ 不可以 |
| 使用场景 | 特定数据变化时 | 相关数据变化时自动执行 |

#### Day 7：阶段练习

**项目：计数器应用**

功能：
- [ ] 基本计数功能（+1, -1, 重置）
- [ ] 使用 computed 显示双倍值
- [ ] 使用 watch 监听数值变化并保存到 localStorage
- [ ] 设置最大值和最小值限制

---

### 第 2 周：模板语法与生命周期

#### Day 8：模板语法详解

**文本插值：**
```vue
<template>
  <div>
    <!-- 基本插值 -->
    <span>{{ message }}</span>

    <!-- JavaScript 表达式 -->
    <span>{{ count + 1 }}</span>
    <span>{{ ok ? 'YES' : 'NO' }}</span>
    <span>{{ message.split('').reverse().join('') }}</span>

    <!-- 原始 HTML（慎用，防止 XSS） -->
    <div v-html="rawHtml"></div>

    <!-- v-bind 绑定属性 -->
    <img :src="imageSrc" :alt="description">
    <div :class="{ active: isActive, 'text-danger': hasError }"></div>
    <div :style="{ color: activeColor, fontSize: fontSize + 'px' }"></div>
  </div>
</template>
```

**条件渲染：**
```vue
<template>
  <div>
    <!-- v-if（条件为 false 时不渲染） -->
    <div v-if="type === 'A'">A</div>
    <div v-else-if="type === 'B'">B</div>
    <div v-else>Other</div>

    <!-- v-show（通过 CSS display 切换） -->
    <div v-show="isVisible">始终渲染，只是隐藏</div>

    <!-- v-for 列表渲染 -->
    <ul>
      <li v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>

    <!-- v-for 带索引 -->
    <ul>
      <li v-for="(item, index) in items" :key="item.id">
        {{ index }} - {{ item.name }}
      </li>
    </ul>

    <!-- v-for 遍历对象 -->
    <ul>
      <li v-for="(value, key, index) in user" :key="key">
        {{ index }}. {{ key }}: {{ value }}
      </li>
    </ul>

    <!-- v-for 范围 -->
    <span v-for="n in 10" :key="n">{{ n }}</span>
  </div>
</template>
```

**事件处理：**
```vue
<template>
  <div>
    <!-- 内联事件 -->
    <button @click="count++">+1</button>

    <!-- 方法处理 -->
    <button @click="handleClick">点击</button>

    <!-- 带参数 -->
    <button @click="handleClick('hello')">传参</button>

    <!-- 访问事件对象 -->
    <button @click="handleClick($event)">访问事件</button>

    <!-- 事件修饰符 -->
    <a @click.stop="handleClick">阻止冒泡</a>
    <a @click.prevent="handleClick">阻止默认</a>
    <a @click.stop.prevent="handleClick">阻止冒泡和默认</a>
    <input @keyup.enter="submit">
    <input @keyup.esc="cancel">

    <!-- 按键别名 -->
    <input @keydown.ctrl.enter="submit">
    <div @click.self="handleClick">只有点击自己才触发</div>
    <button @click.once="handleClick">只触发一次</button>
  </div>
</template>

<script setup>
const handleClick = (msg) => {
  console.log('clicked', msg)
}

const submit = () => {
  console.log('submitted')
}
</script>
```

**表单绑定 v-model：**
```vue
<template>
  <div>
    <!-- 文本 -->
    <input v-model="message" placeholder="输入">

    <!-- 多行文本 -->
    <textarea v-model="description"></textarea>

    <!-- 复选框 -->
    <input type="checkbox" v-model="checked">

    <!-- 多个复选框 -->
    <input type="checkbox" v-model="selectedNames" value="Alice">
    <input type="checkbox" v-model="selectedNames" value="Bob">

    <!-- 单选按钮 -->
    <input type="radio" v-model="picked" value="One">
    <input type="radio" v-model="picked" value="Two">

    <!-- 选择器 -->
    <select v-model="selected">
      <option disabled value="">请选择</option>
      <option>A</option>
      <option>B</option>
    </select>

    <!-- 多选 -->
    <select v-model="selectedMultiple" multiple>
      <option>A</option>
      <option>B</option>
      <option>C</option>
    </select>

    <!-- 修饰符 -->
    <input v-model.lazy="msg">        <!-- 懒加载，失去焦点更新 -->
    <input v-model.number="age">      <!-- 转为数字 -->
    <input v-model.trim="name">       <!-- 去除首尾空格 -->
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('')
const description = ref('')
const checked = ref(false)
const selectedNames = ref([])
const picked = ref('')
const selected = ref('')
const selectedMultiple = ref([])
const msg = ref('')
const age = ref(0)
const name = ref('')
</script>
```

#### Day 9：生命周期钩子

**Options API 生命周期：**
```javascript
export default {
  beforeCreate() {},
  created() {},
  beforeMount() {},
  mounted() {},
  beforeUpdate() {},
  updated() {},
  beforeUnmount() {},
  unmounted() {},

  // Vue 3 新增
  activated() {},      // keep-alive 激活
  deactivated() {},    // keep-alive 停用
  errorCaptured() {}   // 错误捕获
}
```

**Composition API 生命周期：**
```vue
<script setup>
import {
  onBeforeMount,
  onMounted,
  onBeforeUpdate,
  onUpdated,
  onBeforeUnmount,
  onUnmounted,
  onActivated,
  onDeactivated,
  onErrorCaptured
} from 'vue'

// 挂载前
onBeforeMount(() => {
  console.log('组件即将挂载')
})

// 挂载完成（可以访问 DOM）
onMounted(() => {
  console.log('组件已挂载')
  // 初始化图表、获取数据等
})

// 更新前
onBeforeUpdate(() => {
  console.log('组件即将更新')
})

// 更新完成
onUpdated(() => {
  console.log('组件已更新')
})

// 卸载前
onBeforeUnmount(() => {
  console.log('组件即将卸载')
  // 清理定时器、事件监听等
})

// 卸载完成
onUnmounted(() => {
  console.log('组件已卸载')
})

// 错误捕获
onErrorCaptured((err, instance, info) => {
  console.error('捕获到错误:', err)
  // 返回 false 阻止错误继续传播
  return false
})
</script>
```

**生命周期对应关系：**
| Options API | Composition API |
|------------|-----------------|
| beforeCreate | setup() |
| created | setup() |
| beforeMount | onBeforeMount |
| mounted | onMounted |
| beforeUpdate | onBeforeUpdate |
| updated | onUpdated |
| beforeUnmount | onBeforeUnmount |
| unmounted | onUnmounted |
| errorCaptured | onErrorCaptured |

#### Day 10：模板引用

**基础用法：**
```vue
<template>
  <div>
    <!-- DOM 元素引用 -->
    <input ref="inputRef" />
    <button @click="focusInput">聚焦</button>

    <!-- 组件引用 -->
    <ChildComponent ref="childRef" />
    <button @click="callChildMethod">调用子组件方法</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ChildComponent from './ChildComponent.vue'

// DOM 引用
const inputRef = ref(null)

// 组件引用（需要定义 expose）
const childRef = ref(null)

const focusInput = () => {
  inputRef.value?.focus()
}

const callChildMethod = () => {
  // 只能访问 expose 暴露的内容
  childRef.value?.someMethod()
}

onMounted(() => {
  // 确保 DOM 已渲染
  console.log(inputRef.value)
})
</script>
```

**子组件暴露方法：**
```vue
<!-- ChildComponent.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => {
  count.value++
}

// 明确暴露给父组件的内容
defineExpose({
  count,
  increment
})
</script>
```

#### Day 11-14：阶段项目

**项目：待办事项列表（进阶版）**

功能：
- [ ] 添加/删除/编辑任务
- [ ] 标记完成状态
- [ ] 筛选（全部/未完成/已完成）
- [ ] 本地存储持久化
- [ ] 使用 computed 统计数量

---

## 阶段二：Composition API 深入（第 3-4 周）

### 第 3 周：setup 与组合式函数

#### Day 15：setup 详解

**setup 执行时机：**
```vue
<script>
// 使用 setup() 函数
export default {
  setup(props, context) {
    // props - 响应式的 props
    // context - { attrs, slots, emit, expose }

    const count = ref(0)

    const increment = () => {
      count.value++
    }

    // 返回的内容可以在模板中使用
    return {
      count,
      increment
    }
  }
}
</script>
```

**setup 参数：**
```javascript
setup(props, context) {
  // props - 是响应式的，不要解构
  console.log(props.title)

  // context 属性
  console.log(context.attrs)     // 非 props 的属性
  console.log(context.slots)     // 插槽
  console.log(context.emit)      // 触发事件
  console.log(context.expose)    // 暴露公共属性

  // 可以解构 context（它不是响应式的）
  const { attrs, slots, emit, expose } = context
}
```

**script setup 语法糖：**
```vue
<script setup>
// 等同于 setup() 函数，但更简单
// 自动返回所有顶层绑定
// 自动处理 props 和 emit

// 定义 props
const props = defineProps({
  title: String,
  count: {
    type: Number,
    default: 0
  }
})

// 定义 emit
defineEmits(['update', 'delete'])

// 访问 props
console.log(props.title)

// 触发事件
const emit = defineEmits(['update'])
const handleClick = () => {
  emit('update', 'new value')
}
</script>
```

#### Day 16：组合式函数（Composables）

**什么是 Composable？**
```javascript
// composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

// 组合式函数：封装可复用的有状态逻辑
export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event) {
    x.value = event.pageX
    y.value = event.pageY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

**使用 Composable：**
```vue
<script setup>
import { useMouse } from './composables/useMouse'

const { x, y } = useMouse()
</script>

<template>
  <div>鼠标位置: {{ x }}, {{ y }}</div>
</template>
```

**常用 Composables 示例：**

```javascript
// useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  const data = ref(stored ? JSON.parse(stored) : defaultValue)

  watch(data, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return data
}

// useFetch.js
import { ref, watchEffect, toValue } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  const fetchData = async () => {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(toValue(url))
      data.value = await res.json()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  watchEffect(() => {
    fetchData()
  })

  return { data, error, loading, refresh: fetchData }
}

// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const double = computed(() => count.value * 2)

  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue

  return {
    count,
    double,
    increment,
    decrement,
    reset
  }
}
```

#### Day 17：Provide / Inject

**基础用法：**
```vue
<!-- 父组件 -->
<script setup>
import { provide, ref } from 'vue'

const user = ref({
  name: 'Alice',
  age: 25
})

// 提供数据
provide('user', user)

// 提供响应式数据
provide('updateUser', (newUser) => {
  user.value = newUser
})
</script>
```

```vue
<!-- 子孙组件 -->
<script setup>
import { inject } from 'vue'

// 注入数据
const user = inject('user')

// 注入方法
const updateUser = inject('updateUser')

// 提供默认值
const theme = inject('theme', 'light')

// 使用
const handleUpdate = () => {
  updateUser({ name: 'Bob', age: 30 })
}
</script>

<template>
  <div>
    <p>{{ user.name }}</p>
    <button @click="handleUpdate">更新</button>
  </div>
</template>
```

**配合 readonly 防止子组件修改：**
```javascript
import { provide, ref, readonly } from 'vue'

const count = ref(0)

// 子组件只能读取，不能修改
provide('count', readonly(count))

// 提供修改方法
provide('updateCount', (val) => {
  count.value = val
})
```

#### Day 18-19：练习

**项目：主题切换 Composable**

- [ ] 创建 useTheme 组合式函数
- [ ] 支持 light/dark 主题切换
- [ ] 持久化到 localStorage
- [ ] 使用 Provide/Inject 全局提供

### 第 4 周：进阶特性

#### Day 20：异步组件与 Suspense

**异步组件：**
```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// 基础用法
const AsyncComp = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)

// 完整配置
const AsyncCompWithOptions = defineAsyncComponent({
  loader: () => import('./components/HeavyComponent.vue'),
  loadingComponent: LoadingComponent,    // 加载中显示
  delay: 200,                          // 延迟显示 loading
  errorComponent: ErrorComponent,      // 错误时显示
  timeout: 3000                        // 超时时间
})
</script>

<template>
  <AsyncComp />
</template>
```

**Suspense：**
```vue
<template>
  <Suspense>
    <!-- 默认内容（异步组件） -->
    <template #default>
      <AsyncDashboard />
    </template>

    <!-- 加载状态 -->
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'

const AsyncDashboard = defineAsyncComponent(() =>
  import('./Dashboard.vue')
)
</script>
```

**Suspense 嵌套异步：**
```vue
<script setup>
const posts = await fetchPosts()  // 顶层 await
</script>

<template>
  <div>
    <h1>文章列表</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
    </ul>
  </div>
</template>
```

#### Day 21：Teleport

**基础用法：**
```vue
<template>
  <div class="modal-container">
    <!-- 将内容传送到 body 末尾 -->
    <Teleport to="body">
      <div class="modal" v-if="showModal">
        <h2>模态框标题</h2>
        <p>模态框内容</p>
        <button @click="showModal = false">关闭</button>
      </div>
    </Teleport>

    <button @click="showModal = true">打开模态框</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showModal = ref(false)
</script>
```

**多个 Teleport 共享目标：**
```vue
<!-- 可以传送到同一个目标 -->
<Teleport to="#modals">
  <div>模态框 1</div>
</Teleport>

<Teleport to="#modals">
  <div>模态框 2</div>
</Teleport>

<!-- 在 index.html 中 -->
<!-- <div id="modals"></div> -->
```

#### Day 22：nextTick

```javascript
import { nextTick, ref } from 'vue'

const count = ref(0)
const message = ref('')

const increment = async () => {
  count.value++

  // DOM 还未更新
  console.log('同步获取:', document.getElementById('count').textContent)

  // 等待 DOM 更新
  await nextTick()

  // DOM 已更新
  console.log('nextTick 后:', document.getElementById('count').textContent)
}
```

#### Day 23-28：综合练习

**项目：用户管理系统**

功能：
- [ ] 用户列表（表格展示）
- [ ] 添加/编辑用户（模态框 + Teleport）
- [ ] 删除确认
- [ ] 加载状态（Suspense）
- [ ] 使用 Composables 封装数据获取

---

## 阶段三：组件开发（第 5-6 周）

### 第 5 周：组件通信与插槽

#### Day 29：Props 与 Emits

**defineProps：**
```vue
<script setup>
// 运行时声明
const props = defineProps({
  title: String,
  count: {
    type: Number,
    default: 0
  },
  user: {
    type: Object,
    required: true,
    validator(value) {
      return value.name && value.age
    }
  }
})

// 基于类型的声明（使用 TS）
const props = defineProps<{
  title: string
  count?: number
  user: {
    name: string
    age: number
  }
}>()

// 带默认值
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

**defineEmits：**
```vue
<script setup>
// 运行时声明
const emit = defineEmits(['update', 'delete'])

// 基于类型的声明
const emit = defineEmits<{
  update: [id: number, value: string]
  delete: [id: number]
}>()

// 使用
const handleUpdate = () => {
  emit('update', 1, 'new value')
}
</script>
```

#### Day 30：组件通信方式

**Props Down, Events Up：**
```vue
<!-- 父组件 -->
<template>
  <Child
    :user="user"
    @update-user="handleUpdate"
  />
</template>

<!-- 子组件 -->
<script setup>
defineProps(['user'])
const emit = defineEmits(['update-user'])

const update = () => {
  emit('update-user', { name: 'Bob' })
}
</script>
```

**v-model 多个绑定：**
```vue
<!-- 父组件 -->
<template>
  <UserForm
    v-model:name="user.name"
    v-model:email="user.email"
    v-model:age="user.age"
  />
</template>

<!-- 子组件 -->
<script setup>
defineProps({
  name: String,
  email: String,
  age: Number
})

const emit = defineEmits(['update:name', 'update:email', 'update:age'])
</script>

<template>
  <input
    :value="name"
    @input="$emit('update:name', $event.target.value)"
  />
  <input
    :value="email"
    @input="$emit('update:email', $event.target.value)"
  />
  <input
    type="number"
    :value="age"
    @input="$emit('update:age', Number($event.target.value))"
  />
</template>
```

**使用 ref 直接访问子组件（谨慎使用）：**
```vue
<!-- 父组件 -->
<script setup>
import { ref } from 'vue'
import Child from './Child.vue'

const childRef = ref(null)

const callChild = () => {
  childRef.value?.someMethod()
}
</script>

<template>
  <Child ref="childRef" />
</template>

<!-- 子组件 -->
<script setup>
const someMethod = () => {
  console.log('子组件方法被调用')
}

defineExpose({
  someMethod
})
</script>
```

#### Day 31：插槽（Slots）

**基础插槽：**
```vue
<!-- 子组件 Button.vue -->
<template>
  <button class="btn">
    <slot>默认文本</slot>
  </button>
</template>

<!-- 父组件 -->
<template>
  <Button>点击我</Button>
  <Button />  <!-- 显示默认文本 -->
</template>
```

**具名插槽：**
```vue
<!-- 子组件 Card.vue -->
<template>
  <div class="card">
    <header v-if="$slots.header">
      <slot name="header" />
    </header>

    <main>
      <slot />
    </main>

    <footer v-if="$slots.footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<!-- 父组件 -->
<template>
  <Card>
    <template #header>
      <h2>标题</h2>
    </template>

    <p>主要内容</p>

    <template #footer>
      <button>确认</button>
    </template>
  </Card>
</template>
```

**作用域插槽：**
```vue
<!-- 子组件 List.vue -->
<template>
  <ul>
    <li v-for="item in items" :key="item.id">
      <slot :item="item" :index="index" />
    </li>
  </ul>
</template>

<script setup>
defineProps(['items'])
</script>

<!-- 父组件 -->
<template>
  <List :items="users" v-slot="{ item, index }">
    {{ index + 1 }}. {{ item.name }} - {{ item.age }}岁
  </List>

  <!-- 解构写法 -->
  <List :items="users">
    <template #default="{ item, index }">
      {{ index + 1 }}. {{ item.name }}
    </template>
  </List>
</template>
```

#### Day 32：动态组件与 KeepAlive

**动态组件：**
```vue
<template>
  <component :is="currentComponent" />

  <button @click="currentComponent = 'ComponentA'">A</button>
  <button @click="currentComponent = 'ComponentB'">B</button>
</template>

<script setup>
import { ref, shallowRef } from 'vue'
import ComponentA from './ComponentA.vue'
import ComponentB from './ComponentB.vue'

// 使用 shallowRef 避免不必要的响应式转换
const currentComponent = shallowRef(ComponentA)
</script>
```

**KeepAlive：**
```vue
<template>
  <KeepAlive>
    <component :is="currentTab" />
  </KeepAlive>
</template>
```

**KeepAlive 配置：**
```vue
<KeepAlive :include="['TabA', 'TabB']" :exclude="['TabC']" :max="10">
  <component :is="currentTab" />
</KeepAlive>

<!-- 使用正则（需要 v-bind） -->
<KeepAlive :include="/Tab[A-B]/">
  <component :is="currentTab" />
</KeepAlive>
```

**KeepAlive 生命周期：**
```vue
<script setup>
import { onActivated, onDeactivated } from 'vue'

// 组件被激活时
onActivated(() => {
  console.log('组件激活')
  // 恢复滚动位置、重新获取数据等
})

// 组件被停用时
onDeactivated(() => {
  console.log('组件停用')
  // 保存状态等
})
</script>
```

#### Day 33-35：阶段项目

**项目：标签页组件**

功能：
- [ ] Tabs 和 TabPane 组件
- [ ] 使用具名插槽
- [ ] 使用 KeepAlive 缓存
- [ ] 切换动画

---

### 第 6 周：高级组件模式

#### Day 36：渲染函数与 JSX

**h() 函数：**
```javascript
import { h, ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    return () => h('div', [
      h('h1', 'Hello'),
      h('button', {
        onClick: () => count.value++
      }, `Count: ${count.value}`)
    ])
  }
}
```

**使用 JSX：**
```jsx
import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)

    return () => (
      <div>
        <h1>Hello</h1>
        <button onClick={() => count.value++}>
          Count: {count.value}
        </button>
      </div>
    )
  }
}
```

**渲染函数中的插槽：**
```javascript
export default {
  setup(props, { slots }) {
    return () => h('div', [
      slots.header?.(),
      slots.default?.(),
      slots.footer?.()
    ])
  }
}
```

#### Day 37：自定义指令

**全局注册：**
```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

app.mount('#app')
```

**局部注册：**
```vue
<script setup>
const vHighlight = {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value || 'yellow'
  },
  updated(el, binding) {
    el.style.backgroundColor = binding.value || 'yellow'
  }
}
</script>

<template>
  <p v-highlight="'lightblue'">高亮文本</p>
</template>
```

**指令钩子：**
```javascript
const myDirective = {
  // 在绑定元素的 attribute 前调用
  created(el, binding, vnode, prevVnode) {},
  // 在元素被插入到 DOM 前调用
  beforeMount(el, binding, vnode, prevVnode) {},
  // 在绑定元素的父组件挂载前调用
  mounted(el, binding, vnode, prevVnode) {},
  // 在更新包含组件的 VNode 前调用
  beforeUpdate(el, binding, vnode, prevVnode) {},
  // 在包含组件的 VNode 及其子组件的 VNode 更新后调用
  updated(el, binding, vnode, prevVnode) {},
  // 在绑定元素的父组件卸载前调用
  beforeUnmount(el, binding, vnode, prevVnode) {},
  // 卸载绑定元素的父组件时调用
  unmounted(el, binding, vnode, prevVnode) {}
}
```

**指令参数：**
```vue
<template>
  <!-- 参数 -->
  <div v-my-directive:foo="bar"></div>

  <!-- 修饰符 -->
  <div v-my-directive.foo.bar="baz"></div>

  <!-- 值、参数、修饰符 -->
  <div v-my-directive:arg.mod1.mod2="value"></div>
</template>

<script setup>
const vMyDirective = {
  mounted(el, binding) {
    console.log(binding.value)  // 值
    console.log(binding.arg)    // 参数
    console.log(binding.modifiers)  // 修饰符对象 { mod1: true, mod2: true }
  }
}
</script>
```

#### Day 38-42：动画与过渡

**Transition 组件：**
```vue
<template>
  <Transition>
    <p v-if="show">Hello</p>
  </Transition>

  <!-- 命名过渡 -->
  <Transition name="fade">
    <p v-if="show">Hello</p>
  </Transition>

  <!-- 自定义过渡类 -->
  <Transition
    enter-active-class="animate__animated animate__bounceIn"
    leave-active-class="animate__animated animate__bounceOut"
  >
    <p v-if="show">Hello</p>
  </Transition>
</template>

<style>
/* 命名过渡的类 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

**TransitionGroup：**
```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </TransitionGroup>
</template>

<style>
.list-move, /* 移动动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 确保离开的元素被移除 */
.list-leave-active {
  position: absolute;
}
</style>
```

---

## 阶段四：生态与实战（第 7-8 周）

### 第 7 周：Vue Router 4

#### Day 43：路由基础

**创建路由：**
```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/user/:id',
    name: 'User',
    component: () => import('../views/User.vue'),
    children: [
      {
        path: 'profile',
        component: () => import('../views/UserProfile.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
```

**使用路由：**
```vue
<!-- 在 main.js 中注册 -->
<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()    // 当前路由信息
const router = useRouter()  // 路由实例

// 获取参数
console.log(route.params.id)
console.log(route.query.search)

// 导航
const goToUser = () => {
  router.push('/user/123')
  // 或
  router.push({ name: 'User', params: { id: 123 } })
  // 或
  router.replace('/home')  // 替换当前历史
}

// 后退
router.back()
router.go(-1)
</script>

<template>
  <!-- 声明式导航 -->
  <router-link to="/">首页</router-link>
  <router-link :to="{ name: 'User', params: { id: 123 } }">用户</router-link>

  <!-- 激活样式 -->
  <router-link to="/" active-class="active">首页</router-link>
  <router-link to="/" custom v-slot="{ navigate, isActive }">
    <button @click="navigate" :class="{ active: isActive }">首页</button>
  </router-link>

  <!-- 路由视图 -->
  <router-view />

  <!-- 命名视图 -->
  <router-view name="sidebar" />
  <router-view name="main" />
</template>
```

#### Day 44：导航守卫

**全局守卫：**
```javascript
// router/index.js
import { createRouter } from 'vue-router'

const router = createRouter({ ... })

// 前置守卫
router.beforeEach((to, from, next) => {
  // 认证检查
  const isAuthenticated = localStorage.getItem('token')

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  next()
})

// 后置钩子
router.afterEach((to, from) => {
  // 修改页面标题
  document.title = to.meta.title || 'My App'
})

// 错误处理
router.onError((err) => {
  console.error('路由错误:', err)
})
```

**路由独享守卫：**
```javascript
{
  path: '/admin',
  component: Admin,
  beforeEnter: (to, from, next) => {
    // 检查权限
    if (!isAdmin()) {
      return next({ name: 'Forbidden' })
    }
    next()
  }
}
```

**组件内守卫：**
```vue
<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// 离开路由前
onBeforeRouteLeave((to, from) => {
  const answer = window.confirm('确定要离开吗？有未保存的更改。')
  if (!answer) return false  // 取消导航
})

// 当前路由更新时（参数变化）
onBeforeRouteUpdate((to, from) => {
  // 复用组件时响应参数变化
  userData.value = fetchUser(to.params.id)
})
</script>
```

### 第 8 周：Pinia 状态管理

#### Day 45：Pinia 基础

**创建 Store：**
```javascript
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Option Store（类似 Vuex）
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
    doublePlusOne() {
      return this.doubleCount + 1
    }
  },
  actions: {
    increment() {
      this.count++
    },
    async fetchUser() {
      const res = await fetch('/api/user')
      this.name = await res.json()
    }
  }
})

// Setup Store（推荐）
export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)
  const name = ref('Counter')

  // Getters
  const doubleCount = computed(() => count.value * 2)

  // Actions
  const increment = () => {
    count.value++
  }

  const fetchUser = async () => {
    const res = await fetch('/api/user')
    name.value = await res.json()
  }

  return { count, name, doubleCount, increment, fetchUser }
})
```

**使用 Store：**
```vue
<script setup>
import { useCounterStore } from '@/stores/counter'
import { storeToRefs } from 'pinia'

const store = useCounterStore()

// 解构会失去响应式，需要使用 storeToRefs
const { count, doubleCount } = storeToRefs(store)
const { increment } = store

// 直接访问
console.log(store.count)

// 修改状态
store.count++
store.$patch({ count: store.count + 1 })
store.$patch((state) => {
  state.count++
  state.name = 'New Name'
})

// 重置
store.$reset()

// 订阅
store.$subscribe((mutation, state) => {
  console.log('状态变化:', mutation, state)
})
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Double: {{ doubleCount }}</p>
    <button @click="increment">+1</button>
  </div>
</template>
```

**多 Store 组合：**
```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { useCartStore } from './cart'

export const useUserStore = defineStore('user', () => {
  const cart = useCartStore()

  const purchase = () => {
    // 访问其他 store
    cart.checkout()
  }

  return { purchase }
})
```

#### Day 46-56：项目实战

**推荐项目：电商平台**

技术栈：
- Vue 3 + TypeScript
- Vue Router 4
- Pinia
- Element Plus / Ant Design Vue
- Axios

功能模块：
1. **用户模块**
   - 登录/注册
   - 个人中心
   - 地址管理

2. **商品模块**
   - 商品列表（筛选、排序、分页）
   - 商品详情
   - 分类浏览

3. **购物车**
   - 添加/删除商品
   - 数量修改
   - 价格计算

4. **订单模块**
   - 订单确认
   - 订单列表
   - 订单详情

5. **其他**
   - 搜索功能
   - 收藏功能
   - 优惠券

---

## 📋 学习检查清单

### 基础
- [ ] 会使用 create-vue 创建项目
- [ ] 理解 ref 和 reactive 的区别
- [ ] 会使用 computed
- [ ] 会使用 watch 和 watchEffect
- [ ] 掌握生命周期钩子

### Composition API
- [ ] 理解 setup 函数
- [ ] 会编写 Composables
- [ ] 会使用 Provide/Inject
- [ ] 会使用 Suspense 和 Teleport

### 组件开发
- [ ] 掌握 Props/Emits
- [ ] 会使用各种插槽
- [ ] 会使用 KeepAlive
- [ ] 会编写自定义指令

### 生态
- [ ] 掌握 Vue Router 4
- [ ] 掌握 Pinia
- [ ] 会处理动画过渡

---

## 💡 学习建议

### 1. 从 Options API 迁移到 Composition API
- 先理解 Options API 的概念
- 再学习 Composition API 的等价写法
- 最后掌握 Composables 的抽象

### 2. 善用官方文档
- Vue 3 文档非常完善
- 使用交互式教程

### 3. 实践 Composables
- 这是 Vue 3 的核心优势
- 多练习提取可复用逻辑

### 4. 类型安全
- 使用 TypeScript
- 善用类型推断

---

## 📚 推荐资源

### 官方资源
- [Vue 3 官方文档](https://vuejs.org/)
- [Vue Router 文档](https://router.vuejs.org/)
- [Pinia 文档](https://pinia.vuejs.org/)

### 工具
- [Vue DevTools](https://devtools.vuejs.org/)
- [VueUse](https://vueuse.org/) - 常用 Composables 集合

---

**Vue 3 让前端开发更加灵活和高效，祝你学习愉快！** 🚀
