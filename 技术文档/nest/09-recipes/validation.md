# Recipes - 验证（Validation）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/validation`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第四章。输入校验是 API 安全的第一道防线，与 `01-fundamentals/pipes.md`、`06-graphql` 的输入类强相关。

## 一、安装

```bash
npm i class-validator class-transformer
```

- `class-validator`：声明校验规则（装饰器）。
- `class-transformer`：普通对象 ↔ 类实例互转（让校验装饰器生效）。

## 二、全局启用 ValidationPipe

```ts
// main.ts
import { ValidationPipe } from '@nestjs/common';

const app = await NestFactory.create(AppModule);
app.useGlobalPipes(new ValidationPipe());
await app.listen(3000);
```

- 放在 `main.ts` 全局生效（所有路由参数校验）。
- 接 `01-fundamentals/pipes.md`：ValidationPipe 本质是内置 `PipeTransform`，在参数层拦截。

## 三、在 DTO 上声明规则

```ts
// create-cat.dto.ts
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class CreateCatDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsInt()
  @Min(0)
  @Max(30)
  age: number;

  @IsString()
  @IsOptional()
  breed?: string;
}
```

控制器里用 `@Body()` 接收，管道自动校验：

```ts
@Post()
create(@Body() dto: CreateCatDto) {
  return this.catsService.create(dto);
}
```

校验失败自动抛 `BadRequestException`（400），返回错误详情。

## 四、ValidationPipe 关键选项

```ts
new ValidationPipe({
  whitelist: true,        // 剥离未声明装饰器的字段（防多余字段注入）
  forbidNonWhitelisted: true,  // 有未声明字段直接 400（比 whitelist 更严）
  transform: true,        // 把纯对象转成 DTO 类实例（@Type 生效）
  transformOptions: { enableImplicitConversion: true },  // 隐式类型转换
  disableErrorMessages: false,  // 生产可设 true 隐藏错误细节
})
```

- `whitelist` 强烈推荐：防止客户端传 `isAdmin: true` 之类越权字段。
- `transform: true` 让 `@Type(() => Number)` 等转换生效（见下）。

## 五、类型转换（class-transformer @Type）

```ts
import { Type } from 'class-transformer';

export class FindDto {
  @Type(() => Number)
  @IsInt() page: number;   // query 字符串自动转 number
}
```

配合 `transform: true`，HTTP query 的 `"1"` 变成数字 `1`。

## 六、自定义校验

```ts
import { registerDecorator, ValidationArguments } from 'class-validator';

export function IsPasswordStrong(...) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPasswordStrong',
      target: object.constructor,
      propertyName,
      validator: { validate: (v) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(v) },
    });
  };
}
```

## 七、与 GraphQL 衔接

`06-graphql` 的输入类（`create-user.input.ts`）就是 DTO，同样 `@IsString()` 等装饰器在 Code First 下生效，ValidationPipe 对 GraphQL 解析器参数也生效（需注意 GraphQL 的 transform 行为）。

## 八、要点

| 关注点 | 做法 |
|--------|------|
| 全局校验 | `useGlobalPipes(new ValidationPipe())` |
| 规则声明 | DTO 上 `class-validator` 装饰器 |
| 防越权字段 | `whitelist` / `forbidNonWhitelisted` |
| 类型转换 | `transform: true` + `@Type()` |
| 复用 | CRUD generator 生成的 DTO 直接加装饰器（见 `08-cli/crud-generator.md`） |

> 跨框架对比：Spring 的 `@Valid` + `javax.validation`、Laravel 的 Form Request、Express 手写 `joi`——Nest 的 `class-validator` 最接近 Spring，且天然接 DI 与管道。

## 下一篇

→ `caching.md`：缓存（CacheModule）。
