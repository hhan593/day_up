# Next.js 16 快速参考手册 (Cheatsheet)

> 常用代码片段和快速参考，建议收藏备用

## 目录
- [路由](#路由)
- [页面与布局](#页面与布局)
- [组件类型](#组件类型)
- [数据获取](#数据获取)
- [Server Actions](#server-actions)
- [缓存](#缓存)
- [导航](#导航)
- [Metadata](#metadata)
- [API Routes](#api-routes)
- [中间件](#中间件)
- [配置](#配置)

---

## 路由

### 基础路由结构
```
app/
├── page.tsx              # /
├── about/
│   └── page.tsx         # /about
├── blog/
│   ├── page.tsx         # /blog (列表)
│   └── [slug]/
│       └── page.tsx     # /blog/:slug (详情)
└── [...catchAll]/
    └── page.tsx         # /a/b/c/*
```

### 动态路由
```tsx
// app/users/[id]/page.tsx
export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>User ID: {id}</div>;
}

// 可选捕获所有
// app/docs/[[...slug]]/page.tsx
// 匹配: /docs, /docs/a, /docs/a/b
```

### 路由组
```
app/
├── (marketing)/          # URL 中不出现
│   ├── layout.tsx
│   ├── about/page.tsx   # /about
│   └── pricing/page.tsx # /pricing
└── (dashboard)/
    ├── layout.tsx
    └── overview/page.tsx # /overview
```

### 并行路由 (@folder)
```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,  // @modal
  sidebar, // @sidebar
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <div>
      {sidebar}
      {children}
      {modal}
    </div>
  );
}
```

---

## 页面与布局

### 基础页面
```tsx
// app/page.tsx
export default function HomePage() {
  return <h1>Hello Next.js</h1>;
}

// 带 metadata
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to my site',
};
```

### 基础布局
```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 嵌套布局
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Loading 状态
```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}
```

### Error 边界
```tsx
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 404 页面
```tsx
// app/not-found.tsx
export default function NotFound() {
  return <div>Page not found</div>;
}

// 在页面中触发
import { notFound } from 'next/navigation';

if (!data) notFound();
```

---

## 组件类型

### Server Component (默认)
```tsx
// 直接访问数据库、文件系统等
// 不能使用 hooks 和浏览器 API

export default async function ServerComponent() {
  const data = await fetchData(); // 服务端获取
  return <div>{data.name}</div>;
}
```

### Client Component
```tsx
'use client';

import { useState } from 'react';

export default function ClientComponent() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 混合模式
```tsx
// Server Component
import { ClientButton } from './client-button';

export default async function Page() {
  const data = await fetchData();
  return (
    <div>
      <h1>{data.title}</h1>
      <ClientButton initialData={data} />
    </div>
  );
}
```

---

## 数据获取

### Server Component 获取
```tsx
export default async function Page() {
  // 自动缓存
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();

  return <div>{data.name}</div>;
}
```

### 缓存控制
```tsx
// 不缓存 (SSR)
fetch(url, { cache: 'no-store' });

// 永久缓存 (SSG)
fetch(url, { cache: 'force-cache' });

// ISR - 60秒重新验证
fetch(url, { next: { revalidate: 60 } });

// 按标签缓存
fetch(url, { next: { tags: ['products'] } });
```

### 多个请求
```tsx
// 自动并行
const [users, posts] = await Promise.all([
  fetch('/api/users').then(r => r.json()),
  fetch('/api/posts').then(r => r.json()),
]);
```

### Client Component 获取
```tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <ul>{data.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

---

## Server Actions

### 基础 Action
```tsx
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  await db.user.create({ data: { name, email } });

  revalidatePath('/users');
}

// 页面中使用
import { createUser } from './actions';

export default function Form() {
  return (
    <form action={createUser}>
      <input name="name" />
      <input name="email" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### 带验证的 Action
```tsx
'use server';

import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function createUser(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // 处理数据...
  return { success: true };
}
```

### useActionState (React 19)
```tsx
'use client';

import { useActionState } from 'react';
import { createUser } from './actions';

export function Form() {
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <form action={formAction}>
      <input name="name" />
      {state?.errors?.name && <span>{state.errors.name}</span>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

---

## 缓存

### 页面级别
```tsx
// 强制动态渲染
export const dynamic = 'force-dynamic';

// 强制静态生成
export const dynamic = 'force-static';

// 重新验证时间 (ISR)
export const revalidate = 60;
```

### 手动失效
```tsx
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateData() {
  // 更新数据库...

  // 失效整个路径
  revalidatePath('/dashboard');

  // 失效带标签的请求
  revalidateTag('products');
}
```

### 缓存 API
```tsx
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async () => {
    return await fetchExpensiveData();
  },
  ['data-cache-key'],
  { revalidate: 3600, tags: ['data'] }
);
```

---

## 导航

### Link 组件
```tsx
import Link from 'next/link';

// 基础用法
<Link href="/about">About</Link>

// 带样式
<Link href="/about" className="text-blue-500">
  About
</Link>

// 替换当前历史记录
<Link href="/about" replace>About</Link>

// 预加载
<Link href="/about" prefetch={false}>About</Link>

// 滚动到锚点
<Link href="/about#section">About</Link>

// 动态路由
<Link href={`/users/${user.id}`}>{user.name}</Link>
```

### 编程式导航
```tsx
'use client';

import { useRouter } from 'next/navigation';

export default function Button() {
  const router = useRouter();

  return (
    <button onClick={() => router.push('/dashboard')}>
      Go to Dashboard
    </button>
  );
}
```

### 其他导航方法
```tsx
const router = useRouter();

router.push('/path');        // 导航到新页面
router.replace('/path');     // 替换当前页面
router.back();               // 返回
router.forward();            // 前进
router.refresh();            // 刷新当前页面（软刷新）
```

---

## Metadata

### 静态 Metadata
```tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Site',
  description: 'Welcome to my site',
  keywords: ['nextjs', 'react'],
  authors: [{ name: 'John' }],

  openGraph: {
    title: 'My Site',
    description: 'Welcome',
    url: 'https://example.com',
    siteName: 'My Site',
    images: ['/og.png'],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'My Site',
    images: ['/twitter.png'],
  },

  robots: {
    index: true,
    follow: true,
  },
};
```

### 动态 Metadata
```tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.image],
    },
  };
}
```

### 模板和默认
```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | My Site',  // 子页面: "About | My Site"
    default: 'My Site',        // 默认标题
  },
};
```

---

## API Routes

### 基础 CRUD
```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/users
export async function GET() {
  const users = await db.user.findMany();
  return NextResponse.json(users);
}

// POST /api/users
export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

### 动态路由
```tsx
// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const user = await db.user.update({
    where: { id },
    data: body,
  });
  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.user.delete({ where: { id } });
  return NextResponse.json(null, { status: 204 });
}
```

### 处理 FormData
```tsx
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // 处理文件上传...

  return NextResponse.json({ success: true });
}
```

---

## 中间件

### 基础中间件
```tsx
// middleware.ts (项目根目录或 src/)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 检查认证
  const token = request.cookies.get('token')?.value;

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
};
```

### 重写和重定向
```tsx
export function middleware(request: NextRequest) {
  // 重定向
  if (request.nextUrl.pathname === '/old') {
    return NextResponse.redirect(new URL('/new', request.url));
  }

  // 重写 (URL 不变)
  if (request.nextUrl.pathname.startsWith('/blog')) {
    const newUrl = new URL(request.url);
    newUrl.pathname = '/api/blog' + request.nextUrl.pathname;
    return NextResponse.rewrite(newUrl);
  }

  return NextResponse.next();
}
```

### i18n 中间件
```tsx
import { NextResponse } from 'next/server';

const locales = ['en', 'zh', 'ja'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 检查是否已有语言前缀
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return NextResponse.next();

  // 检测用户语言
  const locale = request.headers.get('accept-language')?.split(',')[0].split('-')[0]
    || defaultLocale;

  // 重定向到带语言前缀的 URL
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}
```

---

## 配置

### next.config.js
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片域名配置
  images: {
    domains: ['example.com', 'cdn.example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },

  // 重定向
  async redirects() {
    return [
      {
        source: '/old',
        destination: '/new',
        permanent: true,
      },
    ];
  },

  // 重写
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://external-api.com/:path*',
      },
    ];
  },

  // 头信息
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },

  // 实验性功能
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
```

---

## 常用工具函数

### 延迟函数
```tsx
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

### 格式化日期
```tsx
import { format } from 'date-fns';

format(new Date(), 'yyyy-MM-dd');
```

### 构建绝对 URL
```tsx
function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
```

---

## 快速命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run dev -- -p 4000  # 指定端口

# 构建
npm run build        # 生产构建
npm run start        # 启动生产服务器

# 检查
npm run lint         # ESLint 检查
npx next lint --fix  # 自动修复

# 类型检查
npx tsc --noEmit
```
