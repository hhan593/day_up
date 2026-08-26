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

## 9. 详细实现步骤（命令优先，按优先级分步）

> 步骤 0 同 01（monorepo + `nest new` + 装 `@nestjs/config` 等）。本方案新增：**`@User()` 装饰器、`useFactory` 提供者、Prisma**。每步给「目标 → 命令 → 改动 → 验收」。

### 步骤 1：Prisma 初始化（知识点：自定义提供者铺垫）

```bash
pnpm add prisma @prisma/client
pnpm exec prisma init --datasource-provider sqlite
# 编辑 prisma/schema.prisma 写 User/Task（见第 5 节模型）
pnpm exec prisma generate
pnpm exec prisma migrate dev --name init
nest g service prisma
```
- **改动**：`src/prisma/prisma.service.ts` 内 `new PrismaClient()` 并 `onModuleInit` 中 `$connect()`；`prisma.module.ts` `exports:[PrismaService]`。
- **验收**：能 `prismaService.user.findMany()` 查出数据。

### 步骤 2：AuthModule + JWT + `@User()` 装饰器（知识点：自定义装饰器）

```bash
nest g module modules/auth
nest g service modules/auth
nest g guard modules/auth/jwt-auth
nest g decorator common/decorators/current-user   # 生成自定义参数装饰器
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```
- **改动**：
  - `current-user.decorator.ts`：`createParamDecorator((_, ctx)=> ctx.switchToHttp().getRequest().user)` → 控制器里 `@User() user` 直接取当前用户。
  - `auth.service.ts`：`register` 哈希密码、`login` 签发 JWT；`auth.module.ts` `imports:[PrismaModule, JwtModule.register({secret})]`。
- **验收**：不同用户登录后，`GET /tasks` 只返回自己 `ownerId` 的任务（数据隔离）。

### 步骤 3：TasksModule CRUD + 软删除（知识点：管道 / DTO 校验）

```bash
nest g module modules/tasks
nest g service modules/tasks
nest g controller modules/tasks
nest g class modules/tasks/task.dto --flat
```
- **改动**：`task.dto.ts` 用 `@IsString() title`、`@IsEnum(['low','mid','high']) priority`、`@IsBoolean() done`；`tasks.service.ts` 用 Prisma：`create({data:{...dto, ownerId:user.id}})`、`update`（先校验归属）、`remove` 设 `deletedAt`（软删）；`findAll` 过滤 `deletedAt=null`；额外加回收站 `restore(id)`。
- **验收**：非 owner 调 `PATCH /tasks/:id` 返回 403；`DELETE` 后列表不再出现、回收站可恢复。

### 步骤 4：useFactory 配置提供者（知识点：自定义提供者）

```bash
nest g module providers/config
```
- **改动**：`config.provider.ts` 导出 `export const CONFIG='APP_CONFIG'`，`config.module.ts`：
  ```ts
  providers:[{
    provide: CONFIG,
    useFactory: (c: ConfigService) => ({
      pageSize: +c.get('PAGE_SIZE', 20),
      retentionDays: +c.get('RETENTION', 30),
    }),
    inject: [ConfigService],
  }],
  exports: [CONFIG],
  ```
  用法：`constructor(@Inject(CONFIG) private cfg){}` 控制分页大小。
- **验收**：改 `.env` 的 `PAGE_SIZE`，列表分页条数随之变化。

### 步骤 5：统一异常过滤器 + 管道协作（复用 01）

```bash
nest g filter common/filters/http-exception
```
- **改动**：过滤器统一包装 `ValidationPipe` 抛出的 `BadRequestException` 为标准体（同 01 步骤 5）。
- **验收**：发非法 DTO → `{ code:400, message, data:null }`。

### 步骤 6：前端 + 统计模块（知识点：模块共享）

```bash
pnpm dlx create-vite@latest packages/web --template react-ts
cd packages/web && pnpm i && pnpm add axios
nest g module modules/stats
nest g service modules/stats
```
- **改动**：`stats.module.ts` `imports:[TasksModule]`；`stats.service.ts` 注入 `TasksService` 统计各优先级数量；`TasksModule` 必须 `exports:[TasksService]`。
- **验收**：看板显示「进行中/已完成/各优先级」计数，且与当前用户数据一致。

> 完成后自定义装饰器与自定义提供者已扎实，可挑战 **03（事务/拦截器）** 或 **04（WebSocket）**。

## 10. 验收标准

- [ ] `@User()` 装饰器正确取到当前登录用户，无法看到他人任务
- [ ] 非法 DTO 返回 400 标准错误体
- [ ] `useFactory` 配置在 `ConfigModule` 可选环境切换
- [ ] 软删除任务不出现在普通列表，可在回收站恢复
