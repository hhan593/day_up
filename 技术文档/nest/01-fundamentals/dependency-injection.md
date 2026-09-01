# NestJS 依赖注入：自定义提供者进阶

> 来源：[NestJS 中文文档 · 依赖注入（自定义提供者）](https://docs.nestjs.cn/fundamentals/dependency-injection/)
> 本文深入 `providers.md` 里四种自定义提供者的注入令牌、异步、按需注入。

---

## 一、注入令牌（Provider Token）

`providers: [CatsService]` 是语法糖：注入令牌 = 类本身。

```ts
{ provide: CatsService, useClass: CatsService }
```

非类令牌（字符串/Symbol/常量）必须配合 `@Inject()`：

```ts
const CONNECTION = Symbol('CONNECTION');
@Module({ providers: [{ provide: CONNECTION, useValue: db }] })
class A {
  constructor(@Inject(CONNECTION) private db) {}
}
```
> 常量集中放 `constants.ts`，避免魔法字符串/重复定义。

---

## 二、四种提供者回顾

| 类型 | 形式 | 场景 |
|---|---|---|
| `useClass` | `{ provide, useClass }` | 按环境切换实现 |
| `useValue` | `{ provide, useValue }` | 常量/mock 对象 |
| `useFactory` | `{ provide, useFactory, inject }` | 需计算/依赖其他提供者 |
| `useExisting` | `{ provide, useExisting }` | 别名（同实例） |

---

## 三、`useFactory` 进阶

```ts
{
  provide: 'CONNECTION',
  useFactory: (config: ConfigService, opts: Options) =>
    new DatabaseConnection(config.get('db'), opts),
  inject: [ConfigService, OPTIONS],  // 工厂依赖，按令牌注入
}
```

工厂里可注入可选依赖：

```ts
inject: [{ token: 'HTTP_OPTIONS', optional: true }]
```

---

## 四、异步提供者

需要 `await`（连库/读配置）时，工厂写成 `async`，Nest 等待 Promise 解析后再注入：

```ts
{
  provide: 'ASYNC_CONN',
  useFactory: async (config: ConfigService) => {
    const conn = await createConnection(config.get('db'));
    return conn;
  },
  inject: [ConfigService],
}
```
> 这正是各技术模块 `forRootAsync` 的内部实现（见 `../02-techniques/caching.md`、`http-module.md`）。

---

## 五、`useExisting` 别名

让两个令牌指向同一实例，常用于"对外暴露窄接口、内部用全功能类"：

```ts
@Module({
  providers: [
    LoggerService,                       // 实现
    { provide: 'ILogger', useExisting: LoggerService },  // 别名
  ],
  exports: ['ILogger'],
})
```

---

## 六、按需注入：`ModuleRef`

极少数场景需运行时动态取提供者（非构造期）：

```ts
constructor(private moduleRef: ModuleRef) {}
const svc = this.moduleRef.get(CatsService);  // 默认不解析请求作用域实例
this.moduleRef.get(CatsService, { strict: false });  // 跨模块查
```
> 请求作用域（`Scope.REQUEST`）实例需用 `resolve()`（见 `injection-scopes.md`）。

---

## 七、与 TS 文档衔接

- 装饰器元数据使 Nest 能"按类型解析依赖"——依赖 `reflect-metadata`（TS 装饰器机制），详见工作区 `06-NestJS装饰器与自定义装饰器.md`、`07-NestJS依赖注入与过滤器注入.md`。
- `optional` / 自定义令牌对应 `typescript-advanced-type-system.md` 的"类型收窄与品牌"思路。

---

## 八、一句话总结

> 自定义提供者的核心是"令牌 → 实现"映射：类令牌靠类型自动解析，非类令牌用 `@Inject()`；`useFactory` 可 `async` 且 `inject` 依赖；`useExisting` 做别名；运行时取用靠 `ModuleRef`。
