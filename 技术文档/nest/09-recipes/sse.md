# Recipes - 服务端推送（Server-Sent Events）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/server-sent-events`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第十一章。SSE 让服务端单向持续推数据给浏览器（股票行情、通知、日志流），比 WebSocket 轻。

## 一、机制

SSE 基于普通 HTTP，服务端用 `text/event-stream` 持续发事件，客户端用浏览器原生 `EventSource` 接收。Nest 用 `@Sse()` 装饰器 + 返回 `Observable` 实现。

## 二、控制器用 @Sse

```ts
import { Controller, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';

@Controller('events')
export class EventsController {
  @Sse('stream')                 // GET /events/stream
  stream(): Observable<MessageEvent> {
    return interval(1000).pipe(
      map((n) => ({ data: { time: new Date(), count: n } } as MessageEvent)),
    );
  }
}
```

- `@Sse('stream')` 标记 SSE 端点。
- 返回 `Observable`，每发射一次就推一条事件给客户端。
- 客户端：

```ts
const es = new EventSource('/events/stream');
es.onmessage = (e) => console.log(JSON.parse(e.data));
```

## 三、用 EventEmitter 解耦

```ts
import { EventEmitter2 } from '@nestjs/event-emitter';   // 见 02-techniques/events

@Sse('notifications')
notifications(): Observable<MessageEvent> {
  return fromEvent(this.eventEmitter, 'notification').pipe(
    map((payload) => ({ data: payload } as MessageEvent)),
  );
}
```

- 业务其它处 `eventEmitter.emit('notification', {...)`，SSE 自动转发给前端。
- 衔接 `02-techniques`（事件模块）做模块间解耦。

## 四、要点

| 关注点 | 做法 |
|--------|------|
| 端点 | `@Sse('path')` |
| 数据流 | 返回 `Observable<MessageEvent>` |
| 客户端 | 浏览器 `EventSource` |
| 解耦 | 配合 `EventEmitter` |

> 与 `05-websockets` 对比：SSE 单向（服务→客户端）、走 HTTP、自动重连；WebSocket 双向、需升级协议。轻量通知用 SSE，聊天/协作用 WS。

## 下一篇

→ `http-module.md`：HTTP 模块（调外部 API）。
