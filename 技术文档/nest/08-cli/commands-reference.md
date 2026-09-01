# NestJS CLI 命令参考（Command Reference）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/cli/usages`（最后更新 2026/8/9）
> 系列位置：`08-cli` 第二章。本文把 `new` / `generate` / `build` / `start` / `add` / `info` 六个命令的选项逐一展开。

## 一、`nest new`（别名 `n`）

**作用**：创建并初始化新的**标准模式** Nest 项目（生成文件夹、配置文件、`/src` 与 `/test` 子目录及默认代码）。

**用法**：

```bash
nest new <name> [options]
```

**常用选项**：

| 选项 | 简写 | 说明 |
|------|------|------|
| `--dry-run` | `-d` | 模拟变更、**不写文件系统**（先看会生成什么） |
| `--skip-git` | `-g` | 跳过 `git init` |
| `--skip-install` | `-s` | 跳过 `npm install`（后面再手动装） |
| `--package-manager` | `-p` | 指定包管理器：`npm` / `yarn` / `pnpm` |
| `--language` | `-l` | 指定语言：`ts` 或 `js` |
| `--collection` | `-c` | 指定原理图集合（自定义模板用） |
| `--strict` | — | 开启**严格 TS 编译选项**（`strict: true`） |

示例：

```bash
# 用 pnpm、跳过安装、开严格模式，先 dry-run 看效果
nest new my-app -p pnpm -s --strict -d
# 确认无误后去掉 -d 真正生成
nest new my-app -p pnpm -s --strict
```

> 实用建议：CI 里常用 `-d` 校验脚手架幂等性；本地第一次建项目一般直接 `--strict` 开严格模式，避免后期返工。

## 二、`nest generate`（别名 `g`）

**作用**：根据**原理图（schematic）**生成/修改文件。这是日常最高频命令。

**用法**：

```bash
nest generate <schematic> <name> [options]
```

**支持的原理图（schematic）及别名**：

| 原理图 | 别名 | 生成内容 |
|--------|------|----------|
| `app` | — | 应用（monorepo 多项目） |
| `library` | `lib` | 库（monorepo 共享代码） |
| `class` | `cl` | 类 |
| `controller` | `co` | 控制器 |
| `decorator` | `d` | 装饰器 |
| `filter` | `f` | 异常过滤器 |
| `gateway` | `ga` | WebSocket 网关 |
| `guard` | `gu` | 守卫 |
| `interface` | `itf` | 接口 |
| `interceptor` | `itc` | 拦截器 |
| `middleware` | `mi` | 中间件 |
| `module` | `mo` | 模块 |
| `pipe` | `pi` | 管道 |
| `provider` | `pr` | 提供者 |
| `resolver` | `r` | GraphQL 解析器 |
| `resource` | `res` | **CRUD 资源**（批量生成，见 `crud-generator.md`） |
| `service` | `s` | 服务 |

**常用选项**：

| 选项 | 说明 |
|------|------|
| `-d` / `--dry-run` | 模拟，不写文件 |
| `-p` / `--project` | 指定目标项目（monorepo 下必填其一） |
| `--flat` | **不生成文件夹**，直接在当前目录出文件 |
| `-c` / `--collection` | 指定原理图集合 |
| `--spec` / `--no-spec` | 是否生成 `.spec.ts` 测试文件 |
| `--skip-import` | 不自动把构件 `import` 进 module |

示例：

```bash
# 生成 cats 模块 + 控制器 + 服务（默认带 spec）
nest g resource cats

# 生成不带测试文件的控制器，且不建文件夹
nest g co cats --no-spec --flat
```

> 跨框架对比：`ng generate` 几乎同款（Nest 直接复用 Angular Schematics）。Spring 没有等价 CLI，靠 Spring Initializr 网页或 IDE 插件。

## 三、`nest build`

**作用**：编译应用或工作区，处理路径映射、Swagger/GraphQL 插件注释等。

**用法**：

```bash
nest build <name> [options]
```

**常用选项**：

| 选项 | 简写 | 说明 |
|------|------|------|
| `--path` | `-p` | tsconfig 路径 |
| `--config` | `-c` | nest-cli 配置路径 |
| `--watch` | `-w` | **监视模式**（改动即重编译） |
| `--builder` | `-b` | 指定编译器：`tsc` / `swc` / `webpack` |
| `--watchAssets` | — | 监视非 TS 资产（图片/模板等） |
| `--type-check` | — | 使用 SWC 时**开启类型检查**（SWC 默认只转译不查类型） |
| `--all` | — | 构建 monorepo **所有**项目 |

示例：

```bash
# SWC 编译 + 类型检查 + 监视
nest build -b swc --type-check -w

# 构建 monorepo 全部项目
nest build --all
```

> 坑提醒：SWC 比 tsc **快很多但不做类型检查**。CI 里生产构建建议 `nest build -b swc --type-check`，或单独跑 `tsc --noEmit` 兜底类型安全。

## 四、`nest start`

**作用**：先编译再运行应用（或工作区默认项目）。

**用法**：

```bash
nest start <name> [options]
```

**常用选项**：

| 选项 | 简写 | 说明 |
|------|------|------|
| `--watch` | `-w` | 监视重载（开发主力） |
| `--builder` | `-b` | 编译工具：`tsc` / `swc` / `webpack` |
| `--debug` | `-d` | 调试模式（挂 `--inspect`） |
| `--exec` | `-e` | 指定运行时二进制（默认 `node`） |
| `--env-file` | — | 从文件加载环境变量（如 `.env`） |
| `-- [key=value]` | — | 把参数透传给 `process.argv` |

示例：

```bash
# 开发：监视 + 调试
nest start --watch --debug

# 从 .env 加载变量并传自定义参数
nest start --env-file .env -- CUSTOM_FLAG=1
```

## 五、`nest add`

**作用**：导入**已包装为 nest 库**的第三方库，并运行其**安装原理图**（自动帮你装依赖、改 `app.module.ts` 等）。

**用法**：

```bash
nest add <name> [options]
```

> 典型例子：`nest add @nestjs/swagger`、`nest add @nestjs/config`、`nest add @nestjs/graphql`。这些库自带 schematic，`add` 会一把梭地接好。对比手动 `npm i` + 改代码，`nest add` 省掉样板。

## 六、`nest info`（别名 `i`）

**作用**：显示已安装 nest 包版本及系统信息（Node、OS、包管理器）。

**用法**：

```bash
nest info
```

输出含系统信息与各 `@nestjs/*` 模块版本，排错时常用（比如确认 `@nestjs/graphql` 与 `@nestjs/core` 版本是否匹配）。

## 七、命令速查表

```bash
nest n  <name>            # new      新建标准项目
nest g  <schematic> <n>   # generate 生成构件
nest b  <name>            # build    编译
nest s  <name>            # start    运行
nest a  <name>            # add      装 nest 库
nest i                   # info     看环境
# 任意命令加 -d / --dry-run 先预览
```

## 下一篇

→ `workspace-monorepo.md`：标准模式转 monorepo、多项目管理、nest-cli.json 详解。
