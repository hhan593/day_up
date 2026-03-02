# Next.js 零基础学习路线图

> 专为编程新手设计，从零开始学习 Next.js，无需任何前置经验

## 🎯 学习宣言

**不用担心！你可以学会！**

这份路线图假设你：
- ✅ 有基本的电脑操作能力
- ✅ 对编程感兴趣
- ❌ 不需要有 React 经验
- ❌ 不需要有 Web 开发经验

我们会从最基础的概念开始，一步一步带你成为 Next.js 开发者。

---

## 📚 前置知识准备（第 0 阶段）

在开始学习 Next.js 之前，你需要先掌握一些基础知识。预计 2-3 周。

### 0.1 HTML 基础（3-4 天）

**什么是 HTML？**
HTML 是网页的骨架，就像建筑的框架一样。它定义了网页上有什么内容。

**需要学习的内容**：
- HTML 标签是什么（`<div>`、`<p>`、`<h1>` 等）
- 常用标签：标题、段落、链接、图片、列表
- HTML 文档结构
- 属性的概念

**实践任务**：
- [ ] 用记事本写一个纯 HTML 的个人简介页面
- [ ] 包含：标题、头像、自我介绍、爱好列表、联系方式链接

**推荐资源**：
- MDN HTML 教程（中文版）
- freeCodeCamp HTML 课程

### 0.2 CSS 基础（5-7 天）

**什么是 CSS？**
CSS 是网页的样式，就像建筑的装修。它让网页变得美观。

**需要学习的内容**：
- 选择器（如何选中 HTML 元素）
- 颜色和背景
- 文字样式（大小、字体、粗细）
- 盒模型（边距、边框、内边距）
- 布局基础（Flexbox 入门）

**实践任务**：
- [ ] 美化你的 HTML 个人简介页面
- [ ] 让页面在手机上也能正常显示

### 0.3 JavaScript 基础（7-10 天）

**什么是 JavaScript？**
JavaScript 让网页能动起来，实现交互效果。

**需要学习的内容**：
- 变量和常量（let、const）
- 数据类型（字符串、数字、布尔值、数组、对象）
- 条件语句（if/else）
- 循环（for、while）
- 函数（function）
- 事件处理（点击、输入等）

**实践任务**：
- [ ] 做一个计数器：点击按钮数字增加
- [ ] 做一个待办事项：可以添加和删除任务

### 0.4 开发工具配置（1-2 天）

**需要安装的工具**：
- [ ] VS Code（代码编辑器）
- [ ] Node.js（JavaScript 运行环境）
- [ ] Chrome 浏览器（开发和调试）

**需要掌握的 VS Code 基础**：
- 打开文件夹
- 创建和编辑文件
- 安装插件（推荐：ES7+ React snippets、Prettier）
- 使用终端

---

## 🚀 第一阶段：认识 Next.js（第 1-2 周）

### 第 1 周：Hello Next.js

#### Day 1: 第一个 Next.js 项目

**今日目标**：成功运行一个 Next.js 项目

**学习内容**：
- Next.js 是什么？（一个帮助你快速建网站的工具）
- 使用命令行创建项目
- 项目里都有什么文件？

**跟着做**：
```bash
# 1. 打开终端（VS Code 里的 Terminal -> New Terminal）
# 2. 输入以下命令，一路回车
npx create-next-app@latest my-first-app

# 3. 进入项目文件夹
cd my-first-app

# 4. 启动项目
npm run dev

# 5. 打开浏览器，访问 http://localhost:3000
```

**你会看到什么**：
- 一个默认的 Next.js 欢迎页面
- 这就说明你成功了！

#### Day 2: 认识项目结构

**今日目标**：知道每个文件是干嘛的

**核心文件介绍**：

```
my-first-app/
├── app/                    ← 页面代码放这里
│   ├── layout.tsx         ← 网页的"外壳"
│   ├── page.tsx           ← 首页内容
│   └── globals.css        ← 全局样式
├── public/                ← 图片等静态资源
├── package.json           ← 项目配置和依赖
└── next.config.js         ← Next.js 配置
```

**动手试试**：
1. 打开 `app/page.tsx`
2. 找到 `<h1>` 标签，修改里面的文字
3. 保存文件，看浏览器自动更新

#### Day 3: 创建新页面

**今日目标**：学会添加新页面

**核心概念**：
在 Next.js 中，**文件夹 = 网址路径**

**跟着做**：
```
app/
├── page.tsx              ← 访问 / 看到的内容
├── about/
│   └── page.tsx         ← 访问 /about 看到的内容
└── contact/
    └── page.tsx         ← 访问 /contact 看到的内容
```

**练习**：
- [ ] 创建 about 页面（关于我）
- [ ] 创建 contact 页面（联系方式）
- [ ] 在每个页面添加返回首页的链接

#### Day 4: 页面间导航

**今日目标**：学会在页面间跳转

**学习内容**：
- 使用 `<Link>` 组件
- 链接和按钮的区别

**代码示例**：
```tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>我的网站</h1>
      <nav>
        <Link href="/about">关于我</Link>
        <Link href="/contact">联系我</Link>
      </nav>
    </div>
  );
}
```

#### Day 5: 添加样式

**今日目标**：让页面变好看

**三种加样式的方式**：

1. **Tailwind CSS**（推荐，最简单）
```tsx
<h1 className="text-3xl font-bold text-blue-500">
  蓝色大标题
</h1>
```

2. **CSS 文件**
```css
/* app/globals.css */
.my-title {
  font-size: 24px;
  color: blue;
}
```

3. **内联样式**
```tsx
<h1 style={{ color: 'blue', fontSize: '24px' }}>
  标题
</h1>
```

**练习**：
- [ ] 给导航栏添加样式（背景色、间距）
- [ ] 让页面内容居中显示

#### Day 6-7: 小项目：个人主页

**目标**：做一个简单的个人介绍网站

**要求**：
- [ ] 首页：欢迎语 + 个人照片
- [ ] 关于页：详细介绍自己
- [ ] 作品页：展示你的项目（可以是空的，占位即可）
- [ ] 联系页：邮箱、社交媒体链接
- [ ] 统一的导航栏
- [ ] 基本的样式美化

---

### 第 2 周：动态内容

#### Day 8: 理解组件

**什么是组件？**
把页面拆分成独立的小块，每块就是一个组件。就像乐高积木一样。

**示例**：
```tsx
// components/Header.tsx
export default function Header() {
  return (
    <header>
      <h1>我的博客</h1>
      <nav>...</nav>
    </header>
  );
}
```

```tsx
// app/page.tsx
import Header from '../components/Header';

export default function Home() {
  return (
    <div>
      <Header />  {/* 使用组件 */}
      <main>内容</main>
    </div>
  );
}
```

**练习**：
- [ ] 把导航栏做成一个组件
- [ ] 做一个 Card 组件（带图片和文字的卡片）

#### Day 9: Props（传递数据）

**什么是 Props？**
给组件传递数据的方式，就像给函数传参数。

**示例**：
```tsx
// components/Card.tsx
export default function Card({ title, description, image }) {
  return (
    <div className="card">
      <img src={image} />
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}
```

```tsx
// 使用组件
<Card
  title="我的项目"
  description="这是一个很棒的网站"
  image="/project.jpg"
/>
```

#### Day 10: 列表渲染

**今日目标**：显示列表数据

**示例**：
```tsx
export default function BlogList() {
  const posts = [
    { id: 1, title: '第一篇文章', date: '2024-01-01' },
    { id: 2, title: '第二篇文章', date: '2024-01-15' },
    { id: 3, title: '第三篇文章', date: '2024-02-01' },
  ];

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <span>{post.date}</span>
        </div>
      ))}
    </div>
  );
}
```

**关键点**：
- `map` 方法遍历数组
- `key` 属性很重要，帮助 React 识别每个项目

#### Day 11: 动态路由

**今日目标**：创建详情页面

**场景**：博客列表 → 点击 → 查看文章详情

**跟着做**：
```
app/
├── blog/
│   ├── page.tsx         ← 博客列表 /blog
│   └── [slug]/          ← 动态路由
│       └── page.tsx     ← 单篇文章 /blog/hello-world
```

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }) {
  const { slug } = await params;

  return (
    <div>
      <h1>文章标题: {slug}</h1>
      <p>这里是文章内容...</p>
    </div>
  );
}
```

#### Day 12: 布局 Layout

**什么是布局？**
多个页面共享的部分（如导航栏、页脚）。

**跟着做**：
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <nav>导航栏</nav>
        {children}  {/* 页面内容会显示在这里 */}
        <footer>页脚</footer>
      </body>
    </html>
  );
}
```

**特点**：
- 切换页面时，布局不会重新加载
- 导航栏保持状态

#### Day 13-14: 阶段项目：博客系统

**目标**：一个可以查看文章列表和详情的博客

**功能**：
- [ ] 首页展示最新文章
- [ ] 文章列表页
- [ ] 文章详情页（动态路由）
- [ ] 统一的导航和样式
- [ ] 使用模拟数据（先不写后端）

---

## 🎨 第二阶段：React 基础（第 3-4 周）

### 第 3 周：React 核心概念

#### Day 15: 什么是 React？

**React 是什么？**
一个帮助你构建用户界面的 JavaScript 库。

**为什么要用 React？**
- 组件化：代码可复用
- 响应式：数据变化，界面自动更新
- 高效：只更新需要变化的部分

#### Day 16: State（状态）

**什么是 State？**
组件的记忆，存储会变化的数据。

**示例**：计数器
```tsx
'use client';

import { useState } from 'react';

export default function Counter() {
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

**关键概念**：
- `useState` 创建状态
- `count` 是当前值
- `setCount` 是修改函数
- 状态变化 → 界面自动更新

#### Day 17: 事件处理

**常见事件**：
```tsx
<button onClick={handleClick}>点击</button>
<input onChange={handleInput} />
<form onSubmit={handleSubmit}>
```

**练习**：
- [ ] 做一个输入框，实时显示输入内容
- [ ] 做一个表单，提交后显示输入的数据

#### Day 18: 条件渲染

**根据条件显示不同内容**：
```tsx
export default function Greeting({ isLoggedIn }) {
  if (isLoggedIn) {
    return <p>欢迎回来！</p>;
  } else {
    return <p>请登录</p>;
  }
}

// 或者简写
export default function Greeting({ isLoggedIn }) {
  return (
    <div>
      {isLoggedIn ? <p>欢迎</p> : <p>请登录</p>}
      {isLoggedIn && <p>VIP 会员</p>}
    </div>
  );
}
```

#### Day 19: useEffect（副作用）

**什么是 useEffect？**
在组件渲染后执行一些操作。

**常见用途**：
- 获取数据
- 订阅事件
- 操作 DOM

**示例**：
```tsx
'use client';

import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 每秒更新时间
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // 清理函数
    return () => clearInterval(timer);
  }, []);

  return <p>现在时间: {time.toLocaleTimeString()}</p>;
}
```

#### Day 20-21: 练习周

**项目**：待办事项应用

**功能**：
- [ ] 添加任务
- [ ] 标记完成/未完成
- [ ] 删除任务
- [ ] 过滤显示（全部/未完成/已完成）
- [ ] 数据保存到本地存储

---

### 第 4 周：进阶 React

#### Day 22: 表单处理

**受控组件**：
```tsx
export default function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();  // 阻止页面刷新
    console.log(name, email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

#### Day 23: 组件通信

**父子组件传值**：
```tsx
// 父组件
export default function Parent() {
  const [message, setMessage] = useState('');

  return (
    <div>
      <p>收到的消息: {message}</p>
      <Child onSend={(msg) => setMessage(msg)} />
    </div>
  );
}

// 子组件
function Child({ onSend }) {
  return (
    <button onClick={() => onSend('你好！')}>
      发送消息
    </button>
  );
}
```

#### Day 24: 列表和 Keys

**正确处理列表**：
```tsx
const items = [
  { id: 1, text: '第一项' },
  { id: 2, text: '第二项' },
];

// ✅ 正确：使用稳定的 id
items.map(item => <li key={item.id}>{item.text}</li>);

// ❌ 错误：使用 index（可能导致问题）
items.map((item, index) => <li key={index}>{item.text}</li>);
```

#### Day 25: React Hook 规则

**重要规则**：
1. 只在最顶层调用 Hook，不要在循环或条件中调用
2. 只在 React 函数中调用 Hook
3. `'use client'` 指令表示这是客户端组件

#### Day 26-28: 阶段项目

**项目**：天气预报应用

**功能**：
- [ ] 输入城市名查询天气
- [ ] 显示当前温度、天气状况
- [ ] 显示未来几天预报
- [ ] 使用免费天气 API

---

## 🚀 第三阶段：Next.js 核心（第 5-7 周）

### 第 5 周：服务端 vs 客户端

#### Day 29: 两种组件模式

**Server Component（服务端组件）**：
- 默认就是
- 可以直接访问数据库
- 不能用了 useState、useEffect
- 代码不在浏览器中运行

**Client Component（客户端组件）**：
- 顶部加 `'use client'`
- 可以使用所有 React 功能
- 代码发送到浏览器运行

**怎么选择？**
- 需要交互（点击、输入）→ Client Component
- 只需要显示数据 → Server Component

#### Day 30: 在服务端获取数据

**示例**：
```tsx
// app/users/page.tsx
export default async function UsersPage() {
  // 直接获取数据
  const response = await fetch('https://api.example.com/users');
  const users = await response.json();

  return (
    <div>
      <h1>用户列表</h1>
      {users.map(user => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
}
```

**注意**：
- 函数前面加 `async`
- 不需要 useEffect！

#### Day 31: Loading 状态

**创建 loading.tsx**：
```tsx
// app/users/loading.tsx
export default function Loading() {
  return <p>加载中...</p>;
}
```

Next.js 会自动在数据加载时显示这个组件。

#### Day 32: Error 处理

**创建 error.tsx**：
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

#### Day 33-35: 练习

**项目**：用户管理系统

- [ ] 显示用户列表（服务端获取）
- [ ] 加载状态
- [ ] 错误处理
- [ ] 用户详情页

---

### 第 6 周：数据变更

#### Day 36: Server Actions 介绍

**什么是 Server Actions？**
在服务端执行的函数，可以直接操作数据库。

**示例**：
```tsx
// app/actions.ts
'use server';

export async function addTodo(formData) {
  const title = formData.get('title');

  // 这里可以直接操作数据库
  await db.todo.create({ title });

  // 刷新页面数据
  revalidatePath('/todos');
}
```

```tsx
// app/page.tsx
import { addTodo } from './actions';

export default function Page() {
  return (
    <form action={addTodo}>
      <input name="title" />
      <button type="submit">添加</button>
    </form>
  );
}
```

#### Day 37: 表单验证

**使用 Zod 验证**：
```tsx
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少6位'),
});
```

#### Day 38-42: 完整 CRUD 项目

**项目**：笔记应用

功能：
- [ ] 创建笔记
- [ ] 查看笔记列表
- [ ] 编辑笔记
- [ ] 删除笔记
- [ ] 搜索笔记

技术：
- Server Components 显示数据
- Server Actions 修改数据
- Client Components 处理交互

---

### 第 7 周：部署和优化

#### Day 43: 静态导出

**配置 next.config.js**：
```js
const nextConfig = {
  output: 'export',
  distDir: 'dist',
};

module.exports = nextConfig;
```

#### Day 44: 图片优化

**使用 next/image**：
```tsx
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="描述"
  width={800}
  height={600}
/>
```

**好处**：
- 自动压缩
- 懒加载
- 响应式

#### Day 45: SEO 优化

**添加 Metadata**：
```tsx
export const metadata = {
  title: '我的网站',
  description: '这是一个很棒的网站',
};
```

#### Day 46-48: 部署到 Vercel

**步骤**：
1. 注册 GitHub 账号
2. 把代码推送到 GitHub
3. 注册 Vercel 账号
4. 连接 GitHub 仓库
5. 自动部署！

#### Day 49: 性能检查

**使用 Lighthouse**：
- Chrome DevTools → Lighthouse
- 检查性能评分
- 优化建议

---

## 🎓 第四阶段：进阶主题（第 8-10 周）

### 第 8 周：数据库

#### Day 50-52: 学习 Prisma

**什么是 Prisma？**
一个让数据库操作更简单的工具。

**基础概念**：
- Schema（数据模型定义）
- Migration（数据库迁移）
- Client（查询客户端）

#### Day 53-56: 集成数据库

**项目**：带数据库的完整应用

使用：
- PostgreSQL 或 SQLite
- Prisma ORM
- 完整的增删改查

---

### 第 9 周：认证

#### Day 57-60: NextAuth.js

**实现功能**：
- [ ] 用户登录/注册
- [ ] GitHub 登录
- [ ] 保护页面
- [ ] 用户角色

---

### 第 10 周：实战项目

#### Day 61-70: 完整项目开发

**推荐项目**：个人博客系统

**功能**：
- [ ] 文章管理（CRUD）
- [ ] Markdown 编辑器
- [ ] 评论系统
- [ ] 标签分类
- [ ] 搜索功能
- [ ] RSS 订阅
- [ ] 暗黑模式

---

## 📋 学习检查清单

### 第一阶段
- [ ] 成功创建并运行 Next.js 项目
- [ ] 理解文件系统路由
- [ ] 能创建多个页面
- [ ] 会使用 Link 导航
- [ ] 能添加基础样式

### 第二阶段
- [ ] 理解 React 组件
- [ ] 会使用 useState
- [ ] 会使用 useEffect
- [ ] 能处理表单
- [ ] 理解事件处理

### 第三阶段
- [ ] 理解 Server/Client Components 区别
- [ ] 能在服务端获取数据
- [ ] 会使用 Server Actions
- [ ] 能处理 Loading 和 Error
- [ ] 能部署到 Vercel

### 第四阶段
- [ ] 能操作数据库
- [ ] 实现用户认证
- [ ] 完成完整项目

---

## 💡 学习建议

### 1. 不要害怕犯错
编程就是在错误中学习的。遇到报错，读一下错误信息，通常是告诉你哪里错了。

### 2. 多动手
看十遍不如写一遍。每个知识点都要敲一遍代码。

### 3. 善用搜索
遇到问题，先自己搜索。推荐：
- Google
- Stack Overflow
- Next.js 官方文档

### 4. 加入社区
- 掘金（中文）
- GitHub
- Discord 上的开发者社区

### 5. 坚持
编程学习是马拉松，不是短跑。每天进步一点点。

---

## 📚 推荐资源

### 免费教程
- [Next.js 官方文档](https://nextjs.org/docs)
- [React 官方文档](https://react.dev)
- [MDN Web 文档](https://developer.mozilla.org/zh-CN/)

### 视频教程（B站/YouTube）
- Next.js 官方教程
- React 基础教程

### 练习平台
- freeCodeCamp
- Codecademy

---

**记住：每一步都算数，坚持就是胜利！** 🎉
