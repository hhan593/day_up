# 11. tsconfig.json（编译配置）

> 来源可信度：**官方文档**（对齐 TypeScript Handbook「TSConfig Reference / tsc Compiler Options / Project References」，https://www.typescriptlang.org/tsconfig/ ，© Microsoft；module/moduleResolution 配对与 TS 5.x 默认值以官方 Reference 为准；示例以 TS 5.9 时代验证）
> 关联：`10-modules.md`（module/moduleResolution 决定解析行为）、`06-classes.md`（strictPropertyInitialization/useDefineForClassFields）、`07-enums.md` 与 `08-creating-types-from-types.md`（isolatedModules 禁 ambient const enum）、`09-decorators.md`（experimentalDecorators/emitDecoratorMetadata）、`17-engineering-tsup-vitest.md`（tsup/vitest 下的 noEmit 组合）；Nest 的 `nest-cli.json` 关系见 `/Users/hh/offer/技术文档/nest/08-cli`。

## 1. tsconfig 是什么与加载方式

- 目录里有 `tsconfig.json` → 该目录就是 **TypeScript 项目根**。它指定两件事：**参与编译的根文件**与**编译器选项**。
- JS 项目用几乎等价的 `jsconfig.json`（默认开若干 JS 相关标志）。
- 调用方式：

```bash
tsc                      # 从当前目录向上查找 tsconfig.json
tsc -p ./config          # 指定目录（内含 tsconfig.json）
tsc -p path/to/tsconfig.json
tsc --noEmit src/index.ts   # ⚠️ 命令行直接给输入文件时，tsconfig.json 被完全忽略！
```

- ⚠️ 最后一条是最常见的"配置为什么不生效"原因：`tsc file.ts` 与 `vitest/esbuild` 直接转译单文件都不读 tsconfig 的检查项。
- `ts-node`/`tsx` 等运行器读取 tsconfig 的子集（`ts-node` 读全部，`tsx` 只关心路径与 ESM 相关项）。

## 2. 顶层字段：files / include / exclude

```json
// tsconfig.json
{
  "files": ["src/index.ts"],            // 显式清单（优先级最高，极少用）
  "include": ["src/**/*"],              // glob 批量包含
  "exclude": ["**/*.spec.ts", "dist"]   // 批量排除
}
```

匹配规则（官方语义）：

1. `*` 匹配零个或多个字符（不含 `/`）；`?` 单字符；`**/` 任意层目录。
2. 不写扩展名的 include 段默认匹配 `.ts/.tsx/.d.ts`，`allowJs` 下再加 `.js/.jsx`。
3. `files` 与 `include` 都不写时，默认包含**所有**文件（exclude 之外）。
4. ⚠️ `exclude` 只影响**入口文件**：被 include 的文件 import 进来的文件照样参与编译——exclude 不是"不编译"，只是"不当根文件"。
5. 被引用的声明文件（如 `types/**/*.d.ts`）始终生效。

## 3. extends 继承与覆盖

```json
// tsconfig.base.json（monorepo 基座）
{ "compilerOptions": { "strict": true, "declaration": true, "outDir": "dist" } }
```

```json
// packages/app/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "build" }, // 覆盖父级同名项
  "include": ["src"]
}
```

- 子配置覆盖父配置的同名项（**整个项整体替换**，不深合并：`paths` 写了就完全覆盖父级 `paths`）。
- ⚠️ **相对路径基准是"声明它的那个文件"**：父配置里的 `outDir: "dist"`、`include: ["src"]` 相对**父配置所在目录**解析——所以公共配置里要谨慎写相对路径（`rootDir`/`outDir` 常因此错位）。
- `extends` 值也可是 npm 包：`"extends": "@tsconfig/node20/tsconfig.json"`（github.com/tsconfig/bases）。
- `files/include/exclude` 不继承链式合并：子配置若写了 `include`，父级的 `include`/`files` 全部作废；子配置不写 `include` 且父级写了，则继承父级的（`exclude` 同理）。

## 4. 类型检查组（strict 全家桶逐项 + 附加严格项）

`"strict": true` 等价于同时打开以下 8 项（TS 5.x）：

| 选项 | 作用 | 典型报错 |
|---|---|---|
| `noImplicitAny` | 禁止隐式 any（参数、无类型推断处） | `TS7006: Parameter 'x' implicitly has an 'any' type.` |
| `strictNullChecks` | null/undefined 是独立类型，必须显式处理 | `TS18047/2531: possibly 'null'`（见 03 篇） |
| `strictFunctionTypes` | 函数参数逆变检查（方法语法除外，双变） | `TS2345`（见 12 篇第二章） |
| `strictBindCallApply` | `bind/call/apply` 参数与返回类型严格签名 | `TS2345` |
| `strictPropertyInitialization` | 类属性必须初始化 | `TS2564`（见 06 篇第 1 节） |
| `noImplicitThis` | this 推断不出时报错 | `TS2683: 'this' implicitly has type 'any'` |
| `useUnknownInCatchVariables` | catch 变量是 unknown 而非 any（TS 4.4 入 strict） | `TS18046: 'e' is of type 'unknown'` |
| `alwaysStrict` | 输出 `"use strict"` 并按 ES 严格模式解析 | —— |

strict 之外的推荐严格项（不随 strict 开启，逐个评估）：

| 选项 | 作用 | 代价 |
|---|---|---|
| `noUncheckedIndexedAccess` | `arr[i]`/`obj[k]` 的类型自动加 `\| undefined` | 老代码改动大，但消除"索引越界"类 bug（见 04 篇 10.2） |
| `noImplicitOverride` | 子类覆盖必须写 `override` | 几乎零代价，抓父类删方法（06 篇第 9 节） |
| `exactOptionalPropertyTypes` | 可选属性 `?: T` 不再隐含 `\| undefined`，禁止显式传 undefined | 与很多库类型冲突，引入需评估 |
| `noFallthroughCasesInSwitch` | 禁止 switch 穿透（无 break） | 低 |
| `noUnusedLocals` / `noUnusedParameters` | 未用变量/参数报错 | 一般交给 ESLint 更灵活 |

> 官方立场：新项目一律 `strict: true`；Nest 的 `nest new --strict` 脚手架即全量 strict。

## 5. 模块组：module / moduleResolution / moduleDetection

**`module`** 决定输出的模块格式；**`moduleResolution`** 决定 import 路径怎么找到文件。两者有官方**配对关系**，不能乱搭：

| module | 默认/允许的 moduleResolution | 适用场景 |
|---|---|---|
| `commonjs` | `node10`（旧名 `"node"`） | 传统 Node/CommonJS（Nest 现状） |
| `node16` | `node16` | Node ESM/CJS 双格式（按 package.json `type` 分辨） |
| `nodenext` | `nodenext` | 跟随最新 Node 规范（exports 字段、`import ... with` 等） |
| `esnext`/`es2022` 等 | 可配 `bundler`（TS 5.0+） | Vite/webpack/esbuild 等打包器 |
| `preserve`（TS 5.4+） | 隐含 `bundler` | 输出格式交给打包器决定 |

```json
// 常见配对示例
{ "module": "nodenext", "moduleResolution": "nodenext" }   // 现代 Node 库
{ "module": "esnext", "moduleResolution": "bundler" }      // Vite/打包器应用
{ "module": "commonjs", "moduleResolution": "node10" }     // Nest/传统 Node
```

- ⚠️ `module: "node16"`+ 下，相对路径 import **必须写扩展名**（`.js`，指编译后的 js）——Node ESM 语义；`bundler` 模式则不要求（打包器自己解析）。
- `moduleResolution: "node10"` 不认 package.json 的 `exports` 字段——新库（只导出 `exports`）在老配置下 `TS2307: Cannot find module`，这是"装了包却找不到类型"的头号原因（解析细节见 10-modules.md）。
- **`moduleDetection`**（TS 4.7+）：`auto`（默认：有 import/export 才当模块）/ `force`（所有文件都当模块，避免全局污染）/ `legacy`。脚本式小项目建议 `force`。
- 运行环境无关项：`target`（JS 语言版本，决定降级幅度）、`lib`（可用全局 API，如 `DOM`/`ES2022`）、`jsx`。

## 6. emit 组：declaration / noEmit / sourceMap / isolatedModules

```json
{
  "compilerOptions": {
    "declaration": true,          // 生成 .d.ts（库必需）
    "declarationMap": true,       // .d.ts 的 sourcemap（monorepo 内跳转好用）
    "emitDeclarationOnly": true,  // 只出 .d.ts，JS 交给 tsup/esbuild
    "outDir": "./dist",
    "sourceMap": true,            // JS 的 sourcemap
    "noEmit": true,               // 只检查不输出（Vite/SWC 负责产码时）
    "removeComments": false
  }
}
```

- 库项目典型组合：`declaration + emitDeclarationOnly + outDir`，产物 JS 由 tsup/esbuild 出（见 17-engineering-tsup-vitest.md）。
- 应用项目典型组合：`noEmit: true`（类型检查归 tsc，产码归 Vite/SWC）。
- **`isolatedModules`**：强制"每个文件可被独立转译"——Babel/SWC/esbuild 的硬前提。开启后：ambient const enum 禁用（`TS2748`，见 07 篇）、`export { SomeType }` 必须写 `export type`（见 10-modules.md）、参数属性等依赖跨文件信息的语法受限。**现代脚手架（Vite/Nest）默认都开着，等于事实标准**。

## 7. 路径组：baseUrl / paths / rootDir

```json
{
  "compilerOptions": {
    "baseUrl": ".",               // paths 的解析基准
    "paths": {
      "@/*": ["src/*"],           // 类型层的别名
      "~utils": ["src/utils/index.ts"] // 也可直指文件
    },
    "rootDir": "./src"            // 输入的"根"，决定 dist 内目录结构
  }
}
```

- ⚠️ **`paths` 只影响类型检查，不重写 emit 的 import 路径**！`import "@/x"` 编译后原样输出，运行时找不到 `@/`——必须由打包器（Vite 的 `resolve.alias`）、tsconfig-paths、jest 的 `moduleNameMapper` 等接手。
- `rootDir` 不设时 = 所有输入文件的公共父目录；混入 `src` 外的文件会把整棵目录搬进 dist（"为什么 dist 里多了一层"的经典原因）。
- monorepo 内互相引用子包优先用 **项目引用**（第 10 节）而不是 paths。

## 8. 装饰器组（Nest 必看）

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,   // 旧版（Stage 2）装饰器，Nest/TypeORM 依赖
    "emitDecoratorMetadata": true,    // 发射 design:type 等元数据，DI 靠它推断注入类型
    "strictPropertyInitialization": false // Nest 实体类常被迫关掉或用 ! 断言
  }
}
```

- 两个 flag 不开，Nest 的 DI/装饰器体系直接失效；TS 5.0 起的标准装饰器（Stage 3）**不带** `emitDecoratorMetadata`，Nest 生态当前仍用旧版（新旧差异见 09-decorators.md）。
- `emitDecoratorMetadata` 与 isolatedModules 理论上冲突（跨文件类型元数据），实际由 `ts-node`/`tsc` 编译路径规避——用 SWC 跑 Nest 时要在 `.swcrc` 里单独开 `legacyDecorator`/`decoratorMetadata`。

## 9. 性能与工具组

| 选项 | 作用 | 说明 |
|---|---|---|
| `incremental: true` | 生成 `.tsbuildinfo`，增量编译 | 大项目必开 |
| `tsBuildInfoFile` | 指定 tsbuildinfo 路径 | 多配置共享/隔离缓存 |
| `composite: true` | 项目引用模式必需 | 隐含 `declaration: true` 与 incremental，且强制 `rootDir` |
| `skipLibCheck: true` | 跳过所有 `.d.ts` 的完整检查 | 官方也默认推荐；争议：第三方 .d.ts 的错误被放过，但换来 2-10 倍提速，实践上利大于弊 |
| `erasableSyntaxOnly`（TS 5.8） | 只允许"可擦除"语法 | 禁 enum、namespace（运行时）、参数属性、`import x = require()`——Node `--experimental-strip-types` 的配套开关 |
| `forceConsistentCasingInFileNames` | 文件名大小写一致 | ✅ 恒开（跨平台 CI 崩溃源） |
| `esModuleInterop` | CommonJS 默认导入兼容 | ✅ 恒开（配合 `allowSyntheticDefaultImports`） |

查编译耗时：

```bash
tsc --noEmit --diagnostics           # Files/Lines/Types/Check time/Emit time 等概览
tsc --noEmit --extendedDiagnostics   # 更细：instantiations（泛型实例化次数，类型体操过重时暴涨）
```

- `Instantiations` 常是慢因：过度递归的条件类型/模板字面量会指数级实例化，优先简化类型而非换机器。

## 10. 项目引用（Project References）与 tsc -b

```json
// tsconfig.json（solution 风格，只做壳）
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/app" }   // app 的 tsconfig 里记得 declaration: true
  ]
}
```

```json
// packages/app/tsconfig.json
{
  "compilerOptions": { "composite": true }, // 引用目标必须 composite
  "references": [{ "path": "../core" }]
}
```

- 每个被引用的子项目必须 `composite: true`（自动要求 declaration、incremental、rootDir 明确）。
- 构建用 **`tsc -b`**（build mode）：按依赖拓扑顺序编译、增量跳过未变更项目；`tsc -b --clean` 清产物；`tsc -b --verbose` 看构建顺序。
- 价值：类型边界显式化（app 只能 import core 的导出，不再是"整仓一个编译上下文"）、增量提速。Nest monorepo 的 app/lib 分离、npm workspaces + tsc -b 是常见组合。

## 11. 三套典型模板

### 11.1 Node 库（发 npm）

```json
// tsconfig.lib.json
{
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,   // JS 交给 tsup/esbuild
    "outDir": "dist",
    "rootDir": "src",
    "isolatedModules": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true   // import type 强制显式，杜绝转译歧义
  },
  "include": ["src"]
}
```

### 11.2 Web 应用（Vite）

```json
// Vite 官方模板形态：tsc 只检查，产码全权交给 Vite
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,                // 关键：tsc 不产码
    "isolatedModules": true,       // esbuild 单文件转译前提
    "skipLibCheck": true,
    "useDefineForClassFields": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }  // 运行时由 vite resolve.alias 对应
  },
  "include": ["src"]
}
```

### 11.3 Nest

```json
// 官方 nest new --strict 模板（节选）
{
  "compilerOptions": {
    "module": "commonjs",          // Node 传统 CJS
    "moduleResolution": "node10",
    "target": "ES2023",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true, // DI 依赖（见 09-decorators.md）
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "strict": true,
    "strictPropertyInitialization": false, // 实体类妥协
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

与 **nest-cli.json** 的关系：`nest build` 读取 nest-cli.json（`"compilerOptions": { "tsConfigPath": "tsconfig.build.json" }`、`deleteOutDir` 等），真正的编译细节仍在 tsconfig(.build).json——`tsconfig.build.json` 与开发用 tsconfig 的区别通常只是 `exclude` 多了测试文件（CLI 细节见 `/Users/hh/offer/技术文档/nest/08-cli`）。

## 12. 要点速查

| 需求 | 配置 |
|---|---|
| 严格检查 | `strict: true` + `noUncheckedIndexedAccess`/`noImplicitOverride` |
| Nest DI | `experimentalDecorators` + `emitDecoratorMetadata` |
| 路径别名 | `baseUrl` + `paths`（运行时需打包器/注册器配合） |
| 库发版 | `declaration` + `emitDeclarationOnly` + `rootDir` |
| 只检查不产码 | `noEmit: true` |
| 单文件转译器兼容 | `isolatedModules: true` |
| 提速 | `skipLibCheck` + `incremental` + 拆项目引用 |
| 多项目构建 | `references` + `composite` + `tsc -b` |
| Node strip-types | `erasableSyntaxOnly` |
| 查性能 | `tsc --extendedDiagnostics` |

> 跨语言对比：Java 的 `pom.xml`/Gradle、Rust 的 `Cargo.toml` 都是"构建+依赖"一体；TS 的 tsconfig 只管**编译行为**（依赖在 package.json），职责更接近 C# 的 `.csproj` 的 `<PropertyGroup>`。概念上最像的是 Rust 的 feature flags：同一份代码，一组开关决定检查严格度与产出形态。

## 13. 常见坑汇总

1. `tsc file.ts` 忽略 tsconfig——"我配了 strict 怎么没报错"的第一原因（第 1 节）。
2. `exclude` 不是不编译：被 include 文件 import 的文件照样参与检查（第 2 节）。
3. extends 的相对路径按**父配置**解析，`outDir`/`rootDir`/`include` 在基座里写死会错位；`compilerOptions` 整项覆盖不深合并（第 3 节）。
4. `module`/`moduleResolution` 乱配：node16/nodenext 下忘写 import 扩展名、node10 不认 `exports` 字段报 `TS2307`（第 5 节）。
5. `paths` 只骗类型检查，运行时 alias 要打包器或 tsconfig-paths 接管（第 7 节）。
6. 没设 `rootDir` 时混入外部文件，dist 目录结构被撑开（第 7 节）。
7. 装饰器两个 flag 忘开，Nest DI 全线失效；SWC 跑 Nest 需在 .swcrc 单独配（第 8 节）。
8. 用 Babel/esbuild 跑库代码却没开 `isolatedModules`，ambient const enum 在别人机器上炸（第 6 节，见 07 篇）。
9. `composite` 子项目忘了 `declaration`/`rootDir`，`tsc -b` 报配置错误（第 10 节）。
10. 大仓库不开 `skipLibCheck`/`incremental`，全量检查以分钟计（第 9 节）。

## 14. 衔接

- `module`/`moduleResolution`/`verbatimModuleSyntax` 的运行时含义见 `10-modules.md`；`import type` 与 isolatedModules 见 `02-typescript-cheatsheet.md`。
- `strictPropertyInitialization`/`useDefineForClassFields`/`noImplicitOverride` 的类语义见 `06-classes.md`。
- `experimentalDecorators`/`emitDecoratorMetadata` 新旧装饰器差异见 `09-decorators.md` 与 `18-decorators-deep.md`。
- `isolatedModules` 对 const enum 的影响见 `07-enums.md`；`erasableSyntaxOnly` 见 `15-typescript-new-features.md`。
- tsup/vitest 工程里的 tsconfig 组合（`emitDeclarationOnly`/`noEmit`）见 `17-engineering-tsup-vitest.md`。
- Nest 的 tsconfig/nest-cli.json 与 monorepo（references + tsc -b）见 `/Users/hh/offer/技术文档/nest/08-cli` 与 `00-用Nest官方Monorepo搭建全栈骨架`。

## 15. 一句话总结

> tsconfig 是 TS 项目的"编译契约"：`strict: true` 一键买齐八项安全网，`module`/`moduleResolution` 的配对决定代码能不能被正确解析与运行，`isolatedModules` 是 Babel/esbuild 时代的事实前提，`paths` 只骗类型不骗运行时，性能靠 `skipLibCheck + incremental + 项目引用`三板斧——记住每个开关背后是"检查、解析、产出"三件事之一，排查配置问题先问自己：这条选项属于哪件事。
