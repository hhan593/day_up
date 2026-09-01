# NestJS 自定义装饰器（Custom Decorators）

> 来源：[NestJS 中文文档 · 自定义装饰器](https://docs.nestjs.cn/custom-decorators)
> 装饰器从请求里抽取信息注入到处理器参数——`@Body()`、`@Param()` 底层就是它。

---

## 一、为什么需要自定义装饰器？（通俗对比）

内置 `@Body()`、`@Query()` 够用，但你想"从多个来源组合一个值"（如"当前登录用户"= header 里的 token 解析），就要自定义。

**对比其他语言**：
- **Spring**：`@RequestParam`、`@PathVariable`、`@AuthenticationPrincipal`——Nest 的自定义装饰器 ≈ 自己写一个 `@CurrentUser`。
- **Python 装饰器**：`@app.route` 本质也是装饰器，但 Python 是运行时包装函数；Nest 的**参数装饰器**是"给参数打标"，运行时由框架读标取值。
- 这正是你 `typescript` 文档里 `06-NestJS装饰器与自定义装饰器.md` / `decorator-summary.md` 讲的 TS 装饰器机制在 Nest 里的实战。

---

## 二、参数装饰器：`createParamDecorator`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;   // 返回注入到参数的东西
  },
);

// 用法
@Get()
getProfile(@User() user: UserEntity) {
  console.log(user);
}
```

- `data`：装饰器传的额外参数（如 `@User('id')` 的 `'id'`）。
- `ctx`：`ExecutionContext`，与守卫/拦截器一致。

---

## 三、管道兼容

自定义装饰器可与管道链式：

```ts
@Get()
async findOne(@User(new ValidationPipe()) user: UserEntity) {}
```
> 装饰器返回值会先过管道再注入参数。

---

## 四、元数据装饰器 + Reflector（进阶模式）

`@SetMetadata` 把元数据挂到路由上，配合 `Reflector` 在守卫/拦截器读取。

```ts
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// 现代写法（推荐）：用 Reflector.createDecorator 类型安全
import { Reflector } from '@nestjs/core';
export const Roles = Reflector.createDecorator<string[]>();
```

守卫读取见 `guards.md`。这样实现"路由声明权限 → 守卫校验"的解耦。

---

## 五、传递 ExecutionContext 给守卫

自定义装饰器提取的值，守卫里用 `Request` 拿到（如 `request.user`），所以认证守卫通常配合 `@User()` 装饰器一起用（见 `../03-security/authentication.md` 的 JWT 策略把 `req.user` 挂上）。

---

## 六、多平台（WS/微服务）

`ctx.switchToWs()` / `ctx.switchToRpc()` 取不同上下文，装饰器同样适用。

---

## 七、坑 & 最佳实践

1. **优先 `Reflector.createDecorator`**（Nest 10+）：比 `@SetMetadata` 字符串更安全、有类型。
2. **装饰器别做重逻辑**：保持纯函数，复杂逻辑（如远程校验）放守卫/拦截器。
3. **与 TS 装饰器文档衔接**：本工作区 `06-NestJS装饰器与自定义装饰器.md` 讲实现原理，本文讲 Nest 应用。

---

## 八、一句话总结

> 自定义装饰器 = `createParamDecorator((data, ctx) => value)` 提取参数；`Reflector.createDecorator` / `@SetMetadata` 挂元数据供守卫读；是 `@Body`/`@Param` 的底层机制，也是 `@Roles`、`@User` 的写法。
