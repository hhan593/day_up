# NestJS CLI 工作区与 Monorepo（Workspaces）

> 来源：NestJS 中文官方文档 `https://www.nestjs.com.cn/cli/monorepo`（中文网，与 docs.nestjs.cn 同源；最后更新 2026/8/9）
> 系列位置：`08-cli` 第三章。本文把"单仓库多项目"的标准结构、转换方式、配置文件讲透。

## 一、两种模式回顾

| 模式 | 适用 | 创建方式 |
|------|------|----------|
| 标准模式（Standard） | 单应用、不强调共享 | `nest new` |
| Monorepo 模式 | 多项目/团队、代码复用 | 在标准结构里 `nest generate app/lib` |

- 两者**可随时互转**，不影响其他 Nest 功能。
- 标准模式默认编译器 `tsc`；monorepo 默认 `webpack`（可改）。

## 二、标准模式 → Monorepo 模式

```bash
# 1. 先建标准项目
nest new my-project
cd my-project

# 2. 加一个应用项目，结构自动转 monorepo
nest generate app my-app
```

转换后目录变化：

```
转换前（标准）：
my-project/
  src/  test/  nest-cli.json  package.json  tsconfig.json  .eslintrc.js

转换后（monorepo）：
my-project/
  apps/
    my-project/        # 原项目，成为【默认项目】
      src/  test/  tsconfig.app.json
    my-app/            # 新项目
      src/  test/  tsconfig.app.json
  nest-cli.json  package.json  tsconfig.json  .eslintrc.js
```

⚠️ **转换前提**：原项目必须遵循 **canonical Nest 项目结构**（含 `src` 与 `test` 文件夹）。否则转换失败。

> 通俗理解：monorepo 就是把多个"标准项目"塞进 `apps/` 目录，再共用根部的 `package.json` 和 `node_modules`。默认项目 = 你没指定名字时 `nest build`/`nest start` 作用的那个。

## 三、`nest generate app` vs `nest generate library`

| 命令 | 生成类型 | 含 `main.ts` | 能否独立运行 | 位置 |
|------|----------|--------------|--------------|------|
| `nest generate app <name>` | application | 是 | 能（独立部署） | `apps/<name>` |
| `nest generate library <name>` | library | 否 | 不能（需被导入） | `libs/<name>` |

- `app` 是**完整应用**，自带启动入口。
- `library` 是**通用功能包**（模块/提供者/工具），必须被某个 app 组合才能跑。详见 `libraries.md`。

## 四、Workspace 与多项目管理

- monorepo 用 **workspace** 概念管理成员，由 `nest-cli.json` 的 `projects` 字段协调。
- 项目类型：`application`（完整应用）、`library`（功能包）。
- 每个 workspace 有**默认项目**（必须是 application），由 `nest-cli.json` 顶层 `root` 指向其根目录。

```bash
nest start              # 启动默认项目（如 my-project）
nest start my-app      # 启动指定项目 my-app
nest build --all       # 构建所有项目
```

## 五、nest-cli.json 完整配置

**全局节**（标准与 monorepo 通用）：

```json
{
  "collection": "@nestjs/schematics",   // 原理图集合（勿改）
  "sourceRoot": "src",                  // 标准模式源码根；monorepo 为默认项目源码根
  "compilerOptions": {                  // 编译器选项（详见 scripts.md）
    "tsConfigPath": "tsconfig.json",
    "webpack": false,
    "deleteOutDir": true,
    "assets": [],
    "watchAssets": false,
    "builder": "tsc"
  }
}
```

**projects 节**（仅 monorepo，由 `nest generate app/lib` 自动生成）：

```json
{
  "monorepo": true,
  "root": "apps/my-project",            // 默认项目根目录
  "projects": {
    "my-project": {
      "type": "application",
      "root": "apps/my-project",
      "entryFile": "main",
      "sourceRoot": "apps/my-project/src",
      "compilerOptions": { "tsConfigPath": "apps/my-project/tsconfig.app.json" }
    },
    "my-app": {
      "type": "application",
      "root": "apps/my-app",
      "entryFile": "main",
      "sourceRoot": "apps/my-app/src",
      "compilerOptions": { "tsConfigPath": "apps/my-app/tsconfig.app.json" }
    }
  }
}
```

字段含义：

| 字段 | 说明 |
|------|------|
| `type` | `application` 或 `library` |
| `root` | 项目根目录 |
| `entryFile` | 入口文件名（app 为 `main`，lib 为 `index`） |
| `sourceRoot` | 源码根目录 |
| `compilerOptions.tsConfigPath` | 该项目专属 tsconfig |

> 跨框架对比：Angular 的 `angular.json`、Nx 的 `nx.json`、Turbo 的 `turbo.json` 都是同类"workspace 清单"。Nest 的 `nest-cli.json` 最轻量，只管项目定位与编译。

## 六、sourceRoot 说明

- `nest-cli.json` 的全局 `sourceRoot` 指向**默认项目源码根**（标准模式为 `src`，monorepo 为 `apps/my-project/src`）。
- 每个 project 内也有独立 `sourceRoot`，CLI 用它定位具体项目代码。
- 文档未直接暴露 CLI 的 `--source-root` 参数，配置靠编辑 `nest-cli.json` 完成。

## 七、衔接

- 这套 monorepo 是 `00-用Nest官方Monorepo搭建全栈骨架.md` 的理论依据。
- 库的路径映射看 `libraries.md`。
- 编译选项（`deleteOutDir`/`assets`/`watchAssets`/`builder`）看 `scripts.md`。

## 下一篇

→ `libraries.md`：库项目如何创建、路径映射、编译打包。
