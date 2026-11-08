# 3. Everyday Types（日常类型）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「Everyday Types」，https://www.typescriptlang.org/docs/handbook/2/everyday-types.html ，© Microsoft；示例以 TS 5.x 为准，全部可直接在 `tsc --strict` 下验证）
> 关联：`04-narrowing.md`（联合类型收窄全展开）、`05-more-on-functions.md`（函数/重载/泛型/this）、`07-enums.md`（枚举与替代方案）、`08-creating-types-from-types.md`（工具类型与类型运算）、`02-typescript-cheatsheet.md`（速查版）、Nest 文档 `09-recipes/validation.md`（DTO 实战）

## 1. 原始类型（The primitives）

TS 的 7 个原始类型（**小写**开头才是类型标注）：

| 类型 | 含义 | 示例值 |
|---|---|---|
| `string` | 字符串 | `"hello"` |
| `number` | 数字（整数/浮点不分家） | `42`、`3.14` |
| `boolean` | 布尔 | `true` |
| `bigint` | 大整数 | `100n` |
| `symbol` | 唯一符号 | `Symbol("k")` |
| `null` | 显式"没有值" | `null` |
| `undefined` | 未赋值 | `undefined` |

```ts
// primitives.ts
let s: string = "hello";
let n: number = 42;            // 42、3.14、0xff 都是 number
let b: boolean = true;
let big: bigint = 100n;        // 需要 target >= ES2020
let sym: symbol = Symbol("key");
let u: undefined = undefined;
let nl: null = null;
```

TS 还有 `object` 类型（所有非原始类型的集合），但很少直接用——它不描述"形状"。要描述形状请写对象类型或 `interface`（`{}` 与 `object` 的对比见 12 篇）。

### 1.1 装箱怪癖：`String` vs `string`（高频坑）

JS 中访问原始值的属性/方法时，运行时会临时"装箱"成包装对象；TS 把包装对象的**类型**也暴露出来了，但永远不该在标注里用它：

```ts
// boxed.ts
function greet1(name: string) {}   // ✅ 正确：原始类型
function greet2(name: String) {}   // ❌ 反模式：包装对象类型

// 赋值方向是单向的：
const a: String = "hello";         // ✅ string 可以赋给 String（装箱兼容）
const b: string = new String("hi");
// ❌ 报错 TS2322：Type 'String' is not assignable to type 'string'
// greet1(new String("hi"));       // ❌ 同样报错
```

- `string`（小写）是原始类型；`String`/`Number`/`Boolean` 是包装对象类型，`new String()` 产生的是**对象**不是原始值。
- **结论：类型标注一律小写**。`String` 只会带来"有时能赋值有时不能"的困惑；ESLint 规则 `@typescript-eslint/no-wrapper-object-types`（原 `ban-types`）会直接拦截。

### 1.2 `number` 与 `bigint` 互不相通

```ts
// mixed.ts
// const sum: number = 100n;   // 报错：bigint 不能赋给 number
// 100 + 100n;                 // 报错：运算符不能混用两种类型
```

两者是独立类型，混合运算必须显式转换（`Number(100n)` 或 `BigInt(100)`）。

## 2. 数组（Arrays）

```ts
// arrays.ts
const list: number[] = [1, 2, 3];
const list2: Array<number> = [1, 2, 3];   // 泛型等价写法，二者完全一致
const grid: number[][] = [[1], [2]];      // 多维
```

关键区分：`(string | number)[]` ≠ `string[] | number[]`

```ts
// union-array.ts
declare let a: (string | number)[];  // 每个元素"各自"是 string 或 number：[1, "a", 2] ✅
declare let b: string[] | number[];  // 整个数组"要么全 string 要么全 number"：[1, "a"] ❌
```

另一个易混写法：`Promise<number>[]` 是"数组里装 Promise"；`Promise<number[]>` 是"Promise 里装数组"。async/接口层代码里极易写反，报错时先检查这里。

## 3. any、unknown、never 三兄弟

### 3.1 对比表

| 维度 | any | unknown | never |
|---|---|---|---|
| 语义 | 关闭类型检查 | "尚未确定的值"，检查全开 | "不可能存在的值"（空集） |
| 什么能赋给它 | 任何值 | 任何值 | 只有 never 自己 |
| 它能赋给谁 | **任何类型**（病毒式传播） | 只能赋给 `unknown`/`any` | 任何类型都"包含"never |
| 使用限制 | 无（危险） | 必须先收窄或断言 | 不可使用、不可实例化 |
| 典型场景 | 渐进迁移的逃生舱 | `JSON.parse`、`catch` 变量、外部输入 | 抛错函数、穷尽检查兜底（04 篇） |

### 3.2 any 是"关闭检查"，unknown 是"要求先收窄"

```ts
// any-unknown.ts
let obj: any = { x: 0 };
obj.foo();          // 编译不报错，运行时可能直接崩
obj.bar = 100;      // 任意增删属性都放行

let val: unknown = { x: 0 };
// val.foo();       // ❌ 报错 TS18046：'val' is of type 'unknown'
if (typeof val === "object" && val !== null && "foo" in val) {
  (val as { foo: () => void }).foo();   // 收窄 + 断言后才能用
}
```

### 3.3 any 的传染性

any 会沿着赋值和调用链把"无类型"传染出去：

```ts
// any-infection.ts
function format(x: string) { return x.trim(); }

const data: any = JSON.parse('{"name":"a"}');
format(data);             // 编译通过：any 能赋给任何参数
format(data.not.exist);   // 依然编译通过 —— 错误被推迟到运行时
```

把 `data` 换成 `unknown`，第一行调用就会报错——**unknown 在类型边界上拦住 any 的扩散**。

### 3.4 什么时候才允许 any

1. 渐进迁移 JS → TS 的过渡区（配合 `// TODO: remove any` 注释与期限）；
2. 第三方库无类型声明且暂时不想手写 `.d.ts`（更优解仍是 `unknown` + 谓词守卫，见 04 篇第 7 节）;
3. 极少数转发场景：`(fn: (...args: any[]) => any, ...args: any[])` 这类"透传一切"的高阶函数。

工程建议：ESLint `@typescript-eslint/no-explicit-any` 设为 error；真要逃生时写 `any` 并留注释，而不是默默关检查。

### 3.5 never 的直觉

`never` 是空集：没有任何值属于 never，连 `undefined` 都不行。三个来源：

```ts
// never.ts
// 1) 永不正常返回的函数（throw 或死循环）
function fail(msg: string): never {
  throw new Error(msg);
}

// 2) 被条件类型过滤到空的联合（见 12 篇）
type Ex = Exclude<"a" | "b", "a" | "b">;   // never

// 3) 穷尽检查的兜底赋值（见 04 篇第 9 节）
// const n: never = undefined;   // ❌ never 不接受任何值
```

## 4. 类型注解与推断

- TS 能推断大多数场景，**函数参数是唯一"必须注解"的高频位置**（不写就是隐式 any，`noImplicitAny` 下报 TS7006）。
- 变量"先声明、后赋值"必须注解，否则永远 any：

```ts
// inference.ts
let myName = "Alice";        // 推断为 string，无需注解
let myAge: number;           // 声明时未赋值：必须注解
myAge = 30;

let flag;                    // ❌ any（隐式），strict 下可控但仍是坏味道
```

- `let` 保存的 `'Alice'` 会被**拓宽**为 `string`；`const` 保留字面量类型（详见第 9 节）。
- 公开 API/导出函数建议显式标注**参数与返回类型**：报错信息更友好，也防止"改实现悄悄改了签名"。

## 5. 函数类型

```ts
// functions.ts
function greet(name: string): string {
  return `Hello ${name}`;
}

// 函数类型表达式（变量/回调/参数）
type GreetFn = (name: string) => string;
const g: GreetFn = (name) => `Hi ${name}`;   // 参数类型由上下文提供，不必重写
```

- 可选参数 `?`：`(x: number, y?: number) => number`，`y` 的实际类型是 `number | undefined`。
- 默认参数也算可选：`(x: number, y = 10) => x + y`，与 `y?: number` 的差别是**默认参数在函数体内收窄为 `number`**（不可能是 undefined）。
- 剩余参数：`(...args: number[]) => number`。
- 一个容易被忽略的 void 细节：

```ts
// void-return.ts
type VoidFn = () => void;
const f: VoidFn = () => 42;   // ✅ 上下文是 void 时允许 return 值（方便回调复用）
const v = f();                // v 的类型是 void，没有任何可用信息，别去接它
```

重载、泛型、`this` 参数、构造签名等函数进阶见 `05-more-on-functions.md`。

## 6. 对象类型（Object Types）

### 6.1 基础：内联 / 可选 / readonly

```ts
// objects.ts
function printCoord(pt: { x: number; y: number }) {
  console.log(pt.x, pt.y);
}

type User = {
  readonly id: number;      // 只读：初始化后不可再赋值（编译期检查）
  name: string;
  email?: string;           // 可选
};

const u: User = { id: 1, name: "a" };
// u.id = 2;                // ❌ 报错 TS2540：id is read-only
```

### 6.2 可选属性的"双重含义"（坑）

`email?: string` 在 strictNullChecks 下实际是 `string | undefined`，**还多一层"属性可能压根不存在"**：

```ts
// optional.ts
const u: { email?: string } = {};
console.log("email" in u);   // false：属性可以不存在，而不只是值为 undefined
```

TS 4.4+ 的 `exactOptionalPropertyTypes: true` 可以把"缺属性"与"显式赋 undefined"区分开（配置见 `11-tsconfig.md`）。

### 6.3 索引签名

```ts
// index-signature.ts
type Scores = { [subject: string]: number };
const s: Scores = { math: 90, english: 85 };
const x = s.chiness;   // 类型是 number —— 拼写错误查不出来，且实际是 undefined！

// 更精确的替代：键集合有限时用 Record + 联合
type Allowed = Record<"math" | "english", number>;
const s2: Allowed = { math: 90, english: 85 };
// s2.chiness;   // ✅ 编译期直接报错
```

- 索签名字段的类型必须兼容具名属性：`{ [k: string]: number; id: number }` ✅；`{ [k: string]: number; id: string }` ❌。
- 能用有限键联合 + `Record` 就别用宽索引签名，代价是丢失拼写检查。

## 7. 联合类型（Union Types）

```ts
// union.ts
function printId(id: number | string) {
  // console.log(id.toUpperCase());
  // ❌ 报错 TS2339：Property 'toUpperCase' does not exist on type 'string | number'
  if (typeof id === "string") {
    console.log(id.toUpperCase());   // 此分支收窄为 string
  } else {
    console.log(id.toFixed(2));      // 此分支收窄为 number
  }
}
```

- **联合类型的值只能用"所有成员共有"的成员**，要用某一方独有的就必须先收窄——完整收窄手册见 `04-narrowing.md`。
- 对象联合最常见的形态是**判别联合**（每个成员带一个字面量字段当标签），switch 判别字段即可收窄：

```ts
// discriminated.ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.size ** 2;
  }
}
```

- 对偶概念是交叉类型 `A & B`（"同时满足"）。坑：原始类型交叉会得到 never（`string & number` = never）。类型运算详见 `08-creating-types-from-types.md` 与 12 篇。

## 8. 类型别名 vs 接口

### 8.1 两种定义方式

```ts
// alias-vs-interface.ts
type Point = { x: number; y: number };            // type 别名
type ID = string | number;                        // type 能表达联合
type Pair = [string, number];                     // type 能表达元组

interface IPoint { x: number; y: number }
interface IPoint3D extends IPoint { z: number }   // interface 用 extends 扩展（可 extends 多个）

type TPoint3D = Point & { z: number };            // type 扩展对象用交叉
```

### 8.2 核心差异表

| 维度 | interface | type |
|---|---|---|
| 扩展方式 | `extends`（也 extends type 别名） | `&` 交叉 |
| 同名重复声明 | ✅ 自动**声明合并** | ❌ 报"重复标识符" |
| 联合 / 元组 / 映射 / 条件类型 | ❌ 表示不了 | ✅ |
| implements/extends 对象形状 | ✅ 首选 | ✅ 均可 |
| 错误信息可读性 | 显示接口名，较清晰 | 复杂交叉会被展开成大块结构，难读 |
| 补全体验 | 命名提示更友好 | 大体相当 |

### 8.3 声明合并：双刃剑

```ts
// merging.ts
interface Window { title: string }
interface Window { version: number }
// ✅ 自动合并为 { title: string; version: number }

// 同名属性类型冲突时合并报错；这不是 bug，是"给库扩展 API"的能力
// （比如给 Window/Request 加自定义字段，见 02 篇 .d.ts 一节）。
// 坑：自己不小心写了两遍同名 interface 会"静默合并"，字段拼错也不一定立刻发现。
```

### 8.4 官方建议表述

官方原话大意：**这是个人风格问题，其余随你**。落地通用约定（多数团队 lint 采用）：

- 对象/类的形状、需要被 `implements`、或可能被声明合并扩展的 → `interface`；
- 联合、元组、映射、条件类型、工具类型组合 → 只能用 `type`；
- 同一项目保持一致最重要，可用 `@typescript-eslint/consistent-type-definitions` 强制（默认建议 `interface`）。

## 9. 字面量类型与推断

### 9.1 let 拓宽，const 保留

```ts
// literal.ts
let s = "hello";     // 类型 string（拓宽 widening）
const c = "hello";   // 类型 "hello"（const 保留字面量）

let alignment: "left" | "right" | "center" = "left";
alignment = "right";  // ✅ 只能三选一
// alignment = "top"; // ❌ 报错：不能赋给三者的联合
```

字面量联合是比 `enum` 更轻的"枚举"（见 `07-enums.md` 的对比与替代方案）。

### 9.2 经典坑：对象字面量的属性会退化

```ts
// widening-pitfall.ts
const req = { url: "https://a.com", method: "GET" };
// req 的类型是 { url: string; method: string }  ← method 从 "GET" 退化成了 string！

type Req = { url: string; method: "GET" | "POST" };
const r: Req = req;
// ❌ 报错 TS2322：string 不能赋给 "GET" | "POST"
```

三种修法（按推荐排序）：

```ts
// widen-fix.ts
// 1) 声明处标注，让上下文锁住字面量
const r1: Req = { url: "https://a.com", method: "GET" };

// 2) as const 整体收窄
const r2 = { url: "https://a.com", method: "GET" } as const;

// 3) 传参位置天然有上下文类型，字面量不会拓宽
function send(url: string, method: "GET" | "POST") {}
send("https://a.com", "GET");   // ✅
```

### 9.3 as const：const 断言与可变性

```ts
// as-const.ts
const config = { host: "localhost", port: 3000 } as const;
// 类型：{ readonly host: "localhost"; readonly port: 3000 }
// config.port = 8080;   // ❌ read-only

const colors = ["red", "green"] as const;
// 类型：readonly ["red", "green"]（只读元组）
type Color = (typeof colors)[number];   // "red" | "green" —— "轻量枚举"惯用法
```

- `as const` **只改类型不改运行时**：对象还是那个可变对象；要运行时冻结用 `Object.freeze`。
- `as const` 只能放在字面量（对象/数组/字符串等）上，不能对变量引用断言。
- `as const` 递归加 readonly；只想"顶层只读"可用 `Readonly<T>`/`readonly T[]`（见 02 篇工具类型）。

## 10. null 与 undefined 全家

### 10.1 strictNullChecks 是分水岭

```ts
// strict-null.ts
// strictNullChecks: false 时 —— null/undefined 可赋给任何类型（危险默认，历史遗留）：
// const x: string = null;    // 不报错！

// strictNullChecks: true（strict 的一部分，必开）：
const name: string | null = Math.random() > 0.5 ? "a" : null;
// name.toUpperCase();
// ❌ 报错 TS18047：'name' is possibly 'null'
```

- 无数线上 `Cannot read properties of undefined` 都来自关掉 strictNullChecks 的老配置。
- 可选参数 ≡ 参数类型含 `undefined`：`(x?: number)` 与 `(x: number | undefined)` 唯一的区别是前者"可以不传实参"（见 6.2 的属性版）。

### 10.2 `!` 非空断言：适用与滥用

```ts
// non-null.ts
function liveDangerously(x?: number | null) {
  console.log(x!.toFixed());   // ! 表示"我保证它不是 null/undefined"
}
```

**适用**：编译器无法证明、但你在当前语境确实能保证的场景：

```ts
// non-null-ok.ts
const el = document.getElementById("root")!;   // HTML 模板里确定存在 #root
// 依赖注入延迟初始化字段（Nest/MobX 常见）：
class Service {
  db!: Database;   // 框架保证初始化，用 definite assignment 断言
}
```

**滥用 = 把空指针从编译期搬回运行期**：

```ts
// non-null-bad.ts
const user = users.find((u) => u.id === id)!;   // find 本来就可能返回 undefined！
console.log(user.name);   // 编译通过，运行时可能 TypeError
// ✅ 修法：先判断再使用（收窄见 04 篇）
const found = users.find((u) => u.id === id);
if (!found) throw new Error(`user ${id} not found`);
console.log(found.name);
```

规则：**能收窄绝不 `!`**；每写一个 `!` 必须留一行注释说明"为什么这里安全"。

### 10.3 `?.` 可选链与 `??` 空值合并

```ts
// optional-chain.ts
interface Foo { bar?: { baz?: () => void } }
declare const foo: Foo | undefined;

foo?.bar?.baz?.();          // 全程短路，任一环节 nullish 则整体为 undefined
const v = foo?.bar?.baz;    // v: (() => void) | undefined

const port = process.env.PORT ?? 3000;   // 仅 null/undefined 才取默认值
const level = input.level || 1;          // 坑：0、''、false 也会被换成 1！
```

- `??` 与 `||` 的区别（高频面试题）：`||` 对所有 falsy（`0`、`""`、`false`、`NaN`）都走右侧；`??` 只认 `null`/`undefined`。**默认值场景一律 `??`**。
- `a?.b` 等价于 `a !== null && a !== undefined ? a.b : undefined`：只把 nullish 短路成 undefined，`0`、`""`、`false` 都会**正常继续访问**，不会帮你挡 falsy。
- `?.` 还可用于元素访问 `arr?.[0]` 和调用 `fn?.()`。

### 10.4 缩窄小练习

```ts
// exercise.ts
function greet(name: string | null | undefined): string {
  // 三种等价写法：
  // 1) if (name === null || name === undefined) return "Hello anon";
  // 2) if (name == null) return "Hello anon";        // == null 同时覆盖两个 nullish
  // 3) 表达式级：?? 兜底
  return `Hello ${name ?? "anon"}`;
}
```

## 11. 枚举一句话

`enum` 是 TS 独有、**运行时真实存在**的结构；现代代码更倾向用 `as const` 对象或字面量联合替代（零运行时开销、更贴 JS）。数字/字符串/const enum/坑的完整展开见 `07-enums.md`。

```ts
// enum-brief.ts
enum Direction { Up, Down, Left, Right }
let d: Direction = Direction.Up;
```

## 12. 要点速查

| 主题 | 一句话 |
|---|---|
| 原始类型 | 一律小写：`string` 而非 `String` |
| `T[]` / `Array<T>` | 等价；`Promise<number>[]` 与 `Promise<number[]>` 别搞混 |
| `any` | 关闭检查，能不用就不用（`unknown` + 收窄替代） |
| `unknown` | 安全 any：先收窄再用 |
| `never` | 空集：穷尽检查的基石 |
| `{ ... }` / `interface` | 对象形状；可选属性 ≡ 含 undefined |
| `A \| B` | 联合：先收窄再访问成员（见 04 篇） |
| `type` vs `interface` | 联合/元组/映射必须 type；对象形状优先 interface |
| `'a' \| 'b'` | 字面量联合 = 轻量枚举 |
| `as const` | 深只读 + 保留字面量类型 |
| `!` | 非空断言：能收窄就别用 |
| `??` vs `\|\|` | 默认值用 `??`（`\|\|` 误伤 0/""） |

> 跨语言对比：Java 的接口、Go 的结构体隐式实现、Python 的 typing（`Union`、`TypedDict`）——TS 的 `interface` + `type` 组合最接近 Java 接口 + 类型别名，但更灵活（结构类型系统，多一个字段也能赋值，见 12 篇）。

## 13. 常见坑汇总

1. `String` vs `string`：包装对象类型单向赋值，标注一律小写（1.1）。
2. 对象字面量属性退化为 `string`，丢掉字面量联合（9.2）。
3. `||` 当默认值误伤 `0`/`""`，默认值一律 `??`（10.3）。
4. `!` 断言掩盖 `find` 返回 `undefined`（10.2）。
5. 宽索引签名让拼写错误合法化（6.3）。
6. interface 重名**静默合并**，字段冲突才报错（8.3）。
7. `?.` 只短路 nullish，不挡 `0`/`""`（10.3）。
8. 隐式 any：忘标函数参数（TS7006，第 4 节）。

## 14. 衔接

- 类型收窄全手法（typeof/in/instanceof/谓词/断言/穷尽）见 `04-narrowing.md`
- 函数进阶（重载/泛型/this 类型）见 `05-more-on-functions.md`
- 类与继承见 `06-classes.md`
- 泛型/映射/工具类型见 `08-creating-types-from-types.md` 与 `12-typescript-advanced-type-system.md`
- 装饰器（Nest 的 `@Injectable()` 等）见 `09-decorators.md`、`18-decorators-deep.md`
- Nest DTO + class-validator 实战见 `技术文档/nest/09-recipes/validation.md`

## 15. 一句话总结

> Everyday Types 是每天在写的地基：小写原始类型 + 数组 + 对象形状 + 联合收窄 + type/interface 分工 + 字面量与 `as const` + null/undefined 防御（`?.`/`??`，收窄优先于 `!`）。地基牢了，04 篇的收窄与 08 篇的类型运算才有意义。
