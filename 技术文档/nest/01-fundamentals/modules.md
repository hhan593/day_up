# NestJS 模块（Modules）

> 来源：[NestJS 中文文档 · 模块](https://docs.nestjs.cn/modules)
> 模块用 `@Module()` 组织应用结构，是 Nest 的"封装边界"。

---

## 一、模块是什么？（通俗对比）

模块是**功能打包盒**：把相关的控制器、服务、导出装一起，对外只暴露 `exports` 作为"公共接口"。

**对比其他框架**：
- **Java 包 / Maven 模块**：逻辑分组，但 Java 没有"显式声明导出给谁"；Nest 的 `exports` 像 OSGi 的 `Export-Package`，精确控制可见性。
- **Angular NgModule**：`imports`/`exports`/`providers` 概念几乎一致（Nest 作者借鉴定 Angular）。
- **Ruby on Rails**：Rails 靠目录约定自动加载，Nest 靠显式 `@Module` 声明——更明确但更"啰嗦"（CLI 自动生成可缓解）。

---

## 二、`@Module()` 元数据

```ts
import { Module } from '@nestjs/common';

@Module({
  controllers: [CatsController],   // 本模块要实例化的控制器
  providers: [CatsService],        // 本模块创建的提供者
  imports: [OtherModule],          // 要用到的、别的模块导出的提供者
  exports: [CatsService],          // 暴露给导入本模块的模块
})
export class CatsModule {}
```

> 每个应用至少有一个**根模块** `AppModule`，作为构建应用图的起点。

---

## 三、功能模块 & 共享模块

```ts
// 共享：把服务放进 exports，导入方拿到同一单例
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],    // 关键：对外暴露
})
export class CatsModule {}
```

> Nest 默认单例——共享模块被多个模块导入，拿到的是**同一个实例**，避免重复实例化（省内存、保状态一致）。

---

## 四、重导出（Re-export）

```ts
@Module({
  imports: [CommonModule],
  exports: [CommonModule],   // 顺便把导入的也转手导出
})
export class CoreModule {}
```

---

## 五、全局模块 `@Global()`

加 `@Global()` 后无需在 `imports` 声明，但**只应在根/核心模块注册一次**。

```ts
@Global()
@Module({ providers: [CatsService], exports: [CatsService] })
export class CatsModule {}
```
> 文档建议：不要什么都设全局，优先用 `imports` 保持结构清晰。

---

## 六、模块类也能注入（但不能被注入）

```ts
export class CatsModule {
  constructor(private catsService: CatsService) {}  // 可用于启动配置
}
```
> ⚠️ 模块类本身**不能**作为提供者被注入（会循环依赖）。

---

## 七、动态模块（运行时配置）

允许导入时传参定制，形如 `ConfigModule.register({ folder })`。详见 `dynamic-modules.md`（独立专章）。

```ts
@Module({ providers: [Connection], exports: [Connection] })
export class DatabaseModule {
  static forRoot(entities = []): DynamicModule {
    return {
      module: DatabaseModule,
      providers: createProviders(entities),
      exports: [Connection],
    };
  }
}
```

---

## 八、与依赖解析的关系

依赖解析严格按模块边界：
- 只能注入**本模块**的 `providers`，或**导入模块 `exports` 的**提供者。
- 这叫"模块封装"——比 Java 的包可见性更强制。

---

## 九、坑 & 最佳实践

1. **忘记 `exports`**：导入模块后报"找不到提供者"——检查共享服务是否在 `exports`。
2. **过度 `@Global`**：会让依赖关系不透明。
3. **CLI 生成**：`nest g module cats` 自动建文件并注册到最近模块。
4. **目录结构**：推荐 `src/cats/{controller,service,module,dto}` 同目录就近放。

---

## 十、一句话总结

> 模块 = `@Module({controllers, providers, imports, exports})`，是封装边界；`exports` 是公共接口，单例共享；动态模块 `forRoot/register` 支持运行时配置（见 `dynamic-modules.md`）。
