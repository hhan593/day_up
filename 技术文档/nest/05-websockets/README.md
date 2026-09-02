# 05 - NestJS WebSocket（实时双向通信）

> 来源：NestJS 中文文档 WebSocket 章节（[docs.nestjs.cn/websockets](https://docs.nestjs.cn/websockets/gateways)）
> 网关 = WS 版"控制器"。用装饰器声明消息订阅，兼容 socket.io / ws，享 DI、守卫、管道、拦截器。

---

## 一、文档清单

| 文档 | 主题 | 对应官方页 |
|---|---|---|
| [gateways.md](./gateways.md) | 网关：@WebSocketGateway、@SubscribeMessage、装饰器、响应形态、生命周期、@WebSocketServer | /websockets/gateways |
| [exception-filters.md](./exception-filters.md) | WS 异常：WsException、BaseWsExceptionFilter | /websockets/exception-filters |
| [pipes-guards-interceptors.md](./pipes-guards-interceptors.md) | WS 下管道/守卫/拦截器：与 HTTP 一致，仅 WsException + switchToWs | /websockets/pipes、/guards、/interceptors |
| [middleware-adapters.md](./middleware-adapters.md) | 网关中间件（连接鉴权）+ 自定义适配器 | /websockets/gateways（中间件线索）+ 标准实践 |

---

## 二、核心概念图

```
客户端 ──连接──> 网关 @WebSocketGateway (Provider, 注册进 providers)
                    ├─ OnGatewayConnection/Disconnect（连接钩子）
                    ├─ @SubscribeMessage('事件')
                    │     ├─ @MessageBody() 负载
                    │     ├─ @ConnectedSocket() socket
                    │     ├─ @Ack() 确认回调
                    │     └─ 守卫(@UseGuards) → 管道(@UsePipes) → 方法 → 拦截器(@UseInterceptors)
                    └─ @WebSocketServer() server → 主动 emit 推送

响应形态：return(确认一次) / WsResponse{event,data} / Observable(流式)
异常：WsException（非 HttpException）
```

---

## 三、与基础章节衔接（跨目录）

| WS 知识点 | 基础章节 |
|---|---|
| `@SubscribeMessage` ≈ 控制器路由 | `../01-fundamentals/controllers.md` |
| 管道/守卫/拦截器机制复用 | `../01-fundamentals/pipes.md`、`guards.md`、`interceptors.md` |
| `switchToWs()` 上下文 | `../01-fundamentals/execution-context.md` |
| 异常过滤器机制复用 | `../01-fundamentals/exception-filters.md` |
| `@WebSocketServer` 注入 | `../01-fundamentals/providers.md`（DI） |
| 装饰器原理 | `../01-fundamentals/custom-decorators.md` |

---

## 四、与 02/03 章节衔接

- **02-techniques**：`serialization.md`（`ClassSerializerInterceptor` 配 WS，`WsResponse` 类实例）、`events.md`（网关内用事件解耦）、`sse.md`（单向流式 vs WS 双向对照）
- **03-security**：`authentication.md`（socket 握手鉴权）、`authorization.md`（网关消息级角色授权）、`cors.md`（WS 跨域）

---

## 五、三种传输层异常对照

| 层 | 异常类 | 上下文 |
|---|---|---|
| HTTP | `HttpException` | `switchToHttp` |
| 微服务 | `RpcException` | `switchToRpc` |
| WebSocket | `WsException` | `switchToWs` |

过滤器机制一致，仅异常类型不同。

---

## 六、坑速查

1. 网关必须注册进 `providers` 才实例化
2. WS 抛 `WsException`，别用 `HttpException`
3. `ws` 库无 ack：用 `WsResponse` 而非 `return` 确认
4. 连接鉴权用 `server.use()` 中间件或 `handleConnection`
5. 管道只作用于 `data` 参数
6. 主动推送用 `@WebSocketServer()` 注入的 `server.emit`

---

## 七、学习顺序建议

```
gateways（核心）→ exception-filters（错误处理）
  → pipes-guards-interceptors（复用基础章节）
  → middleware-adapters（连接鉴权 + 适配器进阶）
```
