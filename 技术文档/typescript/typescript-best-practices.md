# TypeScript 高级技巧与最佳实践

> 提升 TypeScript 代码质量的实用技巧

---

## 🎯 严格类型配置

### 推荐 tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",

    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## 🔒 类型安全技巧

### 1. 避免 any 的替代方案

```typescript
// ❌ 避免使用 any
function process(data: any): any {
  return data;
}

// ✅ 使用 unknown（更安全）
function processSafe(data: unknown): unknown {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
  if (Array.isArray(data)) {
    return data.length;
  }
  return data;
}

// ✅ 使用泛型
function processGeneric<T>(data: T): T {
  return data;
}

// ✅ 使用条件类型
type Processed<T> = T extends string ? string : T extends number ? number : T;

// ✅ 使用重载
function format(input: string): string;
function format(input: number): string;
function format(input: string | number): string {
  return String(input);
}
```

### 2. 空值检查模式

```typescript
// ❌ 不安全的访问
function getUserName(user: User | null): string {
  return user.name;  // 可能报错
}

// ✅ 可选链 + 空值合并
function getUserNameSafe(user: User | null): string {
  return user?.name ?? "Anonymous";
}

// ✅ 类型守卫
function getUserNameGuarded(user: User | null): string {
  if (!user) {
    return "Anonymous";
  }
  return user.name;  // TypeScript 知道这里 user 不为 null
}

// ✅ 使用 NonNullable 工具类型
type NonNullUser = NonNullable<User | null>;  // User
```

### 3. 穷尽检查（Exhaustiveness Checking）

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  side: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Square | Triangle;

// ✅ 使用 never 进行穷尽检查
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // 如果漏掉任何 case，这里会报错
      const _exhaustiveCheck: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustiveCheck}`);
  }
}
```

---

## 🚀 高级类型模式

### 1. 品牌类型（Branded Types）

```typescript
// 创建名义类型（Nominal Typing）
declare const __brand: unique symbol;

type Brand<B> = { readonly [__brand]: B };
type Branded<T, B> = T & Brand<B>;

// 定义品牌类型
type UserId = Branded<string, "UserId">;
type OrderId = Branded<string, "OrderId">;
type Email = Branded<string, "Email">;

// 工厂函数
function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

function createEmail(email: string): Email {
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }
  return email as Email;
}

// 使用
const userId = createUserId("user-1");
const orderId = createOrderId("order-1");

function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

getUser(userId);      // ✅
// getUser(orderId);  // ❌ 编译错误
// getUser("user-1"); // ❌ 编译错误
```

### 2. 状态机类型

```typescript
// 使用可辨识联合实现状态机
type State =
  | { status: "idle" }
  | { status: "loading"; requestId: string }
  | { status: "success"; data: User }
  | { status: "error"; error: Error };

// 状态转换函数
function transition(state: State, event: Event): State {
  switch (state.status) {
    case "idle":
      if (event.type === "FETCH") {
        return { status: "loading", requestId: event.requestId };
      }
      return state;

    case "loading":
      if (event.type === "SUCCESS") {
        return { status: "success", data: event.data };
      }
      if (event.type === "ERROR") {
        return { status: "error", error: event.error };
      }
      return state;

    case "success":
    case "error":
      if (event.type === "RESET") {
        return { status: "idle" };
      }
      return state;
  }
}

// 使用
const [state, setState] = useState<State>({ status: "idle" });

// 每个状态都有正确的类型
if (state.status === "loading") {
  console.log(state.requestId);  // ✅ 可以访问
}
```

### 3. 函数重载与泛型结合

```typescript
// 重载实现灵活的 API
interface APIClient {
  get<T>(url: string): Promise<T>;
  get<T>(url: string, params: Record<string, string>): Promise<T>;
  get<T>(url: string, config: { cache: boolean }): Promise<T>;
}

// 或使用可选参数和联合类型
interface APIClient2 {
  get<T>(
    url: string,
    options?: { params?: Record<string, string>; cache?: boolean }
  ): Promise<T>;
}

// 更高级的：根据路径推断返回类型
interface Endpoints {
  "/users": User[];
  "/users/:id": User;
  "/posts": Post[];
}

type APIResponse<T extends keyof Endpoints> = Endpoints[T];

async function fetchAPI<T extends keyof Endpoints>(
  path: T
): Promise<APIResponse<T>> {
  const response = await fetch(path);
  return response.json();
}

// 使用
const users = await fetchAPI("/users");      // User[]
const user = await fetchAPI("/users/:id");   // User
const posts = await fetchAPI("/posts");      // Post[]
```

### 4. 深度不可变类型

```typescript
// 深度 Readonly
type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> {}

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

// 使用
interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  database: {
    url: string;
    pool: {
      min: number;
      max: number;
    };
  };
}

type ImmutableConfig = DeepReadonly<Config>;

const config: ImmutableConfig = {
  server: { host: "localhost", port: 3000, ssl: { enabled: true, cert: "..." } },
  database: { url: "...", pool: { min: 1, max: 10 } }
};

// config.server.port = 4000;           // ❌ 错误
// config.server.ssl.enabled = false;   // ❌ 错误
// config.database.pool.min = 2;        // ❌ 错误
```

---

## 📦 模块与命名空间

### 1. barrel 导出模式

```typescript
// components/index.ts
export { Button } from "./Button";
export { Card } from "./Card";
export { Input } from "./Input";
export { Modal } from "./Modal";
export type { ButtonProps } from "./Button";
export type { CardProps } from "./Card";

// 使用
import { Button, Card, type ButtonProps } from "./components";
```

### 2. 条件类型导出

```typescript
// types.ts
export type { ButtonProps } from "./Button";
export type { InputProps } from "./Input";

// 在 Node.js 环境中不导出 DOM 相关类型
export type Environment = typeof process extends { env: infer E }
  ? E extends { NODE_ENV: string }
    ? "node"
    : "browser"
  : "browser";

export type ConditionalExport<T> = Environment extends "node"
  ? Omit<T, "onClick" | "onFocus">
  : T;
```

### 3. 声明合并扩展第三方库

```typescript
// 扩展 Express 的 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId: string;
      timestamp: number;
    }
  }
}

// 扩展 Array 原型
declare global {
  interface Array<T> {
    last(): T | undefined;
    first(): T | undefined;
    unique(): T[];
  }
}

// 实现
if (!Array.prototype.last) {
  Array.prototype.last = function<T>(this: T[]): T | undefined {
    return this[this.length - 1];
  };
}

// 使用
const arr = [1, 2, 3];
console.log(arr.last());  // 3
```

---

## ⚛️ React + TypeScript 最佳实践

### 1. 组件 Props 设计

```typescript
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

// 继承原生 button 的所有属性
interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

// 使用 forwardRef 正确转发 ref
const Button = forwardRef<ElementRef<"button">, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-variant={variant}
        data-size={size}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? <Spinner /> : children}
      </button>
    );
  }
);

Button.displayName = "Button";

// 多态组件（as prop）
type PolymorphicProps<
  T extends React.ElementType = React.ElementType
> = {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, "as">;

function Container<T extends React.ElementType = "div">(
  props: PolymorphicProps<T>
) {
  const { as: Component = "div", ...rest } = props;
  return <Component {...rest} />;
}

// 使用
<Container>默认是 div</Container>
<Container as="section">现在是 section</Container>
<Container as={Link} to="/">现在是 Link 组件</Container>
```

### 2. 类型安全的 Context

```typescript
import { createContext, useContext, useCallback } from "react";

// 定义状态和 actions 分开，更清晰
interface CounterState {
  count: number;
}

interface CounterActions {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  setCount: (count: number) => void;
}

type CounterContextValue = CounterState & CounterActions;

const CounterContext = createContext<CounterContextValue | null>(null);

export function CounterProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(0), []);

  const value = useMemo(
    () => ({ count, increment, decrement, reset, setCount }),
    [count, increment, decrement, reset]
  );

  return (
    <CounterContext.Provider value={value}>{children}</CounterContext.Provider>
  );
}

// 自定义 hook 提供更好的错误提示
export function useCounter(): CounterContextValue {
  const context = useContext(CounterContext);
  if (!context) {
    throw new Error("useCounter must be used within CounterProvider");
  }
  return context;
}

// 如果只需要状态或 actions
export function useCounterState(): CounterState {
  return useCounter();
}

export function useCounterActions(): CounterActions {
  const { increment, decrement, reset, setCount } = useCounter();
  return useMemo(
    () => ({ increment, decrement, reset, setCount }),
    [increment, decrement, reset, setCount]
  );
}
```

### 3. 类型安全的表单

```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 定义 schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  age: z.number().min(18, "Must be at least 18").optional(),
  role: z.enum(["admin", "user", "guest"]),
  preferences: z.object({
    newsletter: z.boolean(),
    theme: z.enum(["light", "dark", "system"])
  })
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "user",
      preferences: {
        newsletter: false,
        theme: "system"
      }
    }
  });

  const onSubmit = async (data: UserFormData) => {
    await api.createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register("email")} type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <select {...register("role")}>
        <option value="admin">Admin</option>
        <option value="user">User</option>
        <option value="guest">Guest</option>
      </select>

      <Controller
        name="preferences.theme"
        control={control}
        render={({ field }) => (
          <select {...field}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        )}
      />

      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

---

## 🧪 测试类型

```typescript
// 使用 expect-type 库测试类型
import { expectType, expectError, expectAssignable, expectNotAssignable } from "tsd";

// 测试类型相等
expectType<string>("hello");

// 测试类型错误
expectError(42 as string);

// 测试类型可赋值性
expectAssignable<number>(42);
expectNotAssignable<string>(42);

// 测试工具类型
 type MyPick<T, K extends keyof T> = {
   [P in K]: T[P];
 };

 interface User {
   name: string;
   age: number;
 }

type UserName = MyPick<User, "name">;
expectType<{ name: string }>({} as UserName);
```

---

## 🎨 代码组织建议

### 1. 文件命名约定

```
src/
├── components/           # React 组件
│   ├── Button.tsx
│   ├── Button.test.tsx
│   ├── Button.stories.tsx
│   └── index.ts         # barrel 导出
├── hooks/               # 自定义 Hooks
│   ├── useLocalStorage.ts
│   └── useFetch.ts
├── types/               # 全局类型
│   ├── api.ts           # API 相关类型
│   ├── models.ts        # 数据模型
│   └── utils.ts         # 工具类型
├── utils/               # 工具函数
│   ├── formatDate.ts
│   └── validateEmail.ts
├── constants/           # 常量
│   └── config.ts
└── lib/                 # 第三方库配置
    ├── axios.ts
    └── queryClient.ts
```

### 2. 类型定义位置

```typescript
// 1. 组件 Props 类型 - 与组件同文件
interface ButtonProps { /* ... */ }

// 2. 数据模型类型 - types/models.ts
interface User { /* ... */ }
interface Post { /* ... */ }

// 3. API 类型 - types/api.ts
interface ApiResponse<T> { /* ... */ }

// 4. 工具类型 - types/utils.ts
export type Nullable<T> = T | null;

// 5. 业务类型 - 与业务逻辑同文件
interface PaymentState { /* ... */ }
```

---

**持续学习和实践是掌握 TypeScript 的关键！** 🚀
