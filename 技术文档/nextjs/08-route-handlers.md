# Next.js 路由处理程序（Route Handlers / route.js）

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/api-reference/file-conventions/route，2026-04-30）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、概述

Route Handlers 允许用 Web `Request` / `Response` API 为指定路由创建自定义请求逻辑。在 `app` 目录下创建 `route.js` / `route.ts` 即可。

---

## 二、HTTP 方法处理函数

支持导出：`GET` `POST` `PUT` `PATCH` `DELETE` `HEAD` `OPTIONS`。

```ts
// app/api/route.ts
export async function GET() {
  return Response.json({ message: 'Hello World' });
}
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ received: body });
}
```

- 未定义 `OPTIONS` 时，Next.js 自动实现并设置 `Allow` 响应头。

---

## 三、NextRequest / NextResponse

- `NextRequest`：Web `Request` 扩展，提供 `request.nextUrl`、`request.cookies` 等。
- 返回用标准 Web `Response`（`Response.json()` / `new Response()`）；`NextResponse` 用于重定向/头设置。

```ts
import type { NextRequest } from 'next/server';
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
}
```

---

## 四、动态路由参数

- 通过文件夹 `[param]` 定义，在处理函数第二参数 `params`（**Promise**）中 await。

```ts
// app/items/[slug]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
}
```

| 路由文件 | 示例 URL | params |
|---|---|---|
| app/items/[slug]/route.ts | /items/a | `{ slug: 'a' }` |
| app/blog/[...slug]/route.ts | /blog/1/2 | `{ slug: ['1','2'] }` |

- 类型助手（无需导入，由 next dev/build 生成）：`RouteContext<'/users/[id]'>`。

---

## 五、读取/设置 Cookie

```ts
import { cookies } from 'next/headers';
export async function GET() {
  const cookieStore = await cookies();
  const a = cookieStore.get('a');     // 读
  cookieStore.set('b', '1');          // 写（仅 Server Action/Route Handler）
  cookieStore.delete('c');            // 删
}
```

- 也可从 `NextRequest.cookies` 读；通过响应头 `Set-Cookie` 写（见 `14-server-functions.md`）。

---

## 六、CORS

```ts
export async function GET(request: Request) {
  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

---

## 七、流式响应（Streaming）

常用于 LLM 流式输出。底层用 Web `ReadableStream`：

```ts
function iteratorToStream(iterator: any) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) controller.close();
      else controller.enqueue(value);
    },
  });
}
export async function GET() {
  return new Response(iteratorToStream(makeIterator()));
}
```

---

## 八、版本历史

- v13.2.0：引入 Route Handlers；
- v15.0.0-RC：`params` 改为 Promise；GET 默认缓存由静态改为动态。

---

## 小结（Recap）

- route.js 用 Web Request/Response 写 API；
- 方法导出函数；`params` 是 Promise；
- 多路由统一 CORS 建议用 `proxy.ts` 或 `next.config.js`。

---

## 衔接

- 中间件：`09-proxy-middleware.md`
- 服务端函数 cookies：`14-server-functions.md`
- 缓存配置：`13-caching.md`
