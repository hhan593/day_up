# 知识点：NestJS 装饰器与自定义装饰器

> 装饰器（Decorator）是 NestJS 的「语法骨架」——几乎每个 Nest 概念（控制器、路由、注入、守卫、
> 管道、拦截器、过滤器、模块）都通过装饰器声明。理解装饰器，就掌握了 Nest 的组织方式。
> 本文先梳理内置装饰器，再重点讲解「如何自定义装饰器」，并结合本项目代码实战。

---

## 目录

1. 什么是装饰器（TS 基础）
2. Nest 内置装饰器总览
3. 装饰器背后的机制：Reflect Metadata
4. 自定义装饰器的四种类型
   - 4.1 元数据型：`SetMetadata`（本项目已实现）
   - 4.2 类型安全型：`Reflector.createDecorator`（本项目已实现）
   - 4.3 参数型：`createParamDecorator`（从请求中提取数据）
   - 4.4 组合型：`applyDecorators`
5. 实战：自定义 `@Role` + `RoleGuard` 完整链路
6. 自定义 `@User` 参数装饰器
7. 最佳实践与常见陷阱

---

## 1. 什么是装饰器（TS 基础）

装饰器是「**一个函数，用来修改/标注它所附着的目标（类、方法、属性、参数）**」。
Nest 大量使用**类装饰器**、**方法装饰器**、**参数装饰器**。

```ts
// 方法装饰器示例（伪代码）：@Get('/cats') 给方法贴上「GET /cats」路由信息
@Controller('cats')
export class CatsController {
  @Get()
  findAll() {}
}
```

关键点：Nest 在**启动时扫描这些装饰器**，把信息存进元数据系统，构建路由表、依赖图、中间件链等。
所以装饰器只是「**打标签**」，真正的逻辑在框架/守卫/管道里读取这些标签后执行。

> TS 需开启 `experimentalDecorators: true`（你的 `tsconfig.json` 已开启）。

---

## 2. Nest 内置装饰器总览

| 类别        | 常用装饰器                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------ |
| 模块/组件   | `@Module()`、`@Injectable()`、`@Global()`                                                  |
| 控制器/路由 | `@Controller()`、`@Get()` `@Post()` `@Put()` `@Delete()` `@Patch()` `@Param()` `@Query()`  |
| 参数提取    | `@Body()`、`@Param()`、`@Query()`、`@Headers()`、`@Req()`、`@Res()`、`@Session()`、`@Ip()` |
| 注入        | `@Inject()`、`@Optional()`                                                                 |
| AOP 切面    | `@UseGuards()`、`@UseInterceptors()`、`@UseFilters()`、`@UsePipes()`                       |
| 异常        | `@Catch()`                                                                                 |
| 元数据      | `SetMetadata()`、`Reflector.createDecorator()`                                             |
| 自定义      | `createParamDecorator()`、`applyDecorators()`                                              |

---

## 3. 装饰器背后的机制：Reflect Metadata

Nest 把装饰器上的信息存到「反射元数据」里，运行时通过 `Reflector` 读取：

```ts
// 写入（装饰器内部）：把 'role' 元数据挂到目标上
Reflect.defineMetadata('role', ['admin'], target);

// 读取（守卫内部）
const roles = this.reflector.get('role', context.getHandler());
```

- `@SetMetadata(key, value)` 就是 Nest 提供的「写元数据」封装。
- `Reflector`（`@nestjs/core`）是「读元数据」的统一入口，守卫/拦截器/管道里都用它。

---

## 4. 自定义装饰器的四种类型

### 4.1 元数据型：`SetMetadata`（本项目已实现）

> 文件：`src/guards/setmetadata-role.decorator.ts`

```ts
import { SetMetadata } from '@nestjs/common';

// 用工厂函数包装 SetMetadata，得到一个「可复用的角色装饰器」
export const Role = (...role: string[]) => SetMetadata('role', role);
```

- **作用**：把 `role` 数组挂到 `'role'` 这个元数据 key 上。
- **读取**（守卫里）：`this.reflector.get('role', context.getHandler())`。
- **缺点**：key 是字符串，容易拼错、无类型提示。

用法：

```ts
@Role('admin')
@Get('test')
find() {}
```

> 完整读取示例见本项目 `src/guards/setmetadata-role.decorator.ts` 配合 `role.guard.ts`：守卫里用 `reflector.get('role', handler)` 读取字符串 key。

### 4.2 类型安全型：`Reflector.createDecorator`（本项目已实现，推荐）

> 文件：`src/guards/role.decorator.ts`

```ts
import { Reflector } from '@nestjs/core';

// 创建一个带 TS 类型的装饰器，泛型参数即装饰器「携带的值」的类型
export const Role = Reflector.createDecorator<string[]>();
```

- **优势**：有类型约束，IDE 自动提示；用法与 `SetMetadata` 版完全一致，但更安全。
- **读取**：`this.reflector.get(Role, context.getHandler())` —— 注意传的是装饰器本身（不是字符串 key）。

> 注：本项目早期 `RoleGuard` 用过这一版；目前 `RoleGuard` 改为读取 `SetMetadata('role', ...)` 的字符串 key（见 `role.guard.ts`），与 `Auth` 组合装饰器配套。两种方案皆可，关键是「写」「读」两边 key 要一致。

### 4.3 参数型：`createParamDecorator`（从请求提取数据）

用于自定义「参数来源」，比如把「当前登录用户」一键注入到控制器方法：

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // 通常由 AuthGuard 在鉴权后挂载
  },
);
```

用法（控制器方法里直接拿到 user 对象）：

```ts
@Get('profile')
getProfile(@User() user: UserEntity) {
  return user;
}
```

### 4.4 组合型：`applyDecorators`

把多个装饰器合并成一个「复合装饰器」，避免重复堆叠：

```ts
import { applyDecorators, Post, UseGuards } from '@nestjs/common';
import { Role } from './role.decorator';
import { RoleGuard } from './role.guard';

// 合并「路由 + 守卫 + 角色」为一个语义化装饰器
export function AdminPost(path: string) {
  return applyDecorators(Post(path), UseGuards(RoleGuard), Role(['admin']));
}
```

用法：

```ts
@AdminPost('create')
create() {}
// 等价于 @Post('create') @UseGuards(RoleGuard) @Role(['admin']) 三个叠加
```

### 4.5 实战组合装饰器 `@Auth`（本项目已实现）

> 文件：`src/decorator/auth.decorator.ts`

把「角色元数据 + 鉴权守卫 + 角色守卫」一次性组合：

```ts
import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGraud } from '../guards/auth.guard';
import { RoleGuard } from '../guards/role.guard';

/**
 * @param roles 允许访问该路由的角色列表（可变参数）
 */
export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata('role', roles),              // 挂角色元数据（key 与 RoleGuard 读取一致）
    UseGuards(AuthGraud, RoleGuard),         // 先鉴权(AuthGraud)，再校验角色(RoleGuard)
  );
}
```

用法（控制器/方法上只需一行）：

```ts
@Auth('admin')
@Post('secret')
createSecret() {}
```

- `AuthGraud`（注意项目里类名拼写为 `AuthGraud`）先验证请求是否携带 `Authorization` 头（是否登录）。
- `RoleGuard` 再读取 `SetMetadata('role', ...)` 挂载的角色要求，与 `request.user.role` 比对。
- 两者都通过，请求才进入路由处理函数。

---

## 5. 实战：自定义 `@Role` + `RoleGuard` 完整链路

把你项目里已有的三段拼起来，就是一条标准「基于装饰器的权限控制」链路：

**① 定义装饰器（`SetMetadata` 版）**（`setmetadata-role.decorator.ts`）

```ts
export const Role = (...role: string[]) => SetMetadata('role', role);
```

> 也可用 `Reflector.createDecorator<string[]>()`（类型安全版），见 `role.decorator.ts`。
> 本项目 `RoleGuard` 当前读取的是 `SetMetadata('role', ...)` 的字符串 key。

**② 定义守卫读取装饰器**（`role.guard.ts`）

```ts
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('role', context.getHandler()); // 读字符串 key
    if (!requiredRoles || requiredRoles.length === 0) return true; // 没设角色要求 → 放行
    const request = context.switchToHttp().getRequest();
    return matchRole(request, requiredRoles); // 比对用户角色
  }
}
```

**③ 注册 + 使用**

```ts
// 全局注册（app.module.ts）
{ provide: APP_GUARD, useClass: RoleGuard }

// 路由上用组合装饰器 @Auth（src/decorator/auth.decorator.ts）
@Auth('admin')
@Post()
create() {}
```

**链路总结**：装饰器只负责「打标签」→ 守卫在请求时通过 `Reflector`「读标签」→ 决定放行/拒绝。
这就是 Nest 装饰器 + AOP 协作的经典范式。

---

## 6. 自定义 `@User` 参数装饰器

结合 4.3 与项目中的 `UserByIdPipe`（见 `src/Pipe/user-by-id.pipe.ts`，它把 ID 转成 `UserEntity`），
可以更进一步——让控制器直接拿到「当前用户实体」：

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserByIdPipe } from '../Pipe/user-by-id.pipe';

// 从 request.user.id 取出 id，再经 UserByIdPipe 转成实体
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id; // 返回 id（管道会在参数绑定阶段转换）
  },
);
```

用法（注意配合管道）：

```ts
@Get('me')
getMe(@CurrentUser(new UserByIdPipe()) user: UserEntity) {
  return user;
}
```

> 这里体现了装饰器 + 管道的组合：参数装饰器负责「提取原始值」，管道负责「转换/校验」。

---

## 7. 最佳实践与常见陷阱

1. **优先用 `Reflector.createDecorator` 而非 `SetMetadata`**：有类型、防拼错 key。
2. **装饰器只打标签，逻辑写在守卫/拦截器/管道里**：保持装饰器函数「无副作用、纯声明」。
3. **全局守卫用 `APP_GUARD` 注册**才能注入依赖；手动 `useGlobalGuards(new X())` 无法 DI。
4. **`createParamDecorator` 的工厂参数 `data`** 是装饰器传的额外参数（`@User('id')` 中的 `'id'`），
   第二个 `ctx` 才是执行上下文。
5. **类装饰器 vs 方法装饰器反射范围不同**：`context.getHandler()` 拿方法元数据，
   `context.getClass()` 拿控制器类元数据。`@Role` 通常挂在方法上，故读 `getHandler()`。
6. **组合装饰器用 `applyDecorators`**，不要手写一个装饰器函数却忘记返回/应用其他装饰器。
7. **元数据继承**：子类方法不会自动继承父类的 `SetMetadata`，需要自行在基类用 `@Role` 重新标注。

---

## 一句话总结

> NestJS 的装饰器是「打标签」的声明式语法：内置装饰器搭建路由/注入/AOP 骨架，
> 自定义装饰器（`SetMetadata` / `Reflector.createDecorator` / `createParamDecorator` / `applyDecorators`）
> 用来挂载**业务元数据**或**提取请求数据**，再配合 `Reflector` 在守卫/管道/拦截器中「读标签」执行逻辑。
> 掌握它，你就掌握了 Nest 的扩展方式。
