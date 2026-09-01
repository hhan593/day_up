# 知识点：NestJS 模块间共享 Service（无需改动 AppModule）

## 1. 背景与问题

在一个 NestJS 项目中，经常需要让某个模块的 Service 复用另一个模块 Service 的能力，例如让 `DogsService` 使用 `CatsService`。

NestJS 的 IoC 容器基于**模块图（Module Graph）**解析依赖。模块之间不能直接「看到」彼此的 provider，必须通过「**导出 + 导入模块**」的方式建立共享关系。这个关系完全发生在业务模块之间，**不需要（也不应该）在 `AppModule` 中做任何额外配置**。`AppModule` 只负责把各业务模块挂载进来即可。

## 2. 常见误区

| 误区 | 说明 |
| --- | --- |
| 只 `imports` 了对方模块就能注入其 Service | 错。模块必须在 `exports` 中显式导出该 Service，导入方才能注入 |
| 在 `AppModule` 里配置 Service 共享 | 错。`AppModule` 只负责挂载模块，不参与模块间 provider 的共享逻辑 |
| 直接在 `DogsService` 里 `new CatsService()` | 错。绕过了 IoC 容器，失去了单例、依赖注入等特性 |

## 3. 正确做法（三步）

### 第一步：被依赖的模块导出 Service

在 `CatsModule` 中通过 `exports` 显式导出 `CatsService`：

```ts
// src/cats/cats.module.ts
import { Module } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CatsController } from './cats.controller';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService], // 关键：导出后才能被其他模块使用
})
export class CatsModule {}
```

### 第二步：使用方模块导入对方模块

在 `DogsModule` 中 `imports` 包含 `CatsModule`：

```ts
// src/dogs/dogs.module.ts
import { Module } from '@nestjs/common';
import { DogsService } from './dogs.service';
import { DogsController } from './dogs.controller';
import { CatsModule } from '../cats/cats.module';

@Module({
  imports: [CatsModule], // 导入提供 CatsService 的模块
  controllers: [DogsController],
  providers: [DogsService],
  exports: [DogsService],
})
export class DogsModule {}
```

### 第三步：在使用方 Service 中注入依赖

```ts
// src/dogs/dogs.service.ts
import { Injectable } from '@nestjs/common';
import { CatsService } from '../cats/cats.service';

@Injectable()
export class DogsService {
  constructor(private readonly catsService: CatsService) {}

  // 之后即可通过 this.catsService.xxx() 调用
}
```

## 4. 为什么能「绕过」AppModule

Nest 的依赖解析基于模块图：

- `DogsModule` 导入了 `CatsModule`；
- `CatsModule` 导出了 `CatsService`；

IoC 容器就会把同一个 `CatsService` 实例注入给 `DogsService`。`AppModule` 只需要在 `imports` 中挂上这两个模块，完全不参与 Service 的共享逻辑。

```ts
// src/app.module.ts（无需为共享做额外配置）
@Module({
  imports: [CatsModule, DogsModule], // 仅挂载
})
export class AppModule {}
```

## 5. 设计层面的提醒

让 `DogsService` 直接依赖 `CatsService` 会造成两个**业务模块强耦合**。如果只是为了复用某些通用逻辑，更推荐的做法是：

1. 把公共逻辑抽离到一个独立的 `SharedModule`（或领域公共模块）；
2. 在 `SharedModule` 中 `providers` 并 `exports` 公共 Service；
3. `CatsModule` 和 `DogsModule` 分别 `imports: [SharedModule]`。

这样业务模块之间保持解耦，依赖关系更清晰、更易维护。

## 6. 小结

- 模块间共享 Service = **「导出 Service 的模块」+「导入该模块的模块」**；
- 忘记 `exports` 是最高频的错误；
- 模块间共享与 `AppModule` 无关，它是纯模块图的解析结果；
- 业务模块之间避免过度直接耦合，优先抽取公共模块。

## 7. 进阶：@Global 全局模块

如果一个 Service 被**几乎所有模块**共用（如 `ConfigService`、`DatabaseService`、`LoggerService`），每次都 `imports` 会很啰嗦。此时可用 `@Global()` 装饰器把它声明为**全局模块**，只需在根模块导入一次，其余模块无需再 `imports` 即可直接使用其导出的 Service。

```ts
// shared.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigService } from './config.service';

@Global()                 // 关键：声明为全局模块
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class SharedModule {}
```

```ts
// app.module.ts（只需在此导入一次）
@Module({ imports: [SharedModule] })
export class AppModule {}
```

```ts
// 任意其他模块，无需 imports: [SharedModule] 即可注入
@Injectable()
export class CatsService {
  constructor(private readonly config: ConfigService) {}
}
```

> 注意：`@Global()` 只能用于**根模块或只导入一次**的模块，滥用会让依赖关系变得不透明，一般只给真正「基础设施级」的 Service 使用。

## 8. 进阶：循环依赖与 forwardRef

当两个模块互相 `imports` 对方（A 依赖 B 的 Service，B 又依赖 A 的 Service），会出现**循环依赖**，Nest 会报 `Nest can't resolve dependencies` 之类的错误。

解决方式：用 `forwardRef()` 包裹互相引用的模块（或 provider）。

```ts
// cats.module.ts
@Module({
  imports: [forwardRef(() => DogsModule)], // 延迟引用，打破循环
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

```ts
// dogs.module.ts
@Module({
  imports: [forwardRef(() => CatsModule)],
  providers: [DogsService],
  exports: [DogsService],
})
export class DogsModule {}
```

> `forwardRef` 同样适用于 `providers`、`inject` 数组等需要延迟解析的场合。循环依赖通常意味着设计可以再分层，能用「抽取公共模块」解决的，优先不要循环引用。

## 9. 小结补充

- `@Global()` 解决「到处都要 import」的冗余，谨慎用于基础设施级 Service；
- 循环依赖用 `forwardRef()` 打破，但优先考虑重构/抽取公共模块；
- 模块图解析的本质：Nest 通过 `imports` + `exports` 构建依赖图，DI 容器据此注入。
