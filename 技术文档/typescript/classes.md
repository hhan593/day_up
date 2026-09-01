# TypeScript Classes（类）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/2/classes.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。本文覆盖 TS 类的字段、修饰符、继承、抽象等。衔接 Nest 的 `@Injectable()` 类、实体类（`09-recipes/sql.md`）。

## 一、类字段（Fields）

```ts
class Point {
  x: number = 0;
  y: number = 0;
}

const p = new Point();
console.log(p.x, p.y);   // 0 0
```

- `strictPropertyInitialization`（strict 下默认开）：属性必须在声明或构造函数里初始化，否则报错。可用 `!` 或 `definite assignment` 断言豁免。

## 二、readonly

```ts
class Greeter {
  readonly name: string = 'world';
  constructor(otherName?: string) {
    if (otherName !== undefined) this.name = otherName;  // 仅构造期可改
  }
}
// g.name = 'x';  // 报错：readonly
```

- `readonly` 仅编译期约束，运行期仍可改（不 freeze）。

## 三、构造函数与参数属性（Parameter Properties）

```ts
class Params {
  constructor(
    public readonly x: number,    // 自动声明字段并赋值
    private y: string,
    protected z: boolean,
  ) {}
}
```

- `public/private/protected/readonly` 放在构造函数参数前，自动变成字段并初始化——少写样板。
- ⚠️ 这是 TS 独有语法糖，编译后仍是字段赋值。

## 四、继承（extends / super）

```ts
class Animal {
  move() { console.log('move'); }
}
class Dog extends Animal {
  bark() { console.log('woof'); }
}
```

- 子类构造函数必须 `super()` 先调用父类构造。
- 重写方法直接同名即可（无需 `@Override`）。

## 五、可见性修饰符

| 修饰符 | 可见范围 |
|--------|----------|
| `public` | 默认，任意 |
| `private` | 仅类内（编译期） |
| `protected` | 类内 + 子类 |
| `readonly` | 不可改 |

- ⚠️ TS 的 `private`/`protected` 是**编译期检查**，运行期不强制（JS 无真正私有）。真私有用 `#field`（ES 标准私有字段）。
```ts
class Foo {
  #secret = 1;   // 真私有，外部访问报错
}
```

## 六、存取器（Getters / Setters）

```ts
class C {
  private _length = 0;
  get length() { return this._length; }
  set length(value: number) {
    this._length = value < 0 ? 0 : value;
  }
}
```

- `get`/`set` 提供受控访问。只 `get` 无 `set` 的属性自动变 `readonly`。

## 七、implements

```ts
interface Pingable {
  ping(): void;
}
class Sonar implements Pingable {
  ping() { console.log('ping'); }
}
```

- `implements` 仅做类型检查：类必须实现接口所有成员，否则报错。不改动运行期行为。
- 一个类可 `implements` 多个接口。

## 八、抽象类（abstract）

```ts
abstract class Base {
  abstract getName(): string;   // 子类必须实现
  printName() {
    console.log(this.getName());
  }
}
class Derived extends Base {
  getName() { return 'derived'; }
}
```

- `abstract` 类不能 `new`，只能被继承。
- `abstract` 方法无实现体，子类必须实现。
- 抽象字段：`abstract field: string`。

## 九、this 类型与方法链式

```ts
class Box {
  value = 0;
  add(n: number): this {    // this 类型表示"当前子类实例"
    this.value += n;
    return this;
  }
}
class ExtendedBox extends Box {
  multiply(n: number): this {
    this.value *= n;
    return this;
  }
}
new ExtendedBox().add(1).multiply(2);   // 链式调用保持类型
```

- `this` 返回类型让子类方法链式调用不丢类型。

## 十、构造器签名与类型收窄

```ts
class FileSystemObject {
  isFile(): this is FileRep {
    return this instanceof FileRep;
  }
}
```

- 类的 `this is X` 守卫（结合 `narrowing.md`）。

## 十一、isolatedModules 与 declare

- `isolatedModules`（如用 Babel/SWC 单文件转译）下，某些写法受限：
  - 不能 `export abstract class` 被重新赋值等。
  - 用 `declare` 只声明类型不生成运行时代码：

```ts
declare class SomeType {
  foo: string;   // 仅类型，无运行期字段
}
```

- ⚠️ 在 `isolatedModules` 或 `verbatimModuleSyntax` 下，未用 `import type` 导入的类型可能报错（见 `typescript-cheatsheet.md`）。

## 要点速查

| 特性 | 写法 |
|------|------|
| 字段 | `x: number = 0` |
| 参数属性 | `constructor(public x: number)` |
| 继承 | `extends` + `super()` |
| 私有 | `private` / `#field` |
| 存取器 | `get/set` |
| 抽象 | `abstract class` / `abstract method()` |
| 链式 | `: this` |

> 跨语言对比：Java 的 `class`/`extends`/`abstract`/`implements` 几乎同款（TS 受 Java/C# 启发）；`#private` 对应 JS 原生私有字段；`parameter properties` 是 TS 独有语法糖，C# 有类似 `public int X` 构造函数简化。

## 衔接

- Nest 的 `@Injectable()` 类、`@Controller()` 类大量用上述类机制，见 `技术文档/nest/01-fundamentals`
- 装饰器是类的元编程扩展，见 `decorators.md`
- 实体类 `@Entity()` 即普通类 + 装饰器，见 `技术文档/nest/09-recipes/sql.md`
