# 知识点：NestJS 的 IoC / DI，以及过滤器与中间件的依赖注入

> 本文档配合本项目实际代码讲解：控制反转（IoC）、依赖注入（DI）是什么，
> 以及「中间件 / 过滤器这种不是手动 new 的类，框架是如何把依赖塞进去的、注入后又有什么用」。

## 1. IoC 与 DI 一句话理解

- **IoC（控制反转，Inversion of Control）**：「创建依赖」这件事的控制权，从「使用方（类自己 new）」反转给了「Nest 的 IoC 容器」。
- **DI（依赖注入，Dependency Injection）**：IoC 的具体实现方式——容器在创建类实例时，通过**构造函数**把依赖自动塞进去。

> 一句话：IoC 是思想（把找依赖的权力交给容器），DI 是手段（容器通过构造函数送依赖上门）。

### 生活比喻

你开餐厅（你的类）需要厨师（依赖）：

- **没有 IoC**：你自己去招人、发工资、排班（类内部 `new Service()`）。
- **有 IoC**：门口贴「我需要一名厨师」，中央人事部（容器）把厨师直接送到你面前。你只管「声明要什么」，不管「从哪来」。

## 2. NestJS 中 DI 的三件套

| 要素 | 作用 | 本项目位置 |
| --- | --- | --- |
| `@Injectable()` | 告诉容器「我可以被登记、可以被注入」 | `AppService`、`LoggerMiddleware`、`HttpExceptionFilter`、`LoggerService` |
| `providers: [...]` | 在模块里声明「要登记哪些东西」 | `CommonModule` 的 `providers` / `app.module.ts` 的 `providers` |
| 构造函数参数 | 声明「我需要什么」，容器负责「给什么」 | `CatsController`、`HttpExceptionFilter` 等的 `constructor` |

依赖解析基于**模块图**：想注入某个 Service，提供它的模块必须在 `exports` 中导出，使用方模块必须 `imports` 它（详见 `nestjs-module-service-sharing.md`）。

## 3. 过滤器 / 中间件是如何「被注入」的？

### 3.1 核心前提：必须标 `@Injectable()` 且「只给类、不给实例」

Nest 在**运行时**才实例化这些处理器。关键区别：

```ts
// ❌ 你手动 new 了实例 → 实例已被你创造，框架插不进手，依赖注入失效
@UseFilters(new HttpExceptionFilter())

// ✅ 只传「类」→ 框架在运行时实例化，才有机会先注入依赖
@UseFilters(HttpExceptionFilter)
```

全局注册（`APP_FILTER`）同理，必须用 `useClass` 给「类」：

```ts
// src/app.module.ts
providers: [
  AppService,
  {
    provide: APP_FILTER,
    useClass: HttpExceptionFilter, // 传类 → 框架实例化并注入
  },
]
```

> `LoggerService` 等共享 Service 放在 `@Global()` 的 `CommonModule` 中 `providers` + `exports`，
> 任意模块（含 `CatsModule`）的过滤器/控制器都能注入（见第 3.3、坑点小节）。

### 3.2 框架注入的完整链路

```
你写 @UseFilters(HttpExceptionFilter)  （只给类）
        │
        ▼
Nest 启动扫描：发现该类标了 @Injectable()
        │
        ▼
容器读它的构造函数："你依赖什么？"
        │
        ▼
构造器：constructor(private logger: LoggerService) {}
        │
        ▼
容器先去 provider 名录找 LoggerService 实例
        │
        ▼
通过构造函数把它塞进 HttpExceptionFilter（注入完成）
        │
        ▼
把装配好的过滤器挂到对应路由 / 全局
```

**中间件完全一致**：`LoggerMiddleware` 标了 `@Injectable()`，`consumer.apply(LoggerMiddleware)` 时，框架也是自动实例化 + 注入依赖。

### 3.3 本项目中的真实例子

**① 过滤器注入日志服务**（`src/exception/http-exception.filter.ts`）：

```ts
@Injectable()
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  // 框架实例化时把 LoggerService 单例塞进来
  constructor(private readonly logger: LoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    // 用注入进来的日志服务，而不是硬编码 console.log
    this.logger.error(
      `${request.method} ${request.url} → ${status}: ${exception.message}`,
      exception.stack,
      'HttpExceptionFilter',
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

**② 中间件注入日志服务**（`src/middleware/logger.midderware.ts`）：

```ts
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`${req.method} ${req.originalUrl}`, 'LoggerMiddleware');
    next();
  }
}
```

**③ 日志服务封装内置日志器**（`src/common/logger.service.ts`）：

> 注意：Nest 内置的 `Logger` 是工具类，**不属于自动登记的 provider**，
> 不能通过构造函数注入（否则启动报 `UnknownDependenciesException`）。
> 正确做法是内部直接 `new Logger(...)`，外部只注入我们自己的 `LoggerService`：

```ts
@Injectable()
export class LoggerService {
  // 内置 Logger 直接实例化，不通过 DI；外部组件注入的是 LoggerService
  private readonly logger = new Logger(LoggerService.name);
  // ...
}
```

> 注册位置：把 `LoggerService` 放到一个 `@Global()` 的 `CommonModule` 中 `providers` + `exports`，
> 并在 `AppModule` 的 `imports` 引入 `CommonModule`。这样**任意模块**（包括 `CatsModule` 等）
> 的控制器/过滤器都能注入 `LoggerService`。

**⚠️ 坑点：局部「类」过滤器的依赖解析范围是「控制器所在模块」**

`@UseFilters(HttpExceptionFilter)` 写在 `CatsController` 上时，框架在 `CatsModule` 上下文里解析
`HttpExceptionFilter` 的依赖。若 `LoggerService` 只登记在 `AppModule` 的本地 `providers` 中
（未 `exports`、未全局），`CatsModule` 就找不到它，启动报：

```
Nest can't resolve dependencies of the HttpExceptionFilter (?). 
Please make sure that the argument LoggerService at index [0] is available in the CatsModule module.
```

解决方式（选其一）：
1. 把 `LoggerService` 放进 `@Global()` 模块（本项目采用，最省事）；
2. 或让 `CatsModule` 显式 `imports` 包含 `LoggerService` 的模块并 `exports` 它；
3. 或改用全局 `APP_FILTER`（在 `AppModule` 注册，解析范围在 `AppModule`，但同模块内仍需 `LoggerService` 可见）。

> 结论：**凡是通过「类」注册的过滤器/拦截器/守卫，其依赖必须在「使用方模块」可见**，
> 因此共享型 Service 一般应放在全局模块或各模块显式导入的模块中。

## 4. 注入了「有什么用」？

不注入时，处理器内部只能硬编码 `new` 依赖，导致难测试、难替换、无单例：

```ts
catch(exception, host) {
  const logger = new MyLogger(); // 写死，无法替换、无法单例、无法测试
  logger.error(exception);
}
```

注入后，好处全部到位：

| 好处 | 说明 |
| --- | --- |
| 复用单例 | `LoggerService` 是全局单例，处理器不用各自 `new` 一份 |
| 解耦 | 处理器不关心 logger 怎么配置、输出到哪 |
| 可测试 | 测试时往构造函数塞一个假 logger 即可验证是否调用 |
| 统一 | 所有过滤器 / 拦截器 / 守卫用同一个日志实例 |

## 5. 函数式中间件为何不能注入

`src/middleware/logger_fun.midderware.ts` 是一个普通 Express 函数，**不存在构造函数、不在 IoC 容器中**，因此无法注入 Service。

它在 `app.module.ts` 中通过 `consumer.apply(logger_funMidderware)` 挂上后，只对请求做无状态的 `console.log`。若需要在中间件里访问 Nest 的 provider，请改用**类中间件**。

> 注意：`app.use(函数式中间件)`（在 `main.ts`）同样绕开 DI 容器，且不支持 `.exclude()`。详见 `nestjs-middleware-functional-vs-class.md` 第 6 节。

## 6. 本项目里对照学习的「正反示例」

`src/cats/cats.controller.ts` 同时保留了两种过滤器用法，非常适合对照：

```ts
@Controller('cats')
@UseFilters(HttpExceptionFilter)          // ✅ 传类 → 框架实例化并注入（控制器级）

export class CatsController {
  @Post()
  @UseFilters(HttpExceptionFilter)        // ✅ 传类 → 可注入（路由级）
  create() { throw new ForbiddenException(); }

  @Get('test')
  @UseFilters(HttpExceptionFilter)        // ✅ 传类 → 可注入（路由级）
  find() { ... }
}
```

> 早期版本里曾用 `new HttpExceptionFilter()` 演示「反面实例」，但因过滤器构造函数已注入
> `LoggerService`，手动 `new` 会导致运行时 `logger` 为 `undefined`、且局部过滤器无法解析依赖，
> 故现已统一改为传「类」的写法。

## 7. 小结

- **IoC** = 把创建依赖的控制权交给 Nest 容器；**DI** = 容器通过构造函数把依赖送进来。
- 过滤器 / 中间件能被注入的前提：**标 `@Injectable()` + 注册时只给「类」不给「实例」**。
- 注入了，它们就能复用项目里的单例 Service（日志、数据库、配置等），而不是自己硬 `new`。
- 函数式中间件因脱离 IoC 容器，**天然不支持 DI**，只适合简单无状态逻辑。
- 全局（`APP_FILTER` + `useClass`）与装饰器（`@UseFilters(类)`）走的是同一条注入通道，区别只在作用范围。
- 通过「类」注册的过滤器/拦截器/守卫，其依赖解析范围是「使用方模块」，共享 Service 应放全局模块或显式导入。
