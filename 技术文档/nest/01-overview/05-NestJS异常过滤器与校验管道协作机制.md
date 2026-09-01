# 知识点：NestJS 异常过滤器与校验管道的协作机制

> 本文档来自一次真实排障：`POST /dogs` 传入非法 JSON / 非法字段后，
> 为什么有时会返回「兜底过滤器」的格式、有时又能正确返回校验错误。
> 核心是搞清楚「管道抛的异常」和「多个全局异常过滤器」之间是怎么协作的。

## 1. 全局异常过滤器（APP_FILTER）的洋葱模型

在 `app.module.ts` 中以 `APP_FILTER` 注册多个过滤器时，Nest 把它们按**注册顺序由外到内**包裹成洋葱：

```ts
providers: [
  { provide: APP_FILTER, useClass: HttpExceptionFilter },    // 外层，先匹配
  { provide: APP_FILTER, useClass: CatchEverythingFilter },  // 内层
]
```

- 异常产生后，从**外层向内层**逐个询问「你 @Catch 捕获这种异常吗？」
- **第一个声明能捕获该异常的过滤器就消费它**，后续过滤器不再执行。
- `@Catch(HttpException)` 只匹配 `HttpException` 及其子类（如 `BadRequestException`、`NotFoundException`）。
- `@Catch()` 不传参 = 匹配一切异常，因此任何异常它都能接。

> ⚠️ 关键坑点：若 `@Catch()` 的兜底过滤器注册在**外层**，它会先于 `@Catch(HttpException)` 匹配到
> 所有异常（包括 `BadRequestException`），导致「本该走 HttpExceptionFilter 的异常」被兜底过滤器截胡，
> 响应格式变成兜底格式、且可能丢失字段级 `errors` 详情。

本项目的最终处置（见 `catch-everything.filter.ts`）：即便兜底过滤器包在外层，也在其内部对
`exception instanceof HttpException` 专门处理、透传 `errors`，确保校验失败能返回规范格式。

## 2. 校验失败的完整流转链路

以 `POST /dogs` + `@Body(new ValidationPipe()) dto: CreateDogDto` 为例：

```
请求进入
   │
   ▼
[Nest 内置 body-parser] 先解析 JSON 文本 → 纯对象
   │  （若 JSON 非法，此处直接抛 BadRequestException，管道根本不运行）
   ▼
[ValidationPipe.transform] 对纯对象做 class-validator 校验
   │  ├─ 通过 → 放行 value 给控制器
   │  └─ 失败 → throw new BadRequestException({ statusCode, message, errors })
   ▼
[异常向外冒泡，进入 APP_FILTER 链]
   │
   ▼
HttpExceptionFilter（@Catch(HttpException)）匹配到 BadRequestException
   │  → 记日志（注入的 LoggerService）+ 返回规范响应
   ▼
（CatchEverythingFilter 不再参与，因为它已被内层、或内部 HttpException 分支透传）
```

### 2.1 ValidationPipe 的正确写法（本项目已落地）

`src/Pipe/validation.pipe.ts` 在 `errors.length > 0` 时抛出带 `errors` 的结构化异常：

```ts
throw new BadRequestException({
  statusCode: 400,
  message: 'Validation failed',
  errors: errors.map((e) => ({
    property: e.property,
    constraints: e.constraints, // { isEmail: 'email must be an email' }
  })),
});
```

`BadRequestException` 继承自 `HttpException`，因此**理应被 `HttpExceptionFilter` 接住**。

### 2.2 HttpExceptionFilter 接住后的行为

`src/exception/http-exception.filter.ts` 通过构造函数注入了 `LoggerService`（演示过滤器依赖注入），
在 `catch` 中记录日志并返回：

```ts
this.logger.error(
  `${request.method} ${request.url} → ${status}: ${exception.message}`,
  exception.stack,
  'HttpExceptionFilter',
);
response.status(status).json({
  statusCode: status,
  message: exception.message, // 注意：当前硬编码了一句中文字符串，可改为透传 errors
  timestamp: new Date().toISOString(),
  path: request.url,
});
```

**排障日志实证**（来自一次真实运行）：
```
ERROR [LoggerService] POST /dogs → 400: Validation failed
ERROR [LoggerService] BadRequestException: Validation failed
    at ValidationPipe.transform (src/Pipe/validation.pipe.ts:68:13)
HttpExceptionFilter
```
最后一行 `HttpExceptionFilter` 即 Nest 打印的实际消费该异常的过滤器，证明链路正确。

## 3. 为什么「非法 JSON」走的是兜底过滤器？

这是最容易被误解的一点。

请求体若写成非法 JSON（如末尾多了逗号、属性名没用双引号）：
```json
{
  "name": "海燕",
  "age": 257848412892295,

}
```

解析阶段由 **Nest/Express 内置 body-parser** 完成，它会在把文本转对象时就抛
`BadRequestException: Expected double-quoted property name in JSON ...`。

- 这个异常发生在 **`ValidationPipe` 之前**（请求体都还没解析成对象，管道无对象可校验）。
- 它被 `RoutesResolver.mapExternalException` 包了一层，属于「外部异常」，由框架默认异常通道处理。
- 实测它**绕过了 `HttpExceptionFilter`、被 `@Catch()` 的兜底过滤器接住**，返回兜底格式。

> 结论：非法 JSON 的 400 不是校验没生效，而是**请求体解析在管道之前就失败了**。
> 修复方法是把 JSON 写合法（去掉尾随逗号、属性名加双引号），之后才会进入 `ValidationPipe`。

## 4. 关于 age 巨整数的说明（边界处理）

`CreateDogDto` 用 `@IsInt()` 校验 `age`：
- `@IsInt()` 仅要求「JS 数字类型且为整数」，**不限制数值大小**。
- 因此 `257848412892295` 这种大整数会**通过** `@IsInt()` 校验（它是整数）。
- 若想限制合理范围，应使用 `@Min(0)` + `@Max(200)`。
- 若前端可能把大数传成字符串 `"257..."`，`@IsInt()` 会失败；可用 `class-transformer` 的
  `@Type(() => Number)` 先转换：
  ```ts
  import { Type } from 'class-transformer';
  @IsInt()
  @Type(() => Number)
  age!: number;
  ```

## 5. 排查多过滤器「谁接住了异常」的技巧

在兜底过滤器 `catch` 开头临时打印异常，即可从堆栈定位真实来源：
```ts
catch(exception: unknown, host: ArgumentsHost) {
  console.error('>>> 兜底捕获到异常:', exception);
  ...
}
```
- 若堆栈含 `ValidationPipe.transform` → 异常来自校验管道（应为 HttpException 类型）。
- 若堆栈含 `routes-resolver.js` / `mapExternalException` → 异常来自请求体 JSON 解析（在管道之前）。

## 6. 通用最佳实践小结

1. **多个 `APP_FILTER` 要注意顺序与 `@Catch` 范围**：`@Catch()` 兜底过滤器要么注册在内层，
   要么在其 `catch` 内部对 `HttpException` 主动透传，避免截胡 HttpException。
2. **过滤器尽量通过 `APP_FILTER` + `useClass`（传类）注册**，才能被框架实例化并注入依赖
   （如 `LoggerService`）；不要用 `new` 实例注册。
3. **校验管道抛 `BadRequestException` 等 `HttpException` 子类**，可被 `@Catch(HttpException)` 统一接住。
4. **结构化错误**：`BadRequestException` 的响应体里带上 `errors` 字段级详情，前端体验更好。
5. **非法 JSON 不等同于校验失败**：它发生在 body-parser 阶段（管道之前），错误形态不同，需分开排障。
6. **日志用注入的 `LoggerService`**（统一单例），而非 `console.log`，便于集中管理。
