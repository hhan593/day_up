# Recipes - 队列（Queues / Bull）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/queues`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第十章。队列把"耗时任务"异步化（发邮件、图片处理、第三方回调），基于 Bull + Redis。

## 一、安装

```bash
npm i @nestjs/bull bull
npm i -D @types/bull
# Redis 必装（Bull 依赖）
```

## 二、注册 BullModule

```ts
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'audio' }),  // 队列名
  ],
})
export class AppModule {}
```

- 异步：`registerQueue({ name: 'audio', redis: { host, port } })` 或 `registerQueueAsync` 接 ConfigModule。

## 三、生产者（入队）

```ts
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}

  async addJob(data: any) {
    await this.audioQueue.add('transcode', data, {
      delay: 1000,        // 延迟
      attempts: 3,        // 失败重试次数
      removeOnComplete: true,
    });
  }
}
```

- `add(jobName, data, opts)` 把任务推入 Redis。
- 支持优先级、延迟、重试、去重等。

## 四、消费者（Processor）

```ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')            // 监听 'audio' 队列
export class AudioConsumer {
  @Process('transcode')        // 处理名为 'transcode' 的任务
  async transcode(job: Job) {
    const { data } = job;
    // 处理逻辑...
    await job.progress(50);    // 上报进度
    return { done: true };
  }
}
```

- `@Processor('queueName')` + `@Process('jobName')` 定义消费者。
- 可 `@Process({ name: 'x', concurrency: 5 })` 并发消费。

## 五、事件监听

```ts
@Processor('audio')
export class AudioConsumer {
  @OnQueueCompleted()
  onCompleted(job: Job, result: any) { console.log('done', result); }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) { console.error('fail', err); }
}
```

## 六、要点

| 关注点 | 做法 |
|--------|------|
| 注册队列 | `BullModule.registerQueue({ name })` |
| 入队 | `@InjectQueue(name)` + `queue.add` |
| 消费 | `@Processor(name)` + `@Process(jobName)` |
| 可靠性 | `attempts` 重试、`@OnQueueFailed` 兜底 |
| 依赖 | Redis |

> 跨框架对比：Spring 的 `@EnableScheduling` + RabbitMQ `Listener`、Laravel 的 Queue（`dispatch`/`handle`）、Node 原生 `bull`——Nest 的 `@Processor/@Process` 最接近 Laravel Job 风格，且接 DI。

## 下一篇

→ `sse.md`：服务端推送（Server-Sent Events）。
