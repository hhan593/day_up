# Vue 3 事件、表单、插槽与 Provide/Inject

> 来源：Vue 官方文档
> - Event Handling（https://vuejs.org/guide/essentials/event-handling）
> - Form Input Bindings（https://vuejs.org/guide/essentials/forms）
> - Component Slots（https://vuejs.org/guide/components/slots）
> - Provide / Inject（https://vuejs.org/guide/components/provide-inject）
> 版本：Vue 3

---

## 一、事件处理（Event Handling）

### v-on 简写 @
- 内联处理器：`<button @click="count++">Add</button>`
- 方法处理器：`<button @click="greet">Greet</button>`（自动接收原生 Event）
- 传参 + 原生事件：`<button @click="warn('msg', $event)">` 或内联箭头函数

### 事件修饰符（重点）
| 修饰符 | 作用 |
|---|---|
| `.stop` | `event.stopPropagation()` |
| `.prevent` | `event.preventDefault()` |
| `.self` | 仅自身触发 |
| `.capture` | 捕获模式 |
| `.once` | 最多一次 |
| `.passive` | 不阻止默认（提升滚动性能，不可与 .prevent 同用） |

```html
<form @submit.prevent="onSubmit"></form>
<a @click.stop.prevent="doThat"></a>
```
> 顺序注意：`@click.prevent.self` 阻止元素及子元素默认；`@click.self.prevent` 仅元素自身。

### 按键修饰符
`.enter`/`.tab`/`.delete`/`.esc`/`.space`/`.up`/`.down`/`.left`/`.right`；系统键 `.ctrl`/`.alt`/`.shift`/`.meta`；`.exact` 精确组合；鼠标 `.left`/`.right`/`.middle`。

---

## 二、表单输入绑定（v-model）

`v-model` 自动展开：文本→`value`+`input`；checkbox/radio→`checked`+`change`；select→`value`+`change`。

### 各类用法
```html
<input v-model="message" />              <!-- 文本 -->
<textarea v-model="message"></textarea>   <!-- 多行（不能用插值） -->
<input type="checkbox" v-model="checked" />  <!-- 单布尔 -->
<input type="checkbox" value="Jack" v-model="checkedNames" /> <!-- 多绑定数组 -->
<input type="radio" value="One" v-model="picked" />           <!-- 单选 -->
<select v-model="selected"><option>A</option></select>        <!-- 下拉 -->
```

### 修饰符
- `.lazy`：改 `change` 事件同步（而非 input）
- `.number`：自动转数字（type=number 自动应用）
- `.trim`：去首尾空白

### 值绑定
复选框 `:true-value`/`:false-value`、单选/选项 `:value` 绑定动态或非字符串值。

---

## 三、插槽（Slots）

### 默认 / 具名
```vue
<button><slot>Submit</slot></button>      <!-- 默认插槽 + 回退 -->
<slot name="header"></slot>               <!-- 具名 -->
<BaseLayout>
  <template #header><h1>标题</h1></template>
  <template #default><p>主内容</p></template>
</BaseLayout>
```

### 作用域插槽（子传父）
```vue
<!-- 子 -->
<slot text="hello" :count="1" />
<!-- 父 -->
<ChildComponent v-slot="{ text, count }">{{ text }} {{ count }}</ChildComponent>
```
- 典型：无渲染组件 `<MouseTracker v-slot="{ x, y }">`。

### 动态插槽名
`<template #[dynamicSlotName]>`

---

## 四、Provide / Inject（跨层级传值）

解决 prop drilling：祖先 `provide`，任意后代 `inject`。

```vue
<!-- 提供方 -->
<script setup>
import { provide, ref } from 'vue'
const count = ref(0)
function update() { count.value++ }
provide('key', { count, update }) // 提供 ref 保持响应式
</script>
<!-- 注入方 -->
<script setup>
import { inject } from 'vue'
const { count, update } = inject('key')
// 默认值：inject('key', 'default')
</script>
```

### 要点
- 注入方修改应调用提供方暴露的函数（状态与逻辑同处）；
- `readonly(count)` 可防止注入方修改；
- 大型项目用 `Symbol` 作 key 避免冲突（`export const myKey = Symbol()`）；
- `app.provide('key', val)` 应用级全局提供。

---

## 小结（Recap）

- 事件修饰符 `.stop/.prevent/.once`；按键/系统键修饰符；
- v-model 自动展开 + `.lazy/.number/.trim`；
- 插槽 `#name` + 作用域插槽 props；
- provide/inject 跨层级，Symbol key 防冲突。

---

## 衔接

- 响应式/计算：`04`、`06`
- 组件 props：`08-components-props-events.md`
- 与 React 对比：插槽≈children/React.Children、provide/inject≈Context、v-model≈受控组件
