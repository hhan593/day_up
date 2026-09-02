# NestJS 验证（Validation）技术详解

> 来源：https://docs.nestjs.cn/techniques/validation
> 适用：在 NestJS 中对传入请求（Body / Param / Query）、微服务消息、WebSocket 数据进行自动校验。
> 本文按"概念 → 安装 → 全局验证 → 高级选项 → 映射类型 → 数组解析 → 自定义扩展"组织，并在关键处补充通俗说明与对比。

---

## 一、验证的核心思想

NestJS 提供一组**开箱即用管道（Pipe）**，在请求进入控制器方法前自动校验并转换数据：

| 管道 | 作用 |
|---|---|
| `ValidationPipe` | 基于 `class-validator` + `class-transformer`，按装饰器规则校验对象 |
| `ParseIntPipe` | 把字符串参数解析成 `number`，失败抛 `400` |
| `ParseBoolPipe` | 解析成 `boolean` |
| `ParseArrayPipe` | 解析成数组（可指定元素类型） |
| `ParseUUIDPipe` | 校验是否为合法 UUID |

`ValidationPipe` 的特点是**声明式**：在 DTO（数据传输对象）类上用装饰器写规则，框架自动强制校验客户端负载，无需在每个方法里手写 `if` 判断。

**通俗理解**：
- 没有校验管道时，你得在每个 handler 里手动 `if (!body.email) throw ...`，又啰嗦又容易漏。
- 有了 `ValidationPipe` + DTO，校验规则"跟着类型走"——定义一次，所有用到这个 DTO 的接口都自动生效。
- 对比其他后端框架：这类似 **Spring Boot 的 `@Valid` + `javax.validation` 注解**、**Laravel 的 Form Request**，都是"用声明代替命令式校验"的思路。

---

## 二、安装依赖

```bash
npm i --save class-validator class-transformer
```

- `ValidationPipe` 本身从 `@nestjs/common` 导出，无需额外安装。
- `class-validator`：提供 `@IsEmail()`、`@IsNotEmpty()` 等校验装饰器。
- `class-transformer`：负责把普通 JS 对象"转换"成 DTO 类的实例（否则装饰器读取不到、且 `instanceof` 不成立）。

---

## 三、ValidationPipe 可用选项

`ValidationPipe` 的配置（`ValidationPipeOptions`）继承自 `class-validator` 的 `ValidatorOptions`，最常用：

| 选项 | 默认值 | 作用 |
|---|---|---|
| `transform` | `false` | 自动把传入负载转换成 DTO 类实例（并能把字符串参数转成对应类型） |
| `whitelist` | `false` | 剥离**没有**任何校验装饰器的属性（防多余字段注入） |
| `forbidNonWhitelisted` | `false` | 存在白名单之外的属性时，直接抛异常（而不是悄悄剥离） |
| `disableErrorMessages` | `false` | 隐藏详细错误文案（生产环境防止泄露字段信息） |
| `errorHttpStatusCode` | `400` | 校验失败时返回的 HTTP 状态码 |
| `exceptionFactory` | — | 自定义异常工厂，接收 `ValidationError[]` 返回你想抛的错误 |
| `errorFormat` | `'list'` | 错误格式：`'list'` 或 `'grouped'` |
| `skipUndefinedProperties` | `false` | 跳过值为 `undefined` 的字段 |
| `forbidUnknownValues` | `true` | 禁止完全未知的值 |
| `groups` | — | 分组校验（配合装饰器的 `groups` 选项做条件校验） |

> 建议生产配置：`{ transform: true, whitelist: true, forbidNonWhitelisted: true }`——既能自动转型，又防多余字段、且明确拒绝非法字段。

---

## 四、全局管道与自动验证

### 4.1 全局绑定（保护所有端点）

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

> 注意：`useGlobalPipes` 注册的全局管道**不会**作用于已经在模块里通过 `APP_PIPE` 注入的、或某些守卫/拦截器之前的处理。若要在所有地方（包括依赖注入上下文）生效，推荐用**模块的 `providers` + `APP_PIPE`** 方式（见下方提示）。

```ts
// 更稳妥的全局管道（在任意模块声明）
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    { provide: APP_PIPE, useClass: ValidationPipe },
  ],
})
export class AppModule {}
```

### 4.2 DTO + 装饰器示例

```ts
// create-user.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

```ts
// users.controller.ts
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

当 `email` 不合法时，Nest 自动返回 `400`：

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

**⚠️ 关键注意**：
1. DTO **必须是具体类（class）**，不能直接用 `interface` 或 `type` —— 因为 TypeScript 的接口/类型在编译后会被擦除，`class-validator` 运行时读不到装饰器元数据。
2. 导入 DTO 用 `import { CreateUserDto }` 而**不是** `import type { CreateUserDto }` —— 类型导入在编译后消失，管道拿不到类定义（否则报 "metadata 缺失" 类错误）。
3. 这一点与前面 TS 文档讲的 `import type` 最佳实践**看似冲突，实则分工**：DTO 是运行时真正需要用到的类，所以必须值导入；纯类型（如返回类型、配置 schema）才用 `import type`。

### 4.3 路径参数验证

```ts
// find-one-params.dto.ts
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: string;
}

// users.controller.ts
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return `This action returns a #${params.id} user`;
}
```

> 路径参数是字符串，用 `@IsNumberString()`（校验"数字组成的字符串"）而不是 `@IsNumber()`（校验 Number 实例）。

---

## 五、高级管道用法

### 5.1 禁用详细错误（生产安全）

```ts
app.useGlobalPipes(new ValidationPipe({ disableErrorMessages: true }));
```

生产环境开启，避免把字段结构、校验规则泄露给客户端（仅返回 400，不返回具体 message）。

### 5.2 剥离属性（白名单）

```ts
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

- `whitelist: true`：自动删除请求里**没有对应校验装饰器**的字段（静默剥离）。
- `forbidNonWhitelisted: true`：不是剥离，而是**直接抛 400**（更严格，推荐）。

**对比**：`whitelist` 像"过滤白名单"，`forbidNonWhitelisted` 像"拒绝未知字段"（类似很多 API 网关的 `strict` 模式）。

### 5.3 转换负载对象（transform）

```ts
// 全局开启
app.useGlobalPipes(new ValidationPipe({ transform: true }));

// 或仅某方法开启
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {}
```

开启 `transform: true` 的好处——自动把原始对象变成 DTO 类的实例，并且**路径/查询参数能自动转成声明类型**：

```ts
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true（自动从字符串 "1" 转成数值 1）
}
```

若不开启 `transform`，`@Param('id') id: number` 里的 `number` 只是 TS 层面的提示，**运行时仍是字符串**。这正是 `transform` 的价值：把"类型提示"变成"运行时真实转换"。

### 5.4 显式转换（内置 Parse 管道）

不用全局 `transform` 时，可用内置管道在参数位置显式转换：

```ts
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  // id 已是 number，sort 已是 boolean
}
```

也可自定义失败状态码：

```ts
@Param('id', new ParseIntPipe({ errorHttpStatusCode: 400 }))
```

---

## 六、映射类型（@nestjs/mapped-types）

写 CRUD 时，`CreateXxxDto` 和 `UpdateXxxDto` 往往大量重复。Nest 提供 `@nestjs/mapped-types` 复用基础 DTO，减少样板：

```ts
// base.dto.ts
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

| 工具 | 作用 | 等价 TS 类型 |
|---|---|---|
| `PartialType(Base)` | 所有属性变可选 | `Partial<Base>` |
| `PickType(Base, ['x'])` | 只保留指定属性 | `Pick<Base, 'x'>` |
| `OmitType(Base, ['x'])` | 排除指定属性 | `Omit<Base, 'x'>` |
| `IntersectionType(A, B)` | A 与 B 交叉 | `A & B` |

```ts
// 1. 更新时全部可选
export class UpdateCatDto extends PartialType(CreateCatDto) {}

// 2. 只保留部分字段
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}

// 3. 排除部分字段
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}

// 4. 与另一个类交叉
export class UpdateCatDto extends IntersectionType(CreateCatDto, AdditionalCatInfo) {}

// 5. 组合使用
export class UpdateCatDto extends PartialType(
  OmitType(CreateCatDto, ['name'] as const),
) {}
```

> 注意 `as const`：让 `['age']` 变成只读元组字面量，否则 `PickType` 推断不出具体键。

**⚠️ 与 Swagger / GraphQL 的兼容**：若项目用了 `@nestjs/swagger` 或 `@nestjs/graphql`，映射类型要从**对应的包**导入（`@nestjs/swagger` 的 `PartialType` 等），否则 API 文档/GraphQL schema 不会自动带出字段。这是为了不引入额外依赖的副作用处理。

**对比**：这些映射类型在 TS 类型层面就是 `Partial`/`Pick`/`Omit`/`&`，但 Nest 的版本**会同时保留 `class-validator` 装饰器元数据**——纯 TS 的 `Partial<CreateCatDto>` 只是类型，运行时没有校验装饰器，所以 Nest 提供了带运行时元数据的版本（类似前面 TS 文档讲的"运行时校验 vs 编译期类型"分工）。

---

## 七、解析和验证数组

TypeScript **不存在泛型元数据**（编译后 `CreateUserDto[]` 里只剩 `Array`，不知道元素类型是 `CreateUserDto`），因此直接写 `@Body() dtos: CreateUserDto[]` 校验会失效。必须用 `ParseArrayPipe` 显式指定元素类型：

```ts
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  // 每个元素都会按 CreateUserDto 校验
}
```

查询参数数组（逗号分隔）：

```ts
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  // GET /?ids=1,2,3 → ids = [1, 2, 3]
}
```

> 这是 Nest/TS 的"元数据擦除"典型坑：类型参数在运行时消失，需要显式告诉管道元素类型。和前面 TS 文档讲的"类型擦除"原理一致。

---

## 八、WebSocket 与微服务

`ValidationPipe` 对 **WebSocket** 和**微服务**（任何传输方式，如 TCP/gRPC/NATS）的工作方式完全相同，无需额外配置——只要管道绑定到对应上下文即可。

```ts
// 微服务示例（与 HTTP 完全一致的管道用法）
@MessagePattern('create_user')
createUser(@Payload() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}
```

---

## 九、自定义验证与扩展

### 9.1 自定义 class-validator 装饰器

业务特有的校验规则（如"密码必须含大小写+数字"）可基于 `class-validator` 自定义装饰器：

```ts
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          return typeof value === 'string'
            && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(value);
        },
        defaultMessage() {
          return '密码必须包含大小写字母和数字';
        },
      },
    });
  };
}
```

然后在 DTO 里使用：

```ts
export class CreateUserDto {
  @IsStrongPassword()
  password: string;
}
```

### 9.2 自定义异常（exceptionFactory）

想返回统一错误格式（如业务错误码），用 `exceptionFactory`：

```ts
app.useGlobalPipes(
  new ValidationPipe({
    exceptionFactory: (errors) => {
      // errors: ValidationError[]
      const messages = errors.map((e) => Object.values(e.constraints ?? {}));
      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        fields: messages,
      });
    },
  }),
);
```

### 9.3 分组 / 条件校验（groups）

同一个 DTO 在不同场景（新建 / 更新）想用不同规则，可用 `groups`：

```ts
export class CreateUserDto {
  @IsEmail({ groups: ['create'] })
  email: string;

  @IsNotEmpty({ groups: ['create', 'update'] })
  password: string;
}

// 使用时指定分组
new ValidationPipe({ groups: ['create'] });
```

---

## 十、常见坑与最佳实践速记

1. **DTO 用 class 不用 interface/type**：运行时需读取装饰器元数据（见 4.2）。
2. **DTO 必须值导入**：不能 `import type`，否则编译后类定义消失。
3. **全局管道推荐用 `APP_PIPE`**：比 `useGlobalPipes` 更彻底地覆盖所有上下文。
4. **生产配置三件套**：`transform: true` + `whitelist: true` + `forbidNonWhitelisted: true`。
5. **数组元素类型要显式**：用 `ParseArrayPipe({ items })`，否则泛型元数据擦除导致校验失效。
6. **路径参数是字符串**：用 `@IsNumberString()` 而非 `@IsNumber()`。
7. **Swagger/GraphQL 项目**：映射类型从对应包导入。
8. **校验是运行时守门员**：和前面 TS 文档讲的 `zod`/`satisfies` 同理——TS 类型在编译期消失，外部数据必须在边界（控制器入口）校验。

---

## 附：一张图理解数据流

```
请求 → [ParseIntPipe/ParseArrayPipe 等显式转换]
     → [ValidationPipe 按 DTO 装饰器校验 + whitelist 剥离 + transform 转实例]
     → 通过则进入 @Body()/@Param()/@Query() 方法参数
     → 失败则抛 400（或 exceptionFactory 自定义异常）
```

> 记忆口诀：**"DTO 写规则，管道来把关；class 才留痕，type 会蒸发；数组要明示，白名单保安全。"**
