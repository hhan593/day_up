# NestJS 认证（Authentication）技术详解

> 来源：https://docs.nestjs.cn/security/authentication
> 作用：确认"你是谁"——验证用户身份（登录、令牌、会话）。
> 本页核心：基于 JWT 的认证 + 自定义 Guard。Passport 集成、本地策略、OAuth、Session 详见官方其他章节。
> 最后更新：2026/8/9（文档日期）

---

## 一、认证 vs 授权（先分清）

- **认证 Authentication**：你是谁？（登录、凭据校验）—— 本文档主题
- **授权 Authorization**：你能做什么？（角色、权限）—— 见 `authorization.md`
- 两者正交但授权依赖认证（必须先知道是谁，才能判断能做什么）

**对比**：类似 **Spring Security 的 Authentication（AuthenticationManager）vs Authorization（AccessDecisionManager）**，Nest 用 Guard 统一做这两件事。

---

## 二、模块与用户服务

```bash
nest g module auth && nest g controller auth && nest g service auth
nest g module users && nest g service users
```
- `UsersService` 提供 `findOne(username)`（示例硬编码，生产查数据库）。
- `UsersModule` 需 `exports: [UsersService]` 供 `AuthModule` 注入。

---

## 三、登录与密码校验

```ts
// auth.service.ts
async signIn(username: string, pass: string): Promise<any> {
  const user = await this.usersService.findOne(username);
  // ⚠️ 文档示例为明文比对，生产必须用 bcrypt/argon2 哈希校验（见 encryption-hashing.md）
  if (user?.password !== pass) throw new UnauthorizedException();
  const { password, ...result } = user;
  return result; // 返回脱敏后的用户信息（不要返回密码）
}
```
```ts
// auth.controller.ts
@HttpCode(HttpStatus.OK)
@Post('login')
signIn(@Body() signInDto: Record<string, any>) {
  return this.authService.signIn(signInDto.username, signInDto.password);
}
```

---

## 四、签发 JWT

```bash
npm install --save @nestjs/jwt
```
```ts
// auth.module.ts
JwtModule.register({
  global: true,
  secret: jwtConstants.secret,
  signOptions: { expiresIn: '60s' },
});
```
```ts
// auth.service.ts
const payload = { sub: user.userId, username: user.username };
return { access_token: await this.jwtService.signAsync(payload) };
```
- ⚠️ `secret` **绝不能硬编码进源码**，生产放环境变量 / 密钥库（见 `encryption-hashing.md`）。

---

## 五、自定义认证守卫（AuthGuard）

```ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();
    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = payload; // 注入 request.user，供后续守卫/控制器用
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```
```ts
@UseGuards(AuthGuard) // 保护路由
@Get('profile') getProfile(@Req() req) { return req.user; }
```

**对比**：这是手写 Bearer 校验；等价于 **Spring Security 的 `JwtAuthenticationFilter`**、**Express 的 `passport-jwt`**。

---

## 六、全局守卫 + 公开路由

```ts
// 全局注册（模块的 providers）
{ provide: APP_GUARD, useClass: AuthGuard }
```
```ts
// 自定义 @Public() 装饰器跳过鉴权
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// 守卫内
const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
  context.getHandler(),
  context.getClass(),
]);
if (isPublic) return true;
```
```ts
@Public() @Post('login') login() {} // 登录接口公开
```

---

## 七、Passport 集成（文档入口，未展开）

- Passport 是最流行的 Node 认证库，可用 `@nestjs/passport` 集成。
- 本地策略（`passport-local`）、JWT 策略（`passport-jwt`）、OAuth（`passport-google-oauth20` 等）需在独立章节查阅。
- 思路：每个策略是一个 `Strategy` 类（继承 `PassportStrategy`），配合 `AuthGuard('local'/'jwt')` 使用。

---

## 八、最佳实践

1. 密码**永远**用哈希存储（bcrypt/argon2），登录用 `compare` 校验。
2. JWT `secret` 走环境变量；令牌设合理过期时间（短 access + 可选 refresh）。
3. 用 `@Public()` 精细化放开登录/健康检查等路由。
4. 把"读用户身份"统一在守卫里做，业务代码用 `@Req() user` 即可。

> 口诀：**"登录校验密码（哈希），签发 JWT 令牌；Bearer 进守卫，验证后挂 user；公开用 @Public。"**
