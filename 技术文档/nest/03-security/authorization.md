# NestJS 授权（Authorization）技术详解

> 来源：https://docs.nestjs.cn/security/authorization
> 作用：确定"已认证用户能做什么"（角色、权限、资源归属）。
> 依赖认证环节在 `request.user` 上注入身份信息（见 `authentication.md`）。
> 最后更新：2026/8/9（文档日期）

---

## 一、核心概念

| 概念 | 说明 |
|---|---|
| 角色 Role | 身份类别，如 `User`/`Admin`（TS 枚举） |
| 声明/权限 Permission | 名称-值对，表示"能做什么"而非"是什么" |
| 守卫 Guard | 实现 `CanActivate`，返回 boolean 控制访问 |
| 装饰器 | `@Roles()`/`@RequirePermissions()`/`@CheckPolicies()` + `SetMetadata` + `Reflector` |
| Ownership 资源归属 | 通过 CASL 条件 `{ authorId: user.id }` 实现"只能改自己的" |

**对比**：
- **RBAC（基于角色）**：类似 **Spring Security 的 `hasRole('ADMIN')`**、**Linux 文件权限的 owner/group**。
- **CASL 属性级授权**：类似 **Spring Security 的 `@PreAuthorize("hasPermission(...)")`**、**ABAC（基于属性的访问控制）**。
- 与前面 `validation.md` 的"管道校验入参"不同，**守卫校验的是"人"而非"数据格式"**。

---

## 二、基础 RBAC（基于角色）

### 1. 角色枚举
```ts
export enum Role { User = 'user', Admin = 'admin' }
```

### 2. @Roles() 装饰器
```ts
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### 3. 路由使用
```ts
@Post() @Roles(Role.Admin) create(@Body() dto: CreateCatDto) {}
```

### 4. RolesGuard
```ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // 无角色要求，放行
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```
- 全局：`providers: [{ provide: APP_GUARD, useClass: RolesGuard }]`
- 权限不足返回 **403**：`{ "statusCode": 403, "error": "Forbidden" }`

---

## 三、基于声明（权限级）

与 RBAC 步骤相同，但 `@RequirePermissions(Permission.CREATE_CAT)` 比较**权限**而非角色。

---

## 四、集成 CASL（属性级 + 资源归属）

```bash
npm i @casl/ability
```
```ts
export enum Action { Manage = 'manage', Create = 'create', Read = 'read', Update = 'update', Delete = 'delete' }

// CaslAbilityFactory
@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(Ability as any);
    if (user.isAdmin) can(Action.Manage, 'all');
    else can(Action.Read, 'all');
    can(Action.Update, Article, { authorId: user.id }); // Ownership：只能改自己的
    cannot(Action.Delete, Article, { isPublished: true });
    return build();
  }
}
```

### PoliciesGuard（策略守卫）
```ts
export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) => SetMetadata(CHECK_POLICIES_KEY, handlers);
// PolicyHandler = IPolicyHandler | (ability: AppAbility) => boolean

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private reflector: Reflector, private caslAbilityFactory: CaslAbilityFactory) {}
  canActivate(context: ExecutionContext): boolean {
    const handlers = this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) || [];
    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);
    return handlers.every((h) => typeof h === 'function' ? h(ability) : h.handle(ability));
  }
}

// 路由
@UseGuards(PoliciesGuard)
@CheckPolicies((ability) => ability.can(Action.Read, Article))
findAll() {}
```

---

## 五、RBAC vs CASL 怎么选

| 场景 | 推荐 |
|---|---|
| 简单 admin/user 区分 | RBAC + RolesGuard |
| 细粒度"能改自己创建的" | CASL + PoliciesGuard |
| 超大权限矩阵 | 用权限枚举或外接权限服务 |

> 口诀：**"角色粗，权限细，CASL 管归属；守卫读 user，装饰器标需求，Reflector 取元数据。"**
