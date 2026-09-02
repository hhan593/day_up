# NestJS WebSocket 中间件与自定义适配器

> 来源：[NestJS 中文文档 · WebSocket](https://docs.nestjs.cn/websockets/gateways)（网关级中间件线索）+ 标准实践补充
> WebSocket 支持在网关上挂中间件（如鉴权、日志），也支持自定义传输适配器切换底层库。

---

## 一、网关级中间件

socket.io 中间件是**连接级**的（所有连接都过），在 `afterInit` 里用 `server.use()` 挂：

```ts
@WebSocketGateway()
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    server.use((socket, next) => {
      // 鉴权：读握手 token
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      next();   // 必须调用，否则连接挂起
    });
  }
}
```

> 与 HTTP 中间件（`req/res/next`）不同，socket 中间件签名是 `(socket, next)`——没有 `response`。
> 也可在 `handleConnection` 里做鉴权（见 `gateways.md`），两者择一。

**对比**：HTTP 中间件在路由前、`configure()` 里配；WS 中间件在 `afterInit` 用 `server.use()`——平台 API 不同，但"连接前统一处理"的意图一致。

---

## 二、中间件 vs 守卫（WS）

| | 中间件（server.use） | 守卫（@UseGuards） |
|---|---|---|
| 粒度 | 整个连接 | 单个 @SubscribeMessage 消息 |
| 取上下文 | `socket`（握手） | `ExecutionContext` → switchToWs |
| 适合 | 连接鉴权、连接日志 | 消息级权限、角色 |

> 连接级统一鉴权用中间件；消息级细粒度授权用守卫（见 `pipes-guards-interceptors.md`）。

---

## 三、自定义适配器（WebSocketAdapter）

Nest 抽象了 WS 传输层，可写适配器接入任意库（或改造 socket.io 行为）。需实现 `WebSocketAdapter` 接口：

```ts
import { WebSocketAdapter, MessageMappingProperties } from '@nestjs/websockets';
import { INestApplicationContext } from '@nestjs/common';

export class MyAdapter implements WebSocketAdapter {
  constructor(private app: INestApplicationContext) {}

  create(port: number, options?: any): any { /* 创建底层 server */ }
  bindClientConnect(server: any, callback: (...args: any[]) => void) { /* 连接事件 */ }
  bindMessageHandlers(server: any, handlers: MessageMappingProperties[], transformers: any[]) { /* 消息分发 */ }
  close(server: any): any { /* 关闭 */ }
}
```
> 适配器是进阶用法，多数项目用内置 socket.io / ws 适配器即可，无需自写。

**切换到 ws 库**：安装 `@nestjs/platform-ws` 后，`NestFactory.create` 用 `ws` 适配器，或在 `main.ts` 用 `app.useWebSocketAdapter(new WsAdapter())`。

---

## 四、平台差异（socket.io vs ws）

| | socket.io | ws（原生） |
|---|---|---|
| 装饰器 | 全套一致 | 一致，但无 ack 确认 |
| 房间/命名空间 | 原生支持 | 需自实现 |
| `@Ack()` | 支持 | 不支持（用 WsResponse 规避） |
| 体积 | 较重 | 轻 |

> 选 socket.io 开箱即用（房间、重连、命名空间）；选 ws 追求轻量。

---

## 五、坑 & 最佳实践

1. **中间件忘了 `next()`**：连接挂起。
2. **握手鉴权用中间件**：连接前拦截，比在消息里鉴权更早。
3. **ws 库无 ack**：别依赖 `@SubscribeMessage` 的 `return` 确认，用 `WsResponse` 事件。

---

## 六、一句话总结

> WS 网关级中间件用 `afterInit` 里 `server.use((socket, next) => ...)`（连接级，无 response）；自定义适配器实现 `WebSocketAdapter` 接口可换底层库；socket.io 功能全、ws 轻量。
