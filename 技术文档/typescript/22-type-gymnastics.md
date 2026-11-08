# 22. 类型体操实战（type-challenges 风格：15 道题完整拆解）

> 来源可信度：**官方文档确认 + 对比分析**（语法规则以 TypeScript Handbook / lib.es5.d.ts 官方内置类型为准；题目风格来自 type-challenges 仓库，解法为社区通行写法，易错点为对比归纳）
> 关联：`12-typescript-advanced-type-system.md`（分布律/逆变/infer 的理论底座）、`08-creating-types-from-types.md`（keyof/映射/条件类型语法）、`04-narrowing.md`（never 与穷尽）、`17-engineering-tsup-vitest.md`（expectTypeOf 类型测试）、`13-typescript-best-practices.md`（生产代码克制原则）、`23-error-debugging.md`（TS2589 递归爆栈）

## 1. 方法论：四步解题模板

每道题都按同一个流程走，不要上来就堆技巧：

1. **观察用例**：把「输入类型 → 期望输出类型」的对照写下来（type-challenges 的测试用例就是干这个的）。用例不够就自己补边界：空元组、never、any、可选属性、readonly。
2. **拆解为原语**：这道题需要什么？拿键（`keyof T`）？拿值（`T[K]`）？绑定结构（`infer`）？逐成员变形（映射类型）？逐层深入（递归）？逐成员分发（分布条件类型，见 `12-typescript-advanced-type-system.md` 1.3）？
3. **组合**：把原语拼成完整定义，能用内置工具类型（`Pick`/`Omit`/`ReturnType`…）就先借力。
4. **验证**：`expectTypeOf` 断言 + hover 查看。改一点验一点。

```ts
// gym.test-d.ts —— 标准验证姿势（vitest 类型测试，配置见 17-engineering-tsup-vitest.md）
import { expectTypeOf } from 'vitest';

expectTypeOf<YourType<{ a: 1 }, 'a'>>().toEqualTypeOf<{ a: 1 }>();
// 也可以不开 vitest，直接用内部断言套路：
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
const _ok: Expect<Equal<YourType<{ a: 1 }, 'a'>, { a: 1 }>> = true;
```

**工具箱速查**（语法细节在 `08-creating-types-from-types.md`）：

| 原语 | 干什么 | 典型用法 |
|---|---|---|
| `keyof T` | 拿键的联合 | 约束 K：`K extends keyof T` |
| `T[K]`（索引访问） | 拿值 | 元组转联合 `T[number]` |
| `infer R` | 在模式里「捕获」类型 | 元组首元素、Promise 的 resolve 值 |
| 映射类型 | 逐键变形 | `{ [K in keyof T]: ... }`，`-?`/`readonly` 修饰符增删 |
| `as` 重映射 | 改键名/删键 | `{ [K in keyof T as \`get${K}\`]: T[K] }` |
| 分布条件类型 | 逐成员处理联合 | `T extends U ? A : B`（裸 T 才分布） |
| 递归 | 处理嵌套 | `DeepReadonly`、`Awaited`（注意 TS2589 爆栈，见 23 篇） |

## 2. 前置必学：Equal 相等比较技巧

普通 `X extends Y ? true : false` 是「可赋值性」，不是「相等」：`number` 能赋给 `any`、`[1]` 能赋给 `number[]`，但它们不相等。type-challenges 的标准解法是：

```ts
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

type A = Equal<{ a: 1 }, { a: 1 }>;   // true
type B = Equal<any, number>;          // false（extends 判断会误判为 true）
type C = Equal<[1], number[]>;        // false（可赋值但不相等）
```

- **原理**：TS 内部比较两个**泛型签名是否 identical** 时（`isTypeIdenticalTo`），会对未实例化的条件类型做特殊处理：两个「外壳相同」的条件类型相同，当且仅当其内部分支类型（X 与 Y）相同。这比可赋值性严格得多——能区分 `any`、`readonly` 修饰、元组与数组这些 extends 会「放过」的差异。这套比较正是编译器自己实现 `Equals` 标记用的规则，所以结果与编译器视角一致。
- 题目里凡涉及「逐元素精确相等比较」的（如 Includes、AnyOf 的严格版），都要用它；直接 `F extends U` 会把 `any`/结构相似类型误判进来。

## 3. 热身题（题 1–5）：元组、索引与映射

### 3.1 题 1：MyPick

```ts
// 题目：不使用内置 Pick<T, K>，实现同款。
interface Todo { title: string; description: string; done: boolean }
type cases = [Expect<Equal<MyPick<Todo, 'title' | 'done'>, { title: string; done: boolean }>>];
```

思路：逐个键复制原类型——「逐键」即映射类型；「只拿指定的键」即用 `K extends keyof T` 约束。

```ts
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
//                    └─ 第一道闸：K 必须是 T 的键，否则编译报错
```

- **逐行解释**：`K extends keyof T` 把非法键挡在编译期（传 `'nope'` 直接报错）；`[P in K]` 遍历 K 的每个成员生成键；`T[P]` 索引访问取原类型的值类型。
- **易错点**：写成 `{ [P in keyof T]: T[P] }` 就成了复制全量；忘写约束则 `T[P]` 里 P 可能不在 keyof T 中而报 TS2536。

### 3.2 题 2：MyReadonly2（带默认参数）

```ts
// 题目：把 T 中【指定】的键变 readonly，其余保持原样；不传 K 则全变。
type cases = [
  Expect<Equal<MyReadonly2<Todo>, { readonly title: string; readonly description: string; readonly done: boolean }>>,
  Expect<Equal<MyReadonly2<Todo, 'title'>, { readonly title: string; description: string; done: boolean }>>,
];
```

思路：`readonly` 修饰符在映射类型里是「全有或全无」，没法对部分键条件加——那就**拆两块再合并**：readonly 的指定键 + 不变的其余键。

```ts
type MyReadonly2<T, K extends keyof T = keyof T> =
  Omit<T, K> & { readonly [P in K]: T[P] };
//  └─ 默认参数：不传 K 时 = keyof T，退化为全 readonly
```

- **逐行解释**：`K extends keyof T = keyof T` 是类型层面的默认值（语法同函数默认参数）；`Omit<T, K>` 拿「未被点名的键」；映射部分把点名键加 readonly；`&` 交叉合并（交叉语义见 `12-typescript-advanced-type-system.md`）。
- **易错点**：试图用键重映射 `as P extends K ? P : never` 一个映射搞定——`never` 会把「非 K 的键删掉」而不是保持原样；另外交叉产生的类型在 `toEqualTypeOf` 严格比较下可能与扁平字面量不等（结构等价但形状标记不同），测试时留意。

### 3.3 题 3：First

```ts
// 题目：取元组第一个元素的类型；空元组返回 never。
type cases = [
  Expect<Equal<First<[3, 2, 1]>, 3>>,
  Expect<Equal<First<[]>, never>>,
];
```

思路：解构捕获——`infer F` 绑定第一个位置；空元组匹配不到模式，走 else 分支。

```ts
type First<T extends unknown[]> = T extends [infer F, ...unknown[]] ? F : never;
```

- **逐行解释**：`T extends unknown[]` 收窄到元组/数组；`[infer F, ...unknown[]]` 是「至少一个元素」的模式；`...unknown[]` 占住剩余位置（命名为 `_R` 也行，未使用的 infer 会告警）。
- **易错点**：直接写 `T[0]`——空元组没有索引 0，报 TS2539，必须先判空：`T extends [] ? never : T[0]` 是另一套等价解法；`unknown` 换成 `any[]` 会让 `First<[never]>` 等边界语义漂移。

### 3.4 题 4：TupleToUnion

```ts
// 题目：元组 → 其元素类型的联合。
type cases = [Expect<Equal<TupleToUnion<[1, 2, 3]>, 1 | 2 | 3>>];
```

思路：对元组按「数字索引」取值就是所有元素——`T[number]` 一步到位。

```ts
type TupleToUnion<T extends readonly unknown[]> = T[number];
```

- **逐行解释**：元组类型的数字索引访问会返回全部元素类型的联合；`readonly` 约束让 `as const` 数组也能传入。
- **易错点**：想用 `T extends [infer F, ...infer R] ? F | TupleToUnion<R> : never` 递归——能做但纯属多余；忘了 `readonly` 约束则 `TupleToUnion<readonly [1]>` 报错。

### 3.5 题 5：Concat

```ts
// 题目：拼接两个元组，保留字面量元素与长度信息。
type cases = [
  Expect<Equal<Concat<[1], [2, 3]>, [1, 2, 3]>>,
  Expect<Equal<Concat<readonly [1], []>, readonly [1]>>,   // type-challenges 原题不含此例，自加边界
];
```

思路：元组支持展开语法，类型层面同样支持。

```ts
type Concat<A extends readonly unknown[], B extends readonly unknown[]> = [...A, ...B];
```

- **逐行解释**：`[...A, ...B]` 与值层面的数组展开同构，展开的是「元素类型序列」；`readonly` 约束兼容只读元组。
- **易错点**：约束写成 `unknown[]` 会拒绝 `readonly [1]`；期望 `Concat<[1], [2]>` 有「长度 2」的推导时，直接 `[...A, ...B]` 已经保留了元组性，不要手动写 length。

## 4. 中级题（题 6–10）：递归与分布

### 4.1 题 6：Includes（重点：Equal 的使用位置）

```ts
// 题目：判断元组中是否存在与 U 相等的元素。
type cases = [
  Expect<Equal<Includes<[1, 2, 3], 2>, true>>,
  Expect<Equal<Includes<{ a: 1 }[], { a: 1 }>, false>>,  // 精确相等，不是可赋值
  Expect<Equal<Includes<[any], any>, true>>,             // 但 any === any 要 true
];
```

思路：逐个元素比较 + 递归找下一个。比较必须用 Equal（第 2 章）。

```ts
type Includes<T extends readonly unknown[], U> = T extends [infer F, ...infer R]
  ? Equal<F, U> extends true
    ? true
    : Includes<R, U>
  : false;
```

- **逐行解释**：每轮解构出首元素 F 与余部 R；`Equal<F, U> extends true` 用精确相等判断；不等则对 R 递归；元组耗尽返回 false。
- **易错点**：
  1. 直接 `F extends U`——`{ a: 1 }[]` 里的元素可赋值判定会把「结构相同」误判为 true；
  2. 忘了 Equal 返回的是 `boolean` 而把 `Equal<F, U>` 直接当 true 用——必须再 `extends true` 收窄；
  3. 递归没收敛（R 不断变小，天然收敛，但自己改写时注意基线是 `[]` → false）。

### 4.2 题 7：MyExclude / MyExtract（分布律标准应用）

```ts
// 题目：实现内置 Exclude / Extract。
type cases = [
  Expect<Equal<MyExclude<'a' | 'b' | 'c', 'a'>, 'b' | 'c'>>,
  Expect<Equal<MyExtract<'a' | 'b' | 'c', 'a' | 'f'>, 'a'>>,
];
```

思路：联合的**逐成员分发**（见 `12-typescript-advanced-type-system.md` 1.3）：裸类型参数 T 会让条件类型对每个成员求值。

```ts
type MyExclude<T, U> = T extends U ? never : T;   // 匹配上的成员丢弃（never）
type MyExtract<T, U> = T extends U ? T : never;   // 匹配上的成员保留
```

- **逐行解释**：T 是裸类型参数 → `'a' | 'b' | 'c'` 拆成三个独立判断；不匹配的产出 `never`，在联合里被自动吸收。
- **易错点**：`[T] extends [U]` 加了元组包裹就抑制分发，整体判断一次，结果完全不同；U 写成非裸引用（如 `U & {}`）会改变匹配语义。

### 4.3 题 8：Awaited（递归 thenable）

```ts
// 题目：实现递归版 await：层层剥开 Promise/thenable。
type cases = [
  Expect<Equal<MyAwaited<Promise<Promise<number>>>, number>>,
  Expect<Equal<MyAwaited<Promise<{ then: (cb: (v: boolean) => any) => any }>>, boolean>>,
];
```

思路：`PromiseLike<infer U>` 捕获 resolve 值；值还是 thenable 就继续递归。

```ts
type MyAwaited<T extends PromiseLike<unknown>> = T extends PromiseLike<infer U>
  ? U extends PromiseLike<unknown>
    ? MyAwaited<U>   // 里层还是 Promise：递归
    : U              // 到底了：直接给
  : never;
```

- **逐行解释**：约束 `T extends PromiseLike<unknown>` 挡住非 thenable 输入；`infer U` 捕获 then 的回调参数类型（即 resolve 值）；第二个条件类型判断是否还要继续剥。
- **易错点**：只写一层 `infer U` 不递归，`Promise<Promise<number>>` 得到 `Promise<number>`；真实内置 `Awaited`（TS 4.5+，见 `15-typescript-new-features.md`）还要处理 `null | undefined` 与非 Promise 输入，生产直接用内置。

### 4.4 题 9：DeepReadonly

```ts
// 题目：递归 readonly，嵌套对象、数组全变只读。
type cases = [
  Expect<Equal<DeepReadonly<{ a: { b: { c: number } } }>, { readonly a: { readonly b: { readonly c: number } } }>>,
  Expect<Equal<DeepReadonly<{ arr: number[] }>, { readonly arr: readonly number[] }>>,
];
```

思路：映射类型 + 递归；先分流函数与数组，再对普通对象递归。

```ts
type DeepReadonly<T> = T extends Function
  ? T                                                    // 函数保持原样
  : T extends readonly (infer E)[]
  ? readonly DeepReadonly<E>[]                           // 数组：元素递归
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }      // 对象：逐键递归
  : T;                                                   // 原始类型：原样返回
```

- **逐行解释**：三个分流保证函数不被映射成 `{ }`（函数也是 object）、数组保留数组形；映射类型给每个键加 readonly 并对值递归。
- **易错点**：不分流函数——`Function extends object` 为真，会被映射成一个空对象形状；内置 `Readonly<T>` 是**浅层**的（`lib.es5.d.ts` 里就一层映射），别混用；元组会被此简化版摊平成数组，生产用内置 `Readonly` 组合或按需特化。

### 4.5 题 10：DeepPartial

```ts
// 题目：递归可选化，常用于「局部更新」的 patch 参数。
type cases = [
  Expect<Equal<DeepPartial<{ a: { b: string } }>, { a?: { b?: string } }>>,
];
```

思路：与 DeepReadonly 同构，只是修饰符换成 `?`。

```ts
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

- **逐行解释**：`?` 加在映射键上即可选；值递归处理嵌套。
- **易错点**：数组的值会被 `DeepPartial` 拆成「稀疏索引可选」语义（`DeepPartial<string[]>` ≈ `...?: string` 的怪形状），需要数组时通常应保持数组整体不变——自行加一个 `T extends readonly any[] ? T : ...` 分流；这是面试常追问的边界（延伸讨论见 `13-typescript-best-practices.md` 的工具类型节制原则）。

## 5. 进阶题（题 11–15）：联合、标记与分发技巧

### 5.1 题 11：OptionalKeys / RequiredKeys

```ts
// 题目：分别提取「可选属性」与「必填属性」的键联合。
type cases = [
  Expect<Equal<OptionalKeys<{ a: number; b?: string }>, 'b'>>,
  Expect<Equal<RequiredKeys<{ a: number; b?: string }>, 'a'>>,
];
```

思路：利用「空对象 `{}` 能否赋给 `Pick<T, K>`」探测可选性——可选属性可以缺席，所以 `{}` 能通过。

```ts
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];
type RequiredKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? never : K }[keyof T];
```

- **逐行解释**：`-?` 先把映射出的键变成必填（否则映射结果自带可选性干扰索引访问）；`{} extends Pick<T, K>` 探测「缺这个键的对象是否合法」——合法即原键可选；映射完的「值全联合」用 `[keyof T]` 索引取出来；被淘汰的键产出 never 被联合吸收。
- **易错点**：不加 `-?`，索引访问会因值类型可选而混入 `undefined`；`Pick<T, K>` 换成 `T[K]` 判断 `undefined` 会把「必填但类型含 undefined」误判为可选。

### 5.2 题 12：Get（索引链）

```ts
// 题目：支持 'a.b.c' 点号链式取深层类型。
type cases = [
  Expect<Equal<Get<{ a: { b: { c: 'value' } } }, 'a.b.c'>, 'value'>>,
  Expect<Equal<Get<{ a: { b: 1 } }, 'a.b' | 'a.x'>, 1>>,   // 非法链产出 never 被吸收
];
```

思路：模板字面量类型拆字符串（`08-creating-types-from-types.md` 的字符串工具），逐段下钻。

```ts
type Get<T, K extends string> = K extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? Get<T[Head], Rest>       // 还有下一段：对子对象递归
    : never
  : K extends keyof T
    ? T[K]                     // 最后一段：直接索引
    : never;
```

- **逐行解释**：`${infer Head}.${infer Rest}` 贪婪匹配到第一个点，Head 是当前段、Rest 是剩余链；Head 合法就带着子对象和剩余链递归；没有点了就是末端键。
- **易错点**：模板 infer 的拆分是**非贪婪**的（第一个点处断开）；`K extends string` 约束漏掉会在无点分支报错；深层递归过深会撞 TS2589（修法见 `23-error-debugging.md`）。

### 5.3 题 13：UnionToIntersection（重点：infer 到逆变位）

```ts
// 题目：联合 → 交叉。UnionToIntersection<'a' | 'b'> = 'a' & 'b'。
type cases = [
  Expect<Equal<UnionToIntersection<{ a: 1 } | { b: 2 }>, { a: 1 } & { b: 2 }>>,
];
```

思路：先把联合的每个成员**装进函数参数位**（分布），再在目标位置用 infer 捕获。函数参数在 strictFunctionTypes 下是**逆变**的（`12-typescript-advanced-type-system.md` 第 2 章）——「一个能同时处理 A 和 B 的函数」的参数类型只能是 `A & B`。

```ts
type UnionToIntersection<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
//  └─ 分布：U 的每个成员包成 (x: member) => void，得到函数【联合】
//                                          └─ 函数联合可赋给单个函数签名 ⇔ infer I 在逆变位聚成交叉
```

- **逐行解释**：第一步分布把 `'a' | 'b'` 变成 `((x: 'a') => void) | ((x: 'b') => void)`；第二步把函数联合与 `(x: infer I) => void` 匹配——要让**两个**函数都能赋给它，参数 I 必须同时可赋给 `'a'` 和 `'b'`，即 `I extends 'a' & 'b'`，TS 据此把 I 推断为交叉。
- **易错点**：`U extends any` 里的 `any` 不能省（它触发分布）；直接 `U extends infer I ? I : never` 毫无效果——infer 不在函数参数位就只会原样返回 U；同参多函数的边界（重复键）按编译器行为为准。

### 5.4 题 14：AnyOf

```ts
// 题目：元组中存在「真值」元素则 true；全 falsy 或空元组则 false。
type cases = [
  Expect<Equal<AnyOf<[0, '', false, []]>, true>>,   // [] 是对象，真值
  Expect<Equal<AnyOf<[0, '', false, null, undefined]>, false>>,
];
```

思路：逐元素检查，命中 TS 世界的 falsy 字面量集合就继续找下一个。

```ts
type AnyOf<T extends readonly unknown[]> = T extends [infer F, ...infer R]
  ? F extends 0 | '' | false | undefined | null
    ? AnyOf<R>
    : true
  : false;
```

- **逐行解释**：解构首元素与余部；falsy 字面量联合是 TS 值世界公认的假值清单（类型层没有「truthy」谓词，只能枚举）；空元组走 else 返回 false。
- **易错点**：`[]` 不在清单里所以为真（对象恒真值，与 JS 一致）；`NaN` 类型是 `number`，不在 falsy 清单中，`AnyOf<[NaN]>` 按类型层判 true——类型系统看不见运行时数值，这正是「类型与运行时的信任鸿沟」（见 `23-error-debugging.md` 第 12 章）。

### 5.5 题 15：IsNever（重点：`[T]` 抑制分布）

```ts
// 题目：判断 T 是否恰好是 never。
type cases = [
  Expect<Equal<IsNever<never>, true>>,
  Expect<Equal<IsNever<undefined>, false>>,
  Expect<Equal<IsNever<1>, false>>,
];
```

思路：直接写 `T extends never ? true : false` 永远得 never——因为 never 是空联合，分布条件类型对空联合**一次都不执行**。用元组包裹抑制分发。

```ts
type IsNever<T> = [T] extends [never] ? true : false;
```

- **逐行解释**：`[T]` 把 T 装进元组，条件类型变成对「单元素元组」整体判断，不再按联合分发；`[never]` 与 `[never]` 相等成立。
- **易错点**：这是分布律最经典的反直觉案例（同族技巧还有 `[T] extends [any]` 判 any）；「条件类型遇到 never 返回 never」与「IsNever 要 true」的矛盾，面试高频（`14-typescript-interview-questions.md` 有同款题）。

## 6. 何时收手：生产代码不要体操

- 体操的定位是**理解类型系统的教具**：把分布律、逆变、infer、递归在这些题里练透，读得懂第三方类型报错、写得出 20 行以内的工具类型，就到收益拐点了（呼应 `01-typescript-learning-roadmap.md` 的「高手」阶段定位）。
- 生产红线（`13-typescript-best-practices.md` 的坏味道清单）：
  1. 能用内置工具类型/简单映射解决的，不写递归；
  2. 类型定义里出现两层以上条件类型嵌套时，先考虑换设计（判别联合、泛型函数），而不是更复杂的类型；
  3. 递归类型必须有明确深度上限意识——撞 TS2589 的项目几乎都是把体操带进了业务（修法见 `23-error-debugging.md`）;
  4. 晦涩类型必须配「用例注释 + expectTypeOf 测试」，否则下一个维护者只会 `as any`。
- 收手信号：你在类型上花的时间超过业务逻辑本身；报错信息没人看得懂；类型能跑但 IDE hover 出来三屏。

## 7. 一句话总结

> 类型体操的正确姿势是固定四步——观察用例、拆解为 keyof/索引访问/infer/映射/递归/分布这些原语、组合、expectTypeOf 验证；十五道题各喂饱一个原语：MyPick 练映射约束、MyReadonly2 练默认参数与交叉合并、First/Concat 练元组模式与展开、TupleToUnion 练索引访问、Includes 练 Equal 精确比较、Exclude/Extract 练分布律、Awaited 练 thenable 递归、DeepReadonly/DeepPartial 练分流加递归、OptionalKeys 练 `{}` 探测可选性、Get 练模板字面量拆链、UnionToIntersection 练「分布进逆变位、infer 收交叉」、AnyOf 练 falsy 枚举、IsNever 练 `[T]` 抑制分布对 never 的魔法；练完请收手——体操用来理解类型系统，生产代码要的是三行以内、别人读得懂的类型。
