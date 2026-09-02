# Recipes - 配置（Configuration）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/configuration`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第一章。配置是几乎所有应用的基础，本篇对接 `08-cli/scripts.md` 的 `--env-file` 与环境加载。

## 一、为什么需要配置模块

把数据库地址、密钥、端口等写死在代码里既不安全也难维护。Nest 提供专用包 **`@nestjs/config`**，基于 `dotenv` 在应用启动早期加载 `.env` 到 `process.env`，并通过 `ConfigModule` 注入使用。

```bash
npm i @nestjs/config
```

## 二、注册 ConfigModule

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],   // 默认加载项目根目录 .env
})
export class AppModule {}
```

`ConfigModule.forRoot()` 做的事：
1. 调用 `dotenv` 把 `.env` 写入 `process.env`
2. 让 `ConfigService` 可注入（默认只在该模块内可见）

## 三、读取配置：ConfigService

```ts
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CatsService {
  constructor(private configService: ConfigService) {}

  getPort() {
    return this.configService.get<string>('PORT');   // 读环境变量名
  }
}
```

- `get()` 第二个参数可给默认值：`get('PORT', '3000')`
- 支持嵌套键（点号）：`get('DATABASE.host')`（对应 `DATABASE_HOST` 或嵌套对象）

## 四、自定义 .env 路径与多文件

```ts
ConfigModule.forRoot({
  envFilePath: ['.development.env', '.env'],  // 数组，找不到前一个用后一个
})
```

## 五、全局可用（常用）

默认 `ConfigService` 仅注册它的模块能用。要做成**全局**：

```ts
ConfigModule.forRoot({ isGlobal: true })
```

之后任意模块的 Service 直接注入 `ConfigService`，无需 `imports: [ConfigModule]`。文档与社区均推荐把配置做成全局。

## 六、配置校验（Joi / 内置）

生产环境强烈建议启动即校验配置缺失/格式错误：

```ts
import * as Joi from 'joi';

ConfigModule.forRoot({
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production').required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
  }),
})
```

- 校验失败应用**启动直接报错**，避免带病运行。
- 也可用 `class-validator`（见 `validation.md`）配合自定义 `validate()`。

## 七、自定义配置文件（load 函数）

把配置组织成结构化的 TS 对象，而非裸 env：

```ts
// config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
  },
});

// module
ConfigModule.forRoot({ load: [configuration] });
```

读取：`configService.get('database.host')`。比散落的 `get('XXX')` 更易维护。

## 八、异步配置与命名空间

```ts
ConfigModule.forRoot({
  load: [databaseConfig, authConfig],   // 多个 load 合并
})
```

可在不同模块用 `registerAs` + `ConfigModule.forFeature` 做命名空间（详见官方进阶），这里省略。

## 九、与 CLI 的衔接

- `08-cli/scripts.md` 提到 `nest start --env-file .env` 也能加载环境变量；`ConfigModule` 是**应用内**的标准方式，二者不冲突（CLI 的 `--env-file` 是 Node 进程级，ConfigModule 也读同一 `process.env`）。
- Prisma 配方（`prisma.md`）明确提醒：**必须配 ConfigModule**，`DATABASE_URL` 才从 `.env` 读到。

## 下一篇

→ `sql.md`：TypeORM 集成（配置读库、Entity、Repository）。
