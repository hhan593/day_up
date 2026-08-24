# 知识点：NestJS 守卫（Guard）

## 1. 守卫是什么

守卫（Guard）是 NestJS 的一种**横切关注点机制**，用于在请求真正进入路由处理函数之前，决定「这个请求到底能不能继续走下去」。

- 每个守卫都必须实现 `CanActivate` 接口的 `canActivate()` 方法；
- 该方法返回**布尔值**：
  - `true` → 请求放行，继续进入拦截器、管道、控制器；
  - `false` → Nest 拒绝请求（默认抛 `403 Forbidden`）；
- `canActivate()` 可以**同步**返回 `boolean`，也可以**异步**返回（`Promise<boolean>` 或 `Observable<boolean>`）。

## 2. 执行顺序（请求生命周期位置）

```
请求 → 中间件(Middleware) → 守卫(Guard) → 拦截器(Interceptor) → 管道(Pipe) → 控制器方法 → 拦截器(响应) → 响应
```

关键点：

- 守卫在**所有中间件之后**执行；
- 守卫在**任何拦截器、管道、控制器方法之前**执行；
- 因此守卫最适合做「鉴权 / 权限」判断——它能在最前面把不合法的请求挡掉，避免后续无谓的校验与处理开销。

## 3. 两种典型守卫示例

### 3.1 鉴权守卫（AuthGuard）—— 验证「是否登录」

把「是否放行」的判断委托给独立纯函数 `validateRequest()`，让守卫保持薄、便于单测（与框架解耦）。

```ts
// src/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

// 纯函数：校验请求是否合法（mock 演示，真实项目应解析 JWT / 校验 session）
function validateRequest(request: Request): boolean {
  const authHeader = request.headers['authorization'];
  return Boolean(authHeader); // 存在 Authorization 头即视为已鉴权
}

@Injectable()
export class AuthGraud implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

> 真实项目里 `validateRequest` 通常做：解析并校验 JWT、查库确认用户状态、把用户信息挂到 `request.user` 上，供后续守卫/控制器使用。

### 3.2 角色守卫（RoleGuard）—— 验证「是否有权限」

依赖注入 `Reflector`，从路由上读取「要求的角色」，再与当前用户角色比对。

```ts
// src/guards/role.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { Role } from './role.decorator';
import { Reflector } from '@nestjs/core';

// 纯函数：比对用户角色与要求的角色集合
export function matchRole(request: Request, requiredRoles: string[]): boolean {
  const user = (request as any).user;
  if (!user || !user.role) return false;
  return requiredRoles.includes(user.role);
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 读取路由上通过 @Role(...) 装饰器设置的角色要求
    const role = this.reflector.get(Role, context.getHandler());
    if (!role) return true; // 未设置角色要求 → 放行
    const request = context.switchToHttp().getRequest<Request>();
    return matchRole(request, role);
  }
}
```

## 4. 如何把「角色信息」挂到路由上

守卫通过 `Reflector` 读取元数据，有两种常见方式给路由标注角色：

### 方式一：`SetMetadata`（原生元数据，字符串 key）

```ts
// src/guards/setmetadata-role.decorator.ts
import { SetMetadata } from '@nestjs/common';

// 把角色数组挂到 'role' 这个元数据 key 上
export const Role = (...role: string[]) => SetMetadata('role', role);

// 守卫中读取：this.reflector.get('role', context.getHandler())
```

路由使用：

```ts
@SetMetadata('role', ['admin'])
@Get('test')
find() {}
```

### 方式二：`Reflector.createDecorator`（类型安全，推荐）

```ts
// src/guards/role.decorator.ts
import { Reflector } from '@nestjs/core';

// 创建一个带有 TS 类型的装饰器，便于守卫用 reflector.get(Role, ...) 读取
export const Role = Reflector.createDecorator<string[]>();

// 守卫中读取：this.reflector.get(Role, context.getHandler())
```

路由使用：

```ts
@Role(['admin'])
@Post()
create() {}
```

| 对比 | SetMetadata | Reflector.createDecorator |
| --- | --- | --- |
| 类型安全 | 弱（key 是字符串易拼错） | 强（有类型提示） |
| 读取方式 | `reflector.get('role', handler)` | `reflector.get(Role, handler)` |
| 推荐度 | 旧方案 / 兼容用 | 新方案 / 推荐 |

## 5. 守卫的三种应用范围

| 范围 | 写法 | 作用 |
| --- | --- | --- |
| 路由级 | `@UseGuards(RoleGuard)` 贴在方法上 | 仅该路由 |
| 控制器级 | `@UseGuards(RoleGuard)` 贴在 `@Controller` 上 | 整个控制器所有路由 |
| 全局 | `app.useGlobalGuards(new RoleGuard(new Reflector()))` 或在 `AppModule` 用 `APP_GUARD` provider | 全应用所有路由 |

> 注意：全局守卫若需注入依赖（如 `Reflector`），推荐用 `APP_GUARD` 方式注册，Nest 会自动管理其依赖：
> ```ts
> // app.module.ts
> @Module({
>   providers: [{ provide: APP_GUARD, useClass: RoleGuard }],
> })
> export class AppModule {}
> ```

## 6. 守卫与中间件、管道的区别

| 维度 | 中间件 | 守卫 | 管道 |
| --- | --- | --- | --- |
| 主要目的 | 处理请求/响应（日志、CORS、body 解析） | 鉴权 / 权限（是否放行） | 转换 / 校验参数 |
| 能否访问 DI | 否（app.use 路径） | 能（@Injectable） | 能（@Injectable） |
| 能否拿到路由 handler 信息 | 否 | 能（ExecutionContext） | 能（ArgumentMetadata） |
| 执行时机 | 最早（路由前） | 中间件之后、管道之前 | 守卫/拦截器之后 |

## 7. ExecutionContext 与上下文切换

守卫的 `canActivate(context: ExecutionContext)` 收到的 `ExecutionContext` 继承自 `ArgumentsHost`，它**不局限于 HTTP**。同一个守卫可以跨传输层复用（HTTP / RPC / WebSocket），关键是要学会「切换上下文」。

```ts
canActivate(context: ExecutionContext): boolean {
  // 判断当前是什么类型的应用上下文
  if (context.getType() === 'http') {
    const request = context.switchToHttp().getRequest();
    // 处理 HTTP 请求...
  } else if (context.getType() === 'rpc') {
    const ctx = context.switchToRpc();
    // 处理微服务（TCP/gRPC）消息...
  } else if (context.getType() === 'ws') {
    const client = context.switchToWs().getClient();
    // 处理 WebSocket 连接...
  }
  return true;
}
```

| 上下文类型 | 切换方法 | 常用对象 |
| --- | --- | --- |
| `http` | `switchToHttp()` | `getRequest()` / `getResponse()` |
| `rpc` | `switchToRpc()` | `getContext()` / `getData()` |
| `ws` | `switchToWs()` | `getClient()` / `getData()` |

> 真实项目中，多数业务守卫只处理 `http`。但当你的守卫需要同时服务于 HTTP 接口和内部微服务调用时，上面的「类型分发」写法非常有用。

## 8. 自定义装饰器配合守卫取 User

守卫通常会把解析出的用户信息挂到 `request.user` 上（如 AuthGuard 解析 JWT 后挂载）。控制器方法想直接拿到 `user`，可以用**自定义参数装饰器** `@User()`，避免在每个方法里手动 `req.user`。

```ts
// user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 从 ExecutionContext 中抽出 request.user 返回
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // AuthGuard 挂载的用户对象
  },
);
```

```ts
@Get('profile')
getProfile(@User() user: UserEntity) {
  // 直接拿到守卫挂载的 user，无需再读 request
  return user;
}
```

## 9. 小结

- 守卫解决的是「**这个请求有没有资格继续**」的问题，最适合做鉴权与权限；
- 实现 `CanActivate` + 返回布尔值即可，逻辑尽量抽成纯函数便于测试；
- 角色信息用 `Reflector` 读取，推荐 `Reflector.createDecorator` 类型安全方案；
- 守卫能注入依赖、能拿到路由上下文，比中间件更适合权限控制；
- `ExecutionContext` 支持 http / rpc / ws 三种上下文切换，可与自定义装饰器配合把 `user` 直接注入控制器方法；
- 应用范围可选路由级 / 控制器级 / 全局级。
