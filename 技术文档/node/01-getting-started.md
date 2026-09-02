# 01 - Node.js 入门

> 来源：Node.js 官方 Learn 页面 + Node.js 官方文档（v26.8.1）
> 官方：https://nodejs.org/en/learn 、https://nodejs.org/api/
> 版权：OpenJS Foundation and Node.js contributors

Node.js 是基于 **V8 引擎** 的 JavaScript 运行时，让 JS 脱离浏览器在服务端运行。

---

## 一、Node.js 是什么

- **V8 引擎**：Google 开发的 JS 引擎，Node 用它执行 JS（Chrome 同款）。
- **非阻塞 I/O**：核心优势，单线程事件循环处理高并发 I/O。
- **跨平台**：Linux / macOS / Windows 一致运行。
- **版本**：本文基于 **Node.js v26.8.1**（最新，2026）。

---

## 二、Node.js 与浏览器的区别

| 维度 | 浏览器 | Node.js |
|---|---|---|
| JS 运行环境 | V8 + DOM/Web API | V8 + Node 核心模块 |
| `window`/`document` | 有 | 无 |
| `require`/`import` | 无（用 ESM） | 有 |
| 文件/网络 I/O | 受限 | 完整 `fs`/`net`/`http` |
| 全局对象 | `window` | `globalThis`（= `global`） |

- 浏览器没有 `process`、`Buffer`（旧）、`fs`；Node 没有 `document`、`alert`。

---

## 三、npm 包管理器

- `npm` 随 Node 安装，管理第三方包（package）。
- 核心文件 `package.json`：记录依赖、脚本、模块类型（`"type": "module"`）。
- 常用命令：
```bash
npm init -y          # 初始化
npm install lodash   # 装依赖（写入 dependencies）
npm install -D typescript   # 开发依赖
npm run dev          # 执行 scripts 中的脚本
npm install -g pnpm # 全局装包管理器
```
- 替代包管理器：`pnpm`（快、省磁盘）、`yarn`、Bun。

---

## 四、运行 Node 程序

```bash
node app.js          # 运行脚本
node -e "console.log(123)"   # 执行内联代码
node --watch app.js  # 监听文件变化自动重启（v18.11+）
```

- REPL：`node` 直接进入交互式。

---

## 五、全局对象与模块

- `globalThis` / `global`：全局对象（类似浏览器 `window`）。
- 每个 `.js` 文件是独立模块作用域（CommonJS 下变量不污染全局）。
- 常用全局：`process`、`Buffer`（v26 起建议显式 import）、`console`、`setTimeout`、`fetch`（Node 18+ 内置）。

---

## 六、调试与诊断

- `node --inspect app.js`：开启 V8 Inspector，用 Chrome DevTools 调试。
- `node --prof app.js`：生成性能分析文件。
- 内置测试运行器：`node --test`（见 技术文档 系列其他测试篇）。

---

## 七、与系列其他文档的关系

- 异步编程是 Node 灵魂 → `02-event-loop-async.md`
- 模块系统（CommonJS/ESM）→ `04-modules-cjs-esm.md`
- 用 Node 写后端服务对比 Nest（技术文档/nest）、Next.js（技术文档/nextjs 的 API 路由）
- 对比 Java（技术文档/java）：Node 单线程事件循环 vs Java 多线程/虚拟线程（java/10）
- 对比前端（React/Vue）：Node 是同一语言的服务端延伸，V8 引擎共享
