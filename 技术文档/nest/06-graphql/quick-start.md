# NestJS GraphQL 快速开始（Quick Start）

> 来源：[NestJS 中文文档 · GraphQL Quick Start](https://docs.nestjs.cn/graphql/quick-start)
> 本文档以官方「快速开始」页为基础，并基于官方标准实践补全了 Resolver/Query/Mutation/DTO/ObjectType 的可运行示例（原页面仅列出入口，未展开这些写法，下文已用「⚠️ 官方未展开，标准实践补充」标注）。

---

## 一、为什么用 GraphQL？（通俗对比）

REST 像"去餐馆点固定套餐"——每个端点返回固定结构，前端要么多请求几个端点，要么接受多余的字段。

GraphQL 像"自助餐"——前端用一张查询描述"我**只**要哪些字段"，后端按描述返回，**一次请求**搞定，不多不少。

**对比其他框架**：
- **Spring Boot**：用 `graphql-java` / `spring-graphql`，要手写 SDL 或注解，配置偏重。
- **Express 原生**：用 `apollo-server` / `express-graphql`，但缺少 NestJS 这种"按模块自动扫描 Resolver"的 DI 集成。
- **NestJS 优势**：把 GraphQL 融进它已有的**模块 + 依赖注入 + 装饰器**体系，Resolver 就是带 `@Resolver()` 的 Provider，和 Controller 一样自然。

---

## 二、安装依赖

根据底层 HTTP 平台与 GraphQL 引擎，有三种组合：

| 组合 | 安装命令 | 说明 |
|---|---|---|
| Express + Apollo（默认） | `npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/express5 graphql` | 最常用 |
| Fastify + Apollo | `npm i @nestjs/graphql @nestjs/apollo @apollo/server @as-integrations/fastify graphql` | 高性能 |
| Fastify + Mercurius | `npm i @nestjs/graphql @nestjs/mercurius graphql mercurius` | 轻量引擎 |

> ⚠️ **版本警告**：`@nestjs/graphql@>=9` 兼容 Apollo **v3**；`@nestjs/graphql@^8` 仅支持 Apollo **v2**。装包时注意对齐版本，否则会报驱动相关错误。

---

## 三、核心：`GraphQLModule` 注册

和别的 Nest 模块一样，在 `AppModule` 里 `imports` 注册，用 `forRoot()`（静态）或 `forRootAsync()`（异步，配合 `ConfigService`）。

### 3.1 基础注册（Apollo 驱动）

```ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
    }),
  ],
})
export class AppModule {}
```

- 若用 **Mercurius**，把 `ApolloDriver` / `ApolloDriverConfig` 换成 `MercuriusDriver` / `MercuriusDriverConfig`（来自 `@nestjs/mercurius`）。
- 常用选项：
  - `playground: false`：关闭 Playground（旧版 Apollo）。
  - `graphiql: true`：开启 GraphiQL 调试界面（**Apollo 推荐**，旧 playground 已弃用）。

### 3.2 异步配置 `forRootAsync`

适合配置来自环境变量 / 配置中心：

```ts
// 工厂函数 + 注入
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    typePaths: configService.get<string>('GRAPHQL_TYPE_PATHS'),
  }),
  inject: [ConfigService],
});

// 使用类（实现 GqlOptionsFactory）
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useClass: GqlConfigService,
});

// 复用已有提供者
GraphQLModule.forRootAsync<ApolloDriverConfig>({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

> 这与 Nest 其它模块的异步注册（如 `TypeOrmModule.forRootAsync`、`CacheModule.forRootAsync`）模式完全一致——你之前在 `02-techniques` 见过的 `useFactory` / `useClass` / `useExisting` 三件套。

### 3.3 多端点 / 限定扫描模块

```ts
GraphQLModule.forRoot({
  include: [CatsModule], // 仅扫描指定模块中的 Resolver
});
```

> ⚠️ 多端点 + Apollo（`@as-integrations/fastify`）时需设 `disableHealthCheck: true`。

---

## 四、两种开发模式：Code First vs Schema First

这是使用 NestJS GraphQL 前必须做的**路线选择**。

### 4.1 Code First（代码优先）— 推荐

**用 TypeScript 装饰器 + 类直接写，框架自动生成 `.graphql` schema。**

- 你只写 TS，schema 由框架扫描装饰器生成。
- 配置 `autoSchemaFile`：指定生成路径，或 `true` 表示只在内存生成（不落盘）。

```ts
import { join } from 'path';

GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  // autoSchemaFile: true,  // 内存生成，不写文件
  // sortSchema: true,      // 按字母序排序输出，便于 diff
});
```

**优点**：类型即 schema，不用维护两份（SDL 与 TS 类）。和 Nest 的 DI、DTO 风格统一。

### 4.2 Schema First（模式优先）

**先写 SDL（`.graphql` 文件）作为真相来源，再写 Resolver 实现。**

```ts
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'], // 扫描所有 .graphql 文件
});
```

可让框架**反向生成** TS 定义，减少手写：

```ts
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  typePaths: ['./**/*.graphql'],
  definitions: {
    path: join(process.cwd(), 'src/graphql.ts'),
    outputAs: 'class', // 或默认 'interface'
  },
});
```

也可用 `GraphQLDefinitionsFactory` 脚本按需生成（支持 `watch`、`emitTypenameField`、`skipResolverArgs`、`enumsAsTypes` 等选项）。

**怎么选**：
- 新项目 / TS 重度用户 → **Code First**（少维护一份文件）。
- 团队已有 SDL / 前端主导 schema 设计 → **Schema First**。

> 对比 Java 生态：`schema first` 类似手写 `.proto`（gRPC）再生成代码；`code first` 类似用注解（`@GraphQLQuery`）直接声明。

---

## 五、⚠️ 官方未展开，标准实践补充：Resolver / Query / Mutation / DTO

原「快速开始」页只提到"解析器章节会讲"，未给代码。下面是官方标准、可运行的最小示例（Code First）。

### 5.1 定义数据形状 `@ObjectType`

```ts
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()            // 告诉框架：这是 GraphQL 返回对象的类型
export class Author {
  @Field(() => Int)      // 每个要暴露的字段都加 @Field，后可指定类型
  id: number;

  @Field()               // 不写类型时，框架从 TS 类型推断
  firstName: string;

  @Field({ nullable: true })  // nullable 对应 GraphQL 的 String?
  lastName?: string;
}
```

> 类比 REST 的 DTO（`02-techniques/validation.md`）：这里的 `@ObjectType` 类**既是返回类型也是 schema 定义**，一举两得。但它和 class-validator 的 DTO 不同——`@ObjectType` 描述"输出形状"，`@InputType` 描述"输入形状"。

### 5.2 定义输入 `@InputType`（对应 REST 的请求体 DTO）

```ts
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateAuthorInput {
  @Field()
  firstName: string;

  @Field({ nullable: true })
  lastName?: string;
}
```

> 对比 REST：REST 用 `CreateAuthorDto`（class-validator 校验）；GraphQL 用 `@InputType` 类。两者都配合 `ValidationPipe` 做校验（见 `02-techniques/validation.md`），**可复用同一套 class-validator 装饰器**。

### 5.3 写 Resolver（核心）

Resolver 就是 Nest 的 Provider，用 `@Resolver()` 标记，方法用 `@Query()` / `@Mutation()` 暴露给客户端。

```ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Author } from './author.model';
import { CreateAuthorInput } from './dto/create-author.input';

@Resolver(() => Author)   // 声明这个 Resolver 服务于 Author 类型
export class AuthorsResolver {
  private readonly authors: Author[] = []; // 示例内存存储

  @Query(() => [Author], { name: 'authors' })  // 查询：返回 Author 数组
  findAll(): Author[] {
    return this.authors;
  }

  @Mutation(() => Author)                      // 变更：创建
  createAuthor(@Args('input') input: CreateAuthorInput): Author {
    const author: Author = { id: this.authors.length + 1, ...input };
    this.authors.push(author);
    return author;
  }
}
```

客户端这样调用：

```graphql
query {
  authors {
    id
    firstName
  }
}

mutation {
  createAuthor(input: { firstName: "Alice" }) {
    id
  }
}
```

### 5.4 注册到模块

```ts
@Module({
  providers: [AuthorsResolver],   // Resolver 也是 Provider
})
export class AuthorsModule {}
```

并在 `AppModule` 的 `GraphQLModule` 里 `include: [AuthorsModule]`（若用了多端点限定）。

---

## 六、调试界面（Playground / GraphiQL）

- Apollo 默认 **Playground 已弃用**（2025-4-14 更新），改用：

```ts
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  graphiql: true,   // 开启 GraphiQL
});
```

- Mercurius 同样用 `graphiql: true`，访问 `http://localhost:3000/graphiql`。
- Apollo Sandbox 经插件启用：`ApolloServerPluginLandingPageLocalDefault`。

---

## 七、运行时读取 schema

应用初始化后，可通过 `GraphQLSchemaHost` 拿到生成的 schema（用于测试、代码生成等）：

```ts
const { schema } = app.get(GraphQLSchemaHost);
```

---

## 八、常见坑 & 最佳实践

1. **驱动与版本对齐**：`@nestjs/graphql@>=9` 配 Apollo v3，装错版本会报驱动找不到。
2. **字段必须显式 `@Field`**：Code First 下，TS 类里没加 `@Field` 的属性**不会**进 schema（不像 class-validator 那样默认全校验）。
3. **`autoSchemaFile: true` vs 路径**：单端点用 `true`（内存）足够；需要前端拿 SDL 或做 CI 校验时落盘到 `src/schema.gql`。
4. **复用校验**：Resolver 的 `@Args()` 输入类可加 class-validator 装饰器，配合全局 `ValidationPipe` 自动校验（与 REST 一致，见 `02-techniques/validation.md`）。
5. **Resolvable 字段**：`@ObjectType` 里若某字段是对象引用（如 `Author.posts`），可在 Resolver 里写 `@ResolveField()` 方法按需加载——这是 GraphQL "按需取关联数据" 的核心（N+1 问题用 `@nestjs/graphql` + DataLoader 解决，超出本页范围）。

---

## 九、一句话总结

> GraphQLModule 用 `forRoot` 注册并选 `driver`；**Code First 用装饰器自动出 schema（推荐），Schema First 先写 SDL 再实现**；Resolver 就是带 `@Resolver()` 的 Provider，`@Query`/`@Mutation` 暴露接口，`@ObjectType`/`@InputType` 定义形状——且输入类能复用 `02-techniques/validation.md` 的校验体系。

---

## 十、延伸阅读（本目录与交叉引用）

- `02-techniques/validation.md`：输入类 `@Args()` 如何配合 `ValidationPipe` 校验
- `03-security/authentication.md`：GraphQL 如何挂 `@UseGuards()` 做认证（守卫对 Query/Mutation 同样生效）
- `03-security/authorization.md`：基于角色的字段级授权

> 提示：Resolver 的 `@Args('input')` 用了 Nest 的**参数装饰器**机制（与 `06-` 后续「解析器」章节相关），其原理在 `../01-fundamentals/`（待补充）的「自定义装饰器」一节详解。
