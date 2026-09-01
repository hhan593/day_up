# 08 - CLI（命令行工具）章节索引

> 全部基于 NestJS 中文官方文档整理：
> - 概述 / 命令参考 / 脚本：`https://docs.nestjs.cn/cli/*`（2026/8/9）
> - 工作区（monorepo）：`https://www.nestjs.com.cn/cli/monorepo`（同源中文网）
> - 库：`https://docs.nestjs.cn/cli/libraries`
> - CRUD 生成器：`https://docs.nestjs.cn/recipes/crud-generator/`

## 文档清单

| 文档 | 主题 | 核心内容 |
|------|------|----------|
| `overview.md` | 概述 | 安装（全局/npx）、工作流、`new→start:dev`、标准 vs monorepo 对比、命令语法与别名、核心命令、Node ICU 要求 |
| `commands-reference.md` | 命令参考 | `new`/`generate`/`build`/`start`/`add`/`info` 全部选项详解、schematics 原理图清单 |
| `workspace-monorepo.md` | 工作区 | 标准转 monorepo、`nest g app/lib`、默认项目、`nest-cli.json` 全局节 + projects 节完整字段 |
| `libraries.md` | 库 | `nest g library`、路径映射（tsconfig `paths`）、`tsconfig.lib.json`、`webpack` 打包内联 |
| `scripts.md` | 脚本与构建器 | package.json 脚本、tsc/swc/webpack 三 builder、SWC 不查类型坑、`nest-cli.json` compilerOptions 详解、`assets` 拷贝 |
| `crud-generator.md` | CRUD 生成器 | `nest g resource`、文件清单、transport 选项、CRUD 开关、spec 选项 |

## CLI 大局观（一张图）

```
        ┌─────────────┐
        │  nest new   │  搭标准项目（单应用）
        └──────┬──────┘
               │  nest generate app/lib
               ▼
        ┌─────────────┐   monorepo（多项目单仓库）
        │  nest-cli   │── nest build  (tsc/swc/webpack)
        │    .json    │── nest start  (编译+运行)
        └──────┬──────┘
               │  nest generate <schematic>
               ▼
        ┌─────────────┐  日常构件生成
        │ controllers │  module/service/guard/...
        │   services  │
        │    pipes    │  ← 或 nest g resource 一把出 CRUD 全套
        └─────────────┘
```

## 核心命令速查

```bash
nest n  <name>            # new      新建标准项目
nest g  <schematic> <n>   # generate 生成构件（co/mo/s/gu/...）
nest g  resource <n>      #          生成 CRUD 全套（交互选 transport）
nest g  app <n>           #          加应用项目（转 monorepo）
nest g  lib <n>           #          加库项目
nest b  <name>            # build    编译（-b swc / --all）
nest s  <name>            # start    运行（--watch / --debug）
nest a  <name>            # add      装 nest 库（自动接模块）
nest i                   # info     看环境版本
# 任意命令加 -d / --dry-run 先预览
```

## 高价值坑速查

1. **Node 必须带 ICU**：`node -p process.versions.icu` 不为 `undefined`，否则运行报错。
2. **SWC 不查类型**：生产构建用 `nest build -b swc --type-check` 或补 `tsc --noEmit`。
3. **默认项目**：monorepo 下 `nest build/start` 无参数作用于 `root` 指向的默认项目；指定项目要写名字。
4. **转换 monorepo 前提**：原项目必须含 `src` 与 `test`（canonical 结构），否则 `nest g app` 转失败。
5. **库路径映射**：靠根 `tsconfig.json` 的 `paths`，别名导入 `@scope/lib`，挪库不用改 import。
6. **`new`/`generate` 不走 package.json 脚本**：它们本就是命令，只有 `build`/`start` 进 scripts。
7. **gRPC 用户**别忘在 `nest-cli.json` `assets` 里拷贝 `.proto`（见 `scripts.md` 与 `04-microservices/grpc.md`）。

## 跨章节衔接

| 本篇知识点 | 衔接章节 |
|------------|----------|
| monorepo / `nest g app/lib` | `00-用Nest官方Monorepo搭建全栈骨架.md`（实操落地） |
| schematics 生成 module/service | `01-fundamentals`（modules / providers） |
| `nest g resource` 的 DTO | `02-techniques/validation.md`（class-validator） |
| 微服务/WS/GraphQL transport | `04-microservices` / `05-websockets` / `06-graphql` |
| `assets` 拷贝 `.proto`、webpack 打包 | `04-microservices/grpc.md` |
| 测试文件 `.spec.ts` | `07-testing`（unit / e2e） |

## 下一步

系列最后一个空目录是 `09-recipes`。要继续补吗？
