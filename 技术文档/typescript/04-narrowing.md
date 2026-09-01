# TypeScript Narrowing（类型收窄）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/2/narrowing.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。Narrowing 是 TS 编译器"减小变量类型范围"的机制，是写出精确类型推断的关键。衔接 `typescript-advanced-types.md`（类型体操）与 Nest 文档中大量用到的类型判断。

## 一、为什么需要收窄

TypeScript 的类型是通过**控制流分析**推断的。但很多值运行前无法知道确切类型（如函数参数 `string | number`）。通过特定语法，编译器能把"宽类型"在分支内"收窄"成"窄类型"，从而安全调用该类型特有的方法。

```ts
function padLeft(padding: number | string, input: string) {
  // padding 在这里还是 number | string
  if (typeof padding === 'number') {
    return ' '.repeat(padding) + input;  // ← 此处 padding 收窄为 number
  }
  return padding + input;                // ← 此处 padding 收窄为 string
}
```

## 二、typeof 类型守卫

`typeof` 在 `if` 里收窄，TS 识别以下"类型守卫"：
`"string"` / `"number"` / `"bigint"` / `"boolean"` / `"symbol"` / `"undefined"` / `"object"` / `"function"`

⚠️ `typeof null === "object"` 是 JS 历史 bug，所以 `typeof` 不能排除 `null`。要排除 null 需 `x !== null`。

## 三、真值收窄（Truthiness Narrowing）

`if (x)` 这类真值判断会收窄掉 `0`、`""`、`NaN`、`null`、`undefined`、`0n` 等 falsy 值：

```ts
function getUsersOnline(users: User[]) {
  if (users.length) {        // number 真值收窄：length !== 0
    // ...
  }
}
```

注意 `Boolean()` 转换和 `!!` 也用于真值收窄，但不如显式比较清晰。**推荐显式判断**（`if (x !== null)`）。

## 四、等值收窄（Equality Narrowing）

`===` / `!==` 与字面量或 `null`/`undefined` 比较时收窄：

```ts
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // x 与 y 都是 string（唯一交集）
    x.toUpperCase();
  } else {
    // 此处 x、y 仍各自为联合
  }
}
```

- `===` 精确匹配；`==` 也行但不推荐（隐式转换）。
- 与 `null`/`undefined` 比较会收窄掉 nullish。

## 五、in 操作符收窄

`"value" in x` 检查属性存在，用于区分不同对象形状：

```ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    animal.swim();   // 收窄为 Fish
  } else {
    animal.fly();
  }
}
```

## 六、instanceof 收窄

```ts
function logValue(x: Date | string) {
  if (x instanceof Date) {
    console.log(x.toUTCString());  // 收窄为 Date
  } else {
    console.log(x.toUpperCase());  // 收窄为 string
  }
}
```

## 七、类型谓词（Type Predicates）

自定义函数当守卫，返回类型写成 `arg is Type`：

```ts
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

if (isFish(pet)) {
  pet.swim();   // 收窄为 Fish
}
```

- `pet is Fish` 是**类型谓词**，告诉编译器"此函数返回 true 时参数就是 Fish"。
- 配合 `filter` 还能过滤数组类型：`pets.filter(isFish)` 结果类型变 `Fish[]`。

## 八、断言函数（Assertion Functions）

函数内断言，不满足就抛错，从而收窄调用点之后的类型：

```ts
function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function multiply(x: number | null) {
  assert(x !== null);
  x;   // 此处 x 收窄为 number
}
```

`asserts condition` / `asserts x is T` 两种形态。

## 九、赋值与控制流

- 变量**赋值**会更新其收窄类型（赋值右侧类型即新收窄）。
- `never` 表示不可达；穷尽性检查常用：

```ts
function exhaustive(x: Shape): string {
  switch (x.kind) {
    case 'circle': return '...';
    case 'square': return '...';
    default:
      // 若漏了分支，此处 x 收窄为 never 会报错 → 提示补全
      const _exhaustiveCheck: never = x;
      return _exhaustiveCheck;
  }
}
```

## 要点速查

| 语法 | 收窄效果 |
|------|----------|
| `typeof x === 'number'` | 收窄基本类型（不含 null） |
| `if (x)` | 排除 falsy |
| `x === y` | 取交集 |
| `'prop' in x` | 区分对象形状 |
| `x instanceof C` | 收窄为类实例 |
| `pet is Fish` | 自定义类型谓词 |
| `asserts x` | 断言函数收窄 |
| `x: never` | 穷尽性检查 |

> 跨语言对比：Rust 的 `match` + 模式匹配、Kotlin 的智能转换（smart cast）、C# 的 `is` 模式——TS 的 Narrowing 最接近 C# `is` 之后自动转换，但靠控制流而非模式匹配。

## 衔接

- 条件类型与 `infer`（高级类型推断）见 `creating-types-from-types.md`
- 装饰器中大量用到 `instanceof`/`typeof` 判断，见 Nest 文档 `09-recipes`
- 与 `typescript-advanced-types.md` 互补：本文是"运行期收窄"，那篇是"编译期类型操纵"
