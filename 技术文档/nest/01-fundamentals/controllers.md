# NestJS 控制器（Controllers）

> 来源：[NestJS 中文文档 · 控制器](https://docs.nestjs.cn/controllers)
> 控制器负责接收请求、调用服务、返回响应——是 HTTP 层与业务层之间的"门面"。

---

## 一、控制器是什么？（通俗对比）

控制器就像餐厅的**前台/服务员**：顾客（客户端）点单，服务员把需求转给厨房（Service），再把做好的菜（响应）端回来。

**对比其他框架**：
- **Spring MVC**：`@RestController` + `@RequestMapping` + `@GetMapping`，思路几乎一模一样。
- **Express**：`app.get('/cats', handler)`，但 Express 没有"类 + 装饰器"的结构，路由散落各处；Nest 把路由收敛到类里，更易维护。
- **Laravel**：`Route::get('/cats', [CatsController::class, 'index'])`，路由与控制器分离定义；Nest 把路由写在控制器方法上（更内聚）。

---

## 二、定义控制器

用 `@Controller('前缀')` 标记类，方法用 `@Get()`、`@Post()` 等 HTTP 方法装饰器映射路由。

```ts
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('cats')              // 路由前缀 /cats
export class CatsController {
  @Get()                        // GET /cats
  findAll() {
    return '返回所有猫';
  }

  @Get(':id')                   // GET /cats/123
  findOne(@Param('id') id: string) {
    return `猫 ${id}`;
  }

  @Post()                       // POST /cats
  create(@Body() body: any) {
    return '创建一只猫';
  }
}
```

> 控制器**必须**在 `@Module({ controllers: [CatsController] })` 注册才生效。

---

## 三、请求数据装饰器

| 装饰器 | 提取内容 | 等价于 |
|---|---|---|
| `@Req()` | 整个 request 对象 | Express `req` |
| `@Query()` | 查询参数 `?a=1` | `req.query` |
| `@Param()` | 路由参数 `:id` | `req.params` |
| `@Body()` | 请求体 | `req.body` |
| `@Headers()` | 请求头 | `req.headers` |

```ts
@Get()
findAll(@Query('page') page: number, @Headers('authorization') auth: string) {}

@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}  // 配合管道自动转数字
```

> 路由参数用 `:id` 令牌定义，如 `@Get(':id')` 配 `@Param('id')`。

---

## 四、响应两种模式

### 4.1 标准模式（推荐）
直接 `return`，Nest 自动序列化；状态码默认 200（POST 为 201），用 `@HttpCode()` 改。

```ts
@Post()
@HttpCode(201)              // 改成 201
create(): string {
  return 'created';
}
```

### 4.2 库特定模式（注入响应对象）
用 `@Res()` 注入 Express/Fastify 的 response，需手动管理响应。可用 `{ passthrough: true }` 兼顾两者（仍让拦截器、`@HttpCode` 生效）。

```ts
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.setHeader('X-Custom', 'value');
  return [];   // 标准 return 仍可用
}
```

> ⚠️ 随意用 `@Res()` 直接响应会失去拦截器、`@HttpCode()` 等标准特性，**优先用标准模式**。

---

## 五、其它特性

- **通配符路由**：`@Get('ab*cd')` 匹配 `abxcd` 等。
- **重定向**：`@Redirect('https://nestjs.com', 302)`。
- **子域路由**：`@Controller({ host: ':account.example.com' })`。
- **异步**：方法可返回 `Promise` 或 `Observable`（RxJS），Nest 自动处理。

```ts
@Get()
async findAll(): Promise<Cat[]> {
  return this.catsService.findAll();
}
```

---

## 六、完整 CRUD 示例

```ts
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateCatDto) {
    return this.catsService.create(dto);
  }

  @Get()
  findAll(@Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number) {
    return this.catsService.findAll(page);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCatDto) {
    return this.catsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.catsService.remove(id);
  }
}
```

> DTO（`CreateCatDto` 等）的校验见 `../02-techniques/validation.md`，配合全局 `ValidationPipe` 自动生效。

---

## 七、坑 & 最佳实践

1. **单例安全**：Node.js 无多线程，Nest 默认单例可安全共享状态——但**有状态数据**（如请求级的用户上下文）要用请求作用域（见 `injection-scopes.md`）。
2. **路由前缀**：全局前缀用 `app.setGlobalPrefix('api')`（见 `../02-techniques/versioning.md` 配合版本）。
3. **不要用 `@Res()` 除非必要**：破坏标准拦截器链。
4. **参数装饰器原理**：`@Param`/`@Body` 等本质是参数装饰器，其机制在 `custom-decorators.md` 详解，并可自定义。

---

## 八、一句话总结

> 控制器 = `@Controller('前缀')` + 方法上的 `@Get/@Post/...` + 参数装饰器取数据 + `return` 返回；它是 HTTP 与 Service 之间的门面，必须注册进模块。
