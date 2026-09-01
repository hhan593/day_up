# NestJS API 版本控制（Versioning）技术详解

> 来源：https://docs.nestjs.cn/techniques/versioning
> 作用：在同一应用里维护控制器/路由的不同版本，兼容老客户端。
> 仅适用于 HTTP 应用。支持 4 种策略。

---

## 一、启用版本控制

统一入口：`app.enableVersioning({ type: ... })`，`VersioningType` 从 `@nestjs/common` 导入。

```ts
import { VersioningType } from '@nestjs/common';

const app = await NestFactory.create(AppModule);
app.enableVersioning({ type: VersioningType.URI });
await app.listen(process.env.PORT ?? 3000);
```

> 注意：官方此页只列 4 种策略（**URI / Header / Media Type / Custom**），**没有 Query 参数策略**。想用 Query 版可实现 CUSTOM 从 `request.query` 提取。

---

## 二、四种策略

### 1. URI 版本（默认）
版本出现在 URI（全局前缀之后、控制器路径之前），默认带 `v` 前缀。
```ts
app.enableVersioning({ type: VersioningType.URI });
// /v1/cats
```

### 2. Header 版本
```ts
app.enableVersioning({ type: VersioningType.HEADER, header: 'Custom-Header' });
// 请求头 Custom-Header: 1
```

### 3. Media Type 版本
```ts
app.enableVersioning({ type: VersioningType.MEDIA_TYPE, key: 'v=' });
// Accept: application/json;v=2
```

### 4. Custom 版本（自定义提取函数）
```ts
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
    .flatMap(v => v.split(','))
    .filter(v => !!v)
    .sort()
    .reverse();

app.enableVersioning({ type: VersioningType.CUSTOM, extractor });
```
- 返回数组须按**从高到低**排序；Fastify 适配器对数组最高匹配支持更可靠。

**对比其他框架**：
- URI 版本类似 **Spring 的 `@RequestMapping("/v1/...")` 或路径前缀**。
- Header/Media Type 版本类似 **Java 的 `@RequestMapping(headers=...)` / `produces=application/json;version=...`**（Spring 7 的版本化）。

---

## 三、控制器 / 路由版本

### 控制器整体版本
```ts
@Controller({ version: '1' })
export class CatsControllerV1 {
  @Get('cats') findAll() { return 'v1'; }
}
```

### 路由级版本（覆盖控制器）
```ts
@Controller()
export class CatsController {
  @Version('1') @Get('cats') findAllV1() { return 'v1'; }
  @Version('2') @Get('cats') findAllV2() { return 'v2'; }
}
```

### 多版本
```ts
@Controller({ version: ['1', '2'] })
export class CatsController {
  @Get('cats') findAll() { return 'v1 or v2'; }
}
```

### 中性版本
```ts
import { VERSION_NEUTRAL } from '@nestjs/common';

@Controller({ version: VERSION_NEUTRAL })
export class CatsController {
  @Get('cats') findAll() { return 'regardless of version'; }
}
```
- URI 策略下 URL 不带版本号，无论请求带不带版本都匹配。

---

## 四、全局默认版本

```ts
app.enableVersioning({
  // type: ...,
  defaultVersion: '1', // 或 ['1','2'] 或 VERSION_NEUTRAL
});
```

---

## 五、中间件按版本约束

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

---

## 六、重要注意事项

1. 启用版本控制后，**未指定版本的控制器/路由**或**请求版本无对应路由**都返回 **404**。
2. `VERSION_NEUTRAL` 资源在 URI 策略下不显示版本，且无视请求版本。

> 口诀：**"URI 最直观，Header 最干净，Media 藏 Accept，Custom 最自由；忘了标版本就 404。"**
