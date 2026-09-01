# 09 - process 与 worker_threads（进程与多线程）

> 来源：Node.js 官方 `process` 与 `worker_threads` 模块文档（v26.8.1）
> 官方：https://nodejs.org/api/process.html 、https://nodejs.org/api/worker_threads.html
> 模块稳定性：2 - Stable

单线程事件循环够用 I/O，但 **CPU 密集任务**需 `worker_threads`；进程级控制用 `process`。

---

## 一、process（进程信息与控制）

```js
import process from 'node:process';

process.env.NODE_ENV;        // 环境变量
process.argv;                // [node路径, 脚本路径, ...参数]
process.cwd();               // 当前工作目录
process.platform;            // 'linux' / 'win32' / 'darwin'
process.exitCode = 1;        // 设退出码（让进程自然退出）
process.exit(0);             // 强制退出（慎用，截断异步 I/O）
```

### 进程事件（全局异常兜底）
```js
process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
process.on('exit', (code) => {
  // 只能同步操作！setTimeout 不执行
});
```

- `uncaughtException` / `unhandledRejection` 是最后兜底，应用应正常关闭而非忽略错误。
- `process.nextTick()`（v22.7 起 Legacy）建议用 `queueMicrotask()`。

---

## 二、worker_threads（多线程）

> 适合 **CPU 密集** JS；I/O 密集用内置异步 I/O 更高效。Worker 可共享内存（SharedArrayBuffer）。

### 主线程
```js
import { Worker } from 'node:worker_threads';

const worker = new Worker('./calc.mjs', { workerData: { n: 40 } });
worker.on('message', (result) => console.log('结果:', result));
worker.on('error', (err) => console.error(err));
worker.on('exit', (code) => console.log('退出码:', code));
worker.postMessage('ping');           // 向子线程发
```

### 子线程（calc.mjs）
```js
import { parentPort, workerData, isMainThread } from 'node:worker_threads';

if (!isMainThread) {
  parentPort.on('message', (m) => console.log('来自主线程:', m));
  // 用 workerData 做计算
  const fib = computeFib(workerData.n);
  parentPort.postMessage(fib);         // 回传结果
}
```

### 通信机制
- `parentPort.postMessage(value)` ↔ `worker.postMessage(value)`。
- 用 **HTML structured clone** 算法克隆（支持 Map/Set/BigInt/TypedArray）。
- `transferList`：转移 `ArrayBuffer`/`MessagePort`（转移后发送方不可用）。
- `SharedArrayBuffer`：共享内存（不入 transferList）。

### 区别对比
| 维度 | worker_threads | child_process / cluster |
|---|---|---|
| 执行单元 | 线程（同进程） | 进程（隔离） |
| 内存共享 | 支持（SharedArrayBuffer） | 否，靠 IPC 序列化 |
| 开销 | 小 | 大 |
| 适用 | CPU 密集 JS | 隔离崩溃 / 通用 |

> 建议复用线程池而非频繁创建 Worker。

---

## 三、child_process（子进程）

```js
import { exec, spawn } from 'node:child_process';

exec('ls -la', (err, stdout) => console.log(stdout));
const child = spawn('node', ['worker.js']);
child.stdout.on('data', d => console.log(d.toString()));
```

- `exec`：缓冲输出、返回字符串（注意命令注入）。
- `spawn`：流式、更适合大输出 / 二进制。
- `cluster`：多进程共享端口（利用多核），现代更推荐 `worker_threads` 或反向代理多实例。

---

## 四、与系列其他文档的关系

- CPU 密集任务避免阻塞事件循环（02 篇）。
- 对比 Java 并发（java/10 虚拟线程、java/15 线程池）：Node 单线程+I/O 异步对应 Java 多线程；CPU 密集时 Node 用 Worker，Java 用虚拟线程/线程池。
- 对比前端 Web Worker：浏览器 Worker 与 Node worker_threads 概念一致（隔离线程通信）。
- 进程事件兜底类似 Nest 的全局异常过滤器（java/22 的 `@ControllerAdvice` 思路）。
