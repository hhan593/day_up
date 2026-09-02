# 19. Next.js 可观测性与性能监控

> 来源可信度：**官方文档确认**（基于 Next.js `instrumentation.ts`、OpenTelemetry 集成文档；与 Node `19-diagnostics-tracing.md` 衔接）
> 关联：React `14-performance-memo.md`

## 1. instrumentation.ts（启动钩子）

```ts
// instrumentation.ts (根目录)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node');
  }
}
```

- 服务端启动最早执行，挂 OpenTelemetry / Sentry / 日志。

## 2. OpenTelemetry 集成

```bash
npm i @vercel/otel @opentelemetry/sdk-trace-base
```

```ts
// instrumentation.ts
import { registerOTel } from '@vercel/otel';
export function register() { registerOTel({ serviceName: 'next-app' }); }
```

- 自动追踪 RSC 渲染、Route Handlers、fetch（与 Node `19-diagnostics-tracing.md` 同体系）。

## 3. 性能：Core Web Vitals

- **LCP**：首屏最大元素（优化 Server Component 数据等待）。
- **INP**：交互延迟（减少长任务，见 React `14-performance-memo.md`）。
- **CLS**：布局抖动（图片固定尺寸、`next/image`）。

```tsx
import Image from 'next/image';
<Image src="/a.png" width={800} height={600} alt="" />; // 自动优化 + 尺寸防抖
```

## 4. 错误监控（Sentry）

```ts
// sentry.client.config.ts / sentry.server.config.ts
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

- 捕获客户端异常 + 服务端未处理异常 + `error.tsx` 边界上报。

## 5. 日志与指标

- 用 `pino`/`winston` 结构化日志（Node `19`）。
- 暴露 `/metrics`（prom-client）给 Prometheus。

## 6. 一句话总结

> 可观测：instrumentation.ts 挂 OTel/Sentry；`registerOTel` 自动追踪 RSC/fetch；用 `next/image` 保 Core Web Vitals；错误进 Sentry，指标进 Prometheus。与 Node 诊断栈统一。
