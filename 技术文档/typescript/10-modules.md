# TypeScript Modules（模块系统）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/2/modules.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。模块是工程化基础，Nest 每个文件都是 ES Module。衔接 `08-cli`(打包) 与 `tsconfig.md`(模块解析)。

## 一、模块判定

- 任何含**顶层 `import` 或 `export`** 的文件 = 模块（模块作用域，变量不泄漏全局）。
- 无 import/export/顶层 await 的文件 = **脚本（script）**，变量进全局作用域。
- 想强制某文件当模块但不导出东西：写 `export {};`。

> ⚠️ 脚本模式很坑：多个脚本文件共享全局，易命名冲突。现代项目一律用模块。

## 二、ES Module 导出/导入

### 默认导出
```ts
// hello.ts
export default function helloWorld() { console.log('hi'); }

import helloWorld from './hello.js';   // 导入默认（名字随意）
```

### 命名导出
```ts
// maths.ts
export const pi = 3.14;
export function abs(num: number) { return Math.abs(num); }
export class Random {}

import { pi, abs } from './maths.js';
```

### 附加语法
```ts
import { pi as π } from './maths.js';        // 重命名
import * as math from './maths.js';          // 命名空间导入
import './side-effect.js';                   // 仅副作用，不取绑定
```

## 三、TS 特有的类型导入

```ts
import type { Cat, Dog } from './animal.js';   // 仅类型
import { createCat, type Cat } from './animal.js';  // 内联（TS 4.5+）
```

- `import type` 让 Babel/SWC/esbuild 等**非类型感知转译器**安全删除类型导入（不生成 require）。
- ⚠️ 对 `import type` 导入的绑定当值用会报错。
- 与 `isolatedModules`/`verbatimModuleSyntax` 配合最稳妥（避免把类型当值编译）。

## 四、再导出（re-export，官网本页未展开，标准语法补充）

```ts
export { pi, abs } from './maths.js';   // 转发命名导出
export * from './maths.js';             // 转发所有命名导出
export { default } from './hello.js';   // 转发默认导出
```

- 常用于"桶文件"（barrel，如 `index.ts` 汇总导出）。

## 五、动态 import（官网本页未展开，标准语法补充）

```ts
async function load() {
  const { heavyFn } = await import('./heavy.js');   // 运行时按需加载
  heavyFn();
}
```

- 返回 Promise，实现懒加载/代码分割。
- 顶层 await 也支持：`await import(...)` 在模块顶层。

## 六、CommonJS 互操作

```ts
// TS 直接对应 require 的写法
import fs = require('fs');

// CommonJS 原生
const maths = require('./maths');
```

- `esModuleInterop: true` 减少 ES Module 与 CommonJS 默认导入的摩擦（推荐开）。
- `import fs = require('fs')` 保证 TS 与 CommonJS 输出 1:1。

## 七、模块解析（Module Resolution）

从 `import` 字符串找到对应文件的过程。关键选项：
- `moduleResolution`：解析策略（`node` / `node16` / `bundler` 等）。
- `baseUrl` + `paths`：路径别名（如 Nest monorepo 的 `@app/lib`，见 `技术文档/nest/08-cli/libraries.md`）。
- `rootDirs`：虚拟合并多个目录。

## 八、命名空间（Namespaces）—— 已不推荐

```ts
namespace Validation {
  export interface StringValidator {}
}
```

- TS 自有模块格式，早于 ES Modules，仍用于 DefinitelyTyped 复杂定义。
- **官方推荐用 ES Modules**（对齐 JS 方向），namespaces 未废弃但应避免新用。

## 要点速查

| 场景 | 写法 |
|------|------|
| 默认导出 | `export default` / `import x from` |
| 命名导出 | `export const` / `import { x }` |
| 类型导入 | `import type { T }` |
| 转发 | `export * from` |
| 懒加载 | `await import()` |
| 别名 | `baseUrl` + `paths` |

> 跨语言对比：ES Module 对齐 Java 的 `import`、Python 的 `from x import`、Go 的 `import`——TS 的 `import type` 是独有（类型/值分离），Rust 用 `use` 也分类型/值但语法不同。

## 衔接

- 模块解析的 `paths` 别名在 Nest monorepo 库用到，见 `技术文档/nest/08-cli/libraries.md`
- 编译输出由 `module`/`target` 决定，见 `tsconfig.md`
- 非 TS 转译器（SWC）与 `import type` 关系见 `typescript-cheatsheet.md`
