# NestJS 注入作用域（Injection Scopes）

> 来源：[NestJS 中文文档 · 注入作用域](https://docs.nestjs.cn/fundamentals/provider-scopes/)
> 作用域决定提供者"实例多久重建一次"。默认单例，特殊场景用请求/瞬态。

---

## 一、为什么有作用域？（通俗对比）

单例像"公司公用饮水机"（一个，大家共享）；请求作用域像"每位访客一杯一次性纸杯"（每请求一只）；瞬态像"每人领专属新杯子"（每次注入都新）。

**对比其他框架**：
- **Spring**：默认单例（`@Scope("singleton")`），另有 `request`/`prototype` 作用域——与 Nest 的 DEFAULT/REQUEST/TRANSIENT 一一对应。
- **Angular**：`providedIn: 'root'`（单例）/ `platform`/`any` ——Nest 借鉴定 Angular 的层级作用域思路。
- 关键差异：Nest 默认**单例且共享**，`REQUEST` 作用域会在每个请求重建 DI 子树（性能有成本）。

---

## 二、三种作用域

用 `@Injectable({ scope })` 或自定义提供者长表单 `scope` 字段指定（枚举来自 `@nestjs/common`）。

| 作用域 | 说明 | 生命周期 |
|---|---|---|
| `Scope.DEFAULT` | 单例（默认，无需声明） | 应用启动实例化一次，全应用共享 |
| `Scope.REQUEST` | 请求作用域 | 每个请求新建实例，结束回收 |
| `Scope.TRANSIENT` | 瞬态 | 每次注入都获专属新实例，不共享 |

```ts
@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

---

## 三、控制器作用域

控制器也能声明作用域，适用于其下所有处理器：

```ts
@Controller({ path: 'cats', scope: Scope.REQUEST })
export class CatsController {}
```

---

## 四、作用域冒泡规则

- **REQUEST 向上冒泡**：`Controller ← Service(REQUEST) ← Repo`，则 Controller 自动变 REQUEST；无依赖的 Repo 仍单例。
- **TRANSIENT 不冒泡**：单例 `DogsService` 注入瞬态 `LoggerService` 获新实例，但 `DogsService` 仍是单例；要它也瞬态须显式标。

---

## 五、请求级令牌

| 令牌 | 来源 | 用途 |
|---|---|---|
| `REQUEST` | `@nestjs/core` | HTTP 注入原始 `req`（Express/Fastify） |
| `CONTEXT` | `@nestjs/graphql` | GraphQL 注入上下文（替代 REQUEST） |
| `INQUIRER` | `@nestjs/core` | 注入"构造本提供者的父类"（日志/指标用） |

```ts
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  constructor(@Inject(INQUIRER) private parent: object) {}
}
```

> `REQUEST` 本身是请求作用域——依赖它的提供者自动变请求作用域且不可改。

---

## 六、持久提供者（Durable + ContextId）

多租户场景：每请求重建 DI 子树太贵。把"同一租户 ID 的请求"聚合复用同一子树：

```ts
// main.ts 注册策略
const tenants = new Map<string, ContextId>();
ContextIdFactory.apply({
  attach(contextId, request) {
    const tenantId = request.headers['x-tenant-id'];
    let subId = tenants.get(tenantId) ?? ContextIdFactory.create();
    tenants.set(tenantId, subId);
    return (info) => info.isTreeDurable ? subId : contextId;
  },
});

// 标记持久
@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
```

- 持久性向上冒泡；不适合海量租户。
- 文档原文特指"多租户聚合"进阶用法，普通业务用不到，了解即可。

---

## 七、性能影响

- 请求作用域每请求建实例，拖慢响应（正确设计延迟增量 **< 5%**）。
- **非必要坚持单例**。
- **必须单例**的场景：WebSocket 网关、Passport 策略、Cron 控制器——不可用请求作用域。

---

## 八、适用场景表

| 场景 | 推荐 | 示例 |
|---|---|---|
| 普通服务/连接池 | DEFAULT | 无声明 |
| 每请求缓存/追踪/多租户 | REQUEST | `@Injectable({ scope: REQUEST })` |
| 独立日志/指标 | TRANSIENT | `@Injectable({ scope: TRANSIENT })` |
| 多租户(租户少) | REQUEST+durable | 持久提供者 |
| 控制器隔离 | 控制器 scope | `@Controller({ scope: REQUEST })` |

---

## 九、与循环依赖衔接

请求作用域实例在构造期不可用 `moduleRef.get`（根容器无此实例），要用 `moduleRef.resolve()`（见 `circular-dependency.md`）。

---

## 十、一句话总结

> 作用域 = 实例生命周期：DEFAULT 单例（默认）、REQUEST 每请求新建（冒泡）、TRANSIENT 每次注入新建（不冒泡）；请求级用 `REQUEST`/`CONTEXT` 令牌；非必要别用 REQUEST（性能成本）。
