# NestJS 完整知识与开发文档

> 本文档全面介绍 NestJS 框架的核心概念、开发模式、常用技术和最佳实践。
> 最后更新：2026-03-10

---

## 目录

1. [框架概述](#1-框架概述)
2. [核心概念](#2-核心概念)
   - 2.1 模块 (Modules)
   - 2.2 控制器 (Controllers)
   - 2.3 提供者 (Providers / Services)
   - 2.4 依赖注入 (Dependency Injection)
3. [请求生命周期与管道](#3-请求生命周期与管道)
   - 3.1 中间件 (Middleware)
   - 3.2 守卫 (Guards)
   - 3.3 拦截器 (Interceptors)
   - 3.4 管道 (Pipes)
   - 3.5 异常过滤器 (Exception Filters)
4. [数据验证与转换](#4-数据验证与转换)
5. [数据库集成](#5-数据库集成)
   - 5.1 TypeORM
   - 5.2 Prisma
   - 5.3 Mongoose (MongoDB)
6. [认证与授权](#6-认证与授权)
7. [常用技术](#7-常用技术)
   - 7.1 配置管理
   - 7.2 定时任务
   - 7.3 队列
   - 7.4 缓存
   - 7.5 日志
   - 7.6 文件上传
   - 7.7 Swagger API 文档
8. [WebSocket 实时通信](#8-websocket-实时通信)
9. [GraphQL](#9-graphql)
10. [微服务](#10-微服务)
11. [测试](#11-测试)
12. [自定义装饰器与高级特性](#12-自定义装饰器与高级特性)
13. [项目结构与最佳实践](#13-项目结构与最佳实践)
14. [参考资源](#14-参考资源)

---

## 1. 框架概述

### 什么是 NestJS

NestJS 是一个用于构建高效、可扩展的 Node.js 服务端应用程序的框架。它使用现代 JavaScript/TypeScript 构建，结合了面向对象编程 (OOP)、函数式编程 (FP) 和响应式函数编程 (FRP) 的元素。

### 核心特点

- **TypeScript 优先**：完全使用 TypeScript 构建，同时支持纯 JavaScript
- **模块化架构**：受 Angular 启发的模块化设计，支持高度可测试、可扩展、松散耦合的应用
- **底层平台灵活**：默认基于 Express，也可配置为 Fastify（性能更高）
- **开箱即用**：内置支持数据库、验证、缓存、WebSocket、GraphQL、微服务等
- **依赖注入**：完善的 IoC 容器，实现依赖注入模式
- **装饰器驱动**：广泛使用装饰器来声明路由、验证、权限等

### 快速开始

```bash
# 安装 CLI
npm install -g @nestjs/cli

# 创建项目
nest new my-project

# 启动开发服务器
cd my-project
npm run start:dev
```

### 项目入口 main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

`NestFactory.create(AppModule)` 会构建应用上下文，Nest 通过扫描装饰器的元数据来构建模块依赖图。

---

## 2. 核心概念

### 2.1 模块 (Modules)

模块是 NestJS 的基本组织单元。每个应用至少有一个根模块 (`AppModule`)，模块用 `@Module()` 装饰器声明。

```typescript
@Module({
  imports: [UsersModule, AuthModule],   // 导入其他模块
  controllers: [AppController],         // 注册控制器
  providers: [AppService],              // 注册提供者/服务
  exports: [AppService],                // 导出供其他模块使用的提供者
})
export class AppModule {}
```

**关键概念：**

- **模块作用域**：提供者在模块作用域内可见。要跨模块使用，需要通过 `exports` 导出并在目标模块 `imports` 导入
- **全局模块**：使用 `@Global()` 装饰器标记的模块，其导出的提供者全局可用
- **动态模块**：支持运行时配置，如 `TypeOrmModule.forRoot(options)`、`ConfigModule.forRoot()`
- **特性模块**：将相关功能封装到独立模块中，保持关注点分离

```typescript
// 动态模块示例
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: 'DATABASE_OPTIONS', useValue: options },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}
```

### 2.2 控制器 (Controllers)

控制器负责处理传入的 HTTP 请求并返回响应。使用 `@Controller()` 装饰器定义。

```typescript
@Controller('users')  // 路由前缀 /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()                          // GET /users
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')                     // GET /users/:id
  findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()                         // POST /users
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')                     // PUT /users/:id
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')                  // DELETE /users/:id
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
```

**常用装饰器：**

| 装饰器 | 说明 |
|--------|------|
| `@Controller('prefix')` | 定义控制器和路由前缀 |
| `@Get()` `@Post()` `@Put()` `@Delete()` `@Patch()` | HTTP 方法装饰器 |
| `@Param('key')` | 获取路由参数 |
| `@Query('key')` | 获取查询参数 |
| `@Body()` | 获取请求体 |
| `@Headers('key')` | 获取请求头 |
| `@Req()` / `@Res()` | 获取原始请求/响应对象 |
| `@HttpCode(code)` | 设置响应状态码 |
| `@Redirect(url, code)` | 重定向 |

### 2.3 提供者 (Providers / Services)

提供者是 NestJS 的核心概念。服务、仓库、工厂、辅助类等都可以作为提供者。使用 `@Injectable()` 装饰器标记。

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }
}
```

**提供者类型：**

```typescript
// 标准提供者（类提供者）
providers: [UsersService]
// 等价于
providers: [{ provide: UsersService, useClass: UsersService }]

// 值提供者
providers: [{ provide: 'API_KEY', useValue: 'my-api-key' }]

// 工厂提供者
providers: [{
  provide: 'ASYNC_CONNECTION',
  useFactory: async (configService: ConfigService) => {
    const options = configService.get('database');
    return createConnection(options);
  },
  inject: [ConfigService],
}]

// 别名提供者
providers: [{ provide: 'AliasedService', useExisting: UsersService }]
```

**注入作用域 (Scopes)：**

- `DEFAULT`（单例）：默认。在整个应用中共享同一实例
- `REQUEST`：每个请求创建新实例
- `TRANSIENT`：每次注入创建新实例

```typescript
@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

### 2.4 依赖注入 (Dependency Injection)

NestJS 使用 IoC（控制反转）容器实现依赖注入。

**工作原理：**

1. 使用 `@Injectable()` 装饰器标记类为提供者
2. TypeScript 的 `emitDecoratorMetadata` 编译选项会将构造函数参数类型信息添加到类的元数据中
3. NestJS 使用 `reflect-metadata` 库读取这些元数据
4. IoC 容器在实例化类时，自动解析并注入其依赖

```typescript
// NestJS 自动解析 UsersService 的依赖（Repository<User>）
// 并将其注入到构造函数中
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}
}
```

**注入方式：**

- **构造函数注入**（推荐）：通过构造函数参数注入
- **属性注入**：使用 `@Inject()` 装饰器标记属性
- **自定义 Token 注入**：`@Inject('TOKEN_NAME')` 注入非类类型的提供者

---

## 3. 请求生命周期与管道

### 请求处理顺序

```
客户端请求 → Middleware → Guards → Interceptors (before) → Pipes → Controller/Handler → Interceptors (after) → Exception Filters → 客户端响应
```

### 3.1 中间件 (Middleware)

中间件在路由处理程序之前执行，可以访问请求和响应对象。

```typescript
// 函数式中间件
export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.url}`);
  next();
}

// 类中间件
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.url} - ${Date.now()}`);
    next();
  }
}

// 在模块中注册
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');  // 或指定特定控制器/路由
  }
}
```

**特点：**
- 可以访问 `req`、`res`、`next`
- 只在请求到达路由处理程序之前执行（不处理响应后逻辑）
- 适合日志记录、请求修改、认证预处理、限流等

### 3.2 守卫 (Guards)

守卫决定请求是否应由路由处理程序处理，主要用于**授权**。

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用守卫
@UseGuards(RolesGuard)
@SetMetadata('roles', ['admin'])
@Get('admin')
getAdminData() {
  return 'admin data';
}
```

**注册级别：**
- **方法级**：`@UseGuards(AuthGuard)` 应用于单个路由
- **控制器级**：`@UseGuards(AuthGuard)` 应用于整个控制器
- **全局级**：`app.useGlobalGuards(new AuthGuard())`

### 3.3 拦截器 (Interceptors)

拦截器可以在方法执行前后添加额外逻辑，基于 RxJS Observable。

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const now = Date.now();
    return next.handle().pipe(
      map(data => ({
        code: 200,
        message: 'success',
        data,
        timestamp: new Date().toISOString(),
      })),
      tap(() => console.log(`耗时: ${Date.now() - now}ms`)),
    );
  }
}

// 超时拦截器
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(timeout(5000));
  }
}
```

**常见用途：**
- 响应数据格式统一（包装响应）
- 日志记录请求耗时
- 缓存响应
- 超时处理
- 异常映射

### 3.4 管道 (Pipes)

管道用于**数据转换**和**数据验证**。

```typescript
// 内置管道
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.usersService.findOne(id);
}

// 自定义验证管道
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 验证逻辑
    return value;
  }
}
```

**NestJS 内置管道：**

| 管道 | 说明 |
|------|------|
| `ValidationPipe` | 使用 class-validator 验证 DTO |
| `ParseIntPipe` | 将字符串转为整数 |
| `ParseFloatPipe` | 将字符串转为浮点数 |
| `ParseBoolPipe` | 将字符串转为布尔值 |
| `ParseArrayPipe` | 解析数组 |
| `ParseUUIDPipe` | 验证并解析 UUID |
| `ParseEnumPipe` | 验证枚举值 |
| `DefaultValuePipe` | 提供默认值 |

### 3.5 异常过滤器 (Exception Filters)

异常过滤器处理未被捕获的异常，将其转换为用户友好的响应。

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

// 使用
@UseFilters(HttpExceptionFilter)
@Controller('users')
export class UsersController {}
```

**NestJS 内置 HTTP 异常：**

| 异常 | 状态码 |
|------|--------|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `ConflictException` | 409 |
| `InternalServerErrorException` | 500 |

---

## 4. 数据验证与转换

### 安装依赖

```bash
npm install class-validator class-transformer
```

### 全局启用 ValidationPipe

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // 自动剥离 DTO 中未定义的属性
      forbidNonWhitelisted: true,   // 若有未定义属性则抛出错误
      transform: true,              // 自动将载荷转为 DTO 实例
      transformOptions: {
        enableImplicitConversion: true,  // 启用隐式类型转换
      },
    }),
  );
  await app.listen(3000);
}
```

### 定义 DTO

```typescript
import { IsString, IsEmail, IsInt, IsNotEmpty, MinLength, Min, Max, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age: number;

  @IsOptional()
  @ValidateNested()        // 嵌套对象验证
  @Type(() => AddressDto)  // 类型转换
  address?: AddressDto;
}

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;
}
```

### 更新 DTO（Partial）

```typescript
import { PartialType } from '@nestjs/mapped-types';

// 继承 CreateUserDto 的所有属性，但全部变为可选
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### 常用映射类型

| 工具 | 说明 |
|------|------|
| `PartialType(CreateDto)` | 所有属性变为可选 |
| `PickType(CreateDto, ['name', 'email'])` | 只保留指定属性 |
| `OmitType(CreateDto, ['password'])` | 排除指定属性 |
| `IntersectionType(TypeA, TypeB)` | 组合两个类型 |

### 常用 class-validator 装饰器

| 装饰器 | 说明 |
|--------|------|
| `@IsString()` | 必须是字符串 |
| `@IsNumber()` / `@IsInt()` | 必须是数字/整数 |
| `@IsBoolean()` | 必须是布尔值 |
| `@IsEmail()` | 必须是合法邮箱 |
| `@IsNotEmpty()` | 不能为空 |
| `@IsOptional()` | 可选字段 |
| `@MinLength(n)` / `@MaxLength(n)` | 字符串长度限制 |
| `@Min(n)` / `@Max(n)` | 数值范围限制 |
| `@IsEnum(enum)` | 必须是枚举值 |
| `@IsArray()` | 必须是数组 |
| `@IsDate()` | 必须是日期 |
| `@IsUrl()` | 必须是合法 URL |
| `@Matches(regex)` | 正则匹配 |
| `@ValidateNested()` | 嵌套对象验证 |
| `@IsUUID()` | 必须是 UUID |

---

## 5. 数据库集成

### 5.1 TypeORM

NestJS 官方提供 `@nestjs/typeorm` 集成包。

```bash
npm install @nestjs/typeorm typeorm pg  # PostgreSQL
# 或 mysql2 / better-sqlite3 等
```

**配置：**

```typescript
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'mydb',
      entities: [User, Post],
      synchronize: false,  // 生产环境务必设为 false！
      autoLoadEntities: true,
    }),
    TypeOrmModule.forFeature([User]),  // 在模块中注册实体
  ],
})
export class AppModule {}
```

**实体定义：**

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
```

**Repository 使用：**

```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['posts'] });
  }

  findOne(id: string): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }
}
```

### 5.2 Prisma

Prisma 是一个现代的 TypeScript ORM，提供完整的类型安全。

```bash
npm install prisma @prisma/client
npx prisma init
```

**Schema 定义 (prisma/schema.prisma)：**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

**NestJS 集成：**

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// 在服务中使用
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ include: { posts: true } });
  }
}
```

### 5.3 Mongoose (MongoDB)

```bash
npm install @nestjs/mongoose mongoose
```

```typescript
// Schema 定义
@Schema({ timestamps: true })
export class Cat {
  @Prop({ required: true })
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}
export const CatSchema = SchemaFactory.createForClass(Cat);

// 模块注册
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'),
    MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
  ],
})
export class CatsModule {}
```

---

## 6. 认证与授权

### JWT + Passport 认证

```bash
npm install @nestjs/passport passport passport-local passport-jwt
npm install @nestjs/jwt
npm install bcrypt
npm install -D @types/passport-jwt @types/bcrypt
```

**AuthModule 配置：**

```typescript
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**JWT 策略：**

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username, roles: payload.roles };
  }
}
```

**AuthService：**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

**路由保护：**

```typescript
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

**公开路由装饰器（白名单模式）：**

```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// JwtAuthGuard 中检查
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### 基于角色的访问控制 (RBAC)

```typescript
// roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin-only')
getAdminData() { ... }
```

### 安全最佳实践

| 实践 | 说明 |
|------|------|
| 安全存储密钥 | 使用环境变量或配置服务，绝不硬编码 |
| 设置 Token 过期时间 | 越短越安全，配合 Refresh Token 机制 |
| 始终使用 HTTPS | 生产环境必须使用 HTTPS 保护传输中的 Token |
| 最小化 JWT 载荷 | 只包含必要的身份标识信息 |
| 密码哈希存储 | 使用 bcrypt 等哈希算法，绝不存储明文密码 |
| 使用 DTO 验证 | 确保输入数据经过验证和过滤 |
| 避免 synchronize: true | 生产 TypeORM 不要开启自动同步 |

---

## 7. 常用技术

### 7.1 配置管理

```bash
npm install @nestjs/config
```

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,          // 全局可用
      envFilePath: '.env',     // 环境变量文件
      validationSchema: Joi.object({  // 环境变量验证
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
      }),
    }),
  ],
})
export class AppModule {}

// 在服务中使用
@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getDatabaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }
}
```

**命名空间配置（推荐复杂项目使用）：**

```typescript
// config/database.config.ts
export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  name: process.env.DB_NAME || 'mydb',
}));

// 使用
@Injectable()
export class DatabaseService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    console.log(this.dbConfig.host); // 类型安全
  }
}
```

### 7.2 定时任务 (Task Scheduling)

```bash
npm install @nestjs/schedule
```

```typescript
// app.module.ts
@Module({
  imports: [ScheduleModule.forRoot()],
})
export class AppModule {}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  // Cron 表达式定时任务
  @Cron('0 30 8 * * *')  // 每天 8:30
  handleDailyTask() {
    this.logger.debug('每日定时任务执行');
  }

  // 使用预定义枚举
  @Cron(CronExpression.EVERY_HOUR)
  handleHourlyTask() {
    this.logger.debug('每小时执行');
  }

  // 间隔执行
  @Interval(10000)  // 每 10 秒
  handleInterval() {
    this.logger.debug('间隔任务');
  }

  // 延迟执行（只执行一次）
  @Timeout(5000)
  handleTimeout() {
    this.logger.debug('5 秒后执行一次');
  }
}
```

**动态定时任务：**

```typescript
@Injectable()
export class DynamicTaskService {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  addCronJob(name: string, cronExpression: string) {
    const job = new CronJob(cronExpression, () => {
      console.log(`动态任务 ${name} 执行`);
    });
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
  }

  deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
  }
}
```

### 7.3 队列 (Queues)

```bash
npm install @nestjs/bull bull
npm install @types/bull -D
```

```typescript
// 模块注册
@Module({
  imports: [
    BullModule.forRoot({ redis: { host: 'localhost', port: 6379 } }),
    BullModule.registerQueue({ name: 'email' }),
  ],
})
export class EmailModule {}

// 生产者：添加任务到队列
@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(user: User) {
    await this.emailQueue.add('welcome', { userId: user.id, email: user.email }, {
      delay: 5000,       // 延迟 5 秒
      attempts: 3,       // 最多重试 3 次
      removeOnComplete: true,
    });
  }
}

// 消费者：处理队列任务
@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async handleWelcomeEmail(job: Job<{ userId: string; email: string }>) {
    const { email } = job.data;
    // 发送邮件逻辑
  }
}
```

### 7.4 缓存 (Caching)

```bash
npm install @nestjs/cache-manager cache-manager
# Redis 缓存
npm install cache-manager-redis-store
```

```typescript
// 模块注册
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60,       // 默认 TTL（秒）
      max: 100,      // 最大缓存条目数
    }),
  ],
})
export class AppModule {}

// 使用缓存拦截器（自动缓存 GET 响应）
@Controller('users')
@UseInterceptors(CacheInterceptor)
export class UsersController {
  @Get()
  @CacheTTL(30)        // 自定义 TTL
  @CacheKey('all_users')  // 自定义缓存键
  findAll() {
    return this.usersService.findAll();
  }
}

// 手动使用缓存管理器
@Injectable()
export class UsersService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findOne(id: string): Promise<User> {
    const cached = await this.cacheManager.get<User>(`user:${id}`);
    if (cached) return cached;

    const user = await this.usersRepository.findOneBy({ id });
    await this.cacheManager.set(`user:${id}`, user, 3600);
    return user;
  }
}
```

### 7.5 日志 (Logging)

**内置日志：**

```typescript
// 在服务中使用
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  findAll() {
    this.logger.log('查询所有用户');
    this.logger.warn('警告信息');
    this.logger.error('错误信息', errorStack);
    this.logger.debug('调试信息');
    this.logger.verbose('详细信息');
  }
}

// 配置日志级别
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'],  // 只显示指定级别
});
```

**自定义日志（如 Winston）：**

```bash
npm install nest-winston winston
```

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    }),
  ],
})
export class AppModule {}
```

### 7.6 文件上传

NestJS 使用 Multer 处理文件上传（基于 Express）。

```typescript
@Controller('upload')
export class UploadController {
  // 单文件上传
  @Post('single')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(new BadRequestException('只允许图片文件'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { filename: file.filename, size: file.size };
  }

  // 多文件上传
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map(f => ({ filename: f.filename, size: f.size }));
  }
}
```

### 7.7 Swagger API 文档

```bash
npm install @nestjs/swagger
```

**配置：**

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API 文档')
    .setDescription('项目 API 接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('users', '用户相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);  // 访问 /api-docs

  await app.listen(3000);
}
```

**在控制器和 DTO 中使用：**

```typescript
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @ApiOperation({ summary: '获取所有用户' })
  @ApiResponse({ status: 200, description: '成功返回用户列表', type: [UserResponseDto] })
  @Get()
  findAll() { ... }

  @ApiOperation({ summary: '创建用户' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: '用户创建成功' })
  @Post()
  create(@Body() dto: CreateUserDto) { ... }
}

// DTO 中添加文档
export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'John' })
  @IsString()
  name: string;

  @ApiProperty({ description: '邮箱地址', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: '年龄', minimum: 0, maximum: 150 })
  @IsOptional()
  @IsInt()
  age?: number;
}
```

---

## 8. WebSocket 实时通信

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io
```

```typescript
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`客户端连接: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`客户端断开: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { room: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.room).emit('newMessage', {
      sender: client.id,
      message: data.message,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    client.to(room).emit('userJoined', { userId: client.id });
  }
}
```

---

## 9. GraphQL

NestJS 支持 **代码优先 (Code First)** 和 **架构优先 (Schema First)** 两种方式。

```bash
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

**代码优先模式（推荐）：**

```typescript
// app.module.ts
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
})
export class AppModule {}

// 对象类型
@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field(() => [Post], { nullable: true })
  posts?: Post[];
}

// 解析器
@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @ResolveField(() => [Post])
  posts(@Parent() user: User) {
    return this.postsService.findByUserId(user.id);
  }
}

// 输入类型
@InputType()
export class CreateUserInput {
  @Field()
  name: string;

  @Field()
  email: string;
}
```

---

## 10. 微服务

NestJS 内置支持多种传输层的微服务架构。

```bash
npm install @nestjs/microservices
```

**支持的传输层：**

| 传输层 | 说明 |
|--------|------|
| TCP | 默认，适合内部通信 |
| Redis | 基于 Redis Pub/Sub |
| MQTT | 物联网场景 |
| NATS | 高性能消息系统 |
| RabbitMQ | 企业级消息队列 |
| Kafka | 大数据流处理 |
| gRPC | 高性能 RPC 框架 |

**微服务示例：**

```typescript
// 微服务端
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: 3001 },
  });
  await app.listen();
}

// 消息处理
@Controller()
export class MathController {
  @MessagePattern({ cmd: 'sum' })
  sum(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }

  @EventPattern('user_created')
  handleUserCreated(data: Record<string, unknown>) {
    // 处理事件（无需返回值）
  }
}

// 客户端调用
@Injectable()
export class AppService {
  constructor(
    @Inject('MATH_SERVICE') private client: ClientProxy,
  ) {}

  getSum(numbers: number[]) {
    return this.client.send<number>({ cmd: 'sum' }, numbers);
  }

  emitUserCreated(user: any) {
    this.client.emit('user_created', user);
  }
}
```

**混合应用（HTTP + 微服务）：**

```typescript
const app = await NestFactory.create(AppModule);
const microservice = app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: { port: 3001 },
});
await app.startAllMicroservices();
await app.listen(3000);
```

---

## 11. 测试

NestJS 使用 Jest 作为默认测试框架，并提供 `@nestjs/testing` 工具包。

### 单元测试

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn().mockResolvedValue([mockUser]),
            findOneBy: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockReturnValue(mockUser),
            save: jest.fn().mockResolvedValue(mockUser),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should return all users', async () => {
    const result = await service.findAll();
    expect(result).toEqual([mockUser]);
    expect(repository.find).toHaveBeenCalled();
  });

  it('should create a user', async () => {
    const dto: CreateUserDto = { name: 'Test', email: 'test@test.com', password: '123456', age: 25 };
    const result = await service.create(dto);
    expect(result).toEqual(mockUser);
    expect(repository.save).toHaveBeenCalled();
  });
});
```

### 控制器测试

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should return an array of users', async () => {
    expect(await controller.findAll()).toEqual([mockUser]);
  });
});
```

### E2E 测试

```typescript
describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/users (POST) - should create user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Test', email: 'test@test.com', password: '123456', age: 25 })
      .expect(201);
  });

  it('/users (POST) - should fail validation', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ name: '' })  // 缺少必填字段
      .expect(400);
  });
});
```

### 运行测试命令

```bash
npm test                # 运行所有单元测试
npm run test:watch      # 监听模式
npm run test:cov        # 生成覆盖率报告
npm run test:e2e        # 运行 E2E 测试
```

### 测试最佳实践

- 每个测试只验证一个行为
- 使用 `beforeEach` 重置状态，避免测试污染
- 测试契约（输入/输出），而非实现细节
- 不要过度 Mock，简单工具类可以使用真实实现
- 覆盖率建议达到 80% 以上

---

## 12. 自定义装饰器与高级特性

### 自定义参数装饰器

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 获取当前用户
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// 使用
@Get('profile')
getProfile(@CurrentUser() user: User) { return user; }

@Get('email')
getEmail(@CurrentUser('email') email: string) { return email; }
```

### 组合装饰器

```typescript
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: '未授权' }),
  );
}

// 使用：一个装饰器搞定认证 + 授权 + Swagger 文档
@Auth('admin')
@Get('admin')
getAdminData() { ... }
```

### 生命周期钩子

NestJS 提供多个生命周期事件钩子：

| 钩子 | 说明 |
|------|------|
| `OnModuleInit` | 模块初始化后调用 |
| `OnApplicationBootstrap` | 应用完全启动后调用 |
| `OnModuleDestroy` | 模块销毁前调用 |
| `BeforeApplicationShutdown` | 应用关闭前调用 |
| `OnApplicationShutdown` | 应用关闭后调用 |

```typescript
@Injectable()
export class MyService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // 初始化连接、预加载数据等
    console.log('模块初始化完成');
  }

  async onModuleDestroy() {
    // 关闭连接、清理资源等
    console.log('模块即将销毁');
  }
}
```

### 执行上下文 (ExecutionContext)

```typescript
// ExecutionContext 继承自 ArgumentsHost，提供更多上下文信息
const ctx = context.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();

// 获取处理器和类的元数据
const handler = context.getHandler();   // 路由处理方法
const controller = context.getClass();  // 控制器类

// 使用 Reflector 读取自定义元数据
const roles = this.reflector.get<string[]>('roles', context.getHandler());
```

---

## 13. 项目结构与最佳实践

### 推荐项目结构

```
src/
├── main.ts                        # 应用入口
├── app.module.ts                  # 根模块
├── common/                        # 共享代码
│   ├── decorators/                # 自定义装饰器
│   ├── filters/                   # 异常过滤器
│   ├── guards/                    # 守卫
│   ├── interceptors/              # 拦截器
│   ├── pipes/                     # 管道
│   ├── dto/                       # 共享 DTO
│   └── interfaces/                # 共享接口
├── config/                        # 配置文件
│   ├── database.config.ts
│   └── app.config.ts
├── modules/
│   ├── users/                     # 用户模块
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.spec.ts
│   │   ├── users.service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── auth/                      # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── strategies/
│   │       ├── jwt.strategy.ts
│   │       └── local.strategy.ts
│   └── ...
├── database/                      # 数据库相关
│   ├── migrations/
│   └── seeds/
└── test/                          # E2E 测试
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

### 开发最佳实践

1. **模块化设计**：每个功能域一个模块，保持高内聚低耦合
2. **控制器保持轻薄**：业务逻辑放在 Service 中，Controller 只做路由和参数处理
3. **使用 DTO 验证输入**：所有用户输入都通过 DTO + class-validator 验证
4. **统一响应格式**：使用拦截器统一包装响应
5. **统一异常处理**：使用异常过滤器统一错误响应
6. **环境配置分离**：使用 `@nestjs/config` 管理环境变量，不硬编码
7. **数据库迁移**：使用迁移管理数据库变更，生产环境关闭 `synchronize`
8. **编写测试**：为关键业务逻辑编写单元测试和 E2E 测试
9. **使用 Swagger**：自动生成 API 文档
10. **日志规范化**：使用内置 Logger 或 Winston 进行结构化日志

### CLI 常用命令

```bash
nest g module users          # 生成模块
nest g controller users      # 生成控制器
nest g service users         # 生成服务
nest g resource users        # 生成完整 CRUD 资源（模块+控制器+服务+DTO）
nest g guard auth            # 生成守卫
nest g interceptor transform # 生成拦截器
nest g pipe validation       # 生成管道
nest g filter http-exception # 生成异常过滤器
nest g middleware logger     # 生成中间件
```

---

## 14. 参考资源

### 官方文档

- [NestJS 英文官方文档](https://docs.nestjs.com/)
- [NestJS 中文文档（每日同步翻译）](https://docs.nestjs.cn/)
- [NestJS 中文网](https://nestjs.bootcss.com/)
- [NestJS GitHub 仓库](https://github.com/nestjs/nest)

### 核心概念

- [Guards vs Middlewares vs Interceptors vs Pipes 综合指南](https://medium.com/@kevinpatelcse/guards-vs-middlewares-vs-interceptors-vs-pipes-in-nestjs-a-comprehensive-guide-37841a7873f1)
- [NestJS 请求生命周期](https://deepwiki.com/nestjs/docs.nestjs.com/2.3-middleware-guards-pipes-and-interceptors)
- [NestJS 完整手册 - FreeCodeCamp](https://www.freecodecamp.org/news/the-nestjs-handbook-learn-to-use-nest-with-code-examples/)

### 数据验证

- [NestJS 官方验证文档](https://docs.nestjs.com/techniques/validation)
- [class-validator + class-transformer 完整指南](https://dev.to/ahurein/mastering-data-validation-in-nestjs-a-complete-guide-with-class-validator-and-class-transformer-40fj)

### 数据库

- [NestJS Prisma 官方指南](https://docs.nestjs.com/recipes/prisma)
- [Prisma + NestJS 文档](https://www.prisma.io/docs/guides/nestjs)

### 认证与安全

- [NestJS 认证官方文档](https://docs.nestjs.com/security/authentication)
- [NestJS Passport 配方](https://docs.nestjs.com/recipes/passport)
- [Auth0: 使用 NestJS 开发安全 API](https://auth0.com/blog/developing-a-secure-api-with-nestjs-adding-authorization/)

### 高级特性

- [NestJS 装饰器深入解析](https://dev.to/tejastn10/deep-dive-into-nestjs-decorators-internals-usage-and-custom-implementations-4eha)
- [NestJS 依赖注入指南 - DigitalOcean](https://www.digitalocean.com/community/tutorials/a-guide-on-dependency-injection-in-nestjs)
- [NestJS 定时任务官方文档](https://docs.nestjs.com/techniques/task-scheduling)

### 测试

- [NestJS 测试官方文档](https://docs.nestjs.com/fundamentals/testing)
- [NestJS 单元测试与 E2E 测试指南](https://www.freecodecamp.org/news/nestjs-unit-testing-e2e-testing-guide/)
- [testing-nestjs 示例仓库](https://github.com/jmcdo29/testing-nestjs)

### 2026 展望

- [2026 NestJS 实践指南](https://thelinuxcode.com/what-is-nestjs-a-practical-2026-guide-to-building-scalable-nodejs-backends/)
- [NestJS v12.0.0 计划（Q3 2026）](https://github.com/nestjs/nest/pull/16391) — 将引入 `StandardSchemaValidationPipe`，支持 Zod/Valibot 等 Standard Schema
