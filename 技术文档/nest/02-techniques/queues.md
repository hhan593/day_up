# NestJS 队列（Queues）技术详解

> 来源：https://docs.nestjs.cn/techniques/queues
> 作用：异步处理耗时任务、削峰填谷、跨服务可靠通信。基于 Redis 持久化。
> 两个包：`@nestjs/bullmq`（推荐，积极维护）/ `@nestjs/bull`（旧版，维护模式）。

---

## 一、安装

```bash
# BullMQ（推荐）
npm install --save @nestjs/bullmq bullmq
# Bull（旧版）
npm install --save @nestjs/bull bull
```
- 所有作业持久化在 **Redis**，支持分布式。

**对比**：
- 类似 **Ruby Sidekiq**、**Python Celery**、**Java Spring @Async + RabbitMQ**，都是"把任务丢进队列，worker 慢慢消费"。

---

## 二、BullModule 配置

### BullMQ 根配置
```ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } })],
})
export class AppModule {}
```

### 注册队列（按 name 作为注入令牌）
```ts
BullModule.registerQueue({ name: 'audio' });
```

### 多 Redis 实例（命名配置）
```ts
BullModule.forRoot('alternative-config', { connection: { port: 6381 } });
BullModule.registerQueue({ configKey: 'alternative-config', name: 'video' });
```

---

## 三、生产者（添加 Job）

```ts
@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}

  async add() {
    const job = await this.audioQueue.add('transcode', { foo: 'bar' });
    await this.audioQueue.add('transcode', { foo: 'bar' }, {
      delay: 3000, priority: 2, lifo: true,
    });
  }
}
```
- Job 选项：`priority`、`delay`、`attempts`、`repeat`、`backoff`、`lifo`、`jobId`、`removeOnComplete`、`removeOnFail`。

---

## 四、消费者（Processor）

### BullMQ（@Processor + WorkerHost）
```ts
@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job) {
    switch (job.name) {
      case 'transcode':
        await job.updateProgress(50);
        return {};
    }
  }
}
```
- 消费者须注册为 provider。
- 请求作用域：`@Processor({ name: 'audio', scope: Scope.REQUEST })`，可注入 `JOB_REF`。

### Bull（旧版，@Process）
```ts
@Processor('audio')
export class AudioConsumer {
  @Process('transcode')
  async transcode(job: Job) { /* ... */ }
}
```

---

## 五、事件监听

### BullMQ
- Worker 级：`@OnWorkerEvent('active')`（在 `@Processor` 类内）
- Queue 级：
```ts
@QueueEventsListener('audio')
export class AudioEventsListener extends QueueEventsHost {
  @OnQueueEvent('active') onActive(job) { console.log(job.jobId); }
}
```

### Bull（旧版）
- `@OnQueueActive()` / `@OnGlobalQueueCompleted()` 等装饰器。

---

## 六、队列管理 / 单独进程 / 异步配置

```ts
await audioQueue.pause();
await audioQueue.resume();
```
- 单独进程（沙箱化）：`BullModule.registerQueue({ name: 'audio', processors: [join(__dirname, 'processor.js')] })`
- 异步配置：`BullModule.forRootAsync({ imports: [ConfigModule], useFactory: (cfg) => ({ connection: { host: cfg.get('QUEUE_HOST') } }), inject: [ConfigService] })`

---

## 七、最佳实践

1. 耗时任务（发邮件、转码、导出）一律丢队列，别阻塞 HTTP 请求。
2. 用 `attempts` + `backoff` 做失败重试。
3. 多 worker 进程可水平扩展消费能力。

> 口诀：**"Queue 当邮箱，add 是寄信；Processor 收件，Event 知状态；Redis 来保命，重试靠 backoff。"**
