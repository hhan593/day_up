# 09 - Recipes（配方/技术）章节索引

> 全部基于 NestJS 中文官方文档（docs.nestjs.cn）及其同源中文网（nestjs.com.cn）抓取整理，最后更新 2026/8/9。
> 路径说明：recipes 子篇散落在 `techniques/*`、`security/*`、`recipes/*` 三个命名空间下，已逐个核实真实 URL（如配置 `techniques/configuration`、认证 `security/authentication`、passport `recipes/passport`、OpenAPI 在 `nestjs.com.cn/openapi`）。

## 文档清单（15 篇）

| 文档 | 主题 | 核心内容 |
|------|------|----------|
| `configuration.md` | 配置 | `@nestjs/config`、`ConfigModule.forRoot`、`ConfigService.get`、`isGlobal`、Joi 校验、`load` 自定义配置 |
| `sql.md` | SQL/TypeORM | `TypeOrmModule.forRoot/forFeature`、`@InjectRepository`、`Entity`、Repository、`synchronize` 坑、多库 |
| `mongodb.md` | Mongo/Mongoose | `@nestjs/mongoose`、`MongooseModule`、`@Schema/@Prop`、`@InjectModel`、`forFeatureAsync`、SQL↔Mongo 对照 |
| `validation.md` | 验证 | `class-validator`、`ValidationPipe`、`whitelist`/`forbidNonWhitelisted`、`transform`、`@Type`、自定义校验 |
| `caching.md` | 缓存 | `@nestjs/cache-manager`、`CacheInterceptor`、`CACHE_MANAGER` 手动读写、Redis store |
| `serialization.md` | 序列化 | `class-transformer`、`@Exclude/@Expose`、`ClassSerializerInterceptor`、分组输出 |
| `task-scheduling.md` | 定时任务 | `@nestjs/schedule`、`@Cron/@Interval/@Timeout`、`SchedulerRegistry`、6 位 cron 表达式 |
| `authentication.md` | 认证授权 | Passport、`LocalStrategy`/`JwtStrategy`、`AuthGuard('local'/'jwt')`、`JwtService.sign`、`@User()` 装饰器 |
| `openapi.md` | Swagger | `@nestjs/swagger`、`DocumentBuilder`、`SwaggerModule.setup`、`@ApiTags/@ApiProperty`、`addBearerAuth` |
| `queues.md` | 队列 | `@nestjs/bull`、`BullModule.registerQueue`、`@InjectQueue`、`@Processor/@Process`、重试/事件 |
| `sse.md` | 服务端推送 | `@Sse`、`Observable<MessageEvent>`、配合 `EventEmitter`、与 WebSocket 对比 |
| `http-module.md` | HTTP 模块 | `@nestjs/axios`、`HttpService`、`firstValueFrom`、全局配置 |
| `file-upload.md` | 文件上传 | `FileInterceptor`/`FilesInterceptor`、`@UploadedFile`、`diskStorage`、`fileFilter` |
| `cors.md` | CORS | `enableCors`、`cors: true`、`origin`/`credentials`（标准实践补充） |
| `prisma.md` | Prisma | `prisma init`/`migrate`、`PrismaService extends PrismaClient`、`@Global` 提供、TypeORM↔Prisma 对照 |

## Recipes 大局观（一张图）

```
                    ┌─────────────────────────────┐
                    │   配置 configuration         │ ← 所有篇都依赖
                    └──────────────┬──────────────┘
            ┌──────────┬──────────┼──────────┬──────────┐
            ▼          ▼          ▼          ▼          ▼
        数据库层      安全层      表现层      异步层      外部层
   sql/mongodb/   auth/cors/   validation/  queues/    http-module/
   prisma        openapi       serialization sse       file-upload
                                 caching     task-sched
```

## 高频组合推荐

1. **标准 CRUD 应用**：`configuration` + `sql/prisma` + `validation` + `serialization` + `openapi`
2. **带登录的应用**：`configuration` + `sql` + `auth` + `validation` + `cors` + `openapi`
3. **后台作业系统**：`queues` + `task-scheduling` + `http-module`
4. **实时/通知**：`sse`（轻量）或 `05-websockets`（双向）

## 高价值坑速查

1. **`synchronize: true` 只开发用**：生产用 migration，否则丢数据（见 `sql.md`）。
2. **ValidationPipe `whitelist`**：强烈开，防越权字段注入（如 `isAdmin`）。
3. **序列化 `@Exclude`**：密码等敏感字段必须排除，且要返回**类实例**拦截器才生效。
4. **HTTP 模块 cold Observable**：必须 `await firstValueFrom(...)` 才发请求。
5. **CORS 凭据**：`credentials: true` 时 `origin` 不能 `*`，必须显式列出。
6. **Prisma 前置**：必须配 `ConfigModule`，`DATABASE_URL` 才从 `.env` 读到。
7. **认证秘钥**：`secretOrKey` 放 `ConfigModule`，勿硬编码（见 `auth.md`）。

## 跨章节衔接

| 本篇知识点 | 衔接章节 |
|------------|----------|
| `ConfigModule` 读 .env | `08-cli/scripts.md`（`--env-file`） |
| `forRoot/forFeature/@Inject` 数据库模式 | `01-fundamentals`（modules/providers/dependency-injection） |
| `ValidationPipe`/`CacheInterceptor` | `01-fundamentals/pipes.md`/`interceptors.md` |
| `AuthGuard` 是守卫 | `01-fundamentals/guards.md`、`03-security` |
| `@User()` 自定义装饰器 | `01-fundamentals/custom-decorators.md` |
| `PrismaService implements OnModuleInit` | `01-fundamentals/lifecycle-events.md` |
| SSE 配合 EventEmitter | `02-techniques`（事件模块） |
| HTTP 模块 Observable | `12-RxJS核心概念与API详解.md` |
| CRUD 生成的 DTO 加校验 | `08-cli/crud-generator.md` |
| GraphQL 输入类即 DTO | `06-graphql` |

## 本系列完成情况

至此 `01-fundamentals` → `02-techniques` → `03-security` → `04-microservices` → `05-websockets` → `06-graphql` → `07-testing` → `08-cli` → `09-recipes` **九个章节全部补充完成**，构成 NestJS 完整知识文档体系。
