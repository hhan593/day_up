# 知识点：NestJS 与 AOP（面向切面编程）

> 本文档把中间件、守卫、拦截器、管道、过滤器统一到 **AOP（Aspect-Oriented Programming，面向切面编程）**
> 视角下来理解。它们是 Nest 实现「横切关注点（cross-cutting concerns）」的五种武器：
> 日志、鉴权、校验、异常处理、响应转换等，都不应污染业务代码，而是「切」在请求链路的不同位置。

## 1. 什么是 AOP

业务代码只关心「核心逻辑」（如 `DogsService.create`）。但日志、鉴权、参数校验、异常处理这些
「横切」在所有路由上的通用逻辑，如果写进每个控制器，就会重复且难维护。

AOP 的思想：**把这些通用逻辑抽成独立的「切面」，在请求生命周期的特定节点自动织入（weave）**，
业务代码完全无感。NestJS 天生就是 AOP 框架，它用五种「切面组件」覆盖请求全链路。

## 2. 请求生命周期中的五种切面（执行顺序）

一次 HTTP 请求在 Nest 中经过的节点（由外到内 → 再由内到外返回）：

```
请求进入
  │
  ▼
① 中间件 Middleware        （最外层，Express 层；可访问 req/res/next）
  │
  ▼
② 守卫 Guard                （路由前鉴权/角色校验，决定「能不能进」）
  │
  ▼
③ 拦截器 Interceptor        （进入控制器「之前」可改写/记录，也有「之后」钩子）
  │
  ▼
④ 管道 Pipe                 （参数校验与转换：@Body/@Query/@Param 的值）
  │
  ▼
⑤ 控制器方法 Controller     （真正的核心业务逻辑）
  │
  ▼（返回时逆向经过）
⑤→④→③ 拦截器「之后」钩子（统一响应包装、耗时统计）
  │
  ▼（若抛出异常）
⑥ 异常过滤器 Exception Filter（捕获异常，决定返回什么错误响应）
  │
  ▼
响应返回客户端
```

> 简化记忆：**中间件 → 守卫 → 拦截器(前) → 管道 → 控制器 → 拦截器(后) → 过滤器(异常时)**。

## 3. 五种切面职责对比

| 组件                    | 关注点         | 能否改响应              | 能否注入 DI        | 典型用途                 |
| ----------------------- | -------------- | ----------------------- | ------------------ | ------------------------ |
| 中间件 Middleware       | 最底层请求处理 | 可（直接操作 res）      | 类式可，函数式不可 | 日志、CORS、cookie 解析  |
| 守卫 Guard              | 鉴权/授权      | 否（只返回 true/false） | 可                 | JWT 校验、角色权限       |
| 拦截器 Interceptor      | 横切增强       | 可（RxJS 改写响应）     | 可                 | 响应包装、缓存、耗时统计 |
| 管道 Pipe               | 参数校验/转换  | 否（只返回清洗后的值）  | 可                 | DTO 校验、类型转换       |
| 过滤器 Exception Filter | 异常处理       | 可（返回错误响应）      | 可                 | 统一错误格式、日志       |

## 4. 各组件与本项目代码的对应

### 4.1 中间件（Middleware）

- 见 `docs/02-NestJS中间件类与函数式对比.md`。
- 类式中间件（如 `LoggerMiddleware`）标注 `@Injectable()` 后可注入 `LoggerService`；
  函数式中间件（如 `logger_funMidderware`）脱离 DI 容器，无法注入，适合无状态逻辑。
- 在 `app.module.ts` 的 `configure()` 中通过 `consumer.apply(...).exclude(...).forRoutes(...)` 配置。

### 4.2 守卫（Guard）

- 见 `docs/03-NestJS守卫知识点.md`。
- 实现 `CanActivate` 接口，返回 `boolean`；失败抛 `ForbiddenException`/`UnauthorizedException`。
- 通过 `@UseGuards()` 或全局 `app.useGlobalGuards()` 注册。

### 4.3 拦截器（Interceptor）

- 实现 `NestInterceptor`，用 RxJS `Observable` 在「前后」两个时机增强。
- 典型：`response-transform`（统一包装 `{ data, code, message }`）、`timeout`、缓存。

### 4.4 管道（Pipe）

- 见 `docs/04-NestJS管道用法.md` 与 `docs/05-NestJS异常过滤器与校验管道协作机制.md`。
- `ValidationPipe`（class-validator）与 `ZodValidationPipe`（zod）已实现，校验失败抛
  `BadRequestException`（属 `HttpException`），返回结构化 `errors`。

### 4.5 异常过滤器（Exception Filter）

- 见 `docs/07-NestJS依赖注入与过滤器注入.md`、`docs/05-NestJS异常过滤器与校验管道协作机制.md`。
- `HttpExceptionFilter`（`@Catch(HttpException)`，注入 `LoggerService` 记日志）；
  `CatchEverythingFilter`（`@Catch()` 兜底，内部对 `HttpException` 透传 `errors`）。
- 注册方式：全局用 `APP_FILTER` + `useClass`（传类以支持 DI），莫用 `new` 实例。

## 5. 注册方式总览（AOP 切面的「织入点」）

| 注册位置                                                    | 作用域                | 备注                                                                                              |
| ----------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `@Injectable()` + 模块 `providers`                          | 使其成为可注入的 Bean | 所有切面组件都需此前提                                                                            |
| `consumer.apply().forRoutes()`（Middleware）                | 路由级                | 仅中间件                                                                                          |
| `@UseGuards()/@UseInterceptors()/@UsePipes()/@UseFilters()` | 控制器/路由/参数级    | 装饰器局部注册                                                                                    |
| `app.useGlobal*` / `APP_*` 全局 provider                    | 全局                  | 推荐 `APP_*`（`APP_GUARD`/`APP_INTERCEPTOR`/`APP_PIPE`/`APP_FILTER`），因其走 DI 容器、可注入依赖 |

> 关键实践：**全局切面优先用 `APP_*` provider + `useClass`（传「类」）注册**，这样框架实例化时
> 才能注入其他 Service（如 `LoggerService`）。手动 `new` 实例会绕开 DI 容器，导致依赖为 `undefined`。

## 6. AOP 带来的收益（为什么用切面）

1. **业务代码零侵入**：日志、鉴权、校验、异常处理都不写在控制器里。
2. **单一职责 + 高复用**：一个 `LoggerMiddleware` 服务所有路由；一个 `ValidationPipe` 服务所有 DTO。
3. **统一横切行为**：所有异常走统一格式、所有响应可统一包装、所有请求可统一记录。
4. **可测试**：每个切面独立单测，业务逻辑与横切逻辑解耦。
5. **可插拔**：切面可全局/局部开关，不影响业务。

## 7. 设计模式提示

- **责任链 / 洋葱模型**：中间件、守卫、拦截器、过滤器按嵌套顺序逐层进入、逆序返回，异常时由外层向内匹配第一个能处理的过滤器。
- **装饰器模式**：`@UseGuards()`/`@UseFilters()` 等把切面「织入」到目标上，符合 AOP 的「声明式织入」。
- **依赖注入**：所有切面组件都是 Nest 容器托管的 Bean，体现 IoC（见 `docs/07-NestJS依赖注入与过滤器注入.md`）。

## 8. 一句话总结

> NestJS 用 中间件 / 守卫 / 拦截器 / 管道 / 过滤器 这五种「切面组件」，
> 在请求生命周期的不同节点织入日志、鉴权、校验、响应转换、异常处理等横切逻辑，
> 让控制器只做业务，从而实现 AOP。理解它们的**执行顺序**与**各自职责边界**，是掌握 Nest 的关键。
