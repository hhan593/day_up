# 14. NestJS 动态模块（Dynamic Modules）

  

**📌 本文归属的知识点**：NestJS 的**动态模块（Dynamic Modules）** —— 一种「导入模块时可以传参、让通用模块按调用方需求定制自己」的机制。

它解决的是**静态模块绑定无法定制**的痛点，是配置模块、数据库模块、HTTP 客户端等「通用插件型模块」的标准写法。

配套官方文档：[动态模块 | NestJS 中文文档](https://docs.nestjs.cn/fundamentals/dynamic-modules)

配套本项目代码：`src/database-moudle/database-moudle.module.ts`（`forRoot` 实战）。

  

---

  

## 1. 为什么需要动态模块（静态绑定的局限）

  

### 1.1 静态模块绑定回顾

你之前写的 `AuthModule` 是静态绑定：

  

```ts

@Module({

  imports: [UsersModule],     // 写死：只能依赖 UsersModule

  providers: [AuthService],

  exports: [AuthService],

})

```

  

**问题**：消费模块（导入方）**没有机会**影响宿主模块怎么配置。比如你想给 `AuthModule` 传一个「密钥」或「token 过期时间」，静态写法办不到——因为它在类里写死了。

  

### 1.2 动态模块解决什么

当你有一个**通用模块**（配置、数据库、HTTP 客户端），想在不同地方/不同环境用**不同参数**时，就需要动态模块：

提供 `static forRoot / register` 方法，让「导入模块时」能像调函数一样**传参**，模块据此生成自己的 providers。

  

> 官方比喻：动态模块类似「插件」概念——模块本身是通用的，必须由**消费者定制**后才能用。

  

---

  

## 2. 最小例子：ConfigModule（来自官方文档）

  

### 2.1 静态导入（不能定制 → 文档说"没机会影响配置"）

```ts

imports: [ConfigModule]   // 模块自己用什么配置？不知道，写死了

```

  

### 2.2 动态导入（传配置 → 这才是动态模块）

```ts

imports: [ConfigModule.register({ folder: './config' })]

//                                    ↑ 像调方法一样传参！

```

  

### 2.3 动态模块声明（register 返回 DynamicModule）

```ts

@Module({})

export class ConfigModule {

  static register(options: Record<string, any>): DynamicModule {

    return {

      module: ConfigModule,                          // 必填：必须是自己的类名

      providers: [

        { provide: 'CONFIG_OPTIONS', useValue: options },  // 把传入参数存成 provider

        ConfigService,

      ],

      exports: [ConfigService],

    };

  }

}

```

  

### 2.4 参数如何流进业务（@Inject 取用）

```ts

@Injectable()

export class ConfigService {

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {

    // options = { folder: './config' } ← 就是 register 传进来的

  }

}

```

  

**数据链路**：你传 `{ folder }` → `register` 用 `useValue` 存成 `CONFIG_OPTIONS` → `ConfigService` 用 `@Inject('CONFIG_OPTIONS')` 取到。

  

---

  

## 3. DynamicModule 结构（与静态模块的关系）

  

动态模块是**运行时临时拼出来的模块配置**，和静态 `@Module({...})` 几乎一样，只多了一个**必填的 `module` 字段**。

  

| 项目 | 静态模块 | 动态模块（返回值） |

|------|----------|---------------------|

| 写法 | `@Module({...})` 装饰器 | `static xxx(): DynamicModule { return {...} }` |

| 必填 | `imports/providers/...` | **`module` 字段必填**（其余同静态） |

| 能否传参 | ❌ 写死 | ✅ 通过静态方法参数 |

  

```ts

// 动态模块返回的对象（DynamicModule 接口）

{

  module: ConfigModule,        // ← 必填！必须与类名相同

  providers: [ConfigService],

  exports: [ConfigService],

  // imports / controllers 等同静态模块可选

}

```

  

---

  

## 4. register / forRoot / forFeature 三者约定

  

文档强调这是**社区约定，不是语法强制**：

  

| 方法 | 含义 | 例子 |

|------|------|------|

| `register(options)` | 给**当前调用模块**定制配置，每个模块可不同 | `HttpModule.register({ baseUrl })` |

| `forRoot(options)` | 全局配置**一次**，全应用复用 | `TypeOrmModule.forRoot()`、`GraphQLModule.forRoot()` |

| `forFeature(options)` | 基于 forRoot 配置，再针对某模块微调 | 指定某仓储 / 日志上下文 |

| `xxxAsync` 版 | 用 DI 提供配置（异步 / 依赖注入） | `forRootAsync`、`registerAsync` |

  

**记忆口诀**：`register`=这次用、`forRoot`=全局一次、`forFeature`=局部微调。

  

---

  

## 5. 本项目实战：DatabaseMoudleModule.forRoot（你已经写过！）

  

> 文件：`src/database-moudle/database-moudle.module.ts`

  

```ts

export class DatabaseMoudleModule {

  static forRoot(

    entities: any[] = [],

    options: Record<string, any> = {},

  ): DynamicModule {

    const providers = DatabaseProviders(entities, options); // 用参数动态生成 provider

    return {

      module: DatabaseMoudleModule,  // ← DynamicModule 必填

      providers,

      exports: providers,

      global: true,                  // ← forRoot 风格：全局一次，全应用可直接注入

    };

  }

}

```

  

调用方（消费模块）：

  

```ts

@Module({

  imports: [DatabaseMoudleModule.forRoot([DogEntity], { host: 'localhost' })],

})

export class AppModule {}

```

  

**这和官方 `ConfigModule.forRoot({ folder })` 是同一套路**。说明你早已掌握动态模块，只是之前没点破。

  

### 5.1 动态 providers 如何生成（useFactory + inject）

> 文件：`src/database-moudle/database.providers.ts`

  

```ts

export function DatabaseProviders(entities, options): Provider[] {

  const connectionProvider: Provider = {

    provide: DATABASE_CONNECTION,         // 字符串 token

    useFactory: () => ({ options, entities }),  // 用参数构建返回对象

    // inject: [DATABASE_URL],  // 接入真实连接时启用：依赖顺序与 useFactory 参数一致

  };

  return [connectionProvider];

}

```

  

- `useFactory` 闭包捕获了 `forRoot` 传入的 `entities` / `options`，实现「参数驱动构建」。

- 真实接入 ORM 时改为：`useFactory: async (url) => await createConnection({ url, entities })`，`inject: [DATABASE_URL]`。

  

### 5.2 静态部分与动态部分并存

本模块文件里还有一段静态 `@Module`：

  

```ts

@Module({

  providers: [DatabaseConnection, { provide: DATABASE_URL, useValue: 'postgresql://...' }],

  exports: [DatabaseConnection],   // DATABASE_URL 没导出 → 仅本模块内可 inject

})

```

  

- 静态部分：无论怎么导入都存在的固定 provider（`DatabaseConnection`、`DATABASE_URL`）。

- 动态部分：`forRoot()` 里用参数生成的 `providers`，`exports: providers` 导出供全局注入。

- 两者**叠加生效**，不冲突。

  

---

  

## 6. 完整时序：从「传参」到「注入」

  

```

消费模块写：imports: [DatabaseMoudleModule.forRoot([DogEntity], { host })]

        │

        ↓ 调用静态方法 forRoot，拿到 DynamicModule 对象

Nest 用返回的对象（module + providers + exports + global）注册模块

        │

        ↓ DatabaseProviders(entities, options) 生成 DATABASE_CONNECTION provider

        │   useFactory 闭包持有 entities/options

        │

        ↓ global:true → 应用任意位置可注入 DATABASE_CONNECTION

业务类：

  constructor(@Inject(DATABASE_CONNECTION) private conn) {}

        │

        ↓ Nest 解析：调 useFactory() → 返回 { options, entities }

  拿到真正的连接配置对象

```

  

---

  

## 7. 与「静态模块绑定」的对比总结

  

| 维度 | 静态模块 | 动态模块 |

|------|----------|----------|

| 导入写法 | `imports: [FooModule]` | `imports: [FooModule.forRoot(x)]` |

| 能否传参 | ❌ | ✅ |

| 适用场景 | 模块间固定依赖（如 Auth→User） | 通用可配置模块（配置/数据库/HTTP） |

| 参数存储 | —— | `useValue` / `useFactory` 存进动态 providers |

| 典型方法 | 无 | `register` / `forRoot` / `forFeature`（+Async） |

  

---

  

## 8. 常见陷阱

  

1. **漏写 `module` 字段**：`DynamicModule` 返回对象必须含 `module: 类名`，否则 Nest 报错。

2. **忘记 `exports`**：动态生成的 provider 若想被其他模块注入，必须放进 `exports`。

3. **字符串 token 必须 `@Inject()`**：动态模块里常把参数存成字符串 token（如 `CONFIG_OPTIONS`、`DATABASE_CONNECTION`），消费方注入时要用 `@Inject(token)`。

4. **`register` vs `forRoot` 语义混淆**：记得 `register`=本次定制、`forRoot`=全局一次复用。

5. **Async 版需 `inject`**：`forRootAsync`/`registerAsync` 用 `useFactory` 时，依赖要通过 `inject` 声明，顺序与工厂参数一致。

  

---

  

## 9. 关键源码索引

  

| 文件 | 职责 |

|------|------|

| `src/database-moudle/database-moudle.module.ts` | `forRoot` 动态模块（你项目的实战） |

| `src/database-moudle/database.providers.ts` | `useFactory` 动态生成 `DATABASE_CONNECTION` |

| `src/database-moudle/database.connection.ts` | 静态导出的类令牌占位 provider |