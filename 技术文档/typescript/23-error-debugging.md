# 23. TS 报错解读与类型调试（高频错误码 15 连讲 + 类型调试工具箱）

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

## 13. 一句话总结

> 报错阅读的总纲是「第一行分两侧、嵌套读最里层、重载逐条看、行号不等于根因」：TS2322/2345/2741 是赋值不兼容三兄弟、TS2339/2304 是「找不到」要靠判别收窄与 import、TS2531/2532/18048 是空值与闭包收窄丢失（const 快照修复）、TS7006/7016 指向隐式 any 与缺声明（根治靠 21 篇）、TS2769 逐条读重载、TS2589 用深度计费拆解递归、TS2352 提醒你 as 不是强转；类型调试三板斧——hover 断点拆中间层、never 断言爆两侧、vitest expectTypeOf + @ts-expect-error 负向测试固化行为；最后记住 TS 类型运行时消失：结构兼容挡不住语义误配（上品牌类型），外部数据必须 zod parse——类型安全是「代码内传导 + 边界运行时校验」的合成品，不是编译器单方面给的承诺。
