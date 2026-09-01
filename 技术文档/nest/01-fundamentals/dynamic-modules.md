# NestJS 动态模块（Dynamic Modules）

> 来源：[NestJS 中文文档 · 动态模块](https://docs.nestjs.cn/fundamentals/dynamic-modules)
> 动态模块允许在**导入时传参**定制配置，是 `ConfigModule.register(...)`、`CacheModule.register(...)` 的底层机制。

---

## 一、动态模块是什么？（通俗对比）

普通模块是"固定打包盒"；动态模块是"按订单定制的打包盒"——导入时传配置（如数据库连接串），模块据此创建提供者。

**对比其他框架**：
- **Angular `forRoot`/`forChild`**：概念完全一致（Angular Router 的 `RouterModule.forRoot(routes)`）。
- **Spring `@Configuration` + `@Bean`**：Java 用 Java Config 方法返回 bean；Nest 用静态方法返回 `DynamicModule`。
- 这也呼应你工作区的 `14-NestJS动态模块.md` 与 `01-overview`。

---

## 二、基本结构

```ts
import { Module, DynamicModule } from '@nestjs/common';

@Module({})
export class DatabaseModule {
  static register(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'CONNECTION',
          useValue: createConnection(options),
        },
      ],
      exports: ['CONNECTION'],
    };
  }
}

// 导入方
@Module({
  imports: [DatabaseModule.register({ host: 'localhost' })],
})
export class AppModule {}
```

`DynamicModule` 字段：`module`（自身）、`providers`/`controllers`/`imports`/`exports` 同普通模块。

---

## 三、`forRoot` vs `forFeature`

约定俗成：
- `forRoot(options)`：全局/根级注册（只调一次），常配 `@Global()`。
- `forFeature(options)`：按特性模块注册（如按实体注册 Repository）。

```ts
// 常见模式
@Global()
@Module({})
export class ConfigModule {
  static forRoot(options: ConfigOptions): DynamicModule { /* ... */ }
}
```

---

## 四、异步动态模块 `forRootAsync`

需要异步依赖（如读 env）时，提供 `useFactory`/`useClass`/`useExisting` 三种异步注册（与全局管道/模块的 `forRootAsync` 三件套一致）。

```ts
static registerAsync(options: DatabaseModuleAsyncOptions): DynamicModule {
  return {
    module: DatabaseModule,
    imports: options.imports || [],
    providers: [...this.createAsyncProviders(options), ...(options.providers || [])],
    exports: ['CONNECTION'],
  };
}

private static createAsyncProviders(options) {
  if (options.useFactory) {
    return [{
      provide: 'CONNECTION',
      useFactory: options.useFactory,
      inject: options.inject || [],
    }];
  }
  // useClass / useExisting 类似，交给 Factory provider 类
}
```

> 各技术模块（`../02-techniques`）的 `registerAsync` 内部就是这套——理解此处即理解全局配置。

---

## 五、共享配置对象

```ts
const configProvider = {
  provide: CONFIG,
  useValue: options.config,
};
return {
  module: DatabaseModule,
  providers: [configProvider],
  exports: [CONFIG],
};
```

---

## 六、坑 & 最佳实践

1. **`module` 字段必填**：指向动态模块类自身。
2. **同模块多 `forRoot`**：一般只调一次（尤其 `@Global`）。
3. **与可配置模块**：Nest 提供 `ConfigurableModuleBuilder` 简化重复样板（无需手写 `createAsyncProviders`），推荐新项目用。

---

## 七、一句话总结

> 动态模块 = 静态方法（`register`/`forRoot`/`registerAsync`）返回 `DynamicModule`，导入时传参定制提供者；是 Nest 所有"可配置模块"（Config/Cache/DB/GraphQL）的底层模式。
