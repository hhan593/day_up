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

**坑 ② 单文件转译器无法内联 → 运行时崩溃/undefined**：Babel/SWC/esbuild 逐文件转译，看不到"别的文件里定义的枚举对象"，跨文件使用 `const enum` 时**编译通过、运行时爆炸**：

```ts
// a.ts
export const enum Status { Ok = 1, Fail = 2 }

// b.ts（单文件转译，无类型信息）
import { Status } from "./a";
console.log(Status.Ok); // 声明被剥离/未生成对象时，Status 在运行时是 undefined
// → TypeError: Cannot read properties of undefined (reading 'Ok')
```

各家行为不一致更添乱：esbuild/Babel 把 const enum **当普通枚举**处理（对象保留但内联收益消失）；SWC 历史版本直接剥离声明，跨文件引用直接 ReferenceError；`declare const enum`（纯 .d.ts）则**必定**没有运行时对象。共同结论：跨转译器/跨包分发**不能依赖 const enum**。

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

## 11. API 边界双向映射实战：DB ↔ API ↔ UI 三层值映射

真实系统里三层各说各的"方言"——DB 沿用遗留系统的大写值、API 对外契约用小写、UI 要中文文案。**防腐层（anti-corruption layer）** 的纪律：方言只允许出现在映射表里，领域代码只见统一的 enum。

```ts
// order-status-domain.ts —— 领域中枢：内部统一用这个 enum（值即 API 契约值）
export enum OrderStatus {
  Pending = "pending", Paid = "paid", Shipped = "shipped", Cancelled = "cancelled",
}
// DB 方言（遗留大写蛇形值），独立成类型，禁止在映射层之外出现
export type DbOrderStatus = "PENDING" | "PAID_DONE" | "SHIPPED_OUT" | "ORDER_CANCELLED";
```

```ts
// db-mapping.ts —— DB 防腐层：整个代码库只有这两个表认识 DB 方言
import { OrderStatus, type DbOrderStatus } from "./order-status-domain.js";

export const DB_TO_STATUS: Record<DbOrderStatus, OrderStatus> = {
  PENDING: OrderStatus.Pending,      PAID_DONE: OrderStatus.Paid,
  SHIPPED_OUT: OrderStatus.Shipped,  ORDER_CANCELLED: OrderStatus.Cancelled,
};
export const STATUS_TO_DB: Record<OrderStatus, DbOrderStatus> = {
  [OrderStatus.Pending]: "PENDING",     [OrderStatus.Paid]: "PAID_DONE",
  [OrderStatus.Shipped]: "SHIPPED_OUT", [OrderStatus.Cancelled]: "ORDER_CANCELLED",
};

// DB → 领域：非法值拒绝进入领域层（Object.hasOwn 需 ES2022 lib）
export function statusFromDb(raw: string): OrderStatus | undefined {
  return Object.hasOwn(DB_TO_STATUS, raw) ? DB_TO_STATUS[raw as DbOrderStatus] : undefined;
}
// 领域 → DB：写库前转回方言
export function statusToDb(s: OrderStatus): DbOrderStatus {
  return STATUS_TO_DB[s];
}
```

三层链路总览：

| 层 | 值的样子 | 转换点 |
|---|---|---|
| DB | `PAID_DONE` | 仓储层调 `statusFromDb` / `statusToDb`（唯一认识 DB 方言的地方） |
| 领域 / API | `OrderStatus.Paid`（`"paid"`） | JSON 序列化天然得到契约值；入口用 `parseOrderStatus`（第 10 节） |
| UI | `已支付` | `ORDER_STATUS_LABEL`（第 10 节的 `Record<OrderStatus, string>`） |

防漂移的两把编译期锁：

1. 两张表都被 `Record<键联合, X>` 全量约束：DB 加新值 → `DbOrderStatus` 变 → `DB_TO_STATUS` 立即 TS2739；enum 加新成员 → `STATUS_TO_DB` 与 LABEL 同步报错（机制详见第 13 节）。
2. API 契约值若与 enum 值也不一致（如对外暴露 `ORDER_PAID`），照抄一对 `API_TO_STATUS` / `STATUS_TO_API`——**同一模式复制三层，每层一对 Record**。

反向表也可只手写一张、另一张用 `as const satisfies Record<OrderStatus, DbOrderStatus>` 锁死：漏任一成员 / 值拼错（不是合法 DB 方言）都在 satisfies 处报错。落点纪律：转换函数只允许出现在**仓储与 DTO 映射器**里，服务层永远只见 `OrderStatus`——方言泄漏到第二个文件，防腐层就名存实亡。

## 12. 数字枚举位标志（bit flags）：权限系统实战

数字枚举成员用 **2 的幂**做值，就能在一个整数里塞多个布尔位——权限系统经典打法（DB 存一个整数列，省掉多行关联表）：

```ts
// permission.ts
export enum Permission {
  Read  = 1 << 0, // 0b001 = 1
  Write = 1 << 1, // 0b010 = 2
  Exec  = 1 << 2, // 0b100 = 4
}
export const ALL_PERMISSIONS = Permission.Read | Permission.Write | Permission.Exec; // 7

// 组合：按位或（位运算结果类型是 number，不再是枚举成员联合）
const READ_WRITE = Permission.Read | Permission.Write; // 0b011 = 3

// 检测：按位与；多位组合 flag 必须用 === flag 全等
export function hasFlag(flags: number, flag: Permission): boolean {
  return (flags & flag) === flag;
}
console.log(hasFlag(READ_WRITE, Permission.Read)); // true
console.log(hasFlag(READ_WRITE, Permission.Exec)); // false
// ⚠️ 经典错误：组合位用 !== 0 检测——hasFlag(Read|Write, Read|Exec)：3 & 5 = 1 ≠ 0，误判"拥有 Exec"
```

```ts
// 边界守卫：外部/DB 的裸 number 先"收编"（未知位直接拒绝），内部逻辑只消费收编后的值
export function toPermissionSet(raw: number): number {
  if ((raw & ~ALL_PERMISSIONS) !== 0) throw new Error(`未知权限位: ${raw}`); // ~ALL 掩出多出来的位
  return raw;
}
// 撤销一位用"按位与非"：flags & ~Permission.Write —— 去掉 Write，其余保留
```

与字符串数组的互转（前端 checkbox / JSON 存取）：

```ts
// 位标志 → 数组。⚠️ 数字枚举对象里混着反向映射的字符串值，必须 typeof 过滤
export function toList(flags: number): Permission[] {
  return Object.values(Permission).filter(
    (v): v is Permission => typeof v === "number" && hasFlag(flags, v),
  );
}
export function fromList(list: Permission[]): number {
  return list.reduce((acc, p) => acc | p, 0);
}
console.log(toList(3));                                    // [1, 2]（即 Read、Write）
console.log(fromList([Permission.Read, Permission.Exec])); // 5
```

三个边界须知：① **JS 位运算是 32 位有符号**——最多安全用 31 个标志位（第 32 位是符号位），更多就换数组或 bigint；② **复合成员会捣乱**——`enum FilePerm { Read = 1, Write = 2, ReadWrite = Read | Write }` 合法，但 `ReadWrite` 不是 2 的幂，`toList` 会把它和 Read、Write 一起吐出来（同一权限三份），参与遍历的枚举别混复合成员；③ **选型**——权限纯"有/无"且 ≤31 个用位标志（整数列、O(1) 判定）；需要带参数的授权（"仅本人文章可编辑"）用字符串数组 + 策略库（如 CASL）。

## 13. Record<Enum, X> 完备性检查：把新增成员变成编译期待办清单

`Record<E, X>` 展开是"以每个枚举成员为键的映射类型"——对象字面量**少一个键报 TS2739，多一个键被 excess property check 拦下**，双向锁死：

```ts
enum OrderStatus { Pending = "pending", Paid = "paid" }

const LABEL: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "待支付",
  // ❌ TS2739: ... is missing the following properties from type 'Record<OrderStatus, string>'
  //    （报错直接点名缺的成员）；多写的键同样报错（excess property check）
};
```

于是"加一个枚举成员"从祈祷变成流程：只改声明一行，tsc 一跑，**标签表缺新键 TS2739、switch 漏新 case TS2345（见下）、策略表缺项 TS2739** 全部点名——编译器自动生成待办清单。

switch 的穷尽性用 `never` 兜底（与 Record 同一思想的函数版）：

```ts
function assertNever(x: never): never {
  throw new Error(`漏处理: ${JSON.stringify(x)}`);
}
function next(s: OrderStatus): OrderStatus {
  switch (s) {
    case OrderStatus.Pending: return OrderStatus.Paid;
    case OrderStatus.Paid: return OrderStatus.Pending;
    default:
      return assertNever(s);
      // 全覆盖时 s 被收窄成 never ✅；新增成员后 s ≠ never → TS2345 报错，逼你补 case
  }
}
```

三个"放弃完备性"的反模式（review 时见到就要问一句）：`Partial<Record<E, X>>`（漏成员静默通过，运行时 undefined）、`Record<E, X \| undefined>`（类型层看不出谁漏了）、`Map<E, X>`（键是运行时数据，编译器完全失明）。

两点延伸：① 模式与 enum 无关，本质是"用键的联合类型锁死映射表"——`Record<"a" \| "b", X>`、`Record<keyof typeof Conf, X>`（as const 对象）同样生效；② 要"除某成员外全覆盖"用 `Record<Exclude<OrderStatus, OrderStatus.Legacy>, string>`——淘汰成员退出检查范围，其余仍被锁死。

## 14. 从 enum 迁移到 union 的重构步骤（6 步清单）

| 步骤 | 动作 | 关键检查点 |
|---|---|---|
| ① 找出所有用点 | IDE Find Usages + grep | 分类：类型位 / 值位 / 遍历 / 反向映射 |
| ② 替换声明 | enum → as const 对象 + 同名 type | 类型与值同名并存 |
| ③ 消费点适配 | 遍历、装饰器、严格性回归 | values 收窄、装饰器要值数组 |
| ④ 处理反向映射 | 自建反查表 | 仅数字枚举迁移需要 |
| ⑤ 删除残留 | 编译选项 / lint / 旧 .d.ts | preserveConstEnums 等 |
| ⑥ 类型测试验证 | Equal 断言 + 运行时值快照 | 迁移前后类型形状一致 |

**① 分类用点**——`function f(s: OrderStatus)`（类型位 → union 直接顶上）、`OrderStatus.Paid`（值位 → `O.Paid`，用法不变）、`Object.values(...)`（遍历）、`OrderStatus[0]`（反向映射，数字枚举特有，见 ④）——四种用法迁移去向不同，先分类再动手。

**② 同名声明**——迁移成本最低的关键技巧：const 与 type 共用一个名字，值位/类型位用法原样保留：

```ts
// before: enum OrderStatus { Pending = "pending", Paid = "paid", Shipped = "shipped" }
// after：
const OrderStatus = {
  Pending: "pending",
  Paid: "paid",
  Shipped: "shipped",
} as const;
type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]; // "pending" | "paid" | "shipped"
export { OrderStatus }; // 值与类型一起导出；`OrderStatus.Paid` 与 `x: OrderStatus` 全部照旧
```

**③ 消费点适配**——as const 对象的 `Object.values(OrderStatus)` 类型已是成员联合数组（可直接喂 `@ApiProperty({ enum: ... })` 这类要"值数组"的装饰器）；真正要补的是**严格性回归**：字符串 enum 拒绝裸字符串、union 接受——`f("paid")` 从报错变合法，边界处用 parse 函数（第 10 节）把"外部字符串 → 合法成员"的关卡补回来。

**④ 反向映射**（数字枚举迁移特有）：

```ts
const SEVERITY = { Low: 0, Medium: 1, High: 2 } as const;
type Severity = (typeof SEVERITY)[keyof typeof SEVERITY]; // 0 | 1 | 2
const SEVERITY_NAME: Record<Severity, keyof typeof SEVERITY> = {
  0: "Low", 1: "Medium", 2: "High",
}; // Record 锁死全覆盖（第 13 节），值拼错立即报错
console.log(SEVERITY_NAME[1]); // "Medium"
```

⚠️ **值的兼容性是迁移最大的雷**：数字枚举 → 字符串联合会改变序列化值，DB/缓存/已发客户端里的 `0/1/2` 不会自动变 `"low"`——要么数据迁移，要么保留数字值（as const 对象继续用数字）。

**⑤ 删除残留**：tsconfig 里的 `preserveConstEnums` 删除；ESLint 若曾禁 const enum 则调整规则；重导出链上的旧声明（`export { OrderStatus } from './old.js'`）清理；库迁移后重新生成 .d.ts，防止消费者拿到旧 enum 声明。

**⑥ 类型测试验证**——恒等断言锁住迁移结果（Equal/Expect 写法见 08 篇第 9 节）：

```ts
type _1 = Expect<Equal<OrderStatus, "pending" | "paid" | "shipped">>;
// 以后有人把声明改回 enum 或偷偷加成员，这里立刻变红
```

## 15. 要点速查

| 形态 | 写法 | 反向映射 | 主要坑 |
|---|---|---|---|
| 数字 | `enum E { A, B }` | ✅ `E[0]` | 内联成 0 失义；计算成员后必须显式初始化 |
| 字符串 | `enum E { A = "a" }` | ❌ | 成员必须字面量初始化 |
| 异构 | `enum E { A = 0, B = "b" }` | 部分 | 官方建议避免 |
| const | `const enum E {...}` | 编译内联 | isolatedModules / 转译器 / 跨包版本三重坑 |
| ambient | `declare enum E {...}` | 无代码 | 无初始化器成员视为计算成员 |
| 替代 | `as const satisfies` 对象 / 字面量联合 | 无 | 提取类型要 `typeof O[keyof typeof O]` |

> 跨语言对比：Java 的 enum 是完整类（可带方法/字段/实现接口）、C# 的 enum 是值类型、Rust 的 enum 是代数数据类型（`Option/Result` 即它，配 match 穷尽检查）——TS 的 enum 形似 C# 而本质是**普通 JS 对象**，且官方正引导生态走向字面量联合；Rust 风格的"带数据枚举"在 TS 里对应的是**判别联合**（见 04 篇）。

## 16. 常见坑汇总

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

## 17. 衔接

- 字面量联合与 `null`/`undefined` 的基础见 `03-everyday-types.md`；判别联合（枚举标签的主要去向）见 `04-narrowing.md`。
- `as const`/`typeof`/`keyof` 的类型提取机制完整展开见 `08-creating-types-from-types.md`；`satisfies` 见 `15-typescript-new-features.md`。
- 类内使用枚举常量（如权限位）见 `06-classes.md`；`isolatedModules`/`preserveConstEnums` 等编译开关见 `11-tsconfig.md` 与 `10-modules.md`。
- Nest 角色权限枚举见 `/Users/hh/offer/技术文档/nest/03-security`，`@ApiProperty({ enum })` 与 DTO 校验见 `09-recipes/openapi.md` 与 `09-recipes/validation.md`。

## 18. 一句话总结

> 枚举是 TS 里"既有类型又有运行时对象"的少数语法：数字枚举靠 IIFE 建立双向映射、字符串枚举值可读但单向、const enum 用内联换体积却埋下 isolatedModules/单文件转译/跨包版本三重雷——所以现代 TS 的默认答案是**字面量联合或 `as const satisfies` 对象**，只有当框架装饰器（Nest/TypeORM/OpenAPI）需要真实值对象、或需要反向映射时，才回到普通（非 const）enum。
