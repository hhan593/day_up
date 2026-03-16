# Next.js 零基础快速参考

> 常用代码片段，适合初学者查阅
> 建议保存收藏，边学边查

---

## 🚀 项目命令

### 创建项目
```bash
# 创建新项目（推荐选项）
npx create-next-app@latest 项目名称

# 创建时的推荐选择：
# - TypeScript: 可选（新手可以先不用）
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src directory: No（简单点）
# - App Router: Yes
```

### 常用命令
```bash
npm run dev      # 启动开发服务器（最常用）
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm install      # 安装依赖
```

---

## 📁 项目结构

```
my-app/
├── app/                 # 页面代码放这里
│   ├── layout.tsx      # 网站外壳（导航栏、页脚）
│   ├── page.tsx        # 首页内容
│   ├── globals.css     # 全局样式
│   └── about/
│       └── page.tsx    # /about 页面
├── components/         # 可复用组件
│   └── Button.tsx
├── public/             # 静态资源（图片等）
│   └── logo.png
└── package.json        # 项目配置
```

---

## 📄 页面基础

### 最简单的页面
```tsx
// app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>欢迎来到我的网站</h1>
      <p>这是我的第一个 Next.js 页面</p>
    </main>
  );
}
```

### 创建新页面
```tsx
// app/about/page.tsx
export default function About() {
  return (
    <div>
      <h1>关于我们</h1>
      <p>这里是关于页面</p>
    </div>
  );
}
```
访问地址：`http://localhost:3000/about`

### 动态页面（如文章详情）
```tsx
// app/blog/[id]/page.tsx
export default async function BlogPost({ params }) {
  const { id } = await params;

  return (
    <div>
      <h1>文章 #{id}</h1>
      <p>文章内容...</p>
    </div>
  );
}
```
访问地址：`http://localhost:3000/blog/123`

---

## 🎨 布局 Layout

### 根布局（所有页面共享）
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <nav>
          <a href="/">首页</a>
          <a href="/about">关于</a>
        </nav>

        {children}  {/* 页面内容会显示在这里 */}

        <footer>© 2024 我的网站</footer>
      </body>
    </html>
  );
}
```

### 嵌套布局
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <aside>侧边栏</aside>
      <main>{children}</main>
    </div>
  );
}
```

---

## 🔗 页面导航

### 使用 Link 组件（推荐）
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

### 编程式导航（用代码跳转）
```tsx
'use client';

import { useRouter } from 'next/navigation';

export default function Button() {
  const router = useRouter();

  return (
    <button onClick={() => router.push('/about')}>
      跳转到关于页
    </button>
  );
}
```

---

## 🎭 两种组件

### Server Component（默认）
```tsx
// 可以直接获取数据
// 代码在服务器运行

export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();

  return <div>{json.title}</div>;
}
```
**什么时候用？** 只需要显示数据，不需要交互

### Client Component
```tsx
'use client';  // 必须加在第一行

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      点击了 {count} 次
    </button>
  );
}
```
**什么时候用？** 需要点击、输入等交互功能

---

## 📊 数据获取

### 在页面中获取数据
```tsx
// app/users/page.tsx
export default async function UsersPage() {
  // 获取数据
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

### 添加加载状态
```tsx
// app/users/loading.tsx
export default function Loading() {
  return <p>加载中...</p>;
}
```

### 添加错误处理
```tsx
// app/users/error.tsx
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

---

## 📝 表单提交（Server Actions）

### 1. 创建 Action
```tsx
// app/actions.ts
'use server';

export async function submitForm(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');

  // 这里可以操作数据库
  console.log(name, email);

  // 保存到数据库...
}
```

### 2. 使用 Action
```tsx
import { submitForm } from './actions';

export default function ContactForm() {
  return (
    <form action={submitForm}>
      <input name="name" placeholder="姓名" required />
      <input name="email" type="email" placeholder="邮箱" required />
      <button type="submit">提交</button>
    </form>
  );
}
```

---

## 💅 样式

### Tailwind CSS（推荐）
```tsx
export default function Card() {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-blue-600">标题</h2>
      <p className="text-gray-600 mt-2">内容</p>
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        按钮
      </button>
    </div>
  );
}
```

常用 Tailwind 类：
| 类名 | 作用 |
|-----|------|
| `p-4` | padding: 1rem |
| `m-4` | margin: 1rem |
| `text-xl` | 文字大 |
| `font-bold` | 粗体 |
| `bg-blue-500` | 蓝色背景 |
| `text-white` | 白色文字 |
| `rounded` | 圆角 |
| `flex` | 弹性布局 |
| `grid` | 网格布局 |

### CSS 文件
```css
/* app/globals.css */
body {
  background-color: #f0f0f0;
  font-family: Arial, sans-serif;
}

.my-button {
  padding: 10px 20px;
  background-color: blue;
  color: white;
  border: none;
  border-radius: 4px;
}
```

---

## 🖼️ 图片使用

### 使用 next/image（自动优化）
```tsx
import Image from 'next/image';

export default function Photo() {
  return (
    <Image
      src="/photo.jpg"      // public 目录下的图片
      alt="描述文字"
      width={500}
      height={300}
    />
  );
}
```

### 外部图片
```tsx
import Image from 'next/image';

export default function Photo() {
  return (
    <Image
      src="https://example.com/photo.jpg"
      alt="描述"
      width={500}
      height={300}
    />
  );
}
```
需要在 `next.config.js` 中配置域名。

---

## ⚛️ React 基础（Client Component 中用）

### useState（状态）
```tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>当前数值: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
    </div>
  );
}
```

### useEffect（副作用）
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

### 表单处理
```tsx
'use client';

import { useState } from 'react';

export default function Form() {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();  // 阻止页面刷新
    console.log('提交的名字:', name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="输入名字"
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 列表渲染
```tsx
export default function List() {
  const items = [
    { id: 1, name: '苹果' },
    { id: 2, name: '香蕉' },
    { id: 3, name: '橙子' },
  ];

  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

---

## 🔌 API 路由

### 创建 API
```tsx
// app/api/hello/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Hello World' });
}
```
访问地址：`http://localhost:3000/api/hello`

### 带数据库操作
```tsx
// app/api/users/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const data = await request.json();
  const newUser = await db.user.create({ data });
  return NextResponse.json(newUser, { status: 201 });
}
```

---

## 🎯 常用技巧

### 获取 URL 参数
```tsx
// 访问 /search?q=关键词
export default function Search({ searchParams }) {
  const query = searchParams.q;

  return <p>搜索: {query}</p>;
}
```

### 设置页面标题
```tsx
export const metadata = {
  title: '我的页面标题',
  description: '页面描述',
};

export default function Page() {
  return <div>内容</div>;
}
```

### 重定向
```tsx
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return <div>欢迎, {user.name}</div>;
}
```

---

## 🛠️ 常见问题

### 1. "window is not defined" 错误
**原因**：Server Component 中没有 window
**解决**：
```tsx
'use client';  // 加这一行

export default function Component() {
  // 现在可以使用 window
  console.log(window.location.href);
  return <div>...</div>;
}
```

### 2. 图片不显示
**检查**：
1. 图片放在 `public` 目录下
2. 路径以 `/` 开头
3. 如果使用外部图片，配置了域名

### 3. 样式不生效
**检查**：
1. Tailwind 类名拼写正确
2. CSS 文件正确导入
3. 清除浏览器缓存

### 4. 数据获取失败
**检查**：
1. API 地址正确
2. 网络连接正常
3. 查看控制台错误信息

---

## 📚 学习资源

- [Next.js 官方文档](https://nextjs.org/docs)
- [React 官方文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [MDN Web 文档](https://developer.mozilla.org/zh-CN/)

---

**有问题？先查文档，再搜索，最后问人。** 这是程序员的基本技能 😊
