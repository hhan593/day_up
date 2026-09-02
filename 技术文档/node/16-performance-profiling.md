# 16. Node.js 性能剖析

> 来源可信度：**官方文档确认**（基于 Node.js `perf_hooks`、内置 `--prof`、 clinic.js 官方文档）
> 关联：`02-event-loop-async.md`、`09-process-worker-threads.md`

## 1. 性能钩子 perf_hooks

```js
const { performance, PerformanceObserver } = require('node:perf_hooks');

const obs = new PerformanceObserver((items) => {
  items.getEntries().forEach(e => console.log(e.name, e.duration));
  obs.disconnect();
});
obs.observe({ entryTypes: ['measure'] });

performance.mark('A');
doWork();
performance.mark('B');
performance.measure('A→B', 'A', 'B');
```

- `performance.now()` 高精度计时（亚毫秒）。
- `PerformanceObserver` 异步收集 measure/mark/gc 条目。

## 2. 内置 CPU Profiler（--prof）

```bash
node --prof app.js        # 生成 isolate-*.log
node --prof-process isolate-*.log > report.txt  # 汇总成可读火焰表
```

- 看 `[JavaScript]` 与 `[C++]` 自/合计时间，定位热点函数。

## 3. 堆快照（Heap Snapshot）

```js
const { writeHeapSnapshot } = require('node:v8');
writeHeapSnapshot('dump.heapsnapshot'); // Chrome DevTools 打开分析内存泄漏
```

- 对比两次快照，找未释放的闭包/缓存/监听器。
- `--inspect` 后 Chrome DevTools → Memory 也能抓。

## 4. clinic.js（高级诊断）

```bash
npm i -g clinic
clinic doctor -- node app.js
clinic flame -- node app.js      # 火焰图
clinic bubbleprof -- node app.js # 异步延迟分析
```

- `doctor`：总览 CPU/内存/事件循环延迟。
- `flame`：CPU 火焰图。
- `bubbleprof`：定位异步链路瓶颈（事件循环阻塞）。

## 5. 事件循环延迟

```js
const { monitorEventLoopDelay } = require('node:perf_hooks');
const h = monitorEventLoopDelay({ resolution: 10 });
h.enable();
// h.mean / h.max / h.p99 反映事件循环卡顿
```

- 高延迟通常源于：同步重计算、JSON 大解析、正则灾难回溯（见 `02-event-loop-async.md`）。

## 6. 优化清单

| 瓶颈 | 手段 |
|------|------|
| CPU 密集 | 移入 Worker Threads（`09-process-worker-threads.md`） |
| JSON 大 | `simdjson`/流式解析 |
| 序列化 | `Buffer` 代替字符串 |
| 频繁 GC | 减少短命大对象、用对象池 |
| I/O | 流式 + 背压 |

## 7. 一句话总结

> Node 性能三板斧：`perf_hooks` 打点、`--prof`/`--prof-process` 出 CPU 报、clinic 火焰图；堆快照查泄漏。CPU 密集交给 Worker，事件循环延迟用 monitorEventLoopDelay 监控。
