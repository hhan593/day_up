ba# 19. Node.js 诊断与分布式追踪

> 来源可信度：**官方文档确认**（基于 Node.js `diagnostics_channel`、`trace_events`、OpenTelemetry JS 官方文档）
> 关联：`16-performance-profiling.md`、`11-express.md`

## 1. diagnostics_channel（诊断通道）

Node 14+ 内置的发布/订阅通道，用于无侵入采集内部事件（HTTP、DNS、net）。

```js
const diagnostics_channel = require('node:diagnostics_channel');

const ch = diagnostics_channel.channel('http.server.request.start');
ch.subscribe((message, name) => {
  console.log('request start', message.request.method, message.request.url);
});
```

- 官方模块（http、net、dns、tls）已发布各类 channel，无需改业务代码即可观测。

## 2. AsyncLocalStorage（请求上下文）

```js
const { AsyncLocalStorage } = require('node:async_hooks');
const als = new AsyncLocalStorage();

als.run({ requestId: 'abc' }, () => {
  handler(); // 任何异步调用链内都能拿到 requestId
});
function handler() {
  console.log(als.getStore().requestId); // 'abc'
}
```

- 比手动透传 `reqId` 干净，是 Node 版"请求作用域"（类似 React Context）。
- 框架常用它实现请求级日志/追踪（Express/Nest 内部）。

## 3. trace_events（跟踪事件）

```bash
node --trace-events-enabled --trace-event-categories=node,node.async_hooks app.js
```

- 生成 JSON，Chrome `chrome://tracing` 打开，看 V8/GC/事件循环/async_hooks 时序。

## 4. OpenTelemetry（分布式追踪）

```js
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');

const provider = new NodeTracerProvider();
provider.register();
registerInstrumentations({ instrumentations: [new HttpInstrumentation()] });
```

- 自动埋点 HTTP/DB，导出 trace 到 Jaeger/Tempo/Collector。
- 跨服务透传 context（W3C traceparent），串起全链路（与 Go `16-grpc-microservices.md`、Java `24-messaging-microservices.md` 同一体系）。

## 5. 日志与可观测性三件套

- **Metrics**：Prometheus client（`prom-client`）暴露 `/metrics`。
- **Logs**：pino（快）/winston，结构化 JSON。
- **Traces**：OpenTelemetry + 上面通道。

## 6. 一句话总结

> Node 可观测三件套：`diagnostics_channel` 无侵入订阅内部事件、`AsyncLocalStorage` 做请求上下文、OpenTelemetry 串分布式 trace。配合 prom-client 指标 + pino 日志，构成生产观测底座。
