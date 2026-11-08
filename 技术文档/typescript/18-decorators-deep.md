# 18. TypeScript 装饰器深入：Stage 3 标准装饰器全解

> 来源可信度：**官方文档确认**（TS 5.x Handbook「Decorators」+ TC39 decorators proposal；TS 5.2 decorator metadata；示例在 TS 5.9 默认配置下验证——即**不加** `experimentalDecorators`）
> 关联：`09-decorators.md`（以旧实验装饰器为主线，两篇互补）、`06-classes.md`（类字段初始化与 `useDefineForClassFields`）、`15-typescript-new-features.md`（TS 5.x 新特性速览）、`11-tsconfig.md`（experimentalDecorators / emitDecoratorMetadata / erasableSyntaxOnly）；Nest 侧 `nest/decorator-summary.md` 与 `nest/01-fundamentals`（旧代装饰器实战）；Rust 侧 `rust/02-进阶特性/19-macros.md`、`rust/02-进阶特性/26-proc-macro-deep.md`（属性宏对照）

## 1. 两代装饰器全景

| | Stage 3 标准装饰器 | 旧实验装饰器 |
|---|---|---|
| 启用方式 | TS 5.0+ 默认（`experimentalDecorators: false`） | `experimentalDecorators: true` |
| 出处 | ECMAScript TC39 Stage 3 提案 | TS 1.5 时代的私有设计 |
| 种类 | 6 种：class / method / getter / setter / field / accessor | 5 种：class / method / accessor / property / **parameter** |
| 运行时依赖 | 无 | 多数框架依赖 `reflect-metadata` |
| 现状（截至 2026-11） | 原生引擎在逐步实现，新库首选 | NestJS/TypeORM 等服务端框架仍在用，TS 无移除计划 |

- 本质一句话：装饰器是**类定义求值时执行的函数**——拿到「被装饰的东西」和一个 `context` 对象，可以选择返回替换物。它不引入新运行时能力，只提供一处受控的「包装/登记」钩子。
- ⚠️ 两代**不混用**：一个编译单元由 `experimentalDecorators` 标志决定按哪代语义解释所有装饰器。标志开着时，你写的 Stage 3 风格 `(value, context)` 参数实际收到的是旧代参数 `(target, key, descriptor)`——**能编译、语义全错**，这是迁移期最阴的坑。
- 分工约定：`09-decorators.md` 以旧代 + `reflect-metadata` 为主线（服务端框架视角）；本篇以 Stage 3 为主线逐个吃透。

## 2. context 对象全字段

每种装饰器的第二参数都是对应的 `*Context` 类型（`lib.decorators.d.ts` 内置），以方法为例：

```ts
// TS 内置类型摘录（decorator/method-context.ts）
interface ClassMethodDecoratorContext<This, Value extends (this: This, ...args: any) => any> {
  kind: 'method';          // 判别字段：'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'
  name: string | symbol | undefined;
  static: boolean;         // 是否静态成员
  private: boolean;        // 是否 #私有成员
  access: {                // 统一的成员读写抽象：新代不给你 descriptor，想操作成员靠 access
    has(object: This): boolean;
    get(object: This): Value;
  };
  addInitializer(initializer: (this: This) => void): void;  // 注册构造期/定义期回调
  metadata: DecoratorMetadata;  // TS 5.2+：本类共享的元数据对象（见第 7 章）
}
```

各 kind 的差异（装饰器第 1 参数、可返回的替换物）：

| kind | 第 1 参数 `value` | 返回值 | access 能力 |
|---|---|---|---|
| `class` | 类本身 | 新类 或 undefined | — |
| `method` | 方法函数 | 新函数 或 undefined | has / get |
| `getter` | getter 函数 | 新 getter 或 undefined | has / get |
| `setter` | setter 函数 | 新 setter 或 undefined | has / get |
| `field` | **恒为 undefined** | 初始化函数 `(initialValue) => T` 或 undefined | has / get / set |
| `accessor` | `{ get, set }` 对象 | `{ get?, set?, init? }` | has / get / set |

- 记忆锚点：**旧代给 `PropertyDescriptor`（可变属性描述符），新代给「值本身 + access 抽象」**。新代思路是「返回一个替换实现」，而不是「原地改描述符」。
- `access` 为什么存在：字段/方法在实例上，装饰器拿到的只是定义时的快照；`access.get(obj)` 让你在运行时安全读写任意实例的同名成员（含 `#` 私有成员——这是 descriptor 做不到的）。

## 3. 六种装饰器逐一详解

### 3.1 类装饰器

```ts
// decorator/class-demo.ts
function injectable(value: Function, context: ClassDecoratorContext) {
  console.log(`[deco] class ${context.name ?? '(anonymous)'} defined`);
  // 返回 undefined：不替换，只做副作用；返回新类：整体替换
}

@injectable
class UserService {}
```

```text
$ tsx decorator/class-demo.ts
[deco] class UserService defined     ← 类定义求值时执行一次，与是否 new 无关
```

- 需要替换类时，签名要带构造器泛型才能保住类型：

```ts
// decorator/class-replace.ts
function singleton<C extends new (...args: any[]) => any>(value: C, context: ClassDecoratorContext): C {
  return class extends value {
    static #instance: unknown;
    constructor(...args: any[]) {
      if (value.prototype !== undefined && (value as any).hasInstance?.()) { /* 示意 */ }
      super(...args);
    }
    static getInstance(...args: any[]) {
      this.#instance ??= new this(...args);
      return this.#instance;
    }
  } as C;
}

@singleton
class Config {
  constructor(public host: string) {}
}
console.log(Config.getInstance('a') === Config.getInstance('b'));  // true
```

### 3.2 方法装饰器（简版；生产版 @log/@retry 见第 5 章）

```ts
// decorator/method-demo.ts
function logged<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  return function (this: This, ...args: Args): Return {
    console.log(`call ${String(context.name)}`);
    return method.call(this, ...args);
  };
}

class Greeter {
  @logged
  greet(name: string) { return `hi ${name}`; }
}

console.log(new Greeter().greet('ts'));
// call greet
// hi ts
```

- 三段泛型 `This / Args / Return` 是新代方法装饰器的标准姿势：`this` 与参数类型全程不丢，`method.call(this, ...)` 是包装器的固定写法。

### 3.3 getter 装饰器

```ts
// decorator/getter-demo.ts
function nonNegative<C, V extends number>(
  get: (this: C) => V,
  context: ClassGetterDecoratorContext<C, V>
) {
  return function (this: C): V {
    const v = get.call(this);
    if (v < 0) throw new RangeError(`${String(context.name)} must be >= 0`);
    return v;
  };
}

class Account {
  #balance = 10;
  set balance(v: number) { this.#balance = v; }
  @nonNegative
  get balance(): number { return this.#balance; }
}

const a = new Account();
a.balance = 100;
console.log(a.balance);        // 100
a.balance = -1;                // setter 正常写入（不经过装饰）
// console.log(a.balance);     // 读取时才抛 RangeError: balance must be >= 0
```

### 3.4 setter 装饰器

```ts
// decorator/setter-demo.ts
function clamp<C, V extends number>(
  set: (this: C, v: V) => void,
  context: ClassSetterDecoratorContext<C, V>
) {
  return function (this: C, v: V): void {
    set.call(this, Math.max(0, v));   // 替换 setter：写入前夹到 >= 0
  };
}

class Volume {
  #value = 0;
  @clamp
  set value(v: number) { this.#value = v; }
  get value(): number { return this.#value; }
}

const v = new Volume();
v.value = -5;
console.log(v.value);   // 0
```

- ⚠️ getter 与 setter 是**两个独立成员**，分别装饰、互不影响。想要「读写都拦」就把两个都装饰，或直接用 `accessor`（第 4 章）——后者才是配套拦截的正解。

### 3.5 字段装饰器

```ts
// decorator/field-demo.ts
function positive<This, T extends number>(
  value: undefined,                            // 字段装饰器拿不到值，第 1 参数恒为 undefined
  context: ClassFieldDecoratorContext<This, T>
) {
  // 返回的是「初始化函数」：每次实例化、该字段初始化时执行
  return function (this: This, initialValue: T): T {
    if (initialValue < 0) throw new RangeError(`${String(context.name)} < 0`);
    return initialValue;
  };
}

class Config {
  @positive port = 8080;   // ✅
}

new Config();               // OK
// 把 port 改成 -1 后：new Config() 抛 RangeError（注意：是实例化时，不是类定义时）
```

- 两个关键认知：
  1. 字段装饰器**在类定义时只跑装饰器本身**（可返回初始化函数）；返回的初始化函数在**每次 `new`** 时执行——所以校验发生在实例化那一刻。
  2. 不返回初始化函数也合法（返回 undefined），此时装饰器只用于登记（写 metadata、addInitializer）——旧代 @Column 这类场景的对应物。

### 3.6 accessor 装饰器

见第 4 章——它是与 `accessor` 关键字绑定的新代专属形态，值得单独一节。

## 4. `accessor` 关键字与自动访问器（reactive 字段实战）

### 4.1 自动访问器是什么

```ts
// decorator/auto-accessor.ts
class Counter {
  accessor count = 0;   // 自动访问器：ECMAScript 原生语法，不需要装饰器也能用
}
// ≈ 等价于手写：
class CounterEquiv {
  #count = 0;
  get count() { return this.#count; }
  set count(v: number) { this.#count = v; }
}
```

- `accessor x = 1` 声明一个「带私有槽的原型访问器」：存储在 `#` 私有槽，读写走 get/set。**它给装饰器提供了唯一一个能同时拦住读和写的挂载点**——字段装饰器拦不了写，getter/setter 装饰器得写两遍。

### 4.2 reactive 实战：最小响应式

```ts
// decorator/reactive.ts
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function track(key: string, cb: Listener) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
}
function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function reactive<This, V>(
  target: ClassAccessorDecoratorTarget<This, V>,   // 原访问器 { get, set }
  context: ClassAccessorDecoratorContext<This, V>
) {
  const key = String(context.name);
  return {
    get(this: This): V {
      console.log(`[track] ${key}`);
      return target.get.call(this);
    },
    set(this: This, v: V): void {
      target.set.call(this, v);
      console.log(`[notify] ${key} -> ${String(v)}`);
      notify(key);
    },
    init(value: V): V {                 // 可选：字段初始化的最后一环，可改写初值
      console.log(`[init] ${key} = ${value}`);
      return value;
    },
  };
}

class Store {
  @reactive accessor count = 0;
}

const s = new Store();    // [init] count = 0
s.count = 1;              // [notify] count -> 1
console.log(s.count);     // [track] count \n 1
```

- 返回对象三个键都可省：`get`/`set` 省略则用原访问器，`init` 省略则初值原样。
- 真实的响应式框架（如 Lit 的 `@property`）就是这套骨架 + 批量调度。对比旧代实现 reactive 要用 `Object.defineProperty` 手搓描述符——新代把样板消灭了。
- ⚠️ `accessor` 字段不能直接配 `useDefineForClassFields: false` 的旧语义混用思维；它与类字段语义（define 语义）绑定，细节见 `06-classes.md` 第 2 章、`11-tsconfig.md`。

## 5. 方法装饰器实战：@log 耗时与 @retry

### 5.1 @log：耗时监控

```ts
// decorator/log.ts
function log<This, Args extends unknown[], Return>(
  method: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const name = String(context.name);
  return function (this: This, ...args: Args): Return {
    const t0 = performance.now();
    try {
      return method.call(this, ...args);
    } finally {
      const ms = (performance.now() - t0).toFixed(1);
      console.log(`[log] ${name}(${args.map(String).join(', ')}) 耗时 ${ms}ms`);
    }
  };
}

class MathService {
  @log
  fib(n: number): number { return n < 2 ? n : this.fib(n - 1) + this.fib(n - 2); }
}

new MathService().fib(10);
// [log] fib(10) 耗时 0.2ms
```

- `try/finally` 保证抛异常也记录耗时；同步异步通用版可把返回值 `await` 后再记（同步版不改 `Return` 类型更省事）。

### 5.2 @retry：工厂装饰器 + 异步重试

```ts
// decorator/retry.ts
function retry<This, Args extends unknown[], Return>(times: number) {
  // 外层函数是「装饰器工厂」：调用它返回真正的装饰器
  return function (
    method: (this: This, ...args: Args) => Promise<Return>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Promise<Return>>
  ) {
    return async function (this: This, ...args: Args): Promise<Return> {
      let lastErr: unknown;
      for (let i = 1; i <= times; i++) {
        try {
          return await method.call(this, ...args);
        } catch (e) {
          lastErr = e;
          console.warn(`[retry] ${String(context.name)} 第 ${i}/${times} 次失败`);
        }
      }
      throw lastErr;
    };
  };
}

class ApiClient {
  @retry(3)
  async fetchConfig(): Promise<string> {
    if (Math.random() < 0.7) throw new Error('flaky');
    return 'config';
  }
}

// new ApiClient().fetchConfig().then(console.log)  → 失败最多打 3 条 warn，成功输出 config
```

- 工厂装饰器 `@retry(3)` 是「带参数装饰器」的唯一形态（新旧代皆然）：装饰器本身不能有参数，包一层函数。
- 可叠加：`@log @retry(3) fetch()`——顺序见第 6 章。

## 6. 执行顺序：求值序、应用序、初始化序

三个「序」分开记，混在一起必然记错：

**① 求值序（装饰器表达式的调用）**：自上而下。`@deco('m1')` 的 `deco('m1')` 先执行，`@deco('m2')` 后执行。

**② 应用序（装饰器函数的执行）**：同一成员上多层装饰器**自下而上**——离成员最近的先应用，外层包住内层，即函数复合 `f(g(x))`：

```ts
// decorator/order.ts
function deco(tag: string) {
  console.log(`evaluate ${tag}`);
  return function (_v: unknown, c: { name: string | symbol | undefined }) {
    console.log(`apply ${tag} on ${String(c.name)}`);
  };
}

@deco('outer')   // 后应用：包在最外层
@deco('inner')   // 先应用
class Order {
  @deco('m1') method1() {}
  @deco('m2') method2() {}
}
```

```text
$ tsx decorator/order.ts
evaluate outer
evaluate inner
apply inner on Order        ← inner 先应用
apply outer on Order        ← outer 后应用，包住 inner
evaluate m1
apply m1 on method1
evaluate m2
apply m2 on method2
```

**③ 成员之间**：按声明顺序依次装饰；**类装饰器最后应用**（所有成员装饰完才轮到类本身）——上面输出里 `outer/inner` 先于 `m1/m2` 打印正是这个规则（表达式求值最先，应用时成员先行、类最后）。旧实验装饰器的求值/应用规则与此一致，见 `09-decorators.md`。

**④ 初始化序（运行期）**：

- 字段/访问器的 `init` 与初始化函数：**每次实例化**时按声明顺序执行；
- 方法/访问器/getter/setter 的 `addInitializer` 回调：实例构造期间执行（`this` = 实例）；
- 字段装饰器的 `addInitializer` 回调：该字段初始化之前执行（`this` = 实例）；
- 类装饰器的 `addInitializer` 回调：类定义结束后执行一次（`this` = 类本身）。

## 7. metadata 与 addInitializer（TS 5.2+）

### 7.1 context.metadata 与 Symbol.metadata

```ts
// decorator/metadata.ts —— 需要 TS 5.2+，且 experimentalDecorators 必须为 false
// （Symbol.metadata 的类型声明需要较新的 lib，如 "ESNext.Decorators" 或 "ESNext"）

function route(path: string) {
  return (_value: unknown, context: ClassMethodDecoratorContext) => {
    context.metadata[String(context.name)] = path;   // 写入本类的共享 metadata 对象
  };
}

class UserController {
  @route('/users')     list() {}
  @route('/users/:id') detail() {}
}

// 类定义结束后，元数据作为静态属性挂在类上：
const meta = (UserController as unknown as { [Symbol.metadata]?: Record<string, unknown> })[Symbol.metadata];
console.log(meta);   // { list: '/users', detail: '/users/:id' }
```

- `metadata` 是**每个类一个共享对象**：同类上的所有装饰器写的是同一个对象，天然适合「一个类收集全部路由/列配置/校验规则」的场景。
- 与旧代对照：旧代做同样的事要 `import 'reflect-metadata'` + `Reflect.defineMetadata`（运行时额外依赖）；新代是语言内建，产物零依赖。
- ⚠️ 但新代**没有** `emitDecoratorMetadata` 的等价物——它不会把「参数的设计时类型」写进元数据，这正是 Nest 类 DI 框架滞留旧代的根因（第 10 章）。

### 7.2 addInitializer

```ts
// decorator/initializer.ts —— 类装饰器版：注册到全局表
const REGISTRY = new Map<string, new (...args: any[]) => unknown>();

function controller(name: string) {
  return (value: Function, context: ClassDecoratorContext) => {
    context.addInitializer(function (this: Function) {
      REGISTRY.set(name, this as new (...args: any[]) => unknown);  // this = 类本身
    });
  };
}

@controller('user')
class UserController {}

@controller('order')
class OrderController {}

console.log([...REGISTRY.keys()]);   // [ 'user', 'order' ]
```

```ts
// decorator/initializer-field.ts —— 字段装饰器版：实例构造时自动登记
function observable<This, T>(_v: undefined, context: ClassFieldDecoratorContext<This, T>) {
  context.addInitializer(function (this: This) {
    // 此刻字段还没赋初值，适合先登记「这个实例有这些可观察键」
    (this as any).__keys ??= [];
    (this as any).__keys.push(String(context.name));
  });
}

class Model {
  @observable a = 1;
  @observable b = 2;
}

const m = new Model();
console.log((m as any).__keys);   // [ 'a', 'b' ]
```

- 为什么不直接在装饰器体里注册？类装饰器体执行时类还未赋值完成、字段装饰器体执行时还没有实例——`addInitializer` 把动作推迟到**正确的时机**，这是新代比旧代精致的核心设计之一。

## 8. 旧实验装饰器：5 种签名完整对照

`experimentalDecorators: true` 下的五种（Nest/TypeORM 现状，详见 `09-decorators.md`）：

| 种类 | 签名 | 返回值 |
|---|---|---|
| 类 | `(target: Function) => Function \| void` | 新构造器 或 void |
| 方法 | `(target: Object, key: string \| symbol, descriptor: PropertyDescriptor) => PropertyDescriptor \| void` | 新 descriptor 或 void |
| 访问器（getter/setter） | 同方法（第三参同样是 `PropertyDescriptor`） | 同方法 |
| 字段（property） | `(target: Object, key: string \| symbol) => void` | ⚠️ 返回值被忽略 |
| 参数 | `(target: Object, key: string \| symbol, parameterIndex: number) => void` | 无（只能登记元数据） |

```ts
// decorator/legacy.ts —— tsconfig: { "experimentalDecorators": true }
import 'reflect-metadata';

// ① 类
function Seal(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
// ② 方法：直接改 descriptor
function Readonly(_target: Object, key: string, desc: PropertyDescriptor) {
  desc.writable = false;
}
// ④ 字段：没有 descriptor，只能侧面登记
function LogProp(_target: Object, key: string) {
  console.log(`prop ${key}`);
}
// ⑤ 参数：旧代特有，Nest @Param/@Inject 的根基
function LogParam(_target: Object, key: string | undefined, index: number) {
  console.log(`param #${index} of ${String(key)}`);
}

@Seal
class Legacy {
  @LogProp name: string = 'x';
  @Readonly greet(@LogParam prefix: string) { return `${prefix} ${this.name}`; }
}
```

- 元数据写法（旧代惯用）：`Reflect.defineMetadata('role', 'admin', target, key)`，读取 `Reflect.getMetadata(...)`；`emitDecoratorMetadata: true` 会额外注入设计时类型（参数类型、返回类型），供 DI 反射解析（Nest 的 `@Inject` 自动装配，见 `nest/01-fundamentals`）。

## 9. 两代差异总表

| 维度 | 旧实验装饰器 | Stage 3 标准装饰器 |
|---|---|---|
| 启用 | `experimentalDecorators: true` | 默认（不加标志） |
| 种类 | 5 种（含**参数装饰器**） | 6 种（含 accessor，**无参数装饰器**） |
| 拿到的输入 | `target` + `key` + `PropertyDescriptor`（可变） | 成员值本身 + `context`（含 access 抽象） |
| 替换方式 | 原地改 descriptor / 返回新 descriptor | 返回新函数 / 新访问器 / 初始化函数 |
| 字段初始化拦截 | 不支持（只能登记 side effect） | 支持（返回 `(initialValue) => T`） |
| 元数据 | 无内建：`reflect-metadata` 包 + `emitDecoratorMetadata` | 内建 `context.metadata` → `Symbol.metadata`（TS 5.2+） |
| `#` 私有成员 | 基本无法装饰（key 是运行时找不到的） | 可以（`context.private` + `access` 抽象） |
| 参数装饰器 | 有（DI 框架命脉） | 无 |
| 标准化 | TS 私有语法，永不进 ECMAScript | TC39 Stage 3，引擎原生实现中 |
| 典型用户 | NestJS、TypeORM、旧 Angular | Lit、新前端库、TS 5.0+ 新项目 |

## 10. 迁移策略：Nest/TypeORM 为何滞留旧代

三个硬依赖，少一个都早迁了：

1. **参数装饰器**：新代没有参数位置的装饰器。`@Param('id')`、`@Body()`、`@Inject()` 的 API 形态直接无法平移。
2. **emitDecoratorMetadata**：只在旧代编译管道里生效——编译期把设计时类型（`constructor(userService: UserService)` 里的 `UserService`）写进 `Reflect.metadata`，DI 容器据此自动解析依赖。新代不生成这些信息，自动注入断链。
3. **生态锁定**：Nest 的模块图（Module/Provider/Guard/Interceptor）全部建立在 `reflect-metadata` 之上；TypeORM 的 `@Column({ type })` 依赖设计时类型推导列类型。

行动建议（截至 2026-11）：

- Nest/TypeORM/Angular 老项目：**保持旧代**，`experimentalDecorators: true + emitDecoratorMetadata: true`（见 `11-tsconfig.md` 第 9 章配套项），不要在框架升级前半迁移。
- 新库、纯前端、工具库：直接 Stage 3，零运行时依赖、面向原生标准。
- 同一 monorepo 两套并存：靠 tsconfig `extends` 分裂两个配置（框架包一个、其余一个），互不污染（写法见 `11-tsconfig.md` 第 3 章）。
- 面试表述：「两代并存是 TS 生态的现实分层——服务端 DI 框架押注元数据反射，前端押注语言标准；选型跟着框架走，不跟个人喜好走。」

## 11. 与 Rust 属性宏对照

| 维度 | TS 装饰器 | Rust proc macro（`#[derive(...)]` / 属性宏） |
|---|---|---|
| 执行时机 | **运行时**：类定义求值时执行 JS 函数 | **编译期**：展开为新的代码 |
| 输入 | 运行时值 + context（name/kind/access…） | `TokenStream`（语法树片段） |
| 能力上限 | 包装/替换既有成员、登记元数据——**不能凭空造新成员** | 可生成任意新 item / impl / 字段 / 方法 |
| 类型信息 | 旧代靠 `emitDecoratorMetadata` 注入设计时类型；新代只有自己写入的 metadata | 编译器全程持有精确类型，宏可查询可生成 trait 实现 |
| 运行时成本 | 有（每层装饰器是一层函数调用） | 零（展开后就是手写等价代码） |
| 失败时机 | 运行时（装饰器抛错在模块加载/实例化时） | 编译期直接报错 |

- 结论：TS 装饰器是「运行时包装器」，Rust 宏是「编译期代码生成器」。前者灵活、可按实例热插拔；后者零开销但必须重新编译。Rust 侧没有运行时反射，所以「Nest 式 DI」在 Rust 里被编译期方案（如 `shaku` 或手写 trait 注入）取代。
- 见 `rust/02-进阶特性/19-macros.md`（宏分类）、`rust/02-进阶特性/26-proc-macro-deep.md`（proc macro 全解）。

## 12. 常见坑速查

- 残留 `experimentalDecorators: true` 却写新代 → 编译能过但**参数错位**：`(value, context)` 收到的是 `(target, key)`，运行时静默错乱。排查第一步：确认编译单元的两代标志。
- 以为字段装饰器在类定义时校验 → 校验逻辑在返回的初始化函数里，**实例化时**才执行（3.5）。
- 字段装饰器返回了非函数 → 运行时 TypeError（返回值必须是 undefined 或初始化函数）。
- 只装饰 getter 以为读写都拦了 → getter/setter 是独立成员；要读写全拦用 `accessor`（第 4 章）。
- `context.metadata` 类型报错 → TS < 5.2、或 lib 太老没有 `Symbol.metadata` 声明、或 `experimentalDecorators` 没关（7.1）。
- 想装饰函数参数 → 新代没有参数装饰器；要么留旧代，要么改成「方法装饰器 + 参数索引约定」自实现。
- `@log @retry(3)` 顺序反了 → 记住「自下而上应用」：想先重试再计时，`@log` 要写在外层（6 章）。
- `accessor` 在旧 target 下报错 → 自动访问器需要较新 `target`（es2022+ 稳妥），降级转译交给构建器。

## 13. 一句话总结

> Stage 3 装饰器 = 六种 kind（class/method/getter/setter/field/accessor）× 一个 context（kind/name/static/private/access/addInitializer/metadata）：方法返回替换函数、字段返回初始化函数、accessor 返回 { get, set, init }，元数据经 Symbol.metadata 语言内建，addInitializer 把动作推到正确时机。求值自上而下、应用自下而上、类装饰器最后。Nest/TypeORM 因参数装饰器与 emitDecoratorMetadata 滞留旧代——服务端旧代、前端新代，是当前（截至 2026-11）的生态分层。
