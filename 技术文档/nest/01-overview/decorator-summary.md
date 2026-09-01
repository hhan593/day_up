# TypeScript 装饰器 & NestJS 装饰器 完全参考手册

---

## 目录

1. [装饰器是什么](#1-装饰器是什么)
2. [五种装饰器签名与原理](#2-五种装饰器签名与原理)
   - [类装饰器](#21-类装饰器)
   - [属性装饰器](#22-属性装饰器)
   - [方法装饰器](#23-方法装饰器)
   - [存取器装饰器](#24-存取器装饰器)
   - [参数装饰器](#25-参数装饰器)
3. [装饰器工厂模式](#3-装饰器工厂模式)
4. [装饰器执行顺序](#4-装饰器执行顺序)
5. [编译原理 —— `__decorate` 辅助函数](#5-编译原理--__decorate-辅助函数)
6. [NestJS 装饰器速查表](#6-nestjs-装饰器速查表)
7. [NestJS 装饰器详解](#7-nestjs-装饰器详解)

---

## 1. 装饰器是什么

装饰器是一类特殊的声明，可以附加到**类、方法、属性、存取器、参数**上。TypeScript 在编译时将装饰器转换为 `__decorate` 辅助函数调用。

**核心规则：**
- 装饰器在**类定义时立即执行**，而不是实例化时
- 装饰器本质是**函数**，入参由 TypeScript 按约定传入
- 可以**返回新值**来替换被装饰的目标（仅类装饰器和方法装饰器）

---

## 2. 五种装饰器签名与原理

### 2.1 类装饰器

```ts
// 签名
function classDecorator(constructor: Function): void | Function {}
```

| 参数 | 说明 |
|------|------|
| `constructor` | 被装饰类的构造函数 |

**三种写法：**

```ts
// ① 简单类装饰器 — 仅观察/日志
function logClass(constructor: new (...args: any[]) => any) {
  console.log(constructor.name);
}

// ② 装饰器工厂 — 接收自定义参数
function logClassWithParams(message: string) {
  return function (constructor: new (...args: any[]) => any) {
    console.log(constructor.name, message);
  };
}

// ③ 类装饰器扩展 — 返回新类替换原类
function addTimeStamp<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    timeStamp = new Date().getTime();
  };
}
```

---

### 2.2 属性装饰器

```ts
// 签名
function propertyDecorator(target: Object, propertyKey: string | symbol): void {}
```

| 参数 | 说明 |
|------|------|
| `target` | 实例属性 → 类的原型对象 `ClassName.prototype`；静态属性 → 类的构造函数 |
| `propertyKey` | 被装饰的属性名 |

**NestJS 的应用：** `@Inject()` 装饰属性时，在原型上通过 `Reflect.defineMetadata` 记录"哪个属性需要注入什么令牌"，Nest 容器实例化时读取这些元数据来执行注入。

```ts
function MyInject(token?: string) {
  return function (target: Object, propertyKey: string | symbol) {
    const injectToken = token || String(propertyKey);
    // NestJS 实际做的事：
    // Reflect.defineMetadata('inject:token', injectToken, target, propertyKey);
  };
}
```

---

### 2.3 方法装饰器

```ts
// 签名
function methodDecorator(
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
): void | PropertyDescriptor {}
```

| 参数 | 说明 |
|------|------|
| `target` | 原型对象（实例方法）或构造函数（静态方法） |
| `propertyKey` | 方法名 |
| `descriptor` | 属性描述符：`{ value, writable, enumerable, configurable }` |

**核心机制：** 通过 `descriptor.value` 获取原方法，替换为新函数来包装/覆盖。这是实现 AOP（面向切面编程）的基础。

```ts
// 日志装饰器 — 包装原方法，在调用前后插入逻辑
function LogMethod() {
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`调用: ${String(key)}(${args})`);
      const result = original.apply(this, args);
      console.log(`返回: ${result}`);
      return result;
    };
  };
}
```

**NestJS 的应用：** `@Get()` `@Post()` 等方法装饰器读取 `descriptor.value` 获取处理器，将其与路由路径/方法关联存储到元数据中。

---

### 2.4 存取器装饰器

```ts
// 签名与方法装饰器完全相同
function accessorDecorator(
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor,
): void | PropertyDescriptor {}
```

| 区别 | `descriptor.value` 不存在，取而代之的是 `descriptor.get` 和 `descriptor.set` |

```ts
// 校验装饰器 — 包装 setter，在赋值前校验
function Validate() {
  return function (target: Object, key: string | symbol, descriptor: PropertyDescriptor) {
    const originalSet = descriptor.set;
    descriptor.set = function (value: any) {
      if (value == null) throw new Error(`${String(key)} 不能为 null`);
      if (originalSet) originalSet.call(this, value);
    };
  };
}
```

---

### 2.5 参数装饰器

```ts
// 签名
function parameterDecorator(
  target: Object,
  propertyKey: string | symbol | undefined,
  parameterIndex: number,
): void {}
```

| 参数 | 说明 |
|------|------|
| `target` | 原型对象（实例方法）或构造函数 |
| `propertyKey` | 方法名；**构造函数参数时为 `undefined`** |
| `parameterIndex` | 参数在列表中的索引（从 0 开始） |

**NestJS 的应用：** `@Body()` `@Query()` `@Param()` `@Req()` 等全部是参数装饰器。它们记录"第几个参数需要从请求的哪个位置提取什么数据"。Nest 运行时根据这些元数据，在处理请求时自动提取对应值并传入方法。

```ts
function MyBody(key?: string) {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 记录：第 parameterIndex 个参数需要提取 body[?key]
    // NestJS 实际做的事：
    // Reflect.defineMetadata('custom:param:type', { type: 'body', key }, target, propertyKey, parameterIndex)
  };
}

class OrderController {
  createOrder(
    @MyBody() body: any,             // 参数0 ← 完整 body
    @MyBody('userId') userId: string, // 参数1 ← body.userId
    @MyBody('items') items: any[],    // 参数2 ← body.items
  ) {}
}
```

---

## 3. 装饰器工厂模式

装饰器工厂是一个**返回装饰器函数**的普通函数，通过闭包传递自定义参数：

```
@decoratorFactory(args)  →  先调用工厂获取装饰器  →  再将装饰器应用到目标
```

```ts
// MyGet 是工厂，返回的匿名函数才是真正的装饰器
function MyGet(path: string) {
  return function (target: Object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // 这里可以访问 path 参数（闭包）
    routes.set(String(propertyKey), { method: 'GET', path, handler: descriptor.value });
  };
}

// 使用时：MyGet('cats') 先执行，返回装饰器，再应用到 findAll
@MyGet('cats')
findAll() { return []; }
```

---

## 4. 装饰器执行顺序

### 4.1 同一目标上多个装饰器

```
@A()
@B()
target
```

执行顺序：
1. **工厂求值**：由外向内 — `A()` → `B()`
2. **装饰器执行**：由内向外 — `B 的返回值` → `A 的返回值`

### 4.2 不同类型装饰器在同一类中的顺序

| 执行顺序 | 装饰器类型 |
|----------|------------|
| 1️⃣ 最先 | 参数装饰器 |
| 2️⃣ | 方法 / 存取器 / 属性装饰器（按代码出现顺序） |
| 3️⃣ 最后 | 类装饰器 |

```ts
@logOrder('1. 类装饰器')         // ← 最后执行
class Demo {
  @logOrder('2. 属性装饰器')     // ← 第2个执行
  prop: string = '';

  @logOrder('3. 方法装饰器')     // ← 第3个执行
  method(
    @logOrder('4. 参数装饰器') p // ← 最先执行
  ) {}
}
// 输出顺序：4 → 2 → 3 → 1
```

---

## 5. 编译原理 —— `__decorate` 辅助函数

TypeScript 编译装饰器后，生成 `__decorate` 调用：

```js
// 编译前
@decoratorA
@decoratorB
class Foo {}

// 编译后（简化）
let Foo = class {};
Foo = __decorate(
  [decoratorA, decoratorB],  // 装饰器数组
  Foo,                       // 被装饰的目标
  null,                      // key（类装饰器为 null）
  undefined                  // descriptor（类装饰器为 undefined）
);
```

`__decorate` 核心逻辑（简化）：

```js
function __decorate(decorators, target, key, desc) {
  // 从右向左遍历 → 由内向外执行
  for (let i = decorators.length - 1; i >= 0; i--) {
    const decorator = decorators[i];
    if (decorator) {
      const result = decorator(target, key, desc);
      // 类/方法装饰器可返回新值替换原目标
      if (result !== undefined) target = result;
    }
  }
  return target;
}
```

正是因为**从右向左遍历**装饰器数组，才产生了"由外向内求值，由内向外执行"的效果。

---

## 6. NestJS 装饰器速查表

### 按装饰器分类

| 装饰器 | 作用位置 | 装饰器类型(TypeScript) | 用途 |
|--------|----------|------------------------|------|
| `@Module` | 类 | 类装饰器 | 定义模块 |
| `@Global` | 模块类 | 类装饰器 | 声明全局模块 |
| `@Controller` | 类 | 类装饰器 | 定义控制器 |
| `@Injectable` | 类 | 类装饰器 | 标记可注入的服务 |
| `@Get/@Post/@Put/@Delete/@Patch/@Options/@Head/@All` | 方法 | 方法装饰器 | 映射路由和 HTTP 方法 |
| `@HttpCode` | 方法 | 方法装饰器 | 设置 HTTP 状态码 |
| `@Header` | 方法 | 方法装饰器 | 设置响应头 |
| `@Redirect` | 方法 | 方法装饰器 | 设置重定向 |
| `@Render` | 方法 | 方法装饰器 | 设置模板渲染 |
| `@Sse` | 方法 | 方法装饰器 | SSE 服务端推送 |
| `@Body/@Query/@Param` | 参数 | 参数装饰器 | 提取请求中的数据 |
| `@Headers/@Ip` | 参数 | 参数装饰器 | 提取请求头/客户端 IP |
| `@Req/@Res` | 参数 | 参数装饰器 | 获取原生请求/响应对象 |
| `@Session` | 参数 | 参数装饰器 | 获取 Session |
| `@HostParam` | 参数 | 参数装饰器 | 获取主机名参数 |
| `@UploadedFile(s)` | 参数 | 参数装饰器 | 获取上传文件 |
| `@UseGuards` | 类/方法 | 类/方法装饰器 | 绑定守卫 |
| `@UsePipes` | 类/方法/参数 | 类/方法/参数装饰器 | 绑定管道 |
| `@UseInterceptors` | 类/方法 | 类/方法装饰器 | 绑定拦截器 |
| `@UseFilters` | 类/方法 | 类/方法装饰器 | 绑定异常过滤器 |
| `@SetMetadata` | 类/方法 | 类/方法装饰器 | 设置元数据 |
| `@Catch` | 过滤器类 | 类装饰器 | 指定捕获的异常类型 |
| `@Inject` | 构造参数/属性 | 参数/属性装饰器 | 指定注入令牌 |
| `@Optional` | 构造参数 | 参数装饰器 | 标记依赖为可选 |

### 按使用场景分类

| 场景 | 需要用到的装饰器 |
|------|-----------------|
| 创建模块 | `@Module` `@Global` |
| 创建 REST API | `@Controller` `@Get` `@Post` `@Put` `@Delete` `@Patch` `@HttpCode` `@Header` `@Redirect` |
| 接收请求参数 | `@Body` `@Query` `@Param` `@Headers` `@Req` `@Res` `@Ip` `@Session` `@HostParam` |
| 依赖注入 | `@Injectable` `@Inject` `@Optional` |
| 权限/认证 | `@UseGuards` `@SetMetadata` |
| 数据校验/转换 | `@UsePipes` `@Body` + `class-validator` |
| 响应格式化 | `@UseInterceptors` |
| 异常处理 | `@UseFilters` `@Catch` |
| 文件上传 | `@UploadedFile` `@UploadedFiles` |
| 自定义组合 | `applyDecorators` `createParamDecorator` |

---

## 7. NestJS 装饰器详解

### 7.1 @Module — 模块定义

```ts
@Module({
  imports: [UserModule, DatabaseModule],    // 导入依赖的其他模块
  controllers: [AppController],             // 注册控制器
  providers: [AppService, LoggerService],   // 注册服务（提供者）
  exports: [AppService],                    // 导出给其他模块使用
})
export class AppModule {}
```

### 7.2 @Global — 全局模块

全局模块只需在根模块注册一次，其他模块无需在 `imports` 中引入即可使用其导出的提供者。常用于数据库模块、配置模块。

```ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

### 7.3 动态模块 — forRoot / forFeature 模式

通过静态方法返回 `DynamicModule`，允许在导入时传递配置参数：

```ts
@Module({})
export class DatabaseModule {
  static forRoot(options: { host: string; port: number }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: 'CONFIG', useValue: options },
        {
          provide: 'CONNECTION',
          useFactory: (cfg) => createConnection(cfg.host, cfg.port),
          inject: ['CONFIG'],
        },
      ],
      exports: ['CONNECTION'],
    };
  }
}

// 使用
@Module({
  imports: [DatabaseModule.forRoot({ host: 'localhost', port: 5432 })],
})
export class AppModule {}
```

### 7.4 @Controller — 控制器

```ts
// 基本用法 — 路径前缀
@Controller('users')       // → /users
export class UserController {
  @Get()                   // → GET /users
  findAll() {}

  @Get(':id')              // → GET /users/:id
  findOne(@Param('id') id: string) {}
}

// 主机名限定
@Controller({ host: 'admin.example.com' })  // 仅 admin.example.com 访问
export class AdminController {}
```

### 7.5 HTTP 方法装饰器

| 装饰器 | HTTP 方法 | 典型场景 |
|--------|-----------|----------|
| `@Get()` | GET | 查询资源 |
| `@Post()` | POST | 创建资源 |
| `@Put()` | PUT | 全量更新 |
| `@Patch()` | PATCH | 部分更新 |
| `@Delete()` | DELETE | 删除资源 |
| `@Options()` | OPTIONS | 查询支持方法 |
| `@Head()` | HEAD | 仅获取响应头 |
| `@All()` | 全部 | 代理/通配 |

```ts
@Controller('cats')
export class CatsController {
  @Get()              findAll() {}
  @Get(':id')         findOne(@Param('id') id: string) {}
  @Post()             create(@Body() dto: CreateCatDto) {}
  @Put(':id')         update(@Param('id') id: string, @Body() dto: UpdateCatDto) {}
  @Patch(':id')       partialUpdate(@Param('id') id: string, @Body() dto: Partial<UpdateCatDto>) {}
  @Delete(':id')      remove(@Param('id') id: string) {}
  @All('proxy/*')     proxy() {}
}
```

**路由通配符：** `*` 匹配任意字符，`?` 匹配单个字符，`:id` 为路径参数。

### 7.6 @HttpCode / @Header / @Redirect

```ts
@Post()
@HttpCode(204)                          // 响应状态码 204
create() {}

@Get()
@Header('Cache-Control', 'no-store')    // 自定义响应头
findAll() {}

@Get('old-path')
@Redirect('/new-path', 301)             // 永久重定向
oldPath() {}

// 动态重定向
@Get('docs/:version')
@Redirect()
docs(@Param('version') v: string) {
  return { url: `https://docs.example.com/${v}`, statusCode: 302 };
}
```

### 7.7 请求参数装饰器

```ts
@Controller('users')
export class UserController {
  @Post()
  create(
    @Body() body: CreateUserDto,               // 整个请求体
    @Body('name') name: string,                // 仅 body.name
    @Headers('authorization') token: string,   // Authorization 请求头
    @Ip() ip: string,                          // 客户端 IP
  ) {}

  @Get(':userId/posts/:postId')
  findPost(
    @Param('userId') userId: string,           // 路径参数 userId
    @Param('postId') postId: string,           // 路径参数 postId
    @Query('page') page: number,               // 查询参数 ?page=2
    @Query() allQuery: any,                    // 全部查询参数
  ) {}
}
```

**`@Res()` 的 passthrough 模式** — 手动设置 cookie 但不绕过拦截器：

```ts
@Get('cookie')
setCookie(@Res({ passthrough: true }) res: Response) {
  res.cookie('sessionId', 'abc123');
  return { message: 'Cookie set' };  // Nest 仍自动处理响应体
}
```

### 7.8 @Injectable / @Inject / @Optional — 依赖注入

```ts
// @Injectable — 标记为可注入
@Injectable()
export class CatsService {
  findAll() { return ['cat1', 'cat2']; }
}

// 通过构造函数自动注入
@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}
}

// @Inject — 指定注入令牌（字符串/符号等非类型令牌）
@Injectable()
export class ApiService {
  constructor(@Inject('CONFIG') private config: { apiUrl: string }) {}
}

// @Optional — 可选注入，不存在时不报错
@Injectable()
export class LoggerService {
  constructor(@Optional() @Inject('OPTIONAL_SERVICE') private opt?: SomeService) {}
}
```

### 7.9 @UseGuards — 守卫（认证/授权）

守卫在请求到达路由处理器之前执行，返回 `true` 才放行。

```ts
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.headers.authorization;
  }
}

@Controller('admin')
@UseGuards(AuthGuard)        // 控制器级
export class AdminController {
  @Get()
  @UseGuards(RoleGuard)      // 方法级，可叠加
  dashboard() {}
}
```

### 7.10 @UseInterceptors — 拦截器（AOP）

在方法执行前后插入逻辑：

```ts
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('请求前...');
    return next.handle().pipe(
      map(data => ({ code: 200, data, msg: 'ok' })),
    );
  }
}

@Controller('cats')
@UseInterceptors(TransformInterceptor)
export class CatsController {}
```

### 7.11 @UsePipes — 管道（转换/校验）

```ts
// 定义
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const num = parseInt(value, 10);
    if (isNaN(num)) throw new BadRequestException('必须是整数');
    return num;
  }
}

// 使用 — 参数级
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}

// 使用 — 方法级
@Post()
@UsePipes(new ValidationPipe())
create(@Body() dto: CreateCatDto) {}
```

### 7.12 @UseFilters / @Catch — 异常过滤

```ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    response.status(exception.getStatus()).json({
      code: exception.getStatus(),
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}

@Controller('cats')
@UseFilters(HttpExceptionFilter)
export class CatsController {}
```

### 7.13 @SetMetadata / 自定义元数据装饰器

```ts
// 原生用法
@SetMetadata('roles', ['admin'])

// 封装成语义化装饰器
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 使用
@Controller('admin')
export class AdminController {
  @Get()
  @Roles('admin', 'superadmin')
  dashboard() {}
}

// 在守卫中读取
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) return true;
    const request = context.switchToHttp().getRequest();
    return roles.some(r => request.user?.roles?.includes(r));
  }
}
```

### 7.14 createParamDecorator — 自定义参数装饰器

```ts
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    return data ? user?.[data] : user;
  },
);

// 使用
@Get('profile')
getProfile(@CurrentUser() user: UserEntity) {}       // 完整 user

@Get('id')
getUserId(@CurrentUser('id') id: string) {}           // 仅 user.id
```

### 7.15 applyDecorators — 装饰器组合

```ts
export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RoleGuard),
  );
}

@Controller('admin')
export class AdminController {
  @Get()
  @Auth('admin')   // 一行替代 SetMetadata + UseGuards
  dashboard() {}
}
```

### 7.16 @Sse / @Render

```ts
// SSE 服务端推送
@Sse('events')
sendEvents(): Observable<MessageEvent> {
  return interval(1000).pipe(
    map(() => ({ data: { time: Date.now() } } as MessageEvent)),
  );
}

// 模板渲染（需配合 hbs/ejs 等模板引擎）
@Get('page')
@Render('index')
page() {
  return { title: 'Hello', items: ['a', 'b'] };
}
```

---

> 配合可运行的代码示例请查看 `explame/day1/src/docs/1.ts`
