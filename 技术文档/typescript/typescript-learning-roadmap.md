# TypeScript 零基础学习路线图

> 从 JavaScript 到 TypeScript，构建类型安全的应用程序
> 预计学习周期：4-6 周

---

## 🎯 写给初学者

**TypeScript 是什么？**
TypeScript 是 JavaScript 的超集，添加了类型系统。它让你的代码更健壮、更易维护，是现代前端开发的标准选择。

**为什么要学 TypeScript？**
- ✅ 在编码时就能发现错误，而不是运行时
- ✅ 更好的 IDE 支持（自动补全、代码提示）
- ✅ 更易于重构大型项目
- ✅ 提高团队协作效率
- ✅ 大多数现代框架（React、Vue、Angular）都推荐使用

**学习 TypeScript 需要什么基础？**
- ✅ 扎实的 JavaScript 基础
- ✅ ES6+ 语法知识（箭头函数、解构、模块等）
- ❌ 不需要有框架经验

---

## 📍 学习路线图概览

```
阶段一：TypeScript 基础（第 1-2 周）
    ├── 环境搭建与配置
    ├── 基本类型系统
    ├── 接口（Interface）
    └── 类型别名（Type Alias）

阶段二：TypeScript 核心（第 2-3 周）
    ├── 函数与类型
    ├── 类与面向对象
    ├── 泛型（Generics）
    └── 类型推断与类型断言

阶段三：TypeScript 进阶（第 3-4 周）
    ├── 高级类型操作
    ├── 条件类型与映射类型
    ├── 类型守卫与类型缩小
    └── 模块与命名空间

阶段四：实战与工程化（第 5-6 周）
    ├── 与 React/Vue 结合
    ├── 配置 tsconfig.json
    ├── 类型声明文件
    └── 项目实战
```

---

## 阶段一：TypeScript 基础（第 1-2 周）

### 第 1 周：认识 TypeScript

#### Day 1：环境搭建

**安装 TypeScript：**
```bash
# 全局安装
npm install -g typescript

# 项目内安装（推荐）
npm install -D typescript

# 验证安装
tsc --version
```

**第一个 TypeScript 文件：**
```typescript
// hello.ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet("TypeScript"));
```

**编译运行：**
```bash
# 编译 TS 文件为 JS
tsc hello.ts

# 运行生成的 JS
node hello.js
```

**使用 ts-node 直接运行：**
```bash
npm install -D ts-node
npx ts-node hello.ts
```

#### Day 2：基本类型

**原始类型：**
```typescript
// 字符串
let userName: string = "Alice";

// 数字
let age: number = 25;

// 布尔值
let isActive: boolean = true;

// null 和 undefined
let nullValue: null = null;
let undefinedValue: undefined = undefined;

// symbol
let sym: symbol = Symbol("key");

// bigint
let bigNum: bigint = 100n;
```

**数组类型：**
```typescript
// 方式一：类型[]
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["Alice", "Bob", "Charlie"];

// 方式二：Array<类型>
let scores: Array<number> = [90, 85, 95];

// 混合数组（元组）
let person: [string, number] = ["Alice", 25];
```

**特殊类型：**
```typescript
// any - 禁用类型检查（尽量避免使用）
let anything: any = 4;
anything = "string";
anything = true;

// unknown - 安全的 any
let unknownValue: unknown = 4;
// 使用前需要类型检查
if (typeof unknownValue === "number") {
  console.log(unknownValue + 1);
}

// void - 无返回值
function logMessage(message: string): void {
  console.log(message);
}

// never - 永不返回
function throwError(message: string): never {
  throw new Error(message);
}
```

**练习：**
- [ ] 创建一个包含各种基本类型的变量集合
- [ ] 编写一个函数，接收不同类型的参数

#### Day 3：接口（Interface）

**基础接口：**
```typescript
interface User {
  name: string;
  age: number;
  email: string;
}

// 使用接口
const user: User = {
  name: "Alice",
  age: 25,
  email: "alice@example.com"
};
```

**可选属性：**
```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;  // 可选属性
}

const product: Product = {
  id: 1,
  name: "iPhone",
  price: 999
  // description 可以省略
};
```

**只读属性：**
```typescript
interface Point {
  readonly x: number;
  readonly y: number;
}

const point: Point = { x: 10, y: 20 };
// point.x = 5;  // ❌ 错误：无法修改只读属性
```

**函数接口：**
```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = function(source, subString) {
  return source.includes(subString);
};
```

**练习：**
- [ ] 定义一个接口描述书籍信息
- [ ] 定义一个接口描述 API 响应格式

#### Day 4：类型别名（Type Alias）

**基础类型别名：**
```typescript
type UserID = string;
type Age = number;

let userId: UserID = "user123";
let userAge: Age = 25;
```

**对象类型：**
```typescript
type Person = {
  name: string;
  age: number;
  hobbies?: string[];
};

const person: Person = {
  name: "Bob",
  age: 30
};
```

**联合类型：**
```typescript
type Status = "pending" | "success" | "error";
type ID = string | number;

let userStatus: Status = "pending";
let userId: ID = 123;  // 或 "abc"
```

**交叉类型：**
```typescript
type Animal = {
  name: string;
};

type Bird = {
  canFly: boolean;
};

type Eagle = Animal & Bird;

const eagle: Eagle = {
  name: "Eagle",
  canFly: true
};
```

**Interface vs Type：**
| 特性 | Interface | Type |
|------|-----------|------|
| 可扩展性 | 可以声明合并 | 不能声明合并 |
| 扩展方式 | extends | & 交叉类型 |
| 适用场景 | 对象结构 | 任意类型 |

**练习：**
- [ ] 使用类型别名定义一个颜色类型（字符串字面量联合）
- [ ] 创建一个交叉类型组合多个类型

#### Day 5：枚举（Enum）

**数字枚举：**
```typescript
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

console.log(Direction.Up);     // 0
console.log(Direction[0]);     // "Up"
```

**自定义值枚举：**
```typescript
enum StatusCode {
  OK = 200,
  NotFound = 404,
  ServerError = 500
}

enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}
```

**常量枚举：**
```typescript
const enum Permission {
  Read = 1,
  Write = 2,
  Execute = 4
}
```

#### Day 6-7：阶段练习

**项目：用户信息管理系统（基础版）**

功能：
- [ ] 定义 User 接口（包含 id, name, email, age, role）
- [ ] 创建用户数组
- [ ] 实现添加用户函数
- [ ] 实现查找用户函数
- [ ] 使用枚举定义用户角色

---

### 第 2 周：函数与对象

#### Day 8：函数类型

**函数声明：**
```typescript
// 命名函数
function add(a: number, b: number): number {
  return a + b;
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b;

// 函数表达式
const subtract: (a: number, b: number) => number = function(a, b) {
  return a - b;
};
```

**可选参数和默认参数：**
```typescript
// 可选参数
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

// 默认参数
function greetWithDefault(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((total, num) => total + num, 0);
}
```

**函数重载：**
```typescript
function processInput(input: string): string;
function processInput(input: number): number;
function processInput(input: string | number): string | number {
  if (typeof input === "string") {
    return input.toUpperCase();
  }
  return input * 2;
}
```

#### Day 9：类基础

**基本类：**
```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  move(distance: number): void {
    console.log(`${this.name} moved ${distance} meters`);
  }
}

const dog = new Animal("Dog");
dog.move(10);
```

**访问修饰符：**
```typescript
class Person {
  public name: string;      // 公开（默认）
  private age: number;      // 私有
  protected email: string;  // 受保护

  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }

  public getAge(): number {
    return this.age;
  }
}

class Employee extends Person {
  constructor(name: string, age: number, email: string) {
    super(name, age, email);
    // 可以访问 this.email（protected）
    // 不能访问 this.age（private）
  }
}
```

**只读属性：**
```typescript
class Car {
  readonly brand: string;

  constructor(brand: string) {
    this.brand = brand;
  }
}

const car = new Car("Toyota");
// car.brand = "Honda";  // ❌ 错误
```

**Getter 和 Setter：**
```typescript
class Rectangle {
  private _width: number = 0;
  private _height: number = 0;

  get area(): number {
    return this._width * this._height;
  }

  set width(value: number) {
    if (value > 0) {
      this._width = value;
    }
  }

  set height(value: number) {
    if (value > 0) {
      this._height = value;
    }
  }
}
```

#### Day 10：继承与多态

**类继承：**
```typescript
class Animal {
  constructor(public name: string) {}

  move(distance: number): void {
    console.log(`${this.name} moved ${distance}m`);
  }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name);
  }

  bark(): void {
    console.log("Woof! Woof!");
  }

  // 重写父类方法
  move(distance: number): void {
    console.log("Running...");
    super.move(distance);
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
dog.move(10);
dog.bark();
```

**抽象类：**
```typescript
abstract class Shape {
  abstract getArea(): number;

  printArea(): void {
    console.log(`Area: ${this.getArea()}`);
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius ** 2;
  }
}
```

#### Day 11：接口实现

**类实现接口：**
```typescript
interface Printable {
  print(): void;
}

interface Scannable {
  scan(): void;
}

class Printer implements Printable {
  print(): void {
    console.log("Printing...");
  }
}

class MultiFunctionDevice implements Printable, Scannable {
  print(): void {
    console.log("Printing...");
  }

  scan(): void {
    console.log("Scanning...");
  }
}
```

#### Day 12-14：阶段项目

**项目：电商商品系统**

功能：
- [ ] 定义 Product 接口
- [ ] 创建抽象类 BaseProduct
- [ ] 实现 Electronics 和 Clothing 类
- [ ] 实现折扣计算功能
- [ ] 使用访问修饰符保护数据

---

## 阶段二：TypeScript 核心（第 3-4 周）

### 第 3 周：泛型与类型操作

#### Day 15：泛型基础

**为什么需要泛型？**
```typescript
// 不使用泛型 - 需要为每种类型写重复代码
function identityString(arg: string): string {
  return arg;
}

function identityNumber(arg: number): number {
  return arg;
}

// 使用泛型 - 一个函数处理所有类型
function identity<T>(arg: T): T {
  return arg;
}

// 使用
let output1 = identity<string>("hello");
let output2 = identity<number>(42);
let output3 = identity("hello");  // 类型推断
```

**泛型约束：**
```typescript
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("hello");     // ✅
logLength([1, 2, 3]);   // ✅
// logLength(123);      // ❌ 错误：number 没有 length 属性
```

**多个泛型参数：**
```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair<string, number>("age", 25);
```

#### Day 16：泛型接口与类

**泛型接口：**
```typescript
interface GenericResponse<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: number;
  name: string;
}

const userResponse: GenericResponse<User> = {
  data: { id: 1, name: "Alice" },
  status: 200,
  message: "Success"
};
```

**泛型类：**
```typescript
class GenericStack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

// 使用
const numberStack = new GenericStack<number>();
numberStack.push(1);
numberStack.push(2);
console.log(numberStack.pop());  // 2

const stringStack = new GenericStack<string>();
stringStack.push("hello");
```

#### Day 17：类型推断与类型断言

**类型推断：**
```typescript
// TypeScript 自动推断类型
let x = 3;                    // 推断为 number
let y = [0, 1, null];        // 推断为 (number | null)[]

// 上下文类型推断
window.onmousedown = function(event) {
  console.log(event.button);  // TypeScript 知道 event 是 MouseEvent
};
```

**类型断言：**
```typescript
// 方式一：尖括号语法
let someValue: unknown = "this is a string";
let strLength: number = (<string>someValue).length;

// 方式二：as 语法（推荐，JSX 中必须使用）
let strLength2: number = (someValue as string).length;

// 非空断言
function processElement(element?: HTMLElement) {
  // 告诉 TypeScript 我确定这里不会是 null/undefined
  element!.style.color = "red";
}
```

**常量断言：**
```typescript
// as const 创建只读字面量类型
const config = {
  host: "localhost",
  port: 3000
} as const;

// config.host = "example.com";  // ❌ 错误
```

#### Day 18-19：练习

**项目：通用数据存储系统**

- [ ] 创建泛型 Storage 类
- [ ] 实现 CRUD 操作
- [ ] 添加类型约束
- [ ] 实现缓存机制

### 第 4 周：高级类型

#### Day 20：类型守卫

**typeof 类型守卫：**
```typescript
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    // TypeScript 知道这里 padding 是 number
    return Array(padding + 1).join(" ") + value;
  }
  // TypeScript 知道这里 padding 是 string
  return padding + value;
}
```

**instanceof 类型守卫：**
```typescript
class Bird {
  fly() {
    console.log("Flying");
  }
}

class Fish {
  swim() {
    console.log("Swimming");
  }
}

function move(animal: Bird | Fish) {
  if (animal instanceof Bird) {
    animal.fly();
  } else {
    animal.swim();
  }
}
```

**in 类型守卫：**
```typescript
interface Car {
  drive(): void;
  wheels: number;
}

interface Boat {
  sail(): void;
  anchor(): void;
}

function operate(vehicle: Car | Boat) {
  if ("drive" in vehicle) {
    vehicle.drive();
  } else {
    vehicle.sail();
  }
}
```

**自定义类型守卫：**
```typescript
interface Cat {
  meow(): void;
}

interface Dog {
  bark(): void;
}

function isCat(animal: Cat | Dog): animal is Cat {
  return (animal as Cat).meow !== undefined;
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow();
  } else {
    animal.bark();
  }
}
```

#### Day 21：联合类型与交叉类型进阶

**可辨识联合：**
```typescript
interface Square {
  kind: "square";
  size: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Circle {
  kind: "circle";
  radius: number;
}

type Shape = Square | Rectangle | Circle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "square":
      return shape.size ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "circle":
      return Math.PI * shape.radius ** 2;
    default:
      // 穷尽检查
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

#### Day 22：映射类型

**基础映射类型：**
```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};

type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// 使用
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

type ReadonlyUser = Readonly<User>;
type UserUpdate = Partial<User>;
type PublicUser = Omit<User, "password">;
type UserSummary = Pick<User, "id" | "name">;
```

**自定义映射类型：**
```typescript
// 将所有属性变为可空字符串
type NullableString<T> = {
  [P in keyof T]: string | null;
};

// 为所有属性添加 getter
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};
```

#### Day 23-24：条件类型

**基础条件类型：**
```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
```

**内置条件类型：**
```typescript
// Exclude<T, U> - 从 T 中排除 U
type T0 = Exclude<"a" | "b" | "c", "a">;  // "b" | "c"

// Extract<T, U> - 从 T 中提取 U
type T1 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"

// NonNullable<T> - 排除 null 和 undefined
type T2 = NonNullable<string | number | undefined>;  // string | number

// ReturnType<T> - 获取函数返回类型
type T3 = ReturnType<() => string>;  // string

// Parameters<T> - 获取函数参数类型
type T4 = Parameters<(a: number, b: string) => void>;  // [number, string]
```

**infer 关键字：**
```typescript
// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : T;

type Num = ElementType<number[]>;  // number
type Str = ElementType<string>;    // string

// 提取 Promise 返回值
type Awaited<T> = T extends Promise<infer U> ? U : T;
```

#### Day 25-28：综合练习

**项目：类型安全的 API 客户端**

- [ ] 定义 API 响应类型
- [ ] 实现泛型请求函数
- [ ] 使用条件类型处理错误
- [ ] 创建类型守卫验证响应

---

## 阶段三：TypeScript 进阶（第 5-6 周）

### 第 5 周：工程化与装饰器

#### Day 29：装饰器

**启用装饰器：**
```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**类装饰器：**
```typescript
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}
```

**方法装饰器：**
```typescript
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Result:`, result);
    return result;
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}
```

#### Day 30：模块系统

**导出：**
```typescript
// math.ts
export const PI = 3.14;

export function add(a: number, b: number): number {
  return a + b;
}

export default class Calculator {
  // ...
}
```

**导入：**
```typescript
// main.ts
import Calculator, { PI, add } from "./math";
import * as math from "./math";
import type { User } from "./types";  // 仅类型导入
```

**模块解析：**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

#### Day 31：命名空间

```typescript
namespace Validation {
  export interface StringValidator {
    isValid(s: string): boolean;
  }

  const lettersRegexp = /^[A-Za-z]+$/;
  const numberRegexp = /^[0-9]+$/;

  export class LettersOnlyValidator implements StringValidator {
    isValid(s: string): boolean {
      return lettersRegexp.test(s);
    }
  }

  export class ZipCodeValidator implements StringValidator {
    isValid(s: string): boolean {
      return s.length === 5 && numberRegexp.test(s);
    }
  }
}

// 使用
const validator = new Validation.LettersOnlyValidator();
```

#### Day 32-35：tsconfig.json 配置

**完整配置示例：**
```json
{
  "compilerOptions": {
    /* 基础选项 */
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",

    /* 输出选项 */
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,

    /* 严格类型检查 */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,

    /* 模块解析 */
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "resolveJsonModule": true,

    /* 其他 */
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 第 6 周：类型声明文件

#### Day 36：声明文件基础

**创建 .d.ts 文件：**
```typescript
// types.d.ts
interface Window {
  myLib: {
    version: string;
    doSomething(): void;
  };
}

declare const MY_CONSTANT: string;

declare function myFunction(a: number): string;
```

**为第三方库写声明：**
```typescript
// lodash.d.ts
declare module "lodash" {
  export function cloneDeep<T>(value: T): T;
  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number
  ): T;
  // ...
}
```

#### Day 37：发布类型定义

```typescript
// index.d.ts
export interface Options {
  verbose?: boolean;
  timeout?: number;
}

export function initialize(options?: Options): void;
export function process(data: string): Promise<string>;

// 模块声明
declare module "my-library" {
  export * from "./index";
}
```

#### Day 38-42：与框架结合

**React + TypeScript：**
```typescript
import React, { useState, useEffect } from "react";

// 组件 Props 类型
interface UserCardProps {
  name: string;
  age: number;
  onEdit?: (id: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ name, age, onEdit }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);

  return (
    <div>
      <h2>{name}</h2>
      <p>{age} years old</p>
    </div>
  );
};

// 自定义 Hook
type UseFetchResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}
```

**Vue 3 + TypeScript：**
```typescript
import { defineComponent, ref, computed } from "vue";

interface User {
  id: number;
  name: string;
  email: string;
}

export default defineComponent({
  setup() {
    const user = ref<User | null>(null);
    const userName = computed<string>(() => user.value?.name ?? "");

    const fetchUser = async (id: number): Promise<void> => {
      const response = await fetch(`/api/users/${id}`);
      user.value = await response.json();
    };

    return { user, userName, fetchUser };
  }
});
```

---

## 阶段四：实战与最佳实践

### 类型体操挑战

**挑战 1：DeepReadonly**
```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};
```

**挑战 2：Tuple to Union**
```typescript
type TupleToUnion<T extends any[]> = T[number];

type Result = TupleToUnion<["a", "b", "c"]>;  // "a" | "b" | "c"
```

**挑战 3：DeepPick**
```typescript
type DeepPick<T, K extends string> = K extends `${infer F}.${infer R}`
  ? F extends keyof T
    ? { [P in F]: DeepPick<T[F], R> }
    : never
  : K extends keyof T
  ? { [P in K]: T[K] }
  : never;
```

---

## 📋 学习检查清单

### 阶段一
- [ ] 理解 TypeScript 与 JavaScript 的区别
- [ ] 掌握基本类型（string, number, boolean, array, tuple）
- [ ] 会使用 Interface 定义对象结构
- [ ] 会使用 Type Alias 创建类型别名
- [ ] 理解 Enum 枚举类型

### 阶段二
- [ ] 掌握函数类型定义
- [ ] 理解类与面向对象（访问修饰符、继承、抽象类）
- [ ] 会使用泛型（函数、接口、类）
- [ ] 理解类型推断与类型断言
- [ ] 掌握类型守卫（typeof, instanceof, in）

### 阶段三
- [ ] 理解映射类型（Partial, Required, Pick, Omit）
- [ ] 掌握条件类型与 infer
- [ ] 理解装饰器
- [ ] 会配置 tsconfig.json
- [ ] 会编写类型声明文件

### 阶段四
- [ ] 能在 React/Vue 项目中使用 TypeScript
- [ ] 理解类型安全的 API 设计
- [ ] 掌握类型体操基础

---

## 💡 开发技巧

### 1. 类型推导优于显式声明
```typescript
// ❌ 冗余
const name: string = "Alice";
const numbers: number[] = [1, 2, 3];

// ✅ 让 TypeScript 推断
const name = "Alice";
const numbers = [1, 2, 3];
```

### 2. 优先使用 Interface
```typescript
// 优先使用 interface，需要联合类型时用 type
interface User {
  name: string;
}

// 需要联合类型时使用 type
type Status = "active" | "inactive";
```

### 3. 避免使用 any
```typescript
// ❌ 避免
function process(data: any): any {
  return data;
}

// ✅ 使用 unknown 更安全
function process(data: unknown): unknown {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
  return data;
}
```

### 4. 使用严格模式
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### 5. 善用工具类型
```typescript
// 从已有类型派生新类型，减少重复定义
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// 创建用户表单类型（无 id，password 可选）
type UserForm = Omit<User, "id"> & { password?: string };

// 创建用户更新类型（所有字段可选）
type UserUpdate = Partial<Omit<User, "id">>;
```

### 6. 使用 satisfies 关键字
```typescript
const config = {
  host: "localhost",
  port: 3000
} satisfies Record<string, string | number>;

// 保留具体类型信息，同时检查约束
config.port.toFixed();  // ✅ 知道 port 是 number
```

### 7. 使用 branding 模式创建名义类型
```typescript
type UserId = string & { __brand: "UserId" };
type OrderId = string & { __brand: "OrderId" };

function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

// 不能混用
const userId = createUserId("user-1");
const orderId = createOrderId("order-1");
// processOrder(userId);  // ❌ 编译错误
```

---

## 📚 推荐资源

### 官方资源
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)（必读）
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TSConfig 参考](https://www.typescriptlang.org/tsconfig)

### 在线练习
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习

### 类型体操资源
- [utility-types](https://github.com/piotrwitek/utility-types) - 实用工具类型
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 类型工具库

### 实战教程
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vue 3 TypeScript 指南](https://vuejs.org/guide/typescript/overview.html)

### 工具推荐
- **VS Code**: 最佳的 TypeScript 开发体验
- **ESLint + @typescript-eslint**: 代码规范检查
- **Prettier**: 代码格式化

---

## 🎯 面试高频题

### 基础题
1. **interface 和 type 的区别？**
   - interface 支持声明合并，type 不支持
   - interface 用 extends 扩展，type 用 & 交叉类型
   - type 可以定义联合类型、元组等任何类型

2. **什么是泛型？有什么作用？**
   - 泛型是参数化的类型，让代码可以处理多种类型
   - 保持类型安全的同时提高代码复用性

3. **never 类型是什么？**
   - 表示永不发生的值
   - 用于穷尽检查、抛出异常的函数等

### 进阶题
4. **const 断言（as const）的作用？**
   - 将变量转换为只读字面量类型
   - 数组变为 readonly 元组

5. **如何实现一个 DeepReadonly？**
   ```typescript
   type DeepReadonly<T> = {
     readonly [P in keyof T]: T[P] extends object
       ? DeepReadonly<T[P]>
       : T[P];
   };
   ```

6. **infer 关键字的作用？**
   - 在条件类型中推断类型
   - 常用于提取函数返回类型、Promise 解析类型等

---

**记住：TypeScript 不仅是类型检查工具，更是提升代码质量的利器。** 🚀
