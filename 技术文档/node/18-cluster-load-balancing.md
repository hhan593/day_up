# 18. Node.js Cluster 与多进程

> 来源可信度：**官方文档确认**（基于 `cluster` 模块官方文档）
> 关联：`02-event-loop-async.md`、`09-process-worker-threads.md`、`16-performance-profiling.md`

## 1. 为什么需要 Cluster

Node 单进程只能用**一个 CPU 核**（事件循环单线程）。多核机器需起多个进程共享端口，吃满 CPU。

## 2. cluster 基础

```js
const cluster = require('node:cluster');
const http = require('node:http');
const os = require('node:os');

if (cluster.isPrimary) {
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died, restarting`);
    cluster.fork(); // 自动重启
  });
} else {
  http.createServer((req, res) => {
    res.end('handled by ' + process.pid);
  }).listen(3000);
  console.log(`worker ${process.pid} started`);
}
```

- `cluster.fork()` 复制主进程；子进程通过**共享 socket** 负载均衡接请求。
- 默认轮询（除 Windows 上用共享端口）。

## 3. 负载均衡与 sticky session

- 默认 RR 分发，无状态服务完美。
- 有状态（session）需 sticky：用 `sticky-session` 或外部存储（Redis）存 session（见 Rust `36-data-redis-sqlx.md` 思路相通）。

## 4. 进程间通信（IPC）

```js
// 主 → 子
worker.send({ type: 'reload' });
// 子 → 主
process.on('message', (msg) => { ... });
cluster.worker.send(...)
```

- 用 `process.send` / `message` 事件，序列化 JSON 传消息。

## 5. 与 Worker Threads 的区别

| 维度 | cluster | worker_threads |
|------|---------|----------------|
| 隔离 | 进程级（独立内存） | 线程级（共享内存） |
| 开销 | 大（每进程 V8 实例） | 小（共享 V8 isolate） |
| 适用 | 多请求并发、崩溃隔离 | CPU 密集共享数据 |

详见 `09-process-worker-threads.md`。

## 6. 零停机重启

- `cluster` + 信号：`SIGUSR2` 触发逐个替换 worker（graceful restart）。
- PM2（`14-pm2-deploy.md`）内置 `reload` 做零停机。

## 7. 一句话总结

> cluster 用 `fork` 多进程共享端口，吃满多核，崩溃自动重启；无状态 RR 分发，有状态靠外部 session；进程间用 IPC。重隔离用 cluster，重共享用 Worker Threads。
