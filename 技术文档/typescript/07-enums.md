# 7. Enums（枚举）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「Enums」，https://www.typescriptlang.org/docs/handbook/enums.html ，© Microsoft；const enum 坑补充自官方 isolatedModules/tsconfig Reference 与 Babel/esbuild/SWC 文档；示例以 TS 5.x 下验证，标注了预期输出与编译报错）
> 关联：`03-everyday-types.md`（字面量联合的基础）、`06-classes.md`（类内枚举常量）、`08-creating-types-from-types.md`（`as const` + `keyof typeof` 的类型提取）、`10-modules.md` 与 `11-tsconfig.md`（isolatedModules/verbatimModuleSyntax）、`15-typescript-new-features.md`（`satisfies`）；Nest 角色枚举见 `/Users/hh/offer/技术文档/nest/03-security`，OpenAPI 枚举见 `09-recipes/openapi.md`。

## 1. 数字枚举（Numeric Enums）

```ts
// numeric.ts
enum Direction {
  Up = 1,
  Down,     // 2（自动 +1）
  Left,     // 3
  Right,    // 4
}
console.log(Direction.Up, Direction.Right); // 1 4
```

自增规则与限制：

1. 不写初始化器时**从 0 开始**（`enum E { A, B }` → A=0, B=1）；有初始化器的成员之后，后续成员 = 前一成员 + 1。
2. 无初始化器的成员只能出现在**首位**或"已数字初始化的常量成员"之后。
3. 成员值可以是**计算成员**（computed member，运行时求值），但计算成员之后的所有成员**必须显式初始化**：

```ts
// computed.ts
function getSomeValue(): number { return 10; }
enum E {
  A = getSomeValue(), // 计算成员（非常量表达式）
  // B,               // ❌ TS1061: Enum member must have initializer.
  B = A + 1,          // ✅ 计算成员之后必须显式初始化
}
console.log(E.B); // 11
```

## 2. 反向映射与编译产物展开

数字枚举编译后是**真实对象**，且带**反向映射**（值 → 名）。编译产物是一个 IIFE（理解它才能理解后面 const enum 的坑）：

```ts
// enum.ts
enum Direction {
  Up, // 从 0 开始
  Down,
}
```

```js
// tsc 编译产物（target ES5 时代写法，最能看清结构）
var Direction;
(function (Direction) {
  Direction[Direction["Up"] = 0] = "Up";    // 先 Direction["Up"]=0（正向）
  Direction[Direction["Down"] = 1] = "Down"; // 赋值表达式返回 1，再 Direction[1]="Up"（反向）
})(Direction || (Direction = {}));
```

```ts
// 反向映射：数字 → 名字
let a = Direction.Up;
let nameOfA = Direction[a];
console.log(a, nameOfA); // 0 "Up"
```

- `Enum[0] === "Up"`——只有数字枚举有反向映射（因为 JS 对象键只能是字符串，数字键会被转成字符串，恰好能双向写）。
- TS 5.x 下编译产物会带 `/* Up */` 注释与 `"use strict"` 包装，结构不变；`target: ESNext` 时输出改为对象字面量风格但语义一致。

## 3. 字符串枚举（String Enums）

```ts
// string.ts
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT",
}
console.log(Direction.Up); // "UP"
```

- 每个成员必须**显式初始化**为字符串字面量（或另一个字符串枚举成员）——**不支持计算值**，也没有自增。
- 调试/序列化友好：日志、DB 里看到 `"UP"` 而不是 `0`。
- ⚠️ **字符串枚举无反向映射**：`Direction["UP"]` 报错 TS7053。编译产物只有单向：

```js
var Direction;
(function (Direction) {
  Direction["Up"] = "UP";
})(Direction || (Direction = {}));
```

- 官方点名的额外收益：字符串枚举成员的值可读，running 代码里 `Direction.Up` 被内联成 `"UP"` 也能看懂（数字枚举内联成 `0` 就完全失义）。

## 4. 异构枚举（Heterogeneous Enums）

```ts
// hetero.ts
enum BooleanLikeHeterogeneousEnum {
  No = 0,
  Yes = "YES",
}
```

- 技术上合法（除非要依赖 JS 运行时行为），**官方建议避免**：数字与字符串成员混在一起，类型是 `E.No | E.Yes` 但心智负担大，反向映射只对数字成员生效。
- 审查代码时看到异构枚举，基本都应拆成两个枚举或改字面量联合。

## 5. const enum 与三重坑

```ts
// const-enum.ts
const enum Direction {
  Up, Down, Left, Right,
}
let d = [Direction.Up, Direction.Down];
// 编译产物：var d = [0 /* Up */, 1 /* Down */];
// —— 枚举对象本身被完全移除，成员值内联进使用处
```

- const enum 只能含**常量表达式**成员（不能有计算成员）；编译后不留运行时对象，也不可 `import` 后当对象遍历。
- **官方明确警告的三重坑**：

**坑 ① 与 isolatedModules 不兼容**：`isolatedModules`（Babel/SWC/esbuild/Jest 等单文件转译的标配）下，访问 ambient const enum 直接报错：

```txt
TS2748: Cannot access ambient const enums when the '--isolatedModules' flag is provided.
```

**坑 ② 单文件转译器无法内联 → 运行时 undefined**：Babel/SWC/esbuild 逐文件转译，看不到"别的文件里定义的枚举对象"，跨文件使用 `const enum` 成员时**编译通过、运行时爆炸**：

```ts
// a.ts
export const enum Status { Ok = 1, Fail = 2 }

// b.ts（由 Babel/esbuild 转译）
import { Status } from "./a";
console.log(Status.Ok); // 编译后仍是 Status.Ok，但 Status 没有运行时对象
// → TypeError: Cannot read properties of undefined (reading 'Ok')
```

**坑 ③ 跨包内联值版本不一致**：库 A 发布 `.d.ts`，消费方编译时把成员值**内联**进自己的产物；之后 A 升级改了枚举值而消费方没重编译——两边的"同一个枚举"对不上号，这类 bug 极难排查。

规避手段：ESLint 禁用 const enum（如 `no-restricted-syntax` 拦 `TSEnumDeclaration[const=true]`）；确需保留时用 `preserveConstEnums: true` 让 tsc 额外产出普通枚举对象，并在 `.d.ts` 中去掉 `const`。**更简单的做法：直接不用 const enum**（第 8 节）。

## 6. 环境枚举（Ambient Enums）

```ts
// ambient.d.ts
declare enum Enum {
  A = 1,
  B,        // 注意：ambient 中 B 视为计算成员，必须有运行时真实值支撑
  C = 2,
}
```

- `declare enum` 描述**已存在**的枚举形状（如全局脚本库），不产生任何运行时代码。
- 与普通枚举的差异：ambient 里**无初始化器的非 const 成员始终视为计算成员**（普通枚举里会自动 +1）。
- `declare const enum` + isolatedModules 即第 5 节坑 ① 的来源，类型包里应避免。

## 7. 枚举作为类型：成员类型、联合与无效比较捕获

所有成员都是"字面量"（无初始化器 / 字符串字面量 / 数字字面量 / 一元负号数字）时，枚举升级为"字面量枚举"：

```ts
// member-type.ts
enum ShapeKind {
  Circle,
  Square,
}
interface Circle {
  kind: ShapeKind.Circle; // 单个成员本身就是类型
  radius: number;
}
function draw(c: Circle) {
  if (c.kind !== ShapeKind.Circle) { /* 不可达 */ }
}
```

TS 能利用成员联合捕获逻辑错误：

```ts
// invalid-compare.ts
enum E {
  Foo,
  Bar,
}
function f(x: E) {
  // if (x !== E.Foo || x !== E.Bar) {}
  // ❌ TS2367: This comparison appears to be unintentional because the types
  //    'E.Foo' and 'E.Bar' have no overlap.（恒为 true，必有笔误）
}
```

判别联合的标签字段也常由枚举成员充当（收窄流程见 04-narrowing.md 第 9 节）。

## 8. 三方案对比：union of literals vs enum vs as const object

```ts
// 方案 A：字面量联合（最小、零运行时）
type DirectionA = "up" | "down";
function runA(dir: DirectionA) {}
runA("up"); // ✅

// 方案 B：enum（运行时对象 + 类型）
enum DirectionB { Up = "up", Down = "down" }
function runB(dir: DirectionB) {}
runB(DirectionB.Up); // ✅

// 方案 C：as const 对象 + typeof 提取（官方手册推荐形态）
const ODirection = { Up: 0, Down: 1, Left: 2, Right: 3 } as const;
type DirectionC = (typeof ODirection)[keyof typeof ODirection]; // 0 | 1 | 2 | 3
function runC(dir: DirectionC) {}
runC(ODirection.Up); // ✅
```

| 维度 | 字面量联合 | enum | `as const` 对象 |
|---|---|---|---|
| 运行时产物 | 无（内联字符串） | IIFE 对象 | 普通对象（可 tree-shake） |
| 作参数类型 | 直接写 | `E`（独立命名空间） | 需 `typeof O[keyof typeof O]` 提取 |
| 遍历/反向映射 | 需 `as const` 数组辅助 | ✅ `Object.values` / 数字反向 | ✅ `Object.values`，无反向 |
| isolatedModules/转译器 | ✅ 安全 | ⚠️ const enum 有坑 | ✅ 安全 |
| 成员必须成组演进 | ✅ 加值即加成员 | ✅ | ✅ |
| 生态（Nest/TypeORM 装饰器要"值"） | 需转数组 | ✅ 直接可用 | ✅ 直接可用 |

`satisfies`（TS 4.9+）补上方案 C 的最后一块——既检查值的形状，又不丢失字面量推断：

```ts
// satisfies.ts
export const OrderStatus = {
  Pending: "pending",
  Paid: "paid",
  Shipped: "shipped",
  Cancelled: "cancelled",
} as const satisfies Record<string, string>; // ✅ 检查"全是 string"，保留每个值的字面量类型
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
// "pending" | "paid" | "shipped" | "cancelled"
// 写错一行的值类型（如 Pending: 1）会在 satisfies 处报 TS2322
```

> 官方观点：enum 与 `as const` 对象都可用；新代码更倾向**字面量联合 / `as const satisfies` 对象**，贴近 JS 未来、零语法依赖。官方手册在 enum 替代处演示的正是 `as const` 对象 + `(typeof O)[keyof typeof O]` 组合（`keyof` 机制见 08 篇第一章）。

## 9. 什么时候仍值得用 enum

1. **框架/ORM 要求"运行时值对象"**：Nest 的 `@ApiProperty({ enum: OrderStatus })`、`@Roles(AuthRole.Admin)`（`nest/03-security`），TypeORM/Prisma 的 `@Column({ type: "enum", enum: OrderStatus })`——装饰器元数据要的是真实对象，字面量联合给不了。
2. **需要反向映射**：数字枚举 `E[value]` 查名字（日志解析、协议调试）。
3. **团队已有大量 enum 且行为正常**：普通（非 const）enum 的坑有限，改造成本 > 收益时保持一致。
4. 反之：纯类型层的"状态集合"、前端 tree-shaking 敏感的包、被 Babel/Jest 转译的库——选第 8 节方案 A/C。

## 10. 实战：OpenAPI/DB 值映射封装

```ts
// order-status.ts
export enum OrderStatus {
  Pending = "pending",
  Paid = "paid",
  Shipped = "shipped",
  Cancelled = "cancelled",
}

// ① 展示层映射：Record<枚举, string> 强制覆盖所有成员——加新状态时这里漏写会编译报错
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "待支付",
  [OrderStatus.Paid]: "已支付",
  [OrderStatus.Shipped]: "已发货",
  [OrderStatus.Cancelled]: "已取消",
};

// ② 外部输入解析：运行时校验 + 类型收窄（见 04 篇）
export function parseOrderStatus(raw: string): OrderStatus | undefined {
  return Object.values(OrderStatus).find((v) => v === raw);
}

// ③ 非法值兜底：入口层（Pipe/Parser）调用
export function toOrderStatus(raw: string): OrderStatus {
  const status = parseOrderStatus(raw);
  if (status === undefined) throw new Error(`非法订单状态: ${raw}`);
  return status;
}

// 使用
console.log(ORDER_STATUS_LABEL[OrderStatus.Paid]); // 已支付
console.log(parseOrderStatus("paid"));  // "paid"
console.log(parseOrderStatus("oops"));  // undefined
```

Nest/OpenAPI 侧直接把枚举交给装饰器（完整链路见 `/Users/hh/offer/技术文档/nest/09-recipes/openapi.md`）：

```ts
@ApiProperty({ enum: OrderStatus, description: "订单状态" })
status: OrderStatus;
```

模式要点：**枚举管"合法值集合"，`Record<E, T>` 映射表管"每值行为"，parse 函数管"边界校验"**——三件套互相锁死，新增枚举成员时编译器逼你补齐 LABEL 与所有 switch。

## 11. 要点速查

| 形态 | 写法 | 反向映射 | 主要坑 |
|---|---|---|---|
| 数字 | `enum E { A, B }` | ✅ `E[0]` | 内联成 0 失义；计算成员后必须显式初始化 |
| 字符串 | `enum E { A = "a" }` | ❌ | 成员必须字面量初始化 |
| 异构 | `enum E { A = 0, B = "b" }` | 部分 | 官方建议避免 |
| const | `const enum E {...}` | 编译内联 | isolatedModules / 转译器 / 跨包版本三重坑 |
| ambient | `declare enum E {...}` | 无代码 | 无初始化器成员视为计算成员 |
| 替代 | `as const satisfies` 对象 / 字面量联合 | 无 | 提取类型要 `typeof O[keyof typeof O]` |

> 跨语言对比：Java 的 enum 是完整类（可带方法/字段/实现接口）、C# 的 enum 是值类型、Rust 的 enum 是代数数据类型（`Option/Result` 即它，配 match 穷尽检查）——TS 的 enum 形似 C# 而本质是**普通 JS 对象**，且官方正引导生态走向字面量联合；Rust 风格的"带数据枚举"在 TS 里对应的是**判别联合**（见 04 篇）。

## 12. 常见坑汇总

1. 数字枚举反向映射误导："枚举值"当字符串用会拿到名字而不是值（第 2 节）。
2. 计算成员之后的成员忘写初始化器：`TS1061`（第 1 节）。
3. 以为字符串枚举也有反向映射：`Direction["UP"]` 报 TS7053（第 3 节）。
4. const enum + Babel/SWC/esbuild 跨文件使用：编译通过、运行时 `Cannot read properties of undefined`（第 5 节坑 ②）。
5. const enum 跨包内联版本漂移，改了枚举值没重编译（第 5 节坑 ③）。
6. 库类型包里 `declare const enum` 撞上 isolatedModules：`TS2748`（第 5、6 节）。
7. 异构枚举混数字与字符串，反向映射行为不一致（第 4 节）。
8. `x !== E.Foo || x !== E.Bar` 恒真逻辑被 TS2367 抓出——这是枚举字面量化的福利不是 bug（第 7 节）。
9. 用字面量联合对接需要"值对象"的装饰器（OpenAPI/TypeORM）拿不到元数据——换 enum 或 as const 对象（第 9 节）。
10. `Record<OrderStatus, string>` 映射表漏成员：编译期即报错，别用 `Partial` 放过它（第 10 节）。

## 13. 衔接

- 字面量联合与 `null`/`undefined` 的基础见 `03-everyday-types.md`；判别联合（枚举标签的主要去向）见 `04-narrowing.md`。
- `as const`/`typeof`/`keyof` 的类型提取机制完整展开见 `08-creating-types-from-types.md`；`satisfies` 见 `15-typescript-new-features.md`。
- 类内使用枚举常量（如权限位）见 `06-classes.md`；`isolatedModules`/`preserveConstEnums` 等编译开关见 `11-tsconfig.md` 与 `10-modules.md`。
- Nest 角色权限枚举见 `/Users/hh/offer/技术文档/nest/03-security`，`@ApiProperty({ enum })` 与 DTO 校验见 `09-recipes/openapi.md` 与 `09-recipes/validation.md`。

## 14. 一句话总结

> 枚举是 TS 里"既有类型又有运行时对象"的少数语法：数字枚举靠 IIFE 建立双向映射、字符串枚举值可读但单向、const enum 用内联换体积却埋下 isolatedModules/单文件转译/跨包版本三重雷——所以现代 TS 的默认答案是**字面量联合或 `as const satisfies` 对象**，只有当框架装饰器（Nest/TypeORM/OpenAPI）需要真实值对象、或需要反向映射时，才回到普通（非 const）enum。
