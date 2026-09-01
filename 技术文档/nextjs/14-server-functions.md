# Next.js 服务端函数：cookies() 与 headers()

> 来源：Next.js 官方文档
> - Functions: cookies（https://nextjs.org/docs/app/api-reference/functions/cookies，2026-06-09）
> - Functions: headers（https://nextjs.org/docs/app/api-reference/functions/headers，2026-06-09）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、cookies()（从 next/headers）

异步函数，读取入站请求 cookie；在 Server Function / Route Handler 中可读写。

```ts
import { cookies } from 'next/headers';
export default async function Page() {
  const cookieStore = await cookies();
  const theme = cookieStore.get('theme');
}
```

### 只读 vs 可读写

| 场景 | 能力 |
|---|---|
| Server Components | **只读**（get/getAll/has/toString），不能 set/delete（流式开始后 HTTP 不允许设 cookie） |
| Server Functions / Route Handlers | **可读写**（可 set/delete） |

### 方法
`get(name)` / `getAll()` / `has(name)` / `set(name, value, options)` / `delete(name)` / `toString()`

### set 的 options
`expires`(Date)、`maxAge`(秒)、`domain`、`path`(默认 '/')、`secure`、`httpOnly`、`sameSite`、`priority`、`partitioned`。

### 写入示例（Server Action）
```ts
'use server';
import { cookies } from 'next/headers';
export async function create(data) {
  const store = await cookies();
  store.set('name', 'lee', { httpOnly: true, path: '/' });
}
```

### 删除三种方式
```ts
store.delete('name');           // 方法
store.set('name', '');          // 同名空值
store.set('name', 'v', { maxAge: 0 }); // maxAge 0
```

### 注意
- ⚠️ v15+ 异步，须 `await`/`use`；旧同步用法将弃用。
- 在 layout/page 调用会令路由 opt-in 动态渲染。
- Cache Components 中 `<Suspense>` 外调用 `cookies()` 会阻预渲染。

---

## 二、headers()（从 next/headers）

异步函数，读取入站请求头（**只读**）。

```ts
import { headers } from 'next/headers';
export default async function Page() {
  const userAgent = (await headers()).get('user-agent');
}
```

### 方法（标准 Web Headers）
`get(name)` / `has(name)` / `entries()` / `forEach()` / `keys()` / `values()`

### 只读特性
- ⚠️ **不能** set/delete 出站头；需转发时手动读取值放入 `fetch` 的 `headers` 配置。

```ts
const authorization = (await headers()).get('authorization');
const res = await fetch('...', { headers: { authorization } });
```

### 动态渲染影响
- 属于 Request-time API，使用即令路由**自动动态渲染**。
- Cache Components 中 `<Suspense>` 外调用 `headers()` 可能触发 `Next.js encountered runtime data during prerendering` 错误。

### 注意
- ⚠️ v15+ 异步，须 `await`/`use`。

---

## 三、cookies vs headers 对照

| API | 返回 | 可写 | 引起动态渲染 |
|---|---|---|---|
| cookies() | Web `Headers` 式 store（异步） | Server Func/Route Handler 可写 | 是 |
| headers() | 只读 Web `Headers`（异步） | 否 | 是 |

---

## 小结（Recap）

- 二者均 v15+ 异步，须 await；
- cookies 在 Server Component 只读、在 Server Action/Route Handler 可读写；
- headers 始终只读；
- 使用二者即触发动态渲染。

---

## 衔接

- Route Handler：`08-route-handlers.md`
- proxy 中间件设 Cookie/头：`09-proxy-middleware.md`
- 缓存：`13-caching.md`（use cache 内禁止调用二者）
- Server Component：`11-server-client-components.md`
