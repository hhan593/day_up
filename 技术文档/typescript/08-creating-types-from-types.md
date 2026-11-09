# 8. Creating Types from Types（从类型构造类型）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「Creating Types from Types」：Keyof / Lookup / Conditional / Mapped / Template Literal Types 各章，https://www.typescriptlang.org/docs/handbook/2/types-from-types.html 及分章，© Microsoft；工具类型实现对照 `lib.es5.d.ts`；示例以 TS 5.x 下验证，标注了预期结果与编译报错）
> 关联：`05-more-on-functions.md`（`K extends keyof T` 的函数形态）、`07-enums.md`（`as const satisfies` + `typeof[keyof]` 提取）、`12-typescript-advanced-type-system.md`（分配律/逆变等底层规则，与本文互补：那篇偏原理，本文偏构造手法）、`15-typescript-new-features.md`（`satisfies`、const 类型参数）；Nest 拦截器/`Reflector` 的泛型反射见 `/Users/hh/offer/技术文档/nest/decorator-summary.md`。

## 1. keyof 类型运算符

`keyof T` 取对象类型所有键的**联合**：

```ts
// keyof-basic.ts
type Point = { x: number; y: number };
type P = keyof Point; // "x" | "y"

const key: P = "x";
// const bad: P = "z"; // ❌ TS2322：'"z"' 不能赋给 '"x" | "y"'
```

不同输入类型上 `keyof` 的行为：

| 输入 | keyof 结果 |
|---|---|
| 普通对象 | 键字面量联合 |
| 数组 `T[]` | `"length" \| "push" \| ...`（Array 的所有键） |
| 元组 `[string, number]` | `number` 之外还有 `"0" \| "1" \| "length"` 等 |
| 联合类型 | **共同键的交集**：`keyof ({a: 1} \| {b: 2})` = never |
| `{}` / unknown | never |
| number 等 | never（原始类型无键） |

两个高频应用：

```ts
// keyof-union.ts
// ① keyof 联合 = 交集（只能安全访问所有成员都有的键）
type A = keyof ({ a: 1; b: 2 } | { a: 9; c: 3 }); // "a"
// 想要"所有键"要用分配技巧：
type KeysOfUnion<T> = T extends any ? keyof T : never;
type B = KeysOfUnion<{ a: 1; b: 2 } | { a: 9; c: 3 }>; // "a" | "b" | "c"

// ② 与 typeof 组合：从"值"拿"键"
const settings = { theme: "dark", lang: "zh" } as const;
type SettingKey = keyof typeof settings; // "theme" | "lang"
```

## 2. typeof 类型运算符（类型查询）

**类型上下文里的 `typeof`**（与 JS 运行时 `typeof` 表达式同名不同物）把"变量/函数的形状"变成类型：

```ts
// typeof-basic.ts
const person = { name: "Alice", age: 18 };
type Person = typeof person; // { name: string; age: number }

function greet(n: string) { return `hi ${n}`; }
type Greet = typeof greet; // (n: string) => string

// 模块整体形状
type Utils = typeof import("./utils"); // 该模块所有导出的类型合集
```

- `typeof` 只能作用于**标识符或其属性链**（变量、函数、`import()`），不能作用于任意表达式（`typeof f()` ❌）。
- 返回的是**声明类型**而非窄化后的类型：`let x: string | number` 上 `typeof x` 得 `string | number`，与 04 篇的运行时收窄无关。
- `typeof import("./path")` 拿模块命名空间类型，常配合 `await import()` 动态加载（见 10-modules.md）。
- 与 `as const` 组合是"从值造类型"的黄金搭档（07 篇第 8 节的三方案）。

## 3. 索引访问类型（Indexed Access Types）`T[K]`

```ts
// lookup.ts
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];        // number
type I1 = Person["age" | "name"]; // number | string（联合索引 → 联合值类型）
type Keys = keyof Person;         // "age" | "name" | "alive"
type I2 = Person[Keys];           // number | string | boolean

type Len = number[]["length"];    // number
type TupleLen = [string, number]["length"]; // 2（元组 length 是字面量！）
```

- `T[K]` 中 K 不存在会报错：`TS2339: Property 'x' does not exist on type...`（类型层）。含 `noUncheckedIndexedAccess` 时注意：这只影响**变量索引**的类型，类型层 `T["k"]` 不受影响。
- **与泛型组合成"类型安全取值"**（05 篇 8.6 的类型层版本）：

```ts
// get-prop.ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // 返回类型随 key 收窄
}
const p = { name: "Alice", age: 18 };
console.log(getProp(p, "age")); // 18（返回 number）
```

- `T[K]` 也支持 `T["a" | "b"]`、`T[keyof T]`；`Record<string, unknown>[string]` → unknown。
- 数组/元组的 `number` 索引：`string[][number]` → string；配合条件类型 `T[number]` 可"抽出数组元素类型"（第 4 节）。

## 4. 条件类型（Conditional Types）

### 4.1 基本形态与嵌套

语法形态：`SomeType extends OtherType ? TrueType : FalseType`——类型层的 if。基础用法与嵌套（多分支模式匹配，官方 Unpacked 风格）：

```ts
// conditional.ts
type NameOrId<T extends number | string> =
  T extends number ? { id: number } : { name: string };
type T1 = NameOrId<number>;  // { id: number }
type T2 = NameOrId<string>;  // { name: string }

// 嵌套：多分支模式匹配（官方 Unpacked 风格）
type Unpacked<T> =
  T extends (infer U)[]            ? U :        // 数组 → 元素
  T extends (...args: any[]) => infer R ? R :    // 函数 → 返回值
  T extends Promise<infer U>      ? U :         // Promise → 解包
  T;
type A = Unpacked<string[]>;      // string
type B = Unpacked<() => number>;  // number
type C = Unpacked<Promise<boolean>>; // boolean
type D = Unpacked<Date>;          // Date（都不匹配，原样返回）
```

- 条件类型是**懒求值**的（deferred）：`T` 未定时不立即计算。
- 常配合约束做"守门"：`type MessageOf<T extends { message: unknown }> = T["message"]`——直接约束，不满足就报错；若想"不满足则返回 never"再改为条件写法（官方两种风格的对比）。

### 4.2 联合的分布式展开（分配律）与两个名坑

**裸类型参数**（`T extends U ? X : Y` 中未被包裹的 `T`）遇到联合类型会**逐成员分发**：

```ts
// distributive.ts
type ToArray<Type> = Type extends any ? Type[] : never;
type S = ToArray<string | number>; // string[] | number[]（分发后联合）

// 用 [] 包裹抑制分发 → 整体判断
type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;
type N = ToArrayNonDist<string | number>; // (string | number)[]
```

**名坑 ①：never 在分布式条件下直接消失。**

```ts
// never-vanish.ts
type IsNever<T> = T extends never ? true : false;
type X = IsNever<never>; // never！不是 true——never 是"空联合"，分发时没有成员可遍历
type IsNeverOK<T> = [T] extends [never] ? true : false;
type Y = IsNeverOK<never>; // true ✅（[] 抑制分发后整体比较）
```

**名坑 ②：`Exclude` 的分发既是特性也是雷。**

```ts
type Exclude<T, U> = T extends U ? never : T;
type E = Exclude<"a" | "b" | "c", "a">; // "b" | "c" ✅
// 但 T 若是函数/对象联合想整体排除，分发会把每个成员单独比对：
type F = Exclude<{ a: 1 } | { a: 2; b: 3 }, { a: 2; b: 3 }>; // { a: 1 } ✅（碰巧符合直觉）
// 整体判断需求必须手动 [T] extends [U]
```

> 分发规则、逆变与 `[]` 抑制的底层原理（裸类型参数检测）见 12 篇第一章第 3 节；Omit 对联合不分发导致的"塌缩"坑在第 8.4 节。

## 5. infer：在条件类型里"声明局部变量"

`infer X` 只能出现在 `extends` 右侧的模式里，让 TS 从匹配中**反推**类型：

```ts
// infer-basic.ts
type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;
type Str = Flatten<string[]>; // string

type GetReturnType<Type> =
  Type extends (...args: never[]) => infer Return ? Return : never;
type Num = GetReturnType<() => number>; // number
```

- **重载函数**的返回类型推断基于**最后一个**签名（最宽的兜底签名）——这是官方行为，不是 bug。
- **同一 infer 名出现在多个位置**：协变位置（返回值）取交集，逆变位置（参数）取联合：

```ts
// infer-multi.ts
type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
type F1 = Foo<{ a: string; b: string }>; // string
type F2 = Foo<{ a: string; b: number }>; // string & number → never

type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void } ? U : never;
type B1 = Bar<{ a: (x: string) => void; b: (x: number) => void }>; // string | number
```

**模板字面量中提取字符串片段**（实战）：

```ts
// infer-template.ts
// 从路由字符串递归提取所有参数名
type Route = "/user/:id/post/:postId";
type ParamNames<T> =
  T extends `${string}:${infer P}/${infer Rest}`
    ? P | ParamNames<Rest>          // 递归取下一段
    : T extends `${string}:${infer P}`
      ? P                           // 最后一段参数
      : never;
type R = ParamNames<Route>; // "id" | "postId"

// 从事件名提取属性名（配合第 7 节的事件 API）
type OnKey<T> = T extends `${infer K}Changed` ? K : never;
type K1 = OnKey<"firstNameChanged">; // "firstName"
```

## 6. 映射类型（Mapped Types）

### 6.1 基础与修饰符

```ts
// mapped-basic.ts
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean; // 遍历键，逐个换值类型
};
type FeatureFlags = { darkMode: () => void; newUserProfile: () => void };
type Feats = OptionsFlags<FeatureFlags>;
// { darkMode: boolean; newUserProfile: boolean }
```

修饰符 `+`/`-`（默认 `+`，可省）控制 `readonly` 与 `?`：

```ts
// modifiers.ts
type CreateMutable<Type> = { -readonly [P in keyof Type]: Type[P] }; // 去 readonly
type Concrete<Type>      = { [P in keyof Type]-?: Type[P] };          // 去可选（? 变必填）
type NullablePartial<T>  = { [P in keyof T]?: T[P] | null };          // 加可选 + 允许 null
// 内置 Required<T> 就是 -? 的应用，Partial<T> 就是 +?（见第 8.1 节）
```

### 6.2 键重映射 `as`（TS 4.1+）：改名与过滤

```ts
// remap.ts
type Getters<Type> = {
  [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property]
};
type Person = { name: string; age: number };
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

// as 后接 never 即"过滤掉该键"：
type RemoveKindField<Type> = {
  [Property in keyof Type as Exclude<Property, "kind">]: Type[Property]
};
type T = RemoveKindField<{ kind: "c"; radius: number }>; // { radius: number }
```

- `string & Property` 是把可能非字符串的键（number/symbol）过滤成 string，供模板字面量使用。
- `in` 后面的键集不必是 `keyof Type`：可以是任意键联合（`"a" | "b"`），也可以是模板字面量**模式**（`` `opt_${string}` ``，生成索引签名）；`as` 重映射负责改名/过滤（官方事件模式见第 7 节）。
- 同名工具：内置 `Partial/Required/Readonly/Pick/Record/Omit` 全部由映射类型实现（第 8 节手写还原）。

## 7. 模板字面量类型（Template Literal Types）

### 7.1 基础与联合叉积

```ts
// template-basic.ts
type World = "world";
type Greeting = `hello ${World}`; // "hello world"

// 插槽里的联合类型会做笛卡尔积展开：
type Lang = "en" | "ja" | "pt";
type Locale = `${Lang}_${Lang}`;
// "en_en" | "en_ja" | "en_pt" | "ja_en" | ... 共 9 个成员
```

内置字符串工具类型（TS 4.1+，编译器硬编码，非 lib 实现）：

| 工具 | 作用 | 例子 |
|---|---|---|
| `Uppercase<S>` | 全大写 | `Uppercase<"hello">` → `"HELLO"` |
| `Lowercase<S>` | 全小写 | `Lowercase<"HELLO">` → `"hello"` |
| `Capitalize<S>` | 首字母大写 | `Capitalize<"foo">` → `"Foo"` |
| `Uncapitalize<S>` | 首字母小写 | `Uncapitalize<"Foo">` → `"foo"` |

### 7.2 官方实战：动态事件 API

把"事件名规则 + 回调参数类型"整体写进类型系统：

```ts
// prop-event-source.ts
type PropEventSource<Type> = {
  on<Key extends string & keyof Type>(
    eventName: `${Key}Changed`,               // 只接受 "xxxChanged"
    callback: (newValue: Type[Key]) => void,  // 回调参数类型 = 对应属性类型
  ): void;
};

declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>;

const person = makeWatchedObject({ firstName: "Saoirse", lastName: "Ronan", age: 26 });

person.on("firstNameChanged", (newName) => console.log(newName.toUpperCase())); // newName: string
person.on("ageChanged", (n) => console.log(n + 1)); // n: number
// person.on("firstName", (n) => {});        // ❌ 缺 "Changed" 后缀
// person.on("heightChanged", (n) => {});    // ❌ 没有 height 属性
```

这条链 = 模板字面量（造键）+ `as` 重映射（改名）+ `T[K]`（取值）+ `infer`（拆字符串），是"类型级元编程"的招牌组合。

## 8. 手写内置工具类型（逐个还原 lib.es5.d.ts）

### 8.1 映射类：Partial / Required / Readonly / Pick / Record

```ts
// utils-mapped.ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
// keyof T 遍历所有键；? 加可选；值类型 T[K] 原样（索引访问，第 3 节）

type MyRequired<T> = { [K in keyof T]-?: T[K] };
// -? 移除可选修饰符——还原必填

type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
// +readonly（默认就是 +，省略同义）

type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
// 不遍历 keyof T，而是遍历"传入的键联合 K"——天然完成挑选与键合法性检查

type MyRecord<K extends keyof any, V> = { [P in K]: V };
// keyof any = string | number | symbol（"任意合法键"）；K 可以是任何键联合
type Pos = MyRecord<"x" | "y", number>; // { x: number; y: number }
```

### 8.2 条件类：Exclude / Extract / NonNullable

```ts
// utils-conditional.ts
type MyExclude<T, U> = T extends U ? never : T;
// 裸 T 分发：联合逐个比对，匹配 U 的变 never，最后联合自动"过滤"掉 never
type E = MyExclude<"a" | "b" | "c", "a">; // "b" | "c"

type MyExtract<T, U> = T extends U ? T : never; // 反向：留下匹配的
type X = MyExtract<"a" | "b" | "c", "a" | "b">;  // "a" | "b"

type MyNonNullable<T> = T extends null | undefined ? never : T;
// lib 新版实现是 T & {}（TS 4.8+）：{} 排除 null/undefined 且保住函数/字面量细节
type N = MyNonNullable<string | null | undefined>; // string
```

### 8.3 Omit 及其 never/联合两大坑

```ts
// utils-omit.ts
type MyOmit<T, K extends keyof any> = MyPick<T, MyExclude<keyof T, K>>;
// = 先从 keyof T 里排除不要的键，再 Pick
type O = MyOmit<{ a: 1; b: 2; c: 3 }, "a">; // { b: 2; c: 3 }
```

**坑 A：`Omit` 不是分布式**——作用于联合类型时会"塌缩"成共同键：

```ts
type AB = { a: 1; b: 2 } | { a: 3; c: 4 };
type Bad = Omit<AB, "a">;
// 结果是 {}！keyof AB 只剩共同键 "a"，被排除后键集为 never → Pick<AB, never> = {}
// 修复：手动分发
type OmitDist<T, K extends keyof any> = T extends any ? MyOmit<T, K> : never;
type Good = OmitDist<AB, "a">; // { b: 2 } | { c: 4 } ✅
```

**坑 B：键为 never 时 Omit 静默失效**——`keyof {}` 是 never，`Omit<T, never>` = `Pick<T, never>` = `{}`，**什么都不删也不报错**；给 Omit 的 K 传了错误的推导结果时最容易踩。

### 8.4 函数与异步：Parameters / ReturnType / Awaited

```ts
// utils-fn.ts
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;
// infer 抓参数元组；约束 (...args: any) => any 保证只进函数
type P = MyParameters<(a: string, b: number) => void>; // [a: string, b: number]

type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;
type R = MyReturnType<() => Promise<string>>; // Promise<string>

type MyAwaited<T> =
  T extends Promise<infer U> ? MyAwaited<U> : T; // 简化版：递归解包嵌套 Promise
type A = MyAwaited<Promise<Promise<number>>>;   // number
// lib 里的完整版还处理 thenable（带 then 的对象）与 null/undefined 分支
```

- `MyParameters`/`MyReturnType` 正是 05 篇"函数反射"的类型层出口（写装饰器、mock 工具时高频出现）。
- `Awaited` 是 `await` 表达式类型的来源：`Promise<Promise<T>>` 被 await 后的类型就是 `Awaited<Promise<Promise<T>>>`。

## 9. 分配律实验五连：亲手验证分发规则

第 4.2 节讲了规则，这里给 5 个可直接粘进 tsc 的实验——用恒等断言把结论"钉死"（断言不等时编译报错，比悬停更可靠）：

```ts
// 实验工具：Equal/Expect —— 利用"两个泛型函数签名完全一致才互相兼容"的规则做类型恒等比较
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type Expect<T extends true> = T;
// 用法：type _ = Expect<Equal<被测类型, 期望类型>>;  不相等则在 Expect 处报错
```

**实验 1：裸类型参数分发**

```ts
type Box<T> = T extends any ? { value: T } : never;
type E1 = Box<"a" | "b">;
// 结论：{ value: "a" } | { value: "b" } —— 裸 T 遇联合，逐成员分别进入分支
type _1 = Expect<Equal<E1, { value: "a" } | { value: "b" }>>; // ✅
```

**实验 2：[] 抑制分发**

```ts
type BoxND<T> = [T] extends [any] ? { value: T } : never;
type E2 = BoxND<"a" | "b">;
// 结论：{ value: "a" | "b" } —— T 被元组包住，整个联合只判断一次
type _2 = Expect<Equal<E2, { value: "a" | "b" }>>; // ✅
```

**实验 3：never 消失与显形**

```ts
type E3a = Box<never>;    // never —— never 是"空联合"，没有成员可分发，条件根本没执行
type E3b = BoxND<never>;  // { value: never } —— 抑制后分支真的跑了一次，T = never
type _3a = Expect<Equal<E3a, never>>;            // ✅
type _3b = Expect<Equal<E3b, { value: never }>>; // ✅
```

**实验 4：boolean 展开**

```ts
type IsString<T> = T extends string ? true : false;
type E4 = IsString<boolean>;
// boolean 本质是 true | false 的联合 → 分发成 IsString<true> | IsString<false> = true | false
// 合并后又变回 boolean —— "看起来没分发"，实则分发了一圈
type _4 = Expect<Equal<E4, boolean>>; // ✅ 注意：绝不可能得到 true 或 false
// 想判断"恰为 boolean"必须抑制分发：
type IsBoolean<T> = [T] extends [boolean] ? true : false;
type _4b = Expect<Equal<IsBoolean<boolean>, true>>; // ✅
```

**实验 5：每个成员独立求值，分支内多个裸 T 一起替换**

```ts
type PairUp<T> = T extends string ? [T, T] : never;
type E5 = PairUp<"a" | "b">;
// 结论：["a", "a"] | ["b", "b"] —— 不是 ["a", "b"]！
// 分发 = 把"一个成员"代入分支里所有裸 T 后求值；成员之间互相不可见
type _5 = Expect<Equal<E5, ["a", "a"] | ["b", "b"]>>; // ✅
```

一句话归纳：**分支执行次数 = 联合成员数（never 是 0 次）；分支内的裸 T = 当前成员；要"整体验一次"就套 `[]`**。分配律的底层检测规则（裸类型参数判定、逆变相关性）见 12 篇第一章。

## 10. infer 六种位置全景

第 5 节讲过 infer 的基本法与同名多位置规则，这里按"infer 写在模式的哪个位置"过一遍全景——位置决定协变/逆变，协变/逆变决定推断结果的合并方向。

**① 函数参数位（逆变）**——infer 结果由"函数能接受什么"决定：

```ts
type ArgOf<T> = T extends (a: infer A, ...args: any[]) => any ? A : never;
type A1 = ArgOf<(a: string | number) => void>; // string | number —— 参数位越宽，infer 越宽
// 同一 infer 名出现在多个参数位时取并集（第 5 节 Bar 例）——逆变位置的合并方向
```

**② 返回值位（协变）**——infer 结果由"函数产出什么"决定：

```ts
type RetOf<T> = T extends (...args: never[]) => infer R ? R : never;
type R1 = RetOf<() => "ok" | "err">;        // "ok" | "err"
type R2 = RetOf<(() => 1) | (() => "x")>;   // 1 | "x" —— 联合来源在协变位取并
```

**③ 数组/元组元素位**——数组取元素，元组还能按形状拆：

```ts
type Elems<T> = T extends readonly (infer E)[] ? E : never;
type E1 = Elems<string[]>; // string

type Head<T extends readonly unknown[]> = T extends readonly [infer H, ...unknown[]] ? H : never;
type Tail<T extends readonly unknown[]> = T extends readonly [unknown, ...infer R] ? R : never;
type Last<T extends readonly unknown[]> = T extends readonly [...unknown[], infer L] ? L : never;
type H1 = Head<["a", "b", "c"]>; // "a"
type T1 = Tail<["a", "b", "c"]>; // ["b", "c"]
type L1 = Last<["a", "b", "c"]>; // "c"
```

**④ 模板字面量片段**——切分位置有讲究：

```ts
// ${infer A}.${infer B} 在"第一个点"切（A 尽量短）
type SplitFirst<S extends string> = S extends `${infer A}.${infer B}` ? [A, B] : never;
type X1 = SplitFirst<"app.test.ts">; // ["app", "test.ts"]
// 前置 ${string} 是贪婪的：infer 拿到"最后一个点"之后的部分（取扩展名的惯用法）
type Ext<S extends string> = S extends `${string}.${infer E}` ? E : never;
type X2 = Ext<"app.test.ts">; // "ts"
```

**⑤ Promise/Thenable 展开处**——不只认 Promise，任何"带 then 的形状"都能解：

```ts
type ThenValue<T> = T extends { then(onFulfilled: (value: infer V) => unknown): unknown } ? V : T;
type V1 = ThenValue<{ then: (cb: (v: string) => void) => void }>; // string —— 自制 thenable
type V2 = ThenValue<Promise<number>>;  // number —— Promise 结构命中同一模式
// lib 的 Awaited（8.4 节）= 该模式 + 递归解包 + 非 thenable 兜底
```

**⑥ this 位置与多态 this**——两种形态：

```ts
// a) infer 写在 this 参数位（lib 的 ThisParameterType 同款）
type MyThis<T> = T extends (this: infer U, ...args: any[]) => any ? U : unknown;
function log(this: Console, msg: string) {}
type T1 = MyThis<typeof log>; // Console

// b) 多态 this：返回 this 的方法相当于"接收者处自动 infer"——链式调用不丢子类
class Query<T> {
  constructor(private rows: T[] = []) {}
  where(pred: (r: T) => boolean): this { return this; }  // 返回 this 而非 Query<T>
}
class UserQuery extends Query<{ name: string }> {
  byName(n: string): this { return this; }
}
const q = new UserQuery().where(() => true).byName(); // q: UserQuery
// 若 where 返回 Query<T>，这条链到 .byName() 就断（Query 上没有 byName）
```

规律：**产出方向（协变：返回值/属性/元素）的推断随来源取并**；同一 infer 名出现在多个位置时——协变位取交集、逆变位取并集（第 5 节）。读第三方工具类型源码时先认位置再推结果。

## 11. 类型级取值器 DeepGet：模板字面量拆路径 + 递归索引访问

目标：`DeepGet<T, 'a' | 'b.c'>` 按点分路径取深层属性类型；坏路径返回 never 而不是 any。

```ts
// deep-get.ts
type DeepGet<T, P extends string> =
  P extends `${infer Head}.${infer Rest}`
    ? DeepGet<DeepGet<T, Head>, Rest>            // 逐段下钻：先解析当前段，余下路径递归
    : P extends keyof T
      ? T[P]                                     // 普通键：索引访问（第 3 节）
      : T extends readonly (infer U)[]           // 数组分支：数字下标段（"0"、"1"…）
        ? P extends `${number}` ? U : never
        : never;                                 // 兜底：路径不存在 → never
```

工作机制四步：

1. **拆段**：`` `${infer Head}.${infer Rest}` `` 在第一个 `.` 切开（第 10 节位置 ④）；
2. **递归下钻**：`DeepGet<T, Head>` 先取一段，把"取到的类型"当作新对象继续拆余下路径——索引访问 + 递归条件类型的组合；
3. **数组分支**：`` P extends `${number}` `` 拦下字符串数字下标，返回元素类型 U（元组同样适用，得到元素联合）；
4. **never 兜底是刻意的**：配合"never 在联合里自动消失"（第 9 节实验 3），坏路径会从联合结果中隐去，而不会污染成 any。

```ts
type Config = {
  server: { host: string; ports: number[] };
  debug: boolean;
};

type H  = DeepGet<Config, "server.host">;    // string
type P1 = DeepGet<Config, "server.ports.1">; // number
type D  = DeepGet<Config, "debug">;          // boolean
// P 是裸类型参数 → 联合路径自动分发（第 9 节），多路径取值得到值联合：
type Both = DeepGet<Config, "debug" | "server.host">; // boolean | string
type Bad  = DeepGet<Config, "server.hostx">;          // never —— 拼错的路径编译期现形
```

配套运行时版（返回类型与 DeepGet 对齐）：

```ts
function deepGet<T, P extends string>(obj: T, path: P): DeepGet<T, P> | undefined {
  let cur: unknown = obj;
  for (const seg of path.split(".")) {
    if (cur == null) return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur as DeepGet<T, P>;  // 边界断言：段合法性由 DeepGet 在编译期保证
}

const cfg: Config = { server: { host: "localhost", ports: [3000, 3001] }, debug: true };
console.log(deepGet(cfg, "server.host"));    // "localhost"（类型 string）
console.log(deepGet(cfg, "server.ports.1")); // 3001（类型 number）
const bad = deepGet(cfg, "server.hostx");    // undefined
// 妙处：bad 的类型是 DeepGet<Config, "server.hostx"> | undefined = never | undefined = undefined
// —— "不可能有值"的路径被类型系统自动压成 undefined
```

## 12. 类型级函数组合 Pipe：尾递归折叠推导参数与返回

目标：`Pipe<[f1, f2, f3]>` 得到"整条链组合后的函数类型"——参数取 f1 的参数、返回值取 f3 的返回，且**逐个检查接缝**（上一个的返回必须能喂给下一个的参数）。

```ts
// pipe.ts —— 约束：一元函数链
type AnyFn = (arg: any) => any;

type Pipe<FS extends AnyFn[]> = FS extends []
  ? never
  : FS extends [(arg: infer P) => infer R]      // 只剩一个 → 组合完成
    ? (arg: P) => R
    : FS extends [
        (arg: infer P) => infer R,
        (arg: infer P2) => infer R2,
        ...infer Rest extends AnyFn[],          // TS 4.7+：解构 + 约束一步完成
      ]
      ? R extends P2                            // 接缝检查
        ? Pipe<[(arg: P) => R2, ...Rest]>       // 折叠前两个，尾递归继续
        : never                                 // 接不上 → 整条链 never
      : never;
```

推导过程回放（配合运行时 pipe）：

```ts
declare function pipe<FS extends AnyFn[]>(...fs: FS): Pipe<FS>;

const trim = (s: string) => s.trim();
const toNum = (s: string) => Number(s);
const isFin = (n: number) => Number.isFinite(n);

const ok = pipe(trim, toNum, isFin);   // 类型是 (arg: string) => boolean
// 折叠回放：
// [(s:string)=>string, (s:string)=>number, (n:number)=>boolean]
//   → string extends string ✅ → [(s:string)=>number, (n:number)=>boolean]
//   → number extends number ✅ → [(s:string)=>boolean]
//   → 只剩一个 → (arg: string) => boolean
ok("  42  "); // ✅

const bad = pipe(
  (s: string) => s.length,   // 返回 number
  (b: boolean) => b,         // 参数要 boolean
); // 接缝 number extends boolean ❌ → Pipe 结果 never
// bad("x"); // ❌ TS2349: This expression is not callable.（never 没有调用签名）
```

三个实现要点：

1. **为什么是"折叠"而不是"分别取头尾"**：折叠在递归中顺带完成接缝检查；只取 `Parameters<FS[0]>[0]` 与末元素返回值的"轻量版"不查兼容，链断裂时静默给出错误类型。
2. **尾递归才撑得住长链**：`Pipe<[(arg: P) => R2, ...Rest]>` 是分支的"最外层"结果，命中 TS 对条件类型的尾递归优化——元组长度每轮 -1，几十个函数也不触发 TS2589；若把递归包进别的类型构造器（如 `Pipe<Rest>[]`），约 50 层就会报 TS2589（以官方文档为准）。
3. **`infer Rest extends AnyFn[]`**（infer extends，TS 4.7+）省掉一层 `Rest extends AnyFn[] ? ... : never` 的守门。

对照第 8.4 节：`MyParameters` 抓参数元组、`MyReturnType` 抓返回值都是"单步 infer"；Pipe 是把它们放进**尾递归**的典型实战——类型级循环 + 模式匹配的组合拳。

## 13. 要点速查

| 机制 | 语法 | 一句话用途 |
|---|---|---|
| keyof | `keyof T` | 取键联合；联合类型上是"共同键交集" |
| typeof | `typeof v` / `typeof import("m")` | 从值/模块造类型 |
| 索引访问 | `T["a"]`、`T[K]`、`T[number]` | 取属性/元素类型；配合泛型做安全取值 |
| 条件 | `T extends U ? X : Y` | 类型级 if；裸 T 遇联合分发 |
| 抑制分发 | `[T] extends [U]` | 整体判断；解 never 消失坑 |
| infer | `infer X` | 模式匹配里声明类型变量；模板字面量拆串 |
| 映射 | `{ [P in keyof T]: F<P> }` | 批量换键值；`+/-` 控制 readonly/? |
| 键重映射 | `as \`get${Capitalize<K>}\`` | 改名；`as never` 过滤键 |
| 模板字面量 | `` `a${B}c` `` | 造键名/事件名；联合叉积 |
| 工具类型 | `Partial...Awaited` | 全部可用上述机制手写还原 |

> 跨语言对比：C++ 的模板特化、Scala 的 implicit、Rust 的 trait 关联类型都做"编译期计算"，但 TS 的条件类型 + `infer` 是**纯模式匹配**风格，最接近 Haskell 的类型族（type family）；映射类型类似 Rust 的 derive 宏——都是"按形状批量生成成员"。TS 的独特优势是这套机制全部**结构化**，无需宏展开顺序的心理负担。

## 14. 常见坑汇总

1. `keyof (A | B)` 是共同键交集不是全部键——要全部键用 `T extends any ? keyof T : never`（第 1 节）。
2. `typeof` 拿到的是声明类型，不是运行时收窄结果；只接受标识符，不能 `typeof f()`（第 2 节）。
3. 裸类型参数 + 联合自动分发：想整体比较必须 `[T] extends [U]`（第 4.2 节）。
4. `IsNever<never>` 返回 never 而非 true——never 是空联合，分发无成员可走（第 4.2 节坑 ①）。
5. `Exclude` 处理"整体对象"时被分发逐个比对，需要排除整个成员时要 `[T] extends [U]`（第 4.2 节坑 ②）。
6. `Omit` 作用于联合类型会塌缩——配 `T extends any ? Omit<T, K> : never`（第 8.3 节坑 A）。
7. `Omit<T, never>` 静默返回 `{}`，删不掉任何键也不报错（第 8.3 节坑 B）。
8. 重载函数的 `ReturnType` 取**最后一个**签名（第 5 节）。
9. 同名 infer 多位置：协变取交集（可能变 never）、逆变取联合——读第三方工具类型源码时必须知道（第 5 节）。
10. 映射类型 `as` 里直接用非字符串键会炸：先 `string & Property` 过滤（第 6.2 节）。
11. 模板字面量插槽联合做叉积，成员数指数膨胀，大联合别套两个插槽（第 7.1 节）。

## 15. 衔接

- 本文是"构造手法"，底层规则（兼容性/协变逆变/分配律原理）见 `12-typescript-advanced-type-system.md`，两篇配合食用。
- `K extends keyof T` 在函数签名里的用法与上下文推断见 `05-more-on-functions.md`。
- `as const satisfies` 对象替代枚举、`typeof O[keyof typeof O]` 提取见 `07-enums.md` 与 `15-typescript-new-features.md`。
- 工具类型速查表见 `02-typescript-cheatsheet.md`；面试向的类型体操题解见 `14-typescript-interview-questions.md`。
- `InstanceType<T>`（类的反射）见 `06-classes.md` 第 13.2 节；装饰器元数据与映射类型的配合见 `09-decorators.md`。
- Nest 中 `Reflector.get`、拦截器 `CallHandler` 泛型、`PickType`（GraphQL/OpenAPI 挑字段）都是本文机制的应用，见 `/Users/hh/offer/技术文档/nest/decorator-summary.md` 与 `06-graphql`。

## 16. 一句话总结

> 从类型造类型的工具箱只有五件：`keyof` 拿键、`T[K]` 取值、条件类型做分支、映射类型做批量变换、模板字面量造字符串键——`infer` 贯穿其中充当"模式变量"；所有内置工具类型（Partial 到 Awaited）都能用这五件手写还原，而踩坑集中在三处：裸类型参数的分发（`[]` 抑制）、never 在分发中的消失、`Omit` 对联合的塌缩——记住"要整体比较就包一层数组，要分发就保持裸写"。
