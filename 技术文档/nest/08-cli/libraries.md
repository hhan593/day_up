# NestJS CLI 库（Libraries）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/cli/libraries`（最后更新 2026/8/9）
> 系列位置：`08-cli` 第四章。本文讲 monorepo 下"库项目"的用法——它是多项目代码复用的核心载体。

## 一、什么是库（library）

库是 monorepo 中**不可独立运行、需被导入使用**的 Nest 项目。它封装模块/提供者/工具，供多个 application 复用，避免复制粘贴。

- 典型场景：公用 `AuthModule`、`LoggerService`、`database` 连接、DTO 定义等。
- 跨组织分发（发 npm 包）不在本文范围——文档明确 monorepo 库用于**组内紧密复用**，跨组织建议用物理 npm 包。

## 二、创建库

```bash
nest g library my-library
```

执行时会交互提示：

```
What prefix would you like to use for the library (default: @app)?
```

输入前缀（如 `@app`），回车后生成结构：

```
libs/my-library/
  src/
    index.ts                 # 入口（对应 entryFile: "index"）
    my-library.module.ts
    my-library.service.ts
  tsconfig.lib.json          # 库专属 tsconfig
```

`nest-cli.json` 的 `projects` 自动新增：

```json
"my-library": {
  "type": "library",          // 注意是 library，不是 application
  "root": "libs/my-library",
  "entryFile": "index",       // 库入口是 index，不是 main
  "sourceRoot": "libs/my-library/src",
  "compilerOptions": { "tsConfigPath": "libs/my-library/tsconfig.lib.json" }
}
```

> `type: "library"` 和 `entryFile: "index"` 是库与 app 的关键差异（app 是 `application` + `main`）。

## 三、路径映射（path mapping）

Nest 利用 TypeScript 的 **tsconfig `paths`** 让库导入"透明化"。

创建库时，自动更新**根** `tsconfig.json` 的 `paths`（以前缀 `@app` 为例）：

```json
{
  "compilerOptions": {
    "paths": {
      "@app/my-library": ["libs/my-library/src"],
      "@app/my-library/*": ["libs/my-library/src/*"]
    }
  }
}
```

应用里直接别名导入，不用写相对路径：

```ts
import { MyLibraryModule } from '@app/my-library';
```

底层由 Nest 自动解析到 `libs/my-library/src`。换库、挪位置都不用改 import 路径，重构友好。

> 跨框架对比：这和 **TypeScript path aliases**、**Nx 的 `@scope/lib`** 别名机制、webpack `resolve.alias` 同思路。Nest 把它接进 monorepo 自动配置。

## 四、库的 tsconfig 配置

每个库有独立的 `tsconfig.lib.json`，**扩展（extends）**根部 monorepo 级 `tsconfig.json`：

```json
// libs/my-library/tsconfig.lib.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/my-library"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

可在 `nest-cli.json` 的 `compilerOptions.tsConfigPath` 指向它（CLI 已自动填好）。要改库的严格性/目标版本，改这个文件即可，不影响其他项目。

## 五、编译与打包

```bash
# 单独构建库
nest build my-library
```

打包机制：
- 库通过 `index.js`（`entryFile: "index"`）导出函数。
- monorepo 默认编译器 **webpack** 会把转译后的 JS 打包为单个文件（也可切 `tsc`）。
- 当某 app `import { MyLibraryModule }` 后，运行 `nest build <app>` 会**自动解析并打包 app 及其库依赖**，可直接部署。

```bash
# 构建依赖了该库的应用，库会被一并打包
nest build my-project
```

> 部署提示：monorepo 下的 app 构建产物已内联库代码，部署时只部署 app 的 `dist`，无需单独发库。

## 六、文档未覆盖的说明

- **publish**：本文档**未提及**把库发到 npm registry 的流程。若需跨组织分发，按标准 npm 包流程（写 `package.json` 的 `name`/`version`/`exports`/`peerDependencies`，再 `npm publish`）。
- **peerDependencies**：本文档未涉及。作为可复用库，建议在库自己的 `package.json`（若有）声明 `peerDependencies`（如 `@nestjs/common`、`@nestjs/core`），避免消费方版本冲突。

## 衔接

- 库的定位与编译选项在 `workspace-monorepo.md` 的 `nest-cli.json` 节。
- 应用如何组合库：`import { MyLibraryModule } from '@app/my-library'` 放进 `imports: []`。
- 实操参考 `00-用Nest官方Monorepo搭建全栈骨架.md`。

## 下一篇

→ `scripts.md`：package.json 脚本、builder 配置、nest-cli.json 编译选项。
