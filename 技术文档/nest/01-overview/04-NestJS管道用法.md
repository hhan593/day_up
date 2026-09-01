# 知识点：NestJS 管道（Pipe）用法与实战

## 1. 管道的两个职责

NestJS 的管道（Pipe）实现 `PipeTransform` 接口，核心方法是 `transform(value, metadata)`，有两个典型用途：

- **转换（Transformation）**：把输入数据转换成期望的形式（如字符串 → 数字、ID → 实体对象）；
- **校验（Validation）**：对输入数据进行校验，失败时抛异常（如非数字则 400/404）。

## 2. 示例一：ParseIntPipe（转换 + 校验）

将路径参数中的字符串解析为十进制整数，失败时抛出 400。

```ts
// src/Pipe/parse-int.pipe.ts
import {
  PipeTransform,         // 管道接口：所有自定义管道都要实现它
  Injectable,           // 装饰器：声明该类可被 Nest IoC 容器管理（支持依赖注入）
  ArgumentMetadata,     // 参数元数据：描述当前被校验参数的信息（如类型、数据来源等）
  BadRequestException,  // 异常：校验失败时抛出 400 错误
} from '@nestjs/common';

// 自定义管道：将传入的字符串参数解析为十进制整数
@Injectable()
export class ParseIntPipe implements PipeTransform {
  // transform：管道的核心方法，Nest 会在参数进入处理方法前调用它
  // value：客户端传入的原始参数值
  // metadata：该参数的元数据
  transform(value: string, metadata: ArgumentMetadata): number {
    // 尝试以十进制（基数为 10）解析整型
    const val = parseInt(value, 10);
    // 解析失败（不是合法数字）时，抛出 400 错误，终止请求
    if (isNaN(val)) {
      throw new BadRequestException(`Validation failed`);
    }
    // 解析成功，返回数字类型的值供后续使用
    return val;
  }
}
```

## 3. 示例二：UserByIdPipe（用 ID 查找实体）

这是「转换场景」的典型用法：**根据请求中提供的 ID，从数据源（模拟数据库）中选择一个已存在的用户实体**，并把实体对象交给后续处理方法。

```ts
// src/Pipe/user-by-id.pipe.ts
import {
  PipeTransform,         // 管道接口
  Injectable,           // 装饰器：声明该类可被 Nest IoC 容器管理（支持依赖注入）
  ArgumentMetadata,     // 参数元数据
  NotFoundException,    // 异常：资源不存在时抛出 404
} from '@nestjs/common';
import { UserService, UserEntity } from '../user/user.service';

// 自定义管道：根据请求中的 ID，从数据源（此处为 mock）中查找并返回已存在的用户实体
// 把原始 ID 转换为领域实体对象，后续处理方法可以直接拿到实体，而不用再自己查数据库。
@Injectable()
export class UserByIdPipe implements PipeTransform {
  // 通过构造函数注入 UserService，从而访问数据源
  constructor(private readonly userService: UserService) {}

  // transform：Nest 会在参数进入处理方法前调用
  // value：客户端传入的原始参数值（这里是用户 ID）
  // metadata：该参数的元数据
  transform(value: string, metadata: ArgumentMetadata): UserEntity {
    // 尝试将 ID 解析为数字
    const id = parseInt(value, 10);
    // 在数据源中查找对应的用户实体（此处使用 mock 数据，等价于数据库查询）
    const user = this.userService.findOne(id);
    // 若未找到对应用户，抛出 404，终止请求
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    // 查找成功，返回实体对象，供后续处理方法直接使用
    return user;
  }
}
```

> 数据源使用 `UserService` 内的 mock 数组代替真实数据库（真实场景应替换为 TypeORM/Prisma 查询）。注意 `UserEntity` 必须 `export`，否则 TS 会报 `TS4053`（无法为外部模块未导出类型命名）。

在控制器中使用：

```ts
// src/user/user.controller.ts
@Get(':id')
findOne(@Param('id', UserByIdPipe) user: UserEntity) {
  // user 已经是经过管道转换后的实体对象，无需再查库
  return user;
}
```

请求 `GET /user/2` 返回实体；请求 `GET /user/999` 返回 404 `User #999 not found`。

## 4. 装饰器里「传类」还是「new 实例」？

NestJS 的管道（以及守卫、拦截器、过滤器）在装饰器参数上都支持两种写法：

### 写法 A：传类（最常用，Nest 自动实例化并注入依赖）

```ts
@Get(':id')
findOne(@Param('id', UserByIdPipe) user: UserEntity) {}
```

- 传入的是**类本身**；
- Nest 运行时用 `new UserByIdPipe()` 自动创建实例；
- 由于类是 `@Injectable()`，Nest 会通过 DI 容器**自动注入**构造函数里的 `UserService`；
- 官方推荐写法。

### 写法 B：传 `new` 出来的实例

```ts
@Get(':id')
findOne(@Param('id', new UserByIdPipe()) user: UserEntity) {}
```

- 你手动 `new` 一个实例传入；
- **坑**：手动 `new` 时构造函数的依赖得你自己传，否则 `this.userService` 是 `undefined`，运行报错；
- 对 `UserByIdPipe` 这类有依赖注入的管道，**此写法不可行**（controller 里拿不到 `UserService` 传进去）。

### 对比与最佳实践

| 情况 | 推荐写法 |
| --- | --- |
| 管道**有依赖注入**（如 `UserByIdPipe` 注入了 `UserService`） | ✅ 传**类** `@Param('id', UserByIdPipe)` |
| 管道**无依赖**（纯逻辑，如 `ParseIntPipe`） | 传类或 `new` 都行，传类更统一 |
| 需要实例化时**传自定义参数**（如 `new ParseIntPipe({ optional: true })`） | 用 `new` 并传参 |

> `DefaultValuePipe` 常用于「传类 + 组合」场景：
> ```ts
> @Get(':id')
> findOne(@Param('id', new DefaultValuePipe(1), ParseIntPipe) id: number) {}
> ```
> 表示当 `id` 缺省时使用默认值 `1`，再用 `ParseIntPipe` 转换为数字。注意 `DefaultValuePipe` 需要 `new` 传入默认值，这正是「传参给构造函数」的典型用法。

### 一句话总结

- **有依赖注入的管道** → 老老实实传类，让 Nest 帮你 `new` 并注入；
- **只有需要传构造参数、且自身无依赖时** → 才使用 `new` 实例。

## 5. 内置管道

NestJS 自带了一批常用管道，无需自己实现：

| 内置管道 | 作用 |
| --- | --- |
| `ValidationPipe` | 基于 `class-validator` 校验 DTO，自动拦截非法请求体 |
| `ParseIntPipe` | 将字符串参数解析为整数，失败抛 400（本项目已自定义实现） |
| `ParseFloatPipe` | 解析为浮点数 |
| `ParseBoolPipe` | 解析为布尔值 |
| `ParseArrayPipe` | 解析为数组 |
| `ParseUUIDPipe` | 校验 UUID 格式 |
| `ParseEnumPipe` | 校验取值在枚举范围内 |
| `DefaultValuePipe` | 当参数为空时使用默认值（常与其他管道组合） |

使用内置管道与自定义管道写法完全一致：

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

## 6. 全局管道注册

若希望某个管道对**所有路由、所有参数**生效，不必在每个装饰器上都写一遍，可在 `main.ts` 用 `app.useGlobalPipes()` 注册：

```ts
// main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // 全局校验 DTO
  await app.listen(3000);
}
bootstrap();
```

> 注意：通过 `app.useGlobalPipes()` 注册的全局管道**不走 DI 容器**（是 `new` 出来的），若管道自身需要注入依赖，应改用 `APP_PIPE` 在模块内注册：
> ```ts
> // app.module.ts
> import { APP_PIPE } from '@nestjs/core';
> import { ValidationPipe } from '@nestjs/common';
>
> @Module({
>   providers: [{ provide: APP_PIPE, useClass: ValidationPipe }],
> })
> export class AppModule {}
> ```
> 这与全局守卫用 `APP_GUARD`、全局拦截器用 `APP_INTERCEPTOR` 是同一套模式。

## 7. 请求生命周期各机制执行顺序

```
中间件 → 守卫 → 拦截器(before) → 管道 → 控制器方法 → 拦截器(after) → 异常过滤器(出错时)
```

- 管道在**守卫之后、控制器方法之前**执行，专门处理「入参」；
- 若管道抛异常（如校验失败），会由**异常过滤器**捕获并返回统一错误响应（参见《NestJS 异常过滤器与校验管道协作机制》文档）。

## 8. 小结补充

- 优先使用内置管道，自定义管道用于内置无法满足的业务转换（如 `UserByIdPipe` 查实体）；
- 全局管道优先用 `APP_PIPE` 注册以支持依赖注入；
- 管道只管「参数」，鉴权交给守卫，日志/CORS 交给中间件，分工明确。
