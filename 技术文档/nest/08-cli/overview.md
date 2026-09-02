# NestJS CLI 概述（Overview）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/cli/overview`（最后更新 2026/8/9）
> 系列位置：`08-cli` 第一章。Nest CLI 是贯穿整个项目生命周期的命令行工具，从脚手架到构建部署都由它驱动。

## 一、CLI 是干什么的

Nest CLI 是一个**命令行界面工具**，用于**初始化、开发和维护** Nest 应用。它做的事可以归纳成四类：

1. **搭脚手架**：`nest new` 生成标准项目结构
2. **开发服务**：`nest start --watch` 监听改动、自动重编译
3. **构建打包**：`nest build` 把 TS/代码编译成可部署产物
4. **代码生成**：`nest generate`（别名 `nest g`）按"原理图"批量生成模块/控制器/服务等构件

通俗理解：CLI 就是 Nest 的"工程化外壳"。它把"新建项目→写模块→编译→跑起来"这条流水线标准化了，让所有 Nest 项目长得一样、构建方式一样——这就是文档说的"鼓励结构良好的应用"。

## 二、安装

```bash
# 全局安装（文档默认方式，终端任何位置都能用 nest 命令）
npm install -g @nestjs/cli

# 不想全局安装，用 npx 临时拉取最新版
npx @nestjs/cli@latest
```

注意点：
- 全局安装后，**不同项目共用同一个 CLI 版本**。如果 A 项目用 CLI 10、B 项目用 CLI 11，全局只有一个，可能踩版本不一致的坑。
- `npx @nestjs/cli@latest` 能**显式指定版本**，适合临时尝鲜或 CI 里固定版本。
- 文档推荐把 `nest` 作为 **devDependency** 锁进项目（见 `scripts.md`），避免全局版本漂移。

## 三、基本工作流程

```bash
# 1. 看所有命令
nest --help

# 2. 看某个命令的帮助（含所有可用选项）
nest generate --help

# 3. 新建并运行
nest new my-nest-project
cd my-nest-project
npm run start:dev   # 等价于 nest start --watch
```

- 访问 `http://localhost:3000` 看默认 "Hello World"。
- `start:dev` 改动源文件会**自动重编译、重载**，开发体验类似 nodemon。
- 文档建议使用 **SWC 构建器**（比默认 tsc 快约 10 倍），详见 `commands-reference.md` 的 `--builder` 选项。

## 四、标准模式 vs Monorepo 模式

`nest new` 生成的是**标准模式**（单应用）。Nest 还支持 **Monorepo 模式**（单仓库多项目）。两者差异：

| 功能 | 标准模式 | Monorepo 模式 |
|------|----------|---------------|
| 多个项目 | 独立文件系统结构 | 单一文件系统结构 |
| node_modules / package.json | 独立实例 | 在 monorepo 中共享 |
| 默认编译器 | tsc | webpack |
| 编译器设置 | 单独指定 | 可按项目覆盖的 Monorepo 默认值 |
| 配置文件（eslint/prettier 等） | 单独指定 | 在 monorepo 中共享 |
| `nest build/start` 目标 | 自动唯一项目 | 默认项目 |
| 库管理 | 手动（通常 npm 打包） | 内置支持（路径管理 + 打包） |

- 可**随时从标准切换为 monorepo**（往标准结构里加项目即可），不影响其他 Nest 功能。
- 多项目的细节在 `workspace-monorepo.md`，库在 `libraries.md`。

> 跨框架对比：这跟 **Lerna / Nx / pnpm workspace** 的多包管理思路一致——"一个仓库、多处复用"。Nest 的 monorepo 更偏"框架内建"，比纯 Lerna 轻，但比 Angular 的 `ng generate library` 类似（Angular 也有 workspace 概念）。

## 五、命令语法与别名

格式：

```bash
nest commandOrAlias requiredArg [optionalArg] [options]
```

示例：

```bash
nest new my-nest-project --dry-run
# 别名等价写法
nest n my-nest-project -d
```

- 漏填 `requiredArg` 会**进入交互提示**（如让你输入项目名）。
- 运行 `nest <command> --help` 看该命令的全部选项。

## 六、核心命令一览

| 命令 | 别名 | 描述 |
|------|------|------|
| `new` | `n` | 搭建新**标准模式**应用，含运行所需样板 |
| `generate` | `g` | 根据**原理图（schematic）**生成/修改文件 |
| `build` | — | 编译应用或工作区到输出文件夹 |
| `start` | — | 编译并运行应用（或工作区默认项目） |
| `add` | — | 导入已包装为 nest 库的第三方库，运行其安装原理图 |
| `info` | `i` | 显示已安装 nest 包及系统信息 |

**原理图（schematics）** 是 CLI 代码生成的核心机制：`generate` 和 `add` 都基于它自动生成或修改文件。你可以把它理解成"Angular/Schematics 同款代码模板引擎"——Nest 复用 Angular 的 Schematics 体系来做文件生成。

> 跨框架对比：Angular 的 `ng generate`、Spring Boot 的 `spring init`、Vue 的 `create-vue` 都是同类"脚手架 + 代码生成"工具。Nest 因为作者受 Angular 启发，CLI 机制几乎照搬 Angular Schematics。

## 七、环境要求：Node.js 必须带 ICU

Nest CLI 要求使用**带 ICU（国际化支持）**的 Node.js 二进制：

```bash
# 验证 Node 是否带 ICU
node -p process.versions.icu
```

- 输出是具体版本号（如 `73.1`）→ 正常。
- 输出 `undefined` → Node 二进制**没有国际化支持**，运行时会报 ICU 相关错误。

> 这条是中文文档明确强调的坑。很多精简版/某些 Linux 发行版自带的 Node 是"无 ICU"构建，跑 Nest 会出问题。解决：换用官方 Node 安装包或 `nvm` 装的版本。

## 八、与 `00-用Nest官方Monorepo搭建全栈骨架` 的关系

本目录根下的 `00-用Nest官方Monorepo搭建全栈骨架.md` 是**实操版 monorepo 搭建笔记**；本篇与 `workspace-monorepo.md` 是它的**原理文档**。建议先读原理（本章），再照骨架笔记落地。

## 下一篇

→ `commands-reference.md`：逐个命令的全部选项详解。
