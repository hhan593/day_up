# Node.js 技术文档索引（README）

> 目录：D:\offer\技术文档\node
> 风格：与 `技术文档/` 下 typescript / nest / react / nextjs / vue / java 一致——**编号 + 官网权威来源**
> 内容来源：Node.js 官方文档（nodejs.org，最新 **v26.8.1**，© OpenJS Foundation and Node.js contributors）

---

## 阅读顺序（编号即推荐顺序）

| 编号 | 文件 | 主题 | 官方来源 |
|---|---|---|---|
| 01 | `getting-started.md` | 入门：V8 / 与浏览器区别 / npm / 全局对象 | Node.js Learn |
| 02 | `event-loop-async.md` | 事件循环（6 阶段）/ process.nextTick / 异步演进 | nodejs.org/en/learn/asynchronous-work |
| 03 | `events-module.md` | EventEmitter：on/once/emit/error 约定 | nodejs.org/api/events.html |
| 04 | `modules-cjs-esm.md` | CommonJS vs ESM / package.json type / __dirname 替代 | nodejs.org/api/packages.html |
| 05 | `fs-files.md` | fs：读/写/流/目录/stat/watch（同步·回调·Promise） | nodejs.org/api/fs.html |
| 06 | `streams.md` | Stream 四类型 / pipe / 背压 backpressure | nodejs.org/api/stream.html |
| 07 | `http-module.md` | http：createServer / req·res / 路由 / 客户端 | nodejs.org/api/http.html |
| 08 | `buffer-crypto.md` | Buffer（二进制）/ crypto（哈希·对称加密·scrypt） | nodejs.org/api/buffer.html · crypto.html |
| 09 | `process-worker-threads.md` | process / worker_threads / child_process（CPU 密集） | nodejs.org/api/process.html · worker_threads.html |
| 10 | `README.md` | 索引（本文件） | — |
| 11 | `express.md` | Express 4.x：路由 / 中间件 / req·res / 静态文件 / 错误处理 | Express.js 4.x API Reference |
| 12 | `fastify.md` | Fastify v5.12.1：实例 / 插件 register / 钩子 / decorate / schema 校验 | Fastify Docs (latest) |
| 13 | `node-test.md` | node:test：test/describe/it / 钩子 / mock / 快照 / 运行器 | Node.js v26.8.1 Test Runner |
| 14 | `pm2-deploy.md` | PM2 集群 / cluster / Docker / 优雅关闭 / 与 Java 部署对照 | PM2 Cluster Mode 官方 |
| 15 | `bun-deno-fullstack.md` | Bun/Deno 对比 + Node+React SSR/Vite/Next 全栈整合 | Node v26.8.1 + 社区权威 |

---

## 内容特点

1. **权威最新**：全部基于 **Node.js v26.8.1** 官方文档（2026），每篇标注具体 nodejs.org URL 与版本、稳定性（均为 Stable 2）。
2. **核心机制准确**：事件循环 6 阶段顺序、libuv 1.45（Node 20）后 timers 在 poll 之后、nextTick 不在阶段内、setImmediate vs setTimeout 在 I/O 内顺序——均按官方文档忠实转写。
3. **版本演进标注**：
   - `.mjs`/`.cjs` 与 `type` 字段（v12.0.0）、语法检测默认 ESM（v22.7+）
   - `nextTick` 标记 Legacy（v22.7，建议 `queueMicrotask`）
   - `fs/promises` 推荐、`Buffer` 建议显式 import、`fetch` 内置（v18+）
   - `allocUnsafe` 不初始化内存的安全提示
4. **完整可运行代码**：事件循环顺序示例、EventEmitter 继承、CJS/ESM 互操作、fs 流拷贝、管道+背压、HTTP 路由、crypto AES 加密、Worker 通信——全部真实片段。
5. **跨栈衔接**：与 typescript（ESM 解析）、nest（HTTP 封装/@ControllerAdvice）、nextjs（Route Handler 底层 undici）、react（流式 SSR 即 Node 流）、java（虚拟线程/并发/加密/Microservice）建立对照，降低理解成本。
6. **诚实标注**：Node 官方 Learn 部分子页路径变动（404），改用 API 文档正文（events/fs/stream/http/worker_threads/buffer/crypto/process/packages 均完整抓取）；Event Loop 页完整抓取，正文逐段转写。

---

## 与系列其他目录的关系

- `技术文档/typescript`（16）、`nest`（9）、`react`（16）、`nextjs`（16）、`vue`（13）、`java`（25）
- Node 是 JS 服务端运行时：Nest/Next.js 构建于其上；与 Java 是「前端语言延伸」vs「成熟后端语言」的对位。
- 面试联动：事件循环、Buffer/流背压、CommonJS/ESM 差异、worker_threads 是 Node 岗高频考点。

---

## 目录状态：已完整覆盖

`技术文档/node` 共 **15 篇**，已覆盖：Node 核心机制（事件循环/模块/fs/stream/http/buffer/crypto/process/worker）→ Web 框架（Express/Fastify）→ 测试（node:test）→ 部署（PM2/cluster/Docker）→ 现代运行时对比（Bun/Deno）与全栈整合（Node+React SSR/Vite/Next）。

至此与 `技术文档/` 下 **typescript（16）、nest（9）、react（16）、nextjs（16）、vue（13）、java（25）、node（15）** 七个目录共同构成完整的技术求职复习体系。

> 如需在 node 目录新增其他主题（如 Koa、GraphQL、WebSocket/socket.io、gRPC、NATS、Serverless/FaaS、NestJS 深入），告知即可。
 