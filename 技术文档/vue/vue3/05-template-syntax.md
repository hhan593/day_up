# Vue 3 模板语法（Template Syntax）

> 来源：Vue 官方文档（https://vuejs.org/guide/essentials/template-syntax）— Guide / Essentials
> 版本：Vue 3（部分语法如同名简写仅 Vue 3.4+）

---

## 一、文本插值（Mustache）

```html
<span>Message: {{ msg }}</span>
```
- 大括号内容随 `msg` 变化自动更新；本质是 JS 表达式（单表达式）。

---

## 二、指令（Directives）：v- 前缀特殊属性

### v-bind（属性绑定）— 简写 `:`
```html
<div :id="dynamicId"></div>
```
- 值为 `null`/`undefined` 时属性被移除。
- **同名简写（Vue 3.4+）**：属性名与变量名相同可省略值：`<div :id>` 等价于 `:id="id"`。
- **布尔属性**：`<button :disabled="isDisabled">`，真值保留，假值省略。
- 无参数 `v-bind="objectOfAttrs"`：批量绑定对象所有属性。

### v-on（事件监听）— 简写 `@`
```html
<a @click="doSomething">...</a>
```
- 详见 `07-events-slots-provide.md`（Event Handling）。

### v-model（表单双向绑定）— 详见 `07` 表单章节补充

---

## 三、动态参数（Dynamic Arguments）

```html
<a :[attributeName]="url">...</a>
<a @[eventName]="doSomething">...</a>
```
- 方括号内为 JS 表达式，结果作为最终参数。
- 期望字符串（例外 `null` 表移除绑定）；不能含空格/引号（HTML 属性限制）；DOM 内模板避免大写键名。

---

## 四、修饰符（Modifiers）

以点号后缀指示特殊绑定：
```html
<form @submit.prevent="onSubmit">...</form>
```
- `.prevent` → 调用 `event.preventDefault()`。

---

## 五、条件与循环（v-if / v-for）

- `v-if`（条件渲染）：根据表达式真假插入/移除元素。
```html
<p v-if="seen">Now you see me</p>
```
- `v-show`：始终渲染，仅切换 CSS `display`（本章未展开，详见官网 Conditional Rendering / List Rendering）。
- `v-for`（列表渲染）：见官网对应章节，需 `key`。

---

## 六、模板中的 JS 表达式

- 支持完整 JS 表达式（`{{ ok ? 'YES' : 'NO' }}`）；
- 每绑定仅**单表达式**（无语句/流控制）；
- 沙箱化，仅可访问受限全局（`Math`/`Date`），不可访问 `window` 自定义属性（`app.config.globalProperties` 扩展）。

---

## 小结（Recap）

- `{{ }}` 文本插值；`:`=v-bind、`@`=v-on、`#`=v-slot；
- 动态参数用 `[]`；修饰符用 `.`；
- 3.4+ 支持同名简写 `:id`。

---

## 衔接

- 事件/表单/插槽：`07-events-slots-provide.md`
- 组件与 props：`08-components-props-events.md`
