# React + TypeScript 开发技巧与速查手册

> 常用 TSX 代码片段、开发技巧和最佳实践
> 适合边学边查，建议收藏

---

## 目录
- [项目创建](#项目创建)
- [常用 Hooks（TS版）](#常用-hooks-ts版)
- [组件模式（TS版）](#组件模式ts版)
- [表单处理（TS版）](#表单处理ts版)
- [数据获取（TS版）](#数据获取ts版)
- [性能优化（TS版）](#性能优化ts版)
- [自定义 Hooks（TS版）](#自定义-hooks-ts版)
- [常见场景（TS版）](#常见场景ts版)

---

## 项目创建

### 使用 Vite（推荐）

```bash
# 创建 TS 项目
npm create vite@latest my-app -- --template react-ts

# 进入目录并安装依赖
cd my-app
npm install

# 启动开发服务器
npm run dev
```

### 项目结构

```
my-app/
├── src/
│   ├── components/     # 组件目录
│   ├── hooks/         # 自定义 Hooks
│   ├── types/         # 类型定义
│   ├── utils/         # 工具函数
│   ├── App.tsx        # 主组件
│   └── main.tsx       # 入口文件
├── tsconfig.json      # TS 配置
└── package.json
```

### 推荐配置

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 常用 Hooks（TS版）

### useState

```tsx
import { useState } from 'react';

// 基本类型（自动推断）
const [count, setCount] = useState(0);           // number
const [name, setName] = useState('');            // string
const [isOn, setIsOn] = useState(false);         // boolean

// 显式声明类型
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);

// 对象类型
interface User {
  name: string;
  age: number;
}

const [user, setUser] = useState<User>({ name: '', age: 0 });

// 更新函数类型推断
setUser(prev => ({ ...prev, name: '张三' }));  // prev 自动推断为 User
```

### useEffect

```tsx
import { useEffect } from 'react';

// 基础用法
useEffect(() => {
  console.log('执行副作用');
}, []);

// 带清理函数
useEffect(() => {
  const timer = setInterval(() => {}, 1000);

  return (): void => {
    clearInterval(timer);
  };
}, []);

// 异步数据获取
useEffect(() => {
  let isCancelled = false;

  const fetchData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/data');
      const data: User[] = await response.json();
      if (!isCancelled) {
        setUsers(data);
      }
    } catch (error) {
      if (!isCancelled) {
        setError(error instanceof Error ? error.message : '未知错误');
      }
    }
  };

  fetchData();

  return (): void => {
    isCancelled = true;
  };
}, []);
```

### useContext

```tsx
// 定义类型
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// 创建 Context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 自定义 Hook
function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// 使用
const { theme, toggleTheme } = useTheme();
```

### useRef

```tsx
import { useRef } from 'react';

// DOM 引用
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

// 保存前值
const prevCountRef = useRef<number>(0);

// 保存不触发渲染的值
const renderCount = useRef<number>(0);

// 复杂对象
interface TimerRef {
  id: ReturnType<typeof setInterval> | null;
}
const timerRef = useRef<TimerRef>({ id: null });
```

### useMemo

```tsx
import { useMemo } from 'react';

// 缓存计算结果
const expensiveValue = useMemo<number>(() => {
  return data.reduce((sum, item) => sum + item.value, 0);
}, [data]);

// 缓存对象
const config = useMemo<Config>(() => ({
  apiUrl: '/api',
  timeout: 5000
}), []);

// 过滤和排序
const filteredUsers = useMemo<User[]>(() => {
  return users
    .filter(u => u.name.includes(searchTerm))
    .sort((a, b) => b.score - a.score);
}, [users, searchTerm]);
```

### useCallback

```tsx
import { useCallback } from 'react';

// 缓存函数
const handleSubmit = useCallback<(data: FormData) => void>((data) => {
  console.log(data);
  onSubmit(data);
}, [onSubmit]);

// 带返回值的函数
const calculateTotal = useCallback(
  (items: CartItem[], discount: number): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 - discount);
  },
  []
);

// 空依赖
const handleClick = useCallback((): void => {
  setCount(c => c + 1);
}, []);
```

### useReducer

```tsx
// 定义状态和 Action 类型
interface State {
  count: number;
  step: number;
}

type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number }
  | { type: 'reset' };

const initialState: State = { count: 0, step: 1 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    case 'reset':
      return initialState;
    default:
      return state;
  }
}

// 使用
const [state, dispatch] = useReducer(reducer, initialState);
```

---

## 组件模式（TS版）

### 基础函数组件

```tsx
interface Props {
  title: string;
  description?: string;
}

function Card({ title, description }: Props): JSX.Element {
  return (
    <div className="card">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

// 默认 Props
Card.defaultProps = {
  description: ''
};
```

### 带 Children 的组件

```tsx
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
}

function Layout({ children, header, footer }: LayoutProps): JSX.Element {
  return (
    <div className="layout">
      {header && <header>{header}</header>}
      <main>{children}</main>
      {footer && <footer>{footer}</footer>}
    </div>
  );
}

// 使用
<Layout header={<Navbar />} footer={<Footer />}>
  <PageContent />
</Layout>
```

### 扩展 HTML 属性

```tsx
import { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// 扩展按钮属性
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

function Button({
  variant = 'primary',
  isLoading,
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button className={`btn-${variant}`} disabled={isLoading} {...rest}>
      {isLoading ? '加载中...' : children}
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

### forwardRef

```tsx
import { forwardRef } from 'react';

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

Input.displayName = 'Input';

// 使用
const inputRef = useRef<HTMLInputElement>(null);
<Input ref={inputRef} label="用户名" />
```

### 泛型组件

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
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
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
  renderItem={user => <span>{user.name}</span>}
  keyExtractor={user => user.id}
/>
```

---

## 表单处理（TS版）

### 基础表单

```tsx
import { useState, ChangeEvent, FormEvent } from 'react';

interface FormData {
  username: string;
  email: string;
  password: string;
}

function Form(): JSX.Element {
  const [values, setValues] = useState<FormData>({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={values.username}
        onChange={handleChange}
      />
      <input
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
      />
      <button type="submit">提交</button>
    </form>
  );
}
```

### 表单验证

```tsx
import { useState, FormEvent, ChangeEvent } from 'react';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

function FormWithValidation(): JSX.Element {
  const [values, setValues] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    email: false,
    password: false
  });

  const validate = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};
    if (!data.email.includes('@')) {
      newErrors.email = '请输入有效邮箱';
    }
    if (data.password.length < 6) {
      newErrors.password = '密码至少6位';
    }
    return newErrors;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));

    if (touched[name as keyof FormData]) {
      setErrors(validate({ ...values, [name]: value }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(validationErrors).length === 0) {
      console.log('提交:', values);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {errors.email && <span>{errors.email}</span>}

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {errors.password && <span>{errors.password}</span>}

      <button type="submit">提交</button>
    </form>
  );
}
```

### 使用 react-hook-form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// 定义 Schema
const schema = z.object({
  email: z.string().email('邮箱格式错误'),
  password: z.string().min(6, '密码至少6位'),
  age: z.number().min(18, '必须年满18岁')
});

type FormData = z.infer<typeof schema>;

function Form(): JSX.Element {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  const onSubmit = (data: FormData): void => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <input type="number" {...register('age', { valueAsNumber: true })} />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit">提交</button>
    </form>
  );
}
```

---

## 数据获取（TS版）

### 基础 fetch

```tsx
import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('获取失败');
        const result: T = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('未知错误'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// 使用
const { data: users, loading, error } = useFetch<User[]>('/api/users');
```

### 使用 axios

```tsx
import axios, { AxiosResponse, AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 定义 API 响应类型
interface ApiResponse<T> {
  data: T;
  message: string;
}

// 使用 React Query
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function useTodos() {
  return useQuery<Todo[], AxiosError>({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data } = await axios.get<ApiResponse<Todo[]>>('/api/todos');
      return data.data;
    }
  });
}

function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation<Todo, AxiosError, string>({
    mutationFn: async (title) => {
      const { data } = await axios.post<ApiResponse<Todo>>('/api/todos', { title });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });
}
```

---

## 性能优化（TS版）

### React.memo

```tsx
import { memo } from 'react';

interface UserCardProps {
  user: User;
  onSelect: (id: number) => void;
}

const UserCard = memo<UserCardProps>(
  function UserCard({ user, onSelect }) {
    return (
      <div onClick={() => onSelect(user.id)}>
        <h3>{user.name}</h3>
      </div>
    );
  },
  // 自定义比较
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);

// 或使用箭头函数
const UserCard2 = memo(({ user, onSelect }: UserCardProps) => {
  return <div>{user.name}</div>;
});
```

### 虚拟列表

```tsx
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface Item {
  id: number;
  name: string;
}

interface VirtualListProps {
  items: Item[];
}

function VirtualList({ items }: VirtualListProps): JSX.Element {
  const Row = ({ index, style }: ListChildComponentProps): JSX.Element => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 懒加载

```tsx
import { lazy, Suspense, ComponentType } from 'react';

// 懒加载组件
const HeavyComponent = lazy<ComponentType>(
  () => import('./HeavyComponent')
);

// 带类型的懒加载
interface HeavyComponentProps {
  data: string[];
}

const HeavyComponent2 = lazy<ComponentType<HeavyComponentProps>>(
  () => import('./HeavyComponent')
);

function App(): JSX.Element {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 自定义 Hooks（TS版）

### useLocalStorage

```tsx
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

// 使用
const [name, setName] = useLocalStorage<string>('name', '');
const [user, setUser] = useLocalStorage<User>('user', { name: '', age: 0 });
```

### useDebounce

```tsx
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

// 使用
const debouncedSearch = useDebounce<string>(searchTerm, 500);
```

### useFetch

```tsx
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
        const data: T = await response.json();
        setState({ data, loading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error('未知错误')
        });
      }
    };

    fetchData();
  }, [url]);

  return state;
}
```

### usePrevious

```tsx
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

// 使用
const prevCount = usePrevious<number>(count);
```

### useOnClickOutside

```tsx
function useOnClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent): void => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}

// 使用
const ref = useRef<HTMLDivElement>(null);
useOnClickOutside<HTMLDivElement>(ref, () => setIsOpen(false));
```

---

## 常见场景（TS版）

### 模态框

```tsx
import { useEffect, MouseEvent, KeyboardEvent } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps): JSX.Element | null {
  useEffect(() => {
    const handleEscape = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {title && <h2>{title}</h2>}
        {children}
        <button onClick={onClose}>关闭</button>
      </div>
    </div>
  );
}
```

### 无限滚动

```tsx
import { useEffect, useRef, useCallback, useState } from 'react';

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loaderRef: (node: HTMLDivElement | null) => void;
}

function useInfiniteScroll<T>(
  fetchItems: (page: number) => Promise<T[]>,
  hasMoreItems: (items: T[]) => boolean
): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null): void => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const loadItems = async (): Promise<void> => {
      setLoading(true);
      const newItems = await fetchItems(page);
      setItems(prev => [...prev, ...newItems]);
      setHasMore(hasMoreItems(newItems));
      setLoading(false);
    };

    loadItems();
  }, [page]);

  return { items, loading, hasMore, loaderRef: lastItemRef };
}
```

### 暗黑模式

```tsx
import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 倒计时

```tsx
import { useState, useEffect, useCallback } from 'react';

interface UseCountdownResult {
  secondsLeft: number;
  isRunning: boolean;
  start: (seconds?: number) => void;
  pause: () => void;
  reset: () => void;
}

function useCountdown(initialSeconds: number = 60): UseCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft(s => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const start = useCallback((seconds?: number): void => {
    if (seconds !== undefined) {
      setSecondsLeft(seconds);
    }
    setIsRunning(true);
  }, []);

  const pause = useCallback((): void => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((): void => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  return { secondsLeft, isRunning, start, pause, reset };
}
```

---

## 常用类型工具

### React 内置类型

```tsx
import {
  ReactNode,          // 任何可以作为子元素的类型
  ReactElement,       // 单个 React 元素
  ComponentType,      // 组件类型
  FC,                 // 函数组件（已不推荐使用）
  PropsWithChildren,  // 自动添加 children 类型
  HTMLProps,          // HTML 元素属性
  CSSProperties,      // 内联样式类型
  ChangeEvent,        // 变化事件
  MouseEvent,         // 鼠标事件
  FormEvent,          // 表单事件
  KeyboardEvent       // 键盘事件
} from 'react';

// PropsWithChildren 使用
interface MyComponentProps {
  title: string;
}

function MyComponent({ title, children }: PropsWithChildren<MyComponentProps>): JSX.Element {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

// CSSProperties
const styles: CSSProperties = {
  color: 'red',
  fontSize: '16px',
  display: 'flex'
};
```

### TypeScript 实用类型

```typescript
// Partial - 所有属性变为可选
type PartialUser = Partial<User>;

// Required - 所有属性变为必需
type RequiredUser = Required<User>;

// Pick - 选取部分属性
type UserBasicInfo = Pick<User, 'name' | 'email'>;

// Omit - 排除部分属性
type UserWithoutId = Omit<User, 'id'>;

// Record - 创建映射类型
type UserRoles = Record<number, string>;

// ReturnType - 获取函数返回类型
type SumReturn = ReturnType<typeof sum>;

// Parameters - 获取函数参数类型
type SumParams = Parameters<typeof sum>;

// NonNullable - 移除 null 和 undefined
type NonNullUser = NonNullable<User | null | undefined>;
```

---

## 推荐库（TS 支持）

| 类别 | 推荐库 |
|-----|--------|
| 路由 | react-router-dom |
| 状态管理 | Zustand, Redux Toolkit |
| 表单 | react-hook-form + zod |
| 服务端状态 | TanStack Query, SWR |
| UI 组件 | Ant Design, Material-UI, Chakra UI |
| 样式 | Tailwind CSS, Styled Components |
| 动画 | Framer Motion |
| 测试 | Jest, React Testing Library, Playwright |
| 日期 | date-fns |
| HTTP | axios |
| 验证 | zod, yup |

---

**TypeScript 是投资，不是负担。前期多花几分钟定义类型，后期节省几小时调试！** 🚀
