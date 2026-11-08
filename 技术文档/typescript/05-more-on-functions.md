# 5. More on Functions（函数进阶）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「More on Functions」，https://www.typescriptlang.org/docs/handbook/2/functions.html ，© Microsoft；示例以 TS 5.x / `strict` 下验证，标注了预期输出与编译报错）
> 关联：`03-everyday-types.md`（object/void/unknown 基础）、`04-narrowing.md`（类型谓词与收窄）、`06-classes.md`（类方法签名与 this）、`08-creating-types-from-types.md`（Parameters/ReturnType/infer）、`12-typescript-advanced-type-system.md`（函数参数逆变）、`09-decorators.md`（方法装饰器）；Nest 控制器/Provider 的方法签名见 `/Users/hh/offer/技术文档/nest/01-fundamentals`。

## 1. 函数类型表达式（Function Type Expressions）

函数在 TS 里是一等公民：函数本身也可以有类型。最基础的形式是**函数类型表达式**——用箭头语法描述"什么样的函数"。

```ts
// fn-type.ts
function greeter(fn: (a: string) => void) {
  fn("hello world"); // 调用方式与普通函数一致
}

function printToConsole(s: string) {
  console.log(s.toUpperCase());
}

greeter(printToConsole); // 输出：HELLO WORLD
```

- 语法 `(a: string) => void`：参数列表 + `=>` + 返回类型。**参数名必须写**，但它只是文档作用（编译后不存在）。
- 常配合 type alias 复用：

```ts
type GreetFunction = (a: string) => void;
function greeter2(fn: GreetFunction) {}
```

要点与坑：

1. **参数按位置匹配，不按名字匹配**：调用方传 `(s: string) => void`、`(name: string) => void` 都能赋给 `(a: string) => void`——参数名不影响兼容性，只是可读性。
2. 返回类型 `void` 表示"返回值没用"（第 9 节详述其特殊性），而不是"必须不返回"。
3. 与其他语言对比：Java 用函数式接口（`Function<String, Void>`）、C# 用委托（`Action<string>`），TS 直接把函数类型内建进类型系统，无包装类型。

## 2. 调用签名与构造签名（Call / Construct Signatures）

JS 里函数是**有调用签名的对象**——可以在函数上挂属性。要描述"可调用且有属性"的类型，用**调用签名**（call signature）写在对象类型字面量里。

### 2.1 调用签名

```ts
// call-signature.ts
type DescribableFunction = {
  description: string;
  (someArg: number): boolean; // ← 调用签名：属性列表里的"匿名方法"
};

function doSomething(fn: DescribableFunction) {
  console.log(fn.description + " returned " + fn(6));
}

// 构造一个带属性的函数：先创建函数，再挂属性
const myFn: DescribableFunction = Object.assign(
  (n: number) => n > 3, // 函数部分
  { description: "判断是否大于 3" }, // 属性部分
);

doSomething(myFn); // 输出：判断是否大于 3 returned true
```

- 调用签名的参数名**不能省**（`(someArg: number): boolean`），这点与函数类型表达式不同——表达式里也可以写参数名，但签名里必须写。
- 典型场景：React 的 `FunctionComponent`（可调用 + `propTypes` 等属性）、带元信息的校验函数。

### 2.2 构造签名

描述"可以被 `new` 的东西"用**构造签名**（construct signature），即 `new` 开头：

```ts
// construct-signature.ts
type SomeConstructor = {
  new (s: string): Date; // ← 构造签名：new ctor(s) 返回 Date
};

function factory(ctor: SomeConstructor, s: string) {
  return new ctor(s);
}

const d = factory(Date, "2026-01-01");
console.log(d instanceof Date); // true
```

一个类型可以**同时**有调用签名与构造签名（既可 `new` 又可直接调用）：

```ts
// both-signatures.ts
interface CallOrConstruct {
  new (s: string): Date;  // new Date("2026-01-01")
  (n?: number): number;   // Date.now()
}

declare const DateLike: CallOrConstruct;
new DateLike("2026-01-01"); // Date 实例
DateLike();                 // number（时间戳）
```

- 官方手法的对应关系：`new (s: string) => Date` 只能出现在对象类型的属性里，等价写法 `{ new (s: string): Date }`。
- 抽象类的构造签名要用 `abstract new`（见 06-classes.md 第 9 节）。

## 3. 上下文类型推断（Contextual Typing）

给函数传**函数表达式**时，TS 会用目标位置的类型（上下文类型）反推回调的参数类型——回调参数**不用手写标注**。

```ts
// contextual.ts
const names = ["Alice", "Bob", "Eve"];

// forEach 的回调签名是 (value: string, index: number, array: string[]) => void
names.forEach((s, i) => {
  console.log(`${i}: ${s}`); // s 自动推断为 string，i 为 number
});
// 输出：0: Alice / 1: Bob / 2: Eve
```

反过来，**先声明函数再传参**就没有上下文了，参数会隐式 `any`：

```ts
// ❌ 脱离调用上下文，推断不到
const cb = (s) => s.toUpperCase(); // TS7006: Parameter 's' implicitly has an 'any' type.

// ✅ 修法一：手动标注
const cb2 = (s: string) => s.toUpperCase();

// ✅ 修法二：直接把函数表达式写在调用处（让上下文生效）
names.forEach((s) => console.log(s.toUpperCase()));
```

回调参数**只能少写、不能多写**（多余的没有对应位置）：

```ts
names.forEach((s) => console.log(s));        // OK：只用 value
names.forEach((s, i) => console.log(i, s));  // OK：用到 value + index
// names.forEach((s, i, arr, extra) => {});  // ❌ TS2345：Expected 3 arguments, but got 4.
```

> 这条规则是 JS"函数参数天然可省"的类型化版本：**赋值兼容时源函数的参数必须更少或一样多**（协变/逆变规则见 12 篇第二章）。EventEmitter 的 `(err, data) => ...`、RxJS 的 `subscribe((v) => ...)` 都靠它。

## 4. 可选、默认与剩余参数

### 4.1 可选参数 `?`

```ts
// optional.ts
function f(x: number, y?: number): number {
  // y 的类型是 number | undefined
  return x + (y ?? 0);
}

console.log(f(1));    // 1
console.log(f(1, 2)); // 3
```

- 声明 `y?: number` 后，`y` 的实际类型是 `number | undefined`——体内直接 `x + y` 会报 `TS18048: 'y' is possibly 'undefined'`，必须先收窄（见 04-narrowing.md）。
- 可选参数必须**在必填参数之后**：

```ts
// function bad(x?: number, y: number) {}
// ❌ TS1016: A required parameter cannot follow an optional parameter.
```

### 4.2 默认参数

```ts
// default-param.ts
function greet(name: string = "world"): string {
  return `hello ${name}`;
}

console.log(greet());          // hello world
console.log(greet("TS"));      // hello TS
console.log(greet(undefined)); // hello world（显式传 undefined 也走默认值）
// greet(null);                // ❌ TS2345：null 不能赋给 string | undefined
```

- 默认值让参数**自动变可选**，类型从默认值表达式推断（`= "world"` 推断为 `string`），也可显式标注。
- `= 10` 之类默认值与 `?` 的区别：`?` 分支里是 `number | undefined`，默认值分支里直接是 `number`（收窄过了）。
- 默认参数也能放前面，但调用必须用 `undefined` 占位，可读性差，不推荐。

### 4.3 剩余参数（rest）与元组 rest

```ts
// rest.ts
function multiply(n: number, ...m: number[]): number {
  return m.reduce((acc, v) => acc * v, n);
}
console.log(multiply(2, 3, 4)); // 24
```

rest 参数是**数组类型**。当参数个数与逐位类型都固定时，用**元组类型**精确约束：

```ts
// tuple-rest.ts
function many(...args: [string, number, boolean]): void {
  console.log(args[0], args[1], args[2]);
}

many("a", 1, true); // a 1 true
// many("a", 1);    // ❌ TS2554: Expected 3 arguments, but got 2.
```

元组 rest 还能配合泛型做"保留实参元组"的工具（常见于 bind/pipe 实现）：

```ts
// generic-rest.ts
function callWith<T extends unknown[], R>(fn: (...args: T) => R, ...args: T): R {
  return fn(...args);
}

console.log(callWith((a: number, b: number) => a + b, 1, 2)); // 3
```

三种 rest 写法对比：

| 写法 | args 类型 | 精度 |
|---|---|---|
| `...args: any[]` | any[] | 无检查，最宽松 |
| `...args: unknown[]` | unknown[] | 每位是 unknown，需收窄 |
| `...args: [string, number]` | [string, number] | 逐位精确，个数固定 |

## 5. 参数解构（Destructuring）

参数解构的模式后面直接写类型注解：

```ts
// destructure.ts
type SumInput = { a: number; b: number; c: number };

function sum({ a, b, c }: SumInput): number {
  return a + b + c;
}
console.log(sum({ a: 1, b: 2, c: 3 })); // 6
```

与默认值、剩余属性组合：

```ts
// destructure-rest.ts
function handle({ id, name = "anon", ...rest }: { id: number; name?: string; age: number }) {
  console.log(id, name, rest); // rest 被推断为 { age: number }
}
handle({ id: 1, age: 20 }); // 1 "anon" { age: 20 }
```

要点：

1. 内联写 `{ a, b, c }: { a: number; b: number; c: number }` 合法但可读性差——官方建议**给类型起名**（type alias），调用方也能复用。
2. 解构 + 默认值的类型推断：`{ name = "anon" }: { name?: string }` 中 `name` 是 `string`（默认值兜底）。
3. Nest 的 `@Body() dto: CreateUserDto` 本质就是"装饰器 + 普通参数类型注解"，DTO 类型即这里的 `SumInput` 角色（见 `/Users/hh/offer/技术文档/nest/01-fundamentals`）。

## 6. 函数重载（Overloads）

JS 的一个函数常按**入参形态**返回不同结果。TS 用"重载签名（对外可见）+ 一个实现签名（对外不可见）"表达。

### 6.1 完整写法

```ts
// overload.ts
// ① 重载签名（可以有多个，对外可见、可调用）
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;

// ② 实现签名（必须兼容所有重载；对外不可见、不能直接调用）
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) {
    return new Date(y, mOrTimestamp, d); // m 是月份（0 起）
  }
  return new Date(mOrTimestamp);
}

const d1 = makeDate(1234567);     // OK → 命中第 1 个签名
const d2 = makeDate(2026, 10, 8); // OK → 命中第 2 个签名
// makeDate(2026, 10);
// ❌ 报错：No overload expects 2 arguments, but overloads do exist that expect either 1 or 3 arguments.
```

规则清单：

1. **实现签名对外不可见**：调用方只能匹配重载签名。即使 `makeDate(1, 2)` 在实现签名 `(number, number?, number?)` 下"看起来合法"，也会报错——这是重载设计的核心。
2. **重载解析自上而下**：按声明顺序找到**第一个**能匹配的签名即止。两个签名有重叠时，把**更具体的放前面**，否则宽签名会把窄签名永久遮蔽：

```ts
// overload-order.ts
function g(x: unknown): void; // 宽签名在前
function g(x: string): void;  // 永远匹配不到——x: string 也是 unknown，第一个就命中了
function g(x: unknown): void {}
```

3. **实现签名必须兼容所有重载**：参数要么更少（其余用 `?` / rest 兜住），返回类型必须能覆盖每个重载的返回类型：

```ts
// overload-incompatible.ts
function fn(x: string): void;
function fn(x: number): void;
function fn(x: boolean): void {} // ❌ TS2394: Overload signature is not compatible with function implementation.
```

4. **实现体内只能看到实现签名的类型**：`makeDate` 体内没有"timestamp"这个概念，只有 `mOrTimestamp`——分支逻辑要自己写。

### 6.2 官方建议：能不用重载就不用

重载最容易被滥用的场景是"参数是几种类型之一"。此时**联合类型 + 收窄**（见 04 篇）更简单，而且**调用方传联合类型的值也能工作**：

```ts
// overload-avoid.ts（官方示例改写）
function len(s: string): number;
function len(arr: any[]): number;
function len(x: any): number {
  return x.length;
}

len("");  // OK
len([0]); // OK
// len(Math.random() > 0.5 ? "" : [0]);
// ❌ 报错：参数类型是 string | any[]，与任何一个单独的重载都对不上
```

改成联合类型参数后，同样能力的函数接受联合值毫无问题：

```ts
function len2(x: string | any[]): number {
  return x.length; // 两种类型都有 length，无需分支甚至无需重载
}
console.log(len2("abc"));      // 3
console.log(len2([1, 2, 3]));  // 3
```

**重载的正当使用时机**：返回类型随参数形态**质变**（不只是联合）时。典型如 DOM 的 `document.createElement("div")` → `HTMLDivElement`、`createElement("canvas")` → `HTMLCanvasElement`——每个标签返回不同子类型，联合类型表达不了这种映射。

> 官方总结：优先可选参数 → 其次联合类型 → 最后才是重载；重载数量越少越好。

## 7. this 参数与 noImplicitThis

JS 的 `this` 动态绑定，TS 用 **this 参数**（参数列表第一位，纯类型层面，运行时不存在）声明它应是什么：

```ts
// this-param.ts
interface User {
  name: string;
  greet(this: User): void; // this 参数：占首位但不占实参位置
}

const u: User = {
  name: "Alice",
  greet() {
    console.log(`Hi ${this.name}`); // this 被约束为 User
  },
};

u.greet(); // Hi Alice

// 经典坑：把方法从对象上"摘下来"，this 就断了
const detached = u.greet;
// detached();
// ❌ TS2684: The 'this' context of type 'undefined' is not assignable to method's 'this' of type 'User'.
```

- 类方法里 `this` 自动推断为类实例类型，无需手写 `this: User`（类相关见 06 篇）。
- **`this: void`** 表示"该方法不使用 this"，用于约束回调（官方 UIElement 例子）：

```ts
// this-void.ts
interface UIElement {
  addClickListener(onclick: (this: void, e: Event) => void): void;
}

class Handler {
  info = "";
  // onClickBad(this: Handler, e: Event) { this.info = e.message; } // 依赖 this
  onClickGood = (e: Event) => { // ✅ 箭头函数：词法 this，与 this: void 兼容
    console.log("clicked");
  };
}

declare const ui: UIElement;
const h = new Handler();
ui.addClickListener(h.onClickGood); // OK
// ui.addClickListener(h.onClickBad); // ❌ this: Handler 不能赋给 this: void
```

- **noImplicitThis**（strict 含此项）：对象字面量方法里 `this` 按容器类型推断，推断不出（如独立函数里裸用 `this`）直接报 `TS2683: 'this' implicitly has type 'any'`。
- 回调丢 this 的万能解法是**箭头函数**（捕获外层 this）或 `bind`（strictBindCallApply 严格检查 bind 的类型）。

## 8. 泛型函数深入

泛型把"输入与输出的类型关联"表达出来。判断要不要泛型的标准：**类型关联是否贯穿输入→输出**；只出现一次的类型参数没有任何意义。

### 8.1 基础与推断

```ts
// generic-basic.ts
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}
const s = firstElement(["a", "b"]); // string | undefined（T 推断为 string）
const n = firstElement([1, 2]);     // number | undefined

// 官方 map 例子：Input → Output 的关联
function map<Input, Output>(arr: Input[], func: (arg: Input) => Output): Output[] {
  return arr.map(func);
}
const parsed = map(["1", "2", "3"], (n) => parseInt(n)); // number[]（回调参数 n 被上下文推断为 string）
```

### 8.2 约束：`extends`

不带约束的 `T` 只能当"未知类型"，不能访问任何成员。用 `extends` 声明**最小要求**：

```ts
// constraint.ts
function longest<Type extends { length: number }>(a: Type, b: Type): Type {
  return a.length >= b.length ? a : b;
}

const longerArray = longest([1, 2], [1, 2, 3]); // number[]
const longerString = longest("alice", "bob");   // "alice" | "bob"（保留字面量精度！）
// const notOK = longest(10, 100);
// ❌ TS2345: Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.
```

**约束下的实现陷阱**（官方例子）：约束只保证"至少有 length"，实现里不能伪造一个"恰好只有 length"的对象：

```ts
// constrained-value.ts
function minimumLength<Type extends { length: number }>(obj: Type, minimum: number): Type {
  if (obj.length >= minimum) return obj;
  // return { length: minimum };
  // ❌ TS2322: '{ length: number; }' is not assignable to type 'Type'.
  //    Type 可能是 string、数组……它们不是 { length } 对象字面量
  throw new Error("too short"); // ✅ 正确做法：别伪造，走异常/返回原值
}
```

### 8.3 推断冲突时显式指定类型参数

```ts
// explicit-type-args.ts
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2);
}

// const arr = combine([1, 2, 3], ["hello"]);
// ❌ TS2322：两个实参把 Type 分别推断为 number 和 string，冲突
const arr = combine<string | number>([1, 2, 3], ["hello"]); // ✅ 显式指定
console.log(arr); // [1, 2, 3, "hello"]
```

### 8.4 多类型参数与默认类型参数

```ts
// default-type-param.ts
interface ApiResponse<T = unknown> { // T 有默认值
  code: number;
  data: T;
}

const r1: ApiResponse = { code: 0, data: null };      // data: unknown
const r2: ApiResponse<string> = { code: 0, data: "ok" }; // data: string
```

- 多类型参数按声明顺序从实参推断；前面的推断不出会"污染"后面的推断。
- 默认类型参数 `<T = unknown>` 在"不想每次都写尖括号"的公共类型上很常用（Nest 的 `HttpException<T = any>` 同思路）。

### 8.5 推断实战：返回 any 的对比（官方 firstElement1/2）

```ts
// infer-quality.ts
// ✅ 好：类型参数"压"在参数上，T 从实参一路流到返回值
function firstElement1<Type>(arr: Type[]) {
  return arr[0]; // Type | undefined
}

// ❌ 差：把约束放在 Type 上，arr[0] 的类型是索引访问的结果，约束帮不了推断
function firstElement2<Type extends any[]>(arr: Type) {
  return arr[0]; // any ← 精度全丢
}
```

官方泛型推断三条经验：

1. **把类型参数往下压**：尽量让 `T` 出现在参数位置而不是约束里，让推断链完整。
2. **类型参数越少越好**：`filter<T>(arr: T[], fn: (arg: T) => boolean)` 好于 `filter<T, F extends (arg: T) => boolean>`——后者只是给"函数类型"起了个名，反而限制调用方。
3. **能用类型参数本身就不必加约束**。

### 8.6 约束不到时的解法：`extends keyof`

场景：按 key 取对象属性。无关联约束时只能拿到 unknown：

```ts
// keyof-constraint.ts
function getUnsafe(obj: Record<string, unknown>, key: string): unknown {
  return obj[key]; // unknown：key 与 obj 的键无关联
}

// ✅ K extends keyof T 把"key 必须是 obj 的键"写进类型系统
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // 精确返回 T[K]
}

const user = { name: "Alice", age: 18 };
get(user, "age");    // number（返回类型随 key 收窄）
get(user, "name");   // string
// get(user, "email"); // ❌ TS2345：'email' 不能赋给 '"name" | "age"'
```

这是全 TS 生态最重要的泛型模式之一：`Pick/Omit` 的实现、Nest 的 `Reflector.get(key, target)`、`ConfigService.get<K extends keyof T>` 全是它的变体（映射类型展开见 08 篇第三章）。

## 9. void 返回类型的特殊性

### 9.1 void 是"返回值没用"，不是"必须不返回"

```ts
// void.ts
type VoidFunc = () => void;

const f1: VoidFunc = () => true; // ✅ 返回 boolean 也行——返回值被类型系统忽略
const f2: VoidFunc = function () {
  return 42; // ✅ 同上
};

const r = f1();
console.log(r);       // 运行时打印 true
const check: void = r; // 类型层面 r 是 void —— 调用方在类型上"拿不到"返回值
```

### 9.2 官方特意放行的规则

**目标签名返回 void 时，允许赋给它任何返回类型的函数**——这是上下文类型系统的刻意设计，为了支持这类代码：

```ts
// void-context.ts
const names = ["a", "b", "c"];

// forEach 期望 (value: string, index: number, array: string[]) => void
names.forEach((s) => s.length); // ✅ 回调返回 number 没问题，值直接被丢弃

const lengths = names.map((s) => s.length); // 想要返回值就用 map → number[]
console.log(lengths); // [1, 1, 1]
```

若没有这条规则，`arr.forEach(console.log)`、`[1].map((n) => cache.set(n, n))` 这类常见写法全部报错。

边界提醒：

1. 上面是**赋值方向**的宽松（源 → 目标 void）；反过来 `let v: void = 42` 仍报错。
2. `() => void` **不能**赋给 `() => undefined`（undefined 是更严格的返回类型）；`() => undefined` 可以赋给 `() => void`。
3. `Promise<void>` 与 `Promise<undefined>` 同理不等价；异步回调常因此报错，用 `async` 函数（自动包 Promise<void>）即可。

## 10. never 返回类型

`never` 表示函数**永不正常返回**：要么抛异常，要么死循环。

```ts
// never-return.ts
function fail(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {} // 无 break/return 的死循环
}
```

两大作用：

**① 控制流"阻断"**：调用返回 never 的函数后，TS 认为后面的代码不可达，联合的剩余可能被"扔掉"——最典型是穷尽性检查兜底（与 04 篇第 9 节呼应）：

```ts
// exhaustive.ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number };

function assertNever(x: never): never {
  throw new Error("Unexpected object: " + JSON.stringify(x));
}

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.size ** 2;
    default:
      return assertNever(shape); // 若 Shape 未来加 kind，此处编译报错：参数不是 never
  }
}
console.log(area({ kind: "circle", radius: 1 })); // 3.141592653589793
```

**② 收窄的终点**：联合被逐个排除到空时类型变 never（`"a" | "b"` 排除两者后），`if (x) ...` 分支里出现 never 就意味着"逻辑上不该到这"。

void 与 never 的区别（高频面试题）：

| | void | never |
|---|---|---|
| 含义 | 正常返回，返回值无意义 | 永不返回（抛错/死循环） |
| 赋给其他类型 | 只能赋给 void/unknown | 可赋给**一切**类型（底类型） |
| 谁能赋给它 | 任何返回值都行 | 只有 never 自己 |
| 典型位置 | 回调/无返回值函数 | 抛错函数、穷尽检查、收窄终点 |

坑：标注了 `: never` 的函数体内若存在"正常走完"的路径，报 `TS2366: Function lacks ending return statement and return type does not include 'undefined'`。

## 11. 要点速查

| 特性 | 写法 | 关键点 |
|---|---|---|
| 函数类型 | `(a: string) => void` | 参数名仅文档作用 |
| 调用签名 | `{ desc: string; (n: number): boolean }` | 可调用对象 + 属性 |
| 构造签名 | `{ new (s: string): Date }` | 可 new 的类型 |
| 上下文推断 | 回调写在调用处自动推 | 先声明再传会隐式 any |
| 可选 | `(y?: number)` | 类型实为 `number \| undefined` |
| 默认 | `(x: T = v)` | 自动可选 + 收窄 |
| rest | `(...args: T[])` | 元组 rest 可逐位约束 |
| 重载 | N 个签名 + 1 个实现 | 实现签名不可见，解析自上而下 |
| this | `fn(this: User)` | 运行时不存在；`this: void` 禁 this |
| 泛型 | `<T extends C>` | `extends keyof` 关联键与值 |
| void | 回调可返回值被忽略 | 官方特意放行 |
| never | 抛错/死循环 | 穷尽检查兜底 |

> 跨语言对比：Java 的方法重载是**编译期多态**（多个真实方法并存），TS 的重载是**纯类型层**多态——编译后只剩一个实现函数；C# 的 `params` 对应 rest 参数；Go 无重载、用多返回值模拟。TS 泛型与 Java 泛型同为**擦除式**，但 TS 的推断（contextual inference）强得多。

## 12. 常见坑汇总

1. 回调先声明再传入，参数失去上下文变隐式 any——函数表达式直接写在调用处（第 3 节）。
2. 可选参数体内直接用，`TS18048 possibly undefined`——用 `??`、提前 return 收窄（第 4.1 节）。
3. 必填参数跟在可选参数后面，`TS1016`（第 4.1 节）。
4. 重载中间形态调用不了：`makeDate(2026, 10)` 无匹配重载——缺的重载要么补签名要么改 API（第 6.1 节）。
5. 宽重载签名在前遮蔽窄签名，后者永远匹配不到（第 6.1 节）。
6. 实现签名与某个重载不兼容：`TS2394`（第 6.1 节）。
7. "参数是几种类型之一"用重载导致联合值传不进去——改联合类型参数（第 6.2 节）。
8. 从对象上摘下方法再调用，this 断裂：`TS2684`——用箭头函数或 bind（第 7 节）。
9. 泛型约束写在类型参数上而非参数上，推断降级为 any（firstElement2，第 8.5 节）。
10. 约束内伪造"只有约束成员"的对象：`TS2322`——Type 可能还有其他成员（第 8.2 节）。
11. 拿 void 函数的返回值：类型上是 void，运行时虽有值但属于未定义契约（第 9 节）。
12. `: never` 函数有可达的隐式结束路径：`TS2366`（第 10 节）。

## 13. 衔接

- `void`/`unknown`/`object` 等基础类型见 `03-everyday-types.md`；null/undefined 与可选参数的组合也在该篇。
- 类型谓词（`x is T`）与重载配合、收窄在函数体里的行为见 `04-narrowing.md`。
- 类方法签名、`this is X` 守卫、`noImplicitThis` 在类里的表现见 `06-classes.md`。
- `Parameters<T>`/`ReturnType<T>`/`infer` 如何"反射"函数类型见 `08-creating-types-from-types.md`；函数参数逆变/协变见 `12-typescript-advanced-type-system.md` 第二章。
- TS 5.x 函数相关新特性（如装饰器对方法签名的改写）见 `09-decorators.md` 与 `15-typescript-new-features.md`。
- Nest 控制器/Provider 方法签名、`@Body()`/`@Param()` 参数装饰器见 `/Users/hh/offer/技术文档/nest/01-fundamentals` 与 `/Users/hh/offer/技术文档/nest/decorator-summary.md`。

## 14. 一句话总结

> 函数进阶的骨架是"**类型关联**"四个字：函数类型表达式与调用/构造签名描述"什么样的函数"，上下文推断把标注成本降到零，重载与泛型把"入参形态 → 出参类型"的映射写进类型系统——但官方的优先级始终是可选参数 → 联合类型 → 重载；`void` 特意放行"回调返回值被忽略"，`never` 把"永不返回"变成穷尽检查的兜底，而 `K extends keyof T` 是把键与值关联起来的万能钥匙。
