# Next.js 缓存体系（旧模型 + Cache Components 新模型）

> 来源：Next.js 官方文档
> - Caching (Previous Model)（https://nextjs.org/docs/app/building-your-application/caching，2026-08-25）
> - Directives: use cache（https://nextjs.org/docs/app/api-reference/directives/use-cache，2026-08-25）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

> ⚠️ **模型差异**：Next.js 16 引入 **Cache Components**（需 `cacheComponents: true` 开启），带来 `use cache` 新指令。下文分「旧模型」与「新模型」两部分。

---

## 一、旧模型（未开 cacheComponents）

### 1. fetch 缓存
- 默认 `fetch` **不缓存**；需缓存时 `cache: 'force-cache'` 或 `next: { revalidate: 3600 }`。

```ts
const data = await fetch('https://...', { next: { revalidate: 3600 } });
```

### 2. 非 fetch 缓存（unstable_cache）
```ts
import { unstable_cache } from 'next/cache';
export const getCachedUser = unstable_cache(
  async (id: string) => db.select().from(users).where(eq(users.id, id)).then(r => r[0]),
  ['user'],
  { tags: ['user'], revalidate: 3600 }
);
```

### 3. 路由段配置
- `dynamic`：`'auto' | 'force-dynamic' | 'force-static' | 'error'`
- `revalidate`：`false`(默认/Infinity)、`0`(总是动态)、`number`(秒)——**须静态常量**，整路由取最小值。
- `fetchCache`：覆盖段内所有 fetch 缓存选项（高级）。

### 4. 按需重新验证
```ts
import { revalidateTag, revalidatePath } from 'next/cache';
revalidateTag('user');      // 按标签
revalidatePath('/profile'); // 按路径
```

### 5. 请求去重
```ts
import { cache } from 'react';
export const getPost = cache(async (id: string) => { /* ... */ });
```

---

## 二、新模型（Cache Components，`use cache`）

### 启用
```ts
// next.config.ts
const nextConfig: NextConfig = { cacheComponents: true };
```

### 'use cache' 指令
- 可用在函数、组件、文件顶部；被标记必须 `async`。
- 缓存键 = Build ID + Function ID + 可序列化参数 + HMR hash。
- 默认内存 LRU 存储，可贡献预渲染静态壳。

```ts
async function getData() {
  'use cache';
  return (await fetch('https://api.example.com/data')).json();
}
```

### 限制
- ⚠️ **请求级 API 禁止**：`cookies()`/`headers()`/`searchParams` 不能在 `use cache` 内或其后调用栈使用；应在外部读取后作为参数传入。
- 参数/返回值有序列化限制（支持 primitive/plain object/Date/Map/Set/JSX，不支持 class 实例/function/Symbol/URL）。
- passthrough：`children`/`Server Action` 可透传但不得内部分解。

### cacheLife（生命周期）
```ts
import { cacheLife } from 'next/cache';
async function getData() {
  'use cache';
  cacheLife('hours'); // 内置 profile：'default'/'hours'/'max'
  return (await fetch('https://api.example.com/data')).json();
}
```
- 默认 profile：client stale 5m、server revalidate 15m、expire 永不过。

### cacheTag + updateTag/revalidateTag
```ts
import { cacheTag, updateTag } from 'next/cache';
async function getProducts() {
  'use cache';
  cacheTag('products');
  return (await fetch('https://api.example.com/products')).json();
}
'use server'
export async function updateProduct() {
  await db.products.update(/* ... */);
  updateTag('products'); // 失效
}
```

### 入口点
- page/layout 文件顶部加 `'use cache'` 即整文件缓存；
- 每个路由段（page/layout/parallel slot）独立入口、独立缓存；
- 要预渲染整路由，需对 page、layout 及所有 parallel 槽均加 `'use cache'`。

### 调试
- `NEXT_PRIVATE_DEBUG_CACHE=1` 开详细日志；
- 构建挂起（50s 超时）：在 `use cache` 外创建、内 await 的 runtime Promise 导致，应提前 await 传值。

---

## 三、两模型对照

| 维度 | 旧模型 | 新模型（use cache） |
|---|---|---|
| 标记 | fetch options / `unstable_cache` | `'use cache'` 指令 |
| 失效 | revalidateTag/revalidatePath | cacheTag + updateTag/revalidateTag |
| 组件缓存 | 不支持整组件缓存 | 支持组件级缓存 |
| 请求 API | fetch 内置 | 禁止 cookies/headers 在缓存内 |

---

## 小结（Recap）

- 旧模型用 fetch `next.revalidate` + `unstable_cache` + 段配置；
- 新模型用 `'use cache'` + `cacheLife` + `cacheTag`，开启 `cacheComponents`；
- `use cache` 内禁止请求级 API，需外部读参传入。

---

## 衔接

- Server Actions 失效：`12-server-actions.md`
- 服务端函数：`14-server-functions.md`
- 配置：`15-next-config.md`
