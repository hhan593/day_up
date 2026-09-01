# NestJS 任务调度（Task Scheduling）技术详解

> 来源：https://docs.nestjs.cn/techniques/task-scheduling
> 作用：在应用内定时/周期性执行任务（清理、通知、报表、心跳）。
> 基于 `@nestjs/schedule`（整合 Node `cron`）。

---

## 一、安装与初始化

```bash
npm install --save @nestjs/schedule
```
```ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({ imports: [ScheduleModule.forRoot()] })
export class AppModule {}
```
- 所有声明式任务在 `onApplicationBootstrap` 时自动注册。

**对比**：
- 类似 **Spring 的 `@Scheduled`**、**Node `node-cron`**，但 Nest 把任务注册进 DI 容器，可在任务里注入 Service。

---

## 二、声明式 Cron（@Cron）

```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() { this.logger.debug('second = 45'); }

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron2() { this.logger.debug('every 30s'); }

  @Cron('* * 0 * * *', { name: 'notifications', timeZone: 'Europe/Paris' })
  triggerNotifications() {}
}
```

- Cron 模式：`* * * * * *`（秒 分 时 日 月 周），支持 `*`、`1-3,5`、`*/2`。
- 选项：`name`（动态控制用）、`timeZone`、`utcOffset`、`waitForCompletion`、`disabled`。
- 可传 `Date` 实现单次定时（如 `new Date(Date.now() + 10000)`）。

---

## 三、@Interval / @Timeout

```ts
@Interval(10000)
handleInterval() { this.logger.debug('every 10s'); }

@Interval('notifications', 2500)
handleInterval2() {}

@Timeout(5000)
handleTimeout() { this.logger.debug('once after 5s'); }
```
- `@Interval` 底层 `setInterval`，`@Timeout` 底层 `setTimeout`（只执行一次）。
- 所有声明式方法自动包 try-catch，异常打印控制台。

---

## 四、动态调度（SchedulerRegistry）

注入 `SchedulerRegistry` 运行时管理任务。

### 获取/停止已声明 Cron
```ts
const job = this.schedulerRegistry.getCronJob('notifications');
job.stop();
job.start();
job.lastDate();
job.nextDate();
```

### 动态创建 Cron
```ts
import { CronJob } from 'cron';

addCronJob(name: string, seconds: string) {
  const job = new CronJob(`${seconds} * * * * *`, () => {
    this.logger.warn(`job ${name} run!`);
  });
  this.schedulerRegistry.addCronJob(name, job);
  job.start();
}
```

### 动态 Interval / Timeout
```ts
addInterval(name: string, ms: number) {
  const interval = setInterval(() => this.logger.warn(`Interval ${name}`), ms);
  this.schedulerRegistry.addInterval(name, interval);
}
// clearInterval(this.schedulerRegistry.getInterval(name));
// this.schedulerRegistry.deleteInterval(name);
```

---

## 五、最佳实践

1. 固定逻辑用声明式（`@Cron`/`@Interval`），运行时按名称控制用 `SchedulerRegistry`。
2. 多实例部署时注意：每个实例都会跑定时任务，需加**分布式锁**（如 Redis）避免重复执行。
3. 长任务考虑用**队列（见 queues.md）** 异步处理，别阻塞事件循环。

> 口诀：**"@Cron 定秒分，@Interval 周期跑，@Timeout 一次了；要管运行时，SchedulerRegistry 找。"**
