# 用 Nest 官方 Monorepo 搭建全栈骨架（唯一指南）

> 本仓库唯一的搭建指南。使用 **Nest 官方 monorepo 模式**：用 `nest new` + `nest g app` + `nest g lib` 由 Nest CLI 原生管理多应用与共享库，**不依赖 pnpm workspace、不手搓目录结构**。
> 后端 = 官方 monorepo 应用；前端 = Vite + React，放在同一仓库根目录（非 Nest 管理，但同仓）。
> 目标产物等价于 `docs/project/01-blog` 里的骨架，只是工程组织方式改用官方 monorepo。

---

## 0. 为什么用官方 monorepo

Nest 自带 monorepo 能力：一个仓库内放多个 `application`（apps）+ 多个 `library`（libs），由 `nest-cli.json` 和 `tsconfig paths` 自动管理。

```
nest-blog/                 # 仓库根（git 仓库）
├── nest-cli.json          # CLI 自动维护所有 apps/libs
├── tsconfig.json          # baseUrl + paths 指向 libs/*（内部包零配置引用）
├── package.json           # 只有一个，所有依赖装在这里
├── apps/
│   └── server/            # 后端 Nest 应用（nest start server）
├── libs/
│   └── common/            # 共享：守卫/管道/装饰器/实体/DTO
└── web/                   # 前端 Vite + React（同仓，但独立 package.json）
```

优势：
- **单一 `package.json` / 单一 `node_modules`**，依赖只在根装一次
- 跨应用共享代码：`import { JwtAuthGuard } from '@nest-blog/common'`，由 `tsconfig paths` 解析，无需发包
- `nest start <app>` / `nest build <app>` 按应用编译，CLI 原生支持
- 官方文档《Monorepo》章节即此模式

> 注意边界：Nest 官方 monorepo **只管 Nest 应用和库**。React 前端 Nest CLI 生成不了，所以用 Vite 在同仓建一个 `web/` 目录，作为消费方。这是官方 monorepo + 前端的最实用组合。

---

## 1. 用 `nest new` 初始化 monorepo 根

```bash
nest new nest-blog -p pnpm
cd nest-blog
```

`nest new` 生成一个合法 Nest 项目（含 `nest-cli.json`、`tsconfig.json`、`src/`）。把它规整为 monorepo 结构——将默认 `src/` 作为第一个 app：

```bash
mkdir -p apps
mv src apps/server
```

编辑根 `nest-cli.json`，开启 monorepo 并登记应用：

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "apps/server/src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "tsConfigPath": "tsconfig.json"
  },
  "monorepo": true,
  "root": "apps/server",
  "projects": {
    "server": {
      "type": "application",
      "root": "apps/server",
      "entryFile": "main",
      "sourceRoot": "apps/server/src",
      "compilerOptions": {
        "tsConfigPath": "apps/server/tsconfig.app.json"
      }
    }
  }
}
```

> 关键字段：`"monorepo": true` 开启多应用；`projects` 登记每个应用；`webpack: true` 支持路径别名编译。

---

## 2. 用 `nest g lib` 建共享库（横切件全放这）

这是 monorepo 精髓——守卫/管道/装饰器/实体放进 `libs/common`，被后端复用：

```bash
nest g lib common
```

CLI 自动创建 `libs/common/` 并在根 `tsconfig.json` 写入路径别名：

```jsonc
// tsconfig.json 中 Nest 自动加的（确认存在即可）
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@nest-blog/common": ["libs/common/src"],
      "@nest-blog/common/*": ["libs/common/src/*"]
    }
  }
}
```

在 `libs/common` 内继续生成共享元件，用 `-p common` 指定目标库：

```bash
nest g guard jwt-auth -p common
nest g guard role -p common
nest g pipe validation -p common
nest g decorator user -p common
nest g filter http-exception -p common
nest g class user.entity -p common --no-spec
```

在 `apps/server` 中引用，零配置：

```ts
import { JwtAuthGuard, UserEntity } from '@nest-blog/common';
```

---

## 3. 在后端 app 用 `nest g` 生成业务模块

```bash
cd apps/server
nest g resource users
nest g resource auth
nest g resource articles
```

`nest g resource` 会自动把生成的 `Module` 写进 `apps/server/src/app.module.ts` 的 `imports`，无需手写装配。

> 实体建议放进 `libs/common`（共享数据模型），service/controller 留在本 app。

---

## 4. 依赖只装一次（根 package.json）

monorepo 只有一个 `package.json`，依赖全在根装：

```bash
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt \
        @nestjs/typeorm typeorm mysql2 bcrypt class-validator class-transformer \
        @nestjs/swagger rxjs
# 02/03 额外：pnpm add @nestjs/mapped-types
# 04 额外：pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

---

## 5. 前端：同仓内的 Vite + React

Nest CLI 不管前端，用 Vite 官方命令在仓库根建 `web/`（与 `apps/`、`libs/` 平级）：

```bash
pnpm create vite@latest web --template react-ts
cd web
pnpm add axios @tanstack/react-query react-router-dom
# 04 额外：pnpm add socket.io-client
cd ..
```

编辑 `web/vite.config.ts` 加 `/api` 代理到后端 3000，并在 `web/src/main.tsx` 包一层 `QueryClientProvider`（同原骨架）。这两处是前端常规配置，Nest 不涉及。

---

## 6. 配置后端入口与根模块

`apps/server/src/main.ts`（加全局管道 + Swagger）：

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  const config = new DocumentBuilder()
    .setTitle('Blog API').setDescription('个人博客系统 01').setVersion('1.0').addBearerAuth().build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`apps/server/src/app.module.ts` 用 `nest g resource` 后已自动含各业务模块，只需补 `ConfigModule`：

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
// ... 其他模块

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule /* ... */],
})
export class AppModule {}
```

> `.env` 需手动建一份（CLI 不生成）：`apps/server/.env` 含 `PORT/DB_*/JWT_*`。

---

## 7. 运行与验证

```bash
# 后端（在仓库根，CLI 读 nest-cli.json）
nest start server

# 前端（另开终端）
cd web && pnpm dev
```

- 后端 `http://localhost:3000`，Swagger `/api/docs`
- 前端 `http://localhost:5173`，`/api` 代理到 3000
- `import { JwtAuthGuard } from '@nest-blog/common'` 能解析 → `tsconfig paths` 生效

---

## 8. 常用 monorepo 命令

```bash
nest g app <name>        # 新增应用（自动注册进 nest-cli.json）
nest g lib <name>        # 新增共享库（自动加 tsconfig paths）
nest g <schematic> <n> -p <app|lib>   # 在某应用/库内生成元件
nest start <app>         # 运行指定应用
nest build <app>         # 构建指定应用
nest build               # 构建全部
nest info                # 查看 monorepo 结构与依赖
```

---

## 9. 下一步：照计划书写业务

骨架跑通后，按 `docs/project/0X-*.md`：
- 共享件（`JwtAuthGuard` / `RoleGuard` / `@User()` / `ValidationPipe` / 实体）放 `libs/common`
- 业务逻辑写进 `apps/server` 各 resource 的 service/controller，复用 `libs/common`
- 04 聊天室：`ChatGateway` 放 `apps/server`，在线状态 `Subject` 放 `libs/common`
- 前端在 `web/src` 调 `/api/*`

详细 API、实体字段、知识点映射见各方案文档。

---

## 10. 排错

- **`nest start server` 报找不到项目** → 检查 `nest-cli.json` 的 `projects` 是否登记 `server`，且 `monorepo: true`。
- **`@nest-blog/common` 解析失败** → 确认 `tsconfig.json` 的 `paths` 指向 `libs/common/src`；webpack 模式下 `nest-cli.json` 需 `webpack: true`。
- **前端 `/api` 404** → 检查 `web/vite.config.ts` 的 proxy `rewrite` 去掉 `/api` 前缀（后端路由不带 `/api`）。
- **依赖装了仍报模块缺失** → monorepo 只在根 `package.json` 装；别在 `apps/server` 里单独 `pnpm add`。
