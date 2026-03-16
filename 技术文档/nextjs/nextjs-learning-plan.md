# Next.js 零基础学习计划

> 从零开始，一步一步成为 Next.js 开发者
> 预计学习时间：10-12 周（每天 2-3 小时）

## 🎯 写给零基础的你

这份计划专为编程新手设计。不需要你有任何编程经验，只要你：
- 会用电脑上网
- 有耐心，愿意一步步来
- 每天能抽出 2-3 小时学习

记住：**慢就是快**。基础打牢了，后面的路才好走。

---

## 准备阶段（第 0 周）

### 安装必要软件

- [ ] **VS Code**（代码编辑器）
  - 下载地址：https://code.visualstudio.com/
  - 安装插件：ES7+ React snippets、Prettier

- [ ] **Node.js**（JavaScript 运行环境）
  - 下载地址：https://nodejs.org/（选 LTS 版本）
  - 验证安装：打开终端输入 `node -v`，能看到版本号即成功

- [ ] **Chrome 浏览器**
  - 用于预览网页和调试

### 熟悉开发环境

**Day 0.1：认识 VS Code**
- 打开文件夹
- 创建新文件
- 使用终端（Terminal → New Terminal）
- 安装插件

**Day 0.2：认识命令行**
```bash
# 常用命令练习
pwd           # 显示当前位置
ls            # 列出文件
cd 文件夹名    # 进入文件夹
cd ..         # 返回上级
mkdir 文件夹名 # 创建文件夹
```

---

## 第一阶段：Web 基础（第 1-3 周）

### Week 1：HTML 基础

#### Day 1：HTML 是什么？

**学习内容**：
- HTML = 网页的骨架
- 标签的概念
- 基本结构

**动手做**：
```html
<!DOCTYPE html>
<html>
<head>
  <title>我的第一个网页</title>
</head>
<body>
  <h1>你好，世界！</h1>
  <p>这是我的第一个网页。</p>
</body>
</html>
```

把这段代码保存为 `index.html`，用浏览器打开看看。

#### Day 2：常用标签（上）

**学习标签**：
- `<h1>` 到 `<h6>`：标题
- `<p>`：段落
- `<br>`：换行
- `<hr>`：分割线

**练习**：
写一篇自我介绍，使用不同级别的标题。

#### Day 3：常用标签（下）

**学习标签**：
- `<a>`：链接
- `<img>`：图片
- `<ul>`、`<ol>`、`<li>`：列表

**练习**：
```html
<!-- 链接 -->
<a href="https://www.google.com">访问 Google</a>

<!-- 图片 -->
<img src="photo.jpg" alt="我的照片" width="200">

<!-- 无序列表 -->
<ul>
  <li>苹果</li>
  <li>香蕉</li>
  <li>橙子</li>
</ul>
```

#### Day 4：HTML 属性

**常用属性**：
- `id`：唯一标识
- `class`：类别（用于 CSS）
- `style`：内联样式

**练习**：
给之前的自我介绍添加样式属性。

#### Day 5-7：小项目：个人简历页

**要求**：
- 个人照片
- 姓名和联系方式
- 教育背景（列表）
- 技能（列表）
- 项目经验

---

### Week 2：CSS 基础

#### Day 8：CSS 是什么？

**学习内容**：
- CSS = 网页的样式和装饰
- 选择器的概念
- 三种引入方式

**跟着做**：
```html
<!-- 在 HTML 中引入 CSS -->
<head>
  <link rel="stylesheet" href="style.css">
</head>
```

```css
/* style.css */
body {
  background-color: #f0f0f0;
  font-family: Arial, sans-serif;
}

h1 {
  color: blue;
  text-align: center;
}
```

#### Day 9：选择器

**基础选择器**：
```css
/* 元素选择器 */
p { color: red; }

/* 类选择器 */
.title { font-size: 24px; }

/* ID 选择器 */
#header { background: black; }

/* 后代选择器 */
nav a { text-decoration: none; }
```

**练习**：
给简历页的不同部分添加样式。

#### Day 10：盒模型

**核心概念**：
- Content（内容）
- Padding（内边距）
- Border（边框）
- Margin（外边距）

```css
.box {
  width: 300px;
  padding: 20px;
  border: 2px solid black;
  margin: 10px;
}
```

#### Day 11：颜色和背景

```css
.colorful {
  color: #ff0000;          /* 文字颜色 */
  background-color: yellow;/* 背景色 */
  background-image: url('bg.jpg');
  opacity: 0.8;            /* 透明度 */
}
```

#### Day 12：文字样式

```css
text {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Microsoft YaHei', sans-serif;
  line-height: 1.5;
  text-align: center;
}
```

#### Day 13-14：美化简历页

**目标**：让 Week 1 的简历变得美观

要求：
- 合理的颜色搭配
- 适当的间距
- 响应式布局（在手机上也能看）

---

### Week 3：JavaScript 基础

#### Day 15：JS 是什么？

**学习内容**：
- JavaScript = 让网页动起来
- 在 HTML 中引入 JS
- 控制台输出

```html
<script>
  console.log('Hello, JavaScript!');
</script>
```

#### Day 16：变量和数据类型

```javascript
// 变量声明
let name = '张三';
const age = 25;

// 数据类型
let str = '字符串';
let num = 100;
let bool = true;
let nothing = null;
let notDefined = undefined;
```

**练习**：
声明变量存储你的个人信息，然后打印出来。

#### Day 17：运算符

```javascript
// 算术运算
let sum = 10 + 5;
let diff = 10 - 5;
let product = 10 * 5;
let quotient = 10 / 5;

// 比较运算
let isEqual = 5 === 5;
let isGreater = 10 > 5;

// 逻辑运算
let and = true && false;
let or = true || false;
let not = !true;
```

#### Day 18：条件语句

```javascript
let age = 18;

if (age >= 18) {
  console.log('成年人');
} else if (age >= 12) {
  console.log('青少年');
} else {
  console.log('儿童');
}

// 三元运算符
let status = age >= 18 ? '成年' : '未成年';
```

**练习**：
写一个函数，根据分数返回等级（A、B、C、D、F）。

#### Day 19：循环

```javascript
// for 循环
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// while 循环
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// 遍历数组
let fruits = ['苹果', '香蕉', '橙子'];
for (let fruit of fruits) {
  console.log(fruit);
}
```

#### Day 20：函数

```javascript
// 函数声明
function greet(name) {
  return '你好，' + name + '！';
}

// 箭头函数
const add = (a, b) => a + b;

// 使用
console.log(greet('小明'));
console.log(add(3, 5));
```

**练习**：
- 写一个计算 BMI 的函数
- 写一个判断闰年的函数

#### Day 21：数组和对象

```javascript
// 数组
let colors = ['红', '绿', '蓝'];
colors.push('黄');        // 添加
console.log(colors[0]);   // 访问
console.log(colors.length); // 长度

// 对象
let person = {
  name: '张三',
  age: 25,
  city: '北京'
};

console.log(person.name);
person.job = '工程师';
```

---

## 第二阶段：React 基础（第 4-5 周）

### Week 4：React 入门

#### Day 22：什么是 React？

**核心概念**：
- 组件化开发
- 声明式 UI
- 虚拟 DOM

**创建 React 项目**：
```bash
npx create-react-app my-react-app
cd my-react-app
npm start
```

#### Day 23：JSX 语法

```jsx
// JSX = JavaScript + XML
function App() {
  return (
    <div className="app">
      <h1>Hello React</h1>
      <p>现在是 {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
```

**注意**：
- `className` 代替 `class`
- 用 `{}` 写 JavaScript
- 必须有一个根元素

#### Day 24：组件

```jsx
// 函数组件
function Welcome(props) {
  return <h1>你好，{props.name}！</h1>;
}

// 使用组件
function App() {
  return (
    <div>
      <Welcome name="张三" />
      <Welcome name="李四" />
    </div>
  );
}
```

#### Day 25：State（状态）

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击我
      </button>
    </div>
  );
}
```

**关键点**：
- `useState` 返回数组 [值, 修改函数]
- 不要直接修改 state
- 状态变化会重新渲染组件

#### Day 26：事件处理

```jsx
function Form() {
  const handleClick = () => {
    alert('按钮被点击了！');
  };

  const handleChange = (e) => {
    console.log(e.target.value);
  };

  return (
    <div>
      <button onClick={handleClick}>点击</button>
      <input onChange={handleChange} />
    </div>
  );
}
```

#### Day 27-28：练习

**项目**：待办事项列表

功能：
- 添加任务
- 标记完成
- 删除任务
- 显示完成进度

---

### Week 5：React 进阶

#### Day 29：useEffect

```jsx
import { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // 组件挂载时执行
  useEffect(() => {
    console.log('组件加载了');

    // 清理函数
    return () => {
      console.log('组件卸载了');
    };
  }, []);

  // 依赖 count，count 变化时执行
  useEffect(() => {
    document.title = `点击了 ${count} 次`;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>点击</button>;
}
```

#### Day 30：列表渲染

```jsx
function TodoList() {
  const todos = [
    { id: 1, text: '学习 React', done: false },
    { id: 2, text: '学习 Next.js', done: false },
  ];

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          <input type="checkbox" checked={todo.done} />
          {todo.text}
        </li>
      ))}
    </ul>
  );
}
```

**重要**：列表项必须有唯一的 `key`！

#### Day 31：表单处理

```jsx
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('提交:', email, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button type="submit">登录</button>
    </form>
  );
}
```

#### Day 32-35：综合项目

**项目**：天气预报应用

功能：
- 城市搜索
- 显示当前天气
- 显示未来预报
- 温度单位切换

---

## 第三阶段：Next.js 核心（第 6-9 周）

### Week 6：Next.js 入门

#### Day 36：创建第一个 Next.js 项目

```bash
npx create-next-app@latest my-next-app
cd my-next-app
npm run dev
```

**项目结构**：
```
my-next-app/
├── app/              # 页面代码
│   ├── layout.tsx   # 布局
│   └── page.tsx     # 首页
├── public/          # 静态文件
├── package.json     # 依赖
└── next.config.js   # 配置
```

#### Day 37：文件系统路由

**规则**：
- `app/page.tsx` → 访问 `/`
- `app/about/page.tsx` → 访问 `/about`
- `app/blog/[id]/page.tsx` → 访问 `/blog/123`

**练习**：
创建以下页面：
- 首页
- 关于页
- 博客列表
- 博客详情（动态路由）

#### Day 38：布局 Layout

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <nav>导航栏</nav>
        <main>{children}</main>
        <footer>页脚</footer>
      </body>
    </html>
  );
}
```

**特点**：
- 布局在页面切换时保持
- 可以嵌套

#### Day 39：导航

```tsx
import Link from 'next/link';

export default function Nav() {
  return (
    <nav>
      <Link href="/">首页</Link>
      <Link href="/about">关于</Link>
      <Link href="/blog">博客</Link>
    </nav>
  );
}
```

#### Day 40-42：小项目

**项目**：个人博客（静态版）

功能：
- 首页展示文章列表
- 文章详情页
- 关于页
- 响应式布局

---

### Week 7：服务端渲染

#### Day 43：Server Components

**特点**：
- 默认就是 Server Component
- 可以直接获取数据
- 不能用了 useState、useEffect

```tsx
// 服务端直接获取数据
export default async function Page() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return (
    <div>
      {posts.map(post => (
        <h2 key={post.id}>{post.title}</h2>
      ))}
    </div>
  );
}
```

#### Day 44：Client Components

**什么时候用？**
- 需要交互（点击、输入）
- 需要用到 React hooks
- 需要访问浏览器 API

```tsx
'use client';  // 必须加在文件顶部

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c + 1)}>{count}</button>;
}
```

#### Day 45：Loading 和 Error

**Loading**：
```tsx
// app/blog/loading.tsx
export default function Loading() {
  return <p>加载中...</p>;
}
```

**Error**：
```tsx
'use client';

export default function Error({ error, reset }) {
  return (
    <div>
      <p>出错了: {error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  );
}
```

#### Day 46-49：数据获取练习

**项目**：新闻阅读器

- 从 API 获取新闻
- 显示新闻列表
- 新闻详情页
- 加载和错误状态

---

### Week 8：Server Actions

#### Day 50：什么是 Server Actions？

在服务端执行的函数，可以直接操作数据库。

```tsx
// app/actions.ts
'use server';

export async function addTodo(formData: FormData) {
  const title = formData.get('title') as string;

  // 这里可以直接操作数据库
  await db.todo.create({ data: { title } });

  revalidatePath('/todos');
}
```

#### Day 51：表单提交

```tsx
import { addTodo } from './actions';

export default function TodoForm() {
  return (
    <form action={addTodo}>
      <input name="title" placeholder="新任务" />
      <button type="submit">添加</button>
    </form>
  );
}
```

#### Day 52：表单验证

```tsx
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(formData: FormData) {
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const result = schema.safeParse(data);
  if (!result.success) {
    return { error: '验证失败' };
  }

  // 继续处理...
}
```

#### Day 53-56：完整 CRUD 项目

**项目**：笔记应用

功能：
- 创建笔记
- 查看笔记列表
- 编辑笔记
- 删除笔记
- 搜索笔记

---

### Week 9：进阶特性

#### Day 57：图片优化

```tsx
import Image from 'next/image';

export default function Photo() {
  return (
    <Image
      src="/photo.jpg"
      alt="描述"
      width={800}
      height={600}
      priority  // 优先加载
    />
  );
}
```

#### Day 58：Metadata

```tsx
export const metadata = {
  title: '我的网站',
  description: '这是一个很棒的网站',
  keywords: ['Next.js', 'React'],
};
```

#### Day 59：API Routes

```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await getUsersFromDB();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const newUser = await createUser(data);
  return NextResponse.json(newUser, { status: 201 });
}
```

#### Day 60-63：部署准备

- 代码优化
- 性能检查
- 环境变量配置

---

## 第四阶段：实战与部署（第 10-12 周）

### Week 10-11：完整项目开发

**项目**：个人博客系统（完整版）

**功能需求**：

#### 基础功能
- [ ] 文章列表（支持分页）
- [ ] 文章详情
- [ ] 文章分类/标签
- [ ] 搜索功能

#### 管理功能
- [ ] 创建文章
- [ ] 编辑文章
- [ ] 删除文章
- [ ] Markdown 编辑器

#### 高级功能
- [ ] 暗黑模式
- [ ] 评论系统
- [ ] RSS 订阅
- [ ] SEO 优化

### Week 12：部署上线

#### Day 80-82：Git 和 GitHub

```bash
# 基础命令
git init
git add .
git commit -m "初始提交"
git push origin main
```

#### Day 83-85：部署到 Vercel

1. 注册 Vercel 账号
2. 连接 GitHub
3. 导入项目
4. 配置环境变量
5. 一键部署

#### Day 86-90：优化和维护

- [ ] 性能优化（Lighthouse 90+）
- [ ] 错误监控
- [ ] 访问分析
- [ ] 持续迭代

---

## 📋 学习检查清单

### HTML/CSS/JS 基础
- [ ] 能用 HTML 写简单网页
- [ ] 能用 CSS 美化页面
- [ ] 理解 JS 基础语法
- [ ] 能写简单的交互功能

### React 基础
- [ ] 理解组件概念
- [ ] 会使用 useState
- [ ] 会使用 useEffect
- [ ] 能处理表单

### Next.js 核心
- [ ] 理解文件系统路由
- [ ] 能创建各种页面
- [ ] 理解 Server/Client Components
- [ ] 能获取和显示数据
- [ ] 会使用 Server Actions

### 项目实战
- [ ] 完成一个完整的项目
- [ ] 部署到线上
- [ ] 性能优化

---

## 💡 学习建议

### 1. 每天固定时间学习
建议每天 2-3 小时，保持连续性。

### 2. 不要只看不练
每学一个知识点，都要动手写代码。

### 3. 遇到错误别慌
读错误信息，90% 的问题都能自己解决。

### 4. 善用搜索
- Google
- Stack Overflow
- 官方文档

### 5. 记录笔记
建立自己的知识库，方便复习。

### 6. 加入社区
- GitHub
- 掘金
- Discord 开发者社区

---

## 📚 推荐资源

### 文档
- [MDN Web 文档](https://developer.mozilla.org/zh-CN/)
- [React 官方文档](https://react.dev)
- [Next.js 官方文档](https://nextjs.org/docs)

### 视频（B站搜索）
- HTML+CSS 基础教程
- JavaScript 基础教程
- React 入门教程
- Next.js 实战教程

### 练习平台
- freeCodeCamp
- Codecademy
- LeetCode（算法）

---

**记住：编程是技能，不是知识。多练习，你会越来越好的！** 💪
