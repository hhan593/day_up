# NestJS 日志（Logger）技术详解

> 来源：https://docs.nestjs.cn/techniques/logger
> 作用：应用运行期记录信息、错误、审计。内置 `Logger` / `ConsoleLogger`，可替换为 Winston/Pino。

---

## 一、内置 Logger 基础

### 日志级别（级联）
`log`、`fatal`、`error`、`warn`、`debug`、`verbose`
- 指定某级别会自动包含更高严重级别（如 `'log'` 含 `warn/error/fatal`）。

### 应用级配置
```ts
const app = await NestFactory.create(AppModule, { logger: false });            // 完全禁用
const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] }); // 仅 error/warn

const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({ colors: false, prefix: 'MyApp' }),
});
```

### ConsoleLogger 常用选项
| 选项 | 说明 |
|---|---|
| logLevels | 启用级别（默认全部） |
| timestamp | 打印时间差 |
| prefix | 前缀（默认 Nest） |
| json | JSON 格式输出（便于日志聚合） |
| colors | 彩色 |
| context | 上下文 |

---

## 二、JSON 日志（生产推荐）

```ts
const app = await NestFactory.create(AppModule, { logger: new ConsoleLogger({ json: true }) });
```
输出单行 JSON：
```json
{ "level": "log", "pid": 19096, "timestamp": 1607370779834, "message": "...", "context": "NestFactory" }
```

---

## 三、业务中使用 Logger

```ts
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);
  doSomething() { this.logger.log('Doing something...'); }
}
```
- 带时间戳：`new Logger(MyService.name, { timestamp: true })`

**对比**：类似 **Java SLF4J 的 `LoggerFactory.getLogger(X.class)` + Logback**，context 即类名。

---

## 四、自定义 Logger

实现 `LoggerService` 接口：
```ts
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  log(message: any, ...p: any[]) {}
  fatal(message: any, ...p: any[]) {}
  error(message: any, ...p: any[]) {}
  warn(message: any, ...p: any[]) {}
  debug?(message: any, ...p: any[]) {}
  verbose?(message: any, ...p: any[]) {}
}

const app = await NestFactory.create(AppModule, { logger: new MyLogger() });
```

扩展内置 `ConsoleLogger`：
```ts
import { ConsoleLogger } from '@nestjs/common';
export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    super.error(...arguments);
  }
}
```

---

## 五、DI 与模块化管理

### LoggerModule 单例
```ts
@Module({ providers: [MyLogger], exports: [MyLogger] })
export class LoggerModule {}
```
```ts
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(MyLogger)); // 自定义 logger 挂载前的日志先缓冲
```

### 瞬态作用域（独立 context）
```ts
@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() { this.log('Please feed the cat!'); }
}
```

---

## 六、生产建议

1. 生产接 **Winston / Pino**（内置 Logger 只适合系统监控）。
2. 用 `json: true` 输出，方便 ELK / Datadog 聚合。
3. 每个 Service 用 `new Logger(类名)` 带 context，便于定位。

> 口诀：**"级别级联上，context 定位忙；内置够调试，生产接 Winston；要换全局用 useLogger。"**
