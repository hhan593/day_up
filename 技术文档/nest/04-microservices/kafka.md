# NestJS Kafka 微服务

> 来源：[NestJS 中文文档 · 微服务 > Kafka](https://docs.nestjs.cn/microservices/kafka)
> Kafka 是持久化、分区、消费组的事件流平台，适合高可靠消息。注意客户端用 `ClientKafkaProxy` 且有回复主题机制。

---

## 一、Kafka 是什么？（通俗对比）

把 TCP 微服务的"点对点暗号"换成"写进一个**持久化的主题日志**"——消息不丢、可重放、多个消费者组各读各的。

**对比其他框架**：
- **Spring Kafka**：`@KafkaListener` + `KafkaTemplate`——Nest 用 `@EventPattern`/`@MessagePattern` + `ClientKafkaProxy`，概念对应。
- **Node 原生 kafkajs**：Nest 在其上套了装饰器抽象，省去手写 `consumer.subscribe/run`。

---

## 二、服务端配置

```ts
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.KAFKA,
  options: {
    client: { clientId: 'hero', brokers: ['localhost:9092'] },
    consumer: { groupId: 'hero-consumer' },
    run: { autoCommit: false },        // 禁用自动提交，手动控制
  },
});
```

`options` 字段：
| 字段 | 说明 |
|---|---|
| `client` | Kafka 客户端（clientId、brokers） |
| `consumer` | 消费者（groupId） |
| `run` | 运行配置（autoCommit 等） |
| `subscribe` | 订阅配置 |
| `producer` | 生产者配置 |
| `send` | 发送配置 |
| `producerOnlyMode` | 仅生产者（boolean） |
| `postfixId` | 改 clientId 后缀 |

> ⚠️ 客户端 `clientId` 和 `consumer.groupId` 会自动附 `-client` 后缀，服务端附 `-server`，避免冲突。

---

## 三、客户端用 `ClientKafkaProxy`

```ts
import { ClientKafkaProxy } from '@nestjs/microservices';

@Injectable()
export class HeroService {
  constructor(@Inject('HERO_SERVICE') private client: ClientKafkaProxy) {}

  onModuleInit() {
    // 请求-响应必须订阅回复主题（默认 '主题.reply'）
    this.client.subscribeToResponseOf('hero.kill.dragon');
  }

  killDragon(): Observable<any> {
    return this.client.send('hero.kill.dragon', { heroId: 1 });
  }

  notify(): void {
    this.client.emit('user.created', { id: 1 });  // 事件，无需订阅回复
  }
}
```

---

## 四、请求-响应：`@MessagePattern`

```ts
import { MessagePattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';

@MessagePattern('hero.kill.dragon')
killDragon(@Payload() message: any, @Ctx() context: KafkaContext) {
  const key = context.getMessage().key?.toString();  // 分区 key
  return { value: items };   // 响应到 'hero.kill.dragon.reply'
}
```

- 传出可带 `key`（控制分区）、`value`、`headers`（string/Buffer）。
- 客户端须先 `subscribeToResponseOf('主题')`。

---

## 五、事件驱动：`@EventPattern`

```ts
@EventPattern('user.created')
async handleUserCreated(@Payload() data: any, @Ctx() context: KafkaContext) {
  const consumer = context.getConsumer();
  // 手动提交偏移量（autoCommit:false 时）
  await consumer.commitOffsets([{ topic, partition, offset }]);
}
```

> 基于事件的处理中，未处理异常默认视为可重试（可用 `KafkaRetriableException` 或自定义过滤器控制）。

---

## 六、上下文与偏移量

`KafkaContext` 提供：
- `getMessage()`：原生消息（含 key/value/headers/offset）
- `getTopic()`：主题名
- `getPartition()`：分区
- `getConsumer()`：原生 kafkajs consumer（手动提交偏移）

---

## 七、坑 & 最佳实践

1. **`subscribeToResponseOf` 必调**：请求-响应模式忘了订阅回复主题，永远收不到响应。
2. **偏移量提交**：`autoCommit: false` 时要手动 `commitOffsets`，否则消息重复消费。
3. **clientId 后缀**：`-client`/`-server` 自动附加，配 broker ACL 时注意。
4. **事件 vs 请求-响应**：纯事件流用 `@EventPattern`（省双主题开销）。

---

## 八、一句话总结

> Kafka 用 `Transport.KAFKA` + `ClientKafkaProxy`；`@MessagePattern`+`send`（先 `subscribeToResponseOf` 回复主题）做请求-响应，`@EventPattern`+`emit` 做事件；`KafkaContext` 取分区/偏移/消费者，可手动提交。
