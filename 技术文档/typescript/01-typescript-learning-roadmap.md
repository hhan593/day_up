# 1. TypeScript 学习路线图

> 来源可信度：**官方 Handbook 章节编排 + 社区共识路线**（TypeScript Handbook「The Basics → Everyday Types → Narrowing → More on Functions → …」，TS 5.x 时代；本篇是全系列的"目录与调度中心"，知识点详解在各篇内完成）
> 关联：`02-typescript-cheatsheet.md`（随手查）、`03-everyday-types.md` ~ `11-tsconfig.md`（逐篇详解）、`12-typescript-advanced-type-system.md`（类型系统底层）、`13-typescript-best-practices.md`（工程实践）、`14-typescript-interview-questions.md`（面试冲刺）、`15-typescript-new-features.md`（版本演进）、`17-engineering-tsup-vitest.md`（构建与测试工具链）。

## 1. 本系列怎么用

| 篇目 | 内容 | 什么时候读 |
|---|---|---|
| [01 本篇](./01-typescript-learning-roadmap.md) | 路线、里程碑自测、最小工程 | 入门前通读，之后按阶段回查 |
| [02 速查表](./02-typescript-cheatsheet.md) | 全表格化语法/工具类型/报错码 | 日常开发随手查 |
| [03 日常类型](./03-everyday-types.md) | 原始类型/联合/type vs interface/null 全家 | 阶段一 |
| [04 类型收窄](./04-narrowing.md) | typeof/in/instanceof/谓词/穷尽 | 阶段二 |
| [05 函数进阶](./05-more-on-functions.md) | 重载/泛型函数/this/构造签名 | 阶段二 |
| [06 类](./06-classes.md) | 修饰符/继承/抽象类/this 类型 | 阶段二 |
| [07 枚举](./07-enums.md) | 数字/字符串/const enum/替代方案 | 阶段一（可跳读） |
| [08 从类型创建类型](./08-creating-types-from-types.md) | 联合/映射/条件类型/infer | 阶段三 |
| [09 装饰器](./09-decorators.md) | 实验性与标准装饰器 | 阶段三（后端必读） |
| [10 模块](./10-modules.md) | import/export/声明合并/namespace | 阶段三 |
| [11 tsconfig](./11-tsconfig.md) | 编译选项逐项说明 | 阶段三 |
| [12 类型系统深入](./12-typescript-advanced-type-system.md) | 协变逆变/推断机制/分发律/体操 | 面试/攻坚 |
| [13 最佳实践](./13-typescript-best-practices.md) | 工程规范与模式 | 有基础后 |
| [14 面试高频题](./14-typescript-interview-questions.md) | 高频题 + 手写题 | 面试前冲刺 |
| [15 版本新特性](./15-typescript-new-features.md) | TS 4.1 → 5.9 | 按需 |

阅读顺序：**本篇 §3 建好工程 → 03 → 04 → 05/06 → 07 → 08 → 09/10/11 → 13**；12/14 面试前集中刷。

## 2. 写在前面

**TypeScript 是什么**：JS 的超集，加上静态类型系统。所有合法 JS 都是合法 TS；类型只在编译期存在，编译产物就是 JS。

**为什么要学**：编码期发现错误而非运行期；IDE 补全与重构质量质变；大型项目协作与维护成本下降；React/Vue/Angular/Nest 全生态默认 TS。

**需要什么基础**：扎实的 JS + ES6+（箭头函数、解构、模块、async/await）；不需要框架经验。

**预计学习周期**：4~6 周（每天 1~2 小时）。每个阶段以"里程碑自测清单"过关，而不是"看完了"。

## 3. 最小工程上手：pnpm + tsx + vitest 从零到一

学习期所有代码都在一个可运行工程里写，不装全局包、不用 ts-node（已停滞，改用 tsx）。完整命令流：

```bash
# 1) 创建项目（pnpm 已装：npm i -g pnpm）
mkdir my-ts && cd my-ts
pnpm init

# 2) 安装开发依赖
pnpm add -D typescript tsx vitest @types/node

# 3) 生成并覆盖 tsconfig
pnpm tsc --init
```

```jsonc
// 4) tsconfig.json —— 学习工程最小可用配置（逐项见 11-tsconfig.md）
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,                    // 一开始就全严格，见 §9 误区 2
    "noUncheckedIndexedAccess": true,  // arr[i] 出 undefined（04 篇 10.2）
    "skipLibCheck": true,
    "types": ["node"],
    "noEmit": true                     // 运行交给 tsx，tsc 只做类型检查
  },
  "include": ["src", "tests"]
}
```

```jsonc
// 5) package.json 增加脚本与 ESM 标记
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",   // 改动即重启
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

```bash
# 6) 建文件
mkdir src tests
# src/math.ts、src/index.ts、tests/math.test.ts 内容如下
```

```ts
// src/math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
```

```ts
// src/index.ts
import { add, clamp } from "./math.js";   // NodeNext 下相对导入要带 .js（指向编译后产物）

console.log(add(1, 2));        // 预期输出：3
console.log(clamp(15, 0, 10)); // 预期输出：10
```

```ts
// tests/math.test.ts —— vitest 测试
import { describe, expect, it } from "vitest";
import { add, clamp } from "../src/math.js";

describe("math", () => {
  it("adds numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
  it("clamps into range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
  });
});
```

```bash
# 7) 三个常用命令
pnpm dev            # 运行 src/index.ts，预期输出 3 和 10
pnpm test           # 2 个测试通过
pnpm typecheck      # 全项目类型检查（CI 里也跑这条）
```

> 一次性脚本也可以直接 `pnpm tsx hello.ts` 运行；编译到 JS 产物的完整流程（tsc hello.ts → node hello.js）与构建工具选型见 `17-engineering-tsup-vitest.md`。

## 4. 路线总览

```
阶段一 入门（第 1 周）     基本类型 / interface / type / 字面量 / enum
阶段二 核心（第 2-3 周）   函数 / 类 / 泛型 / 推断与断言 / 收窄
阶段三 进阶（第 4 周）     映射 / 条件类型 / 装饰器 / 模块 / tsconfig / d.ts
阶段四 实战（第 5-6 周）   React / Vue / Nest 衔接 / 类型体操 / 项目
```

## 5. 阶段一：入门（第 1 周）

### 5.1 知识点清单

| 主题 | 必会要点 | 详解 |
|---|---|---|
| 原始类型 | 7 种原始类型小写标注；`String`≠`string` | `03` 篇 1 节 |
| 数组/元组 | `T[]` ≡ `Array<T>`；元组定长定序 | `03` 篇 2 节 |
| any/unknown/never | unknown 是安全 any；never 是空集 | `03` 篇 3 节 |
| interface | 可选 `?`、只读 `readonly`、函数类型接口 | `03` 篇 6 节 |
| type 别名 | 联合/元组/对象；与 interface 分工 | `03` 篇 8 节 |
| 字面量类型 | 联合当轻量枚举；`as const` 防拓宽 | `03` 篇 9 节 |
| enum | 数字/字符串/const enum 与替代方案 | `07` 篇 |
| null/undefined | strictNullChecks、`?.`/`??`、少用 `!` | `03` 篇 10 节 |

### 5.2 代码速览（一屏回顾）

```ts
// stage1.ts
let userName: string = "Alice";
let age: number = 25;
let isActive: boolean = true;
let bigNum: bigint = 100n;
let sym: symbol = Symbol("key");
let scores: number[] = [90, 85, 95];
let person: [string, number] = ["Alice", 25];   // 元组

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;             // 可选
  readonly createdAt: Date;         // 只读
}

interface SearchFunc { (source: string, sub: string): boolean }  // 函数类型接口
const mySearch: SearchFunc = (src, sub) => src.includes(sub);

type Status = "pending" | "success" | "error";    // 字面量联合
type Eagle = { name: string } & { canFly: boolean };  // 交叉

enum Direction { Up, Down, Left, Right }          // 数字枚举
enum StatusCode { OK = 200, NotFound = 404, ServerError = 500 }
const enum Permission { Read = 1, Write = 2, Execute = 4 }  // 编译期内联（isolatedModules 下跨文件受限，见 11 篇）

let unknownValue: unknown = 4;
if (typeof unknownValue === "number") console.log(unknownValue + 1);  // 先收窄再用

const cfg = { host: "localhost", port: 3000 } as const;  // 深只读 + 字面量
// cfg.port = 8080;   // ❌ TS2540 read-only
```

### 5.3 每日安排与阶段项目

- Day 1：§3 建好工程；`pnpm tsx` 跑通第一个文件（保持 tsc 手动编译流程的理解即可）。
- Day 2：基本类型 + 数组/元组（读 `03` 篇 1~3 节）。
- Day 3：interface（含函数类型接口）。
- Day 4：type 别名、联合/交叉、Interface vs Type 表。
- Day 5：enum 与字面量联合的取舍（读 `07` 篇）。
- Day 6~7 阶段项目——**用户信息管理系统（基础版）**：
  - [ ] 定义 `User` 接口（id/name/email/age/role）
  - [ ] 用字面量联合或 enum 表达 role
  - [ ] 实现 add/find 函数（参数、返回值全部显式标注）
  - [ ] `pnpm typecheck` 零报错，为 `add` 写 2 个 vitest 用例

### 5.4 里程碑自测清单（能独立完成才算过关）

- [ ] 不看资料写出 7 种原始类型标注，并说清 `String` 与 `string` 的赋值方向差异。
- [ ] 给定一个"商品"业务描述，30 秒内写出对应 interface，含可选与只读字段。
- [ ] 说得出什么时候必须用 type（联合/元组/映射），什么时候优先 interface。
- [ ] 把 `let m = "GET"` 改成能通过 `"GET" | "POST"` 校验的写法（至少两种：标注、as const）。
- [ ] 项目代码里搜不到 `any`；`pnpm typecheck` 通过。

## 6. 阶段二：核心（第 2-3 周）

### 6.1 知识点清单

| 主题 | 必会要点 | 详解 |
|---|---|---|
| 函数类型 | 可选/默认/rest 参数、重载、this 参数 | `05` 篇 |
| 类 | 修饰符、参数属性、getter/setter、继承、抽象类、implements | `06` 篇 |
| 泛型 | 函数/接口/类、`extends` 约束、`K extends keyof T` | `05`/`08` 篇 |
| 类型推断 | 上下文类型（回调参数自动推断）、let 拓宽 | `03` 篇 4/9 节 |
| 断言 | `as`（优先）、尖括号（非 JSX）、`!`、`as const` | `03` 篇 9/10 节 |
| 类型收窄 | typeof/真值/等值/in/instanceof/谓词/穷尽 | `04` 篇全篇 |
| 判别联合 | `kind` 标签 + switch + never 穷尽兜底 | `04` 篇 9 节 |

### 6.2 代码速览

```ts
// stage2.ts
// —— 函数 ——
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}
function sum(...nums: number[]): number { return nums.reduce((t, n) => t + n, 0); }

function process(input: string): string;
function process(input: number): number;
function process(input: string | number): string | number {
  return typeof input === "string" ? input.toUpperCase() : input * 2;
}

// —— 类 ——
class Person {
  constructor(
    public name: string,        // 参数属性
    private age: number,        // 仅类内
    protected email: string     // 类内 + 子类
  ) {}
  get info(): string { return `${this.name}/${this.age}`; }
}
class Employee extends Person {
  constructor(name: string, age: number, email: string, public dept: string) {
    super(name, age, email);
  }
  move(d: number): void { console.log(`${this.name} moved ${d}m`); }
}
abstract class Shape {
  abstract getArea(): number;
  print(): void { console.log(`Area: ${this.getArea()}`); }
}

// —— 泛型 ——
function identity<T>(arg: T): T { return arg; }
identity("hello");                                   // 推断 T = string

function logLength<T extends { length: number }>(arg: T): T {
  console.log(arg.length);
  return arg;
}
logLength("hi");      // ✅
// logLength(123);    // ❌ TS2345：number 没有 length

class GenericStack<T> {
  private items: T[] = [];
  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }   // 空栈返回 undefined
  isEmpty(): boolean { return this.items.length === 0; }
}

// —— 推断与断言 ——
let x = 3;                                  // number
window.onmousedown = (event) => event.button;  // event: MouseEvent（上下文推断）
let someValue: unknown = "string here";
const len = (someValue as string).length;   // as 断言（JSX/前端必须用 as）
const el = document.getElementById("app")!; // 非空断言：仅当确证存在时

// —— 收窄与判别联合 ——
type Square = { kind: "square"; size: number };
type Circle = { kind: "circle"; radius: number };
type Shape = Square | Circle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "square": return shape.size ** 2;
    case "circle": return Math.PI * shape.radius ** 2;
    default: {
      const _exhaustive: never = shape;   // 漏分支时这里编译报错
      return _exhaustive;
    }
  }
}

interface Cat { meow(): void }
interface Dog { bark(): void }
function isCat(a: Cat | Dog): a is Cat {    // 类型谓词
  return "meow" in a;
}
function makeSound(a: Cat | Dog) {
  if (isCat(a)) a.meow(); else a.bark();
}
```

### 6.3 每日安排与阶段项目

- Day 8：函数类型与重载（`05` 篇）。
- Day 9~11：类：修饰符/readonly/getter/setter → 继承与多态（super、方法重写）→ 抽象类与 implements。
- Day 12~14 阶段项目——**电商商品系统**：定义 `Product` 接口、抽象类 `BaseProduct`、`Electronics`/`Clothing` 子类、折扣计算；访问修饰符保护价格逻辑。
- Day 15~16：泛型（identity/约束/多参数/泛型接口/泛型类）。
- Day 17：推断（上下文类型）与断言（as / `!` / as const）。
- Day 18~19 阶段项目——**泛型 Storage 类**：CRUD、约束、缓存；`pop()` 必须返回 `T | undefined` 并解释原因。
- Day 20~21：收窄六法 + 判别联合 + 穷尽检查（通读 `04` 篇）。
- Day 22~28：映射/条件类型入门（`08` 篇）+ 项目**类型安全 API 客户端**：泛型请求函数、`Result<T, E>` 判别返回、类型谓词校验响应。

### 6.4 里程碑自测清单

- [ ] 手写 `GenericStack<T>`：解释 `pop()` 为何是 `T | undefined` 而不是 `T`。
- [ ] 手写 `function pick<T, K extends keyof T>(obj: T, key: K): T[K]` 并通过编译。
- [ ] 给 `string | number` 参数写重载，调用方分别拿到精确返回类型。
- [ ] 用判别联合 + switch + never 兜底实现 `getArea`，并故意新增一个 `Triangle` 成员让兜底报错，再补全 case。
- [ ] 写一个 `isUser(v: unknown): v is User` 谓词守卫 `JSON.parse` 的结果。
- [ ] 说得出 `!`、`as`、`asserts x is T` 三者区别（见 `04` 篇 7/8 节）。

## 7. 阶段三：进阶（第 4 周）

### 7.1 知识点清单

| 主题 | 必会要点 | 详解 |
|---|---|---|
| 映射类型 | `in keyof`、修饰符 `?`/`readonly`/`-?`、as 重映射 | `08` 篇 |
| 条件类型 | `extends ? :`、分发律、`infer` | `08`/`12` 篇 |
| 内置工具类型 | Partial/Required/Readonly/Pick/Omit/Record/Exclude/Extract/NonNullable/Parameters/ReturnType/Awaited | `02` 篇 10 节 |
| 装饰器 | 类/方法/属性/参数装饰器签名；Nest 生态用法 | `09` 篇 |
| 模块 | export/import 全形态、`import type`、声明合并、namespace | `10` 篇 |
| tsconfig | strict 家族、moduleResolution、paths、检查类选项 | `11` 篇 |
| 声明文件 | `.d.ts`、`declare`、为无类型库补声明、发布类型 | `02` 篇 16 节 |

### 7.2 代码速览

```ts
// stage3.ts
// —— 映射与工具类型 ——
type MyPartial<T> = { [P in keyof T]?: T[P] };
type MyReadonly<T> = { readonly [P in keyof T]: T[P] };
type MyRequired<T> = { [P in keyof T]-?: T[P] };      // -? 去掉可选
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

interface User { id: number; name: string; email: string; password: string }
type UserUpdate = Partial<Omit<User, "id">>;          // 更新体
type PublicUser = Omit<User, "password">;             // 出参脱敏
type Getters<T> = { [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P] };

// —— 条件类型与 infer ——
type IsString<T> = T extends string ? true : false;
type ElementType<T> = T extends (infer U)[] ? U : T;
type Num = ElementType<number[]>;                     // number
type T0 = Exclude<"a" | "b" | "c", "a">;              // "b" | "c"
type T3 = ReturnType<() => string>;                   // string
type T4 = Parameters<(a: number, b: string) => void>; // [number, string]

// —— 装饰器（tsconfig: experimentalDecorators + emitDecoratorMetadata）——
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
function log(target: object, key: string, desc: PropertyDescriptor) {
  const original = desc.value;
  desc.value = function (...args: unknown[]) {
    console.log(`Calling ${key} with`, args);
    return original.apply(this, args);
  };
}
@sealed
class Calculator {
  @log
  add(a: number, b: number): number { return a + b; }
}

// —— 命名空间（非模块组织，现代代码少用但面试会问）——
namespace Validation {
  export interface StringValidator { isValid(s: string): boolean }
  const lettersRegexp = /^[A-Za-z]+$/;
  export class LettersOnlyValidator implements StringValidator {
    isValid(s: string): boolean { return lettersRegexp.test(s); }
  }
}
const validator = new Validation.LettersOnlyValidator();
```

```jsonc
// tsconfig.json 生产骨架（完整逐项见 11-tsconfig.md）
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

```ts
// types.d.ts —— 声明文件
interface Window {
  myLib: { version: string; doSomething(): void };
}
declare const MY_CONSTANT: string;
declare module "lodash" {
  export function cloneDeep<T>(value: T): T;
}
// 发布自己的库：编译时 declaration: true 生成 .d.ts，入口由 package.json 的 types 字段指向
```

### 7.3 每日安排与阶段项目

- Day 29：装饰器（`09` 篇；类/方法装饰器各写一个）。
- Day 30~31：模块系统与路径别名（`10` 篇）；namespace 了解即可。
- Day 32~35：tsconfig 逐项过一遍，把 §3 的工程升级成上面的生产骨架。
- Day 36~37：声明文件：给一个无类型的 npm 包手写最小 `.d.ts` 并用起来。
- Day 38~42 项目——**给 API 客户端加"类型基建"**：paths 别名、`Result` 泛型、`Getters` 映射、一个自定义装饰器 `@Measure` 统计耗时。

### 7.4 里程碑自测清单

- [ ] 白板实现 `MyPartial`/`MyOmit` 并解释 `-?` 与 `Exclude<keyof T, K>` 的作用。
- [ ] 解释分发律：`Exclude<"a" | "b", "a">` 为什么逐成员分发（`12` 篇 1.3）。
- [ ] 说出 TS 5.0 标准装饰器与实验性装饰器签名差异之一（`09` 篇）。
- [ ] 把项目迁到 `NodeNext` 并修复所有相对导入报错（`.js` 后缀）。
- [ ] 为无类型库补 `.d.ts` 后，`import` 立刻获得补全与检查。

## 8. 阶段四：实战（第 5-6 周）

### 8.1 框架衔接要点

```tsx
// react-user-card.tsx
import { useEffect, useState } from "react";

interface UserCardProps {
  name: string;
  age: number;
  onEdit?: (id: number) => void;   // 事件回调：参数 + 返回值都标
}
export function UserCard({ name, age, onEdit }: UserCardProps) {
  const [editing, setEditing] = useState(false);   // boolean 自动推断
  return (
    <div onClick={() => onEdit?.(1)}>
      <h2>{name}</h2>
      <p>{age} years old {editing ? "(editing)" : ""}</p>
    </div>
  );
}

// 自定义 Hook：返回值类型显式标注，防止实现变化传染调用方
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    fetch(url)
      .then((res) => res.json() as Promise<T>)   // json() 返回 unknown，需要收敛
      .then(setData)
      .catch((e: Error) => setError(e))
      .finally(() => setLoading(false));
  }, [url]);
  return { data, loading, error };
}
```

```ts
// vue3-user.ts —— Vue 3 组合式 API
import { defineComponent, ref, computed } from "vue";
interface User { id: number; name: string; email: string }

export default defineComponent({
  setup() {
    const user = ref<User | null>(null);
    const userName = computed<string>(() => user.value?.name ?? "");
    const fetchUser = async (id: number): Promise<void> => {
      const res = await fetch(`/api/users/${id}`);
      user.value = (await res.json()) as User;
    };
    return { user, userName, fetchUser };
  },
});
```

React 细节（props/泛型组件/Hooks/Context）见 `02` 篇 18 节；类型体操进阶：

```ts
// gymnastics.ts —— 三道入门挑战（12/14 篇有完整题解）
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
type TupleToUnion<T extends readonly any[]> = T[number];
type R = TupleToUnion<["a", "b", "c"]>;   // "a" | "b" | "c"
type DeepPick<T, K extends string> = K extends `${infer F}.${infer R}`
  ? F extends keyof T ? { [P in F]: DeepPick<T[F], R> } : never
  : K extends keyof T ? { [P in K]: T[K] } : never;
```

### 8.2 项目：类型安全的用户系统（综合实战）

- [ ] §3 工程升级：paths 别名 + vitest 全覆盖工具函数
- [ ] DTO 层：接口出参 `PublicUser = Omit<User, "password">`，入参 `Partial` 派生
- [ ] `Result<T, E>` 包住 fetch，调用方必须收窄后才能拿数据
- [ ] 类型谓词校验外部 JSON；`noUncheckedIndexedAccess` 全程开启不报错
- [ ] 全项目 `grep` 无 `any`、无未注释的 `!`

### 8.3 里程碑自测清单

- [ ] 在 React 或 Vue 项目里完成一个 CRUD 页面，全部事件回调参数有类型（不接受隐式 any）。
- [ ] 能说清"接口返回的 JSON 为什么必须校验"并给出谓词或 zod 方案。
- [ ] 独立完成 DeepReadonly；能解释 `TupleToUnion` 里 `T[number]` 的含义。
- [ ] `pnpm typecheck && pnpm test` 绿灯通过，CI 可复现。

## 9. 常见学习误区

1. **过度学类型体操，忽略工程**：`infer` 玩得飞起但 tsconfig/收窄不熟，面试能过、干活拉胯。路线里体操只占阶段四一小节，先把 `03`/`04` 用成肌肉记忆。
2. **绕过 strict**：图省事关掉 `strictNullChecks` 或遇错就 `any`，等于学了个"带注释的 JS"。正确姿势：从第一个文件起 `strict: true`，报错是学习素材不是敌人。
3. **`any`/`as` 兜底成瘾**：类型报错先想"哪里类型定义错了"，再想收窄，最后才考虑 `as`——且 `as` 要留注释。ESLint 开 `no-explicit-any`。
4. **只学语法不建工程**：全程 Playground 单文件，一旦进真实工程（模块解析、paths、测试）就抓瞎。所以 §3 放在最前面。
5. **把 TS 类型当运行时防线**：TS 类型编译后擦除，`JSON.parse`、请求响应、环境变量这些边界数据必须运行时校验（谓词/`instanceof`/zod），见 `04` 篇第 7 节。
6. **非空断言滥用**：`users.find(...)!.name` 是把空指针搬回运行时。规则：能收窄绝不 `!`，每个 `!` 留注释（`03` 篇 10.2）。
7. **背题不动手**：本篇所有"自测清单"都是"能独立完成什么"，不是"能复述什么"。面试题集中在 `14` 篇，理解后回来补打勾。

## 10. 与其他目录的衔接

### Three.js（`/Users/hh/offer/技术文档/Three.js/`）

- **衔接点**：`three` 包自带完整 `.d.ts`，是"第三方库类型声明"的活教材——`THREE.Scene`、`PerspectiveCamera` 等构造参数即对象类型实战。
- 阶段二之后：用 §3 工程跑 `pnpm add three @types/three`（新版已内置类型），按 `Three.js/01-基础入门.md` 写第一个场景，注意事件回调（`Raycaster` 交互见 `11-交互Controls与Raycaster.md`）的上下文类型推断。
- 阶段四：`Three.js/21-React-Three-Fiber.md` 的组件 Props 是"泛型组件 + 字面量联合"的进阶练习；`23-3D数学基础.md` 的 Vector3 运算适合练 method chaining（`this` 返回类型）。

### Nest（`/Users/hh/offer/技术文档/nest/`）

- **衔接点**：Nest 是 TS 装饰器的最大用户。学完 `09-decorators.md` 立即读 `nest/01-fundamentals/`，对照 `@Controller()`/`@Injectable()` 理解装饰器签名与 `emitDecoratorMetadata`。
- `nest/decorator-summary.md` 自定义装饰器速查可与 `02` 篇 12 节互相印证。
- DTO + class-validator（`nest/09-recipes/`）回答"interface 运行时不存在"的问题：传输层用 class 才能挂校验装饰器——呼应 §9 误区 5。
- 泛型分页 `PaginatedResponse<T>`、`Request` 声明合并扩展（`.d.ts`）在 Nest 源码里都有实例，阶段三后精读。

## 11. 推荐资源

**本系列**：`02` 速查表（随手查）→ `03`~`11` 详解篇 → `12` 类型系统 → `13` 最佳实践 → `14` 面试 → `15` 新特性。

**官方**：[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)（主线）、[TSConfig 参考](https://www.typescriptlang.org/tsconfig)、[Playground](https://www.typescriptlang.org/play)（随手验证类型）。

**练习**：[type-challenges](https://github.com/type-challenges/type-challenges)（配合 `12`/`14` 篇）、[utility-types](https://github.com/piotrwitek/utility-types)、[ts-toolbelt](https://github.com/millsp/ts-toolbelt)。

**框架速查**：[React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)、[Vue 3 TS 指南](https://vuejs.org/guide/typescript/overview.html)。

**工具链**：VS Code（最佳 TS 体验）、ESLint + `@typescript-eslint`、Prettier、tsx/vitest（见 `17-engineering-tsup-vitest.md`）。

**面试高频题**（详见 `14-typescript-interview-questions.md`）：interface vs type、泛型作用、never 与穷尽检查、as const、DeepReadonly 手写、infer 提取、协变逆变（`12` 篇）。

## 12. 一句话总结

> 路线图只负责调度：先用 §3 的 pnpm + tsx + vitest 工程把"写代码"变成零成本，然后按四阶段推进，每阶段以"里程碑自测清单"过关；知识点一律下钻到对应篇目（03~11 详解、12/14 深入与面试），学习期最常见的死法是绕过 strict、any 兜底和只刷体操不碰工程——三条都写进了 §9，定期回来对照。
