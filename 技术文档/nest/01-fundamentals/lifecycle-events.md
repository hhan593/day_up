# NestJS 生命周期事件（Lifecycle Events）

> 来源：[NestJS 中文文档 · 生命周期事件](https://docs.nestjs.cn/fundamentals/lifecycle-events)
> 应用启动/关闭时执行初始化与清理逻辑的标准钩子。

---

## 一、为什么需要？（通俗对比）

像"工厂开工/停工流程"：开工前通电检查机器（初始化），停工前先关阀门清仓（清理）。对应应用启动连库、关闭释放连接。

**对比其他框架**：
- **Spring**：`@PostConstruct` / `@PreDestroy` / `DisposableBean` / `SmartLifecycle`——Nest 的 `OnModuleInit`/`OnApplicationShutdown` 几乎对应。
- **Express 原生**：无标准钩子，自己写了 `app.listen` 之后跑初始化——Nest 把这套标准化。
- **Angular**：`ngOnInit` 思路一致（组件初始化钩子）。

---

## 二、五个钩子

| 钩子方法 | 接口 | 触发时机 |
|---|---|---|
| `onModuleInit()` | `OnModuleInit` | 宿主模块依赖解析完成 |
| `onApplicationBootstrap()` | `OnApplicationBootstrap` | 所有模块初始化完、未监听连接前 |
| `onModuleDestroy()` | `OnModuleDestroy` | 收到终止信号（如 SIGTERM）后 |
| `beforeApplicationShutdown(signal)` | `BeforeApplicationShutdown` | 所有 `onModuleDestroy` 完成后、关连接前 |
| `onApplicationShutdown(signal)` | `OnApplicationShutdown` | 连接关闭后（`app.close()` 解析完） |

> ⚠️ 生命周期钩子**不会在请求作用域类**中触发（见 `injection-scopes.md`）。
> 初始化钩子顺序取决于模块导入顺序，且会**等待前一个完成**（可 `async`）。

---

## 三、代码示例

```ts
import { Injectable, OnModuleInit, OnApplicationBootstrap,
         OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit, OnApplicationBootstrap,
    OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown {

  onModuleInit() {
    console.log('模块依赖已解析');
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.fetchFromRemote();   // 可异步延迟初始化
  }

  onModuleDestroy() {
    console.log('收到终止信号，清理前置');
  }

  beforeApplicationShutdown(signal: string) {
    console.log(`信号 ${signal}：关连接前`);  // 'SIGTERM' / 'SIGINT'
  }

  onApplicationShutdown(signal: string) {
    console.log(`信号 ${signal}：连接已关`);
  }
}
```

钩子可用于控制器、提供者、模块。实现接口仅为编译期强类型（编译后不存在）。

---

## 四、启用关机钩子

销毁类钩子（带 `Destroy/Shutdown`）**默认禁用**，须在 `main.ts` 启用：

```ts
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();   // 关键：让 SIGTERM/SIGINT 触发销毁钩子
await app.listen(3000);
```

注意事项：
- `app.close()` 只触发钩子、**不终止 Node 进程**。
- Windows 下 `SIGTERM` 不生效（用 `SIGINT`/Ctrl+C）。
- 同进程多 Nest 实例会因监听器过多告警——避免。

---

## 五、async/await 顺序

`OnModuleInit` / `OnApplicationBootstrap` 可返回 `Promise`，Nest 会 `await`，挂起后续初始化直到完成——适合"连数据库/拉配置"后再放行启动。

---

## 六、`onModuleInit` vs `constructor`

- `constructor`：仅依赖注入完成，依赖的**方法可能未就绪**。
- `onModuleInit`：模块全部依赖解析完，依赖可安全调用——连库、预热缓存放这里。

---

## 七、一句话总结

> 生命周期钩子：`onModuleInit`（依赖解析完）→ `onApplicationBootstrap`（启动前）→ 运行 → `onModuleDestroy`/`beforeApplicationShutdown`/`onApplicationShutdown`（收信号后清理）；销毁类需 `app.enableShutdownHooks()`；可 `async`。
