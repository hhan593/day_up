# Recipes - 认证与授权（Authentication & Authorization）

> 来源：NestJS 中文官方文档
> - 认证：`https://docs.nestjs.cn/security/authentication/`
> - Passport：`https://docs.nestjs.cn/recipes/passport/`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第八章。认证是"你是谁"，授权是"你能干嘛"。衔接 `01-fundamentals/guards.md`（AuthGuard 本质是守卫）与 `03-security`。

## 一、整体方案

Nest 认证推荐用 **Passport**（Node 最流行认证中间件）+ `@nestjs/passport` 适配进 Nest 守卫体系。常见策略：
- **本地策略（LocalStrategy）**：用户名密码登录拿 token
- **JWT 策略（JwtStrategy）**：校验 token，识别用户

流程：
```
POST /auth/login → LocalStrategy 校验 → 签发 JWT
GET /profile (带 Bearer token) → JwtStrategy 校验 → 放行 + 注入 user
```

## 二、安装

```bash
npm i @nestjs/passport passport passport-local passport-jwt
npm i @nestjs/jwt jsonwebtoken    # JWT 支持
npm i -D @types/passport-local @types/passport-jwt
```

## 三、本地策略（登录）

```ts
// local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();   // 默认字段 username / password
  }

  async validate(username: string, password: string) {
    const user = await this.authService.validateUser(username, password);
    if (!user) throw new UnauthorizedException();
    return user;   // 返回的对象会被放进 request.user
  }
}
```

## 四、JWT 策略（鉴权）

```ts
// jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SECRET',   // 生产放 ConfigModule
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

## 五、AuthModule 与登录

```ts
// auth.module.ts
@Module({
  imports: [PassportModule, JwtModule.register({ secret: 'YOUR_SECRET', signOptions: { expiresIn: '60s' } })],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

// auth.controller.ts
@Post('login')
@UseGuards(AuthGuard('local'))   // 触发 LocalStrategy
login(@Request() req) {
  return this.authService.login(req.user);  // 签发 JWT
}

// auth.service.ts
login(user: any) {
  const payload = { username: user.username, sub: user.userId };
  return { access_token: this.jwtService.sign(payload) };
}
```

## 六、保护路由 + 取当前用户

```ts
// profile.controller.ts
@UseGuards(AuthGuard('jwt'))   // 触发 JwtStrategy
@Get('profile')
getProfile(@Request() req) {
  return req.user;   // JwtStrategy.validate 返回的对象
}
```

## 七、自定义装饰器取用户（推荐）

`req.user` 到处传不优雅，用 `01-fundamentals/custom-decorators.md` 的 `createParamDecorator`：

```ts
// user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// 使用
@UseGuards(AuthGuard('jwt'))
@Get('profile')
getProfile(@User() user: UserEntity) {
  return user;
}
```

## 八、要点

| 关注点 | 做法 |
|--------|------|
| 登录校验 | `LocalStrategy.validate` + `@UseGuards(AuthGuard('local'))` |
| 签发 token | `JwtService.sign(payload)` |
| 保护路由 | `@UseGuards(AuthGuard('jwt'))` |
| 取当前用户 | `req.user` 或 `@User()` 自定义装饰器 |
| 秘钥管理 | 放 ConfigModule（`configuration.md`） |

> 跨框架对比：Spring Security 的 `AuthenticationManager` + `@PreAuthorize`、Express 手写 `jsonwebtoken` 中间件——Nest 用 Passport 策略 + 守卫，最贴近 Spring Security 的"认证即过滤链"思想。

## 下一篇

→ `openapi.md`：Swagger/OpenAPI 文档。
