# Vue 3 组件与 Props（Components & Props）

> 来源：Vue 官方文档（https://vuejs.org/guide/components/props）— Guide / Components In-Depth
> 版本：Vue 3（响应式 Props 解构为 3.5+，同名简写 3.4+）

---

## 一、Props 声明

### `<script setup>`：defineProps
```vue
<script setup>
const props = defineProps(['foo'])
console.log(props.foo)
</script>
```
### 类型 + 校验对象语法
```vue
<script setup lang="ts">
defineProps<{ title?: string; likes?: number }>()   // TS 类型
// 或
defineProps({ title: String, likes: Number })
</script>
```

---

## 二、响应式 Props 解构（3.5+）

```js
const { foo } = defineProps(['foo'])
watchEffect(() => console.log(foo)) // 3.4- 仅跑一次；3.5+ 随 foo 变化重跑
```
- 3.5+ 编译器将解构变量改写为 `props.foo`，保持响应。
- 解构声明默认值：`const { foo = 'hello' } = defineProps<{ foo?: string }>()`
- 传解构变量给 watch/组合式函数须包 getter：`watch(() => foo, ...)` 或 `useX(() => foo)`。

---

## 三、单向数据流（One-Way Data Flow）

- props 从父到子单向绑定；子**不可改** prop（否则警告）。
- 两种正确「想改 prop」场景：
```js
const props = defineProps(['initialCounter'])
const counter = ref(props.initialCounter)          // 作初始值
const normalized = computed(() => props.size.trim().toLowerCase()) // 转换用 computed
```

---

## 四、Prop 校验

```js
defineProps({
  propA: Number,
  propB: [String, Number],
  propC: { type: String, required: true },
  propD: { type: [String, null], required: true },
  propE: { type: Number, default: 100 },
  propF: { type: Object, default: () => ({ message: 'hi' }) },  // 对象/数组须工厂
  propG: { validator(value) { return ['s','w','d'].includes(value) } },
  propH: { type: Function, default: () => 'fn' }
})
```
- 运行时类型：`String`/`Number`/`Boolean`/`Array`/`Object`/`Date`/`Function`/`Symbol`/`Error` + 自定义类（instanceof）。
- Boolean 转换：`disabled` 声明 Boolean 时 `<My disabled />` = `:disabled="true"`。
- 类型声明会被编译为运行时校验（如 `{ msg: { type: String, required: true } }`）。

---

## 五、命名大小写

- 声明 camelCase（`greetingMessage`），模板传递 kebab-case（`<My greeting-message="hi" />`）。
- 静态 `<BlogPost title="..." />`；动态 `:title="post.title"`；批量 `v-bind="post"`。

---

## 六、子向父通信（Events）

> 本章 props 未含 emit，标准补充（Vue 3 共识）。

```vue
<!-- 子 -->
<script setup>
const emit = defineEmits(['inFocus', 'submit'])
emit('submit', { id: 1 })
</script>
<!-- 父 -->
<Child @submit="handleSubmit" />
```
- `defineEmits` 声明事件；`emit('name', payload)` 触发。
- 配合 `v-model`：子 `emit('update:modelValue', val)`，父 `<Child v-model="x" />`。

---

## 小结（Recap）

- 用 `defineProps` 声明；3.5+ 支持响应式解构；
- props 单向，子不可改；对象/数组默认值用工厂；
- 子→父用 `defineEmits` + `emit`。

---

## 衔接

- 插槽/provide：`07-events-slots-provide.md`
- 模板语法：`05-template-syntax.md`
- 与 React 对比：props≈React props、defineEmits≈回调 props、v-model≈受控组件
