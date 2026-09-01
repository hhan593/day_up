# NestJS 混合应用（Hybrid Application）

> 来源：[NestJS 中文文档 · 微服务](https://docs.nestjs.cn/microservices)（混合应用目录项）、[微服务 > Redis](https://docs.nestjs.cn/microservices/redis)（connectMicroservice 线索）
> 混合应用 = 同一进程**同时**暴露 HTTP 端口和微服务传输——既能对外 REST，又能对内 RPC。

---

## 一、为什么需要混合应用？（通俗对比）

单体微服务架构里，一个服务要么纯 HTTP、要么纯微服务。但实际中常想"**对外 REST、对内用微服务协议**"——比如订单服务对外给前端 REST，对内用 Kafka 收支付事件。混合应用让一个进程同时跑两种口子，省资源。

**对比**：
- **单独部署两个进程**：HTTP 一个、微服务一个——隔离好但成本高、跨进程多一跳。
- **混合应用**：一个进程两个口子——共享内存、共享 DI 容器，调用本地方法即可（无需网络）。

---

## 二、核心：`connectMicroservice()`

不是 `createMicroservice`，而是在已有的 **HTTP 应用**上 `connectMicroservice` 挂一个微服务传输：

```ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule);   // 普通 HTTP 应用

// 挂一个 TCP 微服务传输
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.TCP,
  options: { host: 'localhost', port: 8888 },
});

// 可挂多个（不同传输层）
app.connectMicroservice<MicroserviceOptions>({
  transport: Transport.REDIS,
  options: { host: 'localhost', port: 6379 },
});

// 先起 HTTP，再起所有微服务传输
await app.startAllMicroservices();   // 关键：启动已连接的微服务
await app.listen(3000);              // HTTP 端口
```

> ⚠️ 必须 `app.startAllMicroservices()` 才能让挂上的微服务开始监听；`listen(3000)` 是 HTTP。

---

## 三、服务端状态/错误监听

```ts
const microservice = app.connectMicroservice<MicroserviceOptions>({ /* ... */ });

microservice.status.subscribe({       // 监听连接状态
  next: (status) => console.log(status),
});
microservice.on('error', (err) => console.error(err));
```

- `microservice.unwrap()`：取底层驱动实例（如 Redis 的 `[pub, sub]`）。
- `microservice.close()`：关闭单个微服务传输。

---

## 四、客户端调用混合服务

HTTP 模块里用 `ClientsModule.register` 注册微服务客户端（见 `overview.md`），在 Controller/Service 里 `send/emit` 调内部微服务——**同进程内调用仍是走传输层**（不是直接方法调用），保证与拆成多进程时行为一致。

---

## 五、⚠️ 全局过滤器的坑

文档明确：**混合应用下，全局微服务异常过滤器默认未启用**。若要微服务层统一错误处理，需：
- 在 `connectMicroservice({ exceptionFilters: [...] })` 显式传，或
- 用 `app.useGlobalFilters()`（注意 DI 支持）。

详见 `exception-filters.md`。

---

## 六、与生命周期衔接

`startAllMicroservices` 在 `onApplicationBootstrap` 之后、`listen` 之前；关闭时 `enableShutdownHooks()` 触发的销毁钩子对混合传输同样生效（见 `../01-fundamentals/lifecycle-events.md`）。

---

## 七、坑 & 最佳实践

1. **忘了 `startAllMicroservices`**：微服务口子不监听，发消息 timeout。
2. **端口冲突**：HTTP 3000、微服务 TCP 8888 要分开。
3. **多传输器**：可挂多个 `connectMicroservice`（如 TCP + Redis + Kafka 并存）。
4. **拆分的边界**：混合应用适合"一个服务既对外又对内"；若服务间完全独立，还是拆进程更隔离。

---

## 八、一句话总结

> 混合应用 = `create`（HTTP）+ `connectMicroservice`（挂传输）+ `startAllMicroservices()` + `listen`（HTTP）；一个进程同时有 REST 口子和微服务口子；全局微服务异常过滤器默认关，需显式挂。
