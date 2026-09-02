# 18. React 表单与校验

> 来源可信度：**官方文档确认**（基于 React 19 `useActionState`/`useFormStatus`、react-hook-form 官方文档；与 `05-state-and-events.md` 衔接）

## 1. 受控 vs 非受控

```tsx
// 受控（每次按键 setState）
const [v, setV] = useState('');
<input value={v} onChange={e => setV(e.target.value)} />;

// 非受控（ref 取）
const ref = useRef<HTMLInputElement>(null);
<input ref={ref} />; // ref.current.value
```

- 简单用受控；极大量字段/性能敏感用非受控 + `defaultValue`。

## 2. React 19 Actions + useActionState

```tsx
'use client';
import { useActionState } from 'react';

async function submit(prev: {msg:string}, formData: FormData) {
  const name = formData.get('name');
  if (!name) return { msg: 'name required' };
  return { msg: 'ok' };
}

function Form() {
  const [state, formAction, pending] = useActionState(submit, { msg: '' });
  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={pending}>提交</button>
      <p>{state.msg}</p>
    </form>
  );
}
```

- `useActionState`：Action 状态 + 错误 + pending 一体。
- `useFormStatus`：在子组件读父 form 的 pending/数据。

## 3. react-hook-form（库）

```tsx
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm();
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email', { required: true, pattern: /^\S+@\S+$/ })} />
  {errors.email && <span>invalid</span>}
</form>;
```

- 非受控、性能优、校验灵活；与 zod 配合做 schema 校验。

## 4. zod 校验 schema

```ts
import { z } from 'zod';
const Schema = z.object({ email: z.string().email(), age: z.number().min(0) });
Schema.parse(data); // 抛错则校验失败
```

- 前后端共用 schema（见 Next `12-server-actions.md`、Rust `40-serde-internals.md` 对照）。

## 5. 一句话总结

> 表单：受控简单、非受控高效。React 19 用 `useActionState`+`useFormStatus` 原生管理 Action；复杂表单用 react-hook-form + zod 共用校验 schema。
