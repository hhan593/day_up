# TypeScript tsconfig.json（编译配置）

> 来源：TypeScript 官方手册 `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html`（最后更新 2026/8/31，© Microsoft）
> 系列位置：`typescript` 补充篇。tsconfig 是 TS 项目的"总开关"，决定编译行为。衔接 `08-cli/scripts.md`(builder/compilerOptions) 与 `modules.md`(模块解析)。

## 一、tsconfig 的作用

- 目录里有 `tsconfig.json` → 该目录是 **TypeScript 项目根**。
- 指定：参与编译的**根文件** + **编译器选项**。
- JS 项目可用 `jsconfig.json`（几乎相同，默认开部分 JS 标志）。
- 调用方式：
  1. `tsc` 不带文件 → 从当前目录向上找 `tsconfig.json`
  2. `tsc -p <dir>` 或 `-p <path/to/tsconfig.json>` 指定
- ⚠️ 命令行直接给输入文件时，`tsconfig.json` **被忽略**。

## 二、files / include / exclude

```json
{
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "node_modules"]
}
```

- `files`：显式列文件清单（少用）。
- `include`：glob 批量包含。
- `exclude`：批量排除（默认排除 `node_modules` 等）。

## 三、extends（继承）

```json
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "compilerOptions": { "preserveConstEnums": true },
  "include": ["src/**/*"]
}
```

- 继承社区/基础配置（如 `github.com/tsconfig/bases` 的 `@tsconfig/node20`）。
- 子配置覆盖父配置，避免重复写运行时相关选项。

## 四、compilerOptions 关键项

> 说明：官网概览页仅列 `module`/`noImplicitAny`/`removeComments`/`preserveConstEnums`/`sourceMap`/`outFile`。下列 `strict`/`target`/`moduleResolution`/`paths`/`outDir`/`declaration`/`noEmit` 等是 TS 官方 Reference 的标准选项，属公认权威配置，标注为**标准补充**。

| 选项 | 作用 | 推荐 |
|------|------|------|
| `target` | 编译到 JS 版本（ES5/ES2017/ES2020...） | 跟运行环境 |
| `module` | 模块输出格式（commonjs/esnext...） | node→commonjs；前端→esnext |
| `moduleResolution` | 模块解析策略 | `node16`/`bundler` |
| `strict` | 打开全套严格检查（见下） | ✅ 必开 |
| `esModuleInterop` | 兼容 CommonJS 默认导入 | ✅ 开 |
| `outDir` | 输出目录 | `./dist` |
| `rootDir` | 输入根 | `./src` |
| `baseUrl` + `paths` | 路径别名 | monorepo 用 |
| `declaration` | 生成 `.d.ts` | 库项目开 |
| `noEmit` | 不输出 JS（只类型检查） | 用 SWC/打包器时开 |
| `sourceMap` | 生成 sourcemap | 开发开 |
| `skipLibCheck` | 跳过 `.d.ts` 检查 | ✅ 开（提速） |
| `forceConsistentCasingInFileNames` | 文件名大小写一致 | ✅ 开 |

### strict 全家桶（开 `strict` 等价）
- `noImplicitAny`：禁止隐式 `any`
- `strictNullChecks`：严格 null 检查（见 `everyday-types.md` 的 `null`）
- `strictFunctionTypes`：函数参数逆变检查
- `strictBindCallApply`：`bind/call/apply` 类型检查
- `strictPropertyInitialization`：类属性必须初始化（见 `classes.md`）
- `noImplicitThis`：`this` 隐式 any 报错
- `alwaysStrict`：输出 `"use strict"`

> ⚠️ 官方强烈建议 `strict: true`。Nest `nest new --strict` 就是这个。

## 五、与装饰器相关的关键项（Nest 必看）

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,      // 旧装饰器（Nest 依赖）
    "emitDecoratorMetadata": true        // 发射类型元数据（DI 依赖）
  }
}
```

- 详见 `decorators.md`。这两个不开，Nest 的 DI 注入失效。

## 六、项目引用（Project References，官网概览页未展开）

```json
// tsconfig.base.json 定义各子项目引用
{
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.spec.json" }]
}
```

- 用于多项目（如 Nest monorepo 的 app/lib 分离）增量编译。
- 配合 `tsc -b`（build mode）按依赖顺序编译。

## 七、Watch 模式

```bash
tsc -w        # 监视改动自动重编译
```

- 对应 `08-cli` 的 `nest build -w` / `nest start --watch`。

## 八、典型 Nest 项目 tsconfig

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 要点速查

| 需求 | 配置 |
|------|------|
| 严格检查 | `strict: true` |
| Nest DI | `experimentalDecorators` + `emitDecoratorMetadata` |
| 路径别名 | `baseUrl` + `paths` |
| 库发版 | `declaration: true` |
| 用 SWC | `noEmit: true`（SWC 负责转译） |
| 监视 | `tsc -w` |

> 跨语言对比：Java 的 `pom.xml`/`build.gradle`、Rust 的 `Cargo.toml`、Go 无显式配置（约定优于配置）——TS 的 `tsconfig.json` 最接近 Babel 的 `.babelrc`/Rust 的编译配置，是"项目级编译契约"。

## 衔接

- 装饰器两个 flag 见 `decorators.md`
- 模块解析 `paths` 见 `modules.md` 与 `技术文档/nest/08-cli/libraries.md`
- SWC/构建器在 CLI 里讲，见 `技术文档/nest/08-cli/scripts.md`
- `isolatedModules` 对 `import type` 的影响见 `modules.md` 与 `typescript-cheatsheet.md`
