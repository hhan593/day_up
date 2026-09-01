# NestJS 微服务传输器速查（Transporters）

> 来源：[NestJS 中文文档 · 微服务 > Redis/Kafka/gRPC 等](https://docs.nestjs.cn/microservices)、[基础](https://docs.nestjs.cn/microservices/basics)
> 一张表掌握各传输层怎么配、何时用。详细专篇见 grpc.md / kafka.md。

---

## 一、传输器总览

| 传输层 | `Transport` 枚举 | 底层 | 适合场景 | 消息语义 |
|---|---|---|---|---|
| TCP | `Transport.TCP` | net.Socket | 简单内部 RPC、默认 | 请求-响应 / 事件 |
| Redis | `Transport.REDIS` | ioredis Pub/Sub | 轻量发布订阅 | 即发即弃（无订阅者丢） |
| NATS | `Transport.NATS` | nats | 高吞吐消息 | 请求-响应 / 事件 |
| MQTT | `Transport.MQTT` | mqtt | IoT、边缘 | 发布订阅 |
| Kafka | `Transport.KAFKA` | kafkajs | 日志/事件流、强持久 | 主题分区、消费组 |
| gRPC | `Transport.GRPC` | @grpc/grpc-js | 强类型跨语言 RPC | proto 定义、流式 |
| RabbitMQ | `Transport.RMQ` | amqplib | 企业消息队列 | 队列、路由键 |
| Custom | `Transport.NATS` 改 / 自定义 | 自实现 | 特殊需求 | 自定 |

> 安装：`npm i @nestjs/microservices`（核心），各传输器还需对应底层包（如 Redis 需 `ioredis`、`kafkajs`、`@grpc/grpc-js` 等，Nest 通常已作为依赖带入或需单独装）。

---

## 二、TCP（默认）

```ts
{ transport: Transport.TCP, options: { host: 'localhost', port: 8888, retryAttempts: 5, retryDelay: 3000 } }
```

---

## 三、Redis（Pub/Sub）

```ts
{ transport: Transport.REDIS, options: { host: 'localhost', port: 6379, wildcards: true } }
```
- 基于 Redis 发布订阅；无订阅者时消息**丢失**（不持久）。
- `wildcards: true` 启用通配符订阅。
- 混合应用 `unwrap()` 可得 `[pub, sub]` 两个 ioredis 实例。

---

## 四、NATS

```ts
{ transport: Transport.NATS, options: { url: 'nats://localhost:4222' } }
```
- `@Ctx()` 取 `NatsContext`，可获 `subject`。
- 支持通配符主题。

---

## 五、MQTT

```ts
{ transport: Transport.MQTT, options: { url: 'mqtt://localhost:1883' } }
```

---

## 六、Kafka（详见 kafka.md）

```ts
{
  transport: Transport.KAFKA,
  options: {
    client: { clientId: 'hero', brokers: ['localhost:9092'] },
    consumer: { groupId: 'hero-consumer' },
    run: { autoCommit: false },
  },
}
```
- 用 `ClientKafkaProxy`（非普通 `ClientProxy`）。
- 请求-响应默认回复主题：`主题名.reply`，发送前 `subscribeToResponseOf('主题')`。

---

## 七、gRPC（详见 grpc.md）

```ts
{
  transport: Transport.GRPC,
  options: { package: 'hero', protoPath: join(__dirname, 'hero.proto') },
}
```
- **不用 `@MessagePattern`**，改用 `@GrpcMethod('Service', 'Method')`。
- 需 `.proto` 文件 + `nest-cli.json` 配 `assets: ['**/*.proto']`。

---

## 八、自定义序列化 / 反序列化

所有传输器支持 `serializer` / `deserializer` 自定义消息编解码（如换 JSON 为 MessagePack）。

---

## 九、选型建议

| 需求 | 选 |
|---|---|
| 快速内部 RPC，无额外中间件 | TCP |
| 已有 Redis，轻量广播 | Redis |
| 高吞吐、需持久/重放 | Kafka |
| 强类型跨语言契约 | gRPC |
| IoT / 边缘设备 | MQTT |
| 企业级队列路由 | RabbitMQ |

---

## 十、一句话总结

> 传输器 = 改 `transport` 枚举 + `options`；TCP 默认、Redis 轻量广播、Kafka 持久事件流、gRPC 强类型 proto；业务层仍用 `@MessagePattern`/`@EventPattern`（gRPC 除外）。
