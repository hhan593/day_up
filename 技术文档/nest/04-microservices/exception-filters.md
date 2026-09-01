# NestJS 微服务异常过滤器

> 来源：[NestJS 中文文档 · 微服务 > 异常过滤器](https://docs.nestjs.cn/microservices/exception-filters)
> 微服务层处理错误与 HTTP 不同：抛 `RpcException`，过滤器返回 `Observable`。

---

## 一、核心区别：用 `RpcException` 而非 `HttpException`

微服务之间不是 HTTP，不能抛 `HttpException`。Nest 提供 `RpcException`（来自 `@nestjs/microservices`）：

```ts
import { RpcException } from '@nestjs/microservices';

throw new RpcException('Invalid credentials.');
```

Nest 会把它处理成固定结构：

```json
{ "status": "error", "message": "Invalid credentials." }
```

---

## 二、自定义微服务异常过滤器

与 HTTP 过滤器类似，但 `catch()` **必须返回 Observable**（用 `throwError`）：

```ts
import { Catch, RpcExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch(RpcException)
export class RpcExceptionFilter implements RpcExceptionFilter<RpcException> {
  catch(exception: RpcException, host: ArgumentsHost): Observable<any> {
    return throwError(() => exception.getError());
  }
}
```

- `host` 是 `ArgumentsHost`，用 `host.switchToRpc()` 取 RPC 上下文（与 `../01-fundamentals/execution-context.md` 一致）。
- 绑定：方法级 `@UseFilters(new RpcExceptionFilter())`、控制器级 `@UseFilters(...)`。

---

## 三、继承核心过滤器

```ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    return super.catch(exception, host);  // 委托默认逻辑 + 自定义前后处理
  }
}
```

---

## 四、⚠️ 混合应用的坑

文档明确提示：**混合应用（Hybrid Application）下，全局微服务异常过滤器默认未启用**。需在 `connectMicroservice` 时显式挂，或用 `app.useGlobalFilters`（注意 DI）。

---

## 五、与基础章节衔接

- `RpcException` 是 `HttpException` 的 RPC 版——HTTP 篇见 `../01-fundamentals/exception-filters.md`。
- 过滤器机制（@Catch/ArgumentsHost/绑定）完全一致，仅传输上下文从 `switchToHttp` 变 `switchToRpc`。

---

## 六、一句话总结

> 微服务异常用 `RpcException`（非 HttpException）；自定义过滤器 `@Catch(RpcException)` + `catch()` 返回 `throwError(...)`；继承 `BaseRpcExceptionFilter` 可委托默认行为；混合应用全局过滤器默认关。
