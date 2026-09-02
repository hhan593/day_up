# React 描述 UI（Describing the UI）

> 来源：React 官方文档（https://react.dev/learn/describing-the-ui）— Learn / Describing the UI
> 版本：React v19.2（© Meta Platforms, Inc）
> 说明：本文档知识点均提取自 React 官网，部分子页未展开的细节已注明「官网未展开」。

React 是一个用于构建用户界面（UI）的 JavaScript 库。UI 由按钮、文本、图像等小单元构成，React 允许将它们组合成**可复用、可嵌套的组件（Component）**。

---

## 1. 创建与嵌套组件

- 组件本质是一个 **JavaScript 函数**，可以返回类似 HTML 的标记（JSX）。
- 组件可小到按钮，大到整个页面。

```js
function Profile() {
  return <img src="https://react.dev/images/docs/scientists/MK3eW3As.jpg" alt="Katherine Johnson" />;
}

export default function Gallery() {
  return (
    <section>
      <h1>Amazing scientists</h1>
      <Profile />
      <Profile />
      <Profile />
    </section>
  );
}
```

- 多文件拆分：用 `export default` / `import` 把组件拆到独立文件。
- 官网子页：Your First Component、Importing and Exporting Components。

---

## 2. JSX（Writing Markup with JSX）

- JSX 是 JavaScript 的语法扩展，允许在函数中书写类 HTML 标记，由 React 渲染到浏览器。
- 比 HTML 更严格：`class` 要写成 `className`、标签必须闭合、属性用驼峰（`onClick`、`tabIndex`）。

```js
export default function TodoList() {
  return (
    <>
      <h1>Hedy Lamarr's Todos</h1>
      <img src="..." alt="Hedy Lamarr" className="photo" />
      <ul>
        <li>Invent new traffic lights</li>
        <li>Rehearse a movie scene</li>
      </ul>
    </>
  );
}
```

> ⚠️ 直接粘贴 HTML 常失效：未闭合标签、`class` 而非 `className`、内联 `style` 需写成对象。

---

## 3. 在 JSX 中嵌入数据（花括号）

- 使用 `{}` 在 JSX 中「打开 JavaScript 窗口」，可嵌入变量、表达式、对象。

```js
const person = { name: 'Gregorio Y. Zara', theme: { backgroundColor: 'black', color: 'pink' } };
export default function TodoList() {
  return (
    <div style={person.theme}>
      <h1>{person.name}'s Todos</h1>
    </div>
  );
}
```

- 花括号可用于**属性值**（`style={person.theme}`）或**标签内容**（`{person.name}`）。

---

## 4. Props（向组件传递信息）

- 父组件通过 `props` 向子组件传值，类似 HTML 属性，但可传任意 JS 值（对象、数组、函数、JSX）。
- Props 为**只读**，子组件通过参数解构获取。

```js
function Avatar({ person, size }) {
  return <img className="avatar" src={getImageUrl(person)} alt={person.name} width={size} height={size} />;
}
```

---

## 5. Children

- `children` 是 props 的特殊属性，表示组件标签**内部的嵌套内容**。

```js
function Card({ children }) {
  return <div className="card">{children}</div>;
}
// 使用：<Card><Avatar /></Card>
```

- 让组件像容器一样包裹任意 JSX。

---

## 6. 条件渲染（Conditional Rendering）

- 利用 JS 语法 `if`、`&&`、`? :` 在 JSX 中按条件输出。

```js
function Item({ name, isPacked }) {
  return <li className="item">{name} {isPacked && '✅'}</li>;
}
```

- 也可用三元运算 `{isPacked ? '✅' : null}` 或提前 `if` return 切换不同 UI。

---

## 7. 渲染列表（Rendering Lists）

- 用 `map()` 将数组数据转为组件数组；用 `filter()` 过滤。
- 每项需指定 `key`（通常用数据库 ID），帮助 React 追踪列表变更。

```js
const listItems = people.map(person =>
  <li key={person.id}>
    <img src={getImageUrl(person)} alt={person.name} />
    <p><b>{person.name}:</b> {person.profession}</p>
  </li>
);
return <article><h1>Scientists</h1><ul>{listItems}</ul></article>;
```

---

## 8. 保持组件纯粹（Keeping Components Pure）

纯函数满足：
1. 不修改调用前已存在的变量/对象；
2. 相同输入永远返回相同输出。

```js
// ❌ 不纯：修改外部变量
let guest = 0;
function Cup() { guest = guest + 1; return <h2>Tea cup for guest #{guest}</h2>; }

// ✅ 纯：通过 prop 传入
function Cup({ guest }) { return <h2>Tea cup for guest #{guest}</h2>; }
```

> 严格遵守纯组件可避免难以预测的 bug。事件处理函数允许产生副作用，但组件体本身应保持纯净。

---

## 9. UI 作为树（Your UI as a Tree）

- React 用**渲染树**表达组件父子关系（顶部为根组件，叶节点无子组件），助于理解数据流与性能。
- **模块依赖树**表达 JS 文件引用关系，打包工具借此生成包，过大会损害体验。

---

## 小结（Recap）

- 组件是返回 JSX 的 JS 函数，可嵌套复用；
- JSX 比 HTML 严格，`{}` 嵌入 JS 表达式；
- Props 只读，children 是特殊 prop；
- 条件用 `&&` / `? :`，列表用 `map` + `key`；
- 组件体保持纯函数。

---

## 跨框架对比

| React 概念 | 对应物 |
|---|---|
| 组件（函数返回 JSX） | Vue 的 SFC、Angular 的 Component、Web Component |
| JSX | Vue 的模板语法、Svelte 的模板 |
| Props 只读 | Vue 的 props（单向）、Angular 的 `@Input()` |
| Children | Vue 的 slot、Angular 的 `<ng-content>` |
| 纯组件 | 函数式组件的「无副作用渲染」约定（同 Redux reducer 纯函数思想） |
