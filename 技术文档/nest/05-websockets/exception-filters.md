# NestJS WebSocket 异常过滤器

> 来源：[NestJS 中文文档 · WebSocket > 异常过滤器](https://docs.nestjs.cn/websockets/exception-filters)
> WebSocket 层的异常过滤器与 HTTP 版机制完全一致，唯一区别：抛 `WsException` 而非 `HttpException`。

---

## 一、核心区别：`WsException`

```ts
import { WsException } from '@nestjs/websockets';

throw new WsException('Invalid credentials.');
```

Nest 自动向客户端发 `exception` 消息：

```json
{ "status": "error", "message": "Invalid credentials." }
```

---

## 二、自定义过滤器

与 HTTP 过滤器同结构（`@Catch` + `catch(exception, host)`），绑定用 `@UseFilters`：

```ts
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);  // 委托默认，前后加自定义逻辑
  }
}
```

- **方法级**：`@UseFilters(new WsExceptionFilter())` 修饰 `@SubscribeMessage` 方法。
- **网关级**：网关类前 `@UseFilters(...)`。
- 继承 `BaseWsExceptionFilter`（来自 `@nestjs/websockets`）委托默认行为。

> 机制与 `../01-fundamentals/exception-filters.md` 的 HTTP 版一字不差，仅 `host` 用 `switchToWs()` 取上下文（见 `pipes-guards-interceptors.md`）。

---

## 三、与微服务异常对照

| 层 | 异常类 | 包 |
|---|---|---|
| HTTP | `HttpException` | `@nestjs/common` |
| 微服务 | `RpcException` | `@nestjs/microservices` |
| WebSocket | `WsException` | `@nestjs/websockets` |

三者过滤器机制相同，区别仅在异常类型与上下文（`switchToHttp`/`switchToRpc`/`switchToWs`）。

---

## 四、一句话总结

> WS 异常用 `WsException`（非 HttpException）；过滤器 `@Catch`+`catch` 同 HTTP 版，继承 `BaseWsExceptionFilter` 委托默认；绑定 `@UseFilters`（方法/网关级）。
