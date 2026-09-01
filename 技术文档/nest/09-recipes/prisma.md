# Recipes - Prisma（现代 ORM）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/recipes/prisma`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第十五章。Prisma 是类型安全的新一代 ORM，比 TypeORM 更现代（schema 优先 + 生成类型安全客户端）。衔接 `configuration.md`。

## 一、初始化

```bash
npx prisma init            # 生成 schema.prisma 与 .env (含 DATABASE_URL)
```

`schema.prisma` 定义模型：

```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}
model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}
```

```bash
npx prisma migrate dev --name init   # 迁移 + 生成客户端
npx prisma generate                  # 仅重新生成 client
```

## 二、PrismaService 封装

```ts
// src/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();           // 应用启动时连库
  }
}
```

- 文档本身示例用**驱动适配器**写法（`extends PrismaClient { super({ adapter }) }`），未用 `onModuleInit`/`$connect`/$disconnect`。
- 上面 `OnModuleInit + $connect` 是社区最常用、文档兼容的做法（衔接 `01-fundamentals/lifecycle-events.md`），标注为**标准实践补充**。
- 文档原示例（SQLite + better-sqlite3 适配器）：

```ts
import { PrismaClient } from './generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });
    super({ adapter });
  }
}
```

## 三、全局提供 PrismaService

```ts
// prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

- `@Global()` 让任意模块直接用 `PrismaService`，不用 `imports`。
- 文档提醒：务必配 `ConfigModule`，否则 `DATABASE_URL` 不会从 `.env` 读到（见 `configuration.md`）。

## 四、在 Service 中用

```ts
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }
  findAll() {
    return this.prisma.user.findMany({ include: { posts: true } });
  }
}
```

- `Prisma.UserCreateInput` 等类型由 Prisma 自动生成，类型安全。
- 比 TypeORM 的 `Repository` 更"查询即类型检查"。

## 五、TypeORM vs Prisma 对照

| 维度 | TypeORM (`sql.md`) | Prisma (`prisma.md`) |
|------|--------------------|----------------------|
| 定义方式 | 装饰器 `@Entity` | `schema.prisma` 文件 |
| 客户端 | `Repository` 注入 | `PrismaClient` 继承 |
| 类型安全 | 运行时校验为主 | 编译期类型生成 |
| 迁移 | `synchronize` / migration | `prisma migrate dev` |
| 上手 | Nest 内建集成成熟 | 现代、DX 好 |

> 选型建议：新项目倾向 Prisma（类型安全、DX 佳）；已有 TypeORM 体系可继续用。

## 六、要点

| 关注点 | 做法 |
|--------|------|
| 初始化 | `npx prisma init` + `migrate dev` |
| 封装 | `PrismaService extends PrismaClient` |
| 全局 | `@Global()` 模块提供 |
| 前置 | 配 `ConfigModule` 读 `DATABASE_URL` |

## 系列收尾

→ `README.md`：recipes 章节索引与跨章节衔接。
