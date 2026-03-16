# TypeScript 速查手册

> 快速查阅 TypeScript 常用语法和模式

---

## 📦 基础类型

```typescript
// 原始类型
let str: string = "hello";
let num: number = 42;
let bool: boolean = true;
let nil: null = null;
let undef: undefined = undefined;
let sym: symbol = Symbol("key");
let big: bigint = 100n;

// 数组
let arr1: number[] = [1, 2, 3];
let arr2: Array<string> = ["a", "b", "c"];

// 元组（固定长度和类型）
let tuple: [string, number, boolean] = ["age", 25, true];

// 任意类型（尽量避免）
let anything: any = 4;

// 未知类型（安全的 any）
let unknownValue: unknown = 4;

// 空值
function log(): void {
  console.log("hello");
}

// 永不返回
function error(): never {
  throw new Error("error");
}
```

---

## 🔧 接口与类型

### Interface
```typescript
interface User {
  id: number;
  name: string;
  email?: string;        // 可选属性
  readonly createdAt: Date;  // 只读属性
}

// 扩展接口
interface Admin extends User {
  role: "admin" | "superadmin";
  permissions: string[];
}

// 接口合并（声明合并）
interface User {
  avatar?: string;  // 自动合并到上面的定义
}
```

### Type Alias
```typescript
type ID = string | number;
type Status = "pending" | "success" | "error";

// 对象类型
type User = {
  id: number;
  name: string;
};

// 联合类型
type Input = string | number | boolean;

// 交叉类型
type Employee = Person & Worker;

// 元组类型
type Point = [number, number];

// 函数类型
type Handler = (event: Event) => void;
```

---

## ⚡ 函数

```typescript
// 函数声明
function add(a: number, b: number): number {
  return a + b;
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b;

// 可选参数
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}`;
}

// 默认参数
function greetDefault(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}`;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

// 函数重载
function process(input: string): string;
function process(input: number): number;
function process(input: string | number): string | number {
  return typeof input === "string" ? input.toUpperCase() : input * 2;
}

// this 类型
function clickHandler(this: HTMLButtonElement, event: MouseEvent): void {
  this.disabled = true;
}
```

---

## 🏗️ 类

```typescript
class Animal {
  // 属性简写（自动赋值）
  constructor(
    public name: string,
    private age: number,
    protected species: string
  ) {}

  // 方法
  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m`);
  }

  // Getter
  get info(): string {
    return `${this.name} is ${this.age} years old`;
  }

  // Setter
  set setAge(value: number) {
    if (value > 0) this.age = value;
  }
}

// 继承
class Dog extends Animal {
  constructor(name: string, age: number) {
    super(name, age, "Canine");
  }

  bark(): void {
    console.log("Woof!");
  }
}

// 抽象类
abstract class Shape {
  abstract getArea(): number;

  printArea(): void {
    console.log(`Area: ${this.getArea()}`);
  }
}

// 实现接口
interface Printable {
  print(): void;
}

class Document implements Printable {
  print(): void {
    console.log("Printing document");
  }
}
```

---

## 🎯 泛型

```typescript
// 基础泛型
function identity<T>(arg: T): T {
  return arg;
}

// 泛型约束
function logLength<T extends { length: number }>(arg: T): T {
  console.log(arg.length);
  return arg;
}

// 多个泛型
function pair<T, U>(a: T, b: U): [T, U] {
  return [a, b];
}

// 泛型接口
interface Container<T> {
  value: T;
  getValue(): T;
}

// 泛型类
class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}

// 泛型别名
type Nullable<T> = T | null;
type ArrayElement<T> = T extends (infer U)[] ? U : T;

// 默认泛型参数
type Response<T = any> = {
  data: T;
  status: number;
};
```

---

## 🛡️ 类型守卫

```typescript
// typeof
type Primitive = string | number | boolean;
function processPrimitive(value: Primitive) {
  if (typeof value === "string") {
    return value.toUpperCase();  // string 类型
  }
  if (typeof value === "number") {
    return value.toFixed(2);     // number 类型
  }
  return value;                   // boolean 类型
}

// instanceof
class Cat {
  meow() { return "meow"; }
}
class Dog {
  bark() { return "woof"; }
}
function makeSound(animal: Cat | Dog) {
  if (animal instanceof Cat) {
    return animal.meow();
  }
  return animal.bark();
}

// in
interface Car {
  drive(): void;
  wheels: number;
}
interface Boat {
  sail(): void;
}
function move(vehicle: Car | Boat) {
  if ("drive" in vehicle) {
    vehicle.drive();
  } else {
    vehicle.sail();
  }
}

// 自定义类型守卫
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

// 可辨识联合
interface Square {
  kind: "square";
  size: number;
}
interface Circle {
  kind: "circle";
  radius: number;
}
type Shape = Square | Circle;
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "square": return shape.size ** 2;
    case "circle": return Math.PI * shape.radius ** 2;
  }
}
```

---

## 🧰 内置工具类型

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial - 所有属性变为可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; ... }

// Required - 所有属性变为必选
type RequiredUser = Required<User>;

// Readonly - 所有属性变为只读
type ReadonlyUser = Readonly<User>;

// Pick - 选取指定属性
type UserSummary = Pick<User, "id" | "name">;
// { id: number; name: string; }

// Omit - 排除指定属性
type PublicUser = Omit<User, "email">;
// { id: number; name: string; age: number; }

// Record - 创建对象类型
type UsersById = Record<number, User>;
// { [key: number]: User }

// Exclude - 从联合类型中排除
type Primitive = string | number | boolean;
type NonBoolean = Exclude<Primitive, boolean>;
// string | number

// Extract - 从联合类型中提取
type OnlyString = Extract<Primitive, string>;
// string

// NonNullable - 排除 null 和 undefined
type Value = string | null | undefined;
type NonNull = NonNullable<Value>;
// string

// Parameters - 获取函数参数类型
type Fn = (a: number, b: string) => void;
type FnParams = Parameters<Fn>;
// [number, string]

// ReturnType - 获取函数返回类型
type FnReturn = ReturnType<Fn>;
// void

// Awaited - 获取 Promise 解析类型
type PromiseValue = Awaited<Promise<string>>;
// string
```

---

## 🔨 自定义工具类型

```typescript
// 深度 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 深度 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 提取对象中的函数类型
type FunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// 提取对象中的非函数类型
type NonFunctionProperties<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

// 必填字段（排除可选）
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

// 可选字段
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// 只读数组转元组
type TupleFromArray<T extends readonly unknown[]> = [...T];

// 展平数组
type Flatten<T extends any[]> = T extends (infer U)[] ? U : never;

// 安全导航（处理可选链）
type DeepNullable<T> = {
  [P in keyof T]: DeepNullable<T[P]> | null;
};

// 事件处理器类型
type EventHandler<E extends Event> = (event: E) => void;
type MouseEventHandler = EventHandler<MouseEvent>;
type KeyboardEventHandler = EventHandler<KeyboardEvent>;

// API 响应类型
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// 分页响应
type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// 表单字段类型（用于 React Hook Form 等）
type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
  valid: boolean;
};

type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};
```

---

## 🔄 类型操作技巧

```typescript
// 重映射键名（添加前缀）
type WithGetters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// 重映射键名（添加后缀）
type WithSetters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

// 过滤特定类型
type StringValuesOnly<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

// 过滤可选属性
type PickRequired<T> = Pick<T, RequiredKeys<T>>;

// 过滤必选属性
type PickOptional<T> = Pick<T, OptionalKeys<T>>;

// 将特定类型设为可选
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 将特定类型设为必选
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
```

---

## ⚛️ React + TypeScript

### 组件 Props
```typescript
import React, { ReactNode, CSSProperties } from "react";

// 基础 Props
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  style?: CSSProperties;
  className?: string;
}

// 使用
const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  ...props
}) => {
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
};

// 泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### Hooks
```typescript
import { useState, useEffect, useRef, useCallback } from "react";

// useState
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);

// useRef
const inputRef = useRef<HTMLInputElement>(null);
const countRef = useRef<number>(0);  // 不触发重新渲染的值

// useCallback
const handleClick = useCallback(() => {
  console.log("clicked");
}, []);

// useMemo
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 自定义 Hook
type UseFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(refetch, [refetch]);

  return { data, loading, error, refetch };
}

// useEventListener Hook
function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  handler: (event: WindowEventMap[K]) => void
) {
  useEffect(() => {
    window.addEventListener(event, handler);
    return () => window.removeEventListener(event, handler);
  }, [event, handler]);
}
```

### Context
```typescript
import { createContext, useContext } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
```

---

## 📋 类型声明文件 (.d.ts)

```typescript
// 声明全局变量
declare const VERSION: string;
declare function log(message: string): void;

// 声明模块
declare module "my-library" {
  export function add(a: number, b: number): number;
  export function subtract(a: number, b: number): number;
}

// 扩展已有模块
declare module "express" {
  interface Request {
    user?: User;
  }
}

// 声明全局命名空间
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    API_URL: string;
  }
}

// 声明图片等资源模块
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

// 声明 CSS 模块
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// 扩展 Window 对象
declare global {
  interface Window {
    myLib: {
      version: string;
      init(config: Config): void;
    };
  }
}

export {};
```

---

## 🎨 常用模式

### 结果类型（替代抛出异常）
```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: number): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return { success: false, error: new Error("Failed to fetch") };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

// 使用
const result = await fetchUser(1);
if (result.success) {
  console.log(result.data.name);
} else {
  console.error(result.error.message);
}
```

### Builder 模式
```typescript
class QueryBuilder<T> {
  private conditions: string[] = [];
  private orderByField?: keyof T;
  private limitValue?: number;

  where(field: keyof T, value: unknown): this {
    this.conditions.push(`${String(field)} = ${value}`);
    return this;
  }

  orderBy(field: keyof T): this {
    this.orderByField = field;
    return this;
  }

  limit(n: number): this {
    this.limitValue = n;
    return this;
  }

  build(): string {
    let query = `SELECT * FROM table`;
    if (this.conditions.length) {
      query += ` WHERE ${this.conditions.join(" AND ")}`;
    }
    if (this.orderByField) {
      query += ` ORDER BY ${String(this.orderByField)}`;
    }
    if (this.limitValue) {
      query += ` LIMIT ${this.limitValue}`;
    }
    return query;
  }
}

// 使用
const query = new QueryBuilder<User>()
  .where("age", 25)
  .where("active", true)
  .orderBy("name")
  .limit(10)
  .build();
```

### 名义类型（Nominal Typing）
```typescript
// 使用 branding 创建名义类型
type UserId = string & { readonly __brand: unique symbol };
type OrderId = string & { readonly __brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

// 现在不能混用 UserId 和 OrderId
const userId = createUserId("user-1");
const orderId = createOrderId("order-1");

function processUser(id: UserId) { /* ... */ }
function processOrder(id: OrderId) { /* ... */ }

processUser(userId);     // ✅
// processUser(orderId); // ❌ 类型错误
```

---

## 📚 类型体操挑战

```typescript
// 1. HelloWorld - 返回字符串 "Hello, World"
type HelloWorld = "Hello, World";

// 2. Pick - 实现内置 Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 3. Readonly - 实现内置 Readonly
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 4. Tuple to Object - 将元组转为对象
type TupleToObject<T extends readonly string[]> = {
  [P in T[number]]: P;
};

// 5. First of Array - 获取数组第一个元素
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

// 6. Length of Tuple - 获取元组长度
type Length<T extends readonly any[]> = T["length"];

// 7. Exclude - 实现内置 Exclude
type MyExclude<T, U> = T extends U ? never : T;

// 8. Awaited - 实现内置 Awaited
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;

// 9. If - 条件类型
type If<C extends boolean, T, F> = C extends true ? T : F;

// 10. Concat - 连接两个数组
type Concat<T extends any[], U extends any[]> = [...T, ...U];
```

---

## 💡 快速技巧

### 1. 使用 `satisfies` 检查类型同时保留推断
```typescript
const config = {
  host: "localhost",
  port: 3000
} satisfies Record<string, string | number>;

config.port.toFixed();  // ✅ 知道是 number
```

### 2. 使用 `as const` 创建不可变类型
```typescript
const colors = ["red", "green", "blue"] as const;
// typeof colors = readonly ["red", "green", "blue"]

type Color = typeof colors[number];
// "red" | "green" | "blue"
```

### 3. 使用 `keyof` 获取所有键
```typescript
interface User {
  name: string;
  age: number;
}

type UserKey = keyof User;  // "name" | "age"
```

### 4. 使用 `typeof` 获取变量类型
```typescript
const user = {
  name: "Alice",
  age: 25
};

type User = typeof user;  // { name: string; age: number; }
```

### 5. 使用 `infer` 提取类型
```typescript
// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : T;

// 提取函数返回类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取 Promise 解析类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
```

---

**保存这份速查表，随时查阅！** 📖
