# TypeScript 版本新特性速览（4.1 → 5.9）

> 汇总 TS 4.1 至 5.9 的核心新特性，按版本演进阅读，重点标注「高频使用」特性。
> 面试/复习时重点关注：4.1 模板字符串、4.7 infer extends、4.9 satisfies、5.0 const 类型参数与新装饰器、5.5 推断类型谓词。

---

## 一、4.1（2020.11）

### 1.1 模板字符串类型（Template Literal Types）⭐高频

```ts
type World = "world";
type Greeting = `hello ${World}`; // "hello world"

type EventName = `on${Capitalize<string>}`;
// "onClick" | "onChange" | ...

type VerticalAlignment = "top" | "middle" | "bottom";
type HorizontalAlignment = "left" | "center" | "right";
type Position = `${VerticalAlignment}-${HorizontalAlignment}`;
// "top-left" | "top-center" | ... 共 9 种组合
```

配套新增内置类型：`Uppercase<S>`、`Lowercase<S>`、`Capitalize<S>`、`Uncapitalize<S>`。

### 1.2 键重映射（Key Remapping）

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
type G = Getters<{ name: string }>; // { getName: () => string }
```

### 1.3 递归条件类型（Tail-recursion elimination）

条件类型支持递归，且 TS 会做**尾递归优化**，深层递归不再报"过深"错误。

```ts
type TrimLeft<S extends string> =
  S extends ` ${infer R}` ? TrimLeft<R> : S;
```

---

## 二、4.2（2021.02）

### 2.1 元组 rest 元素（Leading/Middle rest elements）⭐

```ts
type StringNumberBooleans = [string, ...number[], boolean];
// 开头、中间都可以放 rest 元素（此前只能在末尾）
```

### 2.2 更智能的类型别名保留

编辑器悬停/错误信息显示**别名名称**而不是展开的复杂类型，可读性大幅提升。

---

## 三、4.3（2021.05）

### 3.1 `override` 关键字 ⭐

```ts
class Base {
  greet() { return "hi"; }
}
class Derived extends Base {
  override greet() { return "yo"; } // 显式标记覆写
  // override err() {} // 报错：Base 没有 err
}
```

- `noImplicitOverride` 选项：强制所有覆写写 `override`。

### 3.2 静态索引签名 / `#private` 支持

```ts
class Foo {
  static #count = 0;          // 静态私有字段
  [prop: string]: string;     // 静态索引签名
}
```

### 3.3 `import` 断言（assert）雏形

```ts
import json from "./data.json" assert { type: "json" };
```

---

## 四、4.4（2021.08）

### 4.1 symbol 索引签名 / 抽象属性

```ts
interface A {
  [Symbol.iterator]: () => Iterator<number>;
}
abstract class C {
  abstract prop: string; // 抽象属性声明
}
```

### 4.2 可选属性与 unknown 保护

`catch` 变量在 `useUnknownInCatchVariables`（strict 默认开启）下为 `unknown`。

---

## 五、4.5（2021.11）

### 5.1 `Awaited` 类型 ⭐（深度解包 Promise）

```ts
type A = Awaited<Promise<string>>;              // string
type B = Awaited<Promise<Promise<number>>>;     // number
type C = Awaited<string | Promise<number>>;     // string | number
```

### 5.2 `type` 修饰符导入（import type）

```ts
import type { Options } from "./types"; // 仅类型导入
import { type Options, format } from "./lib"; // 混合导入
```

### 5.3 模板字符串类型推断增强

```ts
type Foo<T extends string> = `${T}_id`;
declare const x: Foo<"user">;
type T = Foo extends infer R ? R : never; // 可推断回 "user"
```

---

## 六、4.6（2022.02）

### 6.1 函数参数逆变默认开启（target ES2022+）

```ts
// --target es2022 起默认启用 strictFunctionTypes 的逆变检查
type Handler = (arg: { a: 1 }) => void;
```

### 6.2 参数展开（Variadic tuples）深度控制

```ts
type Union = ["a"] | ["b", "c"];
type T = [...Union]; // 数组展开联合
```

---

## 七、4.7（2022.05）

### 7.1 `infer extends` 语法 ⭐

在 `infer` 处直接加约束，且未匹配时可给默认值：

```ts
type First<T extends any[]> =
  T extends [infer F extends string, ...any[]] ? F : never;

// 有默认值版本
type Get<T, K extends string> =
  T extends { [P in K]: infer V extends string } ? V : "not-found";
```

### 7.2 实例化表达式（Instantiation Expressions）

```ts
function makeBox<T>(value: T) { return { value }; }
const makeStringBox = makeBox<string>; // 直接生成泛型实例化函数
```

### 7.3 ES Module 支持增强

```ts
// 模块解析支持 ESM 风格
import { createServer } from "node:http";
```

---

## 八、4.8（2022.08）

### 8.1 `infer` 约束改进 + 模板字符串推断

```ts
type SomeType = string | number;
type ExtractString<T> =
  T extends infer S extends string ? S : never;
```

### 8.2 严格模板字符串推断

```ts
function f<T extends string>(x: T) {}
const a = f("abc"); // T = "abc"（字面量保留）
```

### 8.3 `--build --watch` 与 ESM 提升

---

## 九、4.9（2022.11）

### 9.1 `satisfies` 操作符 ⭐⭐（本世纪最常用新特性之一）

既校验类型，又保留具体字面量类型：

```ts
type RGB = [number, number, number];

const palette = {
  red: [255, 0, 0],
  scale: (i: number) => i * 2,
} satisfies Record<string, RGB | ((i: number) => number)>;

palette.red;        // 类型是 [number, number, number]（未拓宽）
palette.scale(2);   // 可调用
```

对比：
- 用 `: Record<...>`：属性被拓宽成联合，丢失精确性
- 不写注解：没有校验

### 9.2 `unlisted property` 检查

对象字面量访问未声明属性直接报错（`noPropertyAccessFromIndexSignature`）。

### 9.3 生成器（Generator）返回值类型支持

```ts
function* g(): Generator<number, string, boolean> { ... }
```

---

## 十、5.0（2023.03）⭐里程碑版本

### 10.1 `const` 类型参数（const type parameters）⭐⭐

```ts
function tuple<const T extends readonly unknown[]>(...args: T): T {
  return args;
}
const t = tuple("a", 42, true);
// 类型为：readonly ["a", 42, true]（字面量保留，元组保持）
```

对比 4.x 需要 `as const`，现在泛型内部直接保持。

### 10.2 新标准装饰器（ECMAScript Decorators）⭐⭐

```ts
// 需 tsconfig：{ "decorators": true }（5.0+），替代 experimentalDecorators

function logged<This, Args extends any[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, Return>
) {
  return function (this: This, ...args: Args): Return {
    console.log(`${String(context.name)} called`);
    return originalMethod.call(this, ...args);
  };
}

class C {
  @logged
  m(arg: string) { return arg; }
}
```

新标准差异：
- 签名变为 `(value, context)`
- 类型更安全，装饰器可以改变签名类型
- `context` 提供 `name`、`kind`、`static`、`private`、`addInitializer`

### 10.3 支持 `export type *` 与 `--moduleResolution bundler` ⭐

```ts
export type * from "./types"; // 只导出类型
export * from "./values";     // 导出值
```

### 10.4 其他

- `--verbatimModuleSyntax`（替代 `importsNotUsedAsValues`）
- `--module esnext` 下支持 `import ... with { ... }`（import attributes 提案）
- `--customConditions`
- 声明文件可保留 `const enum`（`preserveConstEnums`）

---

## 十一、5.1（2023.06）

### 11.1 返回类型推断优化 ⭐

```ts
function fn() {
  return { a: 1, b: "x" }; // 不再出现循环引用报错
}
```

### 11.2 JSX 元素链访问

```ts
// 支持 jsx 中链式/可空访问的上下文推断
```

### 11.3 泛型默认值的相关改进

---

## 十二、5.2（2023.08）

### 12.1 `using` 声明（Explicit Resource Management）⭐⭐

配合 `Symbol.dispose` / `Symbol.asyncDispose` 自动释放资源：

```ts
// 需 lib: ["esnext.disposable"] 或 polyfill

function doWork() {
  using resource = acquireResource(); // 作用域结束时自动调用 [Symbol.dispose]()
  // ...
} // 自动释放，等价于 try/finally
```

### 12.2 装饰器与 `null` 的兼容性

### 12.3 其他修复与性能提升

---

## 十三、5.3（2023.11）

### 13.1 `import attributes` 正式支持 ⭐

```ts
import data from "./data.json" with { type: "json" };
// 替代早期实验性的 assert 语法
```

### 13.2 `--verbatimModuleSyntax` 细节完善

`import type` 与值导入完全按源码保留，避免运行时差异。

### 13.3 泛型实例化的性能优化

---

## 十四、5.4（2024.03）

### 14.1 `NoInfer` 工具类型 ⭐

禁止某位置参与泛型推断：

```ts
function create<T extends string>(name: T, fallback: NoInfer<T>) {}

// create("a", "b"); // 5.4 之前 T 会被推断为 "a" | "b"
// 现在 T 只由 name 推断
```

### 14.2 对象字面量的精确可选属性检查

`exactOptionalPropertyTypes` 与对象字面量的检查更严格一致。

### 14.3 `Array.prototype.at` 等新类型库支持

---

## 十五、5.5（2024.06）

### 15.1 推断类型谓词（Inferred Type Predicates）⭐⭐

不用写 `x is T`，直接推断：

```ts
function isNumberLike(x: unknown) {
  return typeof x === "number";
}
// 返回类型被自动推断为 x is number
```

### 15.2 常量索引访问（const index access）

```ts
const keys = ["a", "b"] as const;
type K = typeof keys[number]; // "a" | "b"（直接用变量索引）
```

### 15.3 控制流分析的性能大幅提升

单文件检查提速明显；`JSDoc @import` 标签支持。

---

## 十六、5.6（2024.09）

### 16.1 迭代器推断改进 / `--noCheck` 等

- 迭代器、生成器的类型推断更准确
- `--noCheck` 跳过类型检查（配合 esbuild 等工具）

---

## 十七、5.7（2024.11）

### 17.1 相对路径 JS 扩展名重写 ⭐

```ts
import "./util.js"; // 源文件写 .js，编译时自动映射到 .ts
```

TS 现在会**自动把相对导入路径重写为对应 JS 扩展名**，配合 Node 原生 ESM 类型剥离。

### 17.2 `--rewriteRelativeImportExtensions`

显式开启上面的路径重写。

### 17.3 其他

- 未初始化变量的检查增强
- 编译器启动速度优化（`tsc --version` 提速）

---

## 十八、5.8（2025.02）

### 18.1 返回表达式的细粒度检查 ⭐

`return` 中条件表达式**每个分支**分别与返回类型校验：

```ts
function getValue(key: string) {
  return cache.has(key) ? cache.get(key) : key;
  // 若 cache.get 返回 any 而 key 类型不符，会精确报错
}
```

### 18.2 `require()` 导入 ESM（--module nodenext）

Node 22 允许 CJS 用 `require()` 加载 ESM，TS 5.8 不再报错。

### 18.3 新选项

| 选项 | 作用 |
|---|---|
| `--module node18` | 稳定锁定 Node 18 解析模式 |
| `--erasableSyntaxOnly` | 配合 Node 原生 type stripping，禁止 enum/namespace 等运行时语法 |
| `--libReplacement` | 允许替换内置 lib 类型 |

### 18.4 行为变化

- `--module nodenext` 下 `import assert` 语法报错（改用 `with`）
- 声明文件保留计算属性名
- DOM 类型（lib.d.ts）更新

---

## 十九、5.9（2025.08）

### 19.1 精简的 `tsc --init` ⭐

生成的 `tsconfig.json` 默认启用：`strict`、`sourceMap`、`declaration`、`declarationMap`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`verbatimModuleSyntax`、`isolatedModules` 等，不再堆满注释。

### 19.2 `import defer`（延迟模块求值）⭐

```ts
import defer * as feature from "./feature.js";
// 访问导出成员时才执行模块副作用

console.log(feature.specialConstant); // 此时才真正求值
```

限制：仅命名空间导入；需 `--module preserve` / `esnext` + 运行时支持。

### 19.3 `--module node20`

稳定锁定 Node 20 行为（隐含 `--target es2023`）。

### 19.4 破坏性变更提醒

- `ArrayBuffer` 不再是所有 TypedArray 的超类型（`Uint8Array` 等需显式泛型参数或升级 `@types/node`）
- 泛型推断修复可能产生新错误（显式传类型参数解决）

---

## 二十、路线图：6.0 与 7.0

- **TS 6.0**：过渡版本，引入部分弃用设置，兼容 5.9 API。
- **TS 7.0**：基于 **原生移植（native port，Go 实现）**，编译速度大幅提升，已在 VS Code 预览（2025 起可用 nightly）。

---

## 附录：各版本一句话记忆

| 版本 | 一句话 |
|---|---|
| 4.1 | 模板字符串类型、键重映射 |
| 4.2 | 元组 rest 位置自由 |
| 4.3 | `override` 关键字 |
| 4.4 | symbol 索引签名 |
| 4.5 | `Awaited`、`import type` |
| 4.6 | 默认 target es2022 |
| 4.7 | `infer extends` |
| 4.8 | infer 约束加强 |
| 4.9 | `satisfies` |
| 5.0 | `const` 类型参数、新装饰器、bundler 解析 |
| 5.1 | 返回类型推断优化 |
| 5.2 | `using` 显式资源管理 |
| 5.3 | `import attributes` |
| 5.4 | `NoInfer` |
| 5.5 | 推断类型谓词 |
| 5.6 | 迭代器推断、`--noCheck` |
| 5.7 | 相对路径扩展名重写 |
| 5.8 | 细粒度返回检查、`erasableSyntaxOnly` |
| 5.9 | `import defer`、精简 init、node20 |
