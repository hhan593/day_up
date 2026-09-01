# NestJS 事件（Events）技术详解

> 来源：https://docs.nestjs.cn/techniques/events
> 作用：应用内发布/订阅事件，解耦模块（如"订单创建"后触发"发邮件""加积分"）。
> 基于 `@nestjs/event-emitter`（底层 eventemitter2）。

---

## 一、安装与初始化

```bash
npm install --save @nestjs/event-emitter
```
```ts
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({ imports: [EventEmitterModule.forRoot()] })
export class AppModule {}
```
- `forRoot()` 在 `onApplicationBootstrap` 注册所有监听器，确保模块加载完。

### forRoot 配置
```ts
EventEmitterModule.forRoot({
  wildcard: false,       // 通配符
  delimiter: '.',        // 命名空间分隔符
  maxListeners: 10,
  ignoreErrors: false,   // 无监听器时是否抛异常
});
```

**对比**：
- 类似 **Spring 的 `ApplicationEventPublisher` + `@EventListener`**、**Node 原生 `EventEmitter`**，但 Nest 用 DI + 装饰器，监听器能注入 Service。

---

## 二、派发事件

```ts
import { EventEmitter2 } from '@nestjs/event-emitter';

constructor(private eventEmitter: EventEmitter2) {}

this.eventEmitter.emit('order.created', new OrderCreatedEvent({ orderId: 1 }));
```
- 第二个参数为 `payload`（事件负载）。

---

## 三、监听事件（@OnEvent）

```ts
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {}

@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {}
```
- 订阅者**不能是请求作用域**（异步生命周期问题）。
- 选项：`prependListener`、`suppressErrors`、`async`。

---

## 四、通配符与命名空间

需 `forRoot({ wildcard: true })`：
```ts
@OnEvent('order.*')   // 匹配 order.created / order.shipped（单级）
handleOrderEvents(payload) {}

@OnEvent('**')        // 匹配所有事件（多级）
handleEverything(payload: any) {}
```
- 事件名可为 `'foo.bar'` 或数组 `['foo','bar']`。

---

## 五、防止事件丢失

`onApplicationBootstrap` 完成前（如构造器、`onModuleInit`）派发的事件可能漏掉：
```ts
await this.eventEmitterReadinessWatcher.waitUntilReady();
this.eventEmitter.emit('order.created', new OrderCreatedEvent({ orderId: 1 }));
```

---

## 六、最佳实践

1. 用事件做"副作用解耦"（发邮件、记日志、清缓存），主流程不直接调。
2. 事件名用 `domain.action` 命名空间，便于通配订阅。
3. 监听器里抛异常用 `suppressErrors` 或 try-catch 兜住，别影响主流程。

> 口诀：**"emit 发事件，@OnEvent 来收；通配符要开，命名空间好管；启动前别发（或等 ready）。"**
