# NestJS 拦截器（Interceptors）

> 来源：[NestJS 中文文档 · 拦截器](https://docs.nestjs.cn/interceptors)
> 拦截器受 AOP 启发，可在方法**前后**绑定逻辑：日志、响应映射、异常处理、缓存、超时。

---

## 一、拦截器是什么？（通俗对比）

拦截器像**带前后包装的快递站**：包裹出发前称重记录（前逻辑），回来后重新打包贴标（响应映射），甚至包裹丢了换成备用（异常/缓存覆盖）。

**对比其他框架**：
- **Spring AOP** / **Aspect**：`@Around` 环绕通知 ≈ Nest 拦截器的 `intercept`（前后都能插逻辑）。Nest 用 RxJS 流表达这个"环绕"。
- **Express 中间件**：中间件只有"前"，拦截器有"前+后+覆盖"，且能拿到方法返回**流**（RxJS Observable）。
- **Angular HTTP_INTERCEPTORS**：概念几乎一样（请求/响应拦截）。

---

## 二、实现拦截器

```ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Before...');
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`After... ${Date.now() - now}ms`)),
    );
  }
}
```

- `context`：`ExecutionContext`，含控制器/方法信息（同守卫）。
- `next.handle()`：返回路由处理方法返回的 **Observable 流**；**不调用则方法不执行**（可实现缓存覆盖）。

---

## 三、常见 RxJS 操作

| 操作 | 用途 | 示例 |
|---|---|---|
| `tap` | 副作用（日志），不改流 | 记录耗时 |
| `map` | 转换响应 | 包装 `{ data }` |
| `catchError` | 转换异常 | 统一错误格式 |
| `timeout` | 超时控制 | 5s 取消 |
| `of(...)` | 直接造流覆盖 | 命中缓存返回 |

---

## 四、响应映射

```ts
// 统一包装成 { data }
intercept(context, next) {
  return next.handle().pipe(map(data => ({ data })));
}

// null → 空串
intercept(context, next) {
  return next.handle().pipe(map(v => (v === null ? '' : v)));
}
```
> ⚠️ `map` 不适用于 `@Res()` 直接响应策略。

---

## 五、异常 & 超时

```ts
// 异常映射
catchError(err => throwError(() => new BadGatewayException()))

// 超时
intercept(context, next) {
  return next.handle().pipe(
    timeout(5000),
    catchError(err => err instanceof TimeoutError
      ? throwError(() => new RequestTimeoutException())
      : throwError(() => err)),
  );
}
```

---

## 六、缓存覆盖（不调 handle）

```ts
intercept(context, next) {
  if (isCached) return of([]);  // 直接返回，路由不执行
  return next.handle();
}
```
> 真实缓存结合 `Reflector` + 自定义装饰器（见 `custom-decorators.md`、`guards.md`）。

---

## 七、绑定方式

```ts
// 控制器/方法级
@UseInterceptors(LoggingInterceptor) export class CatsController {}
@UseInterceptors(new LoggingInterceptor()) @Get() findAll() {}

// 全局（推荐 APP_INTERCEPTOR 支持 DI）
@Module({ providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }] })
export class AppModule {}
```
> `app.useGlobalInterceptors()` 也能全局，但无 DI、对网关/微服务不生效。

---

## 八、与 TS 文档衔接

- 拦截器大量用 RxJS（`map`/`tap`/`catchError`/`timeout`/`of`）——详见 `../技术文档/typescript` 的 RxJS 文档（工作区根目录 `12-RxJS核心概念与API详解.md`）。
- `ExecutionContext` 见 `execution-context.md`。

---

## 九、坑 & 最佳实践

1. **必须调 `next.handle()`**：否则方法不执行（除非故意缓存覆盖）。
2. **`@Res()` 冲突**：响应映射对流无效，用了 `@Res()` 就别指望 `map`。
3. **全局拦截器顺序**：`APP_INTERCEPTOR` 按注册顺序，缓存拦截器放最前。

---

## 十、一句话总结

> 拦截器 = `@Injectable` + `NestInterceptor.intercept(ctx, next)`，`next.handle()` 返回 Observable 流；用 RxJS 做日志/响应映射/异常/超时/缓存；绑定分局部 `@UseInterceptors` 与全局 `APP_INTERCEPTOR`。
