# 20. TSX 运行时与 TS 直接执行（Node 原生类型擦除 / tsx / ts-node / 别名方案）

> 来源可信度：**官方文档确认**（Node.js 官方「Modules: TypeScript」文档 + tsx/ts-node 官方 README；Node 原生支持以 22.x/24/26 时代现状为准，版本敏感处标注「截至 2026-11」）
> 关联：`11-tsconfig.md`（erasableSyntaxOnly、module/moduleResolution）、`10-modules.md`（exports/imports 字段解析）、`17-engineering-tsup-vitest.md`（编译发布轨道）；Node 侧 `node/04-modules-cjs-esm.md`（ESM 语义）、`node/15-bun-deno-fullstack.md`（Deno/Bun 详见）、`node/13-node-test.md`（node:test 跑 .ts）

## 1. 为什么需要「TS 运行时」

- Node 只认 JS。执行 TS 历来三条路：**先编译再跑**（tsc/tsup 出 js）、**运行时转译**（loader 在 import 时即时转）、**原生类型擦除**（Node 自己在加载时剥掉类型）。
- 理解一条主线：**类型擦除 ≠ 类型检查**。所有「直接跑 .ts」的方案都不做类型检查——跑得再欢，类型错误也可能在。类型门禁永远在 tsc（编辑器 + CI 的 `tsc --noEmit`），见 `11-tsconfig.md` 第 1 章。
- 2024–2026 的行业变化：Node 自己把「转译 TS」吞进了运行时，`tsx` 从「必需品」变成「增强品」。下面按演进顺序讲。

## 2. Node 原生类型擦除：演进时间线

| 时间 | Node 版本 | 事件 |
|---|---|---|
| 2024-08 | 22.6.0 | 新增 `--experimental-strip-types`：加载时类型擦除（需 flag） |
| 2025-01 | 23.6.0 | 类型擦除**默认开启**，`node app.ts` 无需任何 flag |
| 2025-09 | 22.18.0 | 默认擦除回移到 22 LTS（22.18+ 直接 `node app.ts`） |
| 截至 2026-11 | 24 / 26 | 原生擦除稳定；需转换的语法仍靠 `--experimental-transform-types` |

```bash
node --version
node app.ts                                  # 22.18+ / 23.6+：直接跑，无需 flag
node --experimental-strip-types app.ts       # 22.6~22.17 / 23.0~23.5：需要 flag
node --experimental-transform-types app.ts   # 需要转换语法（enum/namespace/参数属性）时
```

- 实现机制：Node 内部用 **amaro**（swc 的 TS strip 编译器编译成的 WASM）在模块加载阶段剥类型。剥类型是**纯删除**：类型注解、interface、type、泛型参数、`declare`、`satisfies`、`import type` 全部消失，生成的 JS 与手写等价。
- 原生能力顺带解锁（不再需要 nodemon/外挂）：

```bash
node --watch app.ts     # 原生 watch：文件变化自动重启，与类型擦除天然组合
node --test             # 原生测试运行器；22.18+ 起测试文件也可以直接是 .ts（见 node/13-node-test.md）
```

- ⚠️ 三件 Node 原生模式下**不做**的事：
  1. 不读 tsconfig（`paths`/`target`/`strict` 全无效——它不检查类型，也不做路径映射）；
  2. 不做语法降级（你写什么 ES 语法就跑什么，Node 本身支持的版本就是下限）；
  3. 不支持任何「需要生成运行时代码」的 TS 语法（下一章清单）。

## 3. 擦除 vs 转换：哪些语法必须 --experimental-transform-types

擦除的天条：**删掉类型后，剩下的必须还是合法且行为不变的 JS**。以下语法删不动，默认直接报错：

| 语法 | 原因 | 原生模式 |
|---|---|---|
| `enum Color { Red }` | 要生成运行时对象 | ❌ 报错，需 transform |
| 带运行时代码的 `namespace Util { ... }` | 要生成 IIFE/对象 | ❌（`declare namespace` 纯类型，可以） |
| 参数属性 `constructor(private x: number)` | 要生成字段声明 + 赋值 | ❌ |
| `import x = require('...')` / `export =` | CJS 风格模块语法 | ❌ 官方建议改 ESM 语法 |
| 装饰器（新旧两代） | Node 未实现装饰器提案 | ❌（截至 2026-11） |
| JSX | 根本不是 TS 的范围 | ❌ 用 tsx/esbuild/Vite |

```ts
// bad.ts —— 原生 strip 直接报错的写法（会给出明确错误信息）
enum Color { Red, Green }                       // SyntaxError: TypeScript enum is not supported ...
namespace Util { export const v = 1; }          // 同上
class A {
  constructor(private name: string) {}          // 参数属性，同上
}
```

```ts
// good.ts —— 可擦除语法全绿（interface/type/as/satisfies/泛型/abstract/import type 都行）
interface Shape { kind: string }
const s = { kind: 'circle' } satisfies Shape;
let x = s.kind as string;
```

- 需要这些语法时的两个选择：`node --experimental-transform-types app.ts`（Node 全量转换，enum/namespace/参数属性就都能跑），或改写为可擦除语法。enum 的社区替代写法：

```ts
// const-object.ts —— as const 对象 + 派生联合，行为与 enum 几乎等价且可擦除
const Color = { Red: 'red', Green: 'green' } as const;
type Color = (typeof Color)[keyof typeof Color];   // 'red' | 'green'
const c: Color = Color.Red;
// enum 的更多细节与取舍见 07-enums.md
```

## 4. 原生 strip 的限制清单（高频坑）

**① 值导入类型必须写 `import type`**——擦除后 import 语句还在运行，类型名不是运行时导出：

```ts
// types.ts
export type Config = { host: string };

// app.ts
import { Config } from './types.ts';
// ❌ 运行时报错：SyntaxError: The requested module './types.ts'
//    does not provide an export named 'Config'（擦除后 types.ts 里根本没有这个值）
import type { Config } from './types.ts';          // ✅ 整句擦除
import { type Config, parse } from './parse.ts';   // ✅ 内联 type 修饰符（推荐，见 13 篇）
```

**② 相对导入必须带扩展名，且可以直接写 `.ts`**——Node ESM 语义（见 `node/04-modules-cjs-esm.md`）：

```ts
import { add } from './math';       // ❌ Node ESM 不允许省略扩展名
import { add } from './math.ts';    // ✅ 原生模式支持 .ts 扩展名导入
// 让 tsc 也认 .ts 导入：tsconfig 里 "allowImportingTsExtensions": true + "noEmit": true
// （该选项强制 noEmit，因为 tsc 发产物时应输出 .js 路径——见 11 篇第 6 章）
```

**③ tsconfig 不被读取**——`paths` 别名在原生模式下失效（方案见第 10 章）；`target` 无效（不降级）；`verbatimModuleSyntax` 倒是值得开，让 tsc 提前强制你写对 `import type`（见 `11-tsconfig.md`）。

**④ 不做类型检查**——`node app.ts` 只擦除。工程套路：**运行用 node（快），检查用 tsc --noEmit（CI/编辑器）**，两条腿并行。

## 5. erasableSyntaxOnly：让 tsc 替你把住「可擦除」红线（TS 5.8）

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "erasableSyntaxOnly": true   // TS 5.8+，专为配合 Node 原生 strip 设计
  }
}
```

```ts
// 在 erasableSyntaxOnly 下，以下全部编译报错（TS1294: This syntax is not allowed
// when 'erasableSyntaxOnly' is enabled）：
enum Color { Red }                          // 需要生成运行时对象
namespace Util { export const x = 1; }      // 需要 IIFE
class A { constructor(private x: number) {} }  // 参数属性
import fs = require('fs');                  // import = 语法
export = {};                                // export = 语法
```

- 价值：**把「原生 Node 跑不跑得动」提前到 tsc 阶段发现**，而不是每次 `node app.ts` 撞报错。写「直接用 node 跑」的脚本库时建议默认开启。
- 与 `verbatimModuleSyntax`（强制 import type 的镜像约束）是一对搭档；两者都是「为运行时兼容性收紧源码风格」的编译项。完整选项说明见 `11-tsconfig.md`。

## 6. tsx 深入：全语法、热重载、别名原生支持

```bash
pnpm add -D tsx
tsx app.ts                       # 直接跑（esbuild 转译，全 TS 语法可用）
tsx watch app.ts                 # 文件变化自动重启（替代 nodemon，esbuild 级速度）
tsx --tsconfig ./tsconfig.build.json app.ts   # 显式指定配置
tsx --inspect app.ts             # 配合 Chrome DevTools 调试
tsx ./script.ts --flag=1         # 参数透传给 process.argv
```

- 特性清单：
  - **tsconfig paths 别名原生支持**：`"@/*": ["./src/*"]` 直接可用，不需要 tsconfig-paths（这是它对 ts-node 的核心优势之一）；
  - **ESM/CJS 混跑**：源码按 tsconfig/`type` 字段判定格式，但 tsx 在 loader 层打通互操作——ESM 里 import CJS、CJS 里 import ESM 都行（esbuild 转译）；
  - **全语法**：enum、namespace、参数属性、装饰器都能跑（esbuild 转译）；
  - 支持 tsconfig `extends`/`references`、`TSX_TSCONFIG_PATH` 环境变量。
- 适用：本地脚本、开发期热重载、CLI 工具、CI 里临时跑 TS。
- **与 vite-node 的关系**：vite-node 是 Vitest 曾经的执行内核——走完整 Vite 插件管线（别名、插件、HMR 全生效），所以「Vitest 里跑的代码」和「tsx 里跑的代码」解析规则可能略有差异；Vitest 4 起改为内置 module runner（同一思路：复用 Vite 转换能力跑测试，截至 2026-11）。区别一句话：**tsx = 纯 esbuild 转译（快、少功能），vite-node = Vite 管线（功能全、稍慢）**。

npm scripts 里的典型分工（开发轨与检查轨分开写）：

```jsonc
// package.json
{
  "scripts": {
    "dev": "tsx watch src/main.ts",        // 开发：热重载 + 全语法
    "cli": "tsx scripts/admin.ts",         // 临时脚本入口
    "typecheck": "tsc --noEmit",           // 检查轨：CI 与 pre-commit 跑这个
    "test": "vitest run",                  // 测试走 Vitest（内部自己的转换管线）
    "start": "node dist/main.js"           // 生产：跑编译产物，不依赖任何运行器
  }
}
```

- 这份 scripts 就是三轨制的落地形态：`dev` 快、`typecheck` 严、`start` 稳，互不替代。

## 7. ts-node 现状：老牌、缓慢、有 SWC 加速器

```jsonc
// package.json —— ts-node 挂 SWC 转译器（比默认的 TS 编译器快一个量级）
{
  "ts-node": {
    "transpileOnly": true,                       // 只转译不类型检查（推荐，检查交给 tsc）
    "transpiler": ["ts-node/transpilers/swc"]
  }
}
```

- 现状（截至 2026-11）：维护缓慢、迭代几乎停滞；出身 CommonJS 时代，ESM 要走 `--loader ts-node/esm` 且坑多；新项目**直接用 tsx**，ts-node 只在历史项目/强 CJS 环境（如老的 Nest 脚本工具链）里继续服役。
- 与 Nest 的关系：`nest start --watch` 内部的 ts-node 依赖还在，但 Nest 官方也在推 SWC 加速（`nest build -b swc`）——趋势与「转译器换 esbuild/swc、类型检查交给 tsc」一致。

## 8. Deno 2 与 Bun：一句话对比

- **Deno 2**：`deno run -A file.ts`——TS 支持内建（同样擦除 + 需要处转换），兼容 npm/node_modules，自带 fmt/lint/test 与权限模型；适合追求「一体化工具链」的团队（详见 `node/15-bun-deno-fullstack.md`）。
- **Bun**：`bun run file.ts`——内置转译器启动极快，主打 Node 兼容层 + 一体化（包管理/测试/打包）；生态兼容性持续改善中。
- 共同点：**两者都不做类型检查**（Deno 有独立的 `deno check`），类型门禁照样在 tsc——别被「内置 TS」宣传误导。

## 9. 生产建议表：三轨制

先给一张运行时方案能力对比，选型时对号入座：

| 能力 | Node 原生 strip | tsx | ts-node | Deno / Bun |
|---|---|---|---|---|
| 全 TS 语法（enum/参数属性等） | ❌（需 transform flag） | ✅ | ✅ | ✅ |
| tsconfig paths 别名 | ❌ | ✅ 原生 | ⚠️ 需 tsconfig-paths | ✅（Deno 用 deno.json；Bun 认 tsconfig） |
| ESM/CJS 互操作 | 按 package type，不做转换 | ✅ loader 层打通 | ⚠️ ESM 坑多 | ✅ |
| 类型检查 | ❌ | ❌ | ✅ 可开（慢，不推荐） | ❌（Deno 另跑 `deno check`） |
| watch | `node --watch` | `tsx watch` | 外挂 nodemon | 内置 |
| 维护活跃度（截至 2026-11） | Node 核心，长期投入 | 活跃 | 缓慢 | 活跃 |

| 场景 | 首选 | 理由 |
|---|---|---|
| 本地脚本 / 一次性任务 | `node script.ts`（22.18+） | 零依赖零配置；只用可擦除语法 |
| 开发热重载 / CLI 工具 / 全语法脚本 | `tsx` / `tsx watch` | 全语法 + 别名 + ESM/CJS 互操作 |
| CI 类型门禁 | `tsc --noEmit`（配合 erasableSyntaxOnly） | 唯一真正做类型检查的东西 |
| 库发布 | tsup/tsc 编译成 js + d.ts（见 17 篇） | 产物要兼容所有 Node 版本、要出类型 |
| 生产服务 | 编译后跑 `node dist/`（或容器内 tsx） | 产物可审计、不依赖开发依赖、启动零转译开销 |
| 老代码含 enum/参数属性/装饰器 | tsx 或 `--experimental-transform-types` | 原生擦除跑不了 |

- 一句话策略：**开发轨 tsx（或原生 node）、检查轨 tsc、发布轨 tsup/tsc**——三轨各自最优，靠同一份 tsconfig 拉齐行为。

## 10. 路径别名方案对比

```jsonc
// tsconfig.json —— 编辑器与 tsc 认识的别名（见 11 篇）
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] },
    // 注意：原生 node 模式不读这里！
  }
}
```

```ts
import { log } from '@/utils/logger';
// tsc ✅ / 编辑器 ✅ / tsx ✅（原生支持 paths）
// node app.ts ❌ 运行时找不到模块 '@/utils/logger'
```

| 方案 | 原理 | 适用 | 局限 |
|---|---|---|---|
| tsx（原生支持） | loader 读 tsconfig paths | 开发/脚本最省事 | 只在 tsx 进程内生效 |
| tsconfig-paths | require 钩子 / ESM loader 注册 | ts-node、CJS 老项目 | ESM 下配置繁琐 |
| tsup alias / esbuild alias | 构建期把别名替换成真实路径 | 打包产物（见 17 篇） | 只解决产物 |
| **package.json `imports` 子路径** | Node 原生运行时解析 `#xxx` | **库/生产推荐**：零工具依赖 | 必须以 `#` 开头；需新 moduleResolution |

`imports` 子路径（Node >= 12.19 原生支持，详见 `10-modules.md`）：

```jsonc
// package.json —— 路径必须以 # 开头，运行时由 Node 原生解析
{
  "imports": {
    "#utils/*": "./src/utils/*.ts",          // 开发期直接指源码（配合原生 strip/tsx）
    "#config": {
      "node": "./src/config.node.ts",        // 还能按运行环境分发不同实现
      "default": "./src/config.ts"
    }
  }
}
```

```ts
import { log } from '#utils/logger';   // node ✅ tsx ✅ 编辑器 ✅（需 moduleResolution: nodenext/bundler）
```

- 库推荐 `imports` 的理由：它写进**发布产物**后，使用方运行时由 Node 原生解析，不依赖任何 loader/构建器——别名从「编辑器谎言」变成「运行时事实」。
- tsc 认识 `imports` 需要 `"moduleResolution": "nodenext"` 或 `"bundler"`（见 `11-tsconfig.md` 第 5 章）。

## 11. shebang + tsx 脚本实战

```ts
#!/usr/bin/env node
// scripts/cleanup.ts —— Node 22.18+：shebang 用 node，直接跑 .ts（只用可擦除语法）
import { rm, stat } from 'node:fs/promises';

const dist = new URL('../dist', import.meta.url).pathname;
if (await stat(dist).then(() => true, () => false)) {
  await rm(dist, { recursive: true });
  console.log('dist removed');
}
```

```bash
chmod +x scripts/cleanup.ts
./scripts/cleanup.ts          # 直接执行
```

```ts
#!/usr/bin/env -S npx tsx
// scripts/migrate.ts —— 需要全语法（enum/别名）或跨 Node 版本时，shebang 交给 tsx
// 注意 -S：把 "npx tsx" 作为两个词传入 env（macOS/Linux 的 env 不支持多参数时必须）
import { createPool } from '#db';   // 配合 imports 子路径也能用
await createPool().migrateLatest();
```

```bash
chmod +x scripts/migrate.ts
./scripts/migrate.ts
```

- 三种 shebang 方案：`#!/usr/bin/env node`（Node 22.18+ 原生擦除，最干净）、`#!/usr/bin/env tsx`（全局装过 tsx）、`#!/usr/bin/env -S npx tsx`（零安装假设，npx 现拉）。Windows 下 shebang 不生效，靠 npm scripts 或 pnpm 调用。
- 要把 CLI 发布成包：`tsup` 打包 + `bin` 字段 + `banner: { js: '#!/usr/bin/env node' }`（见 17 篇 2.8），产物是纯 JS，不依赖用户环境有 tsx。

## 12. 常见坑速查

- `node app.ts` 报 enum/参数属性错误 → 用 tsx 或 `--experimental-transform-types`（第 3 章）
- 运行时报 `does not provide an export named 'X'` → 类型导入没写 `import type`/内联 `type`（第 4 章）
- `allowImportingTsExtensions` 报错 → 它强制要求 `noEmit`（或 emitDeclarationOnly），因为发布产物不能带 .ts 路径（第 4 章）
- tsconfig paths 在 node 原生模式不生效 → Node 不读 tsconfig；用 tsx 或 package.json `imports`（第 10 章）
- 「node 直接跑了怎么没人报类型错」→ 擦除 ≠ 检查，门禁在 `tsc --noEmit`（第 1 章）
- ts-node 挂 ESM loader 报 ERR_UNKNOWN_FILE_EXTENSION → 老工具的老毛病，换 tsx 一步到位（第 7 章）
- shebang 脚本在 Windows 不执行 → shebang 是 Unix 语义，用 npm scripts 包一层（第 11 章）
- Vitest 里好好的别名到 tsx 里失效/反之 → 两者解析管线不同（esbuild vs Vite），别名配置在 tsconfig 与 vite.config 双处对齐（第 6 章）

## 13. 一句话总结

> 跑 TS 的 2026 现状：Node 22.18+/23.6+ 已默认类型擦除（`node app.ts` 直接跑，但只擦不查、不读 tsconfig、enum/namespace/参数属性/装饰器需 `--experimental-transform-types` 或改可擦除写法 + TS 5.8 `erasableSyntaxOnly` 把关）；tsx 仍是开发期最省心的全语法运行器（watch/别名/ESM 互操作），ts-node 缓慢退场，Deno/Bun 内置支持但同样不做类型检查。生产三轨制：开发 tsx、检查 tsc --noEmit、发布 tsup/tsc 编译；别名给库用 package.json `imports` 子路径，给开发用 tsx 原生 paths。
