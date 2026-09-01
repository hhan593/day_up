# Recipes - Swagger / OpenAPI

> 来源：NestJS 中文官方文档 `https://www.nestjs.com.cn/openapi/introduction`（中文网，与 docs.nestjs.cn 同源；最后更新 2026/8/9）
> 系列位置：`09-recipes` 第九章。自动生成 API 文档（Swagger UI），前端/测试都依赖它。

## 一、安装

```bash
npm i @nestjs/swagger swagger-ui-express
# Fastify 平台用：@nestjs/swagger 配 fastify-swagger
```

## 二、引导 Swagger

```ts
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const app = await NestFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle('Cats API')
  .setDescription('The cats API description')
  .setVersion('1.0')
  .addTag('cats')
  .addBearerAuth()          // 启用 Bearer token 鉴权按钮
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);   // 访问 /api 看 Swagger UI

await app.listen(3000);
```

- `setup('api', ...)` → 文档地址 `http://localhost:3000/api`
- `addBearerAuth()` 让 UI 有"Authorize"按钮，填 token 后能直接测受保护接口

## 三、装饰器标注接口

```ts
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cats')                 // 分组标签
@Controller('cats')
export class CatsController {
  @Post()
  @ApiOperation({ summary: '创建一只猫' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiBearerAuth()               // 该接口需要鉴权
  create(@Body() dto: CreateCatDto) {}
}
```

## 四、DTO 自动建模

```ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateCatDto {
  @ApiProperty({ example: 'Tom', description: '名字' })
  name: string;

  @ApiProperty({ example: 3, minimum: 0 })
  age: number;
}
```

- `@ApiProperty` 让 Swagger 自动画出请求/响应模型（与 `validation.md` 的 `@IsString` 可并存）。
- 也可用 `partial` 工具生成 UpdateDto。

## 五、要点

| 关注点 | 装饰器 |
|--------|--------|
| 标题/版本 | `DocumentBuilder` |
| 路由文档 | `@ApiTags` / `@ApiOperation` |
| 响应说明 | `@ApiResponse` |
| DTO 建模 | `@ApiProperty` |
| 鉴权按钮 | `addBearerAuth()` / `@ApiBearerAuth()` |

> 跨框架对比：Spring 的 `@SpringBoot` + `springdoc-openapi`（`@Operation`/`@Schema`）、FastAPI 的自动 OpenAPI——Nest 的 `@nestjs/swagger` 几乎是 Spring 同款注解风格。

## 下一篇

→ `queues.md`：队列（Bull + Redis）。
