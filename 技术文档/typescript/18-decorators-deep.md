# 18. TypeScript 装饰器深入

> 来源可信度：**官方文档确认**（基于 TS 5.x Decorators 正式版 + 旧实验装饰器；与 `09-decorators.md` 衔接）
> 关联：Nest `06-NestJS装饰器与自定义装饰器.md`

## 1. 新旧装饰器

- **Stage 3 标准装饰器**（TS 5.0+，默认 `experimentalDecorators: false`）：基于 ECMAScript 提案，有统一 `Decorator` 类型。
- **旧实验装饰器**（TS 历史默认 `experimentalDecorators: true`）：NestJS/TypeORM 大量使用，靠 `reflect-metadata` 做类型反射。

## 2. 标准装饰器（Stage 3）

```ts
type Decorator = (value: any, context: DecoratorContext) => any;

function logged(value: any, context: DecoratorContext) {
  if (context.kind === 'method') {
    return function (this: any, ...args: any[]) {
      console.log(`call ${context.name}`);
      return value.apply(this, args);
    };
  }
}

class UserService {
  @logged
  greet(name: string) { return `hi ${name}`; }
}
```

- `context.kind`：`class` / `method` / `field` / `getter` / `setter` / `accessor`。
- 可返回新函数替换原成员（**装饰器即包装**）。

## 3. 类装饰器与字段

```ts
function reactive(value: any, context: ClassFieldDecoratorContext) {
  // 字段初始化拦截
}

class Store {
  @reactive count = 0;
}
```

## 4. 旧实验装饰器（仍统治服务端框架）

```ts
// tsconfig.json
{ "experimentalDecorators": true, "emitDecoratorMetadata": true }

function Role(role: string) {
  return (target: any, key: string) => { Reflect.defineMetadata('role', role, target, key); };
}

class Ctrl {
  @Role('admin') delete() {}
}
```

- `emitDecoratorMetadata` 让 TS 在装饰时写入设计类型（参数类型、返回类型），供 DI 框架（Nest、Spring 风格）运行时读取。
- 与 Nest 目录 `07-NestJS依赖注入` 呼应：DI 靠反射元数据实现。

## 5. 何时用哪种

- 新库、纯前端：用 **Stage 3 标准装饰器**（未来趋势）。
- NestJS / TypeORM / 老项目：继续 **实验装饰器** + `reflect-metadata`，直到框架迁移。

## 6. 与 Rust 属性宏对照

| TS | Rust |
|----|------|
| `@decorator` | `#[derive(...)]` / 属性宏 |
| `reflect-metadata` | 编译期 trait/类型信息 |
| 运行时替换 | 过程宏编译期展开 |

见 Rust `19-macros.md` / `26-proc-macro-deep.md`。

## 7. 一句话总结

> TS 装饰器分两代：Stage 3 标准（`context.kind` 驱动，未来主流）与实验装饰器（`reflect-metadata` + `emitDecoratorMetadata`，Nest/TypeORM 在用）。本质都是"包装/增强成员"，与 Rust 属性宏异曲同工。
