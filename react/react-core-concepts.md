# React + TypeScript 核心知识点总结

> 系统整理 React + TypeScript 的核心概念和知识点，适合初学者查阅和复习

---

## 目录
1. [TypeScript 基础](#typescript-基础)
2. [组件与 Props](#组件与-props)
3. [State 类型](#state-类型)
4. [事件处理类型](#事件处理类型)
5. [Hooks 类型](#hooks-类型)
6. [Context 类型](#context-类型)
7. [泛型组件](#泛型组件)
8. [性能优化](#性能优化)

---

## TypeScript 基础

### 基础类型

```typescript
// 基本类型
let name: string = "张三";
let age: number = 25;
let isActive: boolean = true;

// 数组
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["张三", "李四"];

// 元组
let person: [string, number] = ["张三", 25];

// 枚举
enum Status {
  Pending,
  Success,
  Error
}

// 任意类型（尽量少用）
let anything: any = 4;

// 未知类型（比 any 安全）
let unknownValue: unknown = 4;
if (typeof unknownValue === "number") {
  console.log(unknownValue + 1);
}

// 空值
function logMessage(): void {
  console.log("Hello");
}

// 永远不返回
function throwError(): never {
  throw new Error("错误");
}
```

### 接口（Interface）

```typescript
// 定义对象形状
interface User {
  name: string;
  age: number;
  email?: string;  // 可选属性
  readonly id: number;  // 只读属性
}

const user: User = {
  name: "张三",
  age: 25,
  id: 1
};

// 接口继承
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

// 接口用于函数
interface SearchFunc {
  (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = (src, sub) => {
  return src.includes(sub);
};
```

### 类型别名（Type Alias）

```typescript
// 基本用法
type Point = {
  x: number;
  y: number;
};

// 联合类型
type Status = "pending" | "success" | "error";
type ID = string | number;

// 交叉类型
type Employee = Person & {
  employeeId: number;
};

// 函数类型
type AddFn = (a: number, b: number) => number;
```

### 泛型基础

```typescript
// 基本泛型
function identity<T>(arg: T): T {
  return arg;
}

// 使用
const output = identity<string>("myString");
const output2 = identity(123);  // 类型推断

// 泛型约束
interface HasLength {
  length: number;
}

function loggingIdentity<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

// 泛型接口
interface GenericIdentityFn<T> {
  (arg: T): T;
}

// 泛型类
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}
```

---

## 组件与 Props

### 函数组件类型

```tsx
import { FC } from "react";

// 方式一：直接定义（推荐）
interface WelcomeProps {
  name: string;
  age?: number;
}

function Welcome({ name, age = 18 }: WelcomeProps): JSX.Element {
  return (
    <div>
      <h1>你好, {name}!</h1>
      {age && <p>年龄: {age}</p>}
    </div>
  );
}

// 方式二：使用 FC 类型（已不推荐使用，但常见）
const Welcome2: FC<WelcomeProps> = ({ name, age = 18 }) => {
  return (
    <div>
      <h1>你好, {name}!</h1>
    </div>
  );
};

// 方式三：ReactNode 返回类型
function Container({ children }: { children: React.ReactNode }): React.ReactNode {
  return <div className="container">{children}</div>;
}
```

### Children 类型

```tsx
import { ReactNode, ReactElement } from "react";

// ReactNode - 最宽泛的类型，包含所有可能的子元素
interface CardProps {
  title: string;
  children: ReactNode;
}

// ReactElement - 单个 React 元素
interface SingleChildProps {
  children: ReactElement;
}

// 特定元素类型
interface ButtonProps {
  icon: ReactElement;
  label: string;
}

// 函数子元素（render props）
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
}
```

### Props 扩展 HTML 属性

```tsx
import { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

// 扩展按钮属性
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

function Button({
  variant = "primary",
  isLoading,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button className={`btn-${variant}`} disabled={isLoading} {...rest}>
      {isLoading ? "加载中..." : children}
    </button>
  );
}

// 扩展输入框属性
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function Input({ label, error, ...inputProps }: InputProps): JSX.Element {
  return (
    <div>
      <label>{label}</label>
      <input {...inputProps} />
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

---

## State 类型

### useState 基础类型

```tsx
import { useState } from "react";

// 基本类型（自动推断，通常不需要显式声明）
const [count, setCount] = useState(0);  // number
const [name, setName] = useState("");   // string
const [isOn, setIsOn] = useState(false); // boolean

// 复杂类型（需要显式声明）
interface User {
  name: string;
  age: number;
  email?: string;
}

const [user, setUser] = useState<User | null>(null);
const [users, setUsers] = useState<User[]>([]);

// 联合类型
const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

// 对象类型
const [formData, setFormData] = useState<{
  username: string;
  password: string;
}>({
  username: "",
  password: ""
});
```

### useState 更新函数类型

```tsx
// 函数式更新
type SetStateAction<S> = S | ((prevState: S) => S);

// 实际使用
const [count, setCount] = useState(0);

// 直接设置
setCount(5);

// 基于前值更新
setCount((prev) => prev + 1);

// 对象更新
setUser((prev) => prev ? { ...prev, name: "新名字" } : null);
```

---

## 事件处理类型

### 常用事件类型

```tsx
import {
  MouseEvent,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  FocusEvent,
  DragEvent,
  ClipboardEvent,
  WheelEvent,
  TouchEvent,
  PointerEvent,
  AnimationEvent,
  TransitionEvent
} from "react";

// 点击事件
const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
  console.log(e.currentTarget.textContent);
};

// 输入事件
const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
  console.log(e.target.value);
};

// 表单提交
const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
  e.preventDefault();
};

// 键盘事件
const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
  if (e.key === "Enter") {
    console.log("回车按下");
  }
};

// 失去焦点
const handleBlur = (e: FocusEvent<HTMLInputElement>): void => {
  console.log("失去焦点，值:", e.target.value);
};
```

### 通用事件处理器类型

```tsx
import { EventHandler } from "react";

// 通用变化处理器
type ChangeHandler = ChangeEventHandler<HTMLInputElement>;

// 通用点击处理器
type ClickHandler = MouseEventHandler<HTMLButtonElement>;

// 组件中的使用
interface InputProps {
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}
```

---

## Hooks 类型

### useEffect

```tsx
import { useEffect } from "react";

// 基本用法
useEffect(() => {
  console.log("执行副作用");
}, []);

// 带清理函数
useEffect(() => {
  const subscription = API.subscribe();

  // 清理函数
  return (): void => {
    subscription.unsubscribe();
  };
}, []);

// 异步数据获取
useEffect(() => {
  let isCancelled = false;

  const fetchData = async (): Promise<void> => {
    try {
      const response = await fetch("/api/data");
      const data: User[] = await response.json();
      if (!isCancelled) {
        setUsers(data);
      }
    } catch (error) {
      if (!isCancelled) {
        setError(error instanceof Error ? error.message : "未知错误");
      }
    }
  };

  fetchData();

  return (): void => {
    isCancelled = true;
  };
}, []);
```

### useRef

```tsx
import { useRef } from "react";

// DOM 引用
const inputRef = useRef<HTMLInputElement>(null);

// 访问 DOM
inputRef.current?.focus();

// 保存前值
const prevCountRef = useRef<number>(0);

// 保存不触发渲染的值
const renderCount = useRef<number>(0);

// 复杂对象引用
interface TimerRef {
  id: ReturnType<typeof setInterval> | null;
  startTime: number;
}

const timerRef = useRef<TimerRef>({ id: null, startTime: 0 });
```

### useMemo 和 useCallback

```tsx
import { useMemo, useCallback } from "react";

// useMemo 缓存计算结果
const expensiveValue = useMemo<number>(() => {
  return data.reduce((sum, item) => sum + item.value, 0);
}, [data]);

// useCallback 缓存函数
const handleSubmit = useCallback<(data: FormData) => void>((data) => {
  console.log(data);
}, []);

// 带参数和返回值的函数
const calculateTotal = useCallback(
  (items: CartItem[], discount: number): number => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return subtotal * (1 - discount);
  },
  []
);
```

### useReducer

```typescript
interface State {
  count: number;
  step: number;
}

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "setStep"; payload: number }
  | { type: "reset" };

const initialState: State = { count: 0, step: 1 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "setStep":
      return { ...state, step: action.payload };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, initialState);
```

---

## Context 类型

### 创建类型安全的 Context

```tsx
import { createContext, useContext } from "react";

// 定义 Context 类型
interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// 创建 Context（可以传入默认值或使用 undefined 检查）
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 自定义 Hook（推荐）
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// 或使用默认值
const defaultValue: ThemeContextType = {
  theme: "light",
  toggleTheme: () => {}
};

const ThemeContext2 = createContext<ThemeContextType>(defaultValue);
```

### Provider 组件类型

```tsx
interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: "light" | "dark";
}

function ThemeProvider({ children, initialTheme = "light" }: ThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState(initialTheme);

  const toggleTheme = useCallback((): void => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## 泛型组件

### 基础泛型组件

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>): JSX.Element {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// 使用
interface User {
  id: number;
  name: string;
}

<List
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
```

### 带约束的泛型组件

```tsx
interface Identifiable {
  id: string | number;
}

interface TableProps<T extends Identifiable> {
  data: T[];
  columns: Array<{
    key: keyof T;
    title: string;
  }>;
}

function Table<T extends Identifiable>({ data, columns }: TableProps<T>): JSX.Element {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={String(col.key)}>{col.title}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={String(col.key)}>{String(row[col.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### forwardRef 泛型组件

```tsx
import { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} {...props} />
        {error && <span>{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

---

## 性能优化

### React.memo

```tsx
interface UserCardProps {
  user: User;
  onSelect: (id: number) => void;
}

const UserCard = React.memo<UserCardProps>(
  function UserCard({ user, onSelect }) {
    return (
      <div onClick={() => onSelect(user.id)}>
        <h3>{user.name}</h3>
      </div>
    );
  },
  // 自定义比较函数（可选）
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### 类型安全的代码分割

```tsx
import { lazy, Suspense, ComponentType } from "react";

// 懒加载组件
const LazyComponent = lazy<ComponentType<ComponentProps>>(
  () => import("./HeavyComponent")
);

// 或使用预定义的加载函数
function lazyLoad<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(factory);
}

const LazyPage = lazyLoad<typeof import("./Page").default>(
  () => import("./Page")
);
```

---

## 常用类型工具

### React 内置类型

```tsx
import {
  ReactNode,      // 任何可以作为子元素的类型
  ReactElement,   // 单个 React 元素
  ComponentType,  // 组件类型
  FC,             // 函数组件（已不推荐使用）
  PropsWithChildren,  // 自动添加 children 类型
  HTMLProps,      // HTML 元素属性
  CSSProperties   // 内联样式类型
} from "react";

// PropsWithChildren 使用
interface MyComponentProps {
  title: string;
}

function MyComponent({ title, children }: PropsWithChildren<MyComponentProps>) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

// CSSProperties
const styles: CSSProperties = {
  color: "red",
  fontSize: "16px",
  display: "flex"
};
```

### 实用类型工具

```typescript
// Partial - 所有属性变为可选
type PartialUser = Partial<User>;

// Required - 所有属性变为必需
type RequiredUser = Required<User>;

// Pick - 选取部分属性
type UserBasicInfo = Pick<User, "name" | "email">;

// Omit - 排除部分属性
type UserWithoutId = Omit<User, "id">;

// Record - 创建映射类型
type UserRoles = Record<number, string>;

// ReturnType - 获取函数返回类型
type SumReturn = ReturnType<typeof sum>;

// Parameters - 获取函数参数类型
type SumParams = Parameters<typeof sum>;
```

---

## 完整示例：待办事项

```tsx
// types/todo.ts
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
}

export type TodoFilter = "all" | "active" | "completed";

// components/TodoList.tsx
import { useState, useCallback, useMemo } from "react";
import { Todo, TodoFilter } from "../types/todo";

interface TodoListProps {
  initialTodos?: Todo[];
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

const TodoItem = React.memo<TodoItemProps>(
  function TodoItem({ todo, onToggle, onDelete }) {
    return (
      <li style={{ textDecoration: todo.completed ? "line-through" : "none" }}>
        <span onClick={() => onToggle(todo.id)}>{todo.text}</span>
        <button onClick={() => onDelete(todo.id)}>删除</button>
      </li>
    );
  }
);

export function TodoList({ initialTodos = [] }: TodoListProps): JSX.Element {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [input, setInput] = useState<string>("");

  const filteredTodos = useMemo<Todo[]>(() => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const addTodo = useCallback((): void => {
    if (!input.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: input.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTodos((prev) => [...prev, newTodo]);
    setInput("");
  }, [input]);

  const toggleTodo = useCallback((id: number): void => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const deleteTodo = useCallback((id: number): void => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  return (
    <div>
      <h1>待办事项</h1>
      <div>
        <input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") addTodo();
          }}
          placeholder="输入新任务"
        />
        <button onClick={addTodo}>添加</button>
      </div>

      <div>
        {(["all", "active", "completed"] as TodoFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ fontWeight: filter === f ? "bold" : "normal" }}
          >
            {f === "all" ? "全部" : f === "active" ? "未完成" : "已完成"}
          </button>
        ))}
      </div>

      <ul>
        {filteredTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ))}
      </ul>
    </div>
  );
}
```

---

**记住：TypeScript 是渐进式的。从简单类型开始，逐步增加复杂度！** 🚀
