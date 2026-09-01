# TypeScript More on Functions（函数进阶）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/2/functions.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。本文覆盖函数参数、重载、泛型、this 类型等进阶点。衔接 `everyday-types.md` 与 Nest 控制器/Provider 方法签名。

## 一、参数处理

### 可选参数
```ts
function f(x: number, y?: number) {
  // y 类型是 number | undefined
}
```

### 默认参数
```ts
function f(x: number = 10) { /* ... */ }
```
- 默认参数自动变为可选；其类型从默认值推断（除非显式标注）。

### 剩余参数
```ts
function f(...args: number[]) {
  args.forEach(n => console.log(n));
}
```

⚠️ **可选参数必须放在必填参数之后**，剩余参数必须放最后。

## 二、函数重载（Overloads）

JS 单函数常处理多种入参形态。TS 用"重载签名 + 实现签名"表达：

```ts
// 重载签名（对外可见）
function makeDate(timestamp: number): Date;
function makeDate(m: number, d: number, y: number): Date;

// 实现签名（对外不可见，需兼容所有重载）
function makeDate(mOrTimestamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) {
    return new Date(y, mOrTimestamp, d);
  }
  return new Date(mOrTimestamp);
}

makeDate(1234567);          // OK
makeDate(1, 2, 3);          // OK
// makeDate(1, 2);          // 报错：无此重载
```

规则：
- **实现签名不可直接调用**（外部只能用重载签名）。
- 重载签名要"窄→宽"或合理排列，实现签名必须能覆盖所有重载。
- 优先用**联合类型 + 收窄**替代重载（更简单），重载仅在返回类型随参数形态变化时必要。

## 三、this 类型

JS 的 `this` 动态绑定，TS 可标注：

```ts
interface User {
  name: string;
  greet(this: User): void;   // 标注 this 类型
}

const u: User = {
  name: 'Alice',
  greet() { console.log(`Hi ${this.name}`); },
};
```

- `this` 参数放参数列表首位（仅类型标注，运行时不存在）。
- 类方法里 `this` 自动推断为类类型。

## 四、其他类型需要调用签名

函数本身是"有调用签名的对象"。任意类型若有 `call` 签名也能当函数：

```ts
type DescribableFunction = {
  description: string;
  (someArg: number): boolean;   // 调用签名
};

function doSomething(fn: DescribableFunction) {
  console.log(fn.description + ' returned ' + fn(6));
}
```

## 五、泛型函数（Generic Functions）

```ts
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const s = firstElement(['a', 'b']);   // string | undefined
const n = firstElement([1, 2]);        // number | undefined
```

- `T` 由调用时实参推断。
- 约束：`function longest<T extends { length: number }>(a: T, b: T): T`。
- ⚠️ 只在真正需要"保持输入输出类型关联"时用泛型；否则用具体类型。

## 六、void 返回

```ts
function warnUser(): void {
  console.log('warning');
}
```

- `void`：函数无有用返回值（忽略 return）。
- **回调类型推断**：若回调参数类型推导为 `void`，允许传返回非 void 的回调（类型系统忽略返回值），这便于 `forEach` 等场景。

## 七、对象类型作为类型（Rest Parameters & Destructuring）

```ts
function sum({ a, b, c }: { a: number; b: number; c: number }): number {
  return a + b + c;
}

// 解构 + 剩余
function f({ id, ...rest }: { id: string; name: string; age: number }) {
  // rest: { name: string; age: number }
}
```

## 八、未知数量参数的类型

```ts
function many(...args: [string, number, boolean]): void {}
many('a', 1, true);   // 元组形式规定个数与类型
```

> 与 `...args: any[]` 不同，元组形式能精确约束每一位的类型。

## 要点速查

| 特性 | 写法 |
|------|------|
| 可选 | `(x?: T)` |
| 默认 | `(x: T = v)` |
| 剩余 | `(...args: T[])` |
| 重载 | 多个签名 + 一个实现 |
| this | `fn(this: T)` |
| 泛型 | `<T>(x: T): T` |
| 结构 | `({ a }: { a: T })` |

> 跨语言对比：Java 的方法重载（编译期多态）、C# 的 `params`、Go 的多返回值（TS 用元组返回模拟）——TS 重载是"类型层"而非"运行期"多态，编译后只剩一个实现函数。

## 衔接

- 类与方法签名见 `classes.md`
- 泛型在类型操纵中更深入（条件类型 `infer`、映射类型），见 `creating-types-from-types.md`
- Nest 控制器大量用 `(@Body() dto: CreateDto)` 这类参数结构与装饰器，见 `技术文档/nest/09-recipes`
