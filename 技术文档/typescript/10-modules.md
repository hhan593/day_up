# 10. 模块系统（Modules 全展开）

> 来源可信度：**官方文档确认**（TS 官方 Handbook「Modules」页 + Modules Reference（模块解析/package.json exports/AMS）；TypeScript 5.x 时代）
> 关联：`11-tsconfig.md`（module/moduleResolution 配对是 tsconfig 最关键的对儿）、`20-tsx-and-runtime.md`（Node 直接跑 TS）、`17-engineering-tsup-vitest.md`（打包与双格式产物）、`21-declaration-files.md`（ambient module 与 .d.ts 全集）、`02-typescript-cheatsheet.md`、`08-creating-types-from-types.md`

## 1. 模块判定：脚本 vs 模块

TS/ESM 里**有没有模块只看一件事**：文件里是否有**顶层 `import` 或 `export`**（或顶层 `await`）。

| | 脚本（script / 全局文件） | 模块（module） |
|---|---|---|
| 判定 | 无顶层 import/export/await | 有任意一个顶层 import/export |
| 作用域 | 变量、函数进**全局作用域** | 文件级模块作用域，不泄漏 |
| 互相访问 | 靠全局变量（命名冲突高发） | 必须显式导入导出 |
| `this` 顶层指向 | `window`/`globalThis` | `undefined`（ESM 语义） |

```ts
// a-script.ts —— 一个顶层 import/export 都没有
const mode = 'global';      // ⚠️ 泄漏进全局作用域
// 在 b-script.ts 里再声明 const mode 会报 "Cannot redeclare block-scoped variable"
// —— 两个"脚本"共享同一个全局作用域，这就是脚本模式的坑
```

```ts
// a-module.ts
export const mode = 'module';   // 有了顶层 export，此文件是模块，mode 只属于本文件
```

```ts
// isolated.ts —— 文件里没有任何要导出的东西，但想当模块（隔离全局）用：
export {};   // 空导出，最常用的"标记为模块"手法
```

**`moduleDetection: force`**（TS 4.7+）：强制**所有**文件都按模块处理，不再逐文件探测。前端工程（Vite/CRA）推荐开——彻底消灭"手滑写了个脚本文件污染全局"的问题。设置项三值：`auto`（默认，按上述规则探测）/ `force` / `legacy`（<=4.6 行为）。

## 2. ESM 语法全集

### 2.1 命名导出与导入

```ts
// maths.ts
export const pi = 3.14;
export function abs(num: number) { return Math.abs(num); }
export class Random {}
const secret = 42;          // 未导出 → 模块私有
export { secret as answer };// 导出时重命名（声明在前后都行）
```

```ts
// main.ts
import { pi, abs, answer } from './maths.js';   // 具名导入
import { pi as π } from './maths.js';           // 导入时重命名
import * as maths from './maths.js';            // 命名空间导入（整包对象）
import './side-effect.js';                      // 只执行副作用，不取任何绑定
maths.abs(-1);                                  // 通过命名空间访问
```

### 2.2 默认导出

```ts
// hello.ts
export default function helloWorld() { console.log('hi'); }

// main.ts
import helloWorld from './hello.js';   // 默认导出的导入名随意起
```

```ts
// 默认导出的"本名"只在模块内部有意义：
function greet() {}
export { greet as default };
// import whatever from './hello.js' —— whatever 就是 greet
```

> **官方观点**：倾向**命名导出**。默认导出的问题——导入名与导出名失去联系（重构重命名时 IDE 无法全局同步）、一个模块只能有一个、`import * as` 时藏在 `.default` 里。默认导出适合"模块主体只有一个东西"（如一个组件、一个类）。

### 2.3 其他导出形态

```ts
export * from './maths.js';               // 转发全部命名导出（默认导出不转发）
export * as maths from './maths.js';      // 整包转发为命名空间（ES2020 语法）
export { default as greet } from './hello.js';  // 把默认导出改名为命名导出转发
export { pi } from './maths.js';          // 转发但不引入本模块作用域
export type { Cat } from './animal.js';   // 只转发类型（TS 3.8+）
export type * from './animal.js';         // 转发全部类型（TS 5.0+）
```

## 3. import type / export type / 内联 type 修饰符

TS 3.8 引入 `import type`/`export type`，TS 4.5 引入内联 `type` 修饰符。它解决的核心问题是：**类型在编译后不存在，转译器却必须在"不查类型"的前提下决定要不要保留这条 import**。

```ts
// animal.ts
export interface Cat { name: string }
export type Dog = { name: string };
export function createCat(): Cat { return { name: '咪' }; }
```

```ts
// app.ts
import type { Cat, Dog } from './animal.js';        // 整条 import 只引入类型，编译后彻底消失
import { createCat, type CatInfo } from './animal.js';  // 内联修饰（TS 4.5+）：同一个 import 里区分值与类型
```

**为什么在 SWC/Babel/esbuild 下必须写对（`isolatedModules` 的由来）**：

```ts
// config.ts
export interface AppConfig { port: number }
export function loadConfig(): AppConfig { return { port: 3000 }; }
```

```ts
// server.ts
import { AppConfig, loadConfig } from './config.js';  // ⚠️ AppConfig 只在类型位置使用
const c: AppConfig = loadConfig();
```

- 用 `tsc` 编译：TS 知道 `AppConfig` 是类型，编译输出会把它从 import 里**删掉**（或整个 import 若只剩类型则删除）。
- 用 **Babel/SWC/esbuild 单文件转译**：它们**逐文件工作、不做类型分析**，无法判断 `AppConfig` 是类型还是值。保守做法是**保留整条 import** → 编译产物里出现对 `./config.js` 的 require → 引入不必要的运行时依赖（副作用、循环依赖、甚至 `AppConfig is not a function` 之类的运行时错误）。

```ts
// server.ts —— 正确写法
import type { AppConfig } from './config.js';
import { loadConfig } from './config.js';
// 或：import { loadConfig, type AppConfig } from './config.js';
```

**`isolatedModules: true`**：让 tsc 模拟单文件转译器的视角，凡"类型在运行时被当值使用"或"单文件无法安全决定导出形态"的写法直接**编译期报错**（例如重导出类型必须写 `export type`、`const enum` 跨文件受限）。凡是用 Babel/SWC/esbuild 的项目（Vite、Next、Nest + SWC）都应开。**`verbatimModuleSyntax`**（TS 5.0+，取代 `importsNotUsedAsValues`/`preserveValueImports`）：更激进——import/export 语句**原样保留**，只有显式写了 `type` 的部分会被删，杜绝转译器猜。

> 坑：`import type` 引入的绑定**只能用于类型位置**，当值用（调用、new、typeof 值位置）直接报错——这是刻意的保护。

## 4. export = 与 esModuleInterop：历史包袱

TS 早期（ESM 标准化之前）发明了一套自己的模块语法，对齐当时的 CommonJS/AMD：

```ts
// legacy-cjs.ts —— export =：TS 独有，直接等于 module.exports
const maths = { pi: 3.14, abs: Math.abs };
export = maths;

// importer.ts —— 配套的导入语法（必须 module: commonjs 等非 esnext 输出）
import maths = require('./legacy-cjs');   // import = require 成对出现
console.log(maths.abs(-5));               // 5
```

**关键规则**：`export =` 只能用 `import x = require()` 或（不开 interop 时）`import x = require` 形态消费；若用 `import x from`，必须开 `esModuleInterop`。反过来，输出为 `esnext` 等 ESM 格式时，`import = require` 直接报错（`Import assignment cannot be used when targeting ECMAScript modules`）。

```ts
// interop.ts —— esModuleInterop: true 后，CommonJS 也能用默认导入
import express from 'express';   // express 本身是 CJS 模块（module.exports = createApp）
const app = express();
```

> 现代结论：新代码一律写标准 ESM；`export =` 只出现在老库的 .d.ts（如 `@types/node` 部分模块）与遗留代码里，看懂即可。`@types/node` 里的 fs 等模块同时提供 ESM 类型与 `export =` 形态，`module: node16+` 下按导入路径/包 exports 自动选。

## 5. re-export 与 barrel index（性能坑专题）

barrel（桶文件）即 `index.ts` 聚合导出，是 re-export 的主要用途：

```ts
// src/utils/index.ts（barrel）
export { formatDate } from './format-date.js';
export { deepClone } from './deep-clone.js';
export * from './math.js';

// src/main.ts
import { formatDate } from './utils/index.js';   // 用户体验好：一条路径拿所有工具
```

**官方 Modules 文档明确提示了 barrel 的三个代价**，大项目里是实打实的性能问题：

1. **编译/类型检查变慢**：`utils/index.ts` 被几百个文件 import，它 re-export 的每个文件都会被拉进程序。改一个叶子文件，所有"经过 barrel 的引用链"都要重新检查；`--incremental` 的重检查面也变大。
2. **启动/打包性能**：运行时必须加载整个 barrel 才能取一个绑定；Web 应用里 barrel 常把几十个模块拖进同一个 chunk，**削弱代码分割**。
3. **tree-shaking 变差**：barrel 若最终打到 CJS 产物或带副作用的模块，bundler 不敢删"看起来可能有用"的部分。生态事实标准是 package.json 里声明 `"sideEffects": false`（或精确列出有副作用的文件）给打包器放行。

**循环依赖陷阱**：barrel 是制造循环引用的头号嫌犯——`a.ts` import barrel、barrel 里 `b.ts` 又 import `a.ts`，模块初始化顺序错乱后拿到 `undefined`。

> 实践建议：中小项目 barrel 随便用；大仓（尤其 monorepo）内部互相引用**走具体文件路径或子包的 package.json exports**，barrel 只放在"对外发布"的入口。Nest monorepo 的库路径别名见 `/Users/hh/offer/技术文档/nest/08-cli/libraries.md`。

## 6. 动态 import()：类型化与代码分割

```ts
// lazy.ts —— import() 返回 Promise<模块命名空间>，且类型是"typeof import(路径)"
type HeavyModule = typeof import('./heavy.js');

async function loadHeavy(): Promise<HeavyModule> {
  return import('./heavy.js');       // 静态可分析 → bundler 在此切 chunk
}

const { heavyFn } = await import('./heavy.js');  // 解构出来的绑定带完整类型
heavyFn();

// 默认导出：const mod = await import('./hello.js'); mod.default();
```

要点：

- **代码分割**的官方入口：Webpack/Vite/Rollup 见到 `import('字面量路径')` 自动拆 chunk；路径必须是**静态字符串**（变量路径不会被分析，可用模板前缀 + 括号模式做批量动态）。
- 顶层 `await import(...)` 在模块内合法（模块支持顶层 await，脚本不行）。
- 与 `satisfies`/类型标注配合可显式约束 chunk 契约：`const mod = (await import('./heavy.js')) satisfies HeavyModule;`
- Node 场景等价于把"同步 require 换成异步加载"；`20-tsx-and-runtime.md` 里的运行时对动态 import 的 ESM/CJS 处理略有差异，排查加载失败先看文件扩展名与 module 格式是否匹配。

## 7. CommonJS 互操作：产物结构与两个 interop 选项

### 7.1 CJS 模块的"默认导出"到底长什么样

```js
// 编译产物视角：TS 的 export default 编译成 CJS 是——
exports.default = helloWorld;
module.exports = __esModule 标记 + 各命名导出 + default
```

于是出现经典的"双层包裹"问题：从 ESM 语法消费 CJS 包时，`mod` 可能是 `{ default: [Function: createApp], ... }`，`import app from 'express'` 不开 interop 时拿到的是整个 `module.exports` 而非函数。

### 7.2 esModuleInterop 的运行时原理

开启后 TS 在编译产物里注入两个助手函数（简化版）：

```js
// __importDefault：对 CJS 模块，把 module.exports 包成 { default: module.exports }
var __importDefault = (mod) => (mod && mod.__esModule ? mod : { default: mod });

// __importStar：属性平铺进命名空间，原对象挂到 default 上
var __importStar = (mod) =>
  mod && mod.__esModule ? mod
    : { ...复制所有可枚举属性, default: mod };
```

```ts
// interop-demo.ts（esModuleInterop: true）
import _ from 'lodash';            // _ === module.exports（CJS）→ __importDefault 包一层取 default
import * as ns from 'lodash';      // ns.default === module.exports，其余属性被平铺
```

不开 interop 时：`import _ from 'lodash'` 直接报错（TS2322：无默认导出），`import * as ns` 得到的命名空间**可被调用**（TS 会把 `ns` 当成 `typeof require('lodash')`）——这正是 interop 要修的历史怪相。

### 7.3 allowSyntheticDefaultImports vs esModuleInterop

| | `allowSyntheticDefaultImports` | `esModuleInterop` |
|---|---|---|
| 类型检查层：允许 `import x from` 消费无默认导出的 CJS | ✅ | ✅（内含此行为） |
| 编译产物注入 `__importStar/__importDefault` | ❌（只骗类型，不改 emit） | ✅ |
| 修正 `import * as ns` 命名空间语义（不可调用） | ❌ | ✅ |
| 适用场景 | 打包器/Babel 已做 interop，只需 TS 放行 | tsc 直出 Node 代码 |
| 隐含开启 | `esModuleInterop` 开时自动开 | — |

> 结论：**tsc 直出必开 `esModuleInterop`；Babel/SWC 打包体系下它不影响产物（打包器自己做 interop），但类型层仍需要它（或 allowSyntheticDefaultImports）放行默认导入。** 见 `11-tsconfig.md` 模块组。

## 8. 模块解析策略对比：classic / node10 / node16 / nodenext / bundler

"解析"= 把 `import 'lodash'` 这样的说明符变成具体文件。TS 有 5 代策略，**必须与 `module` 配对使用**（详见 `11-tsconfig.md` 配对表）：

| strategy | 现名 | 相对路径要扩展名? | 认 package.json exports? | node_modules 查找 | 适用场景 |
|----------|------|------------------|--------------------------|-------------------|----------|
| `classic` | — | 不需要 | ❌ | ❌（只找同名 .ts/.d.ts） | 无 `module` 配置的遗留默认（amd/system 等）；几乎只出现在老项目 |
| `node10` | 旧名 `node` | 不需要（.js 也可） | ❌ | node_modules 逐级向上 + index.js 兜底 | tsc 直出 CJS 的老 Node 项目；大量旧库类型按它发布 |
| `node16` | — | **必须写 .js/.cjs/.mts** | ✅ | Node ESM 精确规则 | 真正跑在 Node16+ 的双格式项目（module: node16） |
| `nodenext` | — | 同 node16 | ✅ | 同 node16（跟随最新 Node 行为） | Node 新项目（module: nodenext） |
| `bundler` | — | 不需要（可省 .js） | ✅（且解析相对更宽松，如支持目录 index、扩展名补全） | 类 node10 + 打包器友好 | **所有走打包器的 Web 工程**（Vite/Next/webpack），配 `module: esnext` |

要点与坑：

1. **node16/nodenext 下相对导入必须带扩展名**：`import { x } from './utils'` 报错，要写 `'./utils.js'`——因为 TS 按编译产物去模拟 Node 真实解析（产物里是 `utils.js`）。源文件是 .ts 却写 .js 是特性不是 bug。
2. **bundler 是 TS 5.0 专为打包器时代加的**：既享受 exports/子路径解析，又不用写扩展名；配 `allowImportingTsExtensions`（TS 5.0+）还能直接 import './x.ts'（需 noEmit 或 emitDeclarationOnly）。
3. **包的解析入口**：node10 看 `package.json` 的 `main` + `types` 字段；node16+/bundler 看 `exports` 字段（下节）。
4. 环境无关的"虚拟目录"用 `rootDirs`；别名用 `baseUrl`+`paths`（它们只影响 **TS 类型解析**，运行时靠 bundler/Jest/Nest 的对应映射——两边必须同步配，见 `11-tsconfig.md` 路径组）。

## 9. package.json exports 与 TS 联动

现代包用 `exports` 同时声明运行时入口与类型入口，TS 的 node16/nodenext/bundler 策略都认它：

```json
// node_modules/some-pkg/package.json
{
  "name": "some-pkg",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",   // ← types 条件：TS 专用，建议放第一个
      "import": "./dist/index.mjs",   // ESM 消费者
      "require": "./dist/index.cjs"   // CJS 消费者
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "import": "./dist/utils.mjs"
    }
  }
}
```

```ts
import main from 'some-pkg';           // 走 "." → 类型来自 dist/index.d.ts
import { helper } from 'some-pkg/utils';  // 走子路径 "./utils" → dist/utils.d.ts
// ⚠️ exports 里没列的子路径一律不可 import（即使文件真实存在）——ts7016 或 "cannot find module"
```

规则要点：

1. **`types` 条件必须放最前**（或用顶层 `"types"` 字段），否则 Node/打包器可能先命中 `import` 条件，TS 拿错类型或报"无类型"。
2. **typesVersions**（exports 之前的老机制）：给不同 TS 版本发不同 .d.ts（如新版本用了新语法时给旧 TS 兜底），现在多见于老库；见到不慌，知道是"按 TS 版本选类型文件"即可。
3. **双格式包的坑**：同一包同时可被 ESM 和 CJS 引用（双实例、`instanceof` 失效）。类型上 TS 用 `.d.mts`/`.d.cts` 与 `module: node16` 精确匹配消费端格式；发库的工程细节见 `17-engineering-tsup-vitest.md`。
4. 自己发库时 types 字段/exports 的完整清单见 `21-declaration-files.md`。

## 10. namespaces vs modules：namespace 还有什么用

`namespace` 是 TS 在 ESM 普及前发明的模块化方案（旧称 internal module）：

```ts
// validation.ts
namespace Validation {
  export interface StringValidator { isAcceptable(s: string): boolean }
  export class LettersOnly implements StringValidator {
    isAcceptable(s: string) { return /^[a-z]+$/i.test(s); }
  }
}

const v = new Validation.LettersOnly();   // 消费不需要 import（同一文件/全局脚本时）
```

**定位**：官方早已建议新代码用 ES Modules（对齐 JS 标准、可摇树、可按文件懒加载）。namespace 保留的合理场景：

1. **全局脚本**（无打包器、`<script>` 直引的环境）：无模块系统可用，namespace 是唯一的组织手段；
2. **声明文件**（.d.ts）里组织类型：`declare namespace NodeJS { ... }`，DefinitelyTyped 大量使用；
3. 极少数需要**运行时命名空间对象**又有全局需求的旧代码。

```ts
// 全局扩展声明（给已有命名空间补成员）—— .d.ts 场景
declare namespace NodeJS {
  interface ProcessEnv { APP_ENV: 'dev' | 'prod' }
}
```

> 坑：模块文件里写 namespace 不会"变成 ESM"，两者可混用但语义易混；`declare global`（在模块内给全局作用域补类型）是现代替代方案，写法见 `21-declaration-files.md`。

## 11. ambient module 声明：declare module 'pkg'

"环境模块"= **不经过解析、直接断言某个说明符存在且有这些成员**，两大用途：

```ts
// 1) 给无类型的 JS 包补最小声明（shorthand，官方写法）：
declare module 'untyped-pkg';
// 之后 import x from 'untyped-pkg' 拿到的 x 是 any——先跑起来，再逐步补全

// 2) 完整声明（自写类型或修正三方库类型）：
declare module 'untyped-pkg' {
  export function track(event: string, props?: Record<string, unknown>): void;
  export const version: string;
}
```

放置位置：项目里任意 `.d.ts`（或被 include 的 .ts），**该文件自身必须是模块或脚本均可**——脚本形式（无 import/export）声明的 ambient module 对全局可见。与 `moduleDetection`、`types` 目录、`/// <reference types>` 的关系，以及 wildcard 声明（`declare module '*.svg'`）等完整展开见 `21-declaration-files.md`。

## 12. 常见坑速查

| 现象 | 原因 | 解法 |
|------|------|------|
| `Cannot redeclare block-scoped variable` | 两文件都是脚本，共享全局 | 各自加 `export {}` 或开 `moduleDetection: force` |
| SWC/Babel 产物里出现多余的 require | 类型导入没写 `type` 修饰符 | `import type` / 内联 `type` + `isolatedModules` |
| `import x = require(...)` 在 esnext 下报错 | TS 专有语法不能进 ESM 产物 | 改标准 ESM，或 `esModuleInterop` + default import |
| nodenext 下 `./utils` 找不到模块 | 相对路径必须带扩展名 | 写 `'./utils.js'`（指向编译产物名） |
| `import pkg/sub` 报 cannot find module | 包 exports 未声明该子路径 | 查包 exports，或换声明过的入口 |
| barrel 改一个文件全项目重编译 | index.ts 聚合了所有引用链 | 大仓内改走具体路径/子包入口 |
| 循环依赖拿到 undefined | barrel/模块互相引用顺序错乱 | 拆 barrel、延迟 require、重新分层 |
| CJS 包默认导入拿到 `{ default: fn }` 双层包裹 | interop 未开或格式不匹配 | 开 `esModuleInterop`；确认消费端格式与包产物一致 |
| `export default` 的类/函数重构改不动导入名 | 默认导出与名字解耦 | 团队规范倾向命名导出 |

## 13. 一句话总结

> 顶层有 import/export 就是模块（否则是泄漏全局的脚本，`export {}` 或 `moduleDetection: force` 兜底）；ESM 语法之外记住三组"TS 特产"——`import type` 内联 type 修饰符（单文件转译器时代的生存技能）、`export =`/`import = require`（历史包袱，看懂即可）、CommonJS 互操作靠 `esModuleInterop` 的 `__importStar/__importDefault`；解析策略按运行环境选：tsc 直出用 nodenext（相对路径带扩展名）、打包器用 bundler、老项目 node10，包的入口由 package.json `exports` 的 `types` 条件决定；barrel 好用但大仓要节制（编译面、代码分割、tree-shaking、循环依赖四宗罪），namespace 与 ambient module（`declare module 'pkg'`）各退守到脚本场景与 .d.ts 声明——后者在 `21-declaration-files.md` 全集展开。
