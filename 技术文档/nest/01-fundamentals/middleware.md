# NestJS 中间件（Middleware）

> 来源：[NestJS 中文文档 · 中间件](https://docs.nestjs.cn/middlewares/)
> 中间件在**路由处理程序之前**执行，可访问 req/res/next。

---

## 一、中间件是什么？（通俗对比）

中间件像**工厂大门的安检**：请求进来先过安检（记录日志、校验 token、加 header），再放行到具体车间（控制器）。

**对比其他框架**：
- **Express**：中间件就是 Express 原生概念，Nest 直接复用（`req, res, next` 签名一致）。
- **Koa**：Koa 的"中间件"是洋葱模型（`next()` 前后都可写），Nest 中间件只对应 Koa 的"前置"部分；Nest 的"前后都包"能力在**拦截器**（见 `interceptors.md`）。
- **Spring**：`Filter` / `HandlerInterceptor` 类似，但 Spring 的 Filter 在 Servlet 层，Nest 中间件在路由层之前。

---

## 二、函数式中间件（无依赖时最简）

```ts
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();   // 必须调用，否则请求挂起
}
```

---

## 三、类中间件（可注入依赖）

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log('Request...');
    next();
  }
}
```
> 也可省略 `implements NestMiddleware`，仅用 `@Injectable()` + `use` 方法；类中间件能构造函数注入同模块依赖。

---

## 四、绑定中间件：`configure()`

中间件**不在 `@Module()` 里配**，而在实现 `NestModule` 的 `configure()` 中：

```ts
import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';

@Module({ imports: [CatsModule] })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);            // 或传 'cats' / { path, method }
  }
}
```

- 限定方法：`.forRoutes({ path: 'cats', method: RequestMethod.GET })`
- 多个中间件：`.apply(cors(), helmet(), logger)`（按顺序执行）

---

## 五、路由通配 & 排除

```ts
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },
    'cats/{*splat}',          // path-to-regexp 通配
  )
  .forRoutes(CatsController);
```
> `'abcd/*splat'` 匹配 `abcd/` 后任意；`'abcd/{*splat}'` 让通配可选（含无后缀的 `abcd/`）。

---

## 六、全局中间件

```ts
const app = await NestFactory.create(AppModule);
app.use(logger);   // 函数式，绑定到所有路由
```
> ⚠️ 全局中间件**无法访问 DI 容器**。如需 DI，用类中间件 + `.forRoutes('*')`。

---

## 七、Express 默认行为

用 Express 适配器时，Nest 默认注册 body-parser 的 `json`/`urlencoded`。需自定义可在 `NestFactory.create(AppModule, { bodyParser: false })` 关闭。

---

## 八、执行顺序（全链路）

```
请求 → 全局中间件 → 模块中间件 → 守卫(Guards) → 拦截器前 → 管道(Pipes) → 控制器 → 拦截器后 → 异常过滤器
```
> 中间件在最前，守卫次之。中间件**不知道**接下来执行哪个处理器（无 ExecutionContext），这是它与守卫的核心区别（见 `guards.md`）。

---

## 九、坑 & 最佳实践

1. **忘了 `next()`**：请求永久挂起（超时）。
2. **全局中间件要 DI**：改用类中间件 + `.forRoutes('*')`。
3. **Fastify 差异**：Fastify 中间件机制不同，部分 Express 中间件需适配。
4. **安全中间件**：`helmet`/`cors` 实际就是中间件，见 `../03-security/`。

---

## 十、一句话总结

> 中间件 = 路由前的 `req/res/next` 函数，函数式（无依赖）或类式（可 DI）；用 `configure()` + `apply().forRoutes()` 绑定，全局用 `app.use()`（无 DI）。
