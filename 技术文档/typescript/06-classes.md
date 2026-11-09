# 6. Classes（类）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「Classes」，https://www.typescriptlang.org/docs/handbook/2/classes.html ，© Microsoft；并补充 `useDefineForClassFields`/`override`/`erasableSyntaxOnly` 等官方 Reference 要点；示例以 TS 5.x / `strict` 下验证，标注了预期输出与编译报错）
> 关联：`05-more-on-functions.md`（方法签名与 this 参数）、`07-enums.md`（类内常量）、`08-creating-types-from-types.md`（InstanceType/映射类型造 getter）、`09-decorators.md` 与 `18-decorators-deep.md`（类的元编程）、`11-tsconfig.md`（strictPropertyInitialization/useDefineForClassFields 开关）；Nest 的 `@Injectable()`/实体类见 `/Users/hh/offer/技术文档/nest/01-fundamentals` 与 `09-recipes/sql.md`。

## 1. 类字段（Fields）与初始化检查

```ts
// fields.ts
class Point {
  x: number = 0; // 带类型标注 + 初始化器
  y = 0;         // 类型从初始化器推断为 number
  z: number;     // 只标注不初始化
  constructor() {
    this.z = 0; // 在构造函数里初始化也行
  }
}
const p = new Point();
console.log(p.x, p.y, p.z); // 0 0 0
```

**strictPropertyInitialization**（strict 含此项）：非 `undefined` 类型的字段必须在**声明处**或**构造函数里**初始化，否则报错：

```ts
// strict-init.ts
class Bad {
  name: string;
  // ❌ TS2564: Property 'name' has no initializer and is not definitely assigned in the constructor.
  constructor() {
    this.init(); // ❌ 依然报错！TS 只看构造函数体的直接赋值，不追踪方法调用
  }
  init() { this.name = "x"; }
}
```

三种正规解法：

1. 声明时给默认值：`name: string = "x"`；
2. 构造函数里直接赋值（或在**方法体外的直接赋值**后再调用方法）；
3. **确定赋值断言** `!`：`name!: string`——告诉 TS"我保证用前会赋值"，绕过检查（常配合框架依赖注入、`@Input()` 等场景，滥用会引入 `undefined` 风险，见 04 篇的收窄）。

## 2. `useDefineForClassFields` 与 ES 字段语义坑

TS 5.x 中 `target >= ES2022` 时该选项**默认开启**，类字段按 ES2022 语义用 `Object.defineProperty`（define 语义）而非赋值（assign 语义）。两处经典差异：

**坑 ①：字段覆盖父类 getter。** define 语义下，子类字段无论有无初始化器，都会在实例上定义 own property，**遮蔽**原型链上的 getter：

```ts
// field-shadow-getter.ts
class Base {
  get greeting(): string { return "hi from getter"; }
}
class Derived extends Base {
  greeting = "hello"; // define 语义：实例 own property，getter 永远不会被调用
}
const d = new Derived();
console.log(d.greeting); // "hello"（旧 assign 语义下是 "hi from getter"）
```

**坑 ②：只写类型不写初始化器的字段也会"落地"为 undefined。** 想要"纯类型声明"必须用 `declare`：

```ts
// declare-field.ts
interface WindowInfo { title: string }
class Info implements WindowInfo {
  declare title: string; // 仅类型层面声明，不生成运行时字段
  constructor() {
    // this.title = ... 由外部赋值（如框架填充）
  }
}
```

- `declare` 字段：不 emit 任何代码、不能带初始化器。
- 排查这类问题时先确认 `useDefineForClassFields` 的实际取值（target 决定默认值，可显式写进 tsconfig，见 11 篇）。

## 3. readonly

```ts
// readonly.ts
class Greeter {
  readonly name: string = "world";
  constructor(otherName?: string) {
    if (otherName !== undefined) this.name = otherName; // ✅ 仅构造期可写
  }
}
const g = new Greeter("TS");
// g.name = "x"; // ❌ TS2540: Cannot assign to 'name' because it is a read-only property.
console.log(g.name); // TS
```

- `readonly` 是**纯编译期**约束，运行时不 freeze（`Object.freeze` 才是真冻结）；`(g as any).name = "hack"` 能改。
- `readonly` 可与可见性修饰符组合：`private readonly id: string`。
- readonly 字段可被同类的其他实例"读写"：`other.g.name` 修改是允许的——readonly 限制的是"通过该引用赋值"，不是深度不可变。

## 4. 构造函数（含重载写法）

```ts
// ctor-overload.ts
class Point {
  x = 0;
  y = 0;
  constructor(x: number, y: number);        // 重载 1：坐标
  constructor(fromString: string);          // 重载 2："1,2" 字符串
  constructor(x: number | string, y?: number) {
    if (typeof x === "string") {
      const [sx, sy] = x.split(",");
      this.x = Number(sx);
      this.y = Number(sy);
    } else {
      this.x = x;
      this.y = y as number;
    }
  }
}
const a = new Point(1, 2);      // OK
const b = new Point("1,2");     // OK
// const c = new Point("1", 2); // ❌ 无匹配重载
console.log(a.x, b.y);          // 1 2
```

要点与坑：

1. 构造器重载与函数重载同一套规则（实现签名不可见，见 05 篇第 6 节）；实现签名不能带重载之外的泛型。
2. 派生类构造函数必须**先 `super(...)`**，且在 `super()` 之前不能访问 `this`（`TS17009: 'super' must be called before accessing 'this'`）。
3. 构造函数返回值只能是 `any`/实例类型/void——一般不写。
4. 类的**字段初始化器先于构造函数体执行**（紧跟 `super()` 之后），顺序坑见第 5 节。

## 5. 参数属性（Parameter Properties）

构造函数参数前加可见性/readonly 修饰符，自动声明同名字段并赋值——Nest 源码里随处可见的依赖注入写法：

```ts
// param-props.ts
class Params {
  constructor(
    public readonly x: number, // 自动声明 public readonly 字段并赋值
    private y: string,
    protected z: boolean,
  ) {}
}
const p = new Params(1, "a", true);
console.log(p.x);        // 1
// console.log(p.y);     // ❌ TS2341: Property 'y' is private and only accessible within class 'Params'.
```

编译产物（TS 独有语法糖，等价手写）：

```js
// 编译后的 JS（private 只是编译期，y 照样赋值）
class Params {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
```

- ⚠️ 参数属性是**不可擦除语法**：`erasableSyntaxOnly`（TS 5.8，配合 Node `--experimental-strip-types`）下直接禁用（见 11 篇）。
- ⚠️ 字段初始化器与参数属性的执行顺序：**初始化器先、参数属性后**（super 之后按声明顺序执行），二者同名会互相覆盖——避免混用。

## 6. 存取器（getter / setter）

```ts
// accessor.ts
class C {
  #size = 0; // 真·私有字段（第 7 节）
  get size(): number {
    return this.#size;
  }
  set size(value: string | number | boolean) { // TS 4.3+：get/set 可以是不同类型
    const num = Number(value);
    if (!Number.isNaN(num)) this.#size = num;
  }
}
const c = new C();
c.size = "42"; // ✅ set 接受多种类型
console.log(c.size); // 42（get 收窄为 number）
// c.size = {};      // ❌ TS2322
```

- **只有 get 没有 set**：该属性自动带 `readonly`，外部赋值报 `TS2540`。
- TS 4.3 起支持 get/set **不同类型**（上例）与**不同可见性**（`public get` + `protected set`）。
- ⚠️ 存取器依赖 `target >= ES5`；`useDefineForClassFields: true` 下，同名字段的 define 会静默遮蔽存取器（第 2 节坑 ①），二者不要混用。
- 手写 `get xxx()` 类型被官方映射类型批量生成的方式见 08 篇第六章（模板字面量造 getter 类型）。

## 7. 可见性：public / private / protected / #private

| 修饰符 | 检查时机 | 子类可访问 | 类外可访问 | 运行时防护 |
|---|---|---|---|---|
| `public`（默认） | 编译期 | ✅ | ✅ | 无 |
| `protected` | 编译期 | ✅ | ❌ | 无 |
| `private` | 编译期 | ❌ | ❌ | 无（可绕过） |
| `#field`（ES 标准） | 编译期 + 运行时 | ❌ | ❌ | ✅ 真·不可访问 |

```ts
// visibility.ts
class Base {
  public a = 1;
  protected b = 2;
  private c = 3;
  #d = 4; // ES 私有字段
}
class Derived extends Base {
  show() {
    console.log(this.a, this.b); // 1 2
    // console.log(this.c);      // ❌ TS2341: 'c' is private...
    // console.log(this.d);      // ❌ #d 在子类也不可见（且必须带 # 访问）
  }
}
const b = new Base();
// b.c; // ❌ TS2341
// b.#d; // ❌ 运行时也抛 TypeError: Private field '#d' must be declared in an enclosing class
```

private（编译期）的三个坑：

1. **运行期可绕过**：`(b as any).c`、甚至 `b["c"]`（方括号绕过属性检查）都能访问；JSON 序列化照样带出 private 字段。
2. **`private` 会写进 `.d.ts`**，对使用者仍可见"存在但不可用"；`#field` 才是彻底私有。
3. 需要"鸭子检测"私有性时用 `#x in obj`（ES2022，TS 4.6+）：`if ("#d" in obj)`。

> 设计取舍：内部协作代码用 `private`（测试可 mock、结构轻）；字段绝不能被外部碰（安全/不变量）用 `#field`；需要给子类开洞用 `protected`。

## 8. static 成员与 static 块

```ts
// static.ts
class Config {
  static version = "1.0";
  static instances = 0;
  static #cache = new Map<string, string>(); // static 也能用 # 与可见性修饰符
  static {
    // TS 4.11+ / ES2022：static 初始化块——可写 try/catch 等复杂逻辑
    try {
      Config.version = process.env.APP_VERSION ?? "dev";
    } catch {
      Config.version = "unknown";
    }
  }
}
console.log(Config.version); // "dev"（取决于环境变量）
// new Config().version;     // ❌ TS2339: Property 'version' does not exist on type 'Config'.
```

- static 成员通过**类名**访问，不在实例上；子类可继承访问父类 static（`Derived.parentStatic`）。
- ⚠️ static 成员**不能引用类的类型参数**：`class C<T> { static x: T }` 报 `TS2302: Static members cannot reference class type parameters`。
- 工具类静态方法 vs 模块级导出函数：现代 TS 更倾向后者（tree-shaking 友好，见 10-modules.md）。

## 9. 继承：extends、覆盖检查与 override

```ts
// override.ts
class Animal {
  move(distance = 0) { console.log(`Animal moved ${distance}m`); }
}
class Dog extends Animal {
  constructor() { super(); } // 有构造器就必须调 super()
  move(distance = 5) {       // 同名即覆盖，无需注解
    super.move(distance);    // super 调用父类实现
    console.log("tail wagging");
  }
}
new Dog().move(); // Animal moved 5m / tail wagging
```

**方法覆盖的签名检查**：子类方法必须与父类兼容，参数逆变、返回协变（`TS2416: Property 'move' in type 'Dog' is not assignable to the same property in base type 'Animal'`——参数写得更窄即触发，见 12 篇逆变）。

**override 关键字**（TS 4.3+）：显式声明"我在覆盖父类成员"；配合 **noImplicitOverride**（strict 外的可选项，推荐开）强制要求：

```ts
// no-implicit-override.ts
class Base { greet() {} }
class Derived1 extends Base {
  override greet() {} // ✅
}
class Derived2 extends Base {
  // greet() {} // ❌ TS4114: This member must have an 'override' modifier because it overrides a member in the base class 'Base'.
}
class Derived3 extends Base {
  // override hello() {} // ❌ TS4113：'hello' 根本不在 Base 上——override 反向帮你抓拼写错误
}
```

- `override` 的价值：父类删掉某方法后，所有子类的"悬空覆盖"立即编译报错，而不是静默变成新方法。

## 10. implements vs extends

```ts
// implements.ts
interface Pingable {
  ping(): void;
}
class Sonar implements Pingable {
  ping() { console.log("ping!"); }
}
// class Ball implements Pingable {
//   pong() {}
// }
// ❌ TS2420: Class 'Ball' incorrectly implements interface 'Pingable'.
//    Property 'ping' is missing in type 'Ball' but required in type 'Pingable'.
```

核心区别：

| | `extends` | `implements` |
|---|---|---|
| 作用 | **继承实现**（拿到方法体/字段） | **只做类型检查**，不改变类的类型 |
| 多个 | 只能继承一个类 | 可 implements 多个接口：`implements A, B` |
| 默认值/方法体 | 一并继承 | 什么都不会带过来，全靠自己写 |

两个官方点名的坑：

1. **implements 不提供上下文推断**：方法参数不会被接口类型"注入"，独立方法里是隐式 any：

```ts
// checkable.ts
interface Checkable {
  check(name: string): boolean;
}
class NameChecker implements Checkable {
  // check(s) { ... }        // ❌ noImplicitAny：TS7006（implements 不会把 s 推断成 string！）
  check(s: string) { return s.length > 0; } // ✅ 自己标注
}
```

2. **接口字段没有"默认值"概念**：`implements { max: number }` 必须自己声明并初始化字段，漏写即 `TS2420`。

## 11. abstract 类与抽象成员

```ts
// abstract.ts
abstract class Base {
  abstract getName(): string;  // 抽象方法：无实现体，子类必须实现
  abstract area: number;       // 抽象字段（TS 4.2+）
  printName() {                // 具体方法可以调用抽象成员
    console.log("Hello, " + this.getName());
  }
}
// new Base();
// ❌ TS2511: Cannot create an instance of an abstract class.

class Derived extends Base {
  name2 = "derived";
  getName() { return this.name2; }   // 不实现则 TS2515: Non-abstract class 'Derived' does not
  area = 1;                          // implement inherited abstract member 'getName'
}
new Derived().printName(); // Hello, derived
```

**抽象类作为"构造器参数"的坑**（官方例子）：需要"传一个类进来 new"时，普通构造签名会放行抽象类：

```ts
// abstract-ctor.ts
function greet(ctor: new () => Base) {
  const instance = new ctor();
  instance.printName();
}
// greet(Base);    // ❌ TS2345：抽象类不能当具体构造器
greet(Derived);    // ✅

function greetSafe(ctor: abstract new () => Base) { // ✅ 用 abstract new 签名：两者都接受
  const instance = new ctor();
  instance.printName();
}
greetSafe(Base);    // OK
greetSafe(Derived); // OK
```

- 抽象类 = "半成品模板"：不能 `new`，能被 extends，可与设计模式的 Template Method 配合（Nest 的抽象 Repository/Provider 常见）。

## 12. this 类型与流式 API（链式调用）

`this` 作为**返回类型**表示"当前类的动态类型"，子类调用时返回子类——链式调用不丢类型：

```ts
// fluent.ts
class BasicCalculator {
  constructor(public value: number = 0) {}
  add(operand: number): this {
    this.value += operand;
    return this;
  }
  multiply(operand: number): this {
    this.value *= operand;
    return this;
  }
}
class ScientificCalculator extends BasicCalculator {
  sin(): this {
    this.value = Math.sin(this.value);
    return this;
  }
}
const result = new ScientificCalculator(2).multiply(5).sin().add(1);
console.log(result.value);      // 约 -0.9589（sin(10) + 1）
const check: ScientificCalculator = result; // ✅ 中途没有被"降级"成 BasicCalculator
```

- 若返回类型写死 `BasicCalculator`，`.sin()` 之后的链就断了（编译错误）；`this` 类型让每个子类都返回自己。
- `this is X` 类型守卫（类方法收窄）也是 `this` 类型的应用，见 04 篇第 7 节与第 13 节。
- Builder/Query Builder（如 TypeORM 的 `.where().orderBy()` 链）全靠这一机制。

## 13. 其他重要机制

### 13.1 类与 interface 同名合并（declaration merging）

```ts
// merge.ts
class Album {
  label: Album.AlbumLabel = new Album.AlbumLabel();
  static TITLE = "album";
}
namespace Album { // 与类同名：合并到"静态侧"
  export class AlbumLabel {}
  export function describe() { return `a ${Album.TITLE}`; }
}
console.log(Album.describe()); // a album
```

- 类只有"静态侧 + 实例侧"两个命名空间，`namespace Album` 把成员挂到类本身（静态侧）上；Nest 内部就用这招在类上暴露关联类型。

### 13.2 类表达式与 InstanceType

```ts
// class-expression.ts
const SomeClass = class Named {
  x = 1;
};
type SomeInstance = InstanceType<typeof SomeClass>; // 实例类型"反射"出来
const inst: SomeInstance = new SomeClass();
console.log(inst.x); // 1
```

- 类表达式适合 mixin/动态创建类；`InstanceType<typeof C>` 是拿到"类 → 实例"类型映射的通用手法（08 篇）。

### 13.3 泛型类

```ts
// generic-class.ts
class Box<T> {
  contents: T;
  constructor(value: T) { this.contents = value; }
  get(): T { return this.contents; }
}
const b = new Box("hello"); // Box<string>
console.log(b.get());       // hello
// class Bad<T> { static x: T; } // ❌ TS2302：static 不能引用类型参数 T
```

### 13.4 `this is X` 守卫与 declare class

```ts
// this-guard.ts
class FileSystemObject {
  isFile(): this is FileRep { return this instanceof FileRep; } // 方法即守卫
  constructor(public path: string, protected networked: boolean) {}
}
class FileRep extends FileSystemObject {
  constructor(path: string, public content: string) { super(path, false); }
}
const fso: FileSystemObject = new FileRep("a.txt", "hi");
if (fso.isFile()) {
  console.log(fso.content); // hi（收窄为 FileRep）
}
```

```ts
// declare-class.ts（isolatedModules 场景）
declare class SomeType { // 只声明类型形状，不生成任何运行时代码
  foo: string;
}
```

- `declare class` 用于描述"运行时已存在"的类（第三方全局变量、UMD 库）；在 `isolatedModules` 下某些类型导出必须显式 `export type`（见 10-modules.md）。

## 14. 要点速查

| 特性 | 写法 | 关键点 |
|---|---|---|
| 字段 | `x: number = 0` | strictPropertyInitialization 强制初始化 |
| 确定赋值 | `name!: string` | 绕过初始化检查，慎用 |
| 字段语义 | `useDefineForClassFields` | ES2022+ 默认 define，遮蔽 getter |
| readonly | `readonly x: T` | 仅编译期，构造期可写 |
| 参数属性 | `constructor(private x: T)` | 自动声明字段，不可擦除语法 |
| 存取器 | `get/set` | 只 get 自动 readonly；4.3+ 异型 |
| 可见性 | private/protected/#field | 前者编译期，# 真·运行时私有 |
| static | `static x`、`static {}` | 不能引用类的类型参数 |
| 覆盖 | `override` + `noImplicitOverride` | 抓父类删方法的悬空覆盖 |
| 实现 | `implements A, B` | 只检查不注入，参数类型要自己写 |
| 抽象 | `abstract class` / `abstract new ()` | 不可 new；构造签名放行抽象类 |
| 链式 | `: this` | 子类返回子类，流式 API |

> 跨语言对比：`class`/`extends`/`abstract`/`implements` 几乎与 Java/C# 同款（TS 受其启发），但 TS 的 `private` 只是编译期契约，真正对应 Java `private` 语义的是 ES `#field`；参数属性类似 Kotlin 主构造器的 `val/var`；`: this` 流式类型类似 Java 的自引用泛型 `class B<S extends B<S>>`，TS 用 `this` 类型一行搞定。

## 15. 常见坑汇总

1. 字段只在 init() 方法里赋值：`TS2564`——TS 不追踪跨方法赋值，声明处或构造器直接赋值，或 `!` 断言（第 1 节）。
2. 子类字段遮蔽父类 getter：`useDefineForClassFields: true` 下字段 define 到实例上，getter 失效——避免同名字段与存取器混用，必要时 `declare`（第 2 节）。
3. 以为 readonly 不可改：只是编译期，`(x as any)` 或方括号可绕过（第 3 节）。
4. 子类构造器忘写 `super()` 或在 super 前用 this：`TS17009`（第 4 节）。
5. 参数属性与显式字段同名互相覆盖（初始化器先、参数属性后）；`erasableSyntaxOnly` 下禁用参数属性（第 5 节）。
6. 只写 get 却想赋值：`TS2540`——补 set 或改用普通字段（第 6 节）。
7. 用 `private` 当真私有：运行时可绕过、会写进 .d.ts——要硬隔离用 `#field`（第 7 节）。
8. static 引用类型参数：`TS2302`（第 8 节）。
9. 忘写 `override`：`noImplicitOverride` 下 `TS4114`；反过来 `override` 拼错成员名 `TS4113` 也能抓 bug（第 9 节）。
10. 以为 implements 会带入默认值/参数推断：什么都不会带，字段和方法参数都要自己写（第 10 节）。
11. 抽象类被当具体类传入 `new () => T`：改用 `abstract new () => T`（第 11 节）。
12. 链式方法返回类型写死父类，子类链断裂：返回 `this` 类型（第 12 节）。

## 16. 衔接

- 类方法签名、`this` 参数、重载在方法上的应用见 `05-more-on-functions.md`。
- `this is X` 收窄、`!` 断言后的 undefined 风险见 `04-narrowing.md`。
- 装饰器（`@Injectable()`、方法/属性装饰器）是类的元编程扩展，见 `09-decorators.md` 与 `18-decorators-deep.md`。
- `InstanceType`、映射类型生成 getter 类型、`keyof` 摘类成员见 `08-creating-types-from-types.md`。
- `useDefineForClassFields`/`strictPropertyInitialization`/`experimentalDecorators` 等开关见 `11-tsconfig.md`。
- Nest 的 `@Injectable()` 类、TypeORM 实体（`@Entity()` 即"普通类 + 装饰器"）见 `/Users/hh/offer/技术文档/nest/01-fundamentals` 与 `09-recipes/sql.md`。

## 17. 一句话总结

> TS 的类 = ES 类 + 一层编译期契约：字段初始化与 `strictPropertyInitialization` 兜住漏赋值，`useDefineForClassFields` 的 define 语义带来"字段遮蔽 getter"的现代坑，可见性三档中只有 `#field` 是真私有，`override`/`noImplicitOverride` 把继承演化变成编译错误，`implements` 只检查不注入，而 `abstract new () => T`、`: this` 链式返回与 `this is X` 守卫是类在类型系统里最有味道的三个出口。
