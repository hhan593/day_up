# NestJS 微服务（Microservices）概述与基础

> 来源：[NestJS 中文文档 · 微服务](https://docs.nestjs.cn/microservices)、[微服务 > 基础](https://docs.nestjs.cn/microservices/basics)
> 微服务是"用非 HTTP 传输层通信的 Nest 应用"。本文讲清核心概念、两种消息风格、客户端调用。

---

## 一、微服务是什么？（通俗对比）

普通 Nest 应用用 **HTTP**（浏览器/前端调）。微服务用 **TCP/Redis/Kafka/gRPC** 等传输层，让服务之间互相调用——像公司**内部专线电话**（微服务间），对外的还是前台总机（HTTP）。

**对比其他框架/生态**：
- **Spring Cloud / gRPC（Java）**：`RestTemplate`/`Feign` 走 HTTP，`gRPC` 走 protobuf——Nest 用 `ClientProxy.send/emit` 统一抽象，换传输层不改业务代码。
- **Go micro / go-kit**：也是"传输层可插拔"思路；Nest 借 TS 装饰器把消息模式写成 `@MessagePattern`。
- **消息队列（RabbitMQ/Kafka）单独用**：Nest 把"消息队列消费者"包装成标准 Nest 控制器 + 装饰器，和写 HTTP 控制器一样舒服。

---

## 二、两种消息风格

| 风格 | 装饰器 | 客户端方法 | 是否需要响应 |
|---|---|---|---|
| 请求-响应 | `@MessagePattern()` | `client.send()` | 是（像 RPC） |
| 事件驱动 | `@EventPattern()` | `client.emit()` | 否（发布即忘） |

---

## 三、创建微服务（服务端）

```ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.TCP,      // 默认传输层
});
await app.listen();              // 微服务用 listen() 而非 listen(3000)
```

> 与 HTTP 应用的区别：`createMicroservice` 而非 `create`，`listen()` 无端口。

---

## 四、请求-响应：`@MessagePattern`

```ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';

@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })        // 模式匹配
  accumulate(data: number[]): number {
    return (data || []).reduce((a, b) => a + b, 0);
  }

  @MessagePattern({ cmd: 'sum' })
  async accumulateAsync(@Payload() data: number[]) {  // 支持 async
    return data.reduce((a, b) => a + b, 0);
  }
}
```
- 模式（pattern）是普通值（字符串或对象），自动随消息序列化。
- 可返回同步值 / `Promise` / `Observable`。
- `@Payload()` 取数据、`@Ctx()` 取上下文（如 `NatsContext`）。

---

## 五、事件驱动：`@EventPattern`

```ts
import { EventPattern } from '@nestjs/microservices';

@EventPattern('user_created')
async handleUserCreated(@Payload() data: Record<string, unknown>) {
  // 业务逻辑
}
```
> 同一事件模式可注册**多个**处理程序，自动并行触发。适合"下单后发邮件+更新统计"这类。

---

## 六、客户端：`ClientProxy` 与 `send/emit`

微服务（生产者）通过 `ClientProxy` 调别的微服务：

```ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      { name: 'MATH_SERVICE', transport: Transport.TCP, options: { host: 'localhost', port: 8888 } },
    ]),
  ],
})
export class AppModule {}
```

```ts
@Injectable()
export class MathService {
  constructor(@Inject('MATH_SERVICE') private client: ClientProxy) {}

  accumulate(): Observable<number> {
    return this.client.send<number>({ cmd: 'sum' }, [1, 2, 3]);  // 请求-响应
  }

  publish(): void {
    this.client.emit<number>('user_created', { id: 1 });         // 事件
  }
}
```

关键差异：
- **`send()` 返回冷 Observable**：必须订阅才真正发送（`await lastValueFrom(this.client.send(...))` 转 Promise）。
- **`emit()` 返回热 Observable**：立即尝试传递，无需订阅。
- 超时：`this.client.send(...).pipe(timeout(5000))`。
- `ClientsModule.registerAsync()` 异步配置（配合 `ConfigService`，见 `../01-fundamentals/dynamic-modules.md`）。
- `ClientProxyFactory.create()` / `@Client()` 装饰器也可创建（非首选）。

---

## 七、TCP 传输器选项

```ts
{
  transport: Transport.TCP,
  options: {
    host: 'localhost',
    port: 8888,
    retryAttempts: 5,        // 重试次数
    retryDelay: 3000,        // 重试间隔(ms)
    tlsOptions: { ca: fs.readFileSync('ca.crt') },  // TLS 加密
    serializer, deserializer, // 自定义序列化
  },
}
```
> TLS 可让 TCP 传输加密通信（`options.tlsOptions.{ key, cert }` 服务端；`ca` 客户端）。

---

## 八、执行上下文（与基础章节衔接）

微服务下的守卫/拦截器/异常过滤器用 `ExecutionContext` 的 `switchToRpc()` 取上下文（见 `../01-fundamentals/execution-context.md`）。`@Ctx()` 在处理器内取具体上下文（如 `KafkaContext`、`NatsContext`）。

---

## 九、坑 & 最佳实践

1. **别在微服务抛 `HttpException`**：应抛 `RpcException`（见 `exception-filters.md`）。
2. **`send` 是冷 Observable**：忘了订阅消息不发出（用 `lastValueFrom` 转 Promise 最省心）。
3. **混合应用**：HTTP 与微服务同进程见 `hybrid-application.md`。
4. **传输层可插拔**：业务代码只写 `@MessagePattern`，换 Redis/Kafka 只改 `transport` 和选项。

---

## 十、一句话总结

> 微服务 = `createMicroservice` + 非 HTTP 传输层；`@MessagePattern`+`send()` 做请求-响应，`@EventPattern`+`emit()` 做事件；客户端用 `ClientsModule.register` + `ClientProxy`；传输层（TCP/Redis/Kafka/gRPC）可随时切换。
