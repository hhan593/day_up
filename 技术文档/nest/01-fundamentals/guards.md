# NestJS 守卫（Guards）

> 来源：[NestJS 中文文档 · 守卫](https://docs.nestjs.cn/guards)
> 守卫决定请求**是否放行**（授权），在中间件之后、拦截器/管道之前执行。

---

## 一、守卫是什么？（通俗对比）

守卫像**俱乐部门口的保安**：看证件（token/角色）决定放不放人进。中间件是"大门安检"（所有请求都过），守卫是"包厢门禁"（特定路由才查权限）。

**对比其他框架**：
- **Spring Security**：`OncePerRequestFilter` / `@PreAuthorize` + `AccessDecisionManager`——Nest 守卫 ≈ 一个返回布尔的 `AuthorizationFilter`。
- **Express**：手写 `if (!req.user) return res.status(403)`——Nest 用 `canActivate` 声明式。
- **Vue Router 导航守卫**：概念神似（前置校验决定继续/中断），但 Nest 在服务端、可访问 DI。

---

## 二、实现守卫

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

- 返回 `true` 放行；`false` Nest 拒绝（抛 `ForbiddenException`）。
- `ExecutionContext` 让守卫**知道接下来执行哪个控制器/方法**（这是它比中间件强的地方）。

---

## 三、绑定守卫

```ts
// 控制器级 / 方法级
@Controller('cats') @UseGuards(RolesGuard) export class CatsController {}
@UseGuards(new RolesGuard()) @Post() create() {}

// 全局（推荐 APP_GUARD 支持 DI）
import { APP_GUARD } from '@nestjs/core';
@Module({ providers: [{ provide: APP_GUARD, useClass: RolesGuard }] })
export class AppModule {}
```
> `app.useGlobalGuards()` 无 DI、对网关/微服务不生效。

---

## 四、角色守卫 + Reflector（核心模式）

守卫本身不硬编"谁可访问"，而是读**路由上的元数据**（用 `Reflector`），实现解耦。

### 1. 自定义 `@Roles` 装饰器
```ts
import { Reflector } from '@nestjs/core';
export const Roles = Reflector.createDecorator<string[]>();

// 用法
@Post() @Roles(['admin']) create() {}
```

### 2. 守卫读取元数据
```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) return true;                       // 无要求则放行
    const request = context.switchToHttp().getRequest();
    return matchRoles(roles, request.user?.roles); // 匹配则放行
  }
}
```

> ⚠️ 权限不足 Nest 返回 `403 Forbidden`；可手动抛 `UnauthorizedException` 等，由异常层处理。

---

## 五、Reflector 合并策略

- `getAllAndOverride(meta, [getHandler(), getClass()])`：方法级优先覆盖控制器级。
- `getAllAndMerge(...)`：合并两者。

---

## 六、执行位置（全链路）

```
中间件 → 守卫 → 拦截器(前) → 管道 → 控制器 → 拦截器(后) → 异常过滤器
```
> 守卫在管道之前——即**先授权，再校验参数**。这与 Spring（`Filter` 在前、`Interceptor` 在后）略有差异，但逻辑顺序一致。

---

## 七、与认证/授权文档衔接

- 认证（JWT/session 把 user 挂到 `request.user`）见 `../03-security/authentication.md`。
- 基于角色/属性（CASL）的细粒度授权见 `../03-security/authorization.md`。
- 自定义 `@Roles` 装饰器原理见 `custom-decorators.md`。

---

## 八、坑 & 最佳实践

1. **守卫不读 body**：`canActivate` 时请求体可能未解析完，授权用 header/token，参数校验交给管道。
2. **全局守卫顺序**：`APP_GUARD` 最先执行（全局最先）。
3. **异步守卫**：可返回 `Promise`/`Observable`（如查库验权）。

---

## 九、一句话总结

> 守卫 = `@Injectable` + `CanActivate.canActivate(ctx): boolean`，决定放行；用 `Reflector` 读 `@Roles` 等元数据做角色授权；绑定 `@UseGuards` / 全局 `APP_GUARD`。
