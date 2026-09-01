# TypeScript Decorators（装饰器：旧标准 vs TS 5 新标准）

> 来源：
> - 旧标准（实验性 Stage 2）：`https://www.typescriptlang.org/docs/handbook/decorators.html`（最后更新 2026/8/31，© Microsoft）
> - 新标准（Stage 3，TS 5.0 原生）：`https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators`（2023/3/16，Daniel Rosenwasser）
> 系列位置：`typescript` 补充篇。装饰器是 Nest 的基石（每个 `@Controller`/`@Injectable` 都是装饰器）。本文把官网两种标准讲清，避免踩兼容性坑。

## 一、两种标准概览

| 对比点 | 旧 `experimentalDecorators`（Stage 2） | TS 5.0 新标准（Stage 3） |
|--------|----------------------------------------|--------------------------|
| 启用 | 必须 `experimentalDecorators: true` | 默认支持（无需 flag） |
| 提案 | TC39 早期旧提案 | 当前 TC39 Stage 3 |
| 兼容性 | 旧逻辑 | **与旧装饰器不兼容** |
| 元数据 | 支持 `emitDecoratorMetadata` | **不支持**自动类型元数据 |
| 参数装饰 | ✅ 允许 | ❌ 不允许 |
| 语法位置 | 仅能在声明前 | 可放 `export` 前/后（不能混用） |

> ⚠️ **Nest 现状**：Nest 当前仍基于旧 `experimentalDecorators`（因为依赖 `reflect-metadata` 做 DI 注入类型）。TS 5 新装饰器不发射元数据，Nest 暂未采用。所以**写 Nest 必须开 `experimentalDecorators: true`**。学新标准是为了面向未来和纯 TS 库。

## 二、旧标准（experimentalDecorators）—— Nest 在用

### 启用
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### 语法
```ts
@sealed
class Greeter {
  @enumerable(false)
  greet() {}
}
```
- `@expression`，expression 是函数，运行时被调用并传入声明信息。

### 装饰器工厂
```ts
function color(value: string) {
  return function (target) { /* 用 target 和 value */ };
}
@color('red') class C {}
```

### 组合顺序
- 表达式**自上而下**求值；
- 装饰器函数**自下而上**调用（`(f ∘ g)(x) = f(g(x))`）。

### 类内部求值顺序
1. 实例成员：参数装饰 → 方法/访问器/属性装饰
2. 静态成员：同上
3. 构造函数参数装饰
4. 类装饰器

### 各类装饰器
- **类装饰器**：参数 = 构造函数；可返回新构造函数替换原类。
- **方法装饰器**：参数 = (target, name, descriptor)；返回新 descriptor。
- **访问器装饰器**：同方法，但只能用于 get/set 第一个。
- **属性装饰器**：参数 = (target, name)；无 descriptor，返回值忽略；常用于记元数据。
- **参数装饰器**：参数 = (target, name, index)；返回值忽略；用于标记 `@required` 等。

### 元数据（Nest 依赖）
```ts
import 'reflect-metadata';
// 开启 emitDecoratorMetadata 后，编译器注入 design:type 等
```
- ⚠️ 官方警告：装饰器元数据为实验特性，未来可能破坏性变更。

## 三、TS 5 新标准（Stage 3）—— 未来方向

### 装饰器函数签名
```ts
function loggedMethod<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
) {
  const methodName = String(context.name);
  function replacementMethod(this: This, ...args: Args): Return {
    console.log(`LOG: Entering method '${methodName}'.`);
    const result = target.call(this, ...args);
    console.log(`LOG: Exiting method '${methodName}'.`);
    return result;
  }
  return replacementMethod;
}

class C {
  @loggedMethod
  greet() {}
}
```

- 第一个参数 = 被装饰成员；第二个 = `context`（含 `name`/`private`/`static`/`addInitializer`）。
- 可返回新函数**替换**原成员。

### 工厂
```ts
function loggedMethod(head = 'LOG:') {
  return function actualDecorator(originalMethod: any, context: ClassMethodDecoratorContext) {
    // ...
  };
}
@loggedMethod('⚠️') greet() {}
```

### context 要点
- `context.name`：成员名
- `context.private`：是否 `#private`
- `context.static`：是否静态
- `context.addInitializer`：注册在构造函数开头执行的函数（替代手动 `bind`）

```ts
function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  if (context.private) {
    throw new Error(`'bound' cannot decorate private properties like ${methodName as string}.`);
  }
  context.addInitializer(function () {
    this[methodName] = this[methodName].bind(this);
  });
}
```

### 可装饰目标
方法、属性/字段、getters、setters、auto-accessors、类本身（用于子类化/注册）。

### 组合顺序
- 多个装饰器**反向顺序**运行：`@bound @loggedMethod` → `loggedMethod` 先装饰，`bound` 再装饰结果。

### 与旧标准核心差异（再次强调）
- ❌ 无 `emitDecoratorMetadata`（Nest DI 依赖它，故 Nest 不用新标准）
- ❌ 无参数装饰器
- 统一 `context` 对象，类型更安全

## 四、Nest 视角：为什么还在用旧标准

```ts
@Injectable()
export class CatsService {
  constructor(@Inject('CONFIG') private config: Config) {}
}
```

- `@Injectable()`、`@Inject()` 是**类装饰器 + 参数装饰器**，依赖 `emitDecoratorMetadata` 发射参数类型，运行时 `reflect-metadata` 读取来自动注入。
- 新标准不发射元数据，参数装饰器也被禁，所以 Nest 无法迁移到新标准（除非改 DI 机制）。
- 因此：**学 Nest 务必用旧标准 + 开两个 flag**；学纯 TS/未来库可了解新标准。

## 要点速查

| 场景 | 用什么 | 配置 |
|------|--------|------|
| Nest / Angular / 依赖元数据 | 旧 `experimentalDecorators` | `experimentalDecorators: true` + `emitDecoratorMetadata: true` |
| 纯 TS 新库 / 未来 | TS 5 新标准 | 默认即可 |
| 需要参数装饰 | 仅旧标准 | — |
| 需要类型元数据 | 仅旧标准 | `emitDecoratorMetadata: true` |

> 跨语言对比：Java 的注解（Annotation）、Python 的装饰器（最接近 TS 新标准）、C# 的 Attribute——TS 旧装饰器更像 Java 注解（运行期反射读取），新标准更像 Python 装饰器（函数包装）。

## 衔接

- 类与字段机制见 `classes.md`
- 真实 Nest 用法见 `技术文档/nest/01-fundamentals`（controllers/providers/guards 等全用装饰器）
- `reflect-metadata` 与 DI 见 `技术文档/nest/01-fundamentals/dependency-injection.md`
