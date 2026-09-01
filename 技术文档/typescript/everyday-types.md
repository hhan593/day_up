# TypeScript Everyday Types（日常类型）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/2/everyday-types.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。本文覆盖"每天都会写"的基础类型，是 TS 的地基。衔接 Nest 文档中大量 DTO/接口定义。

## 一、原始类型（The primitives）

```ts
string          // 字符串
number          // 数字（含整数/浮点，无 int/float 区分）
boolean         // 布尔
bigint          // 大整数
symbol          // 唯一符号
null            // 空值
undefined       // 未定义
```

⚠️ TS 还有 `object` 类型（所有非原始），但少用；更常用具体对象形状。

## 二、数组（Arrays）

```ts
let list: number[] = [1, 2, 3];
let list2: Array<number> = [1, 2, 3];   // 泛型等价写法
```

- 多维：`number[][]`。
- `(string | number)[]` 是"任意 string 或 number 组成的数组"，区别于 `string[] | number[]`（整个数组是 string 数组或 number 数组）。

## 三、any（尽量避免）

```ts
let obj: any = { x: 0 };
obj.foo();        // 不报错，但运行时可能崩
obj.bar = 100;
```

- `any` 关闭类型检查，逐项从类型系统"逃逸"。
- 渐进迁移 JS 时用 `any` 过渡，但**应尽量减少**。
- 比 `any` 稍好的是 `unknown`（见 `typescript-cheatsheet.md`），它要求先收窄再用。

## 四、类型注解与变量

```ts
let myName: string = 'Alice';
let myAge: number = 30;
```

- 多数情况 TS 能**自动推断**，无需手写：`let myName = 'Alice'`（推断为 string）。
- 函数返回类型也常推断，但公开 API 建议显式标注。

## 五、函数类型（Function Types）

```ts
function greet(name: string): string {
  return `Hello ${name}`;
}

// 函数类型标注（变量）
type GreetFn = (name: string) => string;
const g: GreetFn = (name) => `Hi ${name}`;
```

- 可选参数 `?`：`(x: number, y?: number) => number`。
- 默认参数也算可选：`(x: number, y = 10) => x + y`。
- 剩余参数：`(...args: number[]) => number`。

## 六、对象类型（Object Types）

```ts
function printCoord(pt: { x: number; y: number }) {
  console.log(pt.x, pt.y);
}

// 可选属性
function printName(obj: { first: string; last?: string }) {
  // last 可能是 undefined
}
```

- 属性可加 `readonly`：`{ readonly x: number }`（禁止改）。
- 索引签名：`{ [key: string]: number }` 表示任意 string 键对应 number。

## 七、联合类型（Union Types）

```ts
function printId(id: number | string) {
  if (typeof id === 'string') {
    console.log(id.toUpperCase());   // 收窄为 string
  } else {
    console.log(id);                 // 收窄为 number
  }
}
```

- 联合类型的值只能用"所有成员共有"的属性和方法，除非先收窄。
- 联合是 TS 最常见类型之一。

## 八、类型别名（Type Aliases）

```ts
type Point = {
  x: number;
  y: number;
};

type ID = number | string;

function distance(p: Point) { /* ... */ }
```

- 给类型起名字，便于复用与可读。
- 类型别名只是"别名"，不影响结构相等性（同名不同名不影响能否互相赋值，看结构）。

## 九、接口（Interfaces）

```ts
interface Point {
  x: number;
  y: number;
}

interface Point3D extends Point {
  z: number;   // 继承扩展
}
```

**type 与 interface 的区别（官方权威表述）**：

| 维度 | interface | type |
|------|-----------|------|
| 扩展 | `extends` 继承 | `&` 交叉类型 |
| 合并声明 | ✅ 同名自动合并（declaration merging） | ❌ 不可重复声明 |
| 联合/元组 | ❌ | ✅ 能表示联合、元组、映射等 |
| 对象形状 | ✅ 首选 | ✅ 均可 |

> 官方建议：**对象或类形状优先用 `interface`**；需要联合、元组、映射类型等时用 `type`。二者大部分场景可互换。

## 十、字面量类型（Literal Types）

```ts
let x: 'hello' = 'hello';      // 只能是 'hello'
let status: 'success' | 'fail' = 'success';

function printText(s: string, alignment: 'left' | 'right' | 'center') {
  // alignment 只能是三选一
}
```

- 字面量类型让"精确值"成为类型，配合联合做枚举式约束（比 `enum` 轻，见 `enums.md`）。
- 结合 `as const` 能让整个对象/数组变只读字面量类型。

## 十一、null 与 undefined

- 默认 `strictNullChecks: false` 时，`null`/`undefined` 可赋给任意类型（危险）。
- 开 `strict`（推荐）后，`string | null` 必须显式处理 null：
```ts
function liveDangerously(x?: number | null) {
  console.log(x!.toFixed());   // ! 非 null 断言（跳过检查，慎用）
}
```
- `!` 非空断言：告诉编译器"我保证不是 null"，但**运行时仍可能崩**，仅在你 100% 确定时用。

## 十二、枚举（Enums）—— 另见 `enums.md`

```ts
enum Direction { Up, Down, Left, Right }
let d: Direction = Direction.Up;
```

- 枚举是 TS 独有（非 JS 原生），运行时真实存在。
- 现代代码倾向用 `as const` 对象或字面量联合替代（详见 `enums.md`）。

## 要点速查

| 类型 | 用途 |
|------|------|
| `string/number/boolean` | 基本值 |
| `T[]` / `Array<T>` | 数组 |
| `any` | 关闭检查（少用） |
| `{ ... }` | 对象形状 |
| `A \| B` | 联合 |
| `type X = ...` | 别名 |
| `interface` | 对象类型（可合并） |
| `'a' \| 'b'` | 字面量联合 |

> 跨语言对比：Java 的接口、Go 的结构体隐式实现、Python 的 typing（`Union`、`TypedDict`）——TS 的 `interface` + `type` 组合最接近 Java 接口 + 类型别名，但更灵活（结构类型系统）。

## 衔接

- 函数进阶（重载/泛型/this 类型）见 `more-on-functions.md`
- 类与继承见 `classes.md`
- 装饰器中的对象类型见 `decorators.md`（Nest 的 `@Injectable()` 等）
- Nest DTO 用 `class` + `type` 别名，见 `技术文档/nest/09-recipes/validation.md`
