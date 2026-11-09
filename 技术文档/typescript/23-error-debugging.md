# 23. TS 报错解读与类型调试（高频错误码 25 讲 + 类型调试工具箱）

> 来源可信度：**官方文档确认 + 对比分析**（报错文案以 TS 5.9 编译器实际输出为准；错误码分段规律为经验归纳，官方未承诺编号稳定，个别码以实际报错为准；调试工具部分参考 @total-typescript/ts-reset、vitest 官方文档）
> 关联：`21-declaration-files.md`（TS7016 的根治方案）、`17-engineering-tsup-vitest.md`（expectTypeOf 类型测试配置）、`13-typescript-best-practices.md`（any 治理与坏味道）、`12-typescript-advanced-type-system.md`（分布律/逆变背景知识）、`04-narrowing.md`（收窄规则）、`02-typescript-cheatsheet.md`（速查）

## 1. 错误码结构：TSxxxx 的分段规律

报错格式固定三段：`文件(行,列): error TSxxxx: 文案`。`error` 换 `warning` 只在少数配置项下出现；`TSxxxx` 后的文案才是正文。

| 号段 | 经验归类 | 例子 |
|---|---|---|
| TS1xxx | 语法错误 / 命令行选项 | TS1005 `';' expected`、TS1109 |
| TS2xxx | 核心语义：名字/模块找不到、类型不兼容、属性不存在 | TS2304/TS2307/TS2322/TS2339 |
| TS4xxx | 声明与修饰符位置类 | TS4111（用索引签名访问要 `['x']` 写法） |
| TS5xxx | 编译器配置错误 | TS5023 Unknown compiler option |
| TS6xxx | 提示级（未使用变量等，由 noUnused* 开关触发） | TS6133 declared but never used |
| TS7xxx | 推断失败：隐式 any、缺声明 | TS7006/TS7016 |
| TS18xxx | TS 4.4+ 拆出的新语义段（多数与空值检查有关） | TS18047/TS18048 |

> 编号是**经验规律**，官方不保证稳定；升级 TS 后同一问题换码很正常。记「文案 + 场景」比记号码更可靠。

## 2. 读报错的通用心法

1. **先读第一行**：`error TS2322: Type 'X' is not assignable to type 'Y'` —— X 是你给的东西，Y 是它要的东西，先分清两侧再谈修复。
2. **嵌套类型从最里层读起**：泛型/递归类型的报错像洋葱，TS 把整条展开链都打出来；**最内层的 incompatibility 才是根因**，外层只是它被层层包裹的路径。
3. **重载报错（TS2769）读「最后一条候选」**：每个重载一条失败原因，最后一往往是「参数数量都不对」的兜底信息。
4. **报错行号 ≠ 根因行号**：TS 在类型层面「延迟爆炸」，比如泛型函数内部没错，调用点才炸——根因可能是定义处推断歪了。

```ts
// 读法示例：两层嵌套，先看最里层
interface Config { db: { host: string } }
const c: Config = { db: { host: 3000 } };
// error TS2322: Type 'number' is not assignable to type 'string'.
//   Types of property 'host' are incompatible.
//     Type 'number' is not assignable to type 'string'.
// ↑ 最里层（host: number vs string）才是要修的点；外层 Config/db 是定位路径
```

## 3. 赋值不兼容三兄弟：TS2322 / TS2345 / TS2741

### TS2322 — Type 'X' is not assignable to type 'Y'

```ts
// 触发：let/const/属性等「赋值位」
let n: number = '1';
// error TS2322: Type 'string' is not assignable to type 'number'.
```

原因：目标类型 Y 接受不了值类型 X（结构化比较失败，规则见 `12-typescript-advanced-type-system.md` 1.1）。

修复：三选一——改值适配 Y；改 Y（联合 `number | string`）；确认 X 真实形状后用收窄或类型守卫（`04-narrowing.md`）。**少用 `as`**。

### TS2345 — Argument of type 'X' is not assignable to parameter of type 'Y'

```ts
// 触发：函数调用位
function sum(a: number, b: number) { return a + b; }
sum(1, '2' as unknown);
// error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
```

原因与修复同 TS2322，只是发生在**参数位**；注意「回调函数参数」报 2345 时常是逆变问题——你给的回调参数类型太窄（修复：参数放宽或改用泛型）。

### TS2741 — Property 'x' is missing in type 'Y' but required in type 'Z'

```ts
// 触发：对象字面量缺必填键
interface User { id: number; name: string }
const u: User = { id: 1 };
// error TS2741: Property 'name' is missing in type '{ id: number; }' but required in type 'User'.
```

原因：Y 是 Z 的子形状（少键）。修复：补键；确实允许缺省就把 Z 的属性改可选（`name?: string`）；或拆分类型（`Partial<User>`）。与 TS2739（`Type 'X' is missing the following properties from type 'Y'`，缺多个键时的变体）同族。

## 4. 找不到：TS2339 / TS2304

### TS2339 — Property 'x' does not exist on type 'Y'

```ts
// 触发：访问了类型上不存在的属性（最高频错误之一）
const maybe = { id: 1 } as { id: number } | null;
maybe.id;
// error TS18047/TS2339 家族：'maybe' is possibly 'null'.   ← null 前置错误先出现
// 纯 2339 场景：
type Shape = { kind: 'circle'; r: number } | { kind: 'square'; w: number };
function area(s: Shape) { return s.r; }
// error TS2339: Property 'r' does not exist on type 'Shape'.
//   Property 'r' does not exist on type '{ kind: "square"; w: number; }'.
```

原因：联合类型上访问了「部分成员才有」的属性。修复：**判别联合收窄**（`s.kind === 'circle'` 或 switch + never 穷尽，见 `04-narrowing.md`）；对象属性名拼错则改对；运行时动态键用 `Record<string, T>` 或 Map。

### TS2304 — Cannot find name 'x'

```ts
// 触发：标识符不存在——拼错、没 import、类型只在「模块里」而你在全局用
class A { }
const x = A;      // OK
const y = B;
// error TS2304: Cannot find name 'B'.
// 另一高频场景：第三方包的类型（如 jest 的 expect）没被注入 → 装 @types 包或检查 tsconfig types 白名单（21 篇第 6 章）
```

修复排查顺序：拼写 → 漏 import → 缺 `@types`/环境声明（指 `21-declaration-files.md`）→ `lib` 里没开对应内置（如 DOM）。TS2307（`Cannot find module 'x'`）是它的模块版，修法同：装包/补 d.ts/查 paths。

## 5. 空值收窄：TS2531 / TS2532 / TS18048

### TS2531 — Object is possibly 'null'. / TS2532 — Object is possibly 'undefined'.

```ts
// 触发：strictNullChecks 下未收窄就使用
const el = document.querySelector('#app');   // Element | null
el.innerHTML = '';
// error TS2531: Object is possibly 'null'.
```

修复（按优先级）：真值判断 `if (el)`；提前返回/抛错；`?? 默认值`；类型谓词函数封装「查找必中」逻辑。**最后手段**才是 `!` 非空断言——它把风险推给运行时（`03-everyday-types.md` 的 null 处理）。

### TS18048 — 'x' is possibly 'undefined'.（回调里收窄丢失）

```ts
// 触发：收窄在回调里失效——TS 无法保证回调执行时变量还是当时的值
let list: string[] | undefined = ['a'];
if (list) {
  [1].forEach(() => console.log(list.length));
  // error TS18048: 'list' is possibly 'undefined'.
  // 原因：let 变量在闭包里可能被重新赋值，收窄不跨函数边界保留
}
```

原因：收窄只对**当时的值**负责；`let` 可变量 + 回调 = 失效（规则细节见 `04-narrowing.md`）。

修复：先把值存进 `const` 再用——

```ts
if (list) {
  const stable = list;              // const 快照，收窄随快照固定
  [1].forEach(() => console.log(stable.length));   // OK
}
```

## 6. 隐式 any 与缺声明：TS7006 / TS7016

### TS7006 — Parameter 'x' implicitly has an 'any' type.

```ts
// 触发：noImplicitAny 下，参数没有任何类型信息且推不出来
function log(args) { console.log(args); }
// error TS7006: Parameter 'args' implicitly has an 'any' type.
```

修复：显式标注；数组解构参数、事件回调优先让上下文推断（如 React 的 `onChange={(e) => ...}` 自动推）；确实「什么都能传」用 `unknown` 而不是 `any`（`13-typescript-best-practices.md`）。

### TS7016 — Could not find a declaration file for module 'x'.

```ts
// 触发：无类型的 npm 包
import { Client } from 'my-legacy-lib';
// error TS7016: Could not find a declaration file for module 'my-legacy-lib'.
//   'node_modules/my-legacy-lib/index.js' implicitly has an 'any' type.
```

修复路线（从优到劣）：包自带类型没有 → 装 `@types/my-legacy-lib` → 项目内手写 `declare module 'my-legacy-lib' { ... }`（**完整实战见 `21-declaration-files.md` 第 5 章**）→ 应急 shorthand（整包 any，勿长用）。

## 7. 重载全不匹配：TS2769

```ts
// 触发：调用的参数不匹配任何重载签名
declare function fmt(v: string, width: number): string;
declare function fmt(v: string, opts: { pad: 'start' | 'end' }): string;

fmt('a', { width: 3 });
// error TS2769: No overload matches this call.
//   Overload 1 of 2, '(v: string, width: number): string', gave the following error.
//     Argument of type '{ width: number; }' is not assignable to parameter of type 'number'.
//   Overload 2 of 2, '(v: string, opts: { pad: "start" | "end"; }): string', gave the following error.
//     Argument of type '{ width: number; }' is not assignable to parameter of type '{ pad: "start" | "end"; }'.
//       Object literal may only specify known properties, and 'width' does not exist in type '{ pad: "start" | "end"; }'.
```

- 读法：**逐条 overload 看失败原因**，通常第一条就是最接近的真相；「Object literal may only specify known properties」提示是多余属性检查（见 `12-typescript-advanced-type-system.md` 1.2）。
- 高频根因与修复：
  1. 字面量被整体推断成宽类型 → 用 `as const` 或显式标注；
  2. 泛型参数推歪了 → 显式 `fn<T>(...)` 指定；
  3. 多余/拼错属性 → 删掉或改对；
  4. 重载顺序问题（库的锅）→ 按库文档调整调用形态。重载语法见 `05-more-on-functions.md`。

## 8. 类字段未初始化：TS2564

```ts
// 触发：strictPropertyInitialization 下，非可空字段没有在构造器里赋值
class User {
  name: string;
  // error TS2564: Property 'name' has no initializer and is not definitely assigned in the constructor.
  constructor(name?: string) {}
}
```

修复：构造器里赋值（首选）；字段给默认值；确实「外部注入/框架填」（如 ORM 实体）用 `name!: string` 明确声明承诺，或开启对应装饰器方案（Nest/TypeORM 惯例，见 `09-decorators.md`）；`useDefineForClassFields` 时代注意字段声明与初始化语义（`06-classes.md`）。

## 9. 递归爆栈：TS2589

```ts
// 触发：类型实例化深度超过上限（约 50 层），常见于深递归类型/巨型交叉
type Deep<T> = { next: Deep<T> };
type X = Deep<string>['next']['next'];   // 简例不炸，真实场景是条件类型+映射互相递归
// error TS2589: Type instantiation is excessively deep and possibly infinite.
```

原因：递归无基线或每步都在「膨胀」类型（交叉/联合相乘），实例化层数超限。

修复清单（按常用排序）：
1. **给递归加深度计费**：`type Deep<T, D extends number = 5> = D extends 0 ? unknown : { next: Deep<T, Prev[D]> }`——限制递归层数；
2. 拆中间类型：把巨型表达式拆成多个有名字的 type/interface，别一条链到底；
3. 交叉换 interface：interface 是惰性命名的，比内联交叉更省实例化（`06-classes.md`/`12 篇`）；
4. 用显式注解阻断推断链：在关键位置手动 `: ExpectedType`，别让编译器展开整棵树；
5. 实在需要：降复杂度（判别联合替代映射体操），体操红线见 `22-type-gymnastics.md` 第 6 章。

## 10. 断言失败：TS2352 / TS18013

```ts
// 触发：as 转换的两端「重叠不足」
const n = '123' as number;
// error TS2352: Conversion of type 'string' to type 'number' may be a mistake
//   because neither type sufficiently overlaps with the other.
//   If this was intentional, convert the expression to 'unknown' first.
```

- 原因：`as` 不是强转，只允许**有重叠**的类型间转换；string 与 number 无重叠。
- 修复：真要转数值就别用类型断言（`Number('123')` 运行时转换）；确实「跨域桥接」按提示走 `as unknown as T`（此时要写注释说明为何安全）；联合收窄场景优先用类型守卫替代断言（`04-narrowing.md`）。TS18013 属同族断言类报错（18xxx 新段，文案同格式，触发面更细——以编译器实际输出为准）。

## 11. 类型调试工具箱

### 11.1 hover 断点法：把复杂表达式拆成中间类型

```ts
const data = { users: [{ id: 1, tags: ['a', 'b'] }] };

type Users = typeof data['users'];        // hover：{ id: number; tags: string[]; }[]
type FirstUser = Users[number];           // hover：{ id: number; tags: string[]; }
type Tags = FirstUser['tags'];            // hover：string[]
```

- 技巧：复杂泛型调用中间插一层 `type Step1 = Foo<Bar<...>>`，hover 每一层；IDE 无法 hover 时（如字符串里），赋值给带类型注解的 const 让报错替你显示。

### 11.2 never 断言法：故意爆出真实类型

```ts
type Deep = { a?: { b?: { c?: string } } };
const x: Deep = {};

// 让 TS 把 x 的完整类型打在报错里（两侧都完整展开）：
const _probe: never = x;
// error TS2322: Type 'Deep' is not assignable to type 'never'.
//   ← 悬停/展开报错即可看到 Deep 的完整形状
// 变体：const _p: { a: { b: number } } = x;  ← 同时看到「期望形状」与「实际形状」
```

### 11.3 type Tests：vitest expectTypeOf 全套（与 17 篇衔接）

```ts
// src/gym.test-d.ts —— vitest 专用的类型测试文件（--typecheck 只跑它，不产生运行时断言）
import { expectTypeOf } from 'vitest';

const user = { id: 1, name: 'hh' };

expectTypeOf(user).toEqualTypeOf<{ id: number; name: string }>();
expectTypeOf(user.id).toEqualTypeOf<number>();
expectTypeOf(user).toExtend<{ id: number }>();        // 子集可赋值断言
expectTypeOf(user.id).toBeNumber();
```

```bash
npx vitest --typecheck   # CI 里与 tsc --noEmit 二选一或都跑（见 11-tsconfig.md）
```

### 11.4 @ts-expect-error 做负向测试（vs @ts-ignore）

```ts
// @ts-expect-error：断言「下一行必须有错」——没报错时它自己报 TS2578
// @ts-expect-error 缺少必填属性 name
const bad: { name: string } = {};

// @ts-ignore：无脑忽略下一行错误；没错误时静默通过 → 负向测试必须用 expect-error
```

```ts
// negatives.test-d.ts —— 负向测试模板：升级 TS 后若 API 放宽，测试会立刻提醒你删掉过期指令
type Parse<T> = T extends `${infer N extends number}` ? N : never;
// @ts-expect-error 字符串不是合法数字
type _bad = Parse<'abc'>;
```

- TS2578：`Unused '@ts-expect-error' directive.` —— 这就是负向测试的自检机制。

### 11.5 @total-typescript/ts-reset：修正内置类型的激进默认

```bash
npm i -D @total-typescript/ts-reset
```

```ts
// src/entry.ts —— 全量导入后，内置类型的「危险默认」被换成安全版
import '@total-typescript/ts-reset';
```

- 典型改善：`JSON.parse` 返回 `unknown`（不再是 any）、数组 `.includes` 参数收窄、`filter(Boolean)` 正确去掉 falsy 成员等（具体清单以官方 README 为准，版本敏感）。
- 它是**全局行为变更**：装进 entry 的一行会影响整个项目与库的类型观感，评估后再上，别在中途引入造成大量 diff。

## 12. 「类型对但运行炸」：类型与运行时数据的信任鸿沟

### 12.1 结构兼容导致的鸭子误配

```ts
// 语义不同、结构相同 → TS 拦不住
interface MoneyCents { amount: number }   // 单位：分
interface MoneyYuan  { amount: number }   // 单位：元
function pay(m: MoneyCents) { /* 按"分"扣款 */ }

const yuan: MoneyYuan = { amount: 100 };  // 本意 100 元
pay(yuan);   // 类型全绿；运行时按 1 元扣款 —— 结构化类型的代价（12 篇 1.1）
```

修复：品牌类型（branded types）把「名义边界」请回来——

```ts
type Cents = number & { readonly __unit: 'cents' };
type Yuan  = number & { readonly __unit: 'yuan' };
const asCents = (n: number): Cents => n as Cents;      // 唯一换汇入口

function pay(m: Cents) {}
const yuan = 100 as Yuan;
pay(yuan);
// error TS2345: Argument of type 'Yuan' is not assignable to parameter of type 'Cents'.
// 想硬转必须 as unknown as Cents —— 绕过点肉眼可见，便于 review
```

### 12.2 API 边界必须运行时校验：zod parse

TS 类型在运行时**不存在**（`20-tsx-and-runtime.md`），接口返回的数据没有任何保证——「类型对」只代表你**相信**它对。

```ts
// api/user.ts —— 用 zod 在边界处 parse，类型与校验单一来源
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.enum(['admin', 'member']),
});
export type User = z.infer<typeof UserSchema>;   // { id: number; name: string; role: 'admin' | 'member' }

export async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return UserSchema.parse(await res.json());   // 运行时校验：不符则 throw，而不是带毒 downstream
}
```

- 分工：**TS 管「代码内部」的传导，schema 校验管「外部输入」的入口**（HTTP 响应、环境变量、URL 参数、localStorage）。zod 3/4 的 `z.object/z.infer/parse` 均可用，版本敏感处以官方文档为准。
- 与 `13-typescript-best-practices.md` 的 any 治理同源：`any` 是「放弃校验」，`parse` 是「校验后获得类型」；两者都消灭「假装的类型安全」。

## 13. 错误码补十讲（unknown / 索引 / 解构 / 枚举 / 工程化）

> 本节所有报错原文均在 tsc 5.9.3 实测复核；同一场景换码的版本差异在条目内标注。

### 13.1 TS2571 — Object is of type 'unknown'.

```ts
// 触发：unknown 值不做收窄就访问属性/调用（与 any 的正面区别）
declare const arr: unknown[];
arr[0].x;
// error TS2571: Object is of type 'unknown'.
```

原因：unknown 是「安全版 any」——除赋值、比较、收窄外任何使用都拒绝（`04-narrowing.md`）。

修复：typeof/in/自定义守卫收窄，或边界处 zod parse 换成具体类型（12.2）。版本提示：**5.9 里对 unknown 变量直接 `.x` 常报 TS18046（`'data' is of type 'unknown'.`），经 unknown 数组元素等表达式位仍报 TS2571**——同一族两个码并存，别背号码，看文案。

### 13.2 TS7053 — Element implicitly has an 'any' type because expression of type 'string' can't be used to index type ...

```ts
// 触发：noImplicitAny 下用动态字符串索引「键有限」的对象
const sizes = { s: 1, m: 2 };
const key: string = 's';
sizes[key];
// error TS7053: Element implicitly has an 'any' type because expression of type 'string'
//   can't be used to index type '{ s: number; m: number; }'.
//   No index signature with a parameter of type 'string' was found on type '{ s: number; m: number; }'.
```

原因：键是运行时才知道的 string，而对象类型只有 s/m 两个键——TS 拒绝「假装合法」的索引。

修复四选一：`key as keyof typeof sizes`（先 `Object.hasOwn` 判存在再断言）；类型改 `Record<string, number>`（接受任意键）；把 key 的类型收窄成 `'s' | 'm'`；用 `Map<string, number>`。与 TS2339 的分工：**2339 是字面量键写错（编译期可查），7053 是动态键合法性无法证明**。

### 13.3 TS2783 — 'x' is specified more than once, so this usage will be overwritten.

```ts
// 触发一：显式属性写在「必然覆盖它」的 spread 前面
const defaults = { retries: 3, timeout: 1000 };
const merged = { retries: 1, ...defaults };
// error TS2783: 'retries' is specified more than once, so this usage will be overwritten.
//   （伴随提示：This spread always overwrites this property.）

// 触发二（高频）：JSX 里 props 放在 {...rest} 前面
// <Select value={'x'} {...selectProps} />   ← selectProps 的类型必有 value 时报同款
```

原因：JS 对象字面量**后写的赢**——TS 看出 spread 类型里必有该键，你前面写的那个值是永远不生效的死代码。

修复按意图：想覆盖默认值就把显式属性**移到 spread 之后**（`{ ...defaults, retries: 1 }`）；想保留默认值就把 spread 的类型改 `Partial<T>`（TS 无法证明必覆盖，报错消失且诚实）；想「仅在 undefined 时兜底」用 `value ?? defaults.value` 显式表达。

易错点：**普通解构默认值不触发此码**——`const { retries = 1 } = opts`（opts.retries 类型为必有 number）在 5.9 实测无报错，TS 不把「解构默认值被实参覆盖」当错误（那是运行时正常语义）；2783 只针对「同一字面量里 spread 必然覆盖」这一种死代码。

### 13.4 TS2367 — This comparison appears to be unintentional because the types 'X' and 'Y' have no overlap.

```ts
// 触发：两侧类型完全无交集的比较（TS 认定你写错了）
type Status = 'active' | 'banned';
function handle(s: Status) {
  if (s === 'deleted') {}
}
// error TS2367: This comparison appears to be unintentional because the types
//   '"active" | "banned"' and '"deleted"' have no overlap.
```

原因：收窄后两侧没有公共成员——99% 是拼写错、枚举值漏了、或比较写反。

修复：改对值；确认业务确实新增了状态 → 扩充联合（这时候报错是在提醒你改类型而不是硬比）；真的要跨类型比较（如 `unknown` 参数按运行时判断）先把比较对象收窄成 `string`/`unknown` 再比。反向用法：TS2367 常被**故意**当穷尽性哨兵——`if (kind !== 'circle' && kind !== 'square')` 处理完所有成员后再比较会触发它，提示你多写或漏写（与 never 穷尽法互补，`04-narrowing.md`）。

### 13.5 TS2551 — Property 'x' does not exist on type 'Y'. Did you mean 'z'?

```ts
// 触发：属性不存在，但编译器在类型上找到了一个拼写相近的名字
const s = 'hi';
s.toUperCase();
// error TS2551: Property 'toUperCase' does not exist on type '"hi"'. Did you mean 'toUpperCase'?
```

原因：TS2339 的「智能提示版」——找不到属性时编译器跑一次模糊匹配，相近就多送一句 Did you mean。

修复：按提示改名即可（90% 是拼写错）；另一类真实根因是「属性存在但被访问错位置」——对象在联合的另一个成员上（先收窄）、或者拼的是方法实际在的原型上（如对 DOM 元素调 `closest` 却标成了别家类型）。

易错点：提示**不是必然出现**——`{} as Cfg` 上访问 `hots`（类型有 host/hostname）实测只报普通 TS2339：建议引擎要求相似度达标，别指望每类错都有 Did you mean。

### 13.6 TS2307 — Cannot find module 'x' or its corresponding type declarations.

```ts
// 触发：解析不了模块本身，或模块有了但类型解析不了
import { x } from 'totally-missing-pkg';
// error TS2307: Cannot find module 'totally-missing-pkg' or its corresponding type declarations.
```

原因分两层：① 包真没装/装错位置（node_modules 缺、monorepo workspace 没链接）；② 包在但**类型**解析不了——无 d.ts（接 TS7016 的修法）、exports 字段没给 types 出口、moduleResolution 与包的导出方式不匹配（10-modules.md）。

修复排查序：包装了吗（`pnpm ls pkg`）→ 装了为何类型找不到（查 `exports` 的 `types` 条目与 tsconfig `moduleResolution` 是否配套，`11-tsconfig.md`）→ 还不行走 `21-declaration-files.md` 补声明。**与 20 篇的衔接**：Node 原生 strip 下 `.ts` 源码互相导入，tsc 侧需要 `allowImportingTsExtensions` + `moduleResolution: nodenext/bundler` 才不报 2307（TS5097 见 13.10）。

### 13.7 TS1361 — 'x' cannot be used as a value because it was imported using 'import type'.

```ts
// 触发：import type 进来的绑定被当值用
import type { mk } from './mk';
mk();
// error TS1361: 'mk' cannot be used as a value because it was imported using 'import type'.
```

原因：`import type` 整句在编译后被擦除，运行时不存在任何绑定（20 篇第 16 章④的擦除规则）——用它调用/构造/new 都会炸，TS 在编译期拦下。

修复：改成普通 `import { mk }`；或与类型导入分行（`import type { Config }` + `import { parse }`），不要图省事把值也塞进 `import type`。

易错点：**纯类型符号误当值用报的是 TS2693**（`'Foo' only refers to a type...`），1361 专指「import type 导入、但它在源模块里其实是个值」的场景，两者文案不同注意区分。**与 const enum 的关系勘误**：const enum 在 isolatedModules 下不能用报的是 **TS2748**（`Cannot access ambient const enums when 'isolatedModules' is enabled.`，实测 tsc 5.9）——ambient const enum 的值会被内联、跨文件编译时单文件转译器（isolatedModules 的前提假设）无法内联别文件的枚举值，这是 2748 的根因；解法：普通 enum、as const 对象，或关 isolatedModules（不建议）。新版 TS 已普遍建议用 as const 对象替代 const enum（07 篇）。

### 13.8 TS2554 — Expected 2 arguments, but got 1.

```ts
// 触发：实参个数与签名不符
function two(a: number, b: number) { return a + b; }
two(1);
// error TS2554: Expected 2 arguments, but got 1.
```

原因与修复：数错了/漏传就补齐；签名该宽松就改可选（`b?: number`）或默认值（`b = 0`）；剩余参数用 `...rest`。回调场景的变体：把 `(value, index)` 的回调传给了只回调 value 的 API 时不会报（TS 允许参数少的函数），反方向（要求 2 参给了 1 参的回调）才报——**「回调参数可以少写，不能多写」**，这是逆变的一个体感表现（12 篇第 2 章）。带默认值/可选参数的函数，`Expected at least 1 arguments, but got 0.` 是同族变体文案。

### 13.9 TS1061 — Enum member must have initializer.

```ts
// 触发：字符串/计算成员后面的成员想靠「自动 +1」续命
enum Direction { Up = 'up', Down }
// error TS1061: Enum member must have initializer.  ← Down 处
enum Level { A = someRuntimeFn(), B }
// 同款：计算成员（运行时值）之后无法自动递增，B 必须显式初始化
```

原因：自动递增只在「数值常量成员」之后有效（`A, B = 2, C` 合法）；字符串成员或运行时计算值打断了计数基准，后续成员必须显式给值。

修复：给后续成员显式初始化；或者这根本是「该用 as const 对象」的信号——混合 string/number 语义的 enum 本身就是设计坏味道（07 篇）。

### 13.10 TS5055 / TS5097 — 编译器轨道两兄弟

```ts
// TS5055 —— tsc 想写的输出文件覆盖了输入文件
// 触发：allowJs + 无 outDir，源目录里 .ts 与同名 .js 并存（常见于「曾直接 emit 进源码目录」的项目）
// error TS5055: Cannot write file '.../a.js' because it would overwrite input file.
//   （变体 TS5056: ... because it would be overwritten by multiple input files.）
```

修复：**outputs 必须与 inputs 分离**——`outDir: "dist"` + `rootDir: "src"`（11 篇）；临时救场把 stale 的 .js 删掉再跑；长期靠 tsconfig 把 emit 目标钉死，别让产物落在源码目录。

```ts
// TS5097 —— import 路径以 .ts 结尾但开关没开
import { bar } from './bar.ts';
// error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
```

原因：tsc 默认把 `.ts` 结尾的导入视为「发布产物会带 .ts 路径」的隐患（tsc emit 时**不**改写 import 路径），所以要求显式开关 + `noEmit`（或 `emitDeclarationOnly`）。

修复：Node 原生 strip / tsx 项目（源码直接跑）→ `"allowImportingTsExtensions": true` + `"noEmit": true`，`moduleResolution` 用 `nodenext` 或 `bundler`（20 篇第 4 章）；发布库（tsc emit）→ 别写 `.ts` 后缀或改走 tsup/bundler 轨道（17 篇）。

## 14. 真实 bug 复盘 3 例：类型全绿、线上爆炸

三例的共同结构：**每一步单看都「合法」，合起来是一条从源码到事故的合法路径**。复盘目标是识别这条路径的第一环。

### 14.1 收窄被函数边界切断：提取判断函数后失去谓词

```ts
// 事故代码：一次「顺手重构」引发的空引用崩溃
interface User { id: number; name: string | null }

function isValid(u: User | null): boolean {        // 重构①：把判断抽成函数
  return u !== null && u.name !== null;
}

function greet(u: User | null) {
  if (isValid(u)) {
    console.log(u.name.toUpperCase());             // 重构②后上线：u.name possibly null？
  }
}
```

- 看似 `isValid` 里判过 null，但返回类型只是 `boolean`——**TS 无法透过普通函数看到内部判断**，`greet` 里 u 仍是 `User | null`，若原代码内联判断被抽走且加了 `!` 或开关了非严格模式，这个 null 会一路流到 `u.name.toUpperCase()` 运行时 `TypeError: Cannot read properties of null`。
- 编译期能拦吗：`strictNullChecks` 开着时报 TS18047（`'u' is possibly 'null'`）——**别为了「眼不见为净」关掉它或随手 `!`**；重构后报错了，说明是类型在提醒，不是类型碍事。
- 正确形态：**类型谓词**让判断函数把收窄「带出来」：

```ts
function isPresent(u: User | null): u is User {    // u is User：谓词签名
  return u !== null && u.name !== null;
}
function greet(u: User | null) {
  if (isPresent(u)) {
    console.log(u.name.toUpperCase());             // OK：u 已被收窄为 User
  }
}
```

- 更细的收口：连 `name` 一起保——`u is User & { name: string }`，谓词承诺的不只是「非 null」而是「完整形状」。注意谓词函数体写错（谎报 `true`）TS 不查——谓词是承诺不是证明，逻辑复杂时补运行时测试。

### 14.2 any 从 JSON.parse 渗透整个调用链

```ts
// 事故代码：一个 any 污染四个文件，直到生产环境 undefined.x
// api/orders.ts
export async function getOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  return res.json();            // res.json(): Promise<any> —— 类型检查在这里失明
}

// report.ts
export function topOrder(orders: Order[]) {
  return orders.reduce((a, b) => (a.total > b.total ? a : b));   // 一切都「编译通过」
}

// dashboard.tsx
const orders = await getOrders();
show(topOrder(orders));
// 后端某天改返回 { data: [...] }，res.json() 悄悄给了个对象——
// orders.reduce is not a function / a.total of undefined，炸在用户屏幕上
```

- 根因链：`res.json()` 的返回类型是 `any` → 直接 `return` 顶掉了 `Promise<Order[]>` 的检查（any 可赋给一切，**任何**返回类型都拦不住）→ 后续每个使用点都拿到「带 Order 假面」的 any → 协议变更在编译期零感知。
- 识别技巧：全链路 hover 一遍——若中间某层的类型是 any 或「过于完美」，源头多半有个 any（含 `JSON.parse`、`res.json()`、事件 `e.target`、`process.env` 四大出生地）。
- 正确形态：边界处 `unknown` + 校验（分级修复）：

```ts
// 最低配置：断掉 any 的出生
export async function getOrders(): Promise<unknown> {   // 诚实的返回类型
  const res = await fetch('/api/orders');
  return res.json();                                    // unknown 不再向下渗透
}

// 正式配置：边界 parse，一步到位（12.2 的 zod 模式）
const OrdersSchema = z.object({ id: z.number(), total: z.number() });
export async function getOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  return z.array(OrdersSchema).parse(await res.json());   // 协议变更 → 上线前炸在测试里，而不是用户屏幕上
}
```

- 一句话沉淀：**any 是类型系统的短路开关**——它不产生错误，它让这条路径上的所有检查静默；治理见 `13-typescript-best-practices.md`，@total-typescript/ts-reset 可把 `JSON.parse` 的默认返回改成 unknown（11.5）。

### 14.3 `as` 断言掩盖协议不匹配，直到运行时 undefined

```ts
// 事故代码：接口文档说有 profile，实际后端v2 改成了嵌套结构
interface UserProfile { id: number; nickname: string; avatar: string }

export function toProfile(raw: unknown): UserProfile {
  return raw as UserProfile;         // 评审时「类型对得上」就过了
}

// 某天 v2 接口把 avatar 挪进 profile.images[0]：
const p = toProfile(await res.json());
document.querySelector('img')!.src = p.avatar;   // 运行时 undefined —— <img src="undefined">
```

- `as` 的语义是「**信我，别查**」：它把两侧类型差异整体静音，`{ id, nickname, images }` 硬变成 `{ id, nickname, avatar }` 的承诺在编译期零报错（只有第 10 章 TS2352 那种「重叠度不足」的转换才被拦）——于是协议漂移被 `as` 这一行挡在了所有检查之外。
- 三个递进修复：
  1. **去掉 as，让结构自己对账**：`const p: UserProfile = raw;` —— raw 是 unknown 时仍报错，但报错会**指出具体缺哪个键**（TS2741/2739），而不是全绿；
  2. **`satisfies` 替代 `as` 做字面量检查**：`const p = raw satisfies UserProfile;` —— 保留推断、额外验形状，多余键/缺键都报；
  3. **外部输入一律 zod parse**（12.2）：协议变更在边界处 throw，带明确的字段级错误信息。
- 停用清单：`as` 只保留两类用途——TS2589 级别推导不了的中间桥接（带注释说明为何安全）、与第三方无类型边界的受控转换（带注释 + 测试）；**出现在「处理外部数据」路径上的每一个 `as` 都值得在 review 里点开看**。

## 15. 一句话总结

> 报错阅读的总纲是「第一行分两侧、嵌套读最里层、重载逐条看、行号不等于根因」：TS2322/2345/2741 是赋值不兼容三兄弟、TS2339/2304 是「找不到」要靠判别收窄与 import、TS2531/2532/18048 是空值与闭包收窄丢失（const 快照修复）、TS7006/7016 指向隐式 any 与缺声明（根治靠 21 篇）、TS2769 逐条读重载、TS2589 用深度计费拆解递归、TS2352 提醒你 as 不是强转；类型调试三板斧——hover 断点拆中间层、never 断言爆两侧、vitest expectTypeOf + @ts-expect-error 负向测试固化行为；最后记住 TS 类型运行时消失：结构兼容挡不住语义误配（上品牌类型），外部数据必须 zod parse——类型安全是「代码内传导 + 边界运行时校验」的合成品，不是编译器单方面给的承诺。
