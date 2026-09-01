# NestJS 服务器发送事件（Server-Sent Events, SSE）技术详解

> 来源：https://docs.nestjs.cn/techniques/server-sent-events
> 作用：服务器单向向客户端持续推送文本事件（进度条、通知、实时行情）。基于 HTTP `text/event-stream`。

---

## 一、SSE 概述

- 一种服务器推送技术：客户端用 `EventSource` 建立长连接，服务器以文本块（一对换行符终止）持续发送。
- 连接保持打开直到客户端 `EventSource.close()`。
- 比 WebSocket 轻量，只适合"服务器→客户端"单向流。

**对比**：
- 类似 **WebSocket**（双向）的单向简化版、**GraphQL Subscriptions** 的底层协议之一。
- 浏览器原生 `EventSource` 支持，无需额外库。

---

## 二、@Sse 装饰器

```ts
import { Sse, MessageEvent } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Sse('sse')  // 路由 /sse
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(
    map((_) => ({ data: { hello: 'world' } })),
  );
}
```
- `@Sse()` 参数为路由路径。
- **强制要求**：方法必须返回 `Observable<MessageEvent>`，否则不满足 SSE 规范。

### MessageEvent 结构
```ts
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

---

## 三、客户端接收

```ts
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
// 有 type 字段时触发对应事件：eventSource.addEventListener('custom', ...)
```

---

## 四、最佳实践

1. 用 `interval`/`fromEvent` 等 RxJS 源包装成 Observable。
2. 推送对象用 `data: { ... }`（客户端 `JSON.parse`）。
3. 注意 SSE 不支持二进制，大文件走 WebSocket/流文件（见 streaming-files.md）。
4. 连接断开重连由浏览器自动处理（配合 `retry` 字段）。

> 口诀：**"@Sse 标路由，返回 Observable；data 传对象，客户端 EventSource；单向推送轻量选。"**
