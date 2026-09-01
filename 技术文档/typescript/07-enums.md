# TypeScript Enums（枚举）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/enums.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。枚举是 TS 独有（运行时真实存在），本文覆盖其全部形态与陷阱。衔接 `everyday-types.md` 的字面量联合替代方案。

## 一、数字枚举（Numeric Enums）

```ts
enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}
// Up=1, Down=2, Left=3, Right=4（自动递增）
```

- 省略初始化从 `0` 开始。
- 成员无初始化器必须位于首位或已数字初始化的成员之后。
- 数字枚举编译后是真实对象（含反向映射）。

## 二、字符串枚举（String Enums）

```ts
enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}
```

- 每个成员必须显式初始化（无自动递增）。
- 序列化/调试友好（值可读）。
- ⚠️ **字符串枚举无反向映射**。

## 三、异构枚举（Heterogeneous）

```ts
enum BooleanLikeHeterogeneousEnum {
  No = 0,
  Yes = 'YES',
}
```

- 技术上可混数字与字符串，但官方建议避免（除非依赖 JS 运行时特性）。

## 四、const enum（常量枚举）

```ts
const enum Direction { Up, Down, Left, Right }
let d = [Direction.Up, Direction.Down];   // 编译为 [0, 1]
```

- 编译后**完全移除**，成员内联到使用处。
- 只能含常量表达式，不能有计算成员。
- ⚠️ **陷阱**（官网明确警告）：
  1. 与 `isolatedModules` 模式不兼容；
  2. 跨项目内联可能导致 A 版本编译、B 版本运行值不一致；
  3. 环境 const enum 可能无运行时 JS，导致报错。
- 规避：用 linter 禁用 const enum，或 `preserveConstEnums` 编译为普通枚举并在 `.d.ts` 去掉 `const`。

## 五、枚举作为类型 / 字面量成员类型

```ts
enum ShapeKind { Circle, Square }

interface Circle {
  kind: ShapeKind.Circle;   // 单个成员作为类型
  radius: number;
}
```

- 当所有成员是字面量（无初始化 / 字符串字面量 / 数字字面量 / 一元负号数字）时：
  - 每个成员成为独立类型；
  - 枚举本身变成员联合，TS 可捕获无效比较（如 `x !== E.Foo || x !== E.Bar` 警告无重叠）。

## 六、环境枚举（Ambient Enums）

```ts
declare enum Enum { A = 1, B, C = 2 }
```

- `declare enum` 描述已存在的枚举形状（无运行时代码）。
- 区别：环境枚举中无初始化器的非 const 成员**始终视为计算成员**（普通枚举视前一成员而定）。

## 七、反向映射（Reverse Mappings）

```ts
enum Enum { A }
let a = Enum.A;        // 0
let nameOfA = Enum[a]; // "A"
```

- 编译后：`Enum["A"] = 0; Enum[0] = "A"`。
- **仅数字枚举有反向映射**，字符串枚举没有。

## 八、与字面量联合 / as const 替代方案

现代 TS 推荐用 `as const` 对象替代枚举（无运行时开销）：

```ts
const ODirection = { Up: 0, Down: 1, Left: 2, Right: 3 } as const;
type Direction = typeof ODirection[keyof typeof ODirection];  // 0 | 1 | 2 | 3

function run(dir: Direction) {}
run(ODirection.Up);   // OK
```

| 方案 | 优点 | 缺点 |
|------|------|------|
| `enum` | 作参数类型简洁、有反向映射 | 运行时存在、异构、易踩 const enum 坑 |
| `as const` 对象 | 零运行时、贴近 JS 未来、可 tree-shake | 作类型需 `typeof` 提取 |

> 官方观点：两种均可；新项目倾向 `as const` 或字面量联合，减少语法依赖。

## 要点速查

| 形态 | 写法 | 反向映射 |
|------|------|----------|
| 数字 | `enum E { A, B }` | ✅ |
| 字符串 | `enum E { A='a' }` | ❌ |
| 异构 | `enum E { A=0, B='b' }` | 部分 |
| const | `const enum E {...}` | 编译内联 |
| 环境 | `declare enum E {...}` | 无代码 |

> 跨语言对比：Java 的 `enum`（类级、强类型、可带方法）、C# 的 `enum`（值类型）、Rust 的 `enum`（代数数据类型，最强）——TS 的 `enum` 更接近 C#，但运行时是普通对象，且官方正引导向字面量联合。

## 衔接

- 字面量联合（`'a' | 'b'`）见 `everyday-types.md`
- 装饰器、类中的枚举常量见 `decorators.md` / `classes.md`
- Nest 中常用 `enum` 定义角色/状态，见 `技术文档/nest/03-security`
