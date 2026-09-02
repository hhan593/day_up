# 01 - NestJS 基础（Fundamentals）

> 来源：NestJS 中文文档 fundamentals 章节（[docs.nestjs.cn](https://docs.nestjs.cn)）
> 基础是所有章节的地基：控制器/提供者/模块是"三件套"，中间件→守卫→拦截器→管道→异常处理是"请求链路"，装饰器/DI/动态模块/作用域/生命周期是"进阶机制"。

---

## 一、文档清单

| 文档 | 主题 | 对应官方页 |
|---|---|---|
| [controllers.md](./controllers.md) | 控制器：路由、参数装饰器、响应 | /controllers |
| [providers.md](./providers.md) | 提供者：@Injectable、Service、DI | /overview/providers/ |
| [modules.md](./modules.md) | 模块：封装边界、共享、全局 | /modules |
| [middleware.md](./middleware.md) | 中间件：路由前的 req/res/next | /middlewares/ |
| [pipes.md](./pipes.md) | 管道：转换/校验 | /pipes |
| [interceptors.md](./interceptors.md) | 拦截器：环绕逻辑、RxJS | /interceptors |
| [guards.md](./guards.md) | 守卫：授权、Reflector | /guards |
| [exception-filters.md](./exception-filters.md) | 异常过滤器：统一错误响应 | /exception-filters |
| [custom-decorators.md](./custom-decorators.md) | 自定义装饰器：createParamDecorator、Reflector | /custom-decorators |
| [dependency-injection.md](./dependency-injection.md) | 自定义提供者进阶：令牌、工厂、异步 | /fundamentals/dependency-injection/ |
| [dynamic-modules.md](./dynamic-modules.md) | 动态模块：register/forRoot 配置 | /fundamentals/dynamic-modules |
| [execution-context.md](./execution-context.md) | ExecutionContext：跨平台上下文 | /fundamentals/execution-context |
| [circular-dependency.md](./circular-dependency.md) | 循环依赖：forwardRef | /fundamentals/circular-dependency |
| [injection-scopes.md](./injection-scopes.md) | 作用域：DEFAULT/REQUEST/TRANSIENT | /fundamentals/provider-scopes/ |
| [lifecycle-events.md](./lifecycle-events.md) | 生命周期钩子 | /fundamentals/lifecycle-events |

---

## 二、请求处理链路（执行顺序）

```
请求
 └─ 全局中间件 (middleware.md)         ← Express 原生风格，无 ExecutionContext
    └─ 守卫 Guards (guards.md)         ← 授权，可读路由元数据（ExecutionContext）
       └─ 拦截器前 (interceptors.md)
          └─ 管道 Pipes (pipes.md)     ← 校验/转换参数
             └─ 控制器 Controller (controllers.md)
                └─ Service (providers.md)
             └─ 拦截器后 (响应映射/日志)
          └─ 异常过滤器 (exception-filters.md)  ← 任何环节抛错都到这里
```

口诀：**中间守门、管道验参、拦截环绕、异常兜底**。

---

## 三、三件套（必会）

```
Module = 盒子 { controllers: [HTTP门面], providers: [业务零件], imports, exports }
Controller = @Controller('前缀') + @Get/@Post + @Param/@Body
Provider = @Injectable Service，构造注入，IoC 容器管理
```
见 `controllers.md` / `providers.md` / `modules.md`。

---

## 四、进阶机制

- **装饰器**：`@Body/@Param/@User` 底层 = `createParamDecorator`（custom-decorators.md）
- **DI 自定义**：`useValue/useClass/useFactory/useExisting` 四类（dependency-injection.md）
- **动态模块**：`register/forRoot/registerAsync` 传参定制（dynamic-modules.md）——也是 `../02-techniques` 各模块的底层
- **作用域**：单例/请求/瞬态，性能取舍（injection-scopes.md）
- **循环依赖**：`forwardRef` 应急，抽公共模块根治（circular-dependency.md）
- **生命周期**：启动初始化 / 收信号清理（lifecycle-events.md）

---

## 五、与 TypeScript 文档衔接（跨目录）

| Nest 知识点 | TS 文档对应 |
|---|---|
| DTO 必须用 class 不能 interface | `typescript-interview-questions.md`「为什么 DTO 用 class」 |
| 管道 `metatype` 消失、泛型擦除 | `typescript-advanced-type-system.md`「类型擦除」 |
| `@Roles`/守卫读元数据用 `never` 穷尽 | `typescript-interview-questions.md`「any/unknown/never/void」 |
| 拦截器 RxJS `map/tap/catchError` | 工作区根 `12-RxJS核心概念与API详解.md` |
| 装饰器实现原理 | `06-NestJS装饰器与自定义装饰器.md`、`decorator-summary.md` |
| DI 与 reflect-metadata | `07-NestJS依赖注入与过滤器注入.md` |

---

## 六、与 02/03 章节衔接

- **02-techniques**：`validation.md`（管道实战）、`caching.md`/`http-module.md`（动态模块 `registerAsync`）、`events.md`（解耦循环依赖）
- **03-security**：`authentication.md`（守卫挂 JWT）、`authorization.md`（Reflector 角色授权）、`encryption-hashing.md`（Service 里哈希）

---

## 七、坑速查

1. 控制器/提供者忘了注册模块 → `Nest can't resolve dependencies`
2. 共享服务忘了 `exports` → 导入方拿不到
3. 中间件忘了 `next()` → 请求挂起
4. 全局管道/守卫/拦截器/过滤器 → 用 `APP_*` 令牌（支持 DI），别只用 `app.useXxxGlobal`
5. 请求作用域慎用（性能），WebSocket/Passport/Cron 必须单例
6. 销毁钩子要先 `app.enableShutdownHooks()`

---

## 八、学习顺序建议

```
controllers → providers → modules（三件套）
  → middleware → guards → interceptors → pipes → exception-filters（链路）
  → custom-decorators → dependency-injection → dynamic-modules（进阶）
  → execution-context → circular-dependency → injection-scopes → lifecycle-events（机制）
```
