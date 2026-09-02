# TypeScript Creating Types from Types（从类型构造类型）

> 来源：TypeScript 官方手册 Type Manipulation 章节
> - Keyof & Lookup：`https://www.typescriptlang.org/docs/handbook/2/keyof-and-lookup-types.html`
> - Conditional Types：`https://www.typescriptlang.org/docs/handbook/2/conditional-types.html`
> - Mapped Types：`https://www.typescriptlang.org/docs/handbook/2/mapped-types.html`
> - Template Literal Types：`https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html`
> （均最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。本文覆盖"高级类型体操"的官网权威机制。与已有的 `typescript-advanced-types.md` 互补：那篇偏实战技巧，本文偏官方语法原貌。

## 一、keyof 与查找类型（Indexed Access）

### keyof
```ts
type Point = { x: number; y: number };
type P = keyof Point;   // "x" | "y"
```

- `keyof T` 取 T 所有键的联合。

### 查找类型 T[K]
```ts
type Point = { x: number; y: number };
type X = Point['x'];   // number

function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];      // 返回类型 T[K]
}
```

- `T[K]` 取出属性类型；`K extends keyof T` 约束 key 合法。
- 联合查找：`Type['a' | 'b']` 取出多个属性类型的联合。
- `string` 索引签名：`Type[string]`。

## 二、条件类型（Conditional Types）

```ts
SomeType extends OtherType ? TrueType : FalseType;
```

```ts
type NameOrId<T extends number | string> =
  T extends number ? { id: number } : { name: string };

type Flatten<T> = T extends any[] ? T[number] : T;
type Str = Flatten<string[]>;   // string
type Num = Flatten<number>;      // number
```

### 条件类型约束
```ts
type MessageOf<T> =
  T extends { message: unknown } ? T['message'] : never;
```

### infer 关键字（推断）
```ts
type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;

type GetReturnType<Type> =
  Type extends (...args: never[]) => infer Return ? Return : never;

type Num = GetReturnType<() => number>;   // number
```

- `infer` 在真分支声明新类型变量，从比对类型推断。
- 重载函数推断基于**最后一个**签名（最宽泛兜底）。

### 分布式条件类型
```ts
type ToArray<Type> = Type extends any ? Type[] : never;
type StrArrOrNumArr = ToArray<string | number>;  // string[] | number[]

// 避免分发：用方括号包裹
type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;
type ArrOfStrOrNum = ToArrayNonDist<string | number>;  // (string | number)[]
```

## 三、映射类型（Mapped Types）

```ts
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
```

### 映射修饰符
```ts
type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];   // 移除 readonly
};
type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property];           // 移除 optional
};
```

- `+`/`-` 前缀控制 `readonly` 与 `?`（默认 `+`，可省）。

### 键重映射（as，TS 4.1+）
```ts
type Getters<Type> = {
  [Property in keyof Type
    as `get${Capitalize<string & Property>}`]: () => Type[Property]
};
// { getName: () => string; getAge: () => number }

// 过滤键（返回 never 即剔除）
type RemoveKindField<Type> = {
  [Property in keyof Type
    as Exclude<Property, 'kind'>]: Type[Property]
};
```

- 可映射任意联合（不仅 string 键），配合条件类型 `Exclude` 过滤。

## 四、模板字面量类型（Template Literal Types）

```ts
type World = 'world';
type Greeting = `hello ${World}`;   // "hello world"
```

- 插值用联合类型会**交叉相乘**展开：
```ts
type Lang = 'en' | 'ja' | 'pt';
type All = `${Lang}_id`;   // "en_id" | "ja_id" | "pt_id"
```

### 类型推断与模板字面量
```ts
type PropEventSource<Type> = {
  on<Key extends string & keyof Type>(
    eventName: `${Key}Changed`,
    callback: (newValue: Type[Key]) => void,
  ): void;
};
```

### 内置字符串工具类型（TS 4.1+，编译器内建）
| 工具 | 作用 |
|------|------|
| `Uppercase<S>` | 全大写 |
| `Lowercase<S>` | 全小写 |
| `Capitalize<S>` | 首字母大写 |
| `Uncapitalize<S>` | 首字母小写 |

```ts
type Shout = Uppercase<'hello'>;   // "HELLO"
```

## 五、内置工具类型（部分基于上述机制，见 Utility Types）
官方 `lib.es5.d.ts` 提供的常用：`Partial<T>`、`Required<T>`、`Readonly<T>`、`Record<K,V>`、`Pick<T,K>`、`Omit<T,K>`、`Exclude<T,U>`、`Extract<T,U>`、`NonNullable<T>`、`ReturnType<F>`、`Parameters<F>`、`InstanceType<C>`、`Awaited<T>` 等——它们大多由条件类型 / 映射类型实现。

## 要点速查

| 机制 | 语法 | 用途 |
|------|------|------|
| keyof | `keyof T` | 取键联合 |
| 查找 | `T[K]` | 取属性类型 |
| 条件 | `A extends B ? X : Y` | 类型分支 |
| infer | `infer X` | 推断类型变量 |
| 映射 | `{ [P in keyof T]: ... }` | 遍历键生成新类型 |
| 键重映射 | `as ...` | 改名/过滤键 |
| 模板字面量 | `` `a${B}` `` | 字符串类型组合 |

> 跨语言对比：Rust 的泛型关联类型、Scala 的隐式推导、C++ 的模板特化——TS 的条件类型 + `infer` 最接近"编译期模式匹配"，但语法更轻量。映射类型类似 Rust 的 derive 宏思想。

## 衔接

- 实战类型体操技巧见 `typescript-advanced-types.md`
- `infer`/`ReturnType` 在 Nest 拦截器、RxJS 类型中常用
- 模板字面量用于事件名约束，见 `narrowing.md` 的 `on('xxxChanged')` 模式
- 装饰器里用映射类型自动生成方法签名，见 `decorators.md`
