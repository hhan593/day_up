# 15 · 运行时对比（Bun / Deno）与 Node 全栈整合

> 官方来源：Node.js v26.8.1；Bun / Deno 社区权威对比（2025-2026 主流资料）
> 说明：Bun/Deno 细节页为社区整理，本文基于公开技术常识 + 官方定位撰写，并标注对照项。

## 一、三大运行时对比

| 维度 | Node.js | Deno | Bun |
|---|---|---|---|
| 创立 | 2009 Ryan Dahl 后，现 OpenJS | 2018 Ryan Dahl 重做 | 2021 Oven 公司（Zig 编写） |
| 底层 | V8 + libuv（C++） | V8 + Tokio（Rust） | JavaScriptCore（Apple，快） |
| TypeScript | 需 `tsx`/编译（v22+ 内置 strip-types） | 原生运行 .ts | 原生运行 .ts（极快） |
| 包管理 | npm / pnpm / yarn | 无（URL import / 偶用 npm） | 内置 `bun` 包管理 |
| 模块 | CJS + ESM | 仅 ESM（默认安全） | ESM 优先，兼容 CJS |
| 内置 API | `node:*` 显式 | 全局 `Deno.*` | `Bun.*` + 兼容 `node:*` |
| 标准库 | 需第三方 | 丰富内置（http/test/uuid） | 丰富内置（http/test/fs） |
| 浏览器兼容 | 部分 | 高（Web API fetch/WebSocket） | 高（Web API 兼容） |
| 性能 | 基准中 | 中 | HTTP 吞吐最高 |
| 生态 | 最成熟 | 中等 | 快速追，兼容 npm 大部分包 |

### Deno 关键特性
- 默认**安全沙箱**：文件/网络/环境需 `--allow-read/--allow-net` 显式授权。
- `deno run server.ts` 直接跑 TS；内置 `deno test`、`deno fmt`、`deno lint`。
- 兼容 npm：`import express from 'npm:express'`。

### Bun 关键特性
- 用 JavaScriptCore，启动与 `fetch`/IO 极快；自带 bundler、test runner、package manager。
- 高度兼容 Node API（`node:*` 与 `process` 多数可用），迁移成本低。
- `bun run dev`、`bun test`、`bun install`（快于 npm）。

> 选型：追求生态与稳定选 **Node**；新项目要原生 TS + 安全选 **Deno**；要极致性能与一体化工具链选 **Bun**。当前求职市场 Node 仍是绝对主流。

## 二、Node + React 全栈整合（SSR / 全栈框架）

React 等前端框架在服务端需要 Node 运行时渲染（见 `技术文档/react`、`技术文档/nextjs`）。

### SSR 基本原理
```js
// server.js (Node + Express)
import express from 'express';
import { renderToString } from 'react-dom/server';
import App from './App.js';

const app = express();
app.use(express.static('dist/client'));
app.get('*', (req, res) => {
  const html = renderToString(<App url={req.url} />);
  res.send(`<!doctype html><html><div id="root">${html}</div><script src="/client.js"></script></html>`);
});
```
- `react-dom/server` 的 `renderToString` / `renderToPipeableStream` 在 **Node 流**上工作（见 `06-streams.md`、`技术文档/react` 流式 SSR）。
- 客户端 `hydrateRoot` 复用服务端 HTML，避免重复渲染。

### Vite SSR 现代方案
- Vite 提供 `server.ssrLoadModule` 在 Node 中按需编译加载 React 组件。
- 开发期：Node 起 Vite dev server，浏览器请求 → Node 渲染 → 流式返回。
- 生产期：`vite build` 产出 `client` + `server` 包，Node 运行时执行 server bundle。

> 官方中文参考：Vite SSR（https://vitejs.cn/guide/ssr.html）

### Next.js（开箱 SSR）
- Next.js（`技术文档/nextjs`）底层用 Node 运行时：Route Handler、Server Component、SSR 全由 Node 执行。
- 自定义 server 可用 Express/Fastify 包裹（见 `11-express.md`）。

## 三、Node 全栈典型架构

```
Browser (React)
   │ HTTP
Node (Express/Fastify/Nest)  ── 业务逻辑
   │
DB (PostgreSQL/MySQL via pg/prisma)  + Redis(缓存,见 java/23)
   │
消息队列 (Kafka/RabbitMQ, 见 java/24)
```

- ORM：`prisma` / `drizzle` / `sequelize`（类比 Java 的 JPA/MyBatis，`java/19-20`）。
- 校验：`zod`（类比 Java Bean Validation / Fastify schema）。

## 四、与 Java 全栈对照（面试加分）

| Node 全栈 | Java 全栈 |
|---|---|
| Express/Nest | Spring Boot（java/13） |
| prisma/drizzle | JPA/MyBatis（java/19-20） |
| zod | Bean Validation |
| React SSR (Node) | Thymeleaf / 前后端分离 |
| PM2 cluster | Tomcat 线程池 |
| Bun/Deno | GraalVM 原生镜像（可选） |

## 五、学习路线收尾

`技术文档/node` 链路：入门(01) → 事件循环(02) → events(03) → 模块(04) → fs(05) → stream(06) → http(07) → buffer/crypto(08) → process/worker(09) → 框架 Express(11)/Fastify(12) → 测试(13) → 部署(14) → 运行时对比+全栈(15)。

> 延伸：`技术文档/react`、`技术文档/nextjs`、`技术文档/typescript`、`技术文档/nest`、`技术文档/java`。
