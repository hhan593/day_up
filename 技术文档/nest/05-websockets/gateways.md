# NestJS WebSocket 网关（Gateways）

> 来源：[NestJS 中文文档 · WebSocket > 网关](https://docs.nestjs.cn/websockets/gateways)
> 网关（Gateway）是处理 WebSocket 的"控制器"——用装饰器声明消息订阅，底层兼容 socket.io / ws。

---

## 一、网关是什么？（通俗对比）

HTTP 控制器接收"请求-响应"；网关接收"**双向实时消息**"——客户端连上后，服务端能主动推送（不像 HTTP 要等请求）。

**对比其他框架**：
- **socket.io 原生**：`io.on('connection', socket => socket.on('events', ...))`——Nest 用 `@WebSocketGateway` + `@SubscribeMessage` 把回调变成"类方法"，享 DI、守卫、管道。
- **Spring WebSocket (@MessageMapping)**：`@Controller` + `@MessageMapping('/topic')` 思路几乎一致，Nest 的 `@SubscribeMessage` ≈ `@MessageMapping`。
- **原生 ws 库（Node）**：`new WebSocketServer` 手动管理连接——Nest 网关自动注入、自动生命周期。

---

## 二、安装

```bash
npm i --save @nestjs/websockets @nestjs/platform-socket.io
```
> 用 `ws` 库则装 `@nestjs/platform-ws`（语法稍不同，本文以 socket.io 为主）。

---

## 三、定义网关

```ts
import { WebSocketGateway, WebSocketServer, SubscribeMessage,
         MessageBody, ConnectedSocket, OnGatewayInit, OnGatewayConnection,
         OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()                         // 默认与 HTTP 同端口
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()                        // 注入原生 server 实例
  server: Server;

  afterInit(server: Server) { /* 初始化 */ }

  handleConnection(client: Socket) { /* 客户端连上 */ }

  handleDisconnect(client: Socket) { /* 客户端断开 */ }

  @SubscribeMessage('events')               // 订阅 'events' 消息
  handleEvent(@MessageBody() data: string): string {
    return data;                            // 回给发送者（确认式一次）
  }
}
```

> 网关是 **Provider**，支持 DI，也能被别的类注入；**必须注册进模块的 `providers`** 才会实例化。

---

## 四、配置：端口 / 命名空间 / 选项

```ts
@WebSocketGateway(80)                              // 指定端口
@WebSocketGateway(80, { namespace: 'events' })    // 命名空间
@WebSocketGateway(81, { transports: ['websocket'] })  // socket 构造选项
```
> 第二个参数是传给底层 socket.io 的选项（如 `cors`、`transports`）。

---

## 五、处理消息的装饰器

| 装饰器 | 提取 | 等价于 |
|---|---|---|
| `@MessageBody()` | 消息负载 | socket.io 的 `data` |
| `@ConnectedSocket()` | 当前 socket 实例 | `socket` |
| `@Ack()` | 确认回调 | socket.io 的 `ack` 第三参 |
| `@MessageHeaders()` | 头（ws 库特有） | — |

```ts
@SubscribeMessage('events')
handleEvent(
  @ConnectedSocket() client: Socket,
  @MessageBody() data: string,
): WsResponse<string> {
  return { event: 'events', data };   // WsResponse 形态
}
```
> 不推荐手写 `(client, data) =>` 形式（单测需 mock socket）；装饰器写法可单测。

---

## 六、多种响应形态

### 6.1 单响应（确认式）
`return data` 仅回一次给发送者（socket.io 的 ack）。原生 `ws` 不支持 ack，用 `WsResponse` 规避。

### 6.2 多事件（WsResponse）
返回 `{ event, data }` 对象，客户端 `socket.on('events', ...)` 监听：

```ts
@SubscribeMessage('events')
handleEvent(@MessageBody() data: string): WsResponse<string> {
  return { event: 'events', data };
}
```

### 6.3 异步 / 流（Observable）
返回 `Promise` 或 `Observable`，可从数组流式发射多个事件：

```ts
@SubscribeMessage('events')
handleEvent(@MessageBody() data: string): Observable<WsResponse<string>> {
  return from([1, 2, 3]).pipe(
    map(item => ({ event: 'events', data: `msg ${item}` })),
  );
}
```
> ⚠️ 若用 `ClassSerializerInterceptor` 且依赖 `data`，应返回实现 `WsResponse` 的**类实例**而非纯对象。

---

## 七、生命周期钩子

| 接口 | 方法 | 触发 |
|---|---|---|
| `OnGatewayInit` | `afterInit(server)` | 网关初始化后 |
| `OnGatewayConnection` | `handleConnection(client)` | 客户端连接 |
| `OnGatewayDisconnect` | `handleDisconnect(client)` | 客户端断开 |

---

## 八、主动推送 `@WebSocketServer`

用注入的 `server` 向所有/部分客户端推消息：

```ts
@WebSocketServer()
server: Server;

broadcast() {
  this.server.emit('news', { msg: 'hello all' });     // 广播
  this.server.to('room1').emit('news', { msg: 'x' }); // 房间
}
```

---

## 九、命名空间与房间

- `namespace`：逻辑隔离的通道（`@WebSocketGateway({ namespace: 'events' })`）。
- 房间：`socket.join('room1')` 后 `server.to('room1').emit(...)` 定向推。

---

## 十、坑 & 最佳实践

1. **注册进 providers**：忘了 `providers: [EventsGateway]` 网关不启动。
2. **ws 库无 ack**：用 `WsResponse` 对象返回事件，别依赖 `return` 确认。
3. **序列化**：配合 `ClassSerializerInterceptor`（见 `../02-techniques/serialization.md`）返回 `WsResponse` 类实例。
4. **鉴权**：连接鉴权在 `handleConnection` 或升级握手阶段做（见 `auth` 章节 / `../03-security`）。

---

## 十一、一句话总结

> 网关 = `@WebSocketGateway()` + `@SubscribeMessage('事件')` 类（Provider，需注册）；`@MessageBody`/`@ConnectedSocket`/`@Ack` 取参数；`return`/`WsResponse`/`Observable` 响应；`@WebSocketServer` 主动推送；生命周期 `OnGatewayInit/Connection/Disconnect`。
