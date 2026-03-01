# React + TypeScript 零基础学习路线图

> 专为编程新手设计，从零开始掌握 React 和 TypeScript
> 预计学习周期：8-10 周

---

## 🎯 写给初学者

**React 是什么？**
React 是一个用于构建用户界面的 JavaScript 库。它让你可以用"组件"的方式搭建网页，就像搭积木一样。

**TypeScript 是什么？**
TypeScript 是 JavaScript 的超集，添加了类型系统。它可以帮助你在写代码时发现错误，提供更好的代码提示。

**为什么要学 TypeScript？**
- ✅ 在写代码时就发现错误
- ✅ 更好的代码自动补全
- ✅ 更容易理解和维护代码
- ✅ 现在大多数公司都要求使用

**学习 React + TS 需要什么基础？**
- ✅ 基础的 HTML 知识
- ✅ 基础的 CSS 知识
- ✅ JavaScript 基础语法
- ❌ 不需要有任何框架经验

---

## 📍 学习路线图概览

```
阶段一：TypeScript 基础（第 1 周）
    ├── 类型基础
    ├── 接口和类型别名
    └── 函数和数组类型

阶段二：React 基础（第 2-3 周）
    ├── JSX/TSX 语法
    ├── 组件概念
    ├── Props 传值
    └── State 状态

阶段三：React + TS 核心（第 4-5 周）
    ├── 生命周期
    ├── 事件处理
    ├── 泛型组件
    ├── 列表渲染
    └── Hooks 入门

阶段四：React + TS 进阶（第 6-7 周）
    ├── useEffect 深入
    ├── 表单处理
    ├── 组件通信
    ├── Context 状态共享
    └── 自定义 Hooks

阶段五：实战与生态（第 8-10 周）
    ├── React Router 路由
    ├── 样式解决方案
    ├── 数据获取
    └── 项目实战
```

---

## 阶段一：TypeScript 基础（第 1 周）

### Day 1：为什么需要 TypeScript

**JavaScript 的问题：**
```javascript
// 运行时才发现错误
function add(a, b) {
  return a + b;
}

add(1, "2"); // "12" - 不是我们想要的！
```

**TypeScript 的解决方案：**
```typescript
// 编译时就发现错误
function add(a: number, b: number): number {
  return a + b;
}

add(1, "2"); // ❌ 错误：参数类型不匹配
add(1, 2);   // ✅ 正确
```

### Day 2：基础类型

```typescript
// 基本类型
let name: string = "张三";
let age: number = 25;
let isStudent: boolean = true;

// 数组
let numbers: number[] = [1, 2, 3];
let names: Array<string> = ["张三", "李四"];

// 任意类型（尽量少用）
let anything: any = 4;
anything = "string";
anything = true;

// 未知类型（比 any 安全）
let unknownValue: unknown = 4;
// 使用前需要类型检查
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

### Day 3：接口（Interface）

```typescript
// 定义对象形状
interface User {
  name: string;
  age: number;
  email?: string;  // 可选属性
}

const user: User = {
  name: "张三",
  age: 25
};

// 接口继承
interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}

const dog: Dog = {
  name: "旺财",
  breed: "金毛"
};
```

### Day 4：类型别名（Type Alias）

```typescript
// 基本用法
type Point = {
  x: number;
  y: number;
};

// 联合类型
type Status = "pending" | "success" | "error";
type ID = string | number;

let status: Status = "success";
let id: ID = 123;

// 函数类型
type AddFn = (a: number, b: number) => number;

const add: AddFn = (a, b) => a + b;
```

### Day 5：函数类型

```typescript
// 函数声明
function greet(name: string): string {
  return `Hello, ${name}`;
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b;

// 可选参数和默认参数
function greetUser(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}`;
}

function greetWithDefault(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}`;
}
```

### Day 6-7：TS 练习

**练习：**
- [ ] 定义一个 Product 接口
- [ ] 写一个计算总价的函数
- [ ] 创建一个用户管理系统类型

---

## 阶段二：React + TS 基础（第 2-3 周）

### 第 2 周：认识 React + TS

#### Day 8：创建 TS 项目

```bash
# 使用 Vite（推荐）
npm create vite@latest my-react-app -- --template react-ts

cd my-react-app
npm install
npm run dev
```

**项目结构：**
```
my-react-app/
├── src/
│   ├── App.tsx        # 主组件
│   ├── main.tsx       # 入口文件
│   └── vite-env.d.ts  # 类型声明文件
├── tsconfig.json      # TS 配置
└── package.json
```

#### Day 9：TSX 语法

```tsx
// TSX = TypeScript + JSX

// 定义变量
const name: string = "React";
const count: number = 42;
const isActive: boolean = true;

function App(): JSX.Element {
  return (
    <div className="app">
      <h1>Hello, {name}!</h1>
      <p>Count: {count}</p>
      <p>{isActive ? "激活" : "未激活"}</p>
    </div>
  );
}
```

#### Day 10：组件 Props 类型

```tsx
// 定义 Props 类型
interface WelcomeProps {
  name: string;
  age?: number;  // 可选
}

// 函数组件
function Welcome({ name, age = 18 }: WelcomeProps): JSX.Element {
  return (
    <div>
      <h1>你好, {name}!</h1>
      {age && <p>年龄: {age}</p>}
    </div>
  );
}

// 使用
<Welcome name="张三" age={25} />
<Welcome name="李四" />  // age 使用默认值
```

#### Day 11：Children 类型

```tsx
import { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;  // 可以是任何 React 子元素
}

function Card({ title, children }: CardProps): JSX.Element {
  return (
    <div className="card">
      <h2>{title}</h2>
      <div className="content">{children}</div>
    </div>
  );
}

// 使用
<Card title="卡片标题">
  <p>这是内容</p>
  <button>按钮</button>
</Card>
```

#### Day 12：useState 类型

```tsx
import { useState } from "react";

// 基本类型（自动推断）
function Counter(): JSX.Element {
  const [count, setCount] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [isOn, setIsOn] = useState<boolean>(false);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

// 对象类型
interface User {
  name: string;
  age: number;
}

function UserForm(): JSX.Element {
  const [user, setUser] = useState<User>({ name: "", age: 0 });

  const updateName = (newName: string): void => {
    setUser(prev => ({ ...prev, name: newName }));
  };

  return <input value={user.name} onChange={e => updateName(e.target.value)} />;
}

// 数组类型
function TodoList(): JSX.Element {
  const [todos, setTodos] = useState<string[]>([]);

  const addTodo = (todo: string): void => {
    setTodos(prev => [...prev, todo]);
  };

  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>{todo}</li>
      ))}
    </ul>
  );
}
```

#### Day 13-14：阶段练习

**项目：TS 待办事项列表（基础版）**

```typescript
// types.ts
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

// App.tsx
import { useState } from "react";
import { Todo } from "./types";

function App(): JSX.Element {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState<string>("");

  const addTodo = (): void => {
    if (!input.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: input,
      completed: false
    };

    setTodos(prev => [...prev, newTodo]);
    setInput("");
  };

  const toggleTodo = (id: number): void => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number): void => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div>
      <h1>待办事项</h1>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="输入新任务"
      />
      <button onClick={addTodo}>添加</button>

      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            style={{ textDecoration: todo.completed ? "line-through" : "none" }}
          >
            <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### 第 3 周：React + TS 进阶基础

#### Day 15：事件处理类型

```tsx
import { MouseEvent, ChangeEvent, FormEvent, KeyboardEvent } from "react";

function EventExamples(): JSX.Element {
  // 点击事件
  const handleClick = (e: MouseEvent<HTMLButtonElement>): void => {
    console.log("点击了按钮", e.currentTarget);
  };

  // 输入事件
  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    console.log("输入值:", e.target.value);
  };

  // 表单提交
  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("提交表单");
  };

  // 键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      console.log("按下了回车");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleClick}>点击</button>
    </form>
  );
}
```

#### Day 16：条件渲染

```tsx
interface GreetingProps {
  isLoggedIn: boolean;
  userName?: string;
}

function Greeting({ isLoggedIn, userName }: GreetingProps): JSX.Element {
  // if 语句
  if (isLoggedIn) {
    return <h1>欢迎回来, {userName}!</h1>;
  }
  return <h1>请登录</h1>;
}

// 三元运算符
function UserStatus({ isLoggedIn, userName }: GreetingProps): JSX.Element {
  return (
    <div>
      {isLoggedIn ? (
        <h1>欢迎, {userName}</h1>
      ) : (
        <h1>请登录</h1>
      )}
    </div>
  );
}

// 逻辑与
function MessageCount({ count }: { count: number }): JSX.Element | null {
  return (
    <div>
      {count > 0 && <p>你有 {count} 条消息</p>}
    </div>
  );
}
```

#### Day 17：列表渲染

```tsx
interface User {
  id: number;
  name: string;
  age: number;
}

interface UserListProps {
  users: User[];
  onDelete: (id: number) => void;
}

function UserList({ users, onDelete }: UserListProps): JSX.Element {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>
          {user.name} - {user.age}岁
          <button onClick={() => onDelete(user.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}

// 使用
const users: User[] = [
  { id: 1, name: "张三", age: 25 },
  { id: 2, name: "李四", age: 30 }
];

<UserList users={users} onDelete={(id) => console.log("删除:", id)} />
```

#### Day 18：表单处理

```tsx
import { useState, ChangeEvent, FormEvent } from "react";

interface FormData {
  username: string;
  email: string;
  age: number;
}

function UserForm(): JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    age: 0
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "age" ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("提交:", formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={formData.username}
        onChange={handleChange}
        placeholder="用户名"
      />
      <input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="邮箱"
      />
      <input
        name="age"
        type="number"
        value={formData.age}
        onChange={handleChange}
        placeholder="年龄"
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

#### Day 19：泛型组件

```tsx
// 泛型列表组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>): JSX.Element {
  return (
    <ul>
      {items.map(item => (
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

const users: User[] = [
  { id: 1, name: "张三" },
  { id: 2, name: "李四" }
];

<List
  items={users}
  renderItem={user => <span>{user.name}</span>}
  keyExtractor={user => user.id}
/>
```

#### Day 20-21：阶段项目

**项目：TS 用户管理系统**

功能：
- [ ] 显示用户列表
- [ ] 添加新用户（表单）
- [ ] 删除用户
- [ ] 简单的搜索过滤

---

## 阶段三：React + TS 核心（第 4-5 周）

### 第 4 周：Hooks 深入

#### Day 22：useEffect 类型

```tsx
import { useState, useEffect } from "react";

interface User {
  id: number;
  name: string;
}

function UserList(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchUsers = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error("获取失败");
        const data: User[] = await response.json();

        if (!isCancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : "未知错误");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    // 清理函数
    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) return <p>加载中...</p>;
  if (error) return <p>错误: {error}</p>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

#### Day 23：useRef 类型

```tsx
import { useRef, useEffect } from "react";

function TextInput(): JSX.Element {
  // DOM 引用
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 自动聚焦
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}

// 保存前值
function Counter(): JSX.Element {
  const [count, setCount] = useState<number>(0);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    prevCountRef.current = count;
  });

  const prevCount = prevCountRef.current;

  return (
    <div>
      <p>当前: {count}, 之前: {prevCount}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}
```

#### Day 24：useMemo 和 useCallback

```tsx
import { useState, useMemo, useCallback } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

function ProductList({ products }: { products: Product[] }): JSX.Element {
  const [filter, setFilter] = useState<string>("");

  // 缓存过滤结果
  const filteredProducts = useMemo<Product[]>(() => {
    console.log("重新计算过滤");
    return products.filter(p =>
      p.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [products, filter]);

  // 缓存回调函数
  const handleAddToCart = useCallback((product: Product): void => {
    console.log("添加到购物车:", product);
  }, []);

  return (
    <div>
      <input
        value={filter}
        onChange={e => setFilter(e.target.value)}
        placeholder="搜索产品"
      />
      {filteredProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={handleAddToCart}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard = React.memo(function ProductCard({
  product,
  onAdd
}: ProductCardProps): JSX.Element {
  console.log("渲染:", product.name);

  return (
    <div>
      <h3>{product.name}</h3>
      <p>¥{product.price}</p>
      <button onClick={() => onAdd(product)}>加入购物车</button>
    </div>
  );
});
```

#### Day 25：useReducer

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

function Counter(): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <input
        type="number"
        value={state.step}
        onChange={e =>
          dispatch({ type: "setStep", payload: Number(e.target.value) })
        }
      />
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>重置</button>
    </div>
  );
}
```

### 第 5 周：组件进阶

#### Day 26：组件通信

```typescript
// 父组件
interface ParentState {
  message: string;
  count: number;
}

function Parent(): JSX.Element {
  const [state, setState] = useState<ParentState>({
    message: "",
    count: 0
  });

  const handleMessage = useCallback((msg: string): void => {
    setState(prev => ({ ...prev, message: msg }));
  }, []);

  const handleCount = useCallback((n: number): void => {
    setState(prev => ({ ...prev, count: prev.count + n }));
  }, []);

  return (
    <div>
      <p>收到的消息: {state.message}</p>
      <p>计数: {state.count}</p>
      <ChildA onSendMessage={handleMessage} />
      <ChildB onAddCount={handleCount} />
    </div>
  );
}

// 子组件 A
interface ChildAProps {
  onSendMessage: (msg: string) => void;
}

function ChildA({ onSendMessage }: ChildAProps): JSX.Element {
  return (
    <button onClick={() => onSendMessage("来自 A 的消息")}>
      发送消息
    </button>
  );
}

// 子组件 B
interface ChildBProps {
  onAddCount: (n: number) => void;
}

function ChildB({ onAddCount }: ChildBProps): JSX.Element {
  return (
    <button onClick={() => onAddCount(1)}>
      +1
    </button>
  );
}
```

#### Day 27：Context + TypeScript

```typescript
// 定义 Context 类型
interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// 创建 Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 自定义 Hook 使用 Context
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Provider 组件
interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = useCallback((): void => {
    setTheme(prev => prev === "light" ? "dark" : "light");
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

// 使用
function ThemedButton(): JSX.Element {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: theme === "light" ? "#fff" : "#333",
        color: theme === "light" ? "#333" : "#fff"
      }}
    >
      当前主题: {theme}
    </button>
  );
}
```

#### Day 28-35：综合练习

**项目：TS 购物车**

```typescript
// types/cart.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "UPDATE_QUANTITY"; payload: { id: number; quantity: number } }
  | { type: "CLEAR_CART" };

// 组件实现...
```

---

## 阶段四：React + TS 进阶（第 6-7 周）

### 第 6 周：高级 Hooks 和模式

#### Day 36-42：自定义 Hooks

```typescript
// hooks/useLocalStorage.ts
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

// hooks/useDebounce.ts
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// hooks/useFetch.ts
interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(url: string): UseFetchState<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        const response = await fetch(url);
        if (!response.ok) throw new Error("获取失败");
        const data: T = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error("未知错误")
        });
      }
    };

    fetchData();
  }, [url]);

  return state;
}
```

### 第 7 周：性能优化和模式

#### Day 43-48：性能优化

```typescript
// React.memo 优化
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T extends { id: number }>({ items, renderItem }: ListProps<T>): JSX.Element {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// 虚拟列表
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T) => React.ReactNode;
}

function VirtualList<T extends { id: number }>({
  items,
  itemHeight,
  height,
  renderItem
}: VirtualListProps<T>): JSX.Element {
  // 实现...
}

// 代码分割
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));

function App(): JSX.Element {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 阶段五：实战与生态（第 8-10 周）

### 第 8 周：路由与样式

#### Day 49：React Router + TS

```typescript
// router.tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// 路由配置类型
interface RouteConfig {
  path: string;
  element: React.ReactNode;
  children?: RouteConfig[];
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "user/:id", element: <UserProfile /> }
    ]
  }
]);

// 使用 params
import { useParams } from "react-router-dom";

interface UserParams {
  id: string;
}

function UserProfile(): JSX.Element {
  const { id } = useParams<keyof UserParams>() as UserParams;
  return <div>用户ID: {id}</div>;
}
```

#### Day 50-52：样式解决方案

```typescript
// Tailwind CSS + TS（无需额外配置）
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

function Button({
  variant = "primary",
  size = "md",
  children,
  onClick
}: ButtonProps): JSX.Element {
  const baseStyles = "rounded font-semibold transition-colors";

  const variantStyles = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };

  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 第 9 周：数据管理

#### Day 53-55：React Query + TS

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// 数据类型
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// 查询
function useTodos() {
  return useQuery<Todo[], Error>({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch("/api/todos");
      if (!response.ok) throw new Error("获取失败");
      return response.json();
    }
  });
}

// 修改
function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, string>({
    mutationFn: async (title) => {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      });
      if (!response.ok) throw new Error("添加失败");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    }
  });
}

// 使用
function TodoList(): JSX.Element {
  const { data: todos, isLoading, error } = useTodos();
  const addTodo = useAddTodo();

  if (isLoading) return <p>加载中...</p>;
  if (error) return <p>错误: {error.message}</p>;

  return (
    <div>
      {todos?.map(todo => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

### 第 10 周：项目实战

#### Day 56-70：完整项目

**推荐项目：个人博客系统（TS 版）**

```typescript
// 项目结构
src/
├── components/       # 组件
│   ├── common/      # 通用组件
│   └── blog/        # 博客相关组件
├── hooks/           # 自定义 Hooks
├── contexts/        # Context
├── types/           # 类型定义
│   ├── blog.ts
│   ├── user.ts
│   └── api.ts
├── services/        # API 服务
├── utils/           # 工具函数
└── pages/           # 页面组件

// types/blog.ts
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  author: User;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

export interface CreateBlogDTO {
  title: string;
  content: string;
  tags: string[];
  published?: boolean;
}

// types/api.ts
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

---

## 📋 学习检查清单

### TypeScript 基础
- [ ] 理解基本类型（string, number, boolean）
- [ ] 会使用接口定义对象
- [ ] 会使用类型别名
- [ ] 理解可选属性和只读属性
- [ ] 会为函数添加类型

### React + TS 基础
- [ ] 能创建 TS React 项目
- [ ] 会为 Props 定义类型
- [ ] 会使用 useState 的泛型
- [ ] 会为事件处理添加类型

### React + TS 核心
- [ ] 掌握 useEffect 类型
- [ ] 会使用 useRef 的泛型
- [ ] 掌握 useReducer 的类型定义
- [ ] 会创建泛型组件

### 进阶
- [ ] 会使用 Context + TS
- [ ] 会编写自定义 Hooks（带类型）
- [ ] 会使用 React Router + TS
- [ ] 会使用数据获取库 + TS

---

## 💡 学习建议

### 1. 从简单类型开始
不要一开始就追求完美类型，先用 `any` 让代码跑起来，再逐步细化类型。

### 2. 善用类型推断
TypeScript 很聪明，很多情况下不需要显式声明类型。

```typescript
// 不需要显式声明
const [count, setCount] = useState(0);  // 自动推断为 number

// 复杂类型才需要
const [user, setUser] = useState<User | null>(null);
```

### 3. 利用 IDE 提示
TypeScript 最大的好处是代码提示，善用 IntelliSense。

### 4. 渐进式采用
- 新项目：直接使用 TS
- 老项目：逐步迁移，先 `.tsx` 再细化类型

---

## 📚 推荐资源

### 文档
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React TypeScript 速查表](https://react-typescript-cheatsheet.netlify.app/)

### 工具
- [TS Playground](https://www.typescriptlang.org/play) - 在线练习
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操

---

**记住：TypeScript 是工具，不是目的。先让代码工作，再让它类型安全！** 🚀
