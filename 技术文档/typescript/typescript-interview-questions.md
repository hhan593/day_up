# TypeScript 面试高频题汇总

> 适用场景：前端 / 全栈岗位面试。按「基础 → 进阶 → 手写 → 工程化」分层，附带答题要点与代码示例。
> 建议配合《typescript-cheatsheet.md》和《typescript-advanced-type-system.md》一起复习。

---

## 一、基础概念

### 1. TypeScript 是什么？和 JavaScript 的关系？

- TS 是 JS 的**超集**（superset），在 JS 基础上增加了**静态类型系统**。
- 编译期做类型检查，运行时被擦除（type erasure），产物仍是 JS。
- 所有合法 JS 都是合法 TS（`allowJs` 下可直接混用）。
- 核心价值：**把运行期错误提前到编译期**，提升可维护性与可读性。

**答题要点**：强调"编译期类型检查 + 运行时类型擦除"两个关键词。

### 2. 类型注解（type annotation）与类型推断（type inference）的区别？

```ts
// 类型注解：显式声明
let age: number = 25;

// 类型推断：TS 自动推导
let name = "Alice"; // 自动推断为 string
```

- 能推断时不写注解，保持代码简洁；注解用于：函数参数/返回值、无法推断的场景、约束外部输入。

### 3. `any` / `unknown` / `never` / `void` 的区别？

| 类型 | 含义 | 何时用 |
|---|---|---|
| `any` | 放弃类型检查，可赋值给任何类型，任何类型也可赋给它 | 迁移期兜底，**生产代码尽量避免** |
| `unknown` | 类型安全的 `any`，不能直接调用方法/属性，必须先缩小 | 未知的外部输入（API 响应、JSON.parse） |
| `never` | 永不返回的类型（抛出异常、死循环、穷尽检查） | 穷尽性检查（exhaustive check）、不可达分支 |
| `void` | 不返回有意义的值（函数没有 return） | 函数返回类型 |

```ts
function handleUnknown(value: unknown) {
  // value.toUpperCase(); // 报错：unknown 不能直接调用
  if (typeof value === "string") {
    value.toUpperCase(); // 缩小后可以
  }
}

function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${x}`);
}
```

### 4. `interface` 与 `type` 的区别？什么时候用哪个？

相同点：
- 都能描述对象形状
- 都能被继承/扩展
- 都能用于泛型约束

不同点：

| 维度 | interface | type |
|---|---|---|
| 声明合并 | **支持**（同名自动合并） | 不支持（重复声明报错） |
| 基本类型别名 | 不支持 | 支持（`type ID = string`） |
| 联合/交叉类型 | 不支持直接写 | 支持（`A \| B`、`A & B`） |
| 元组/映射类型 | 不直接支持 | 支持 |
| 继承语法 | `extends` | `&`（交叉） |
| 性能 | 对象类型扩展更友好（合并、缓存） | 交叉类型有时会展开得很复杂 |

```ts
interface User { name: string }
interface User { age: number } // OK：合并
// type User = { name: string }; // 若 type 则报重复

type ID = string | number;       // 联合类型只能 type
type Point = [number, number];   // 元组只能 type
```

**最佳实践**：
- 对外 API / 库的类型（需扩展、合并）→ `interface`
- 内部业务类型、联合/交叉/元组 → `type`
- 官方推荐：能用 `interface` 优先 `interface`，需要联合/交叉时用 `type`

### 5. `type` 别名与 `interface` 能否互相继承？

- interface 继承 type：可以（`interface A extends B {}`，B 需是对象类型）
- type 继承 interface：可以（`type C = D & {...}`）
- 关键限制：**interface 不能 extends 联合类型**

### 6. 类型断言（type assertion）：`as` 与 `as const`？

```ts
// as：告诉编译器"我比你更懂"
const input = document.getElementById("input") as HTMLInputElement;

// as const：让字面量变成只读的、最具体的类型
const config = { url: "/api", retries: 3 } as const;
// 类型为：{ readonly url: "/api"; readonly retries: 3 }

// 双重断言（尽量避免）
const x = "abc" as unknown as number;
```

**注意**：`as` 不能用于互相不兼容的类型（如 string as number 会报错），需要先转 `unknown`。

### 7. 什么是类型缩小（type narrowing）？有哪些方式？

```ts
function fn(value: string | number | null) {
  // 1. typeof 收窄
  if (typeof value === "string") { value.toUpperCase(); }

  // 2. instanceof 收窄
  // if (value instanceof Date) { ... }

  // 3. in 操作符收窄
  // if ("key" in obj) { ... }

  // 4. 真值收窄（去掉 null/undefined/0/''）
  if (value) { /* value 此时是 string | number */ }

  // 5. 判别联合（discriminated union）
  // if (obj.kind === "circle") { ... }
}
```

- 判别联合（tagged/discriminated union）是缩小的高级用法，见进阶部分。

### 8. 什么是可空类型？`strictNullChecks` 的作用？

- `null` / `undefined` 默认可以赋给任何类型（关闭 strictNullChecks 时）。
- 开启 `strictNullChecks` 后，`null`/`undefined` 不能赋给非空类型，必须显式处理：

```ts
function getLength(s?: string) {
  return s?.length ?? 0; // 可选链 + 空值合并
}
```

- 配套：可选链 `?.`、空值合并 `??`、`!` 非空断言（慎用）。

---

## 二、进阶概念

### 9. 什么是泛型（generics）？为什么需要？

- 泛型是"**类型的参数**"，让函数/类/接口在不绑定具体类型的前提下复用逻辑。

```ts
function identity<T>(value: T): T {
  return value;
}

// 泛型约束
function getLength<T extends { length: number }>(v: T): number {
  return v.length;
}
```

- 类型参数可以多个：`<K, V>`。
- 泛型默认值：`function fn<T = string>() {}`。

### 10. 什么是条件类型（conditional types）？什么是 `infer`？

```ts
type IsString<T> = T extends string ? true : false;
// 分配律：T 是裸类型参数时，联合类型会逐个分发
// IsString<string | number> = false | true = boolean

// infer：在条件类型中"提取"一个待推断的类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type A = ReturnType<() => string>; // string
```

**infer 用法要点**：
- 只能出现在 `extends` 条件类型中
- 可以有多个 infer（`T extends [infer A, infer B] ? ...`）
- 与递归结合可以处理嵌套结构

### 11. 什么是映射类型（mapped types）？什么是 `keyof`？

```ts
// keyof：取对象的键的联合类型
type Keys = keyof { name: string; age: number }; // "name" | "age"

// 映射类型：遍历键，生成新对象类型
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Partial<T> = {
  [K in keyof T]?: T[K];
};

// 键重映射（4.1+）
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

### 12. 什么是模板字符串类型（template literal types）？

```ts
type EventName = `on${Capitalize<string>}`;
// "onClick" | "onChange" | ...

type Path = `/${string}`;
const p: Path = "/api/user"; // OK

// 与条件类型/infer 组合做字符串解析
type ExtractId<S extends string> =
  S extends `${string}/id/${infer Id}` ? Id : never;
```

### 13. 什么是协变（covariance）与逆变（contravariance）？

- **协变**：`Dog` 是 `Animal` 子类，则 `Dog[]` 是 `Animal[]` 子类（数组、对象属性是协变）。
- **逆变**：函数参数方向相反。`strictFunctionTypes` 开启后，函数参数是**逆变**检查（参数可收窄不可放宽）。

```ts
interface Animal { name: string }
interface Dog extends Animal { bark(): void }

let animals: Animal[] = []; 
let dogs: Dog[] = [];
animals = dogs; // OK：数组协变

type Handler<T> = (arg: T) => void;
let hAnimal: Handler<Animal> = (a) => a.name;
let hDog: Handler<Dog> = (d) => d.bark();
// hAnimal = hDog; // 报错（strictFunctionTypes）：参数逆变
```

- 方法参数（method syntax）是**双变**（bivariant）的，不受 strictFunctionTypes 影响——这是为什么推荐用属性函数写法。

### 14. 什么是结构化类型系统（structural typing）？与名义类型（nominal typing）的区别？

- TS 是**结构类型**：只要形状兼容即可赋值，不要求声明来源相同。
- 这是 duck typing 的编译期实现。

```ts
interface Point { x: number; y: number }
function draw(p: Point) {}
draw({ x: 1, y: 2 });   // OK，哪怕不是 Point 实例
```

- 需要名义类型（防止结构相同但语义不同）时用 **brand** 技巧：

```ts
type USD = number & { __brand: "USD" };
type CNY = number & { __brand: "CNY" };

function toUSD(v: number): USD { return v as USD; }
function pay(money: USD) {}
// pay(100)  // 报错
// pay(toUSD(100)) // OK
```

### 15. 装饰器（decorators）怎么用？新标准有什么区别？

```ts
function Log(target: any, propertyKey: string) {
  const original = target[propertyKey];
  target[propertyKey] = function (...args: any[]) {
    console.log(`Call ${propertyKey}`, args);
    return original.apply(this, args);
  };
}

class User {
  @Log
  save() {}
}
```

- **旧标准（experimentalDecorators，TS 5.0 前）**：`experimentalDecorators: true`，装饰器按 `(target, key, descriptor)` 签名。
- **新标准（TS 5.0+，ES 装饰器）**：`decorators` 选项，按 `(value, context)` 签名，方法装饰器返回新函数，且**类型**上不再认为装饰器修改了签名。
- 现状：框架（NestJS 等）仍大量使用旧标准；新项目视运行时支持决定。

### 16. `declare` 关键字和 `.d.ts` 声明文件？

- `.d.ts`：仅含类型声明，无实现，编译时不产出 JS。
- `declare`：告诉编译器"这个变量/函数存在于运行时环境中"。

```ts
// global.d.ts
declare const API_BASE: string;
declare function trackEvent(name: string): void;
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
```

- 手写第三方库声明或为无类型库补类型时使用。

---

## 三、手写题（高频）

### 17. 手写 `Partial` / `Required` / `Readonly`

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
```

### 18. 手写 `Pick` / `Omit` / `Exclude`

```ts
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };

type MyExclude<T, U> = T extends U ? never : T;

type MyOmit<T, K extends keyof any> =
  Pick<T, Exclude<keyof T, K>>;
// 或 4.1+ 键重映射：
// type MyOmit<T, K extends keyof any> =
//   { [P in keyof T as P extends K ? never : P]: T[P] };
```

### 19. 手写 `ReturnType`

```ts
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;
```

### 20. 手写 `Parameters`

```ts
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;
```

### 21. 手写 `Awaited`（深度解包 Promise）

```ts
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;
```

### 22. 手写 `DeepReadonly`（递归只读）

```ts
type DeepReadonly<T> = T extends (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends Function
    ? T
    : { readonly [K in keyof T]: DeepReadonly<T[K]> };
```

### 23. 手写 `First` / `Last` / `Length`（元组工具）

```ts
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;
type Length<T extends readonly any[]> = T["length"];
```

### 24. 手写 `Promise.all` 的类型版本（元组映射）

```ts
declare function PromiseAll<T extends readonly unknown[]>(
  values: readonly [...T]
): Promise<{ -readonly [K in keyof T]: Awaited<T[K]> }>;
```

### 25. 手写 `Get<T, Path>`（按路径取深层属性）

```ts
type Get<T, P extends string> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? Get<T[K], Rest>
      : never
    : P extends keyof T
      ? T[P]
      : never;

type Data = { user: { profile: { name: string } } };
type N = Get<Data, "user.profile.name">; // string
```

---

## 四、工程化与原理

### 26. `tsconfig.json` 中 `strict` 包含哪些？

`strict: true` 包含（相互独立可单独关闭）：
- `strictNullChecks`：null/undefined 检查
- `strictFunctionTypes`：函数参数逆变
- `strictPropertyInitialization`：类属性必须初始化
- `strictBindCallApply`：bind/call/apply 类型检查
- `noImplicitAny`：禁止隐式 any
- `noImplicitThis`：禁止隐式 this
- `alwaysStrict`：产物流加上 "use strict"
- `useUnknownInCatchVariables`：catch 变量为 unknown

**答题要点**：说出其中 3-4 个即可，重点讲 `strictNullChecks` 与 `strictFunctionTypes`。

### 27. `tsc` 编译流程是怎样的？

1. 读取 `tsconfig.json`，解析配置与文件列表
2. **类型检查**（Type Checker）
3. **转译**（Transform）：TS 语法 → JS（类型被擦除）
4. 生成声明文件（若开 `declaration`）
5. 输出（含 sourcemap、watch 模式）

> 注意：TS 本身不打包，模块打包由 bundler（webpack/vite/tsup）完成。

### 28. `isolatedModules` 与 `verbatimModuleSyntax` 是什么？

- `isolatedModules`：保证单文件可被独立转译（如 Babel/esbuild 逐文件编译）。要求：`export type` 单独导出类型、`import type` 导入类型，禁止重新导出类型时省略 `type`。
- `verbatimModuleSyntax`（5.0 引入，更严格）：完全按源文件保留 import/export，不擦除不影响运行时的导入（要求开发者显式 `import type`）。
- 与 esbuild 等"单文件转译"工具配合，避免运行时导入不存在的类型。

### 29. 如何给第三方无类型库补类型？

1. 找 `@types/xxx`（DefinitelyTyped）
2. 没有则自己写 `.d.ts`：

```ts
declare module "legacy-lib" {
  export function foo(): void;
  export const version: string;
  const _default: { foo: typeof foo };
  export default _default;
}
```

3. 或用 `declare module "legacy-lib" { const x: any; export default x; }` 快速兜底

### 30. 泛型函数的推断在什么情况下会失败？

- 参数类型相互依赖但无法推导
- 默认类型参与推断（`<T = string>` 会优先推断）
- 嵌套泛型（如 `Promise<Promise<...>>`）需要 `Awaited`
- 函数参数位置导致无法推断（无参数引用泛型）
- 反例修复：提供显式类型参数、用约束收窄、拆解参数结构

### 31. 什么是 `satisfies` 操作符？（4.9+）

- 既**校验**值符合某个类型，又**保留**最具体的字面量类型（不拓宽）。

```ts
const config = {
  name: "app",
  port: 3000,
} satisfies Record<string, string | number>;

config.name; // string（保留，不是 string | number）
// 类型检查通过；若 port 误写成对象则报错
```

- 相比 `: Record<...>` 注解：不会拓宽属性类型。
- 相比直接不加注解：多了一层约束校验。

### 32. 装饰器 / 反射元数据（reflect-metadata）在框架中怎么工作？

- NestJS 依赖 `reflect-metadata`：装饰器把元数据写入 `design:type` / `design:paramtypes`，框架据此做依赖注入（DI）。
- 这依赖 **Experimental API**（emitDecoratorMetadata），与 esbuild 等工具存在兼容问题。

### 33. `ts-node` / `tsx` / Node 原生运行 TS 的区别？

| 方案 | 原理 | 适用 |
|---|---|---|
| `ts-node` | 内存中编译 + 钩子 | 老牌方案，配置多，较慢 |
| `tsx`（esbuild） | 用 esbuild 转译 | 快，开发调试常用 |
| Node 22.6+ 原生 type stripping | 直接剥离类型，不检查 | 无需类型检查的快速运行 |
| `node --experimental-transform-types` | Node 23+ 支持 enum/namespace 等 | 逐步原生化 |

### 34. 编译时类型检查 vs 运行时校验（如 zod/joi）的关系？

- **TS 类型检查**：编译期、静态、零运行时成本，但**运行时不存在**（类型被擦除）。
- **运行时校验**（zod 等）：数据进入系统边界（API 请求、表单、localStorage）时必须做，因为类型无法阻止外部数据不符合声明。

```ts
import { z } from "zod";
const UserSchema = z.object({ name: z.string(), age: z.number() });
// 类型与校验器二合一：z.infer<typeof UserSchema>
```

**答题要点**：安全边界思维——"类型是契约，校验是守门员"。

### 35. 为什么推荐 `import type`？什么时候必须用？

- 作用：让编译器/转译器知道该导入**仅用于类型**，编译后不会保留 import 语句。
- 必须场景：`isolatedModules` / `verbatimModuleSyntax` 开启，或导入的类型被 re-export 时。
- 好处：避免运行时错误（导入不存在的模块）、支持类型循环引用、利于 tree-shaking。

---

## 五、易错点与陷阱

### 36. 常见易错题

```ts
// 1. 数组字面量的推断
let arr = [];          // any[]（没有初始元素时）
arr.push(1);           // OK

// 2. readonly 数组不能赋值给可变数组
const ro: readonly number[] = [1, 2];
// const mutable: number[] = ro; // 报错
const mutable: number[] = [...ro]; // 正确姿势：拷贝

// 3. 可选属性 vs 可能为 undefined 的属性
interface A { x?: number }        // x 可能不存在
interface B { x: number | undefined } // x 必须存在，但可能是 undefined
// A 不能赋给 B：A 缺少必需属性 x

// 4. 索引签名
interface Dict { [k: string]: number }
const d: Dict = { a: 1 };
// d.a; // OK
// 但 Dict 的任意属性访问都被视为 number（可能 undefined，配合 noUncheckedIndexedAccess）

// 5. 空对象类型 {} 的特殊性
const x: {} = "anything"; // OK！{} 匹配所有非 null/undefined 类型
```

### 37. `exactOptionalPropertyTypes` 开启后的差异

```ts
interface Options { timeout?: number }

// 关闭时：两者等价
const a: Options = { timeout: undefined }; // OK

// 开启后：可选属性不能显式赋 undefined（除非类型写 number | undefined）
const b: Options = { timeout: undefined }; // 报错
```

### 38. 枚举（enum）的坑

- `const enum` 会被内联（isolatedModules 下有问题）。
- 数字枚举可以反向映射（`Enum[0] === "A"`），字符串枚举不行。
- 推荐替代：`as const` + 联合类型：

```ts
const Status = { Active: "active", Inactive: "inactive" } as const;
type Status = typeof Status[keyof typeof Status]; // "active" | "inactive"
```

### 39. 泛型工具函数返回值丢失类型

```ts
function first<T extends unknown[]>(arr: T): T[0] {
  return arr[0];
}
const f = first(["a", "b"]); // string（而不是 any）

// 对比易错写法：
function badFirst<T>(arr: T[]): T { return arr[0]; }
const bf = badFirst([1, "a"]); // number | string，丢精确性
```

### 40. 类中的 `private` 与 TS `#private` 字段

- TS `private`：编译期私有，运行时仍是普通属性（可被访问）。
- `#private`（ES 原生）：运行时真正私有，用 WeakMap 实现。
- TS 5.x 建议新代码用 `#`，或 `private` + `noPrivateIdentifier` 规则统一。

---

## 六、开放性问题

### 41. 你在项目中如何组织 TS 类型？（代码组织）

**回答框架**（展示工程化能力）：
1. 业务类型放 `src/types/` 或与模块同目录
2. API 响应类型从接口文档/OpenAPI 生成
3. 表单/DTO 用 zod 等运行时校验并 `z.infer` 出类型，避免手写两遍
4. 用 `import type` 区分类型导入；`verbatimModuleSyntax` 严格化
5. 共享类型提到 monorepo 的公共包
6. 类型复用优先内置工具类型 + 组合，避免类型体操过度设计

### 42. TS 性能优化你做过哪些？

- 避免 `any` 带来的宽泛类型传播（隐性 any）
- 大 union 类型拆小（检查器对 union 开销大）
- 避免过度递归类型（`type` 递归过深报"Type instantiation is excessively deep"）
- 使用 `@ts-expect-error` 代替 `@ts-ignore`（后者吞掉未来真正的错误）
- 增量构建：`incremental: true` / 项目引用（project references）
- 复杂库类型：开启 `skipLibCheck`

### 43. 你如何保证 TS 代码质量？（团队规范）

- `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`
- ESLint + `typescript-eslint`（推荐 `recommended-type-checked` 配置）
- CI 中跑 `tsc --noEmit` 作为门禁
- 提交前 lint-staged 检查

---

## 附：速记口诀

- **类型是结构化的**：形状兼容即可赋值
- **unknown 是安全的 any，never 是不可达**
- **函数参数逆变，返回值协变**
- **条件类型爱分配（裸类型参数），infer 只能活在 extends 里**
- **映射类型遍历 keyof，模板字符串类型拼出新世界**
- **类型在编译期消失，运行时校验交给 zod**
