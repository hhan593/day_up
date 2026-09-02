# 02 - 事件循环与异步编程（Node.js 核心）

> 来源：Node.js 官方《The Node.js Event Loop》文档（v26.8.1）
> 官方：https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
> 版权：OpenJS Foundation and Node.js contributors

事件循环是 Node.js 高并发的基石，理解它才能写好异步代码、避免性能坑。

---

## 一、为什么需要事件循环

- Node **默认单线程**执行 JS，但内核多线程处理 I/O（文件、网络）。
- 异步操作（读文件、查 DB、请求 HTTP）完成后，内核通知 Node，回调被加入队列。
- 事件循环不断「取任务 → 执行回调 → 取下一个」，实现**非阻塞**。

---

## 二、事件循环阶段（Phases）

按固定顺序循环（每轮）：

```
timers → pending callbacks → idle/prepare → poll → check → close callbacks → (回 timers)
```

| 阶段 | 执行内容 |
|---|---|
| **timers** | `setTimeout()` / `setInterval()` 回调 |
| **pending callbacks** | 推迟的 I/O 回调（如 TCP 错误） |
| **idle, prepare** | 内部使用 |
| **poll** | 取新 I/O 事件；执行 I/O 回调（除 timers/close/immediate） |
| **check** | `setImmediate()` 回调 |
| **close callbacks** | `socket.on('close')` 等 |

- 进入某阶段后清空其队列（或达系统上限）再进下一阶段。
- **libuv 1.45.0（Node 20）起**：timers 在每轮 poll **之后**运行（旧版在 poll 前）。

---

## 三、process.nextTick 与微任务（Microtask）

- `process.nextTick()` **不在事件循环阶段内**，在当前 JS 操作完成后立即执行（早于任何阶段）。
- 递归调用会「饿死」I/O（阻塞进 poll）。
- Promise 回调属**微任务**，在阶段间执行。
- **v22.7.0 起 `nextTick` 标记 Legacy**，官方建议用 `queueMicrotask()`。

```js
console.log('start');
queueMicrotask(() => console.log('microtask'));
process.nextTick(() => console.log('nextTick'));
console.log('scheduled');
// 输出：start → scheduled → nextTick → microtask（nextTick 早于微任务，CJS 下）
```

---

## 四、setTimeout vs setImmediate 顺序

| 环境 | 顺序 | 说明 |
|---|---|---|
| 主模块（非 I/O 周期） | **不确定** | 性能影响，`0` 超时与 `setImmediate` 竞争 |
| I/O 回调内（如 `fs.readFile`） | **setImmediate 必先于 setTimeout** | poll 后直接进 check 阶段 |

```js
const fs = require('node:fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// 输出：immediate → timeout
```

---

## 五、阻塞 vs 非阻塞

```js
// 阻塞（千万别在服务器用）
const data = fs.readFileSync('/file');  // 整个进程卡住

// 非阻塞（推荐）
fs.readFile('/file', (err, data) => { /* 回调 */ });
// 或
const data = await fs.promises.readFile('/file');
```

- **不要阻塞事件循环**：长同步循环（如大数组排序、重计算）会卡死所有请求。
- CPU 密集任务交给 **worker_threads**（见 `09-process-worker-threads.md`）。

---

## 六、异步编程演进

```js
// 1. 回调（Callback）—— 易回调地狱
fs.readFile('a', (err, a) => {
  fs.readFile('b', (err, b) => { /* ... */ });
});

// 2. Promise
fs.promises.readFile('a')
  .then(a => fs.promises.readFile('b'))
  .catch(console.error);

// 3. async/await（现代首选）
async function main() {
  const a = await fs.promises.readFile('a');
  const b = await fs.promises.readFile('b');
}
```

- `Promise` 是微任务，回调在微任务队列执行。
- `async/await` 只是 Promise 语法糖，本质是事件循环调度。

---

## 七、与系列其他文档的关系

- 事件驱动基于 `EventEmitter`（03 篇）。
- 流、HTTP、fs 全异步，依赖事件循环（05/06/07 篇）。
- 对比 Java 虚拟线程（java/10）：Java 用多线程+同步；Node 用单线程+事件循环，各擅其场。
- 对比前端事件循环：浏览器也是微任务/宏任务，但 Node 多 libuv 阶段与 `setImmediate`。
- 背压（流，06 篇）本质是事件循环下防止快生产者压垮慢消费者。
