# NestJS CLI 脚本与构建器（Scripts & Builders）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/cli/scripts`（最后更新 2026/8/9）
> 系列位置：`08-cli` 第五章。本文讲 `nest` 命令如何封装进 package.json、三套编译器的差异、以及 nest-cli.json 的编译选项。

## 一、`nest` 二进制与包脚本

`nest` 命令是**操作系统级二进制**，全局安装时不受项目依赖管理。文档**推荐**把它作为 **devDependency** 锁进项目，避免团队版本漂移。

`nest new` 或克隆 `typescript-starter` 时，Nest 会自动在 `package.json` 写入 `build` / `start` 脚本，并本地安装 `typescript` 等为 devDependency。

标准调用：

```bash
npm run build   # 等价于执行本地 nest build
npm run start   # 等价于执行本地 nest start
```

推荐的 `package.json` scripts：

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch"
  }
}
```

⚠️ 注意：`nest new` 和 `nest generate` **不属于**构建/执行流程，因此不通过内置 package.json 脚本管理（它们本就是命令本身）。

## 二、Builder（构建器）三选一

`nest` 封装了底层编译工具，按项目类型与配置切换：

| Builder | 适用 | 特点 |
|---------|------|------|
| `tsc` | 标准模式默认 | 类型安全、慢、单文件输出 |
| `swc` | 推荐开发/构建 | 用 Rust 写，比 tsc 快约 10 倍，但**默认不查类型** |
| `webpack` | monorepo 默认 | 打包（库内联、tree-shake），适合多项目 |

行为拆解：
- **build**：对 `tsc` 或 `swc`（标准项目）的封装；monorepo 用基于 `ts-loader` 的 `webpack`。仅开箱处理 `tsconfig-paths`，不加额外编译步骤。
- **start**：先确保已构建（同 `nest build`），再以简便方式调 `node` 跑编译后应用。
- **generate**：用于生成项目/构件。

指定 builder：

```bash
nest build -b swc          # SWC 编译
nest build -b webpack      # webpack 编译
nest start -b tsc          # tsc 编译后运行
```

> ⚠️ SWC 坑：SWC 只转译**不查类型**。生产构建务必 `nest build -b swc --type-check`，或单独 `tsc --noEmit` 兜底类型安全。

## 三、自定义脚本与编译流程

文档明确开发者可自由定制：
- 通过 `nest start` 选项定制，或完全替换该流程。
- 脚本选项：`--path`（tsconfig）、`--webpack`、`--webpackPath`（自定义 webpack 配置）。
- 改 `tsconfig.json` 自定义 tsc/webpack 选项。
- 可跑完全自定义的构建流程来编译 TS，甚至直接用 `ts-node` 执行 TS。
- 用包脚本后，团队成员都跑相同版本命令，依赖可控。

## 四、nest-cli.json 编译选项详解

虽然 scripts 页正文未列 `nest-cli.json` 字段，但结合 overview 与 workspace 篇，`compilerOptions` 完整字段如下：

```json
{
  "compilerOptions": {
    "tsConfigPath": "tsconfig.json",   // 默认项目 tsconfig 路径
    "webpack": false,                  // 是否强制 webpack（monorepo 默认 true）
    "deleteOutDir": true,              // 构建前删 dist
    "assets": [],                      // 拷贝非 TS 资产（如 .proto/.html）
    "watchAssets": false,              // 监视资产改动
    "builder": "tsc",                  // 默认 builder：tsc/swc/webpack
    "typeCheck": true                  // swc 下是否类型检查
  }
}
```

常用场景：
- **拷贝静态资源**：`assets: [{ "include": "libs/**/*.proto", "outDir": "dist" }]`（gRPC 项目必配，见 `04-microservices/grpc.md`）。
- **增量构建**：`deleteOutDir: false` 保留旧产物（一般保持 `true` 更干净）。

## 五、环境加载

`nest start --env-file .env` 从文件加载环境变量到 `process.env`，等价于 `dotenv`。配合 `ConfigModule`（见 `02-techniques` 配置章节）使用最顺。

## 衔接

- builder 与 `tsconfig-paths` 是 `01-fundamentals` 动态模块、`02-techniques` 配置的环境基础。
- `assets` 拷贝 `.proto` 是 `04-microservices/grpc.md` 的前提。
- monorepo 的 `tsConfigPath` 每个项目独立，见 `workspace-monorepo.md`。

## 下一篇

→ `crud-generator.md`：一键生成完整 CRUD 资源。
