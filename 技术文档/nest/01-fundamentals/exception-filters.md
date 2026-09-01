# NestJS 异常过滤器（Exception Filters）

> 来源：[NestJS 中文文档 · 异常过滤器](https://docs.nestjs.cn/exception-filters)
> 异常过滤器捕获异常、定制响应格式，是请求处理链的最后一道防线。

---

## 一、异常过滤器是什么？（通俗对比）

异常过滤器像**统一的"事故处理中心"**：任何环节抛错，都汇集到这里，按错误类型生成标准化回执（状态码+消息）。

**对比其他框架**：
- **Spring `@ControllerAdvice` + `@ExceptionHandler`**：几乎一模一样——全局捕获、按异常类型分发。
- **Express**：`app.use((err, req, res, next) => {})` 错误中间件——Nest 用 `@Catch()` 装饰器更精确地"按类型捕获"。
- **Java try/catch**：那是局部捕获；Nest 过滤器是**全局/层级**的 AOP 式捕获。

---

## 二、内置异常层 & HttpException

Nest 有内置全局异常过滤器：识别 `HttpException` 返回对应响应；未识别返回 `{ statusCode: 500, message: 'Internal server error' }`。

```ts
throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
// → { "statusCode": 403, "message": "Forbidden" }

throw new HttpException(
  { status: HttpStatus.FORBIDDEN, error: 'custom' },
  HttpStatus.FORBIDDEN,
  { cause: error },   // cause 不序列化到响应，仅用于日志
);
```

内置 HTTP 异常（20 种）：`BadRequestException`、`NotFoundException`、`ForbiddenException`... 均可传 `cause`/`description`。

```ts
throw new BadRequestException('bad', { cause: new Error(), description: '细节' });
// → { "message": "...", "error": "细节", "statusCode": 400 }
```

自定义异常：继承 `HttpException` 即可被内置层识别。

```ts
export class ForbiddenException extends HttpException {
  constructor() { super('Forbidden', HttpStatus.FORBIDDEN); }
}
```

---

## 三、自定义过滤器

```ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)   // 指定捕获类型；空 @Catch() 捕获所有
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```
> Fastify 用 `response.send()` 代替 `json()`。`ArgumentsHost` 抽象使过滤器跨 HTTP/微服务/WS 通用。

---

## 四、绑定过滤器

```ts
// 方法级 / 控制器级
@Post() @UseFilters(HttpExceptionFilter) create() {}   // 类方式省内存，优先
@Controller() @UseFilters(HttpExceptionFilter) export class CatsController {}

// 全局（推荐 APP_FILTER 支持 DI）
import { APP_FILTER } from '@nestjs/core';
@Module({ providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }] })
export class AppModule {}
```
> `app.useGlobalFilters()` 无 DI、对网关/微服务不生效。

---

## 五、捕获所有异常（平台无关）

用 `HttpAdapterHost` 跨平台回复，避免直接依赖 Express：

```ts
@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const status = exception instanceof HttpException
      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    httpAdapter.reply(ctx.getResponse(), {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    }, status);
  }
}
```
> 与特定类型过滤器同用时，先声明"捕获所有"过滤器。

---

## 六、继承内置过滤器

```ts
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);  // 委托默认全局过滤器，前后加自定义逻辑
  }
}
```

---

## 七、速查表

| 知识点 | 关键用法 |
|---|---|
| `@Catch()` | 指定捕获类型，空参捕获全部 |
| `ExceptionFilter` | 实现 `catch(exception, host)` |
| `HttpException` | 标准异常基类 |
| `ArgumentsHost` | `switchToHttp()` 取 req/res，跨平台 |
| `@UseFilters()` | 方法/控制器，优先类方式 |
| 全局 | `useGlobalFilters` 或 `APP_FILTER` |
| 自定义异常 | 继承 `HttpException` |

---

## 八、与 TS 文档衔接

- `never` 类型常用于"穷尽性检查"确保异常被覆盖（见 `typescript-interview-questions.md` 的 `never`）。
- `cause` 选项对应 TS 的 `Error` 链式（`error.cause`）——ES2022 标准。

---

## 九、一句话总结

> 异常过滤器 = `@Catch(T)` + `ExceptionFilter.catch(exception, host)`，定制错误响应；`ArgumentsHost` 跨平台取 req/res；绑定 `@UseFilters` / 全局 `APP_FILTER`；继承 `BaseExceptionFilter` 可委托默认行为。
