# 2. TypeScript 速查表（Cheatsheet）

> 来源可信度：**官方 Handbook 与 lib.es5.d.ts 内置定义**（TS 5.x 时代，所有类型示例可在 `tsc --strict` 下验证；每条均给一行签名/用法 + 一行结果）
> 关联：本表是全系列的"索引层"——每节末尾指向详解篇：类型标注见 `03-everyday-types.md`、收窄见 `04-narrowing.md`、函数见 `05-more-on-functions.md`、类见 `06-classes.md`、枚举见 `07-enums.md`、类型运算见 `08-creating-types-from-types.md`、装饰器见 `09-decorators.md`、模块见 `10-modules.md`、tsconfig 见 `11-tsconfig.md`、类型系统底层见 `12-typescript-advanced-type-system.md`。

## 1. 类型标注速查

```ts
// primitives.ts
let s: string = "hello";
let n: number = 42;                 // 整数/浮点/hex 不分家
let b: boolean = true;
let nl: null = null;
let un: undefined = undefined;
let sy: symbol = Symbol("k");
let big: bigint = 100n;             // target >= ES2020

// 数组两种等价写法
let arr1: number[] = [1, 2, 3];
let arr2: Array<number> = [1, 2, 3];
let grid: number[][] = [[1], [2]];

// 元组：定长定序，可加标签
let tup: [name: string, age: number] = ["Alice", 25];
let ro: readonly [number, number] = [1, 2];   // 只读元组

// 对象与可选/只读
let user: { id: number; name: string; email?: string; readonly createdAt: Date } =
  { id: 1, name: "a", createdAt: new Date() };

// 特殊类型
let anything: any = 4;              // 关闭检查，能不用就不用
let unknownValue: unknown = 4;      // 安全 any，先收窄再用
function log(): void { console.log("log"); }
function fail(): never { throw new Error("boom"); }
let obj: object = { x: 0 };         // 非原始类型集合，很少直接用
```

| 写法 | 含义 | 坑 |
|---|---|---|
| `string` vs `String` | 原始类型 vs 包装对象 | 标注一律小写（`03` 篇 1.1） |
| `T[]` vs `Array<T>` | 完全等价 | 嵌套时 `T[][]` 别写成 `[T[]]` |
| `(A \| B)[]` | 每个元素各自 A 或 B，可混装 `[1, "a"]` | 与 `A[] \| B[]`（整条数组同质）不同 |
| `Promise<number>[]` | 数组里装 Promise | 别与 `Promise<number[]>`（Promise 里装数组）写反 |
| `[string, number]` | 元组定长 | 长度/顺序都可校验；`string[]` 做不到 |
| `readonly T[]` | 只读数组 | 无 push/splice 等变更方法 |

## 2. any / unknown / never / void 对比

| 维度 | any | unknown | never | void |
|---|---|---|---|---|
| 语义 | 关闭类型检查 | 类型未定，检查全开 | 空集，不可能存在 | 无有意义返回值 |
| 什么能赋给它 | 任何值 | 任何值 | 只有 never | undefined（strict 下） |
| 它能赋给谁 | 任何类型（传染） | 仅 unknown/any | 任何类型 | 仅 void/unknown/any |
| 使用限制 | 无（危险） | 必须先收窄/断言 | 不可用 | 调用结果没信息 |
| 典型场景 | 渐进迁移逃生舱 | `JSON.parse`、catch 变量 | 抛错函数、穷尽兜底 | 无返回值的函数 |

```ts
// quad.ts
let a: any = JSON.parse("{}");
a.foo.bar;                    // 编译通过，运行时崩 —— any 放行一切

let u: unknown = JSON.parse("{}");
// u.foo;                     // ❌ TS18046：'u' is of type 'unknown'
if (typeof u === "object" && u !== null && "foo" in u) { /* 收窄后可用 */ }

function fail(): never { throw new Error("x"); }   // never：调用后代码不可达
type VoidFn = () => void;
const f: VoidFn = () => 42;   // ✅ 目标类型是 void 时允许 return 值（回调复用）
```

## 3. type vs interface

| 维度 | interface | type |
|---|---|---|
| 扩展 | `extends`（可多个） | `&` 交叉 |
| 同名重复声明 | ✅ 声明合并 | ❌ 报重复标识符 |
| 联合/元组/映射/条件类型 | ❌ | ✅ |
| 错误信息可读性 | 显示接口名，较清晰 | 复杂交叉被展开，难读 |
| 官方态度 | 对象形状首选，其余随你（风格问题） | |

```ts
// t-vs-i.ts
interface IPoint { x: number; y: number }
interface IPoint3D extends IPoint { z: number }
interface IPoint { label?: string }        // ✅ 合并进第一个 IPoint

type TPoint = { x: number; y: number };
type TPoint3D = TPoint & { z: number };
type ID = string | number;                 // type 独占：联合
type Pair = [string, number];              // type 独占：元组
type PartialIPoint = { [K in keyof IPoint]?: IPoint[K] };  // type 独占：映射
```

约定：对象/类形状用 `interface`，联合/元组/工具类型组合用 `type`，全项目一致即可（lint：`@typescript-eslint/consistent-type-definitions`）。

## 4. 联合 / 交叉 / 字面量 / as const

```ts
// union-literal.ts
type Status = "pending" | "success" | "error";   // 字面量联合 = 轻量枚举
type ID = string | number;

let st: Status = "pending";
// st = "done";            // ❌ TS2322：不在三个成员里

type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;               // 交叉：同时满足
const p: Person = { name: "a", age: 1 };  // ✅
// type Bad = string & number;            // never（原始类型交叉为空集）

const req = { url: "/a", method: "GET" };          // 坑：method 拓宽为 string
const req2 = { url: "/a", method: "GET" } as const; // method: "GET"，全只读

const colors = ["red", "green", "blue"] as const;   // readonly ["red","green","blue"]
type Color = (typeof colors)[number];               // "red" | "green" | "blue"
```

| 操作 | 语义 | 注意 |
|---|---|---|
| `A \| B` | 或（先收窄再用成员，见 `04` 篇） | 只能访问共有成员 |
| `A & B` | 且 | 属性冲突时变 `never`；方法冲突难读 |
| `'a' \| 'b'` | 字面量联合 | 比 enum 轻（`07` 篇） |
| `as const` | 深只读 + 保留字面量 | 只改类型不改运行时；变量引用上不能用 |

## 5. 函数速查

```ts
// functions.ts
function add(a: number, b: number): number { return a + b; }
const mul = (a: number, b: number): number => a * b;

function greet(name: string, greeting?: string): string {   // 可选参数
  return `${greeting ?? "Hello"}, ${name}`;
}
function hi(name: string, greeting: string = "Hello") { return `${greeting}, ${name}`; }  // 默认值（体内收窄为 string）
function sum(...nums: number[]): number { return nums.reduce((a, b) => a + b, 0); }        // rest

// 函数重载：声明签名给调用方看，实现签名不对外
function process(input: string): string;
function process(input: number): number;
function process(input: string | number): string | number {
  return typeof input === "string" ? input.toUpperCase() : input * 2;
}
process("a").toLowerCase();   // ✅ 调用方只见 string 版
// process(true);             // ❌ TS2769：没有匹配的重载

// this 参数（伪参数，占第一位）
function clickHandler(this: HTMLButtonElement, e: MouseEvent): void {
  this.disabled = true;
}
```

| 形态 | 写法 | 备注 |
|---|---|---|
| 可选参数 | `y?: number` | 实际类型 `number \| undefined` |
| 默认参数 | `y = 10` | 体内 `y` 收窄为 `number` |
| rest | `(...args: string[])` | 元组 rest `(...args: [string, number])` 更精确 |
| 函数类型 | `type F = (a: number) => string` | 变量/回调/参数用 |
| 构造签名 | `new (name: string) => Person` | 可实例化的类型 |
| 泛型函数 | `function f<T>(x: T): T` | 见第 8 节 |

## 6. 类速查

```ts
// classes.ts
class Animal {
  constructor(
    public name: string,          // 参数属性：声明 + 赋值一步到位
    private age: number,
    protected species: string
  ) {}

  get info(): string { return `${this.name}/${this.age}`; }
  set setAge(v: number) { if (v > 0) this.age = v; }
  move(d: number): void { console.log(`${this.name} moved ${d}m`); }
}

class Dog extends Animal {
  constructor(name: string, age: number, public breed: string) {
    super(name, age, "Canine");          // super 必须在访问 this 前调用
  }
  move(d: number): void { super.move(d); console.log("...running"); }
}

abstract class Shape {
  abstract getArea(): number;            // 抽象成员，子类必须实现
  print(): void { console.log(this.getArea()); }
}

interface Printable { print(): void }
class Doc implements Printable { print(): void {} }

class Lazy {
  db!: Database;   // definite assignment：声明非空但延后初始化（框架场景）
}
```

| 成员 | 关键字 | 说明 |
|---|---|---|
| 可见性 | `public`（默认）/`private`/`protected` | `#field` 是 JS 私有（运行时硬私有） |
| 只读 | `readonly` | 构造外不可再赋值 |
| 静态 | `static` | 类自身成员；`static count = 0` |
| 抽象 | `abstract` | 不能实例化，只能被 extends |
| 参数属性 | `constructor(public x: T)` | 注意与 `useDefineForClassFields` 的兼容细节（`06` 篇） |

## 7. Narrowing 手法速查

| 手法 | 写法 | 一句话 |
|---|---|---|
| typeof | `if (typeof x === "string")` | 八种字面量；`"object"` 含 null |
| 真值 | `if (x)` | 排除 falsy；误伤合法 `0`/`""` |
| 等值 | `if (x === y)` / `x == null` | 取交集；`== null` 一次排除两个 nullish |
| in | `if ("swim" in x)` | 区分对象形状；可选属性会失效 |
| instanceof | `if (x instanceof Date)` | 类实例；数组用 `Array.isArray` |
| 判别联合 | `switch (x.kind)` | 每成员带字面量标签，最推荐 |
| 类型谓词 | `function isFish(p): p is Fish` | 自定义守卫，可配 filter |
| 断言函数 | `function assert(x): asserts x is T` | 抛错式收窄，收窄不了属性 |
| 穷尽兜底 | `const _e: never = x` | 漏分支变编译错 |

```ts
// narrowing.ts
function getArea(shape: { kind: "circle"; r: number } | { kind: "square"; a: number }) {
  switch (shape.kind) {          // 判别联合是实战首选
    case "circle": return Math.PI * shape.r ** 2;
    case "square": return shape.a ** 2;
    default: {
      const _exhaustive: never = shape;   // 穷尽检查
      return _exhaustive;
    }
  }
}
```

全部细节与控制流边界见 `04-narrowing.md`。

## 8. 泛型与约束速查

```ts
// generics.ts
function identity<T>(arg: T): T { return arg; }
identity("a");                    // 推断 T = string，通常不手写 <string>

function logLen<T extends { length: number }>(x: T): T {   // 约束
  console.log(x.length);
  return x;
}

function pair<T, U>(a: T, b: U): [T, U] { return [a, b]; } // 多参数

interface ApiResponse<T = unknown> { data: T; status: number }   // 默认类型

class Stack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}

// 泛型约束到某个键：K extends keyof T
function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const name = pick({ id: 1, name: "a" } as const, "name");   // "a"
```

| 语法 | 作用 | 坑 |
|---|---|---|
| `<T>` | 类型参数 | 命名用 `T`/`TData` 等大写驼峰 |
| `T extends U` | 上界约束 | `T extends object` 排除原始类型 |
| `<T = unknown>` | 默认类型 | 默认 `any` 的库 API 首选改 unknown |
| `K extends keyof T` | 键约束 | 让返回 `T[K]` 精确对应 |
| 元组 rest | `<T extends unknown[], R>` | 高阶函数透传参数类型 |

## 9. 类型运算符速查：keyof / typeof / 索引访问 / 条件类型 / infer / 映射 / 模板字面量

```ts
// type-operators.ts
interface User { id: number; name: string }

type K1 = keyof User;                      // "id" | "name"（键联合）
const u = { id: 1, name: "a" };
type U = typeof u;                         // { id: number; name: string }（从值取类型）
type V = User["id"];                       // number（索引访问）
type VK = User[keyof User];                // number | string（值联合）

type IsStr<T> = T extends string ? true : false;    // 条件类型
type A = IsStr<string>;                    // true

type Elem<T> = T extends (infer U)[] ? U : never;   // infer：在条件里"声明待推断位"
type E = Elem<number[]>;                   // number

// 映射类型 + as 重映射 + 修饰符
type PartialLike<T> = { [K in keyof T]?: T[K] };    // ? 可选 / -? 去可选 / readonly / -readonly
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };
type G = Getters<User>;                    // { getId: () => number; getName: () => string }

// 模板字面量类型
type EventName<T extends string> = `on${Capitalize<T>}`;
type Click = EventName<"click">;           // "onClick"
type Route = `/${"a" | "b"}/${number}`;    // "/a/1"、"/b/2" 等组合
```

| 运算符 | 用途 | 一行结果 |
|---|---|---|
| `keyof T` | 取键联合 | `keyof User` → `"id" \| "name"` |
| `typeof v` | 从值取类型 | 注意与运行时 `typeof` 同名不同物 |
| `T["k"]` | 索引访问 | 可用联合键取值联合 |
| `X extends Y ? A : B` | 条件类型 | 裸类型参数对联合**分发**（`12` 篇） |
| `infer U` | 条件内推断占位 | 只能在 `extends` 右侧用 |
| `[K in keyof T]` | 映射 | 修饰符 `?`/`readonly`/`-?`/`-readonly` |
| `[K in keyof T as NewK]` | as 重映射 | `never` 可过滤键 |
| `` `pre${T}` `` | 模板字面量 | 与联合组合会展开成联合 |

## 10. 内置 Utility Types 全家（22 个）

签名 + 一行示例（基于 `interface User { id: number; name: string; email?: string }`）：

| 工具类型 | 签名（简化） | 示例 → 结果 |
|---|---|---|
| `Partial<T>` | 全属性可选 | `Partial<User>` → `{ id?: number; name?: string; email?: string }` |
| `Required<T>` | 全属性必选 | `Required<User>` → `email` 变必选 |
| `Readonly<T>` | 全属性只读 | `Readonly<User>` → 赋值后改属性报 TS2540 |
| `Pick<T, K>` | 选取子集 | `Pick<User, "id">` → `{ id: number }` |
| `Omit<T, K>` | 排除子集 | `Omit<User, "id">` → `{ name: string; email?: string }` |
| `Record<K, V>` | 键到值的映射 | `Record<"a" \| "b", number>` → `{ a: number; b: number }` |
| `Exclude<T, U>` | 从联合剔除 | `Exclude<"a"\|"b"\|"c", "a">` → `"b" \| "c"` |
| `Extract<T, U>` | 从联合提取 | `Extract<"a"\|"b", string>` → `"a" \| "b"` |
| `NonNullable<T>` | 排除 nullish | `NonNullable<string \| null>` → `string` |
| `Parameters<T>` | 函数参数元组 | `Parameters<(a: number) => void>` → `[a: number]` |
| `ConstructorParameters<T>` | 构造参数元组 | `ConstructorParameters<typeof Date>` → `[value?: string \| number]` |
| `ReturnType<T>` | 取返回类型 | `ReturnType<() => string>` → `string` |
| `InstanceType<T>` | 取实例类型 | `InstanceType<typeof Error>` → `Error` |
| `Awaited<T>` | 递归解 Promise | `Awaited<Promise<Promise<number>>>` → `number` |
| `ThisParameterType<T>` | 取 this 参数 | `ThisParameterType<typeof clickHandler>` → `HTMLButtonElement` |
| `OmitThisParameter<T>` | 去掉 this 参数 | 得到"无 this"的函数类型 |
| `ThisType<T>` | 上下文 this 标记 | 只在对象字面量 `noImplicitThis` 下生效，无运行时产物 |
| `Uppercase<S>` | 字面量大写 | `Uppercase<"abc">` → `"ABC"` |
| `Lowercase<S>` | 字面量小写 | `Lowercase<"ABC">` → `"abc"` |
| `Capitalize<S>` | 首字母大写 | `Capitalize<"abc">` → `"Abc"` |
| `Uncapitalize<S>` | 首字母小写 | `Uncapitalize<"Abc">` → `"abc"` |
| `NoInfer<T>` | 阻止推断（TS 5.4） | 包住某参数，强制从其他参数推断 |

```ts
// utility-demo.ts
type UserForm = Partial<Omit<User, "id">>;        // 组合拳：表单类型
type UserSummary = Pick<User, "id" | "name">;
type UsersById = Record<number, User>;
type Handler = (...args: any[]) => any;
type Args = Parameters<Handler>;                   // any[]
type Res = ReturnType<typeof fetchUser>;           // Promise<User>（想拿 User 再套 Awaited）
type FlatUser = Awaited<ReturnType<typeof fetchUser>>;
type Dict = Record<string, unknown>;               // 安全的"任意对象"
```

## 11. 自定义工具类型常用款

```ts
// custom-utilities.ts
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K] };

// 过滤/挑选键（as 重映射 + never）
type FunctionProps<T> = { [K in keyof T as T[K] extends Function ? K : never]: T[K] };
type ValueProps<T>   = { [K in keyof T as T[K] extends Function ? never : K]: T[K] };

// 必选/可选键集合
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];

// 定向修饰
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type Nullable<T> = T | null;
type Maybe<T> = T | null | undefined;
type Dict<T> = Record<string, T>;
```

## 12. 装饰器速查

启用（传统实验性）：`tsconfig` 里 `"experimentalDecorators": true`（Nest 等框架生态仍是此模式；TS 5.0 标准 Stage 3 装饰器签名不同，见 `09-decorators.md`）。

| 装饰器 | 签名（实验性） | 典型用途 |
|---|---|---|
| 类 | `(ctor: Function)` | `@sealed`、注册路由表 |
| 方法 | `(target, key: string, desc: PropertyDescriptor)` | `@log`、`@Catch`（改 desc.value） |
| 访问器 | 同方法 | 包装 getter/setter |
| 属性 | `(target, key: string)` | **没有 descriptor**（高频翻车点） |
| 参数 | `(target, key: string \| undefined, index: number)` | `@Inject()` 按下标注入 |

```ts
// decorators.ts
function log(target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  desc.value = function (...args: unknown[]) {
    console.log(`call ${key}`, args);
    return original.apply(this, args);
  };
}
class Calc {
  @log
  add(a: number, b: number): number { return a + b; }
}
new Calc().add(1, 2);   // 先打日志再返回 3
```

## 13. 模块语法速查

```ts
// modules.ts
export const PI = 3.14;                       // 命名导出
export function add(a: number, b: number) { return a + b; }
export default class Calculator {}            // 默认导出（每模块至多一个）
export type User = { id: number };            // 类型导出
export type { User };                         // 重导出类型
export { add as plus };                       // 重命名导出
export * from "./math";                       // 聚合导出

import Calculator, { PI, add as plus } from "./math";   // 默认 + 命名
import * as math from "./math";               // 命名空间导入
import type { User } from "./types";          // 仅类型导入（编译后擦除）
import { type User, createUser } from "./types";         // 混合导入
const mod = await import("./math");           // 动态导入，类型自动推断
import "./polyfill";                          // 副作用导入
import fs from "node:fs";                     // CJS 互操作（需 esModuleInterop）
```

| 语法 | 坑 |
|---|---|
| `import type` | 用作值时报 TS1361；`verbatimModuleSyntax` 下类型必须 type 导入 |
| `export *` | 不导出 default；命名冲突时静默丢弃 |
| 动态 import | 返回 Promise<模块命名空间>，`await` 后用 |
| `namespace` | 非 module 的组织方式，现代代码少用（`10` 篇） |

## 14. tsconfig 高频项速查

| 选项 | 推荐值 | 一句话 |
|---|---|---|
| `target` | `ES2022` | 编译产物 JS 版本 |
| `module` / `moduleResolution` | `ESNext` / `bundler` 或 `NodeNext` | 模块格式与解析策略（Node 下须配对） |
| `lib` | `["ES2022", "DOM"]` | 可用的内置 API 声明 |
| `strict` | `true` | 全家桶总开关，必开 |
| `noUncheckedIndexedAccess` | `true` | `arr[i]` 变 `T \| undefined`（`04` 篇 10.2） |
| `exactOptionalPropertyTypes` | 可选 `true` | 区分"缺属性"与"显式 undefined" |
| `noImplicitAny` / `strictNullChecks` | strict 已含 | 隐式 any / null 检查 |
| `esModuleInterop` | `true` | CJS 默认导出互操作 |
| `skipLibCheck` | `true` | 跳过 .d.ts 检查，提速 |
| `baseUrl` + `paths` | `"@/*": ["src/*"]` | 路径别名 |
| `outDir` / `rootDir` / `declaration` / `sourceMap` | `dist` / `src` / 视情况 / `true` | 输出控制 |
| `noEmit` | 用打包器时 `true` | 只检查不产出 |
| `verbatimModuleSyntax` | 可选 `true` | 强制 type 导入写法，导入语句按原样保留 |
| `isolatedModules` | `true` | 兼容单文件转译器（esbuild/tsx） |
| `include` / `exclude` | `["src"]` / `["node_modules", "dist"]` | 编译范围 |

完整逐项说明见 `11-tsconfig.md`。

## 15. 常见报错码速查

| 报错码 | 典型信息 | 一行修法 |
|---|---|---|
| TS2304 | Cannot find name 'X' | 忘了 import / 类型不在作用域 |
| TS2307 | Cannot find module './x' | 路径错；缺声明装 `@types/x` 或自写 `.d.ts` |
| TS2322 | Type 'A' is not assignable to type 'B' | 结构不匹配：对齐字段/收窄/检查字面量拓宽（`03` 篇 9.2） |
| TS2345 | Argument of type 'A' is not assignable to parameter 'B' | 参数类型不符：多为字面量被拓宽，标注或 `as const` |
| TS2339 | Property 'x' does not exist on type 'Y' | 联合未收窄先访问独有成员；或拼错（TS2551 会提示相似名） |
| TS2367 | This comparison appears to be unintentional | 两类型无交集，比较逻辑写错了 |
| TS2540 | Cannot assign to 'x' because it is a read-only property | readonly 别改；需要可变就换掉 Readonly/as const |
| TS2531 / TS18047 | Object is possibly 'null' / 'undefined' | 先收窄（`if (x)`/`?.`），能不用 `!` 就不用 |
| TS18046 | 'x' is of type 'unknown' | unknown 先收窄：typeof/in/谓词（`04` 篇） |
| TS2564 | Property has no initializer and is not definitely assigned | 构造里赋值，或确属框架注入用 `!` + 注释 |
| TS2366 | Function lacks ending return statement | 分支未全覆盖，常与穷尽检查一起看 |
| TS2769 | No overload matches this call | 重载全不匹配，对照各签名找参数错位 |
| TS7006 | Parameter 'x' implicitly has an 'any' type | 函数参数补类型标注 |
| TS7016 | Could not find a declaration file for module 'x' | 装 `@types/x`，或 `declare module "x"` 补声明 |
| TS1361 | 'X' cannot be used as a value (import type) | 类型导入不能当代值用，另起普通 import |
| TS2578 | Unused '@ts-expect-error' directive | 错误已修好，删掉这行注释 |

## 16. .d.ts 声明速查

```ts
// globals.d.ts
declare const VERSION: string;                    // 全局常量
declare function track(event: string): void;      // 全局函数

declare module "no-types-lib" {                   // 给无类型库补声明
  export function debounce<T extends (...args: any[]) => any>(fn: T, wait?: number): T;
}

declare module "*.png" {                          // 资源模块
  const src: string;
  export default src;
}

declare global {                                  // 扩展全局（模块文件内需 declare global）
  interface Window { myLib: { init(): void } }
}

// 扩展第三方模块（interface 合并，见 03 篇 8.3）
declare module "express-serve-static-core" {
  interface Request { currentUser?: { id: number } }
}

export {};   // 让 .d.ts 变模块文件，避免全局污染（declare global 必需）
```

## 17. 常用模式

### Result（错误作返回值，替代 throw）

```ts
// result.ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function fetchUser(id: number): Promise<Result<{ id: number }>> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) return { ok: false, error: new Error(`HTTP ${res.status}`) };
    return { ok: true, value: await res.json() };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}

const r = await fetchUser(1);
if (r.ok) console.log(r.value.id);   // 判别联合收窄：ok 为真才有 value
else console.error(r.error.message);
```

### Branding（名义类型，防 ID 混用）

```ts
// branding.ts
type UserId = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };
const asUserId = (s: string) => s as UserId;

function charge(id: UserId) {}
charge(asUserId("u_1"));   // ✅
// charge("raw-string");   // ❌ TS2345：裸 string 没有 brand
// const o: OrderId = asUserId("u_1");   // ❌ brand 不同不能互赋
```

### Builder（返回 this 支持链式调用）

```ts
// builder.ts
class Query<T> {
  private conds: string[] = [];
  where<K extends keyof T>(k: K, v: unknown): this {    // 返回 this 才能子类链式
    this.conds.push(`${String(k)}=${String(v)}`);
    return this;
  }
  build(): string { return `SELECT * WHERE ${this.conds.join(" AND ")}`; }
}
new Query<{ age: number; active: boolean }>().where("age", 25).where("active", true).build();
```

### satisfies（校验并保留推断，TS 4.9+）

```ts
// satisfies.ts
const config = {
  host: "localhost",
  port: 3000,                    // 保持推断为 number（标注会拓宽成 string | number）
} satisfies Record<string, string | number>;

config.port.toFixed();           // ✅ 仍是具体类型 number
// config.ssl = true;            // ❌ 超出 satisfies 的约束范围
```

### 轻量枚举（as const 对象，`07` 篇详述 enum 取舍）

```ts
// const-enum.ts
const STATUS = { pending: "pending", success: "success", error: "error" } as const;
type Status = (typeof STATUS)[keyof typeof STATUS];   // "pending" | "success" | "error"
function render(s: Status) {}
render(STATUS.success);
```

## 18. React + TS 速查

```tsx
// components.tsx
import { useState, useRef, useCallback, createContext, useContext } from "react";
import type { ReactNode, CSSProperties } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";     // 字面量联合代替 string
  style?: CSSProperties;
}

// 社区惯例已少用 React.FC（隐式 children 等历史问题），直接函数组件 + Props 类型：
function Button({ children, onClick, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick} data-variant={variant}>{children}</button>;
}

// 泛型组件
function List<T>({ items, renderItem }: { items: T[]; renderItem: (t: T) => ReactNode }) {
  return <ul>{items.map((it, i) => <li key={i}>{renderItem(it)}</li>)}</ul>;
}

// Hooks
const [count, setCount] = useState(0);              // 推断 number；可空显式 useState<User | null>(null)
const inputRef = useRef<HTMLInputElement>(null);    // DOM 引用
const timerRef = useRef(0);                         // 不触发渲染的值
const onSave = useCallback(() => {}, [count]);      // 依赖数组类型自动校验

// Context：undefined 初值 + 自定义 hook 兜底
const ThemeCtx = createContext<"light" | "dark" | undefined>(undefined);
export function useTheme(): "light" | "dark" {
  const ctx = useContext(ThemeCtx);
  if (ctx === undefined) throw new Error("useTheme must be used within Provider");
  return ctx;
}
```

## 19. 类型体操起步题（10 题）

```ts
// type-challenges.ts
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };                 // 1. 实现 Pick
type MyReadonly<T> = { readonly [P in keyof T]: T[P] };                 // 2. 实现 Readonly
type TupleToObject<T extends readonly string[]> = { [P in T[number]]: P };   // 3. 元组转对象
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;     // 4. 取首元素
type Length<T extends readonly any[]> = T["length"];                    // 5. 元组长度
type MyExclude<T, U> = T extends U ? never : T;                         // 6. 实现 Exclude
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;      // 7. 递归解包
type Concat<A extends any[], B extends any[]> = [...A, ...B];           // 8. 拼接元组
type TupleToUnion<T extends readonly any[]> = T[number];                // 9. 元组转联合
type DeepReadonly<T> = { readonly [K in keyof T]: T[K] extends object
  ? DeepReadonly<T[K]> : T[K] };                                        // 10. 深只读
```

进阶体操（分发律、IsUnion、DeepPick 等）见 `12-typescript-advanced-type-system.md` 与 `14-typescript-interview-questions.md`。

## 20. 一句话总结

> 速查表 = 每节一张表 + 一段短代码：标注认小写、any/unknown/never 分清、type/interface 分工、收窄八法（详见 `04-narrowing.md`）、泛型约束 `K extends keyof T`、类型运算七件套（keyof/typeof/索引/条件/infer/映射/模板字面量）、22 个内置工具类型、报错码先查 2322/2345/2339/7006——查得到语法后，回详解篇补"为什么"。
