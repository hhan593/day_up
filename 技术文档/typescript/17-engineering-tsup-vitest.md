# 17. TypeScript 工程化实践：tsup / Vitest / pnpm workspace / Changesets

> 来源可信度：**标准实践**（对齐 tsup、Vitest、pnpm、Turborepo、Changesets 官方文档；tsup 基于 esbuild，行为以各工具当前主版本为准；示例以 TS 5.9 / Node 22+ / pnpm 9+ / Vitest 3 / Turborepo 2 时代验证，版本敏感处标注「截至 2026-11」）
> 关联：`11-tsconfig.md`（编译选项、`noEmit` 与构建组合）、`10-modules.md`（exports 字段与双格式解析）、`13-typescript-best-practices.md`（代码规范）、`20-tsx-and-runtime.md`（运行时直接执行）、`12-typescript-advanced-type-system.md`（类型测试的对象）；Node 侧 `node/20-bundling-esbuild-rollup.md`（esbuild 底层机制）、`node/13-node-test.md`（node:test 对照）；Rust 侧 `rust/02-进阶特性/20-cargo-advanced.md`（Cargo workspace 对照）

## 1. 全景：一条 TS 库的工程化流水线

```text
源码 src/*.ts
  → tsup 打包（cjs + esm 双格式 + d.ts）      [第 2 章]
  → package.json exports 对外暴露             [第 3 章]
  → vitest 单测（运行时 + expectTypeOf 类型） [第 4 章]
  → pnpm workspace + turbo 编排多包           [第 5 章]
  → changesets 管版本 → npm publish           [第 6、7 章]
```

- **应用**（网站、服务）与**库**（发 npm 的包）工程化重点不同：应用关心 dev server 与部署（Vite/Nest），库关心**产物格式与类型文件**。本篇主线是「库」，这也是面试里「如何发布一个 TypeScript 库」的标准答案。
- 选 tsup 的理由：基于 esbuild（比 rollup 快一个量级）、零配置即可出双格式 + d.ts；更复杂的需求（插件生态、lint 产物）再考虑 unbuild / rollup / swc。
- 与 Rust 对照：Cargo 一个工具覆盖 build/test/publish；TS 生态是四个工具拼装——先记住这张分工图。

## 2. tsup 深入：从零配置到定制

### 2.1 最小可用配置

```ts
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],  // 双格式输出
  dts: true,               // 生成 .d.ts 并打包类型
  clean: true,             // 构建前清空输出目录
  sourcemap: true,
  target: 'es2020',
});
```

```bash
tsup                       # 读取 tsup.config.ts
tsup --watch               # 监听模式（配合 onSuccess 做伪 dev）
tsup src/index.ts src/cli.ts --format esm --dts   # CLI 等价写法（临时构建很方便）
```

- 底层是 esbuild（转换与压缩），见 `node/20-bundling-esbuild-rollup.md`；d.ts 部分单独走 TS 编译器（见 2.6）。

### 2.2 多入口与代码分割（splitting 仅 esm）

```ts
// tsup.config.ts
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  splitting: true,   // 抽取公共 chunk，避免共享模块在多个入口重复打包
});
```

- ⚠️ **`splitting` 只对 esm 生效**：cjs 是 CommonJS 输出模型，没有 chunk 概念，tsup 会忽略该项并打 warning。双格式构建时通常只给 esm 开 splitting（cjs 反正不做 tree-shaking 优化）。
- 多入口时 d.ts 也按入口分别产出，`exports` 里给每个子路径各自配好（见第 3 章）。

### 2.3 双格式与产物扩展名

tsup 按 package.json 的 `type` 字段决定输出扩展名，避免 Node 解析歧义（解析规则见 `10-modules.md`）：

| package.json `type` | cjs 产物 | esm 产物 |
|---|---|---|
| 不写 / `"commonjs"` | `index.js` | `index.mjs` |
| `"module"` | `index.cjs` | `index.js` |

- d.ts 跟随同样规则：`.d.ts` / `.d.mts` / `.d.cts` 成对产出。
- ⚠️ 坑：改了 `type` 字段但 `exports` 里的路径没跟着改 → Node 按错误格式解析，运行时报 `ERR_REQUIRE_ESM` 或类型找不到。产物命名交给默认规则，`exports` 与之对齐即可（`outExtension` 可强制覆盖，一般不需要）。

### 2.4 external / noExternal：打包边界

- 默认规则：**`dependencies` 与 `peerDependencies` 全部 external**（不进产物，运行时由使用方安装），`devDependencies` 会被打进 bundle。
- `external: ['lodash-es']` 强制排除；`noExternal: ['some-pkg']` 强制打包；`noExternal: true` 除 Node 内置模块外全打包（做「单文件应用」时用）。
- ⚠️ 经典事故：把 `react` / `vue` 打进了库产物 → 使用方项目里出现两个实例，`context` 断裂、hooks 报错。正确做法是这些运行时依赖放 `peerDependencies`，保持 external。

### 2.5 target 与语法降级

```ts
export default defineConfig({
  target: 'es2020',  // esbuild 按此降级语法：可选链、??、class fields 按需转译
});
```

- ⚠️ esbuild **只降语法、不补 API**：target 设 `es2018` 时 `Array.prototype.at` 仍原样输出，老环境照样崩。API 兼容要自己引 core-js 或提高 target。
- 库常用 `'es2018'`~`'es2020'`；纯 Node 库可直接 `'node18'`。

### 2.6 dts：声明文件与「并行慢」的问题

- `dts: true` 时 tsup 内部用 rollup + rollup-plugin-dts 把所有 `.d.ts` 收敛成单文件（消除内部 import 路径，对外干净）。
- ⚠️ **dts 是 tsup 构建里最慢的一步**：它要跑 TS 类型检查，大 monorepo 里常见「tsup 卡在 dts」。优化方案是拆成两条并行流水线：

```json
// package.json —— 用 npm-run-all 并行：JS 归 esbuild（快），类型归 tsc
{
  "scripts": {
    "build": "run-p build:js build:types",
    "build:js": "tsup --format cjs,esm",
    "build:types": "tsc -p tsconfig.build.json --emitDeclarationOnly --declaration"
  }
}
```

- 补充项：`dts: { resolve: true }` 会把依赖包的类型也内联进来（适合想发「零依赖」包的场景）；`dts: { entry: ... }` 自定义类型入口。`tsc` 选项细节见 `11-tsconfig.md` 第 6 章。

### 2.7 shims：import.meta.url 的 cjs 兼容

```ts
// src/paths.ts —— 同一份源码要同时产出 cjs/esm 时，最容易踩的平台差异
import path from 'node:path';

// esm 下 import.meta.url 天然可用；cjs 里根本没有 import.meta（cjs 用 __dirname）
export const here = path.dirname(new URL(import.meta.url).pathname);
```

```ts
// tsup.config.ts
export default defineConfig({
  format: ['cjs', 'esm'],
  shims: true,  // cjs 产物里为 import.meta.url / import.meta.resolve 注入等价实现
                // esm 产物里为 __dirname / __filename / require 注入等价实现
});
```

- 默认 `shims: false`：cjs 版运行到 `import.meta.url` 直接抛错（或拿到 undefined），而且往往**测试环境跑了 esm 版发现不了，用户 require 时才炸**。
- ⚠️ shim 是字符串级兜底：更好的思路是避免写平台差异代码，或用 `exports` 双文件把两种格式各自指向独立实现（见第 3 章）。

### 2.8 env 注入与其他实用项

```ts
// tsup.config.ts
export default defineConfig({
  env: { API_BASE: 'https://api.example.com' }, // 编译期把值写死进产物（process.env.API_BASE 直接可读）；⚠️ 会被打进包里，绝不能放密钥
  define: { __VERSION__: '"1.0.0"' },           // 自由 define，值必须是合法表达式（注意引号）
  banner: { js: '#!/usr/bin/env node' },        // 给 cli 产物加 shebang（CLI 脚本实战见 20 篇第 11 章）
  onSuccess: 'node ./scripts/log-built.mjs',    // 构建成功后执行（watch 下常用来重启服务）
  treeshake: true,                              // 实验特性：构建后再用 rollup 摇一次树（截至 2026-11 仍标实验）
});
```

## 3. 双格式发布的 package.json 完整示例

```jsonc
// package.json —— 任何要发 npm 的 TS 库都应长这样
{
  "name": "@acme/kit",
  "version": "0.1.0",
  "description": "A TypeScript utility kit",
  "license": "MIT",
  // provenance 要求 repository 与实际发布仓库一致（见 6.5 checklist）
  "repository": { "type": "git", "url": "git+https://github.com/acme/kit.git" },
  "type": "module",                       // 源码与 esm 产物以 ESM 为主
  "engines": { "node": ">=18" },
  "files": ["dist"],                      // 白名单：只发构建产物（不发 src/测试/锁文件）
  "main": "./dist/index.cjs",             // 兜底：老工具 / require 场景
  "module": "./dist/index.js",            // 打包器约定字段（社区约定，非 Node 官方）
  "types": "./dist/index.d.cts",          // 与 main 配对的兜底类型
  "exports": {
    ".": {
      "types": "./dist/index.d.cts",      // ⚠️ types 条件必须写在每个块的最前面
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"    // 允许外部读子路径（工具链常需要）
  },
  "sideEffects": false,                   // 声明可安全 tree-shake（有 polyfill 副作用 import 时不能写）
  "publishConfig": { "access": "public" },// scoped 包默认 restricted，必须显式 public
  "scripts": {
    "build": "tsup",
    "typecheck": "tsc --noEmit",
    // 发包前最后一道闸：类型检查 + 构建 + 产物 lint（见 6.5）
    "prepublishOnly": "pnpm typecheck && pnpm build && npx publint && npx attw --pack ."
  }
}
```

要点逐条：

- **`exports` 条件自上而下匹配**：`types` 放最前，否则解析器先命中 `import`/`require` 拿不到类型（`TS7016: Could not find a declaration file`）。解析全流程见 `10-modules.md`。
- **`main` / `module` / `types` 是兜底**：给不认 `exports` 的老工具用；认 `exports` 的解析器以 `exports` 为准，两边最好指向一致产物。
- **双格式不冲突三原则**：(1) 扩展名交给 tsup 按 `type` 决定；(2) 类型与 JS 严格配对——`require → .d.cts`、`import → .d.mts`，混配会在某些解析器下类型失效；(3) CI 里跑 `publint`（exports 规范检查）与 `attw`（@arethetypeswrong/cli，模拟多种解析器验证类型可达）。
- `files` 白名单优于 `.npmignore`（白名单思维：没列的就是不发）；发前用 `npm pack --dry-run` 人工确认。

## 4. Vitest 深入

### 4.1 vitest.config.ts

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },  // 与 tsconfig paths 保持一致
  },
  test: {
    environment: 'node',        // 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime'
    globals: false,             // 推荐 false：显式 import，类型更准
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',           // 或 'istanbul'（需额外安装对应包）
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 }, // 不达标退出码非 0，CI 拦截
    },
  },
});
```

- `jsdom` / `happy-dom` 环境需要单独 `pnpm add -D jsdom`；`globals: true` 时还要在 tsconfig 的 `types` 里加 `vitest/globals`。
- 兼容 Jest API（`describe` / `it` / `expect`），从 Jest 迁移基本改 import 即可；底层是 Vite 转换 + 原生 ESM，冷启动快一个量级。

### 4.2 类型测试：expectTypeOf（纯类型单测）

```ts
// src/math.ts
export function add(a: number, b: number): number { return a + b; }
export function first<T>(xs: T[]): T | undefined { return xs[0]; }
```

```ts
// src/math.test-d.ts —— 约定 *.test-d.ts：只测类型，不测运行时
import { expectTypeOf, test } from 'vitest';
import { add, first } from './math.js';

test('add 的签名', () => {
  expectTypeOf(add).parameters.toEqualTypeOf<[a: number, b: number]>();
  expectTypeOf(add(1, 2)).toEqualTypeOf<number>();
});

test('first 的返回', () => {
  expectTypeOf(first([1])).toEqualTypeOf<number | undefined>();
  expectTypeOf(first(['a'])).not.toBeAny();
  expectTypeOf(first(['a'])).returns.toEqualTypeOf<string | undefined>();
});
```

```ts
// vitest.config.ts —— 追加 typecheck 配置
export default defineConfig({
  test: {
    typecheck: {
      enabled: true,                       // 或 CLI 传 --typecheck
      include: ['src/**/*.test-d.ts'],     // 类型测试文件单独圈出来
    },
  },
});
```

- ⚠️ **最大的坑**：`expectTypeOf` 断言在运行时是空操作——类型全错运行时照样绿。必须开 `--typecheck`（CI 里单独跑 `vitest run --typecheck`），tsc 诊断红了才算红。
- 适合测「类型公共 API」：工具库的泛型函数、`infer` 推导结果（见 `12-typescript-advanced-type-system.md`）、overload 签名。这是类型层最能落地的「单测」，面试讲出来是加分项。

### 4.3 vi.mock 模块 mock

```ts
// src/service.ts
import { fetchUser } from './api.js';
export async function getUser(id: number) {
  const u = await fetchUser(id);
  return `${u.name} <${u.email}>`;
}
```

```ts
// src/service.test.ts
import { vi, test, expect } from 'vitest';
import { getUser } from './service.js';
import { fetchUser } from './api.js';

// 工厂返回值即模块的 mock 形状
vi.mock('./api.js', () => ({
  fetchUser: vi.fn(async (id: number) => ({ id, name: 'Mock', email: 'm@x.dev' })),
}));

test('getUser 使用被 mock 的 api', async () => {
  expect(await getUser(1)).toBe('Mock <m@x.dev>');
  expect(fetchUser).toHaveBeenCalledWith(1);   // vi.mocked(fetchUser) 可拿到带 mock 类型的视图
});
```

- ⚠️ **vi.mock 会被提升（hoist）到文件最顶部**（在 import 之前执行），所以工厂里**不能引用外部普通变量**：

```ts
// ❌ ReferenceError：mockFetch 在 vi.mock 执行时还没初始化
const mockFetch = vi.fn();
vi.mock('./api.js', () => ({ fetchUser: mockFetch }));

// ✅ 用 vi.hoisted 让它跟着一起提升
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
vi.mock('./api.js', () => ({ fetchUser: mockFetch }));
```

- 其他用法：`vi.mock('./api.js')` 不给工厂 → 自动 mock（所有导出函数变 `vi.fn()`）；`vi.spyOn(obj, 'm')` 部分 mock；`vi.mocked(fetchUser).mockResolvedValueOnce(...)` 控制返回序列。

### 4.4 快照测试

```ts
// src/card.test.ts
test('render card', () => {
  expect(renderCard({ title: 'hi' })).toMatchSnapshot();       // 外置 __snapshots__/ 目录
  expect(renderCard({ title: 'hi' })).toMatchInlineSnapshot(); // 内联在测试文件里，review 更直观
});
```

- 首跑生成快照，之后逐字对比；不一致则失败，`vitest run -u` 更新。
- ⚠️ 坑：diff 一大人就无脑 `-u`，快照沦为「变更确认器」。纪律：(1) 快照要小，只圈关键结构；(2) 时间戳/随机 id 先 normalize 再快照（`expect.addSnapshotSerializer`）；(3) PR review 时快照变更必须逐行看。

### 4.5 projects：一个仓库多套测试环境

```ts
// vitest.config.ts —— Vitest 3 起用 projects 配置取代旧的 workspace 文件（截至 2026-11）
export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'node', include: ['packages/*/src/**/*.test.ts'], environment: 'node' },
      },
      {
        test: { name: 'dom', include: ['apps/web/**/*.test.tsx'], environment: 'jsdom' },
      },
    ],
  },
});
```

- monorepo 里核心包跑 node 环境、UI 组件跑 jsdom 环境，各自 include 互不污染；`vitest run --project dom` 只跑一组。
- 每个 project 可以有自己的 alias/coverage 配置，等于「一份配置里的多个子配置」。

### 4.6 命令速查

```bash
vitest                    # watch 模式（开发默认）
vitest run                # 单次执行（CI）
vitest run --coverage     # 带覆盖率
vitest --typecheck        # 含类型测试（4.2）
vitest run -t 'add'       # 按用例名过滤
vitest related src/a.ts   # 只跑与该文件有依赖关系的测试（PR 增量测试常用）
```

- 与 Rust 测试对照（`rust/01-基础核心/12-模块包管理与测试.md`）：`cargo test` 把 `#[test]` 内联在源文件里；vitest 靠 `*.test.ts` 文件约定。思想相同：测试与源码同仓同语言、断言失败即文档。

## 5. pnpm workspace + turbo

### 5.1 pnpm-workspace.yaml

```yaml
# pnpm-workspace.yaml（仓库根）
packages:
  - 'packages/*'   # 库
  - 'apps/*'       # 应用
```

- pnpm 用内容寻址 + 硬链接，装得快、磁盘省；**杜绝幽灵依赖**——没在某个包的 package.json 里声明的依赖，那个包 import 不到（npm 会沿目录树提升导致「侥幸可用」）。
- 与 Cargo 对照：`packages:` ≈ `[workspace].members`（见 `rust/02-进阶特性/20-cargo-advanced.md`）。

### 5.2 过滤命令（-F / --filter）

```bash
pnpm -F @acme/core build            # 只构建某包（-F = --filter，按包名）
pnpm -r run test                    # 所有声明了 test 脚本的包递归执行
pnpm -F @acme/web... build          # web 及其全部依赖包先构建（... 后缀 = 含依赖，拓扑序）
pnpm -F ...@acme/core lint          # 所有依赖 core 的包（... 前缀 = 依赖方）
pnpm add zod -F @acme/core          # 给指定包添加依赖
pnpm up typescript -r               # 全仓升级某依赖
```

- `...` 方向是高频面试点：**后缀 = 我和我的依赖，前缀 = 我和依赖我的**。

### 5.3 turbo.json（Turborepo 2.x：pipeline 已改名 tasks）

```json
// turbo.json（仓库根）
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],        // 先构建我依赖的包（^ = 依赖方的同名任务），形成拓扑序
      "outputs": ["dist/**", "tsconfig.tsbuildinfo"],   // 缓存的产物清单
      "inputs": ["$TURBO_DEFAULT$", "!**/*.test.ts", "!**/*.test-d.ts"]  // 测试文件改动不使 build 缓存失效
    },
    "typecheck": { "dependsOn": ["^build"], "outputs": [] },
    "test": { "dependsOn": ["^build"], "outputs": [] },
    "lint": { "outputs": [] },
    "dev": { "cache": false, "persistent": true }   // 常驻进程：不缓存、不设超时
  }
}
```

- 缓存机制：按 `inputs`（源文件 + 环境变量）计算哈希，命中则直接回放 `outputs`；`turbo run build --graph` 可视化任务依赖。
- ⚠️ 缓存「假绿」：`outputs` 漏写产物目录 → 命中缓存但 dist 里没文件，下游全炸。新任务接入先 `turbo run build --force` 与真实构建对一遍。
- Remote cache：`npx turbo link` 接入远端，CI 上命中缓存秒回（Vercel 托管，也可自建）。

### 5.4 catalog: 统一版本（pnpm 9.5+）

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'

catalog:
  typescript: ^5.9.2
  vitest: ^3.2.0
  tsup: ^8.3.0
```

```json
// packages/core/package.json —— 版本号统一写 "catalog:"
{
  "devDependencies": { "typescript": "catalog:", "vitest": "catalog:" }
}
```

- 所有包引用同一份版本表：升级改 catalog 一行，全仓生效；杜绝「A 包 vitest 2.x、B 包 vitest 3.x」的漂移。
- 与 Cargo 对照：catalog ≈ `[workspace.dependencies]`（在 workspace 根声明，成员用 `workspace = true` 引用）。

## 6. Changesets 完整生命周期

### 6.1 初始化与三命令

```bash
pnpm add -Dw @changesets/cli   # -Dw 装到 workspace 根
npx changeset init             # 生成 .changeset/config.json

npx changeset add      # 交互式：选改动的包 → 选 major/minor/patch → 写变更说明
                       # 生成 .changeset/<随机名>.md，随 PR 一起提交
npx changeset version  # 消费所有 changeset：改各包版本号、更新 CHANGELOG.md、删除已消费的 md
npx changeset publish  # 发 npm（会先跑各包的 prepublishOnly 钩子）
```

- 日常节奏：PR 里顺手 `changeset add` 提交一个 md → 合并 main → CI bot 自动开/更新「Version PR」→ 合并该 PR 即完成 version → bot 自动 publish。**版本变更也是代码审查对象**，这是 changesets 与手动 `npm version` 的本质区别。

### 6.2 config.json 字段

```json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "access": "public",                     // scoped 包默认 restricted，发包会 402，必须显式 public
  "baseBranch": "main",
  "updateInternalDependencies": "patch",  // 内部依赖升级时自动 bump 使用方
  "ignore": ["@acme/docs"],               // 不参与版本管理的包
  "fixed": [["@acme/core", "@acme/react"]],  // 固定组：全组永远同版本号，一次 bump 全组动（强耦合包组）
  "linked": [["@acme/kit", "@acme/cli"]]     // 联动组：版本号独立，但 bump 类型取组内最高（弱耦合）
}
```

### 6.3 beta（prerelease）发版流程

```bash
npx changeset pre enter beta    # 进入 prerelease 模式（写入 .changeset/pre.json）
# 之后正常 add / version：
#   每次合并 changeset 并 version → 1.2.0-beta.0 → 1.2.0-beta.1 → ...
npx changeset publish           # 发出 1.2.0-beta.x，并自动打 npm dist-tag beta
                                # （不会污染 latest，用户 npm i @acme/kit 拿到的仍是正式版）
npx changeset pre exit          # 退出 prerelease：剩余 changeset 计算出正式版本并去掉 -beta 后缀
```

- ⚠️ 坑：`pre enter` 之后忘了 `pre exit`，仓库会一直停在 beta 模式，后续正式版始终带后缀。pre.json 要跟分支一起管理（切回 main 后看到它就知道还在预发模式）。

### 6.4 GitHub Actions：changesets bot 完整 yaml

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}   # 防止并发发布

permissions:
  contents: write          # 开 Version PR、打 tag
  pull-requests: write     # 创建/更新 Version PR
  id-token: write          # npm provenance 需要的 OIDC 令牌

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # changesets 需要完整 git 历史
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'   # NPM_TOKEN 写入 .npmrc 的前提
      - run: pnpm install --frozen-lockfile
      - uses: changesets/action@v1
        with:
          version: pnpm run version   # 有未消费 changeset → 开/更新 Version PR
          publish: pnpm run release   # 版本已就绪 → 执行发布
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}           # npm access token（Automation 类型）
          NPM_CONFIG_PROVENANCE: 'true'                 # 等价 npm publish --provenance
```

```json
// 根 package.json —— 配套脚本
{
  "scripts": {
    "version": "changeset version && pnpm install --lockfile-only",  // 版本变更后同步锁文件
    "release": "pnpm -r build && changeset publish"                  // 发布前确保全量构建
  }
}
```

### 6.5 发布 checklist

- [ ] `files` 白名单只含 `dist`；`npm pack --dry-run` 人工过目包内容
- [ ] `prepublishOnly` 串起 `typecheck + build`，杜绝发陈旧产物
- [ ] **npm provenance**：package.json `repository` 与实际仓库一致 + workflow `id-token: write` + `NPM_CONFIG_PROVENANCE`；发布页会展示「从某仓库某 commit 构建」，供应链可信度证明
- [ ] 双格式不冲突：`exports` 的 `types` 条件在前、`require`/`import` 各配 `.d.cts`/`.d.mts`；CI 跑 `npx publint` 与 `npx attw --pack .`（见第 3 章三原则）
- [ ] `sideEffects` 评估后标注；scoped 包 `access: public`
- [ ] 发完验证：`npm view <pkg> versions` 看序列；干净目录 `npm i <pkg>` 跑 smoke test；beta 验证 `npm i <pkg>@beta`

## 7. 与 Rust 工程化对照

| 能力 | TS (pnpm + turbo) | Rust (Cargo) |
|------|-----------|--------------|
| 多包 | pnpm workspace | `[workspace]` members |
| 任务编排 | turbo tasks（^build 拓扑 + 缓存） | cargo 内建依赖拓扑，sccache 加速 |
| 构建 | tsup（esbuild）/ tsc | `cargo build`（增量编译） |
| 测试 | `vitest run` | `cargo test` |
| 覆盖率 | `--coverage`（v8/istanbul） | cargo-llvm-cov / tarpaulin |
| 发版 | changesets（version/publish） | `cargo publish` / cargo-release |
| 锁文件 | pnpm-lock.yaml | Cargo.lock |
| 版本统一 | catalog: | `[workspace.dependencies]` |

- 本质同构：workspace 成员 + 任务拓扑 + 锁文件 + 发布命令。turbo 的 `^build` 手工声明了 Cargo 里编译器自动做的事——JS 生态没有「编译期依赖图」这个天然保证，所以要靠工具补。

## 8. 常见坑速查

- tsup 卡在 dts → 大项目拆 `run-p` 并行：JS 给 esbuild、类型给 `tsc --emitDeclarationOnly`（2.6）
- `splitting` 写了没生效 → 它只对 esm 有效（2.2）
- cjs 产物 `import.meta.url` 是 undefined → `shims: true`（2.7）
- 装了包却 `TS2307` / 运行时 404 → `exports` 条件顺序或扩展名与 `type` 不匹配，见 `10-modules.md`
- React/Vue 被打进库产物 → 忘了放 `peerDependencies` 保持 external（2.4）
- 幽灵依赖本地能跑 CI 爆炸 → npm 的依赖提升惯出来的；pnpm 严格解析是纠偏
- turbo 缓存假绿 → `outputs` 漏写产物目录（5.3）
- changeset 忘了 `add` → PR 合了版本没动；PR 模板里加提醒项
- beta 发完 latest 还是 beta → 没走 `changeset publish`（自动处理 dist-tag），手动 npm publish 时没加 `--tag beta`（6.3）
- attw 报 `FalseESM` / `CJS resolve type` 错 → 回看 package.json 双格式三原则（第 3 章）

## 9. 一句话总结

> TS 库工程化四件套：tsup（esbuild 双格式 + dts，注意 splitting 仅 esm、dts 慢可并行）打包，Vitest（运行时单测 + expectTypeOf 类型测试 + vi.mock）验证，pnpm workspace + turbo（`^build` 拓扑、inputs/outputs 缓存、catalog 统一版本）管多包，Changesets（add/version/publish + prerelease 模式 + GitHub bot）管版本。发布本质是把 exports/类型/格式三件事配对齐——与 Cargo workspace 思路同源，只是每一步都要自己搭。
