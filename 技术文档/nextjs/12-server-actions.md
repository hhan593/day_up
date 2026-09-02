# Next.js Server Actions 与表单

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions，实为 Guides: Forms，2026-08-25）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、'use server' 指令

Server Actions 是运行在服务端的 Server Function。函数顶部加 `'use server'` 即可标记（文件级也行）。

```ts
export async function createInvoice(formData: FormData) {
  'use server';
  // mutate data
}
```

---

## 二、Action 函数

- `<form action={actionFn}>`：React 自动把 `FormData` 作为首个参数传入。
- 用 `formData.get('field')` 或 `Object.fromEntries(formData)` 提取。

```tsx
// app/invoices/page.tsx（Server Component）
export default function Page() {
  async function createInvoice(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const raw = { customerId: formData.get('customerId'), amount: formData.get('amount') };
    // mutate + revalidate
  }
  return <form action={createInvoice}>...</form>;
}
```

> ⚠️ 即使表单渲染在已认证页，每个 Server Action 内**必须单独验证权限**。

### 传递额外参数
- `bind`：`const fn = updateUser.bind(null, userId)`，支持渐进增强。
- 或隐藏字段 `<input type="hidden" name="userId" value={userId} />`（值暴露 HTML）。

---

## 三、useActionState（校验错误展示）

需展示错误时，把含 `<form>` 的组件转 Client Component：

```tsx
'use client';
import { useActionState } from 'react';
const initialState = { message: '' };
export function Signup() {
  const [state, formAction, pending] = useActionState(createUser, initialState);
  return (
    <form action={formAction}>
      <input type="text" name="email" required />
      <p aria-live="polite">{state?.message}</p>
      <button disabled={pending}>Sign up</button>
    </form>
  );
}
```

- Action 签名变为 `(prevState, formData)`；
- `pending` 禁用按钮/显示加载；或 `useFormStatus`（React 19 提供 `data`/`method`/`action`）。

### 服务端校验（Zod 示例）
```ts
'use server';
import { z } from 'zod';
export async function createUser(prevState: any, formData: FormData) {
  const v = z.object({ email: z.string().email() }).safeParse({ email: formData.get('email') });
  if (!v.success) return { errors: v.error.flatten().fieldErrors };
  // mutate
}
```

---

## 四、revalidatePath / revalidateTag

修改数据后重新验证缓存：

```ts
'use server';
import { revalidatePath } from 'next/cache';
export async function createInvoice(formData: FormData) {
  // mutate
  revalidatePath('/invoices');
}
```

- `revalidateTag('user')` 按缓存标签失效（与 `fetch` 的 `next.tags` / `use cache` 的 `cacheTag` 配合，见 `13-caching.md`）。

---

## 五、错误处理与其他

- 鉴权失败 `throw Error('Unauthorized')`；校验失败返回 `{ errors }` 经 `useActionState` 回传。
- 乐观更新：`useOptimistic`；嵌套表单 `<button formAction={...}>` 调不同 Action。
- 离线：实验性 `useOffline` 断网时保持 pending，恢复后自动完成。

---

## 小结（Recap）

- `'use server'` 标记服务端函数，可直接作 `<form action>`；
- 校验错误用 `useActionState`（Action 签名 `(prev, formData)`）；
- 改数据后 `revalidatePath`/`revalidateTag` 刷新缓存；
- 每个 Action 内独立鉴权。

---

## 衔接

- 缓存失效：`13-caching.md`
- cookies 设置：`14-server-functions.md`
- Client Component：`11-server-client-components.md`
- 与 React 表单/状态：`技术文档/react`
