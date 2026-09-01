# Recipes - MongoDB（Mongoose）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/mongo`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第三章。文档型数据库集成。与 `sql.md` 平行，结构类似但用 Schema 而非 Entity。

## 一、安装

```bash
npm i @nestjs/mongoose mongoose
```

## 二、模块方法

| 方法 | 作用 |
|------|------|
| `MongooseModule.forRoot(uri, options)` | 根连接 |
| `forRootAsync()` | 异步连接（接 ConfigModule） |
| `forFeature([{ name, schema }])` | 特性模块注册模型 |
| `forFeatureAsync()` | 注册前加钩子/插件/鉴别器 |
| `@InjectModel(name)` | 注入模型 |
| `@InjectConnection(name?)` | 注入原生 Connection（事务等） |

## 三、根连接

```ts
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

- 接受与 `mongoose.connect()` 相同的配置对象。
- 多库指定 `connectionName`：`forRoot(uri, { connectionName: 'cats' })`。
- 异步：`forRootAsync({ useFactory, inject })` 读 ConfigModule。

## 四、Schema 定义

```ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class Cat {
  @Prop() name: string;
  @Prop() age: number;
  @Prop() breed: string;
}
export const CatSchema = SchemaFactory.createForClass(Cat);
export type CatDocument = HydratedDocument<Cat>;
```

- `@Schema()` 默认集合名 = 类名复数（`Cat`→`cats`）。
- `@Prop()` 定义字段；复杂类型显式写：`@Prop([String])` 或 `@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })`。
- 也支持 `new mongoose.Schema({...})` 或 `raw()` 定义嵌套原始结构。

## 五、forFeature 注册 + 注入模型

```ts
// cats.module.ts
@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  providers: [CatsService],
  controllers: [CatsController],
})
export class CatsModule {}

// cats.service.ts
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<CatDocument>) {}

  async create(dto: CreateCatDto) {
    return new this.catModel(dto).save();
  }
  findAll() {
    return this.catModel.find().exec();
  }
}
```

- 多库：`@InjectModel(Cat.name, 'cats')`。
- 测试：`getModelToken(Cat.name)` mock（见 `07-testing`）。

## 六、高级用法

- **连接注入**：`@InjectConnection()` 拿 `Connection`，用于 `startSession()` 事务。
- **钩子/中间件**：`forFeatureAsync` 的 `useFactory` 里 `schema.pre('save', ...)`。
- **插件**：`schema.plugin()` 或 `forRoot` 的 `connectionFactory` 全局注册。
- **鉴别器**：`discriminators` 单集合多模型继承。
- **虚拟属性**：`@Virtual()` 定义非持久化计算字段。

## 七、SQL vs Mongo 对照

| 概念 | TypeORM (SQL) | Mongoose (Mongo) |
|------|---------------|------------------|
| 注册 | `forFeature([Entity])` | `forFeature([{ name, schema }])` |
| 注入 | `@InjectRepository(Entity)` | `@InjectModel(name)` |
| 数据类 | `@Entity()` 类 | `@Schema()` + `SchemaFactory` |
| 操作 | `Repository.save/find` | `Model.save/find` |
| 测试 token | `getRepositoryToken` | `getModelToken` |

> 通俗理解：SQL 是"表格型"，Mongo 是"文档型"；Nest 用同一套 `forRoot/forFeature/@Inject` 模式统一两种数据库接入，只是换名字。

## 下一篇

→ `validation.md`：DTO 校验（class-validator）。
