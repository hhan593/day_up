# 9. 装饰器（旧实验标准全展开）

> 来源可信度：**官方文档确认**（TS 官方 Handbook「Decorators」页——旧实验装饰器 + TS 5.0 发布博客；以 TypeScript 5.x 时代为准。Stage 3 新装饰器另见 `18-decorators-deep.md`，本篇以旧代为主）
> 关联：`11-tsconfig.md`（两个 flag 与 target 联动）、`06-classes.md`（类与字段机制）、`18-decorators-deep.md`（Stage 3 新装饰器）、`15-typescript-new-features.md`（5.0 变更）、`/Users/hh/offer/技术文档/nest/01-fundamentals/dependency-injection.md`（DI 消费元数据）、`/Users/hh/offer/技术文档/nest/01-fundamentals/custom-decorators.md`（自定义装饰器实战）

## 1. 定位：两代装饰器，本篇讲旧代

| 对比点 | 旧 `experimentalDecorators`（Stage 2） | TS 5.0 新标准（Stage 3） |
|--------|----------------------------------------|--------------------------|
| 启用 | 必须 `experimentalDecorators: true` | 默认支持（无需 flag） |
| 提案 | TC39 早期旧提案 | 当前 TC39 Stage 3 |
| 兼容性 | 旧逻辑 | **与旧装饰器不兼容** |
| 元数据 | 支持 `emitDecoratorMetadata` | **不支持**自动类型元数据 |
| 参数装饰 | ✅ 允许 | ❌ 不允许 |
| 语法位置 | 仅能在声明前 | 可放 `export` 前/后（不能混用） |
| 装饰器形态 | `(target, key?, descriptor?) => ...` | `(value, context) => ...` 统一 context |

> ⚠️ **Nest 现状**：Nest 仍基于旧 `experimentalDecorators`（依赖 `reflect-metadata` 做 DI 的类型反射）。TS 5 新装饰器不发射元数据、不允许参数装饰器，Nest 无法直接迁移。**写 Nest 必须开 `experimentalDecorators: true`**。新标准面向未来与纯 TS 库，见 `18-decorators-deep.md`。

## 2. 启用：tsconfig 两个 flag

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2021",                 // Nest 类项目避免 ES2022+（见下方 useDefineForClassFields 坑）
    "experimentalDecorators": true,     // flag 1：允许使用旧装饰器语法
    "emitDecoratorMetadata": true       // flag 2：为被装饰的成员发射"设计期类型"元数据
  }
}
```

两个 flag 各管一件事，**拆开理解**：

- `experimentalDecorators`：只决定"能不能写旧装饰器、怎么编译"。不开它，`@sealed` 这类旧写法会直接报编译错误（形如 `Unable to resolve signature of class decorator when called as an expression`——因为 TS 会按新标准装饰器的签名去匹配你的旧式函数，匹配不上）。
- `emitDecoratorMetadata`：只决定"编译时是否给被装饰的类/方法/属性注入 `design:*` 元数据"。不开它装饰器照样能跑，但 **Nest DI 会失效**（容器读不到构造函数参数类型，见第 12 节）。

**常见坑（两个都高频出现）：**

1. **`useDefineForClassFields` 与旧属性装饰器冲突**。`target: ES2022+` 时该选项默认 `true`，类字段改用 `Object.defineProperty` 语义，旧属性装饰器拿不到初始值、返回值也不再生效。Nest 模板用 `ES2021`（默认 false）所以没事；自己配项目时要么 `target ≤ ES2021`，要么显式 `"useDefineForClassFields": false`。
2. **Monorepo 里只在根 tsconfig 开 flag**：`extends` 继承的是 `compilerOptions`，若子包 tsconfig 覆盖了 `target` 或忘记继承，装饰器行为会静默变化。建议把两个 flag 放进公共 base（见 `11-tsconfig.md` extends 一节）。
3. **`tsc --showConfig` 验证**最终生效配置，别靠猜。

## 3. 五种装饰器签名总表

旧标准共 5 种装饰目标，签名与返回值语义各不相同，**这张表是面试与实战的核心**：

| 装饰器 | 签名 | 参数语义 | 返回值语义 |
|--------|------|----------|-----------|
| 类 | `(constructor: Function) => Function \| void` | 被装饰类的构造函数 | 返回新构造函数则**替换原类**；返回 `undefined` 则仅副作用 |
| 方法 | `(target, key: string\|symbol, descriptor: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> \| void` | `target`=prototype（静态方法=构造函数）；`descriptor`=该方法的属性描述符 | 返回新 descriptor 则**替换原描述符** |
| 访问器 | 同方法装饰器 | 只作用于 `get/set` 对中**先声明的那一个** | 同方法装饰器 |
| 属性 | `(target, key: string\|symbol) => void` | 无 descriptor | **返回值被忽略**，只能做副作用（记元数据） |
| 参数 | `(target, key: string\|symbol\|undefined, index: number) => void` | 方法参数 `key`=方法名；**构造函数参数 `key=undefined`**；`index`=参数位次 | **返回值被忽略**，只能记元数据 |

`target` 到底是谁，一条规则记牢：

- **实例成员**（方法/访问器/属性/方法参数）→ `target` 是 `Cls.prototype`；
- **静态成员** → `target` 是 `Cls` 构造函数本身；
- **构造函数参数** → `target` 是 `Cls`，且 `propertyKey === undefined`。

```ts
// targets.ts —— 验证 target 的指向
function probe(label: string): any {
  return (target: any, key?: string | symbol, indexOrDesc?: any) => {
    console.log(`[${label}] target === prototype?`, target === Demo.prototype,
      '| key:', String(key), '| isCtorParam:', key === undefined);
  };
}

class Demo {
  @probe('instance-prop') prop = 1;      // target === Demo.prototype
  @probe('static-prop') static sp = 1;   // target === Demo（构造函数）
  method(@probe('method-param') a: string) {}   // target === Demo.prototype
  constructor(@probe('ctor-param') _a: number) {} // target === Demo，key === undefined
}
```

## 4. 执行顺序：工厂求值 vs 装饰应用

两条官方规则 + 一条类内顺序，背下来并动手验证：

1. **同一声明上的多个装饰器**：装饰器**表达式**（含工厂调用）自上而下求值；求值结果作为函数**自下而上**应用（即 `(f ∘ g)(x) = f(g(x))`，贴近数学复合顺序）。
2. **类内部顺序**（官方文档明确）：
   1. 实例成员：按声明顺序，对每个成员**先应用其参数装饰器、再应用方法/访问器/属性装饰器**；
   2. 静态成员：同上；
   3. 构造函数参数装饰器；
   4. 类装饰器（最后）。

```ts
// order-demo.ts
// 运行：npx tsx order-demo.ts（tsconfig 需开 experimentalDecorators + emitDecoratorMetadata）
function trace(label: string): any {
  console.log(`evaluate: ${label}`);              // 工厂被调用 → 求值阶段
  return () => console.log(`apply: ${label}`);    // 返回的才是装饰器本体 → 应用阶段
}

@trace('class')
class Demo {
  @trace('property') prop = 1;
  @trace('method') method(@trace('param') a: string) {}
}

// 预期输出（逐行）：
// evaluate: property      ← 成员按声明顺序求值
// apply: property
// evaluate: method
// evaluate: param         ← 同一方法的参数装饰器先于方法装饰器求值
// apply: param            ← 且应用也先于方法
// apply: method
// evaluate: class         ← 类装饰器最后
// apply: class
```

组合顺序验证（官方 Handbook 经典例子）：

```ts
// compose.ts
function f(): any { console.log('f(): evaluated'); return () => console.log('f(): called'); }
function g(): any { console.log('g(): evaluated'); return () => console.log('g(): called'); }

class C {
  @f() @g() method() {}
}
// 输出：
// f(): evaluated    ← 求值自上而下
// g(): evaluated
// g(): called       ← 应用自下而上
// f(): called
```

> 记忆法：**求值像读文章（从上往下），应用像叠洋葱（最里层先包）**。`@f() @g()` 等价于 `f()(g()(原始成员))`。

## 5. 类装饰器

参数是构造函数，两个典型用途：**改类（seal/freeze）** 与 **换类（返回新构造函数）**。

```ts
// class-decorator.ts
// 用途一：直接修改类（只副作用，不返回）
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) { this.greeting = message; }
  greet() { return `Hello, ${this.greeting}`; }
}

// 用途二：返回新构造函数，替换原类（AOP 常用：注入字段、包装构造逻辑）
function withTimestamp<T extends { new (...args: any[]): {} }>(ctor: T) {
  return class extends ctor {
    createdAt = new Date();   // 给所有实例注入新字段
  };
}

@withTimestamp
class Task {
  title: string;
  constructor(title: string) { this.title = title; }
}

const t = new Task('写周报');
console.log((t as any).createdAt instanceof Date);  // true
console.log(t.title);                               // 写周报

// 坑：返回的新类上，TS 静态类型仍是"原类"，新增字段要通过声明合并补类型：
//   declare module './class-decorator' {}   // 或直接在类上 interface Task { createdAt: Date }
```

**坑**：类装饰器返回的新构造函数会**丢失原类的 `private`/`protected` 成员可见性**（新类的类型和原类不再结构兼容）。官方做法是用一个类型技巧：让返回类型是"一个私有一致性交叉"，保证新旧类互相兼容：

```ts
function printable<T extends { new (...args: any[]): {} }>(ctor: T) {
  return class extends ctor {
    toString() { return `${ctor.name}#${(this as any).id ?? ''}`; }
  };
  // 若要保住 private 兼容性，官方写法是返回类型标注成：
  //   class extends ctor { private __brand: void }  —— 用私有字段"钉住"类型一致性
}
```

## 6. 方法装饰器：descriptor 实战

`TypedPropertyDescriptor<T>` 就是对 `Object.defineProperty` 描述符的类型化，关键成员：

| 成员 | 含义 | 修改它 |
|------|------|--------|
| `value` | 函数本体 | 换实现（包装/AOP） |
| `writable` | 能否重新赋值 | `false` → 只读方法 |
| `enumerable` | 是否可枚举 | 控制序列化/遍历行为 |
| `configurable` | 能否再改/删除描述符 | `false` → 锁死 |
| `get` / `set` | 仅访问器有 | 访问器装饰器里用 |

三个高频实战装饰器（可直接抄进项目）：

```ts
// method-decorators.ts
function readonly(target: any, key: string, desc: TypedPropertyDescriptor<any>) {
  desc.writable = false;        // 重新赋值将在严格模式下抛 TypeError
  return desc;
}

function debounce(waitMs: number) {                    // 工厂：参数化
  return function (target: any, key: string,
                   desc: TypedPropertyDescriptor<(...args: any[]) => void>) {
    const original = desc.value!;
    let timer: ReturnType<typeof setTimeout> | undefined;
    desc.value = function (...args: any[]) {
      clearTimeout(timer);
      timer = setTimeout(() => original.apply(this, args), waitMs);
    };
    return desc;
  };
}

function log(target: any, key: string, desc: TypedPropertyDescriptor<any>) {
  const original = desc.value!;
  desc.value = function (...args: any[]) {
    const start = performance.now();
    try {
      return original.apply(this, args);
    } finally {
      const ms = (performance.now() - start).toFixed(2);
      console.log(`[log] ${key}(${JSON.stringify(args)}) took ${ms}ms`);
    }
  };
  return desc;
}

class ApiService {
  @log                                  // 多个装饰器：自下而上应用，log 先包、readonly 后锁
  @readonly
  fetchUser(id: number) {
    return Promise.resolve({ id, name: '韩梅梅' });
  }

  @debounce(300)
  onSearch(keyword: string) { /* 触发搜索 */ }
}

const api = new ApiService();
api.onSearch('ts');    // 300ms 后才真正执行（只保留最后一次）
(api as any).fetchUser = () => {};  // 严格模式下：TypeError: Cannot assign to read only property
```

**坑**：

1. **箭头函数类字段不能被方法装饰器装饰**——`greet = () => {}` 是**属性**不是方法，要配属性装饰器（且拿不到 descriptor）。这是团队里最常见的"装饰器不生效"原因。
2. `desc.value` 类型上是 `T | undefined`，写包装前要 `!` 或判空（重载方法声明的 `declare` 形态没有 value）。
3. 包装函数务必用 `original.apply(this, args)` 保留 `this`，并把**返回值 return 出去**，否则调用方拿到 `undefined`。
4. 装饰器在**类定义时**执行一次，之后每次调用走的都是包装后的函数——`debounce` 的 `timer` 是"每个方法每类一份"，多实例会共享；要实例隔离需在 `constructor` 阶段处理或用 WeakMap。

## 7. 访问器装饰器

与方法装饰器同签名，但**一条 get/set 链只能装饰一次**：装饰器作用于整对 accessor 的描述符；`get` 和 `set` 同时挂装饰器会直接编译报错。

```ts
// accessor-decorator.ts
function nonNegative(target: any, key: string, desc: TypedPropertyDescriptor<number>) {
  const original = desc.get!;
  desc.get = function () {
    return Math.max(0, original.call(this));   // 拦截 getter 输出
  };
  return desc;
}

class Counter {
  private _count = -5;

  @nonNegative
  get count(): number { return this._count; }
  set count(v: number) { this._count = v; }   // 同一成员的 set 不能再挂装饰器
}

const c = new Counter();
console.log(c.count);   // 0（-5 被钳到 0）
```

**坑**：先声明 `get` 还是 `set` 决定装饰器挂在哪个描述符上；如果只装饰了 `set`（而 `get` 先声明），装饰器实际拿到的仍是整对 accessor 先声明方的 descriptor——想要两者都拦，应在唯一的装饰器里同时处理 `desc.get` 与 `desc.set`。

## 8. 属性装饰器：无 descriptor，只能记元数据

签名 `(target, key) => void`，**没有第三个参数**，返回值被忽略。它拿不到属性值，也拦不住初始化——类字段的赋值发生在**构造函数执行时**，而装饰器在**类定义时**运行，两者不同期。

```ts
// property-decorator.ts
import 'reflect-metadata';

function field(label: string) {
  return (target: any, key: string) => {
    // 唯一能做的事：把信息写到元数据里，交给"别人"消费
    const fields = Reflect.getOwnMetadata('model:fields', target) ?? [];
    fields.push({ key, label });
    Reflect.defineMetadata('model:fields', fields, target);
  };
}

class User {
  @field('用户名') name!: string;
  @field('年龄') age!: number;
}

console.log(Reflect.getMetadata('model:fields', User.prototype));
// [ { key: 'name', label: '用户名' }, { key: 'age', label: '年龄' } ]
```

典型消费方：ORM 的列映射、表单校验器、序列化白名单。**坑**：

1. 想做"只读属性/格式化"，属性装饰器**做不到**（没有 descriptor 可改）——正确姿势是换成 `get` 访问器 + 访问器装饰器，或用新标准的字段装饰器（见 `18-decorators-deep.md`）。
2. 属性装饰器与 `useDefineForClassFields: true` 组合时行为退化（第 2 节坑 1）。

## 9. 参数装饰器：Nest `@Param` 的原理

签名 `(target, key, index) => void`。它**只负责"在某个位置打个标记"**，真正消费标记的是方法/类装饰器或框架运行时——参数装饰器自己返回什么都没用。

```ts
// param-decorator.ts
import 'reflect-metadata';

// 简化版 @Param：把"第 index 个参数从哪取值"记进元数据
function Param(source: string): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    if (propertyKey === undefined) return;         // 构造函数参数场景走另一套 key
    const key = String(propertyKey);
    const routes: string[] =
      Reflect.getOwnMetadata('route:params', target, key) ?? [];
    routes[parameterIndex] = source;               // 按参数位次登记取值来源
    Reflect.defineMetadata('route:params', routes, target, key);
  };
}

class CatsController {
  findOne(@Param('id') id: string, @Param('query') q: unknown) {
    return `cat ${id}`;
  }
}

console.log(Reflect.getMetadata('route:params', CatsController.prototype, 'findOne'));
// [ 'id', 'query' ] —— Nest 的路由管道就是按这张表把 req 对应位置的数据喂进参数
```

官方 `@required` 示例同思路（参数装饰器标记 + 属性装饰器/方法包装消费）：

```ts
function required(target: Object, propertyKey: string | symbol, index: number) {
  const requiredKeys: number[] = Reflect.getOwnMetadata('required', target, propertyKey) ?? [];
  requiredKeys.push(index);
  Reflect.defineMetadata('required', requiredKeys, target, propertyKey);
}
// 真正抛错的是另一个包装方法体的装饰器：调用时检查 required 位置是否为 null/undefined
```

**坑**：只写参数装饰器、没有任何装饰器消费元数据时，元数据"记了没人读"，且 `emitDecoratorMetadata` 关闭时连 `design:paramtypes` 都不会有——参数装饰器几乎总是成对出现。

## 10. reflect-metadata 与三种 design:* 元数据键

`reflect-metadata` 是装饰器元数据的 **polyfill 库**（把 `Reflect.defineMetadata/getMetadata` 等挂到全局 `Reflect` 上）。开了 `emitDecoratorMetadata` 后，TS 编译器会为**被装饰成员**自动注入三类设计期元数据：

| 元数据键 | 挂在哪 | 值 |
|----------|--------|-----|
| `design:type` | 属性 | 属性的"值构造器"（如 `String`、`Number`、自定义类）；方法上为 `Function` |
| `design:paramtypes` | 类（构造）/方法 | 参数类型构造器数组（`[String, Number, UserService...]`） |
| `design:returntype` | 方法 | 返回值类型构造器（`Promise`、`Number`、`void 0`...） |

```ts
// metadata-demo.ts
// 运行前提：experimentalDecorators + emitDecoratorMetadata + 安装 reflect-metadata
import 'reflect-metadata';

class ConfigService { get(key: string) { return key; } }

@InjectableLike()
class App {
  name: string = 'app';
  constructor(private config: ConfigService) {}

  load(@Log() id: number): Promise<string> { return Promise.resolve(String(id)); }
}

function InjectableLike(): ClassDecorator { return () => {}; }
function Log(): ParameterDecorator { return () => {}; }

console.log(Reflect.getMetadata('design:paramtypes', App));   // [ [Function: ConfigService] ]
console.log(Reflect.getMetadata('design:type', App.prototype, 'name'));  // [Function: String]
console.log(Reflect.getMetadata('design:paramtypes', App.prototype, 'load')); // [ [Function: Number] ]
console.log(Reflect.getMetadata('design:returntype', App.prototype, 'load')); // [Function: Promise]
```

**核心限制（面试高频）**：`design:*` 只能表达"构造函数引用"。以下类型会退化为 `Object`：

- interface、type 别名（编译后不存在）；
- 联合类型（`string | number` → `Object`）；
- 泛型实例（`Array<string>` → `Array`，元素信息全丢）。

这正是 Nest 里 **依赖是 interface / 非类 token 时必须手动 `@Inject('TOKEN')`** 的根本原因——自动元数据里根本没有它的类型信息。

```ts
// App 建构依赖若是接口，design:paramtypes 里只会是 Object：
constructor(private config: AbstractConfig) {}
// 报错（运行时）：Nest can't resolve dependencies of the App...
// 修复：constructor(@Inject('CONFIG') private config: AbstractConfig) {}
```

> ⚠️ 官方一直标注：装饰器元数据是**实验特性**，可能破坏性变更；`reflect-metadata` 需要在**所有使用元数据的模块之前**导入一次（通常放 `main.ts` 第一行）。

## 11. 装饰器工厂与组合

工厂 = 返回装饰器的函数，解决"装饰器要传参"的问题。两种用法的兼容写法：

```ts
// factory.ts
// 写法一：直接装饰器（无参）
function sealed(constructor: Function) { Object.seal(constructor); }

// 写法二：工厂（带参）
function color(value: string): ClassDecorator {
  return (constructor) => console.log(`${constructor.name} painted ${value}`);
}

@color('red') class Red {}
@color('blue') class Blue {}   // 工厂必须在类定义时"调用"，@color 少了 () 会报错

// 兼容写法：一个装饰器既支持 @dec 又支持 @dec()（利用参数判空）
function flexible(...args: any[]): any {
  if (args.length === 1) {
    // @flexible —— args = [target]，直接作为装饰器用
    const [target] = args;
    console.log('direct:', target.name);
  } else {
    // @flexible(x) —— args = [x]，返回真正的装饰器
    const [opt] = args;
    return (target: Function) => console.log('factory:', target.name, opt);
  }
}
@flexible class A {}
@flexible('opts') class B {}
```

> 坑：`@color`（漏括号）传给类的是 `color` 函数本身而非返回的装饰器，多数情况直接编译报错或行为错乱。类型上用 `ClassDecorator` / `MethodDecorator` / `ParameterDecorator` 这些内置别名来约束工厂返回值，能提前暴露签名错误。

## 12. Nest DI 如何消费这些元数据

把前几节串起来，就是 Nest 依赖注入的完整链路（详见 `/Users/hh/offer/技术文档/nest/01-fundamentals/dependency-injection.md`）：

```text
① @Injectable() 类装饰器标记"此类的构造参数需要容器解析"
② emitDecoratorMetadata 编译期为 App 注入 design:paramtypes: [ConfigService]
③ 容器实例化 App 时：Reflect.getMetadata('design:paramtypes', App) 拿到依赖清单
④ 递归实例化每个依赖 → 缓存（默认 Singleton scope）→ 按位次 new App(config)
⑤ 遇到 Object/undefined 槽位（interface、union）→ 查 @Inject() 自定义 token 元数据兜底
```

```ts
// di-mini.ts —— 30 行迷你容器，验证上述机制
import 'reflect-metadata';

const container = new Map<Function, any>();

function resolve<T>(ctor: new (...args: any[]) => T): T {
  if (container.has(ctor)) return container.get(ctor);
  const deps =
    (Reflect.getMetadata('design:paramtypes', ctor) ?? []) as (new (...args: any[]) => unknown)[];
  const args = deps.map((d) => resolve(d));  // 递归解析每个构造参数（依赖）
  const inst = new ctor(...args);
  container.set(ctor, inst);          // 单例缓存
  return inst;
}

@InjectableLike()
class UserService {
  who() { return 'hanmeimei'; }
}
@InjectableLike()
class UserFacade {
  constructor(private svc: UserService) {}
  greet() { return `hi, ${this.svc.who()}`; }
}

console.log(resolve(UserFacade).greet());  // hi, hanmeimei
console.log(resolve(UserFacade) === resolve(UserFacade));  // true（单例）
```

> 对照：`@Param`（第 9 节）= 方法级元数据；`@Inject`（第 10 节坑）= 构造参数级 token 元数据；`@Injectable`（本节）= 类级标记。三种装饰器 + 三个元数据位次，就是 Nest 装饰器体系的主干。自定义装饰器的完整工程写法见 `/Users/hh/offer/技术文档/nest/01-fundamentals/custom-decorators.md`。

## 13. 迁移视角：旧标准 → Stage 3 新装饰器

| 旧标准问题 | Stage 3 的答案 |
|-----------|----------------|
| `descriptor` 三参签名，类型松散 | 统一 `(value, context)`，context 按目标分型（`ClassMethodDecoratorContext` 等） |
| 属性装饰器拿不到值 | 字段装饰器可拦截初始化、返回替换函数 |
| 依赖 `reflect-metadata` 这类全局 polyfill | 内建 `context.metadata`，无全局污染 |
| 无参数装饰器（Nest 刚需） | 仍无——这是 Nest 不迁移的根本原因 |

要点：**新装饰器与 `emitDecoratorMetadata` 不兼容**，且多装饰器反向运行（与旧标准"应用自下而上"方向一致但实现不同）。完整 context 对象、`addInitializer`、auto-accessor 等新能力见 `18-decorators-deep.md` 与 `15-typescript-new-features.md`（5.0 节）。

## 14. 要点速查

| 场景 | 用什么 | 配置 |
|------|--------|------|
| Nest / Angular / TypeORM | 旧标准 | `experimentalDecorators: true` + `emitDecoratorMetadata: true` |
| 需要参数装饰 | 仅旧标准 | 同上 |
| 需要类型元数据（DI） | 仅旧标准 | 同上 + `import 'reflect-metadata'` |
| 纯 TS 新库 / 前端框架 | Stage 3 | 默认即可，见 `18-decorators-deep.md` |
| 修改方法行为 | 方法装饰器改 `descriptor.value` | 注意 `apply(this, args)` + return |
| 记元数据但不改行为 | 属性/参数装饰器 | 必须有人消费，否则白记 |
| target ES2022+ 且用旧属性装饰器 | 显式 `"useDefineForClassFields": false` | 否则语义退化 |

> 跨语言对比：TS 旧装饰器像 **Java 注解**（元数据 + 运行期反射读取，`reflect-metadata` ≈ Java 反射 API），新标准更像 **Python 装饰器**（函数包装、`context` ≈ 签名信息）；Rust 的 `#[derive]` 属性宏则是**编译期**完成展开，没有运行时反射成本。

## 15. 一句话总结

> 旧实验装饰器 = "tsconfig 两个 flag + 五种签名各司其职 + reflect-metadata 三类 design:* 元数据"：类装饰器换/改类、方法装饰器改 descriptor、访问器装饰器拦 get/set、属性与参数装饰器只记元数据；执行顺序"求值自上而下、应用自下而上，参数先于方法、类最后"。Nest 的 DI 就是"类装饰器标记 + 编译期类型元数据 + 容器反射消费"三件套——学 Nest 先把这一篇焊死，再看 `18-decorators-deep.md` 里的 Stage 3 新世界。
