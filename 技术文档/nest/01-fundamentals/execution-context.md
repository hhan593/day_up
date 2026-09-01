# NestJS ExecutionContext 与 ApplicationContext

> 来源：[NestJS 中文文档 · Execution Context](https://docs.nestjs.cn/fundamentals/execution-context)
> `ExecutionContext` 让守卫/拦截器/过滤器能感知"当前在执行业务的哪个控制器/方法"，并跨 HTTP/WS/RPC 切换。

---

## 一、ExecutionContext 是什么？

守卫、拦截器、异常过滤器的方法都收到 `ExecutionContext`。它是 `ArgumentsHost` 的子类，在"请求参数"之上，还能拿到**路由处理器信息**。

```
ArgumentsHost（取 req/res 等参数）
   └─ ExecutionContext（再 + getClass/getHandler/switchToX）
```

对比：
- **中间件**：只有 `req/res/next`，**不知道**接下来执行哪个处理器（这是它比守卫弱的原因）。
- **守卫/拦截器**：通过 `ExecutionContext` 拿到 `getHandler()`（方法）、`getClass()`（控制器类），配合 `Reflector` 读 `@Roles` 等元数据。

---

## 二、核心 API

```ts
interface ExecutionContext extends ArgumentsHost {
  getClass<T>(): Type<T>;                 // 控制器类
  getHandler(): Method;                   // 路由处理方法（处理器）
}

interface ArgumentsHost {
  getArgs<T>(): T[];                      // 全部参数
  getArgByIndex(i): any;
  switchToHttp(): HttpArgumentsHost;
  switchToRpc(): RpcArgumentsHost;
  switchToWs(): WsArgumentsHost;
}
```

---

## 三、跨平台切换

```ts
// HTTP
const ctx = host.switchToHttp();
const req = ctx.getRequest();
const res = ctx.getResponse();

// WebSocket（基于 socket.io）
const ctx = host.switchToWs();
const client = ctx.getClient();
const data = ctx.getData();
const pattern = ctx.getPattern();  // 订阅的消息模式

// 微服务（基于 TCP/NATS）
const ctx = host.switchToRpc();
const data = ctx.getData();
const ctx2 = ctx.getContext();
```

> 这让同一套守卫/拦截器/过滤器**无需改代码**即可用于 HTTP、WS、微服务——平台无关性。

---

## 四、实战：在守卫里读元数据

```ts
canActivate(context: ExecutionContext): boolean {
  const handler = context.getHandler();        // 方法
  const controller = context.getClass();        // 类
  const roles = this.reflector.getAllAndOverride<string[]>('roles', [
    handler, controller,                         // 方法优先，其次类
  ]);
  return roles ? matchRoles(roles, context.switchToHttp().getRequest().user?.roles) : true;
}
```

---

## 五、Application Context（无 HTTP 应用）

有时只要 IoC 容器、不要 HTTP 服务器（CLI、Cron worker），用 `NestFactory.createApplicationContext()`：

```ts
const app = await NestFactory.createApplicationContext(AppModule);
const tasksService = app.get(TasksService);
await tasksService.run();
```
> 适合 `../02-techniques/task-scheduling.md` 的纯命令行定时任务。

---

## 六、与类型体操衔接

- `ExecutionContext` 与 `ArgumentsHost` 返回 `any` 偏多；生产里用 `instanceof` 或 `switchToHttp()` 收窄（对应 `typescript-advanced-type-system.md` 的"判别联合收窄"思路）。

---

## 七、一句话总结

> `ExecutionContext` 让守卫/拦截器/过滤器"既取请求参数（ArgumentsHost），又知路由处理器（getClass/getHandler）"；`switchToHttp/Ws/Rpc` 实现跨平台；`createApplicationContext` 用于无 HTTP 容器场景。
