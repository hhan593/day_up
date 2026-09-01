# 知识点：NestJS 自定义提供者（Custom Providers）

> 在 NestJS 中，「提供者（Provider）」是可被依赖注入容器（IoC Container）管理、可被 `@Injectable()` 类通过构造函数注入的任何值。
> 大多数时候我们写 `providers: [CatsService]`（把类本身当作 token 和值），但 Nest 还支持更灵活的「自定义提供者」：
> 用对象语法 `{ provide: token, useXXX }` 把**任意值 / 工厂函数 / 别名**绑定到一个 token 上。
> 本文系统讲解四种 `useXXX` 写法、token 类型、动态模块，并结合本项目代码实战。

---

## 目录

1. 为什么需要自定义提供者
2. 提供者的「token」与「值」两个概念
3. 四种自定义提供者写法
   - 3.1 `useClass`：用另一个类替换实现
   - 3.2 `useValue`：绑定一个现成的值（常量 / 配置 / 第三方实例）
   - 3.3 `useFactory`：用工厂函数动态创建（最常用，可注入依赖）
   - 3.4 `useExisting`：给同一个实例起「别名 token」
4. token 的两种形式：类令牌 vs 字符串/ Symbol 令牌（`@Inject()`）
5. 实战：本项目中的自定义提供者
   - 5.1 `DATABASE_URL`（`useValue` + 字符串 token）
   - 5.2 `DATABASE_CONNECTION`（`useFactory` + `inject`）
   - 5.3 `APP_*` 框架 token（`useClass` 全局注册切面）
6. 动态模块里动态生成 providers（`forRoot`）
7. 可选依赖与 `inject` 数组
8. 最佳实践与常见陷阱

---

## 1. 为什么需要自定义提供者

默认写法 `providers: [CatsService]` 等价于：

```ts
providers: [
  { provide: CatsService, useClass: CatsService }, // token === 值（同一个类）
]
```

它只能「把一个类登记为它自己」。但真实项目常需要：

- 注入一个**配置字符串 / 常量**（不是类）→ 用 `useValue`
- 注入一个**需要异步或带参数构建**的对象（如数据库连接）→ 用 `useFactory`
- 在不同环境注入**不同实现类**（如测试用 Mock、生产用真实实现）→ 用 `useClass`
- 同一个单例用**多个 token 名字**都能注入到 → 用 `useExisting`

一句话：**自定义提供者让你解耦「要注入的 token」和「实际创建的值」**。

---

## 2. 提供者的「token」与「值」两个概念

每个 provider 都有两部分：

| 概念 | 作用 | 例子 |
|------|------|------|
| **token（令牌）** | 注入时用来「查询」的钥匙 | `CatsService`（类）、`'DATABASE_URL'`（字符串） |
| **值（value）** | 实际被注入的对象/实例 | `new CatsService()`、字符串、`connection` 对象 |

注入时写 `constructor(@Inject(token) private x: 类型)` 或（类 token）`constructor(private svc: CatsService)`，
Nest 拿着 token 去容器里查，返回对应的值。

---

## 3. 四种自定义提供者写法

### 3.1 `useClass`：用另一个类替换实现

```ts
// 默认实现
@Injectable()
class RealNotificationService { send() { /* 发真实短信 */ } }

// 测试/备用实现
@Injectable()
class MockNotificationService { send() { /* 不发，仅记录 */ } }

// 模块里：注入 NotificationService 时，实际拿到的是 MockNotificationService
providers: [
  { provide: NotificationService, useClass: MockNotificationService },
]
```

- token 是 `NotificationService`（类），注入 `constructor(private svc: NotificationService)` 时拿到 `MockNotificationService` 的实例。
- 常用于**面向接口编程 / 测试替换实现**。
- 本项目里的 `APP_FILTER` / `APP_GUARD` / `APP_INTERCEPTOR` 全局注册，本质也是 `useClass`（见 5.3）。

### 3.2 `useValue`：绑定一个现成的值

```ts
providers: [
  {
    provide: 'DATABASE_URL',
    useValue: 'postgresql://localhost:5432/mydb',
  },
]
```

- 值可以是字符串、数字、对象、已经 `new` 好的第三方实例（如 `useValue: new RedisClient(...)`）。
- token 是字符串，注入时必须用 `@Inject('DATABASE_URL')`。
- 适合**配置常量、外部实例**。

### 3.3 `useFactory`：用工厂函数动态创建（最常用）

```ts
providers: [
  {
    provide: 'DATABASE_CONNECTION',
    useFactory: (config: ConfigService) => {
      // 可以根据注入的依赖动态创建对象，甚至异步（返回 Promise）
      return createConnection(config.get('db'));
    },
    inject: [ConfigService], // 工厂需要的依赖，按顺序传给 useFactory 的参数
  },
]
```

- `useFactory` 是一个函数，返回值就是要注入的值（也可返回 `Promise`，Nest 会 await）。
- `inject: [...]` 声明工厂依赖的 token 列表，Nest 先解析它们，再调用工厂。
- **最适合「需要参数 / 依赖才能构建」的对象**（数据库连接、密钥客户端等）。

### 3.4 `useExisting`：给同一个实例起「别名 token」

```ts
// 已有单例
providers: [
  { provide: LoggerService, useClass: LoggerService },
  // 别名：用 'APP_LOGGER' 也能注入到同一个 LoggerService 实例
  { provide: 'APP_LOGGER', useExisting: LoggerService },
]
```

- `useExisting` 不创建新实例，只是把新 token 指向**已存在的那个 provider 实例**。
- 用于「同一单例，多种注入名字」，避免重复实例化。

---

## 4. token 的两种形式：类令牌 vs 字符串/ Symbol 令牌

### 类令牌（默认，推荐）

```ts
providers: [CatsService]
// 注入：
constructor(private cats: CatsService) {}
```

- token 就是类本身，TS 能从类型自动推断，无需 `@Inject()`。

### 字符串 / Symbol 令牌（必须 `@Inject()`）

```ts
providers: [{ provide: 'DATABASE_URL', useValue: '...' }]
// 注入（TS 无法从字符串推断出类型，必须显式 @Inject）：
constructor(@Inject('DATABASE_URL') private dbUrl: string) {}
```

> ⚠️ 关键规则：**非类令牌（字符串、Symbol、数字）做 token 时，必须用 `@Inject(token)` 装饰器**，
> 因为 TypeScript 的「类型」在运行时被擦除，Nest 没法从 `string` 类型反推出要查的 token 是 `'DATABASE_URL'`。
> 而类令牌能直接用类引用当 token，所以能自动解析。

本项目 `database-moudle.module.ts` 里 `DATABASE_URL` 就是字符串 token，注释也强调了这点：

```ts
{
  provide: DATABASE_URL, // 🔑 字符串作为 token,非类令牌注入时必须使用 @Inject() 装饰器
  useValue: 'postgresql://localhost:5432/mydb',
}
```

---

## 5. 实战：本项目中的自定义提供者

### 5.1 `DATABASE_URL`（`useValue` + 字符串 token）

> 文件：`src/database-moudle/database-moudle.module.ts`

```ts
export const DATABASE_URL = 'DATABASE_URL';

@Module({
  providers: [
    DatabaseConnection, // 普通类 provider（token===类）
    {
      provide: DATABASE_URL,            // 字符串 token
      useValue: 'postgresql://localhost:5432/mydb', // 现成字符串常量
    },
  ],
  exports: [DatabaseConnection],
})
export class DatabaseMoudleModule { /* ... */ }
```

注入方式（任何导入了该模块的类中）：

```ts
constructor(@Inject(DATABASE_URL) private dbUrl: string) {}
```

### 5.2 `DATABASE_CONNECTION`（`useFactory` + `inject`）

> 文件：`src/database-moudle/database.providers.ts`

```ts
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export function DatabaseProviders(
  entities: any[] = [],
  options: Record<string, any> = {},
): Provider[] {
  const connectionProvider: Provider = {
    provide: DATABASE_CONNECTION,
    useFactory: () => {
      // 骨架：后续在此建立真实连接（TypeORM / Mongoose）
      return { options, entities };
    },
  };
  return [connectionProvider];
}
```

- 用 `useFactory` 创建连接对象，工厂闭包捕获了 `entities` / `options` 参数。
- 真实接入 ORM 时通常还要 `inject: [DATABASE_URL]` 或 `inject: [ConfigService]`，并让工厂返回 `await createConnection(...)`。

### 5.3 `APP_*` 框架 token（`useClass` 全局注册切面）

> 文件：`src/app.module.ts`

全局异常过滤器、守卫、拦截器都通过「框架内置 token + `useClass`」注册，
这样框架才能实例化并注入依赖（全局用 `new X()` 是无法 DI 的）：

```ts
providers: [
  { provide: APP_FILTER, useClass: CatchEverythingFilter }, // 兜底过滤器
  { provide: APP_FILTER, useClass: HttpExceptionFilter },   // HttpException 过滤器
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  { provide: APP_INTERCEPTOR, useClass: TransFormInterceptor },
  { provide: APP_GUARD, useClass: RoleGuard },              // 全局守卫
]
```

- 这里 token 是 Nest 内置的 `APP_FILTER` / `APP_GUARD` / `APP_INTERCEPTOR`（类令牌）。
- `useClass` 传的是「类」，Nest 负责 `new` 并注入其依赖（如 `RoleGuard` 里的 `Reflector`）。

---

## 6. 动态模块里动态生成 providers（`forRoot`）

自定义提供者常和**动态模块**配合：模块在 `forRoot()` 时根据传入参数，生成不同的 provider 列表。

> 文件：`src/database-moudle/database-moudle.module.ts`

```ts
export class DatabaseMoudleModule {
  static forRoot(
    entities: any[] = [],
    options: Record<string, any> = {},
  ): DynamicModule {
    const providers = DatabaseProviders(entities, options); // 动态生成 providers
    return {
      module: DatabaseMoudleModule,
      providers,
      exports: providers,
      global: true, // 注册为全局模块，其他模块无需 import 即可注入 DATABASE_CONNECTION
    };
  }
}
```

- `DatabaseProviders(entities, options)` 返回的就是一组 `{ provide, useFactory }` 自定义提供者。
- `global: true` 让这些 provider 全应用可用（等价于 `@Global()`）。

调用方：

```ts
@Module({
  imports: [DatabaseMoudleModule.forRoot([DogEntity], { host: 'localhost' })],
})
export class AppModule {}
```

---

## 7. 可选依赖与 `inject` 数组

- `inject` 数组里的 token 顺序，**必须和 `useFactory` 的参数顺序一一对应**。
- 若某个依赖可能不存在，可用 `@Optional()` + 类令牌方式，或在工厂里做空值兜底。
- `useClass` / `useValue` 不需要 `inject`（它们不接收参数）。

---

## 8. 最佳实践与常见陷阱

1. **类令牌优先**：能用类当 token 就用类（免写 `@Inject`、有类型提示）。只有常量/配置才用字符串 token。
2. **非类令牌必须 `@Inject()`**：字符串、`Symbol` token 注入时漏写 `@Inject()` 会报 `Nest can't resolve dependencies`。
3. **全局切面用 `APP_*` + `useClass`**，不要用 `app.useGlobalGuards(new X())`——后者无法注入依赖。
4. **`useFactory` 的异步**：工厂可返回 Promise，Nest 会等它 resolve 后再注入（适合异步连接）。
5. **`useExisting` ≠ `useClass`**：`useExisting` 指向**已存在**的同一实例（别名）；`useClass` 会**新建**一个类实例。想复用单例就别用错。
6. **动态模块的 `exports`**：`forRoot` 里动态生成的 provider 若想被其他模块注入，必须放进 `exports`。
7. **token 命名冲突**：字符串 token 容易和别处重名，建议像本项目一样用 `export const XXX = 'XXX'` 常量定义，集中管理、避免拼写错误。

---

## 一句话总结

> NestJS 的自定义提供者用 `{ provide: token, useXXX }` 把「注入用的 token」与「实际创建的值」解耦：
> `useClass` 换实现、`useValue` 绑常量、`useFactory` 动态构建（可注入依赖）、`useExisting` 起别名。
> 配合动态模块 `forRoot()` 还能按参数生成 provider 列表。
> 记住**类令牌自动解析、非类令牌必须 `@Inject()`**，就能避开绝大多数 DI 报错。
