# 方案 02：任务管理 Todo（Task Manager）

> 复杂度：⭐⭐　重点练手自定义装饰器、DTO 校验、异常过滤器、自定义提供者（useFactory）。

## 1. 项目目标

一个多用户任务管理应用：用户注册登录后管理自己的待办任务（增删改查、标记完成、设置优先级与截止日期）。强调本项目所学的「自定义装饰器取当前用户」「useFactory 自定义提供者」「异常过滤器协作」等进阶点。

## 2. 功能清单

- 用户注册 / 登录（JWT）
- 任务的 CRUD（标题、描述、优先级、截止日期、完成状态）
- 任务筛选（按状态 / 优先级 / 关键字）
- 批量标记完成
- 软删除 + 回收站恢复

## 3. 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | NestJS 10、Prisma + SQLite、JWT、class-validator |
| 前端 | React 18 + Vite + TS（或 Vue 3 + Vite + TS） |
| 共享 | pnpm workspace monorepo |

## 4. 目录结构（server）

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/current-user.decorator.ts  # 自定义 @User()（复用 06-装饰器）
│   ├── guards/jwt-auth.guard.ts
│   ├── pipes/validation.pipe.ts
│   └── filters/all-exceptions.filter.ts
├── providers/
│   └── config.provider.ts        # useFactory 注入配置（复用 08-自定义提供者）
├── modules/
│   ├── auth/
│   ├── users/
│   └── tasks/        # TaskService 共享给统计子模块
└── shared/
```

## 5. 数据库设计（Prisma schema 思路）

- **User**：id, email, passwordHash, createdAt
- **Task**：id, title, description, priority(enum), dueDate, done(bool), deletedAt(软删), ownerId

## 6. API 设计（示例）

| 方法 | 路径 | 守卫 | 说明 |
| --- | --- | --- | --- |
| POST | /auth/register | - | 注册 |
| POST | /auth/login | - | 登录 |
| GET | /tasks | JwtAuthGuard | 列表（@User() 取当前用户，仅看自己的） |
| POST | /tasks | JwtAuthGuard | 新建（DTO 校验） |
| PATCH | /tasks/:id | JwtAuthGuard | 更新 |
| POST | /tasks/:id/done | JwtAuthGuard | 标记完成 |
| DELETE | /tasks/:id | JwtAuthGuard | 软删除 |

## 7. NestJS 知识点映射

- **自定义装饰器**：`@User()` 从 `ExecutionContext` 取当前用户（复用 `06-装饰器` 与 `03-守卫` 中 `@User` 思路）
- **useFactory 自定义提供者**：`ConfigProvider` 用 `useFactory` 注入环境变量 / 配置对象（复用 `08-自定义提供者` + `src/providers/use-factory.example.ts`）
- **异常过滤器协作**：校验失败 → `ValidationPipe` 抛 `BadRequestException` → 过滤器包装为标准错误体（复用 `05-过滤器与管道协作`）
- **模块共享**：`TasksModule` 导出 `TaskService` 给 `StatsModule`（复用 `09-模块共享`）

## 8. 前端要点

- 任务卡片列表、优先级颜色、截止日期提醒
- 表单用 TS 类型校验（与后端 DTO 对齐）
- 登录态用 context / pinia 管理

## 9. 详细实现步骤（按优先级分步）

> 本方案在 01 基础上新增三个本项目特色点：**`@User()` 自定义装饰器、`useFactory` 自定义提供者、异常过滤器与管道协作**。步骤 0 同 01，不再赘述。

### 步骤 1：Prisma 初始化（知识点：自定义提供者铺垫）

- **目标**：用 Prisma + SQLite 建模 User / Task。
- **命令**：
  ```bash
  pnpm add prisma @prisma/client
  pnpm exec prisma init --datasource-provider sqlite
  # 编辑 prisma/schema.prisma 定义 User/Task（见第 5 节）
  pnpm exec prisma generate && pnpm exec prisma migrate dev --name init
  ```
- **文件**：`prisma/schema.prisma`、`src/prisma/prisma.service.ts`（`@Injectable()` 封装 `PrismaClient`）。

### 步骤 2：AuthModule + JWT + `@User()` 装饰器（知识点：自定义装饰器）

- **目标**：登录后，控制器里用 `@User()` 直接拿到当前用户，不再手动读 `req.user`。
- **文件**：
  - `src/common/decorators/current-user.decorator.ts`：
    ```ts
    import { createParamDecorator, ExecutionContext } from '@nestjs/common';
    export const User = createParamDecorator(
      (data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
    );
    ```
  - `TasksController`：`findAll(@User() user: User)` → 仅查 `ownerId = user.id` 的任务。
- **验收**：不同用户登录后只能看到自己的任务（隔离）。

### 步骤 3：TasksModule CRUD + 软删除（知识点：管道 / DTO 校验）

- **目标**：任务增删改查；非法 DTO 返回 400 标准体；删除走软删除（`deletedAt`）。
- **文件**：`tasks/task.dto.ts`（`@IsString`、`@IsEnum(['low','mid','high'])` 优先级）、`tasks/tasks.service.ts`（`update` 设 `deletedAt`，`findAll` 过滤 `deletedAt = null`）、回收站恢复接口。
- **注意**：`PATCH` 更新先查归属再改，防越权。

### 步骤 4：useFactory 配置提供者（知识点：自定义提供者）

- **目标**：把配置对象通过 `useFactory` 注入，支持按环境变量切换（如分页大小、软删保留天数）。
- **文件**：`src/providers/config.provider.ts`：
  ```ts
  export const CONFIG = 'APP_CONFIG';
  // app.module.ts
  providers: [{
    provide: CONFIG, useFactory: (config: ConfigService) => ({
      pageSize: +config.get('PAGE_SIZE', 20),
      softDeleteRetentionDays: +config.get('RETENTION', 30),
    }),
    inject: [ConfigService],
  }]
  // 使用：constructor(@Inject(CONFIG) private cfg) {}
  ```
- **验收**：改 `.env` 的 `PAGE_SIZE` 后分页大小随之变化。

### 步骤 5：统一异常过滤器 + 管道协作

- **目标**：`ValidationPipe` 抛 `BadRequestException` → 过滤器包装成标准错误体（复用 01 的 `HttpExceptionFilter`）。
- **验收**：发非法 DTO，响应为统一 `{ code:400, message, data:null }`。

### 步骤 6：前端 + 统计模块（知识点：模块共享）

- **目标**：React 任务看板；`StatsModule` 通过 `TasksModule` 导出的 `TaskService` 做统计（如各优先级数量）。
- **关键点**：`TasksModule` 必须 `exports: [TasksService]` 才能被 `StatsModule` 导入复用。

> 完成 02 后，自定义装饰器与自定义提供者已扎实，可挑战 **03（事务/拦截器）** 或 **04（WebSocket）**。

## 10. 验收标准

- [ ] `@User()` 装饰器正确取到当前登录用户，无法看到他人任务
- [ ] 非法 DTO 返回 400 标准错误体
- [ ] `useFactory` 配置在 `ConfigModule` 可选环境切换
- [ ] 软删除任务不出现在普通列表，可在回收站恢复
