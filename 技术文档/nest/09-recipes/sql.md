# Recipes - SQL（TypeORM）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/sql`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第二章。SQL 关系型数据库集成，是后端最常用数据层。衔接 `01-fundamentals`（providers/modules）与 `configuration.md`。

## 一、安装

```bash
npm i @nestjs/typeorm typeorm mysql2
# 其它数据库换驱动：pg (Postgres) / sqlite3 (SQLite) / mssql (MSSQL) / better-sqlite3
```

## 二、Mongoose 之外：TypeORM 的模块

TypeORM 集成用 `TypeOrmModule`，结构与 `09-recipes/mongodb.md` 的 Mongoose 几乎平行：

| 方法 | 作用 |
|------|------|
| `TypeOrmModule.forRoot(options)` | 根连接（读库配置） |
| `TypeOrmModule.forRootAsync(options)` | 异步根连接（配合 ConfigModule） |
| `TypeOrmModule.forFeature([Entity])` | 在特性模块注册 Repository |
| `@InjectRepository(Entity)` | 注入 Repository |

## 三、根连接 forRoot

```ts
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'nest',
      autoLoadEntities: true,   // 自动载入所有 forFeature 的实体
      synchronize: true,         // 开发期自动同步 schema（生产关掉！）
    }),
  ],
})
export class AppModule {}
```

⚠️ `synchronize: true` 仅在**开发**用，生产会让实体定义覆盖库结构，丢数据。生产用**迁移（migration）**。

## 四、配合配置模块（推荐）

```ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'mysql',
    host: config.get('DB_HOST'),
    port: config.get('DB_PORT'),
    username: config.get('DB_USER'),
    password: config.get('DB_PASS'),
    database: config.get('DB_NAME'),
    autoLoadEntities: true,
  }),
}),
```

## 五、Entity 定义

```ts
// cat.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Cat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  name: string;

  @Column('int')
  age: number;

  @Column({ default: 'unknown' })
  breed: string;
}
```

## 六、forFeature 注册 + 注入 Repository

```ts
// cats.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Cat])],
  providers: [CatsService],
  controllers: [CatsController],
})
export class CatsModule {}

// cats.service.ts
@Injectable()
export class CatsService {
  constructor(
    @InjectRepository(Cat)
    private catsRepository: Repository<Cat>,
  ) {}

  create(dto: CreateCatDto) {
    return this.catsRepository.save(dto);
  }
  findAll() {
    return this.catsRepository.find();
  }
}
```

- `Repository<Cat>` 提供 `save/find/findOne/remove/update` 等 CRUD。
- 测试时用 `getRepositoryToken(Cat)` mock（见 `07-testing`）。

## 七、多数据库

`forRoot` 可指定 `name`，`forFeature([Entity], 'dbName')`，`@InjectRepository(Entity, 'dbName')`。生产多租户/读写分离常用。

## 八、要点总结

| 关注点 | 做法 |
|--------|------|
| 连接配置 | `forRoot` / `forRootAsync`（接 ConfigModule） |
| 实体注册 | `forFeature([...])` |
| 操作数据 | `@InjectRepository` 注入 `Repository` |
| 开发便捷 | `autoLoadEntities: true` 免手动列实体 |
| 生产安全 | 关 `synchronize`，用 migration |

> 跨框架对比：Spring Data JPA 的 `@Entity`/`JpaRepository`、Laravel 的 Eloquent、`typeorm` 的 `Repository` 都是"实体即表、仓库即 DAO"套路。Nest 把这套接进 DI 容器。

## 下一篇

→ `mongodb.md`：Mongo/Mongoose 集成（文档型数据库）。
