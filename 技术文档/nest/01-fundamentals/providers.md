# NestJS 提供者（Providers）

> 来源：[NestJS 中文文档 · 提供者](https://docs.nestjs.cn/overview/providers/)、[自定义提供者（依赖注入）](https://docs.nestjs.cn/fundamentals/dependency-injection/)
> 提供者是 Nest 的"零件"：服务、仓库、工厂、工具类都算。IoC 容器负责创建并注入它们。

---

## 一、提供者是什么？（通俗对比）

提供者是**可复用的业务逻辑零件**。控制器负责"接单"，提供者（通常是 Service）负责"干活"。

**对比其他框架**：
- **Spring**：`@Service` / `@Component` + `@Autowired`，IoC 概念完全一致——Nest 的 `@Injectable` ≈ Spring 的 `@Component`，构造函数注入 ≈ Spring 的 `@Autowired`。
- **Angular**：Angular 的 `providedIn: 'root'` 与 Nest 的模块 `providers` 异曲同工，都是 DI。
- **Express 原生**：没有 DI，要自己 `new` 或挂到 `app.locals`——Nest 用容器自动管理，避免手动传依赖。

---

## 二、标准 Service

```ts
// cats.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];
  create(cat: Cat) { this.cats.push(cat); }
  findAll(): Cat[] { return this.cats; }
}
```

```ts
// cats.controller.ts —— 构造函数注入
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}
  @Get() findAll() { return this.catsService.findAll(); }
}
```

> 简写 `providers: [CatsService]` 等价于 `{ provide: CatsService, useClass: CatsService }`。

---

## 三、依赖注入（DI）三步

1. `@Injectable()` 标记类可被容器管理
2. 构造函数声明依赖（如 `constructor(private s: CatsService)`）
3. 在模块 `providers` 注册

DI 基于 TypeScript **类型**解析（编译后靠装饰器元数据）。对比 Java Spring 的 `@Autowired`——Nest 默认就是"按类型注入"，无需额外注解。

---

## 四、自定义提供者（四种）

当标准 `useClass` 不够用时（注入常量、切换实现、异步创建、起别名），用对象形式：

### 4.1 `useValue` —— 注入常量/模拟对象
```ts
const config = { apiKey: 'xyz' };
@Module({
  providers: [{ provide: 'CONFIG', useValue: config }],
})
// 注入：
constructor(@Inject('CONFIG') private config: { apiKey: string }) {}
```

### 4.2 非类令牌 + `@Inject()`
```ts
@Module({ providers: [{ provide: 'CONNECTION', useValue: connection }] })
constructor(@Inject('CONNECTION') private connection: Connection) {}
```
> 最佳实践：令牌放 `constants.ts` 统一管理，避免魔法字符串。

### 4.3 `useClass` —— 按条件切换实现
```ts
const configServiceProvider = {
  provide: ConfigService,
  useClass: process.env.NODE_ENV === 'development'
    ? DevConfigService : ProdConfigService,
};
```

### 4.4 `useFactory` —— 工厂函数（可注入依赖）
```ts
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (opts: OptionsProvider) => new DatabaseConnection(opts.get()),
  inject: [OptionsProvider],   // 工厂所需的依赖
};
```
> 工厂里 `inject: [{ token: 'X', optional: true }]` 可让依赖可选（解析为 `undefined`）。

### 4.5 `useExisting` —— 别名（指向同一实例）
```ts
@Module({
  providers: [LoggerService, { provide: 'AliasedLogger', useExisting: LoggerService }],
})
```

### 对照表
| 类型 | 用途 | 类比 |
|---|---|---|
| `useClass` | 动态选实现类 | Spring 的 `@Primary` / `@Qualifier` |
| `useValue` | 常量/ mock | Spring 的 `@Value` |
| `useFactory` | 需计算的创建 | 工厂模式 |
| `useExisting` | 起别名 | 别名引用 |

---

## 五、可选注入 & 属性注入

```ts
// 可选：依赖可能不存在
constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient?: T) {}

// 属性注入：子类 super() 传依赖麻烦时用
@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```
> 无继承时**优先构造函数注入**，可读性更好。

---

## 六、作用域（Scope）

默认**应用级单例**（启动实例化一次，全应用共享）。还可设为**请求作用域**（`Scope.REQUEST`，每次请求新建实例）——详见 `injection-scopes.md`。

---

## 七、异步提供者 & 动态模块

需要异步（如连数据库、读配置）时用 `forRootAsync`（`useFactory` + `inject`），详见 `custom-providers` 进阶与 `../02-techniques` 各技术模块（如 `caching`、`http-module` 的异步注册）。

---

## 八、导出与共享

模块内 `providers` 默认私有，要被别的模块用须 `exports: [CatsService]`（见 `modules.md` 共享模块）。

---

## 九、坑 & 最佳实践

1. **必须注册**：忘了在 `providers` 注册会报 `Nest can't resolve dependencies`。
2. **令牌拼写**：字符串令牌用常量，别手写字符串（易错）。
3. **调试依赖**：设 `NEST_DEBUG` 环境变量看依赖解析日志。
4. **循环依赖**：见 `circular-dependency.md`，优先用重构避免。

---

## 十、一句话总结

> 提供者是 `@Injectable` 标记、由 IoC 容器创建注入的零件；标准写法 `providers:[Service]`，进阶用 `useValue/useClass/useFactory/useExisting` 四类自定义提供者，按类型自动注入（≈ Spring 的 `@Autowired`）。
