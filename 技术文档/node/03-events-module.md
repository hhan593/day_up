# 03 - EventEmitter（事件驱动）

> 来源：Node.js 官方 `events` 模块文档（v26.8.1）
> 官方：https://nodejs.org/api/events.html
> 模块稳定性：2 - Stable

Node.js 核心是**事件驱动架构**，几乎所有 I/O 对象（Server、Stream、Socket）都继承 `EventEmitter`。

---

## 一、EventEmitter 基础

```js
import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();
emitter.on('event', () => console.log('an event occurred!'));
emitter.emit('event');   // 同步触发，输出事件
```

- 监听器**同步**按顺序调用，返回值被忽略。
- `emit()` 返回 `true`（有监听器）/ `false`（无）。

---

## 二、核心方法

| 方法 | 作用 |
|---|---|
| `on(event, fn)` / `addListener` | 添加监听器（别名） |
| `once(event, fn)` | 一次性监听器，触发后自动移除 |
| `emit(event, ...args)` | 同步触发 |
| `off(event, fn)` / `removeListener` | 移除监听器（别名） |
| `removeAllListeners([event])` | 移除全部/指定事件监听器 |
| `prependListener` | 插到监听器数组开头 |
| `listeners(event)` | 返回监听器数组副本 |
| `listenerCount(event)` | 监听数量 |
| `setMaxListeners(n)` | 单事件最大监听数（默认 10） |

```js
emitter.once('boot', () => console.log('only once'));
emitter.emit('boot');  // 触发
emitter.emit('boot');  // 忽略（已移除）
```

---

## 三、error 事件约定（重要）

- 若发出 `'error'` 且**没有**监听器，Node 会抛错、打印堆栈并**退出进程**。
- 始终为 `'error'` 加监听：

```js
emitter.on('error', (err) => console.error('whoops:', err.message));
```

- `events.errorMonitor`：仅监控 error 不消费，进程仍崩溃（用于日志）。
- `captureRejections: true`：异步监听器 Promise 拒绝路由到 `'error'` 事件。

---

## 四、继承 EventEmitter

```js
import { EventEmitter } from 'node:events';

class MyService extends EventEmitter {
  doWork() {
    this.emit('progress', 50);
    this.emit('done');
  }
}

const svc = new MyService();
svc.on('progress', p => console.log('progress', p));
svc.doWork();
```

- 自定义类继承后可发事件，是 Node 模块通用模式（如 HTTP Server 的 `'request'`）。

---

## 五、异步迭代与 once 工具

```js
import { once } from 'node:events';

try {
  await once(emitter, 'ready');   // 等待事件，error 时 reject
} catch (err) { /* handle */ }

// 异步迭代
for await (const [chunk] of emitter.iterator('data')) { /* ... */ }
```

---

## 六、EventTarget（Web 兼容）

- Node 也提供 Web 标准的 `EventTarget` / `Event` / `CustomEvent`。
- 与 EventEmitter 不同：`EventTarget` 同类监听器最多注册一次，不支持 `prependListener` 等。

---

## 七、与系列其他文档的关系

- 事件循环触发回调（02 篇）。
- `Stream`（06）、`http.Server`（07）、`Worker`（09）均继承 EventEmitter。
- 对比前端：浏览器 `EventTarget`/`addEventListener` 是同源概念。
- 对比 Java：Spring 的 `ApplicationEvent`/`ApplicationListener`（java/14）即观察者模式，与 EventEmitter 对应。
