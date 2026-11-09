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

## 11. 组件设计模式类型：Compound Components / render props / polymorphic

### 11.1 Compound Components：泛型 Context + 子组件类型

```tsx
// components/Tabs.tsx —— <Tabs> 定 T，<Tab> 独立声明，靠 Context 串联
import { createContext, useContext, type ReactNode } from 'react';

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  children: ReactNode;
}

interface TabProps { value: string; children: ReactNode }   // 先用 string，hook 处再收窄

interface TabsContextValue {
  current: string | null;
  register: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs<T extends string>({ value, onChange, children }: TabsProps<T>) {
  return (
    <TabsContext.Provider
      value={{ current: value, register: (v: string) => onChange(v as T) }}   // 唯一断言点
    >
      <div role="tablist">{children}</div>
    </TabsContext.Provider>
  );
}

export function Tab({ value, children }: TabProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('<Tab> 必须在 <Tabs> 内使用');   // 与第 6 章同款运行时兜底
  return (
    <button role="tab" aria-selected={ctx.current === value} onClick={() => ctx.register(value)}>
      {children}
    </button>
  );
}
```

```tsx
// App.tsx —— 使用侧
const [tab, setTab] = useState<'a' | 'b'>('a');
<Tabs value={tab} onChange={setTab}>
  <Tab value="a">A</Tab>
  <Tab value="b">B</Tab>
  {/* <Tab value="c">C</Tab>  ← value 是 string，TS 拦不住 'c'！ */}
</Tabs>
```

- 核心矛盾：`createContext` 是**模块级单例**，泛型在 define 时就固定；而 `T` 属于**每次渲染的实例**——所以没法直接写 `createContext<TabsContextValue<T>>`。通行解是「Context 值域放宽、Provider 处泛型强约束 props、hook 处断言收窄」（Radix 内部同思路，以其实际实现为准），全链路只留一处显式断言点。
- 想让 `<Tab value="c">` 编译期报错，只能放弃子组件独立声明，改走 **items 配置式 / render props**（第 2 章 `List<T>` 即此路线）——组合度与类型安全不可兼得，这是设计取舍线，不是类型技巧问题。

### 11.2 render props：children 即函数

```tsx
// components/MouseTracker.tsx
import { useState, type ReactNode } from 'react';

interface MouseTrackerProps {
  render: (pos: { x: number; y: number }) => ReactNode;   // 具名 render prop
}

export function MouseTracker({ render }: MouseTrackerProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <div onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}>
      {render(pos)}
    </div>
  );
}
// 使用：<MouseTracker render={(p) => <span>{p.x},{p.y}</span>} />

// children 即函数的变体——类型完全一样，只是位置换成 children：
interface FuncChildrenProps<T> {
  items: T[];
  children: (item: T, index: number) => ReactNode;
}
```

- 类型要点：render props 的类型安全就是把**回调签名**写进 props——组件作者决定回调查到什么参数，编译器负责向使用侧传导。相比 HOC，它没有包装层类型拼接的噩梦（`ComponentProps<typeof Wrapped>` 层层交叉），是更推荐的抽象方式。

### 11.3 Polymorphic 组件：as 泛型的完整实现

目标：`<Text as="a" href="/x">` 渲染成 `<a>` 且**只接受 a 合法的属性**，`as="button"` 时自动换成 button 的属性集。

```tsx
// components/Text.tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type OwnProps = { color?: 'primary' | 'secondary'; children?: ReactNode };

// as 的合法值 = 任何 JSX 元素类型；属性集 = OwnProps + 该元素自己的 props（去掉与 OwnProps 的冲突键）
type PolymorphicProps<C extends ElementType> =
  OwnProps & { as?: C } & Omit<ComponentPropsWithoutRef<C>, keyof OwnProps | 'as'>;

// 组件签名：C 从 as 推导，默认 'span'
type TextComponent = <C extends ElementType = 'span'>(
  props: PolymorphicProps<C>
) => ReactNode;

export const Text: TextComponent = ({ as, color = 'primary', children, ...rest }) => {
  const Tag = (as ?? 'span') as ElementType;   // 唯一断言点：泛型元素 → 可渲染元素
  return (
    <Tag className={`text-${color}`} {...(rest as object)}>
      {children}
    </Tag>
  );
};
```

```tsx
<Text as="a" href="/pricing">定价</Text>      // href 合法：来自 ComponentPropsWithoutRef<'a'>
<Text as="button" type="submit">提交</Text>   // type 合法：button 属性集
<Text color="secondary">普通</Text>           // 不传 as：默认 span
// <Text as="div" href="/x" />  ← 编译报错：href 不在 div 的属性集上
```

- 逐层拆解：`ComponentPropsWithoutRef<C>` 按 C 取出对应原生元素的 props 联合（`'a'` → AnchorHTMLAttributes…）；`Omit<..., keyof OwnProps | 'as'>` 防止原生属性与你自定义的 `color`/`as` 冲突产生双重定义；`TextComponent` 用「函数类型标注 + 箭头函数实现」的组合，绕开 `.tsx` 里 `<C>` 被当标签的解析陷阱（第 2 章）。
- 定义体里的 `as object` 断言是这个模式的固有代价：TS 无法证明「任意 C 的属性集」可展开到「任意 Tag」，泛型组件的类型价值在**使用侧**（props 全程精确），定义侧留一处肉眼可见的受控断言即可——review 时重点盯这里。
- React 19 想同时支持 ref：把返回类型改成带 `ref?: ComponentPropsWithRef<C>['ref']` 的 props，函数组件直接收 ref prop（第 5 章）；React 18 需要 forwardRef 版变体（写法以 React 19/18 官方文档为准）。

## 12. 表单类型串联实战：zod schema → z.infer → useForm → onSubmit

```tsx
// forms/signup.tsx —— 一条 schema 贯穿：校验规则、TS 类型、errors 三者同源
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, '至少 8 位'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: '两次密码不一致' });

type SignupForm = z.infer<typeof signupSchema>;
// { email: string; password: string; confirm: string }

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),   // 校验结果的形状与 SignupForm 对齐
  });

  const onSubmit = handleSubmit((data) => {   // data: SignupForm —— 已通过校验的干净值
    console.log(data.email);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      <input {...register('confirm')} type="password" />
      {errors.confirm?.message && <span>{errors.confirm.message}</span>}
      <button>注册</button>
      {/* register('emial') ← 编译期报错：字面量键不存在（TS2339/TS2769 家族） */}
    </form>
  );
}
```

- 推导链：`z.infer` 生成表单类型 → `useForm<T>` 约束 `register` 的键与默认值类型 → `zodResolver` 把 zod parse 的失败信息映射成 `FieldErrors<T>` → `handleSubmit` 回调参数**排除了校验失败的可能**（callback 收到的 data 已通过 schema）——从此没有 `data.email as string` 这类补丁。
- **永远 `z.infer` 生成，不要手抄字段类型**：schema 里 `z.string().optional()` 推断成 `string | undefined`，手写 `string` 就漂移了；`refine`/`superRefine` 的 path 指向哪个键，错误就挂到 `errors` 的哪个键上，类型同步。
- 版本敏感点（**以官方文档为准**）：react-hook-form 7.44+ 配 @hookform/resolvers 3.3+ 支持**从 resolver 反推表单类型**——`useForm({ resolver: zodResolver(signupSchema) })` 不写泛型也能得到正确类型（要求 zod 3.21+）；zod v4 需换用对应的 v4 兼容入口（resolver 包的导出路径有过调整）。老项目保险姿势仍是显式 `useForm<z.infer<typeof schema>>`。

## 13. lazy / Suspense / 错误边界的类型

### 13.1 React.lazy 与 Suspense

```tsx
import { lazy, Suspense } from 'react';

const ChartPanel = lazy(() => import('./ChartPanel'));   // 模块须有 default 导出

<Suspense fallback={<Spin />}>          {/* fallback: ReactNode */}
  <ChartPanel data={data} />            {/* props 类型与同步 import 完全一致 */}
</Suspense>
```

- **lazy 的入参约定是类型化的**：`lazy<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>)`（以 @types/react 为准）——`import()` 返回的 namespace 必须带 `default`，只有具名导出的模块在编译期就被拦（`Property 'default' is missing`）。
- 返回类型 `LazyExoticComponent<T>` 可以近似当 `T` 用在类型位（图标注册表 `Record<string, LazyExoticComponent<...>>` 等），但它在类型上**不能被直接调用/实例化**——「必须包 Suspense 才能用」这个运行时约定，靠这个独立类型名在代码 review 里可见。
- Suspense 的类型本身极薄（`{ children?: ReactNode; fallback?: ReactNode }`）；抛 Promise 的「suspend」行为完全在运行时——类型系统看不见，这也是为什么数据框架（React Query 的 `useSuspenseQuery` 等）都自带配套类型。

### 13.2 类组件错误边界（官方仍只支持类写法）

```tsx
// components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode }
interface ErrorBoundaryState { error: Error | null }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {   // 渲染期捕获 → 降级 UI
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {                    // 副作用上报位
    console.error(error, info.componentStack);   // React 19 里 componentStack 为 string（18 可空，以 @types/react 为准）
  }

  render() {
    return this.state.error ? this.props.fallback ?? <h1>出错了</h1> : this.props.children;
  }
}
```

- 两个生命周期签名是固定的：`getDerivedStateFromError` 的返回值必须匹配 State（写错返回类型直接报错），`componentDidCatch` 的 `info: ErrorInfo` 带 `componentStack`。
- 第三方 react-error-boundary 的类型（以官方 README 为准）：

```tsx
import { ErrorBoundary as REB, type FallbackProps } from 'react-error-boundary';

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  // FallbackProps ≈ { error: Error; resetErrorBoundary: (...args: any[]) => void }
  // （error 在旧版本类型为 any，新版本收成 Error——版本敏感）
  return (
    <div role="alert">
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

<REB FallbackComponent={Fallback} onReset={(details) => console.log(details)}>
  <App />
</REB>
```

- 注意边界能捕获的是**渲染期/生命周期错误**；事件回调与异步任务里的错误不在其覆盖范围，要 try/catch 自己管——类型上 `FallbackProps['error']` 是 `Error` 这个事实，不代表所有路径进到 fallback 的 error 都有 stack。

## 14. 测试类型：user-event 与 jest-dom 断言的 declare 扩展

```ts
// src/test/setup.ts —— jest-dom 有 vitest 专用入口，一行完成断言扩展
import '@testing-library/jest-dom/vitest';
// jest 用户：import '@testing-library/jest-dom';（配 jest.config 的 setupFilesAfterEnv）
```

```tsx
// __tests__/login.test.tsx —— 类型已就位：getBy* 返回 HTMLElement，matchers 全有提示
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('登录', async () => {
  render(<LoginForm />);
  const user = userEvent.setup();     // 返回 UserEvent 对象；可传 { advanceTimers: vi.advanceTimersByTime }
  await user.type(screen.getByLabelText('邮箱'), 'a@b.com');
  await user.click(screen.getByRole('button', { name: '登录' }));
  expect(screen.getByRole('alert')).toHaveTextContent('成功');   // jest-dom 扩展断言
  expect(screen.getByRole('button')).toBeDisabled();
});
```

- user-event 类型要点：所有交互方法返回 Promise，**必须 await**——不 await 类型不报错（返回值被丢弃），靠 `@typescript-eslint/no-floating-promises` 兜底。这是「类型系统不覆盖、lint 来补」的典型案例（与第 15 章呼应）。
- **自定义 matcher 的 declare 扩展**（jest 与 vitest 的命名空间不同，别混用）：

```ts
// types/test-matchers.d.ts —— jest 版：扩展全局 jest.Matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}
export {};

// vitest 版：模块扩展 vitest 的 Assertion / AsymmetricMatchersContaining
import type { Assertion, AsymmetricMatchersContaining } from 'vitest';
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinRange(floor: number, ceiling: number): Assertion<T>;
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): unknown;
  }
}
```

```ts
// 与声明配套的运行时注册——漏了就是「编译全绿、运行时报函数不存在」：
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return { pass, message: () => `${received} not in [${floor}, ${ceiling}]` };
  },
});
```

- 声明原理即 `21-declaration-files.md` 第 7 章的 module augmentation：jest-dom 装包后「自动有类型」，正是因为它自带对 `jest.Matchers`（或 vitest `Assertion`）的扩展声明——自定义 matcher 照抄同款接口即可（接口成员名以两家官方文档为准）。
- 又见「信任鸿沟」（23 篇第 12 章）：**类型声明不保证运行时存在**——d.ts 写了 matcher、`expect.extend` 没注册，编译期全绿、跑起来 `toBeWithinRange is not a function`。

## 15. memo / useMemo 的 props 稳定性：类型上的三个盲区

```tsx
import { memo, useCallback, useMemo } from 'react';

interface UserListProps {
  items: { id: string; name: string }[];
  onSelect: (id: string) => void;
  header: React.ReactNode;
}

const UserList = memo(function UserList({ items, onSelect, header }: UserListProps) {
  return null;   // memo 默认浅比较：Object.is 逐 prop 比对
});

function Parent({ users }: { users: User[] }) {
  return (
    <UserList
      items={users.filter((u) => u.active)}    // 盲区一：新数组 → 引用变 → memo 失效
      onSelect={(id) => console.log(id)}       // 盲区一：内联函数 → 新引用 → memo 失效
      header={<h2>标题</h2>}                   // 盲区一：内联 JSX → 新 ReactNode → memo 失效
    />
  );
}
```

- **盲区一：类型不检查引用稳定性**。props「类型兼容」与「引用稳定」是两个维度——三行内联写法类型全绿，memo 形同虚设。修复靠 `useCallback`/`useMemo`、把常量提到模块级、或下放状态，不靠类型系统。
- **盲区二：自定义比较函数没有完备性检查**：

```tsx
const Optimized = memo(UserList, (prev, next) => prev.items === next.items);
// 两参类型自动推导为 UserListProps——漏比 onSelect/header 没有任何提示；
// 后果是「props 变了却不重渲」的幽灵 bug：UI 用了 header、闭包里的 onSelect 过期。
```

- **盲区三：依赖数组是 `readonly any[]`，内容不受类型检查**：

```tsx
const active = useMemo(() => users.filter((u) => u.active), [users, 'oops']);  // 混入字符串常量：不报错
useEffect(() => { log(users); }, []);                                          // 漏依赖：不报错（stale 闭包）
```

- 依赖数组正确性由 `eslint-plugin-react-hooks` 的 `exhaustive-deps` 静态分析保证——这也回答面试题「有 TS 了为什么还要 ESLint」：**TS 管类型形状，lint 管引用与依赖的正确性**，互补不重叠。
- 实操约定：传给 memo 组件的函数 props 一律 `useCallback`、对象/数组 props 一律 `useMemo` 或提为模块常量；`React.ReactNode` 类型的 props（如 header）最容易「内联即新引用」，重点盯。泛型组件被 memo 包裹时泛型推导会丢（同第 5 章 forwardRef 的问题），需要 memo 时先拆子组件再包。

## 16. 一句话总结

> React + TS 的主线是「类型顺着数据流走」：props 用 interface 定形状（children 选 ReactNode 超集，ReactElement 留给要加工元素的少数场景），泛型组件让 `items: T[]` 一路推导到 `onSelect: (item: T) => void`；hooks 各有要点——useState 显式联合管 null、useReducer 用判别联合 + never 穷尽、useRef 分清「可变容器」与「DOM 只读」双签名（19 统一为可写 RefObject）、useEffect 清理函数在类型层被禁 return 其他值；React.FC 的隐式 children 历史包袱 18 已卸下，但泛型组件依旧绕开它；ref 转发在 19 退化为普通 prop，泛型组件配 ref 是经典推导陷阱；Context 用 `createContext<T | null>(null)` + 自定义 hook throw 收窄；Zustand 的 `create<Store>()(...)` currying 是为绕开「部分类型参数推断不支持」，React Query 的 data 类型由 queryFn 与 select 两段接力；R3F 的 `<mesh>` 标签靠 module augmentation 注册进 JSX.IntrinsicElements（v9 后是 React.JSX + ThreeElements）——和 Vite 的 vite-env.d.ts 一样，都是 21 篇声明文件机制的实战落地。
