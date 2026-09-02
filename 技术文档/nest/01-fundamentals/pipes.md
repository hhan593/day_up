# NestJS 管道（Pipes）

> 来源：[NestJS 中文文档 · 管道](https://docs.nestjs.cn/pipes)
> 管道在**控制器方法被调用前**插入，负责"转换"和"验证"参数。

---

## 一、管道是什么？（通俗对比）

管道像**快递分拣线**：包裹（参数）进来先过秤（验证）、贴标签转格式（转换），不合格的直接退回（抛异常），合格的才送到收件人（处理方法）。

**对比其他框架**：
- **Spring**：`@Valid` + `Validator` 做校验，`@InitBinder`/`Converter` 做类型转换——Nest 把这两者统一成"管道"。
- **Express 原生**：手动 `if (!req.body.name) throw`——Nest 用管道声明式解决。
- **class-validator**：Nest 的 `ValidationPipe` 直接架在 class-validator 上（见 `../02-techniques/validation.md`）。

管道两个用途：
1. **转换**：输入转所需形式（字符串→整数）
2. **验证**：非法则抛异常

---

## 二、实现管道

```ts
import { PipeTransform, ArgumentMetadata, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
```

`metadata` 结构：`{ type: 'body'|'query'|'param'|'custom', metatype?, data? }`
> ⚠️ TypeScript 接口转译后消失——若参数是接口，`metatype` 为 `Object`（这正是 `02-techniques/validation.md` 强调"DTO 必须用 class"的原因）。

---

## 三、内置管道

| 管道 | 作用 |
|---|---|
| `ValidationPipe` | class-validator 校验 |
| `ParseIntPipe` / `ParseFloatPipe` | 转数字，失败 400 |
| `ParseBoolPipe` / `ParseDatePipe` | 转布尔/日期 |
| `ParseArrayPipe` | 转数组（见 `../02-techniques/validation.md` 数组解析坑） |
| `ParseUUIDPipe` | 校验 UUID |
| `ParseEnumPipe` | 校验枚举 |
| `DefaultValuePipe` | 缺失时给默认值 |
| `ParseFilePipe` | 文件校验（见 `../02-techniques/file-upload.md`） |

```ts
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}   // 'abc' → 400

@Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number  // 缺省 0
```

---

## 四、绑定方式（4 级）

```ts
// 1. 参数级
@Param('id', ParseIntPipe) id: number
@Body(new ZodValidationPipe(schema)) dto: CreateDto

// 2. 方法级
@Post() @UsePipes(new ZodValidationPipe(schema)) create(@Body() dto) {}

// 3. 控制器级
@Controller('cats') @UsePipes(ValidationPipe) export class CatsController {}

// 4. 全局（推荐用 APP_PIPE 以支持 DI）
@Module({ providers: [{ provide: APP_PIPE, useClass: ValidationPipe }] })
export class AppModule {}
```
> `app.useGlobalPipes()` 也能全局，但**不能注入依赖**、对网关/微服务不生效，故生产推荐 `APP_PIPE`。

---

## 五、自定义管道示例

### Zod 校验
```ts
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  transform(value: unknown) {
    try { return this.schema.parse(value); }
    catch { throw new BadRequestException('Validation failed'); }
  }
}
```

### class-validator（需 TS class）
```ts
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || [String, Boolean, Number, Array, Object].includes(metatype)) return value;
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) throw new BadRequestException('Validation failed');
    return value;
  }
}
```
> 内置 `ValidationPipe` 已含这些逻辑，无需自写。

---

## 六、重点提示

- 管道抛异常由**异常过滤器**处理，方法体不执行。
- 纯 JS 无 `metatype`，class-validator 不可用（需 class 语法）。
- 混合应用 `useGlobalPipes` 不挂到网关/微服务。

---

## 七、与 TS 文档的衔接

- `metatype` 消失 → 对应 `typescript-advanced-type-system` 的"类型擦除"。
- DTO 必须 class、不能 interface → 详见 `typescript-interview-questions.md` 的"为什么 DTO 用 class"。

---

## 八、一句话总结

> 管道 = `@Injectable` + `PipeTransform.transform(value, metadata)`，做转换/验证；内置 `ParseXxx`/`ValidationPipe` 开箱即用；绑定分参数/方法/控制器/全局（`APP_PIPE` 推荐）。
