# Recipes - 任务调度（Task Scheduling）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/task-scheduling`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第七章。定时任务（cron/间隔）用 `@nestjs/schedule`，是后台作业的标配。

## 一、安装

```bash
npm i @nestjs/schedule
```

## 二、注册 ScheduleModule

```ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({ imports: [ScheduleModule.forRoot()] })
export class AppModule {}
```

## 三、四种装饰器

```ts
import { Cron, Interval, Timeout, SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  // 1. Cron 表达式：每分第 0 秒执行
  @Cron('0 * * * * *')
  handleCron() {
    console.log('每分钟执行');
  }

  // 2. Cron 带 name（可用 Registry 动态控制）
  @Cron('0 0 0 * * *', { name: 'nightlyJob' })
  nightly() {}

  // 3. 间隔：每 10 秒
  @Interval(10000)
  handleInterval() {}

  // 4. 启动后延迟一次：5 秒后跑一次
  @Timeout(5000)
  handleTimeout() {}

  // 注入 Registry 手动管理
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  stopJob() {
    this.schedulerRegistry.deleteCronJob('nightlyJob');
  }
}
```

## 四、Cron 表达式格式

```
秒 分 时 日 月 周
*  *  *  *  *  *
│  │  │  │  │  └─ 星期 (0-6 或 SUN-SAT)
│  │  │  │  └──── 月份 (1-12)
│  │  │  └─────── 日 (1-31)
│  │  └────────── 小时 (0-23)
│  └───────────── 分钟 (0-59)
└──────────────── 秒 (0-59)
```

- `* * * * * *` 每 1 秒
- `0 0 * * * *` 每小时整点
- `0 30 9 * * 1-5` 工作日 9:30

> 比 Linux crontab 多一个"秒"字段（Nest 用 6 位）。Linux 是 5 位（无秒）。

## 五、SchedulerRegistry 动态控制

```ts
// 动态添加 cron
const job = new CronJob('0 0 12 * * *', () => {...});
this.schedulerRegistry.addCronJob('noonJob', job);
job.start();

// 列出/删除
this.schedulerRegistry.getCronJobs().forEach((j, name) => console.log(name));
this.schedulerRegistry.deleteCronJob('noonJob');
```

适合"运行时按需启停定时任务"。

## 六、要点

| 场景 | 装饰器 |
|------|--------|
| 固定时刻 | `@Cron('0 0 12 * * *')` |
| 固定间隔 | `@Interval(ms)` |
| 延迟一次 | `@Timeout(ms)` |
| 运行时管理 | `SchedulerRegistry` |

> 跨框架对比：Spring 的 `@Scheduled(cron=...)`、`@EnableScheduling`、Node 原生 `node-cron`——Nest 的 `@Cron` 几乎是 Spring 同款语法，且接 DI 容器。

## 下一篇

→ `authentication.md` + `passport.md`：认证与 Passport（安全核心）。
