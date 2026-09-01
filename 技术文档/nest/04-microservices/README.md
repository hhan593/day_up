# 04 - NestJS 微服务（Microservices）

> 来源：NestJS 中文文档微服务章节（[docs.nestjs.cn/microservices](https://docs.nestjs.cn/microservices)）
> 微服务 = 用非 HTTP 传输层（TCP/Redis/Kafka/gRPC...）通信的 Nest 应用。核心是"传输层可插拔 + 装饰器声明消息模式"。

---

## 一、文档清单

| 文档 | 主题 | 对应官方页 |
|---|---|---|
| [overview.md](./overview.md) | 概述 + 基础：传输器、@MessagePattern/@EventPattern、ClientProxy、send/emit | /microservices、/microservices/basics |
| [exception-filters.md](./exception-filters.md) | 微服务异常：RpcException、返回 Observable | /microservices/exception-filters |
| [transporters.md](./transporters.md) | 传输器速查：TCP/Redis/NATS/MQTT/Kafka/gRPC 选型 | /microservices（各子页） |
| [grpc.md](./grpc.md) | gRPC 专篇：proto、@GrpcMethod、ClientGrpc | /microservices/grpc |
| [kafka.md](./kafka.md) | Kafka 专篇：ClientKafkaProxy、消费组、偏移量 | /microservices/kafka |
| [hybrid-application.md](./hybrid-application.md) | 混合应用：connectMicroservice、同进程双口子 | /microservices（混合应用） |

---

## 二、核心概念图

```
HTTP 应用 (create)
   └─ connectMicroservice(TCP/Redis/Kafka/gRPC)   ← 混合应用（hybrid-application.md）
        └─ 微服务实例监听传输层

生产者（ClientProxy）
   ├─ send(pattern, data)  →  @MessagePattern  请求-响应（冷 Observable，需订阅）
   └─ emit(pattern, data)  →  @EventPattern    事件驱动（热 Observable，即发）

消费者（Controller）
   ├─ @MessagePattern / @GrpcMethod   处理请求
   └─ @EventPattern                   处理事件

异常：RpcException（非 HttpException）→ RpcExceptionFilter（返回 Observable）
```

---

## 三、两种消息风格

| | 请求-响应 | 事件驱动 |
|---|---|---|
| 服务端装饰器 | `@MessagePattern`（gRPC 用 `@GrpcMethod`） | `@EventPattern` |
| 客户端方法 | `client.send()` | `client.emit()` |
| 返回 | 冷 Observable（需订阅） | 热 Observable（即发） |
| 适用 | 要结果的调用 | 通知、广播 |

---

## 四、与基础章节衔接（跨目录）

| 微服务知识点 | 基础章节 |
|---|---|
| `send()` 冷 Observable 需订阅 | `../01-fundamentals/interceptors.md`（RxJS map/tap） |
| `ExecutionContext.switchToRpc()` | `../01-fundamentals/execution-context.md` |
| `@Payload`/`@Ctx` 装饰器原理 | `../01-fundamentals/custom-decorators.md` |
| 微服务异常过滤器机制 | `../01-fundamentals/exception-filters.md`（HTTP 版） |
| `ClientsModule.registerAsync` 异步配置 | `../01-fundamentals/dynamic-modules.md` |
| 混合应用生命周期 | `../01-fundamentals/lifecycle-events.md` |

---

## 五、与 02/03 章节衔接

- **02-techniques**：`queues.md`（BullMQ 队列）、`events.md`（内部事件解耦）、`http-module.md`（微服务对外 HTTP 调第三方）
- **03-security**：微服务间认证（mTLS via `tlsOptions`、token 在 payload 传）、`authorization.md`

---

## 六、坑速查

1. 微服务抛 `RpcException`，**别抛** `HttpException`
2. `send()` 是冷 Observable——用 `lastValueFrom()` 转 Promise 最稳妥
3. Kafka 请求-响应先 `subscribeToResponseOf('主题')`
4. gRPC 不用 `@MessagePattern`，用 `@GrpcMethod`
5. 混合应用要 `startAllMicroservices()`；全局微服务异常过滤器默认关
6. 换传输层只改 `transport` + `options`，业务代码不动

---

## 七、学习顺序建议

```
overview（基础）→ transporters（选型）→ grpc / kafka（专篇）
  → exception-filters（错误处理）→ hybrid-application（同进程部署）
```
