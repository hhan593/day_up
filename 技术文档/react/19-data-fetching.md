# 19. React 数据流与取数

> 来源可信度：**官方文档确认**（基于 React 19 `use`、Suspense、缓存；与 `06-queueing-state-updates.md`/`15-suspense-concurrency.md` 衔接）

## 1. 客户端取数：useEffect vs 库

```tsx
// 老方式
useEffect(() => { fetch('/api').then(r => r.json()).then(setData); }, []);

// 现代：React Query / SWR
const { data, isLoading } = useQuery({ queryKey: ['user'], queryFn: getUsers });
```

- React Query/SWR 提供缓存、重试、后台刷新、竞态处理。

## 2. use() 读 Promise / Context

```tsx
import { use } from 'react';

function Comments({ promise }: { promise: Promise<Data[]> }) {
  const data = use(promise); // 在 Client Component 中 await Promise
  return <ul>{data.map(d => <li>{d.text}</li>)}</ul>;
}
```

- `use` 可在渲染中直接读 Promise/Context，配合 Suspense 自动挂起。

## 3. 服务端取数（RSC）

```tsx
// Server Component 直接 async 取，无需 useEffect
async function Page() {
  const data = await fetch('https://api...').then(r => r.json());
  return <List data={data} />;
}
```

- 与 `17-server-components.md` 一致：服务端取数走 RSC，客户端用 React Query 做交互刷新。

## 4. 请求去重与缓存

- RSC 中 `fetch` 默认带缓存（见 Next `13-caching.md`）。
- 客户端 React Query 用 `queryKey` 去重与共享。

## 5. 乐观更新

```tsx
const qc = useQueryClient();
function mutate() {
  qc.setQueryData(['todos'], old => [...old, newTodo]); // 先乐观
  api.add(newTodo).catch(() => qc.invalidateQueries(['todos']));
}
```

## 6. 一句话总结

> 取数：服务端用 RSC 直接 async，客户端用 React Query/SWR 管缓存竞态，React 19 `use` 在渲染读 Promise。乐观更新靠 setQueryData + 失败回滚。
