# 04 - 模块系统：CommonJS 与 ESM

> 来源：Node.js 官方 `Modules: Packages` 文档（v26.8.1）
> 官方：https://nodejs.org/api/packages.html
> 版权：Node.js contributors

Node 有两套模块系统：**CommonJS（CJS，传统）** 与 **ES Modules（ESM，现代标准）**。理解差异是避免 `require is not defined` / `Cannot use import` 报错的关键。

---

## 一、package.json 的 type 字段

```json
{ "type": "module" }    // 此包内 .js 按 ESM 处理
```

- `type: "module"` → `.js` 是 ESM
- `type: "commonjs"` 或缺失 → `.js` 是 CommonJS
- **扩展名优先级**（不受 type 影响）：
  - `.mjs` 永远 ESM
  - `.cjs` 永远 CommonJS

```json
{
  "type": "module",
  "exports": {
    "import": "./index.mjs",
    "require": "./index.cjs"
  }
}
```

---

## 二、CommonJS（CJS）

```js
// 导入
const fs = require('node:fs');
const _ = require('lodash');

// 导出
module.exports = function () {};
exports.foo = 123;

// 特有变量
console.log(__dirname);   // 当前目录
console.log(__filename);  // 当前文件完整路径
```

- `require()`：同步加载，支持文件夹索引、自动补扩展名。
- `module.exports` / `exports`：导出对象。
- 限制：`require()` 只能同步加载**无顶层 await** 的 ESM。

---

## 三、ES Modules（ESM）

```js
// 导入
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import pkg from 'commonjs-pkg';

// 导出
export const foo = 1;
export default function () {};

// 动态导入（两种模块都可用）
const mod = await import('./dyn.mjs');
```

- `import` / `export` 静态语法；`import.meta.url` 提供模块元信息。
- ESM **不自动补扩展名**、不支持文件夹索引（须写全 `./index.js`）。
- JSON 导入需属性：`import data from './x.json' with { type: 'json' }`。

### __dirname 替代（ESM 中无此变量）
```js
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## 四、CJS 与 ESM 互操作

| 方向 | 方式 |
|---|---|
| CJS 导入 ESM | `require()` 仅限同步 ESM；或用 `createRequire()` 加载 |
| ESM 导入 CJS | `import pkg from 'cjs-pkg'`（Node 静态分析命名导出） |

- **双模式包**：用 `exports` 条件导出，`"import"` 指 ESM、`"require"` 指 CJS。
- v22.7+ 默认「语法检测」：无 `type` 的 `.js` 含 ESM 语法（import/export/顶层 await）自动按 ESM。

---

## 五、默认模块判定总结

| 文件 / 输入 | 默认处理 |
|---|---|
| `.mjs` | 始终 ESM |
| `.cjs` | 始终 CommonJS |
| `.js` + `type: module` | ESM |
| `.js` + `type: commonjs` 或无 type 且能跑通 CJS | CommonJS |
| `.js` 无 type 且含 ESM 语法 | 语法检测 → ESM（v22.7+） |

---

## 六、与系列其他文档的关系

- TypeScript（技术文档/typescript）编译目标可设 CJS 或 ESM；`"module": "NodeNext"` 严格按 Node 解析。
- Nest（技术文档/nest）默认用 CommonJS，可切 ESM（`"type": "module"`）。
- 对比 Java：Java 的 `import` 是编译期静态（java/03），Node ESM 类似但运行时解析；CJS 类似动态加载。
- 对比前端打包（Vite/Webpack）：浏览器原生只认 ESM，Node 同时支持两套。
