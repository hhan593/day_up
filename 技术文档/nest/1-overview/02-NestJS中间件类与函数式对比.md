# 知识点：NestJS 函数式中间件 vs 类中间件

## 1. 两种中间件形式

NestJS 支持两种自定义中间件：
- **类中间件（Class Middleware）**：实现 `NestMiddleware` 接口的类。
- **函数式中间件（Functional Middleware）**：一个普通的 Express 风格函数。

本项目中的两个示例正好覆盖了这两种形式：

- 类中间件：`src/middleware/logger.midderware.ts`
- 函数式中间件：`src/middleware/logger_fun,midderware.ts`

## 2. 类中间件（Class Middleware）

实现 `NestMiddleware` 接口，必须提供 `use(req, res, next)` 方法，并通常用 `@Injectable()` 装饰。

```ts
// src/middleware/logger.midderware.ts
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

**注册方式**（在实现了 `NestModule` 的模块中配置）：

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)              // 传入类本身
      .exclude(
        { path: 'cats', method: RequestMethod.GET },
        { path: 'cats', method: RequestMethod.POST },
        'cats/{*splat}',
      )
      .forRoutes('*');
  }
}
```

## 3. 函数式中间件（Functional Middleware）

就是一个普通的 Express 中间件函数，不需要实现接口、也不需要装饰器。

```ts
// src/middleware/logger_fun,midderware.ts
import { Request, Response, NextFunction } from 'express';

export function logger_funMidderware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.log('Request...');
  next();
}
```

**注册方式**（和类中间件完全一致，只是传入函数本身）：

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(logger_funMidderware)          // 传入函数本身
      .forRoutes('*');
  }
}
```

## 4. 核心区别对比

| 维度 | 类中间件 | 函数式中间件 |
| --- | --- | --- |
| 定义形式 | 实现 `NestMiddleware` 接口的类 | 普通 Express 风格函数 |
| 是否需要 `@Injectable()` | 推荐加（才能注入依赖） | 不需要 |
| 依赖注入（DI） | 支持，可通过构造函数注入 Service、Config 等 | 不支持（普通函数无法接入 Nest IoC 容器） |
| 是否可声明为 provider | 可，能被单例管理、被其他模块复用 | 不可 |
| 适用场景 | 需要访问 Nest 服务、配置、或可测试/可注入逻辑 | 简单、无状态、无需注入的逻辑 |
| 注册写法 | `.apply(LoggerMiddleware)` | `.apply(logger_funMidderware)` |

> 两者在 `apply()` 中只是传入「类」或「函数」的区别，下游的 `.exclude()` / `.forRoutes()` 用法完全相同。

## 5. 选型建议

- **用函数式中间件**：逻辑简单（如打印日志、设置响应头、简单校验），且**不需要访问 Nest 的 provider**（如 `ConfigService`、`PrismaService` 等）。
- **用类中间件**：需要在中间件里**注入并使用 Nest 的 Service/配置**，或者希望中间件本身作为可单例、可测试、可被模块管理的 provider 存在。

一句话总结：**需要依赖注入就选类中间件，纯函数式无状态逻辑就选函数式中间件**。

## 6. 全局中间件（Global Middleware）

让中间件对所有路由生效，在 NestJS 中有**两条路径**，它们与依赖注入（DI）的关系完全不同。

### 路径 A：`app.use()` —— 挂在 Express 实例上（main.ts）

```ts
// src/main.ts
import { logger_funMidderware } from './middleware/logger_fun,midderware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(logger_funMidderware); // 原生 Express 挂载方式
  await app.listen(3000);
}
bootstrap();
```

- 这是原生 Express 的挂载方式，**发生在 Nest IoC 容器之外**；
- 因此**无法访问 DI 容器**，拿不到 `ConfigService`、`PrismaService` 等 Nest 管理的 Service；
- 因为本来就访问不了 DI，推荐这里用**函数式中间件**（轻量、无需 `@Injectable()`），避免用类中间件却注入不到依赖的尴尬；
- **缺点**：绕过了 `MiddlewareConsumer`，所以**没有 `.exclude()`**，无法按路由排除。

### 路径 B：`AppModule` 中用 `.forRoutes('*')` —— 走 Nest 消费机制

```ts
// src/app.module.ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)   // 类中间件，支持 DI
      .forRoutes('*');           // 对所有路由生效
  }
}
```

- 走的是 Nest 的 `MiddlewareConsumer` 机制，Nest 会先用 DI 容器把类中间件**实例化好**再应用；
- 因此**可以正常访问 DI**，能在中间件构造函数里注入 Service；
- 需要 DI 时必须选这条路，且中间件应为**类中间件**（函数式同样能挂，但只是因为它本就不需要 DI）；
- **优点**：保留了 `.exclude()` / `.forRoutes()` 的全部能力，可按路由排除。

### 两条路径对比

| 维度 | 路径 A：`app.use()` | 路径 B：`.forRoutes('*')` |
| --- | --- | --- |
| 挂载位置 | `main.ts` 的 Express 实例 | 模块的 `configure()` |
| 是否经过 Nest DI 容器 | 否 | 是 |
| 能否注入 Nest Service | 不能 | 能（用类中间件时） |
| 能否用 `.exclude()` 排除路由 | 不能 | 能 |
| 推荐中间件形式 | 函数式中间件 | 类中间件（需要 DI 时） |

### 选型口诀

- **全局生效 + 不需要 DI** → `app.use(函数式中间件)`，简单轻量；
- **全局生效 + 需要 DI** → `AppModule` 中类中间件 + `.forRoutes('*')`，能注入 Service。

> 一句话：路径 A（`app.use()`）天然断开 DI，适合函数式中间件；想要 DI 就换到路径 B（`forRoutes('*')`），用类中间件。

## 7. 注意事项

- `MiddlewareConsumer` 仅在实现了 `NestModule` 接口的模块中可用（`configure()` 方法内）。
- 中间件不能访问 Guard / Interceptor 的上下文，它运行在路由处理之前，更贴近底层 Express 请求管道。
- `app.use()` 属于全局挂载但**不支持** `.exclude()`；若既想全局又想排除部分路由，请改用路径 B（`.forRoutes('*')` + `.exclude()`）。
- 排除路由的能力属于 `MiddlewareConsumer` 消费机制，与中间件是类还是函数形式无关（参见第 4、5 节）。

## 8. 中间件的应用范围与 exclude 实战

通过 `MiddlewareConsumer` 可以精确控制中间件作用在哪些路由上，远不止 `.forRoutes('*')` 全局生效这一种。

### 8.1 forRoutes 的几种写法

```ts
consumer.apply(LoggerMiddleware).forRoutes(
  'cats',                                  // 字符串：匹配 /cats 下的所有路由
  { path: 'cats', method: RequestMethod.GET }, // 对象：精确匹配某方法
  CatsController,                           // 直接传控制器类：作用于该控制器全部路由
);
```

- **字符串**：匹配该路径前缀下的全部路由（含子路由）；
- **对象 `{ path, method }`**：精确匹配具体 HTTP 方法和路径；
- **控制器类**：一次性作用于该控制器内所有路由，最省事。

### 8.2 exclude 排除特定路由

`.exclude()` 用于在「应用了中间件的范围」内剔除部分路由（注意：它只在 `forRoutes` 之后生效，且只对传入的对象/字符串形式生效，不支持排除控制器类）。

```ts
consumer
  .apply(LoggerMiddleware)
  .exclude(
    { path: 'cats', method: RequestMethod.GET },  // 排除 GET /cats
    { path: 'cats', method: RequestMethod.POST },  // 排除 POST /cats
    'cats/(.*)',                                   // 排除 cats 下所有子路由（正则风格）
  )
  .forRoutes('*'); // 其余所有路由仍应用中间件
```

本项目 `AppModule` 正是这样配置：对除 `cats` 相关 GET/POST 之外的所有路由记录日志。

### 8.3 中间件与守卫、管道的定位区别

| 机制 | 典型职责 | 能否用 DI | 能否读路由 handler |
| --- | --- | --- | --- |
| 中间件 | 请求/响应处理（日志、CORS、压缩） | 类中间件可以 | 否（只看 req/res） |
| 守卫 | 鉴权 / 权限（是否放行） | 可以 | 可以（ExecutionContext） |
| 管道 | 参数转换 / 校验 | 可以 | 可以（ArgumentMetadata） |

> 经验法则：凡是需要「根据路由信息或用户信息做判断」的逻辑，优先放守卫；只针对入参的，放管道；与具体路由无关的通用处理（如日志、Header 解析）才放中间件。
