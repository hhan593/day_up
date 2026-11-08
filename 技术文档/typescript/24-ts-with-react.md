# 24. TS × React/前端框架实战（props / 泛型组件 / hooks 全类型 / Zustand / React Query / R3F）

> 来源可信度：**官方文档确认**（@types/react 18/19 类型定义 + React 官方文档；Zustand/React Query/R3F 各自官方 TS 指南，版本敏感处标注「以官方文档为准」；React 18/19 类型差异逐一标明）
> 关联：`03-everyday-types.md`（interface vs type）、`05-more-on-functions.md`（泛型函数/重载）、`10-modules.md`（import type）、`11-tsconfig.md`（Vite 项目配置）、`17-engineering-tsup-vitest.md`（vitest 测试）、`21-declaration-files.md`（JSX 类型扩展的声明原理）、`23-error-debugging.md`（报错解读）；3D 侧 `Three.js/21-React-Three-Fiber.md`（R3F 用法总览）

## 1. 组件 props 类型：interface vs type 与 children 三兄弟

- 选型口径（`03-everyday-types.md` 的结论在组件场景的应用）：props 优先 `interface`（可被下游 module augmentation 扩展、报错信息更友好）；需要联合/交叉/映射/条件变换时用 `type`。两者混用完全合法，团队统一即可。

```tsx
// components/Button.tsx —— 典型 props 定义
import type { ReactNode } from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button className={`btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
```

- **children 三兄弟差异表**（高频面试题）：

| 类型 | 本质 | 能装什么 | 适用场景 |
|---|---|---|---|
| `React.ReactNode` | 一切可渲染物的**联合超集** | JSX 元素、string、number、boolean、null、undefined、数组、Fragments | 99% 的容器组件 |
| `React.ReactElement` | 一个真实元素对象（type + props + key） | 只能是单个 JSX 元素（不能是字符串/数字/null） | 只接受元素、要 `cloneElement` 加工 children |
| `JSX.Element` | `ReactElement` 的别名（历史上 `ReactElement<any, any>`，19 的类型定义有微调） | 同 ReactElement | 用于**组件返回值**标注，不建议当 children |

```tsx
const a: React.ReactNode = '文本';        // OK
const b: React.ReactNode = null;          // OK
const c: React.ReactElement = '文本';     // 报错 TS2322：ReactElement 只要元素对象
```

## 2. 泛型组件完整实战：List<T>

```tsx
// components/List.tsx —— 泛型组件：items 的类型决定 onSelect/renderItem 的类型
import type { ReactNode } from 'react';

interface ListProps<T> {
  items: T[];
  keyOf: (item: T) => string;
  onSelect?: (item: T) => void;
  renderItem: (item: T) => ReactNode;
}

export function List<T>({ items, keyOf, onSelect, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyOf(item)} onClick={() => onSelect?.(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// App.tsx —— 使用侧：T 从 items 自动推导，onSelect 参数自动变成 User
interface User { id: number; name: string }
const users: User[] = [{ id: 1, name: 'hh' }];

<List
  items={users}                                   // T 推导为 User
  keyOf={(u) => String(u.id)}
  onSelect={(u) => console.log(u.name)}           // u: User，全链路无标注
  renderItem={(u) => <span>{u.name}</span>}
/>;
```

- **.tsx 箭头函数泛型陷阱**：`.tsx` 里 `<T>` 会被 JSX 解析器当成标签，必须加逗号或约束消歧：

```tsx
const List = <T,>(props: ListProps<T>) => { /* ... */ };          // 加逗号
const List2 = <T extends object>(props: ListProps<T>) => { /* ... */ };  // 加 extends
```

## 3. hooks 类型逐个讲透

### 3.1 useState：推断、显式联合、函数式更新

```tsx
const [count, setCount] = useState(0);            // 推断为 number
const [user, setUser] = useState<User | null>(null);  // 显式联合：初始 null 是常态
// setCount(c => c + 1)                           // 函数式更新：基于prevState，避免批处理读旧值
// setUser(u => u ? { ...u, name: 'x' } : u)      // 对象同样函数式
```

- 坑：`useState()` 不带初值 → `T | undefined`；`useState<User>(null)` 直接报 TS2322（null 不在 User 里）——**想存 null 就写进类型** `User | null`。

### 3.2 useReducer：判别联合 action 完整例

```tsx
// reducers/cart.ts —— action 用判别联合，reducer 穷尽所有分支
type CartState = { items: { id: string; qty: number }[] };

type CartAction =
  | { type: 'add'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add':
      return { items: [...state.items, { id: action.id, qty: 1 }] };
    case 'remove':
      return { items: state.items.filter((i) => i.id !== action.id) };
    case 'clear':
      return { items: [] };
    default: {
      const _exhaustive: never = action;   // 漏分支时这里编译报错（04 篇的 never 穷尽法）
      return state;
    }
  }
}

const [state, dispatch] = useReducer(reducer, { items: [] });
dispatch({ type: 'add', id: 'a1' });
// dispatch({ type: 'addd' })   ← 报错 TS2345：action 类型不匹配联合
```

### 3.3 useRef：双签名与 DOM ref 坑

- React 18 的 `@types/react` 是**双签名**（简化）：

```ts
function useRef<T>(initialValue: T): MutableRefObject<T>;        // current 可写
function useRef<T>(initialValue: T | null): RefObject<T>;        // current 只读（DOM 用途）
function useRef<T = undefined>(): MutableRefObject<T | undefined>;
```

```tsx
const inputRef = useRef<HTMLInputElement>(null);   // RefObject<HTMLInputElement>：挂 DOM
<input ref={inputRef} />;
inputRef.current?.focus();                         // 必须可空访问——挂载前是 null

const timerRef = useRef<number | undefined>(undefined);  // 存 setInterval id：可变容器
timerRef.current = window.setInterval(tick, 1000);
```

- React 19 的类型重构：`useRef` 要求**必须传初始值**，返回统一的 `RefObject` 且 `current` 可写；`useRef<HTMLInputElement>(null)` 得到 `RefObject<HTMLInputElement | null>`，使用姿势不变（差异细节以 @types/react 19 为准）。
- 坑：`useRef<number>()` 不传参在 19 会报「Expected 1 arguments」；把「可变容器」与「DOM ref」混用语义会让可空性判断变乱——按用途分开声明。

### 3.4 useMemo / useCallback：返回类型自动推断

```tsx
const sorted = useMemo(() => [...users].sort(byName), [users]);   // 推断为 User[]，不要手动标注
const onClick = useCallback((id: string) => del(id), [del]);      // 推断为 (id: string) => void
```

- 手动标注返回值仅在「推断出宽类型」（如空数组 `never[]`）时需要：`useMemo<User[]>(() => [], [])`。

### 3.5 useEffect 清理函数类型限制

```tsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);      // 清理函数只能是 () => void | undefined
}, []);
```

- `@types/react` 用一个品牌技巧从类型上禁止你返回别的值（源码示意，以实际类型定义为准）：

```ts
type EffectCallback = () => void | Destructor;
type Destructor = () => void | { [UNDEFINED_VOID_ONLY]: never };
// useEffect(() => fetch('/x'))  ← 报错：返回的 Promise 不能当清理函数，提醒你补 async 分离
```

## 4. 事件处理与 React.FC 的历史复盘

- JSX 属性自带事件类型，**内联回调无需标注**；抽成具名函数才需要显式类型：

```tsx
<input onChange={(e) => setText(e.target.value)} />        // e 自动推导：ChangeEvent<HTMLInputElement>
<form onSubmit={(e) => { e.preventDefault(); submit(); }}>  // FormEvent<HTMLFormElement>

const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => { ... };  // 抽函数才标注
```

- 常用事件泛型速查：`ChangeEvent<T>`（input/select/textarea）、`FormEvent<T>`、`MouseEvent<T>` / `React.MouseEvent<T>`、`KeyboardEvent<T>`、`PointerEvent<T>`；原生事件监听（addEventListener）用 **DOM** 的 `Event` 家族而非 React 的。
- **不用 `React.FC` 的历史原因**（面试常问）：
  1. `@types/react` ≤ 17 时代 FC **隐式包含 `children: ReactNode`**——任何组件都能塞 children，类型上失去约束；
  2. 泛型组件写 `FC<Props<T>>` 会导致泛型参数在组件签名上丢失，泛型组件基本与 FC 无缘；
  3. 早期 FC 附带 `displayName` 等静态属性噪音。
- **2026 复盘**：18 的类型定义已移除隐式 children，FC 的三大历史包袱去其二；社区默认仍是**直接写普通函数**（入参即 props、返回 JSX），FC 可用于想强制约束 props 形状的场景；泛型组件依旧不要用 FC 包。

## 5. forwardRef 与泛型组件的 ref

```tsx
// 18 的经典写法：forwardRef 把 ref 转发到内部 DOM
import { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(props, ref) {
    return <input ref={ref} {...props} />;
  }
);
// 使用：<Input ref={inputRef} />  —— inputRef 类型为 RefObject<HTMLInputElement>
```

- **React 19 简化**：函数组件可直接把 `ref` 当普通 prop 声明（`function Input({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> })`），`forwardRef` 仍可用但不再是必需（以 React 19 官方文档为准）。
- **泛型组件 + ref 的坑**：`forwardRef` 包住泛型组件会**吞掉泛型推导**（`forwardRef<HTMLInputElement, ListProps<T>>` 里 T 无法在使用处推导）。可行解：泛型函数内部再包一层，或直接声明 `ref` prop（19），或用 `ComponentProps` 技巧保留泛型——按 React 19 文档推荐姿势写即可，18 项目遇到就接受「泛型组件暂时不走 ref」的折中。

## 6. Context 类型模式：createContext<T | null>(null) + 自定义 hook 收窄

```tsx
// context/UserContext.tsx —— 标准模式
import { createContext, useContext, type ReactNode } from 'react';

interface User { id: number; name: string }

const UserContext = createContext<User | null>(null);   // 判空防「忘包 Provider 拿到静默 undefined」

export function UserProvider({ user, children }: { user: User; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): User {
  const ctx = useContext(UserContext);
  if (ctx === null) {
    throw new Error('useUser 必须在 <UserProvider> 内使用');   // 运行时兜底 + 类型收窄
  }
  return ctx;   // 此处 User（非空），调用方永远拿到可用值
}
```

- 要点：初值 `null` 显式写进泛型（`User | null`），在自定义 hook 里 throw 收窄——**消费方类型干净，忘包 Provider 时报错明确**；这比 `createContext<User>(undefined as never)` 的自欺安全得多。

## 7. Zustand 的 `create<Store>()(...)` currying 陷阱

```tsx
// stores/useCart.ts —— 正确写法：create<Store>()(fn) 两段调用
import { create } from 'zustand';

interface CartStore {
  items: string[];
  count: number;
  add: (id: string) => void;
}

export const useCartStore = create<CartStore>()((set) => ({
  items: [],
  count: 0,
  add: (id) => set((s) => ({ items: [...s.items, id], count: s.count + 1 })),
}));
```

- **为什么中间多一层 `()`**：根因是 TS **不支持部分类型参数推断**——当 `create` 还要接收 middleware 相关的第二个类型参数（如 `persist`/`devtools` 的 mutator 元组）时，你一旦显式给了 `Store`，就必须把**所有**类型参数写全，而 mutator 参数你根本不想手写；currying 把「显式指定 Store」拆到第一段，让第二段的 middleware 参数全部自动推断。这是 zustand 官方 TS 指南的标准姿势（细节以其文档为准）。
- 直接 `create<CartStore>((set) => ...)` 在「无 middleware」时能跑，一旦引入 middleware 立刻推断失效（`count` 等字段变 unknown / 报 TS2322）——这就是「中间类型参数导致推断失效」的体感。
- 顺带记住 `.tsx` 通用陷阱：无参箭头泛型 `<T>() => ...` 必须写 `<T,>`（第 2 章），与 zustand 的 currying 是两个不同问题。

## 8. React Query 的 useQuery 泛型与 select 推导

```tsx
// v5 唯一的对象签名写法（v4 的元组重载已移除，以官方迁移文档为准）
import { useQuery } from '@tanstack/react-query';

interface User { id: number; name: string }

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('fetch failed');
  return res.json() as Promise<User[]>;   // 真正的运行时保证要 zod parse（23 篇第 12 章）
}

const { data: names } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,                              // 决定 data 的类型：User[]
  select: (users) => users.map((u) => u.name),      // select 输出决定最终 data：string[]
});
console.log(names);   // string[] | undefined（加载中为 undefined）
```

- 推导链：`queryFn` 的返回类型 → `data` 主类型；`select` 的返回类型 → 组件里实际拿到的 `data` 类型；`error` 默认 `Error`，可整体指定（以 v5 文档为准）。
- 注意：`data` 在成功前是 `undefined`——配合 `isEnabled`/`status` 收窄，别用 `!` 硬断言。

## 9. Three.js 生态衔接：R3F 的 three 元素 JSX 类型声明原理

React-Three-Fiber 让你直接写 `<mesh>`、`<ambientLight>` 这些 three 标签，而 React 的 JSX 里**根本没有**这些元素名——这靠的正是 `21-declaration-files.md` 第 7 章的 **module augmentation** 机制：

- **原理**：TS 检查 JSX 标签时查 `IntrinsicElements` 接口。React 18 里它是全局 `JSX.IntrinsicElements`；React 19 起收编进 `React.JSX`（全局 JSX 命名空间被弃用）。R3F 把 three 的类（`THREE.Mesh`、`THREE.AmbientLight`…）首字母小写后批量注册进该接口。
- **版本差异**（以 @react-three/fiber 迁移文档为准）：v8 直接 `declare global { namespace JSX { interface IntrinsicElements extends ThreeElements {} } }`；v9 配合 React 19 改为扩充 `React.JSX.IntrinsicElements`，并导出 `ThreeElements` 接口作为元素类型登记表。
- **自定义 three 元素**（v9 风格示意）：

```tsx
// types/r3f-custom.d.ts —— 把自定义 three 类注册成 JSX 标签
import type { ThreeElement } from '@react-three/fiber';
import { MyFancyMesh } from './MyFancyMesh';   // extends THREE.Mesh 的自定义类

declare module '@react-three/fiber' {
  interface ThreeElements {
    myFancyMesh: ThreeElement<typeof MyFancyMesh>;
  }
}
// 之后 <myFancyMesh /> 通过类型检查，props 由类的构造参数推导
```

> R3F 的使用总览（Canvas/useFrame/args/drei）见 `Three.js/21-React-Three-Fiber.md`；声明合并的底层规则见 `21-declaration-files.md` 第 7 章——「库为什么知道你没见过的标签」这一题到此闭环。

## 10. Vite 项目的 TS 配置要点

- 脚手架默认双 tsconfig：`tsconfig.json`（引用壳）+ `tsconfig.app.json`（源码，含 DOM lib）+ `tsconfig.node.json`（vite.config.ts 这类 Node 环境），细节见 `11-tsconfig.md`。
- 关键项速查：
  1. `vite-env.d.ts` 里的 `/// <reference types="vite/client" />` 注入 `import.meta.env` 等全局类型（`21-declaration-files.md` 第 4 章）；
  2. `moduleResolution: "bundler"` 匹配 Vite 的打包解析（`10-modules.md`）；
  3. `verbatimModuleSyntax` 强制 `import type` 分离类型导入——配合 esbuild/Vite 的「不分析类型」转译（`20-tsx-and-runtime.md` 的擦除逻辑同理）；
  4. 环境变量声明：`interface ImportMetaEnv { VITE_API: string }` 写进 `vite-env.d.ts`，`import.meta.env.VITE_API` 即有类型。
- 类型门禁与构建分工：`tsc --noEmit` 只查类型；Vite/esbuild 只转译不检查——两边都要进 CI（`17-engineering-tsup-vitest.md`）。

## 11. 一句话总结

> React + TS 的主线是「类型顺着数据流走」：props 用 interface 定形状（children 选 ReactNode 超集，ReactElement 留给要加工元素的少数场景），泛型组件让 `items: T[]` 一路推导到 `onSelect: (item: T) => void`；hooks 各有要点——useState 显式联合管 null、useReducer 用判别联合 + never 穷尽、useRef 分清「可变容器」与「DOM 只读」双签名（19 统一为可写 RefObject）、useEffect 清理函数在类型层被禁 return 其他值；React.FC 的隐式 children 历史包袱 18 已卸下，但泛型组件依旧绕开它；ref 转发在 19 退化为普通 prop，泛型组件配 ref 是经典推导陷阱；Context 用 `createContext<T | null>(null)` + 自定义 hook throw 收窄；Zustand 的 `create<Store>()(...)` currying 是为绕开「部分类型参数推断不支持」，React Query 的 data 类型由 queryFn 与 select 两段接力；R3F 的 `<mesh>` 标签靠 module augmentation 注册进 JSX.IntrinsicElements（v9 后是 React.JSX + ThreeElements）——和 Vite 的 vite-env.d.ts 一样，都是 21 篇声明文件机制的实战落地。
