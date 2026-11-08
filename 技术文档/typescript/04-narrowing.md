# 4. Narrowing（类型收窄）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「Narrowing」，https://www.typescriptlang.org/docs/handbook/2/narrowing.html ，© Microsoft；示例以 TS 5.x / `strict` 下验证，标注了预期输出与编译报错）
> 关联：`03-everyday-types.md`（联合类型/字面量/null 全家的地基）、`05-more-on-functions.md`（重载与谓词函数配合）、`07-enums.md`（判别联合的标签来源）、`08-creating-types-from-types.md`（编译期类型运算）、`12-typescript-advanced-type-system.md`（条件类型与 infer）、`15-typescript-new-features.md`（TS 5.5 自动推断类型谓词）；Nest 文档 `decorator-summary.md` 与 `09-recipes/` 中大量使用 `instanceof`/自定义守卫。

## 1. 为什么需要收窄

TS 的类型检查基于**控制流分析**（control flow analysis）：编译器像解释器一样沿代码路径走，在每个位置为变量维护一个"当前已知类型"。很多值在声明时是宽联合（如 `string | number`），但在具体分支里只有一种成员可用——把联合在分支内缩小为某个成员，就叫**收窄**（narrowing）。

```ts
// pad-left.ts
function padLeft(padding: number | string, input: string): string {
  // 此处 padding: number | string，直接 Math.max(padding) 会报错
  if (typeof padding === "number") {
    return " ".repeat(padding) + input;   // ← 分支内 padding 收窄为 number
  }
  return padding.padEnd(input.length) + input; // ← 此处收窄为 string
}

console.log(padLeft(3, "hi"));    // "   hi"
console.log(padLeft("--", "hi")); // "----hi"
```

收窄的本质：**运行时判断（if/switch/返回布尔值的函数）与编译期类型联动**。没有收窄，联合类型几乎不可用；所有收窄手法都只在"当前控制流路径"内生效（边界的坑见第 10 节）。

## 2. typeof 收窄

`typeof x === "..."` 与以下字面量比较时，TS 会收窄（与 JS 运行时 `typeof` 的八种返回值一一对应）：

| 比较值 | 收窄结果 |
|---|---|
| `"string"` / `"number"` / `"bigint"` / `"boolean"` / `"symbol"` | 对应原始类型 |
| `"undefined"` | `undefined` |
| `"object"` | `null`、对象、数组（**排除不掉 null**） |
| `"function"` | 联合中的函数成员 |

```ts
// typeof-basic.ts
function printAll(strs: string | string[] | null) {
  if (typeof strs === "object") {
    for (const s of strs) {
      //        ❌ 报错 TS2531/18047：'strs' is possibly 'null'
      //    typeof null === "object" 是 JS 历史 bug，"object" 分支包含 null！
      console.log(s);
    }
  } else if (typeof strs === "string") {
    console.log(strs.toUpperCase()); // 收窄为 string
  } else {
    // strs: null（排除法收窄：剩下的成员）
    console.log("empty");
  }
}
```

要点与坑：

1. **`typeof null === "object"`**：用 `typeof` 收窄对象类型时必须再排除 null，惯用组合 `typeof x === "object" && x !== null`。
2. `typeof undefined === "undefined"`：可选参数/可能未定义的值常用 `typeof x !== "undefined"` 判断，能同时处理"未传"与"传了 undefined"。
3. 比较字符串**拼错不报错也不收窄**：`typeof x === "strnig"` 只是恒 false 的普通比较，类型不收窄也不报编译错（某些 lint 规则可查），手写时留意。
4. `else` 分支是**排除式收窄**：`if (typeof x === "string")` 的 else 里，`string` 成员被剔除。联合成员越多，排除法越有用。
5. `typeof` 收窄对 `unknown` 同样有效（`03-everyday-types.md` 3.2 节），是处理外部输入的第一道关卡。

## 3. 真值收窄（Truthiness Narrowing）

`if (x)`、`&&`、`||`、三元、`while (x)` 中，TS 按 JS 真值规则收窄：falsy 值（`false`、`0`、`-0`、`0n`、`""`、`NaN`、`null`、`undefined`）被排除，联合中只剩可能为真的成员。

```ts
// truthiness.ts
function getUsersOnlineMessage(users: User[] | null): string {
  if (users) {
    // users: User[]（null 被排除）——但注意：User[] 恒为真，空数组也是真的！
    return `There are ${users.length} users online!`;
  }
  return "Nobody here";
}
```

坑：真值判断是"是否非 falsy"，不是"是否有意义"：

```ts
// truthiness-pitfall.ts
function printCount(count: number) {
  // if (count) 只排除 0 —— 如果 0 是合法业务值就会漏处理
  if (count !== 0) { /* 更显式 */ }

  const nums: number[] = [];
  // if (nums.length) 排除的是 0（length 永远不会是别的 falsy），这种用法是安全的
}

function shout(x: string | number) {
  // 0 和 "" 会被 if 挡掉：
  // if (x) console.log(x.toUpperCase());
  //           ❌ 报错：string | number 上没有 toUpperCase —— number 没被完全排除？
  // 实际上 TS 收窄后 x 为 string | number 里非 falsy 的部分，仍含 number
}
```

**`!!` 与 `Boolean()` 惯用法**：把任意值归一化为布尔，常用于 `filter`、返回布尔字段的场景；对收窄本身没有额外能力（等价于 `if (x)` 的判断结果），但能让"合法值判断"变成显式布尔类型：

```ts
// bang-bang.ts
const ids: (number | undefined)[] = [1, undefined, 3];
const validIds = ids.filter((id): id is number => id !== undefined); // 精确，见第 7 节
// const validIds2 = ids.filter(Boolean);  // 类型仍是 (number | undefined)[]，别指望它收窄
```

- 对象（包括空对象 `{}`）恒为真——`if (config)` 挡不住"配置是空对象"。
- **推荐显式比较**（`if (x !== null)`、`if (arr.length > 0)`），真值判断留给自己一眼能看懂的场景。

## 4. 等值收窄（Equality Narrowing）

`===` / `!==` / `==` / `!=` 与字面量、`null`、`undefined` 或另一个变量比较时收窄。与另一变量比较时，TS 取**两个类型的交集**：

```ts
// equality.ts
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // 能同时等于 x 和 y 的只有 string：x、y 都收窄为 string
    console.log(x.toUpperCase(), y.toLowerCase());
  } else {
    // x: string | number，y: string | boolean（各自原样，因为"不等"排除不掉整体成员）
  }
}
```

与字面量比较是判别联合（第 4.3）之外的另一种常用收窄：

```ts
// equality-literal.ts
type Size = "s" | "m" | "l" | number;

function toCm(size: Size): number {
  if (size === "s") return 36;   // 收窄为 "s"
  if (size === "m") return 38;
  if (size === "l") return 40;
  return size;                    // 剩下 number
}
```

- **`== null` 惯用法**：`x == null` 同时匹配 `null` 和 `undefined`（JS 规则），TS 也按此收窄；`x != null` 一次排除两个 nullish。这是少数推荐用 `==` 的地方（`03-everyday-types.md` 10.4）。
- `switch` 每个非空 `case` 都是等值收窄；**注意 fall-through**：漏写 `break` 会把两个分支串起来，但类型收窄按路径依然正确（收窄跟着控制流走）。
- `===` 收窄要求比较双方类型有交集，两边类型完全不相交时 TS 直接报错 TS2367（`This comparison appears to be unintentional`）——这本身就是一层保护。

## 5. in 收窄

`"prop" in obj` 判断**属性是否存在于对象（含原型链）**，TS 用它区分不同"形状"：

```ts
// in-basic.ts
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();   // 收窄为 Fish
  } else {
    animal.fly();    // 收窄为 Bird（排除式）
  }
}
```

坑：**可选属性会被 `in` 判定为"存在"**，因为"类型里声明过"：

```ts
// in-optional-pitfall.ts
type Bird = { fly: () => void; swim?: () => void };  // swim 是可选的
type Fish = { swim: () => void };

function move(animal: Bird | Fish) {
  if ("swim" in animal) {
    // animal 收窄为 Bird | Fish！可选属性让 in 检查失去区分度
    animal.swim?.();   // 只能可选调用；直接 animal.swim() 报错 TS18048
  } else {
    animal.fly();      // 仍能收窄为 Bird
  }
}
```

结论：`in` 适合"**属性在一方完全不存在**"的联合；只要有一方是可选属性，就改用判别联合（字面量标签，`03-everyday-types.md` 第 7 节）或类型谓词（第 7 节）。

- 注意区分两个 `in`：这里的 `in` 是**运行时操作符**；映射类型里的 `in`（`[K in keyof T]`）是**编译期语法**，同名不同物（见 `08-creating-types-from-types.md`）。
- 反向 `!("swim" in animal)` 同样收窄（排除含该属性的成员）。

## 6. instanceof 收窄

`x instanceof C` 检查 `C.prototype` 是否出现在 `x` 的原型链上，收窄为类实例类型。右侧必须是**构造函数**（具有 `prototype` 属性的函数值）。

```ts
// instanceof-basic.ts
function logTime(x: Date | string) {
  if (x instanceof Date) {
    console.log(x.toUTCString());   // Date
  } else {
    console.log(x.toUpperCase());   // string
  }
}

// 原型链：子类实例既通过子类检查也通过父类检查
class Animal { move() {} }
class Dog extends Animal { bark() {} }

function handle(a: Animal) {
  if (a instanceof Dog) {
    a.bark();   // 收窄为 Dog（父类分支中"认出"子类）
  } else {
    a.move();
  }
}
```

常用内置类：`Date`、`Error`、`RegExp`、`Map`、`Set`、`Promise`、`ArrayBuffer` 等。

```ts
// instanceof-error.ts
// TS 4.4 起 catch 变量默认 unknown（useUnknownInCatchVariables），instanceof 是标准处理：
try {
  JSON.parse("{bad json");
} catch (e: unknown) {
  if (e instanceof Error) {
    console.error(e.message);   // 收窄为 Error
  } else {
    throw e;                    // 非 Error 的抛出物原样再抛
  }
}
```

坑：

1. **原始值永远不通过**：`"abc" instanceof String` 是 `false`（原始值不是包装对象实例），所以 `instanceof` 不能用来收窄 `string | String` 这类联合——`string | number` 这种原始联合用 `typeof`。
2. **跨 realm 失效**：iframe / vm / 不同 Node 模块实例创建的对象，其原型链属于另一个 realm，`x instanceof Array` 可能是 `false`。判断数组一律用 `Array.isArray(x)`（它还能顺带收窄）。
3. 序列化穿越边界（`JSON.parse`、postMessage、structuredClone 之外的场景）后原型丢失，`instanceof class` 会全部失败——跨边界传"类实例"要用普通对象 + 类型谓词，或用 `is` 守卫重建。
4. `instanceof` 对接口（`interface`）无意义：接口编译后不存在，没有可用的构造函数；需要"判断是否满足某形状"请用类型谓词（第 7 节）。

## 7. 类型谓词（Type Predicates）：`x is T`

自定义守卫函数：返回类型写成 `参数名 is 类型`，向编译器承诺"**本函数返回 true 时，该参数就是 T**"。这是把任意运行时校验接入类型系统的唯一正道。

完整实战（官方 isFish 例子的工程化版本）：

```ts
// type-predicate.ts
type Fish = { swim: () => void; name: string };
type Bird = { fly: () => void; name: string };

// 写法一：结构探测（用 in，不用断言）
function isFish(pet: Fish | Bird): pet is Fish {
  return "swim" in pet;
}

// 写法二：官方原版（需要 as，因为 pet 上访问 swim 不合法）
// function isFish(pet: Fish | Bird): pet is Fish {
//   return (pet as Fish).swim !== undefined;
// }

function feed(pet: Fish | Bird) {
  if (isFish(pet)) {
    pet.swim();          // 收窄为 Fish
  } else {
    pet.fly();           // 收窄为 Bird
  }
}

const zoo: (Fish | Bird)[] = [/* ... */];
const fishes = zoo.filter(isFish);   // Fish[]：谓词可直接用于 filter
```

类型谓词最大的价值是**守卫 unknown**（`03-everyday-types.md` 3.4 节里 any 的替代方案）：

```ts
// guard-unknown.ts
interface User { id: number; name: string }

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof (value as { id: unknown }).id === "number" &&
    typeof (value as { name: unknown }).name === "string"
  );
}

const data: unknown = JSON.parse('{"id":1,"name":"Alice"}');
if (isUser(data)) {
  console.log(data.name);   // data: User，安全访问
}
```

要点与坑：

1. **谓词必须挂在函数参数上**：`pet is Fish` 里的 `pet` 必须是当前函数的参数名，不能对属性、局部变量做谓词。
2. **编译器不验证谓词的真实性**：函数体返回什么 TS 都不检查（它信了你的承诺）。写错的谓词 = 类型谎言，运行时照样崩——谓词内部要用 `in`/`typeof` 等真实检查，别写死 `return true`。
3. **else 分支的收窄**：只有当参数类型是联合时，`if (!isX(x))` 的 else 才能收窄为"剔除 X 后的剩余成员"；参数是 `unknown` 时 else 里仍是 `unknown`。
4. **TS 5.5+ 自动推断谓词**：`zoo.filter((p) => "swim" in p)` 这类简单箭头函数会被自动推断为 `p is Fish | Bird`（细节见 `15-typescript-new-features.md`），复杂逻辑仍需手写谓词。
5. `satisfies`、`as` 都不能替代谓词：`as` 是单方面断言（无运行时检查），谓词是"有运行时检查的收窄"（见 8 节对比）。

## 8. 断言函数（Assertion Functions）：`asserts x is T`

断言函数"要么通过、要么抛错"，调用点之后的代码获得收窄。两种形态：

```ts
// assertion-function.ts
// 形态一：asserts condition —— 断言某表达式为真
function assert(condition: unknown, msg = "assertion failed"): asserts condition {
  if (!condition) throw new Error(msg);
}

// 形态二：asserts x is T —— 断言参数是某类型
function assertIsString(x: unknown): asserts x is string {
  if (typeof x !== "string") throw new TypeError("not a string");
}

function multiply(x: number | null, y: number | null) {
  assert(x !== null && y !== null);   // 抛错则后面不会执行
  console.log(x * y);                 // x、y 收窄为 number
}

function shout(input: unknown) {
  assertIsString(input);
  console.log(input.toUpperCase());   // 收窄为 string
}
```

与类型谓词（第 7 节）的差异：

| 维度 | `x is T`（谓词） | `asserts x is T`（断言函数） |
|---|---|---|
| 失败方式 | 返回 `false`，走 else 分支 | **抛异常**，没有 else |
| 收窄范围 | if 分支内 | 调用点之后**整个作用域** |
| 适用场景 | 值有两种可能，都要处理 | "必须是这样，否则直接崩"的前置校验 |
| 典型代表 | `isFish`、`Array.isArray` | Node `assert.ok`/`assert.strict`、参数校验 |

坑：

1. **必须显式写返回类型标注**，只写函数体不写 `asserts ...` 则毫无收窄效果；漏写也不会报错（返回值被当作 void/boolean）。
2. **只能收窄"变量"，不能收窄属性/表达式**——最经典的翻车点：

```ts
// assertion-pitfall.ts
function assertIsString(x: unknown): asserts x is string {
  if (typeof x !== "string") throw new TypeError("not a string");
}

const box: { v: unknown } = { v: "hello" };
assertIsString(box.v);
// box.v.toUpperCase();   // ❌ 报错 TS18046/2339：box.v 仍是 unknown！属性收窄不生效

const v = box.v;          // ✅ 修法：先提到局部 const 变量
assertIsString(v);
console.log(v.toUpperCase());   // "HELLO"
```

3. 配合穷尽检查的 `assertNever`（见第 9 节）是断言函数的高频应用。

## 9. 穷尽性检查（Exhaustiveness）与 never

判别联合 + switch 时，`never` 可以让"漏处理成员"变成**编译错误**：所有成员都被 case 后，`default` 里的变量类型收窄为 `never`，只有 `never` 能赋给 `never`——新增联合成员而忘记加 case 时，`default` 不再是 `never`，赋值立即报错。

```ts
// exhaustiveness.ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle": return Math.PI * shape.radius ** 2;
    case "square": return shape.size ** 2;
    default: {
      // 现在所有成员已处理完，shape 收窄为 never
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}

// 现在给 Shape 增加 { kind: "triangle"; base: number; height: number }：
// default 里 shape 不再是 never，报错 TS2322：
//   Type 'Shape' is not assignable to type 'never' → 提示你补 case
```

另一种常用形态：**assertNever 兜底函数**（断言函数 + never）：

```ts
// assert-never.ts
function assertNever(x: never): never {
  throw new Error(`Unhandled member: ${JSON.stringify(x)}`);
}

function describe(shape: Shape): string {
  switch (shape.kind) {
    case "circle": return `circle r=${shape.radius}`;
    case "square": return `square a=${shape.size}`;
    default:
      return assertNever(shape);   // 漏分支时：报错 shape 不是 never；运行时给出可读信息
  }
}
```

补充要点：

- 穷尽检查依赖**判别联合**（每个成员带唯一字面量标签）；标签字段用 `as const` 对象或联合字面量生成（`07-enums.md`、`03-everyday-types.md` 9 节）。
- 不写 default、函数声明了非 void 返回类型时，漏分支会报 TS2366（`Function lacks ending return statement`）——这是"免费的"穷尽检查，声明返回类型是好习惯。
- `never` 的类型论地位（空集）与更多来源见 `03-everyday-types.md` 3.5 节。

## 10. 控制流分析的边界（收窄失效的坑）

收窄不是万能的，以下场景**编译器会主动放弃收窄**（或从未收窄过）：

### 10.1 闭包内收窄失效：可变量逃逸

函数表达式可能"晚于"收窄执行，此时变量可能已被重新赋值——TS 对**可变变量**（let/var）在闭包内恢复其声明类型：

```ts
// closure-escape.ts
let id: string | number = Math.random() > 0.5 ? "abc" : 123;

if (typeof id === "string") {
  // const f = () => id.toUpperCase();
  //          ❌ 报错 TS2339：id 是 let，闭包执行时可能已经不是 string

  const s = id;               // ✅ 修法：捕获到 const 局部变量
  const f = () => s.toUpperCase();   // const 的收窄在闭包内保持
  console.log(f());
}
```

同理，`let` 变量在收窄后**重新赋值**会立即恢复联合类型；对象**属性**的收窄在赋值后同样失效。规则一句话：**想让收窄跨过函数边界，就先固化到 const**。

### 10.2 数组索引与 pop：TS 默认"越界访问不检查"

```ts
// index-access.ts
const names: string[] = ["Alice"];
const first = names[0];        // 类型是 string！即使数组可能为空
// first.toUpperCase();        // 编译通过，空数组时运行时 TypeError

const last = names.pop();      // pop() 的签名本就是 string | undefined ✅
console.log(last?.toUpperCase() ?? "(empty)");

const maybe = names.find((n) => n.length > 3);   // find 返回 string | undefined ✅
// 不加判断直接用会被 03 篇 10.2 的 `!` 坑击中
```

`noUncheckedIndexedAccess: true`（`strict` 之外需单独开启，见 `11-tsconfig.md`）会让 `arr[i]` 的类型变成 `T | undefined`，把这类空值提前暴露：

```ts
// no-unchecked.ts
// 开启 noUncheckedIndexedAccess 后：
// const first2 = names[0];        // 类型 string | undefined
// console.log(first2?.toUpperCase());
```

### 10.3 其他边界速记

- **`const` 断言的对象仍是"属性可变"的引用**：`as const` 收窄的是类型不是运行时（`03-everyday-types.md` 9.3）。
- **跨 `await` / 回调后的收窄**：TS 对 let 变量的收窄会跨越 `await` 保持（它不做并发分析），这是"信任开发者"的又一例，多人协作时注意闭包捕获。
- **谓词/断言收窄不能作用于表达式**（见 8 节坑 2）：先赋给 const 变量再收窄。
- 收窄只在**同一次函数调用**内有效：`isString(x)` 返回 true 后，另一次调用 `isString(x)` 的结果编译器不会复用——循环体内每轮重新收窄。

## 11. 要点速查

| 语法 | 收窄效果 | 主要坑 |
|---|---|---|
| `typeof x === "number"` 等八种 | 收窄原始类型/函数 | `typeof null === "object"` 含 null |
| `if (x)` 真值 | 排除 falsy | 误伤合法 `0`/`""`；对象恒真 |
| `x === y` | 两侧收窄为类型交集 | 交集为空时报 TS2367 |
| `x == null` | 同时排除 null 与 undefined | 仅此场景推荐 `==` |
| `switch (x.kind)` | 判别联合逐 case 收窄 | 别用可变值当标签 |
| `"swim" in x` | 区分对象形状 | 可选属性让 in 失去区分度 |
| `x instanceof C` | 收窄为类实例 | 原始值不通过；跨 realm 失效 |
| `x is T` | 自定义谓词，可配 filter | 编译器不验证谓词真实性 |
| `asserts x is T` | 抛错式收窄，作用域持续 | 收窄不了属性表达式 |
| `const _x: never = x` | 穷尽性检查 | 依赖判别联合的标签 |
| `arr[i]` | 无收窄（默认非 undefined） | 开 `noUncheckedIndexedAccess` |

> 跨语言对比：Rust 的 `match` + 模式匹配、Kotlin 的 smart cast、C# 的 `is`/模式匹配——TS 的收窄在能力上最接近 C#（`is` 之后自动转换），但实现机制不同：TS 靠**控制流分析**而非类型系统内建，因此有闭包逃逸、属性断言这些特有的边界坑。Rust 的穷尽 match 是语言强制，TS 需要手动用 never 构造同样约束。

## 12. 常见坑汇总

1. `typeof x === "object"` 分支包含 `null`，必须再 `x !== null`（第 2 节）。
2. 真值判断误伤合法 falsy 值：`if (count)` 挡住了合法的 0（第 3 节）。
3. 可选属性让 `"swim" in animal` 同时命中两个成员，收窄失效（第 5 节）。
4. `instanceof` 收窄不了原始类型，跨 iframe/realm 判断数组要用 `Array.isArray`（第 6 节）。
5. 谓词函数写错 TS 不报错——`pet is Fish` 是承诺不是证明（第 7 节）。
6. 断言函数收窄不了 `obj.prop`，先赋给 const 局部变量（第 8 节）。
7. 闭包捕获 let 变量后收窄失效，先固化 const（第 10.1 节）。
8. `arr[0]` 默认类型不含 undefined，空数组运行时崩；开 `noUncheckedIndexedAccess`（第 10.2 节）。
9. 漏写断言函数的 `asserts ...` 标注，收窄静默失效（第 8 节）。
10. switch 判别联合新增成员后忘改 switch，靠 `never` 兜底让它编译报错（第 9 节）。

## 13. 衔接

- 联合、字面量、null/undefined 的地基见 `03-everyday-types.md`；`?.`/`??` 与收窄的分工也在该篇 10.3。
- 谓词、重载与泛型函数的配合见 `05-more-on-functions.md`。
- 判别联合标签的来源（enum vs 字面量联合 vs as const 对象）见 `07-enums.md`。
- 编译期类型运算（条件类型/infer/映射）见 `08-creating-types-from-types.md` 与 `12-typescript-advanced-type-system.md`。
- TS 5.5 自动推断类型谓词、TS 5.3/5.4 的收窄增强见 `15-typescript-new-features.md`。
- Nest 的自定义 Pipe、装饰器里大量使用 `instanceof` 与自定义守卫，见 `/Users/hh/offer/技术文档/nest/decorator-summary.md` 与 `09-recipes/`。

## 14. 一句话总结

> Narrowing 是 TS 把"运行时判断"翻译成"编译期类型"的桥梁：typeof/truthiness/等值/in/instanceof 覆盖内置场景，`x is T` 与 `asserts x is T` 接入自定义校验，never 穷尽检查兜住联合的演进；但收窄跟着控制流走——let 逃逸闭包、属性表达式、数组索引这三处边界，要么用 const 固化，要么开 `noUncheckedIndexedAccess`，要么显式判断。
