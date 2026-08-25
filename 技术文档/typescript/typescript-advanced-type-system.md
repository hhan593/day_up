# TypeScript 类型系统深入

> 面向已掌握基础语法的读者，深入理解 TS 类型系统的底层规则与高级模式。
> 内容：赋值兼容性、协变/逆变、类型推断机制、条件类型分配律、infer 深度应用、递归类型、模板字符串类型、类型体操进阶题解。

---

## 一、类型兼容性与结构化类型

### 1.1 赋值兼容规则（assignability）

TS 判断 `S` 能否赋给 `T`（`S extends T`）的核心规则：

1. **结构化匹配**：`S` 的每个成员在 `T` 中都能找到兼容成员（**多的可以赋给少的，少的不能赋给多的**）。
2. **可区分联合**：`T` 是联合时，`S` 必须能赋给其中**某一个**成员。
3. **函数的参数是逆变，返回值是协变**（strictFunctionTypes 下）。
4. 泛型默认**不逆变**（`Array<Dog>` 和 `Array<Animal>` 由元素类型决定）。

```ts
interface Named { name: string }
interface Person extends Named { age: number }

let named: Named = { name: "x" };
let person: Person = { name: "x", age: 1 };

person = named;        // 报错：缺少 age（多的不能赋给少的...反了，named 少）
named = person;        // OK：多余属性允许（结构化类型）
```

> 结构性类型的精髓：**鸭子类型**（duck typing）——"看起来像鸭子、叫起来像鸭子，那就是鸭子"。

### 1.2 多余属性检查（excess property checking）

对象字面量赋值时，TS 会做**额外属性检查**，而变量赋值不做：

```ts
interface Point { x: number; y: number }

// 报错：对象字面量不能有额外属性 z
const p: Point = { x: 1, y: 2, z: 3 };

const extra = { x: 1, y: 2, z: 3 };
const q: Point = extra; // OK！变量赋值只做结构化检查

// 绕过的正当理由：该属性确实存在但不想声明
const r: Point = { x: 1, y: 2, ...extra };
```

**应用**：让"配置对象"更安全；也可用于**变体模式**（给字面量打标签）。

### 1.3 联合类型的分发（distributive conditional types）

当条件类型 `T extends U ? X : Y` 中 `T` 是**裸类型参数**（未包裹）时，联合类型会被**逐个分发**：

```ts
type ToArray<T> = T extends unknown ? T[] : never;

// 不带分发：直接整体判断
type Wrap<T> = T extends unknown ? T[] : never;

type A = ToArray<string | number>; // string[] | number[]（分发）
type B = Wrap<string | number>;    // (string | number)[]（不分发）
```

**抑制分发**的方法：用方括号包裹 `[T]`：

```ts
type IsUnion<T> = [T] extends [T & {}] ? false : true; // 判断是否是联合类型
```

**经典应用**：

```ts
type Exclude<T, U> = T extends U ? never : T;
// Exclude<"a" | "b" | "c", "a"> = "b" | "c"

type Extract<T, U> = T extends U ? T : never;
```

### 1.4 空对象类型 `{}` 与 `object`

```ts
const a: {} = "hello";        // OK：{} 匹配任何非 null/undefined
const b: object = "hello";    // 报错：object 要求是对象（原始类型不行）
const c: object = {};         // OK
```

- `{}` ≈ `NonNullable<unknown>`，几乎是"任意非空值"。
- `object` 要求非原始类型。
- 生产代码避免直接使用 `{}` 作为类型（意图不明）。

---

## 二、协变与逆变（variance）

### 2.1 定义

| 方向 | 含义 | 例子 |
|---|---|---|
| 协变（covariance） | 子类型可以出现在父类型位置 | 数组、对象属性、函数返回值 |
| 逆变（contravariance） | 父类型可以出现在子类型位置 | 函数参数（strict 下） |
| 双变（bivariance） | 两个方向都允许 | 方法声明（method syntax）的参数 |

### 2.2 `strictFunctionTypes` 的影响

```ts
type Handler<T> = (arg: T) => void;

declare let hAnimal: Handler<Animal>;
declare let hDog: Handler<Dog>;

// 严格模式：参数逆变
hAnimal = hDog; // 报错（hDog 只能处理 Dog，不能处理 Animal）
hDog = hAnimal; // OK（hAnimal 能处理所有 Animal，自然包括 Dog）
```

**方法语法是双变**（历史遗留，为兼容）：

```ts
interface X {
  handle(arg: Animal): void;   // 方法：双变，可相互赋值
}
interface Y {
  handle: (arg: Dog) => void;  // 属性函数：逆变，检查严格
}
```

> 最佳实践：**用属性函数写法 `handle: (arg) => void`**，以获得更安全的检查。

### 2.3 协变的位置与泛型

```ts
// 数组是协变的：Dog[] 可以赋给 Animal[]
let animals: Animal[] = dogs;

// 但是！协变 + 可变容器会导致类型不安全（TS 选择信任开发者）
animals.push(new Animal()); // 运行时把 Animal 塞进了 Dog 数组

// 只读数组更安全：ReadonlyArray 还是协变，但没有 push
```

**泛型类型本身的 variance 取决于用法**（TS 是结构性的，天然推断）：

```ts
// Producer 是协变（T 只出现在返回值）
interface Producer<T> { produce(): T }
// Consumer 是逆变（T 只出现在参数）
interface Consumer<T> { consume(arg: T): void }
```

---

## 三、类型推断机制

### 3.1 推断优先级

1. 显式类型注解 > 上下文类型（contextual typing）> 泛型推断 > 默认类型/`any`
2. 字面量拓宽（widening）：`let x = "a"` → `string`；`const x = "a"` → `"a"`
3. `as const` 阻止拓宽

```ts
let s = "a";          // string（let 拓宽）
const c = "a";        // "a"（const 保留字面量）

let o = { name: "x" };      // { name: string }
const o2 = { name: "x" };   // { name: string }（属性依然拓宽！）
const o3 = { name: "x" } as const; // { readonly name: "x" }
```

### 3.2 上下文类型（contextual typing）

根据"使用位置"推断类型，常用于回调与对象字面量：

```ts
const handlers = {
  onClick: (e) => e.clientX,   // e 自动推断为 MouseEvent
};

[1, 2, 3].map((n) => n * 2);   // n: number

document.addEventListener("click", (e) => e.preventDefault()); // e: MouseEvent
```

### 3.3 泛型推断顺序与尾随参数

```ts
function zip<A, B>(a: A[], b: B[]): [A, B][] { ... }

// 从左到右推断；无法推断的从右往左兜底
function curry<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R { return fn; }

// 泛型与默认参数：显式指定优于推断
function fn<T = string>(x?: T): T { return x!; }
```

### 3.4 `NoInfer`（5.4+）：防止某位置的类型参与推断

```ts
function create<T extends string>(name: T, fallback: NoInfer<T>) { ... }

// 没有 NoInfer：fallback 可能拓宽 T
// create("a", "b"); // T 可能是 "a" | "b"
```

---

## 四、infer 深度应用

### 4.1 infer 的规则

- 只能出现在 `extends` 条件类型的**分支位置**
- 同一位置可多次 infer；不同 infer 变量可以相同
- infer 会"贪婪匹配"，配合 rest 控制范围

### 4.2 元组中的 infer

```ts
type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;
type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

type Pop<T extends unknown[]> = T extends [...infer Rest, unknown] ? Rest : never;
type Push<T extends unknown[], V> = [...T, V];

// 反转元组（递归）
type Reverse<T extends unknown[]> = T extends [infer F, ...infer Rest]
  ? [...Reverse<Rest>, F]
  : [];
```

### 4.3 函数签名中的 infer

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Parameters<T> = T extends (...args: infer P) => any ? P : never;
type InstanceType<T> = T extends abstract new (...args: any) => infer R ? R : any;
type ConstructorParameters<T> = T extends abstract new (...args: infer P) => any ? P : never;

// 提取最后一个参数
type LastParameter<F extends (...args: any) => any> =
  F extends (...args: [...any[], infer L]) => any ? L : never;
```

### 4.4 字符串中的 infer

```ts
// 去掉前缀
type TrimLeft<S extends string> = S extends `${infer H}${Rest}` ? ... : ...;

// 首字母大写
type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

// 提取指定格式
type ExtractNumbers<S extends string> =
  S extends `${infer _}(${infer N})${infer __}` ? N : never;
type N = ExtractNumbers<"area(42)">; // "42"
```

### 4.5 递归 + infer：深度处理

```ts
// 深度解包 Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

// 逐层展开数组
type Flatten<T extends unknown[]> = T extends [infer F, ...infer Rest]
  ? [...(F extends unknown[] ? Flatten<F> : [F]), ...Flatten<Rest>]
  : [];
type F = Flatten<[1, [2, [3, 4]], 5]>; // [1, 2, 3, 4, 5]
```

---

## 五、递归类型与限制

### 5.1 递归深度

- TS 对类型递归有深度限制（默认约 50 层展开、1000 实例化层级），超限报：
  `Type instantiation is excessively deep and possibly infinite.`
- 缓解：尾部递归优化（TS 4.5+ 对条件类型做了 tail recursion 优化）、减少中间展开。

```ts
// 尾递归版本（4.5 起可被优化，不再爆栈）
type TrimRight<S extends string> =
  S extends `${infer Rest} `
    ? TrimRight<Rest>
    : S;
```

### 5.2 类型级斐波那契（练习递归）

```ts
type Fib<N extends number> =
  N extends 0 ? 0 :
  N extends 1 ? 1 :
  N extends 2 ? 1 :
  Fib<Subtract<N, 1>>; // 需要先实现数字减法（用元组长度模拟）
```

> 类型体操中"数字"通常用元组长度模拟：`type NumToTuple<N extends number, T extends any[] = []> = T["length"] extends N ? T : NumToTuple<N, [...T, any]>;`

---

## 六、模板字符串类型实战

### 6.1 字符串解析 DSL

```ts
// 解析路由参数
type RouteParams<R extends string> =
  R extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<`/${Rest}`>]: string }
    : R extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type Params = RouteParams<"/user/:id/posts/:postId">;
// { id: string; postId: string }
```

### 6.2 事件名构造（键重映射 + 模板字符串）

```ts
type EventMap = {
  click: MouseEvent;
  keydown: KeyboardEvent;
};

type Handlers = {
  [K in keyof EventMap as `on${Capitalize<K>}`]: (e: EventMap[K]) => void;
};
// { onClick: (e: MouseEvent) => void; onKeydown: (e: KeyboardEvent) => void }
```

### 6.3 类型级别的字符串工具

```ts
// 大小写切换（内置：Uppercase/Lowercase/Capitalize/Uncapitalize）
type KebabToCamel<S extends string> =
  S extends `${infer A}-${infer B}` ? `${A}${Capitalize<KebabToCamel<B>>}` : S;
type C = KebabToCamel<"border-top-left">; // "borderTopLeft"

type CamelToKebab<S extends string> =
  S extends `${infer A}${infer B}`
    ? A extends Uppercase<A>
      ? `-${Lowercase<A>}${CamelToKebab<B>}`
      : `${A}${CamelToKebab<B>}`
    : S;
type K = CamelToKebab<"borderTopLeft">; // "border-top-left"
```

---

## 七、类型体操进阶题解

> 以下题目出自 type-challenges 中等/困难级别，按"题解 + 思路"组织。

### 7.1 `DeepReadonly`（中等）

```ts
type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Function
    ? T
    : { readonly [K in keyof T]: DeepReadonly<T[K]> };
```

**思路**：先判断数组（递归元素），再判断函数（不能递归内部），最后映射对象。

### 7.2 `Chainable`（中等）：链式调用类型

```ts
type Chainable<T = {}> = {
  option<K extends string, V>(
    key: K extends keyof T ? never : K,
    value: V
  ): Chainable<T & Record<K, V>>;
  get(): T;
};
```

**要点**：用 `&` 累加类型；重复 key 通过 `K extends keyof T ? never : K` 拒绝。

### 7.3 `Permutation`（中等）：全排列

```ts
type Permutation<T, U = T> =
  [T] extends [never]
    ? []
    : T extends U
      ? [T, ...Permutation<Exclude<U, T>>]
      : never;

type P = Permutation<"a" | "b">; // ["a","b"] | ["b","a"]
```

**要点**：`[T] extends [never]` 防分发终止；外层 `T extends U` 触发分发，`Exclude<U, T>` 排除当前元素。

### 7.4 `IsUnion`（中等）

```ts
type IsUnion<T, U = T> =
  T extends U
    ? ([U] extends [T] ? false : true)
    : never;
```

**思路**：分发后若 `[U] extends [T]` 成立说明 T 覆盖整个联合（单类型），否则是联合。

### 7.5 `Replace` / `ReplaceAll`（中等）

```ts
type Replace<
  S extends string,
  From extends string,
  To extends string
> = From extends "" 
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${Tail}`
    : S;

type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;
```

### 7.6 `CamelCase`（困难）

```ts
type CamelCase<S extends string> =
  S extends `${infer A}_${infer B}${infer Rest}`
    ? `${A}${Uppercase<B>}${CamelCase<Rest>}`
    : S;
type C = CamelCase<"foo_bar_baz">; // "fooBarBaz"
```

### 7.7 `UnionToIntersection`（困难）：联合转交叉

```ts
type UnionToIntersection<U> =
  (U extends any ? (arg: U) => void : never) extends
  (arg: infer I) => void ? I : never;

type U = UnionToIntersection<{ a: 1 } | { b: 2 }>; // { a: 1 } & { b: 2 }
```

**原理**：利用函数参数的**逆变**——把联合分发成多个函数签名，再 infer 参数得到交叉（逆变会让多个参数类型取交集）。

### 7.8 `DeepEqual`（困难）

```ts
type DeepEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2)
    ? true : false;
```

**原理**：利用"函数签名比较"判断类型是否**完全相同**（包括联合顺序、readonly 等细节）。

### 7.9 `BinaryToDecimal`（困难）：二进制转十进制

```ts
type Tuple = [unknown, ...unknown[]];
type BinaryToDecimal<S extends string, R extends unknown[] = []> =
  S extends `${infer F}${infer Rest}`
    ? BinaryToDecimal<
        Rest,
        F extends "1" ? [...R, ...R, unknown] : [...R, ...R]
      >
    : R["length"];
```

**思路**：逐位读取，`R` 翻倍，是 1 就多一个元素，最后取长度。

### 7.10 `KebabCase`（中等）+ `PascalCase`（中等）

```ts
type KebabCase<S extends string> =
  S extends `${infer A}${infer B}`
    ? B extends Uncapitalize<B>
      ? `${Uncapitalize<A>}${KebabCase<B>}`
      : `${Uncapitalize<A>}-${KebabCase<B>}`
    : S;
```

### 7.11 `Assert`（中等）：运行时断言 + 类型收窄

```ts
type Assert<T extends true> = T;

function assert(condition: unknown): asserts condition {
  if (!condition) throw new Error("Assertion failed");
}
```

**要点**：`asserts condition` 是**断言函数**签名，让后续代码知道条件成立（类型收窄）。

### 7.12 `IsAny`（困难）

```ts
type IsAny<T> = 0 extends (1 & T) ? true : false;
```

**原理**：`any` 与任何类型交叉都是 `any`，`1 & any = any`，`0 extends any` 成立。

### 7.13 `IsNever`（中等）

```ts
type IsNever<T> = [T] extends [never] ? true : false;
// 必须用 [] 包裹，否则条件类型遇到 never 会直接返回 never
```

### 7.14 `IsTuple`（中等）

```ts
type IsTuple<T> =
  [T] extends [never] ? false :
  T extends readonly unknown[]
    ? number extends T["length"] ? false : true
    : false;
```

**要点**：元组的 `length` 是字面量；数组的 `length` 是 `number`。`number extends T["length"]` 为真说明是数组。

---

## 八、高级模式速览

### 8.1 类型守卫（type guard）与断言函数

```ts
// 自定义类型守卫：is
function isString(x: unknown): x is string {
  return typeof x === "string";
}

// 断言函数：asserts
function assertString(x: unknown): asserts x is string {
  if (typeof x !== "string") throw new TypeError("not a string");
}
```

### 8.2 变体模式（brand / opaque type）

```ts
declare const brand: unique symbol; // unique symbol 保证唯一

type Brand<T, B> = T & { readonly [brand]: B };

type Email = Brand<string, "Email">;
type UserId = Brand<number, "UserId">;

function sendEmail(to: Email) {}
sendEmail("a@b.com");             // 报错
sendEmail("a@b.com" as Email);    // OK
```

### 8.3 判别联合 + 穷尽检查

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    case "rect": return s.w * s.h;
    default: {
      // s 在这里是 never，编译器强制你处理所有分支
      const _exhaustive: never = s;
      throw new Error("unreachable");
    }
  }
}
```

### 8.4 模板字面量驱动的状态机

```ts
type HttpResult =
  | { status: 200; data: unknown }
  | { status: 201; data: unknown }
  | { status: 400; message: string }
  | { status: 500; message: string };

// 按状态码区分 payload
type Success = Extract<HttpResult, { status: 200 | 201 }>;
```

### 8.5 递归模板字符串构建路径类型

```ts
type PathOf<T, P extends string = ""> =
  keyof T extends never
    ? P
    : { [K in keyof T]: T[K] extends object
        ? PathOf<T[K], `${P}/${K & string}`>
        : `${P}/${K & string}`
      }[keyof T];

type Obj = { user: { profile: { name: string } }; config: { port: number } };
type Paths = PathOf<Obj>; // "/user/profile/name" | "/user/profile" | ...
```

---

## 九、性能与可维护性

### 9.1 类型计算性能

- **避免大 union**：检查器按成员展开，超大 union 拖慢编译。
- **避免深层递归**：优先"尾递归 + 缓存"（TS 4.5 后条件类型尾递归优化）。
- **优先 `interface`**：接口有缓存，交叉类型每次重新计算。
- **`skipLibCheck`**：跳过 `.d.ts` 检查，显著加速。
- **`incremental` + 项目引用**：大型项目拆 tsconfig 分层编译。

### 9.2 类型体操的"度"

- 业务代码中类型体操超过 3 层递归/分发，就应该考虑：
  - 拆成函数并加注释
  - 用运行时方案（zod）替代
  - 把类型约束在"工具层"，不让业务代码感知

### 9.3 常见编译错误速查

| 错误 | 含义 | 处理 |
|---|---|---|
| TS2322 | 类型不兼容 | 检查形状、可选性、null 处理 |
| TS2345 | 参数类型不匹配 | 检查协变/逆变方向 |
| TS2532 | 可能 undefined | 用 `?.`/`??`/窄化 |
| TS2589 | 类型实例化过深 | 拆递归、加缓存 |
| TS2304 | 找不到名称 | 检查声明/导入 |
| TS2739 | 缺少属性 | 补全对象形状 |
| TS2352 | 断言不兼容 | 需要经 `unknown` 中转 |
| TS2741 | 缺少必填属性 | 补全属性 |
| TS2578 | 未使用 `@ts-expect-error` | 错误已消失，删除注释 |
