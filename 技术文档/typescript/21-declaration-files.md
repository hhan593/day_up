# 21. 声明文件与 @types 生态（.d.ts / declare 全家 / 三斜线指令 / module augmentation）

> 来源可信度：**官方文档确认**（TypeScript Handbook「Declaration Files」「Modules Reference」+ tsconfig Reference；TS 5.9 时代行为为准，个别库的模块路径与 API 处标注「以官方文档为准」）
> 关联：`10-modules.md`（模块解析）、`11-tsconfig.md`（include/types/typeRoots）、`07-enums.md`（ambient enum）、`17-engineering-tsup-vitest.md`（发布 d.ts 的工程化）、`23-error-debugging.md`（TS7016 等报错解读）、`24-ts-with-react.md`（R3F/React 的 JSX 类型扩展）；Node 侧 `20-tsx-and-runtime.md`（类型擦除视角）

## 1. 为什么需要声明文件：类型与实现分离

- 一个 TS 库发布后，使用者拿到的是 **JS（运行时）** + **d.ts（类型）** 两份东西。`tsc` 编译 `foo.ts` 的产物是 `foo.js`；再开 `declaration: true` 会额外产出 `foo.d.ts`（见 `11-tsconfig.md`）。

```bash
# 编译产物视角
npx tsc src/foo.ts --declaration --outDir dist
# dist/
#   foo.js    ← 运行时代码（Node/浏览器真正执行的东西）
#   foo.d.ts  ← 类型目录：只描述「有哪些导出、什么形状」，零运行时代码
```

```ts
// src/foo.ts —— 你写的源码
export function add(a: number, b: number): number {
  return a + b;
}
```

```ts
// dist/foo.d.ts —— tsc 自动生成的声明文件（不需要你手写）
export declare function add(a: number, b: number): number;
```

- `.d.ts` 的天条：**只能写类型，不能写实现**。在里面写函数体会直接报错：

```ts
// bad.d.ts
function add(a: number, b: number): number {
  return a + b;   // 报错 TS1183: An implementation cannot be declared in ambient contexts
}
```

- 三种类型的来源（可靠性从高到低）：**手写/生成的 .d.ts** > **编辑器对 .js 的临时推断**（没写对时不可信）> **没有任何类型**（`any`，报 TS7016，见 `23-error-debugging.md`）。

## 2. 识别声明文件：.d.ts vs .ts

| 后缀 | 角色 | 有无运行时输出 |
|---|---|---|
| `.ts` | 源码/业务代码 | 有（编译后产出 JS） |
| `.d.ts` | 纯类型声明（ambient） | **永远没有**（tsc 直接跳过 emit） |
| `.d.mts` / `.d.cts` | ESM / CJS 专属声明（`node16`/`bundler` 解析下区分导入形态） | 没有 |

- 你日常会遇到的 `.d.ts` 四类：
  1. `node_modules/@types/**`（DefinitelyTyped 发布的社区类型，见第 6 章）；
  2. 包内自带：`node_modules/pkg/index.d.ts`（包作者自己发的，见第 9 章）；
  3. 项目级全局声明：`src/global.d.ts`、`src/vite-env.d.ts`；
  4. 库作者打包产物：`dist/index.d.ts`（tsup/tsc 生成，见 `17-engineering-tsup-vitest.md`）。
- 在 `.d.ts` 文件里，**顶层的 `declare` 可以省略**——整个文件默认就是「环境声明」语境：

```ts
// types/legacy.d.ts —— 下面三行都不用写 declare 前缀
const CDN_HOST: string;
function trackEvent(name: string, payload?: Record<string, unknown>): void;
class LegacyBridge { init(): void; destroy(): void; }
```

- 常见坑：**别把业务代码写进 `.d.ts`**。它没有 JS 输出，「删了实现还在报错/运行没效果」十有八九是因为代码写在 d.ts 里被别人引用着。

## 3. declare 全家逐个详解

`declare` 的语义是「**这个值/类型在别处已存在，编译器你直接信我**」——它不生成任何 JS。运行时若真的不存在，TS 不会救你（信任鸿沟，见 `23-error-debugging.md` 第 12 章）。

### 3.1 declare const / let / var：全局变量

```ts
// types/globals.d.ts —— 由 <script> 注入的全局配置
declare const __APP_VERSION__: string;          // 常量（打包器 DefinePlugin 注入）
declare let currentUser: { id: number };        // 可变全局
declare var legacyGlobal: any;                  // var 与 let 等价，老代码风格
```

### 3.2 declare function：全局函数（含重载）

```ts
// types/globals.d.ts
declare function gtag(...args: unknown[]): void;

// 带重载的声明：声明列一组签名，最后一个签名才是「实现位」（也允许省略）
declare function format(input: string, width: number): string;
declare function format(input: string, options: { pad?: 'start' | 'end' }): string;
```

### 3.3 declare class：外部类

```ts
// types/vendor.d.ts —— 一个只提供压缩 JS 的类
declare class Greeter {
  constructor(prefix: string);
  greet(name: string): string;
  static version: string;
}

const g = new Greeter('Hi, ');   // 类型齐了；运行时必须真的有 window.Greeter
g.greet('hh');
```

### 3.4 declare enum：环境枚举

```ts
// types/status.d.ts —— 运行时对象由后端/旧 JS 提供
declare enum Status {
  Idle,          // 0
  Running,       // 1
}
const s: Status = Status.Running;   // 编译期可用；运行时 Status 必须已存在
```

> ambient enum 在 `isolatedModules` 下的坑与普通 enum 一起写在 `07-enums.md`；现代代码更推荐 `as const` 对象替代（同样见 07 篇）。

### 3.5 declare namespace：组织声明的旧式容器

```ts
// types/chart.d.ts —— 老式 UMD 库的典型形状
declare namespace ChartLib {
  interface Options { width: number; height: number }
  function render(el: HTMLElement, options: Options): void;
  const version: string;
}
```

- namespace 本质是「带命名的对象类型 + 值的合并声明」，可以与同名 interface/class/函数做**声明合并**（见 `10-modules.md` 的 namespaces 一章）。

### 3.6 declare module：给无类型的包补类型（ambient module）

```ts
// 两种形态：
declare module 'my-legacy-lib';          // shorthand：整个包变 any（应急用）
declare module 'my-legacy-lib' {         // 完整形态：描述导出（第 5 章实战）
  export function hello(): void;
}
```

### 3.7 declare global：在模块文件里往全局塞声明

```ts
// src/types/window.d.ts —— 模块文件（有 import/export）想改全局，必须包 declare global
export {};

declare global {
  interface Window {
    __APP_CONFIG__: { apiBase: string };
  }
}
```

- 为什么必须有它：模块文件里的顶层声明被模块系统「隔离」，不再自动进全局；`declare global` 是唯一的正规逃生口（第 8 章详述）。

### 3.8 补充：`export as namespace`（UMD 全局名）

```ts
// 库作者视角：让包既能 import 又能 <script> 全局用
export as namespace ChartLib;   // 全局名；仅在「脚本文件」里可用该全局，模块里仍要 import
```

## 4. 三斜线指令：编译器级的依赖声明

三斜线指令是写在**文件最顶部**（前面只允许注释）的单行 XML 注释，指导编译器拉入依赖：

```ts
// scripts/worker.d.ts —— 三种常用指令
/// <reference types="node" />      // 引入 @types/node 的【全局】类型（process、Buffer…）
/// <reference lib="es2022" />      // 等价于 tsconfig 里 target/lib 的局部补充
/// <reference path="./custom.d.ts" />  // 手动拉入另一个声明文件（现在很少用了）
```

- **`types` 指令 vs `import type` 的关系**（高频混淆点）：

| | `/// <reference types="pkg" />` | `import type { X } from 'pkg'` |
|---|---|---|
| 依赖层级 | 编译器级：拉入 @types/pkg 的**全局注入**（如 Node 的全局变量） | 模块级：只拿 `X` 这个导出符号，进入文件依赖图 |
| 产生 JS | 不产生 | 不产生（见 `10-modules.md` import type） |
| 适用场景 | 全局类型注入（vite/client、jest-dom 的全局 matchers） | 只要某几个类型（绝大多数情况） |

- 经典实例——Vite 项目脚手架自动生成的：

```ts
// src/vite-env.d.ts —— 把 vite/client 的全局类型（import.meta.env 等）注入项目
/// <reference types="vite/client" />
```

- 决策口诀：**能 `import` 就 `import`；只有「全局注入」才用三斜线或 tsconfig 的 `types` 字段**（`11-tsconfig.md`）。TS 5 时代 `path` 引用基本被模块解析与打包工具取代，只在手写多文件 d.ts 时偶用。

## 5. 实战：为无类型的 CJS npm 包手写 d.ts

场景：`my-legacy-lib` 是个 2018 年的包，只发一个 CommonJS 的 `index.js`，没有类型。`import` 它直接报 TS7016（见 `23-error-debugging.md`）。

```bash
# 复现报错
cat node_modules/my-legacy-lib/package.json   # 没有 "types"，也没有 index.d.ts
```

```js
// node_modules/my-legacy-lib/index.js（真实形状，先读源码再写声明）
class Client {
  constructor(options) { /* { baseURL, retries?, timeoutMs? } */ }
  request(path, options) { /* 返回 Promise，resolve 响应 JSON */ }
  get(path) { /* 快捷方法，返回 Promise<any> */ }
}
function createRetryQueue(task, options) {
  // 返回 { push(task), drain(): Promise<结果数组> }
}
module.exports = { Client, createRetryQueue, VERSION: '1.0.0' };
```

### 5.1 方案 A：项目内补一份声明（推荐）

```ts
// types/my-legacy-lib.d.ts —— 模块名必须与 import 的裸名完全一致
declare module 'my-legacy-lib' {
  export interface ClientOptions {
    baseURL: string;
    retries?: number;     // 默认 3，以 README 为准
    timeoutMs?: number;
  }

  export class Client {
    constructor(options: ClientOptions);
    /** 发请求并解析为 T；越具体的 T 由调用方指定 */
    request<T>(path: string, options?: { signal?: AbortSignal }): Promise<T>;
    /** 快捷 GET：返回体结构未知，保守给 unknown（不要 any，见 13 篇） */
    get(path: string): Promise<unknown>;
  }

  export interface RetryQueue<T> {
    push(task: () => Promise<T>): void;
    drain(): Promise<T[]>;
  }

  // 函数重载：不同参数形状返回不同类型（重载语法见 05-more-on-functions.md）
  export function createRetryQueue<T>(
    task: () => Promise<T>,
    options?: { maxRetries?: number; parallel?: 1 | 2 | 4 }
  ): RetryQueue<T>;

  export const VERSION: string;
}
```

```ts
// src/app.ts —— 立刻有完整提示与检查
import { Client, createRetryQueue, VERSION } from 'my-legacy-lib';

const client = new Client({ baseURL: 'https://api.example.com' });
const user = await client.request<{ id: number }>('/me');
const queue = createRetryQueue(() => fetch('/x').then((r) => r.json() as Promise<number>));
console.log(VERSION);
```

别忘把 `types/` 纳入 tsconfig 的 include（见 `11-tsconfig.md`）：

```jsonc
// tsconfig.json
{
  "include": ["src", "types"]   // types/my-legacy-lib.d.ts 被纳入编译
}
```

### 5.2 方案 B / C

```ts
// types/shim.d.ts —— 应急：整个包 any（会传染，尽快替换成方案 A）
declare module 'my-legacy-lib';
```

- 方案 C（长期正道）：给上游提 PR 自带类型，或向 **DefinitelyTyped** 仓库提交 `@types/my-legacy-lib`。
- 常见坑：
  1. `declare module 'my-legacy-lib'` 的名字必须与导入名**逐字符一致**（含大小写）；
  2. 子路径导入要单独声明，或用通配符：`declare module 'my-legacy-lib/*';`；
  3. 全局兜底 `declare module '*';` 能让所有报错消失，但等于全局关掉模块检查——禁止在正式项目使用。

## 6. @types 机制：DefinitelyTyped 与解析优先级

- **DefinitelyTyped**（DT）是 GitHub 上的社区仓库，发布的 npm 包统一叫 `@types/<pkg>`：

```bash
npm i -D @types/node       # Node 内置模块类型
npm i -D @types/express    # express 的类型（express 本体不含类型时的官方配套）
```

- 当你 `import pkg from 'pkg'` 时，TS 找类型的顺序（`10-modules.md` 的解析细节）：
  1. `node_modules/pkg/package.json` 的 **`types` / `typings` 字段**；
  2. 没有 → 找 `main` 指向的 js 的**同名 .d.ts**（`main.js` → `main.d.ts`）；
  3. 再没有 → 包根的 `index.d.ts`；
  4. 最后 → **`node_modules/@types/pkg`**。
- 若包用了 `exports` map，`types` condition 要写在最前：

```jsonc
// 包作者视角的 package.json
{
  "name": "my-lib",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",   // 类型入口必须第一个
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

- **tsconfig 的 `types` / `typeRoots`**（`11-tsconfig.md` 详解）：默认把 `node_modules/@types` 下**所有**包的全局声明注入项目；`"types": ["node", "vite/client"]` 改成白名单（能显著减少全局污染与编译时间），`"types": []` 全关。

- **`typesVersions` 版本分流**（包作者用）：同一份包按**使用者的 TS 编译器版本**给出不同类型：

```jsonc
// pkg/package.json —— TS >= 4.8 用新类型，老版本用降级目录
{
  "name": "pkg",
  "version": "1.2.3",
  "types": "./index.d.ts",
  "typesVersions": {
    ">=4.8": { "*": ["ts4.8/*"] },
    "<4.8":  { "*": ["ts3.4/*"] }
  }
}
```

- 注意键是 **TS 版本范围**（不是包自己的版本）；`@types` 包的版本号对齐实现包（`@types/express@4.17.x` 配 `express@4.17.x` 时代），patch 可能领先——锁版本时两边一起看。
- 装了 `@types/pkg` 却没生效的排查顺序：tsconfig `types` 白名单漏了它 → `typeRoots` 被改 → 包本身有自带类型（优先级更高，见上面顺序 1–3）。

## 7. Module augmentation 实战两例

原理：**interface 声明合并**。同名 interface 自动合并成员——这就是扩展点必须是 `interface` 而不能是 `type` 的原因（`type` 不可合并，见 `03-everyday-types.md` 的 type vs interface 对比）。

规则三条：
1. 做扩展的文件**必须是模块**（有 import 或 export）；
2. 只能扩展 `interface`（以及 namespace/class 的形状），不能扩展 type alias；
3. 模块内扩展全局命名空间要用 `declare global`（第 8 章）。

### 7.1 例一：给 Express 的 Request 加 user 属性

```ts
// src/types/express.d.ts —— 登录中间件挂的用户信息
import 'express';   // 让本文件成为模块，并触发 @types/express 类型加载

declare global {
  namespace Express {      // @types/express 里已声明的全局命名空间，这里合并进它
    interface Request {    // 与既有 Request interface 合并
      user?: { id: number; name: string };
    }
  }
}
```

```ts
// src/middleware/auth.ts —— 使用侧
import type { NextFunction, Request, Response } from 'express';

export function auth(req: Request, res: Response, next: NextFunction) {
  req.user = { id: 1, name: 'hh' };   // 有类型提示，不再是 any
  next();
}

export function meHandler(req: Request, res: Response) {
  res.json(req.user?.id);   // 收窄安全使用
}
```

### 7.2 例二：给 Konva 的 Node 补自定义方法（原型补丁 + 类型合并）

你有 Konva/Three.js 背景，这类「库在运行时动态加方法」的场景很典型：Konva 允许往 `Konva.Node.prototype` 挂自定义方法，但类型不知道。两步补齐：

```ts
// src/types/konva-augment.d.ts —— 第一步：类型合并
import 'konva/lib/Node';   // 模块路径以所用 Konva 版本的类型入口为准

declare module 'konva/lib/Node' {
  interface Node {         // 与 Konva.Node 的类接口合并
    flash(times?: number): void;
  }
}
```

```ts
// src/konva-flash.ts —— 第二步：运行时真正挂上方法
import Konva from 'konva';

Konva.Node.prototype.flash = function (this: Konva.Node, times = 2) {
  let n = 0;
  const iv = setInterval(() => {
    this.opacity(this.opacity() === 1 ? 0.3 : 1);
    if (++n >= times * 2) { clearInterval(iv); this.opacity(1); }
  }, 200);
};

const circle = new Konva.Circle({ radius: 40, fill: 'red' });
circle.flash(3);   // 类型与运行时都对上了
```

> 同一机制支撑 React-Three-Fiber 给 JSX 注入 three 元素（`<mesh>`、`<ambientLight>`）：那就是对 `JSX.IntrinsicElements` / `ThreeElements` 的 module augmentation，原理拆解见 `24-ts-with-react.md` 第 9 章与 `Three.js/21-React-Three-Fiber.md`。

### 7.3 augmentation 排错清单

- 扩展没生效：文件没被 tsconfig include → 模块名/命名空间名对不上 → 扩展的是 `type` 而非 `interface` → 文件不是模块（缺 import/export，导致进全局但目标在模块里）。

## 8. 全局脚本污染：脚本能看到的，模块未必看得到

- `10-modules.md` 的结论在这里再次生效：**没有 import/export 的文件是「脚本」**，顶层声明直接进全局作用域；**模块文件的顶层声明被隔离**。

```ts
// bad.d.ts —— 脚本文件，顶层声明全部进全局
declare const name: string;
// 报错 TS2300: Duplicate identifier 'name'.
// Library 'lib.dom.d.ts' files also declare 'name'  ← 与 DOM 的 window.name 撞了
```

- 模块里想贡献全局类型，只有一条路 `declare global`（对比：脚本文件里直接写 interface 就行）：

```ts
// src/types/window.d.ts（模块写法）
export {};                       // 兜底把它变成模块；有真实 import 可省
declare global {
  interface Window { __APP_CONFIG__: { apiBase: string } }
}
```

```ts
// src/types/window-script.d.ts（脚本写法，效果相同，二选一）
interface Window { __APP_CONFIG__: { apiBase: string } }
```

- 风险治理：全局注入越少越好——全局 interface 合并是**隐式跨文件生效**，谁改了谁都不知道；起名加业务前缀（`AppConfig` 而非 `Config`）；`vite-env.d.ts`、`jest-dom` 这类脚手架自带的全局注入属合理例外。面试常问「为什么模块里 declare 不生效」——答案就是本章的脚本/模块二分 + `declare global`（延伸题见 `14-typescript-interview-questions.md`）。

## 9. 发布类型：包内自带 vs @types 单独发

| 维度 | 包内自带（推荐） | @types 单独发 |
|---|---|---|
| 版本同步 | 与实现同版本号，天然一致 | 依赖 DT 维护者同步，可能滞后 |
| 适用 | 自己的库、能改上游 | 包作者不配合 / 修补第三方 |
| 消费者体验 | `npm i pkg` 即用 | 需再装 `npm i -D @types/pkg` |
| 入口配置 | `types` 字段 + `exports.types` | 无需实现包配合 |

- 自带发布的标准链路：`tsc --declaration` 或 tsup `--dts`（`17-engineering-tsup-vitest.md` 有完整 tsup 配置），产物 `dist/index.js + dist/index.d.ts`，package.json 按第 6 章的 exports 写法指过去，`files` 里带上 `dist`。
- 给 DT 单独发类型的流程：fork DefinitelyTyped → `types/pkg/index.d.ts` → 跑 DT 的测试（`dtslint` 风格）→ PR。日常项目里只是「临时补类型」就用第 5 章的项目内方案，不必发包。

## 10. JSDoc + checkJs：从 JS 生成类型的另一条路线

不想整体迁 TS？让 TS 编译器直接检查 JS，并用 JSDoc 注释提供类型，最后**从 JS 生成 d.ts**：

```js
// src/math.js —— 纯 JS 项目（checkJs 开启后编辑器直接标红）
/** 两个数相加
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function add(a, b) {
  return a + b;
}

/** @typedef {{ id: number, name: string }} User */
```

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "allowJs": true,             // 让 tsc 处理 .js
    "checkJs": true,             // 对 .js 做类型检查（等价于每个文件顶部 // @ts-check）
    "declaration": true,         // 生成 .d.ts
    "emitDeclarationOnly": true, // 只要 d.ts，别产出 js（发布仍走原构建）
    "outDir": "dist-types"
  },
  "include": ["src/**/*.js"]
}
```

```bash
npx tsc
# dist-types/math.d.ts —— 自动生成：
# export declare function add(a: number, b: number): number;
```

- TS 5.5 起对 JS 的推断进一步增强（如从 JSDoc/函数体推断类型谓词，见 `15-typescript-new-features.md`）。
- 适用判断：渐进迁移、老库不想动构建、给 JS 项目补「半份类型」。彻底方案仍是迁 `.ts` + 走第 9 章的发布链路。
- 辅助工具：DT 官方的 `dts-gen` 可以对现成包生成 d.ts 骨架（再手修），比空白好写。

## 11. 一句话总结

> .d.ts 是「只描述、不实现」的类型目录，编译器靠它把 JS 世界接进类型系统：包作者用 `declaration: true` 随包发 d.ts，第三方缺口用 `declare module` 手写、用 `@types` 生态兜底；`declare` 全家（const/function/class/enum/namespace/module/global）声明「别处已存在」，三斜线指令负责全局类型注入，interface 合并机制支撑 Express Request、Konva Node、JSX 元素这类 module augmentation；脚本与模块的作用域二分决定了「全局要靠 declare global，污染要靠 types 白名单」；最后，JSDoc + checkJs + declaration 提供了不迁 TS 也能产出类型的退路——记住红线：d.ts 永远没有运行时输出，declare 了运行时不存在的东西，TS 不会替你兜底。
