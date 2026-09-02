# NestJS WebSocket 下的管道 / 守卫 / 拦截器

> 来源：[NestJS 中文文档 · WebSocket > 管道/守卫/拦截器](https://docs.nestjs.cn/websockets/pipes、/guards、/interceptors)
> 文档明确：WS 下的管道、守卫、拦截器与 HTTP 版**机制完全一致**，唯一区别是异常类型用 `WsException`。

---

## 一、统一结论：与 HTTP 无差异

官方原文：
- 管道："与 Web 管道无本质区别，唯一在于抛出 `WsException` 而非 `HttpException`。"
- 拦截器："There is no difference between regular interceptors and web sockets interceptors."
- 守卫：同样 `@UseGuards` 绑定，区别在抛 `WsException`。

所以你学的 `../01-fundamentals` 里 pipes/guards/interceptors **直接复用**，只需记住两点：
1. 抛异常用 `WsException`
2. 拿上下文用 `context.switchToWs()`

---

## 二、管道（Pipes）

```ts
import { UsePipes } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

@UsePipes(new ValidationPipe())       // 网关级
@WebSocketGateway()
export class EventsGateway {
  @SubscribeMessage('events')
  @UsePipes(new ValidationPipe())     // 方法级（装饰器类方式最稳）
  handleEvent(@MessageBody() data: CreateEventDto) {
    return { event: 'events', data };
  }
}
```

- 所有管道**只作用于 `data`参数**（验证/转换 `client` 实例无用）。
- `ValidationPipe` 复用 class-validator（见 `../02-techniques/validation.md`）；DTO 必须 class。

---

## 三、守卫（Guards）—— 网关鉴权

```ts
import { UseGuards } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient();  // 取 socket
    const token = client.handshake.auth?.token;
    if (!validate(token)) throw new WsException('Unauthorized');  // 抛 WsException
    return true;
  }
}
```

```ts
@UseGuards(WsAuthGuard)              // 网关级或方法级
@SubscribeMessage('events')
handleEvent(@MessageBody() data) { /* ... */ }
```

> ⚠️ 文档页未展开 `canActivate`/`switchToWs` 完整示例，上例为基于 WS 上下文的标准实践（与 `../01-fundamentals/guards.md` 的 Reflector 角色授权可组合）。
> 连接级鉴权（握手阶段）也可在 `handleConnection` 里做（见 `gateways.md`）。

---

## 四、拦截器（Interceptors）

与 `../01-fundamentals/interceptors.md` 完全一致：`intercept(ctx, next)` 返回 Observable，用 `map` 做响应映射、`tap` 日志。

```ts
@UseInterceptors(new TransformInterceptor())
@SubscribeMessage('events')
handleEvent(@MessageBody() data): WsResponse<string> {
  return { event: 'events', data };
}
```

> 注意：`map` 响应映射作用于返回的 `Observable`；WS 多事件用 `WsResponse`，映射时保持 `{ event, data }` 形态。

---

## 五、WS 执行上下文 `switchToWs()`

```ts
const ctx = host.switchToWs();
const client = ctx.getClient();      // socket 实例
const data = ctx.getData();          // 消息负载
const pattern = ctx.getPattern();    // 订阅的消息模式
```

> 这是守卫/拦截器在 WS 下取参数的方式，对应 `../01-fundamentals/execution-context.md` 的跨平台切换（HTTP→`switchToHttp`，微服务→`switchToRpc`，WS→`switchToWs`）。

---

## 六、一句话总结

> WS 下管道/守卫/拦截器复用 HTTP 版实现，仅异常用 `WsException`、上下文用 `switchToWs()`（getClient/getData/getPattern）；绑定装饰器 `@UsePipes/@UseGuards/@UseInterceptors` 完全一致。
