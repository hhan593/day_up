# RxJS 核心概念与 API 详解（结合 NestJS 实战）

> RxJS（Reactive Extensions for JavaScript）是一个基于 **Observable（可观察对象）** 的
> **响应式编程**库。它用「流（stream）」的方式处理异步与事件序列。
> 在 NestJS 中，拦截器（`NestInterceptor`）、守卫返回值、HTTP 响应等都是 **Observable 流**，
> 因此理解 RxJS 是掌握 Nest 异步处理的关键。

---

## 目录

1. 为什么需要 RxJS
2. 四大核心概念
3. Observable 的生命周期（next / error / complete）
4. 创建类操作符（creation）
5. 管道类操作符（pipeable operators）总览
6. 操作符分类详解
   - 转化类（Transformation）
   - 过滤类（Filtering）
   - 合并类（Combination）
   - 错误处理类（Error Handling）
   - 工具/ Side-effect 类
7. Subject 家族
8. 调度器（Scheduler）
9. 拦截器（Interceptor）核心知识点
10. 与 NestJS 拦截器实战结合
11. 常见问题与陷阱
12. 速查表

---

## 1. 为什么需要 RxJS

传统异步有三种形态：回调、Promise、async/await。但它们都只能表示「**单个未来值**」。

而现实中有大量「**多个未来值随时间到来**」的场景：
- 鼠标点击事件流、WebSocket 消息流、HTTP 轮询、定时器序列……
- 需要对这些流做「过滤、合并、转换、限流、重试」等组合操作。

RxJS 用 **Observable** 统一抽象「随时间发出 0 到 N 个值的异步序列」，并提供上百个
**操作符（operator）** 像管道一样组合它们——这就是它的价值。

> 一句话：**Promise 是「一个未来值」，Observable 是「一串未来值」。**

---

## 2. 四大核心概念

| 概念 | 角色 | 类比 |
| --- | --- | --- |
| **Observable** | 数据的「生产者 / 流」 | 一个会随时间推送值的管道 |
| **Observer** | 数据的「消费者 / 订阅者」 | 监听管道的另一头 |
| **Subscription** | 「订阅关系」 | 调音量 knob，可随时 `unsubscribe()` 关掉 |
| **Operator** | 「管道中的加工工序」 | `.pipe(map(...), filter(...))` |

### 最小示例
```ts
import { Observable } from 'rxjs';

const source$ = new Observable<number>((subscriber) => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.complete();
});

source$.subscribe({
  next: (v) => console.log('收到', v),
  error: (e) => console.error('出错', e),
  complete: () => console.log('完成'),
});
```
输出：`收到 1` → `收到 2` → `完成`。

---

## 3. Observable 的生命周期

一个 Observable 会向 Observer 推送三种通知：

| 通知 | 含义 | 之后还能发吗 |
| --- | --- | --- |
| `next(value)` | 推送一个值 | 可继续推送 |
| `error(err)` | 出错 | **终止，后面不再有 next/complete** |
| `complete()` | 正常完成 | **终止，后面不再有 next** |

> 关键：**error 和 complete 都是「终结态」**，二者互斥，流一旦终结就被销毁。

### 冷 Observable vs 热 Observable
- **冷（cold）**：每个订阅者都重新执行一次生产逻辑（如 `of(1,2,3)`、HTTP 请求）。
- **热（hot）**：生产逻辑独立运行，多个订阅者共享同一份推送（如 `Subject`、DOM 事件）。

---

## 4. 创建类操作符（creation）

用来「凭空」造出 Observable：

| API | 作用 | 示例 |
| --- | --- | --- |
| `of(...values)` | 依次同步发出给定值，然后 complete | `of(1, 2, 3)` |
| `from(iterable/Promise)` | 把数组 / Promise / Iterable 转成 Observable | `from([1,2,3])`、`from(fetch(url))` |
| `fromEvent(target, evt)` | 把 DOM / EventEmitter 事件转成流 | `fromEvent(btn, 'click')` |
| `interval(ms)` | 每隔 ms 发出递增整数（永不完结） | `interval(1000)` |
| `timer(delay, period?)` | 延迟后开始；有 period 则周期发 | `timer(2000, 1000)` |
| `range(start, count)` | 发出一段连续整数 | `range(10, 5)` |
| `throwError(err)` | 立即发出 error（用于错误处理链） | `throwError(() => new Error('x'))` |
| `EMPTY` | 立即 complete 的空流 | `return EMPTY` |
| `NEVER` | 永不发出也不完结 | 用于「挂起」 |
| `iif(() => cond, a$, b$)` | 按条件选择两条流之一 | 动态分流 |

### 示例：把 Promise 转流
```ts
import { from } from 'rxjs';

from(fetch('https://api.example.com/dogs')).subscribe((res) => {
  console.log(res.status);
});
```

---

## 5. 管道类操作符（pipeable operators）

RxJS 6+ 推荐 **点-free** 写法：所有操作符先 `import`，再用 `.pipe(op1(), op2())` 串起来：
```ts
import { map, filter, catchError } from 'rxjs';

source$.pipe(
  filter((x) => x % 2 === 0),
  map((x) => x * 10),
).subscribe(console.log);
```
`.pipe()` 返回一个新的 Observable，**不修改原流**，可任意组合、复用。

---

## 6. 操作符分类详解

### 6.1 转化类（Transformation）

| 操作符 | 作用 |
| --- | --- |
| `map(fn)` | 每个值映射成新值（最常用） |
| `mapTo(v)` | 全部映射成固定值 |
| `pluck('a','b')` | 取出嵌套属性（已弃用倾向用 `map`） |
| `scan(fn, seed)` | 类似 `reduce`（数组）但**每个累加步骤都发出** |
| `mergeMap(fn)` | 把每个值转成内部 Observable，**并行**订阅合并 |
| `switchMap(fn)` | 新值到来时**取消**上一个内部订阅，只保留最新（常用于搜索防抖/路由切换） |
| `concatMap(fn)` | 严格**顺序**执行内部 Observable，前一个完才下一个 |
| `exhaustMap(fn)` | 上一个未完成时**忽略**新值（防重复提交） |

> 🔑 **mergeMap / switchMap / concatMap / exhaustMap** 统称「高阶映射」，是 RxJS 最难也最强大的一部分。选择口诀：
> - 要并发 → `mergeMap`
> - 只关心最新 → `switchMap`
> - 要保序 → `concatMap`
> - 要防抖/忽略期间 → `exhaustMap`

### 6.2 过滤类（Filtering）

| 操作符 | 作用 |
| --- | --- |
| `filter(fn)` | 只放行满足条件的值 |
| `take(n)` | 取前 n 个后自动 complete |
| `takeUntil(notifier$)` | 收到 notifier 发出值时**取消**当前流（组件卸载防内存泄漏常用） |
| `skip(n)` / `takeLast(n)` | 跳过前 n / 取最后 n |
| `distinctUntilChanged()` | 与上一个值相同则忽略（去抖基础） |
| `debounceTime(ms)` | 静默 ms 后才发出（搜索框防抖） |
| `throttleTime(ms)` | 每 ms 最多发一次（限流） |
| `first()` / `last()` | 取首个 / 末个 |

### 6.3 合并类（Combination）

| 操作符 | 作用 |
| --- | --- |
| `merge(a$, b$)` | 多条流**按到达顺序**合并（并发） |
| `concat(a$, b$)` | 按顺序拼接（a 完才 b） |
| `combineLatest([a$, b$])` | 任一更新就发出「最新值数组」 |
| `forkJoin([a$, b$])` | **全部 complete** 后发出「最终结果数组」（类似 Promise.all） |
| `zip(a$, b$)` | 按下标一一配对发出 |
| `withLatestFrom(a$)` | 主流触发时，附带取 a$ 最新值 |

### 6.4 错误处理类（Error Handling）

| 操作符 | 作用 |
| --- | --- |
| `catchError((err, caught$) => ...)` | 捕获错误，返回**替代流**或重新抛出 |
| `retry(n)` | 出错后重试 n 次 |
| `retryWhen(fn)` | 自定义重试策略（已逐步被 `retry({delay})` 取代） |
| `finalize(fn)` | 无论成功/失败/取消，**流终结时**都执行（清理资源） |

```ts
source$.pipe(
  retry(3),                                  // 最多重试 3 次
  catchError((err) => of('fallback')),       // 失败返回兜底值
  finalize(() => console.log('清理')),
);
```

### 6.5 工具 / Side-effect 类

| 操作符 | 作用 |
| --- | --- |
| `tap(fn)` | **不改变值**，仅做副作用（日志、打点、调试）；本项目拦截器用它 |
| `delay(ms)` | 延迟每个值 ms |
| `timeout(ms)` | ms 内没发出值则抛超时错误 |
| `toPromise()` | 转回 Promise（取最后一个值） |
| `observeOn(scheduler)` / `subscribeOn(scheduler)` | 切换执行上下文（见调度器） |

---

## 7. Subject 家族

`Subject` 既是 Observable（可被订阅）又是 Observer（可手动 `next`），用于「多播」。

| 类型 | 特点 |
| --- | --- |
| `Subject` | 普通多播；订阅后才收得到后续值 |
| `BehaviorSubject` | 持有「当前值」，新订阅者立即拿到最新值（适合状态） |
| `ReplaySubject` | 缓存最近 N 个值，新订阅者重放 |
| `AsyncSubject` | 只在 complete 时发出「最后一个值」 |

```ts
import { BehaviorSubject } from 'rxjs';
const state$ = new BehaviorSubject(0); // 初始值 0
state$.subscribe((v) => console.log(v)); // 立即输出 0
state$.next(1);                          // 输出 1
```

---

## 8. 调度器（Scheduler）

调度器决定「**何时、何地**」执行（同步 / 微任务 / 宏任务 / 动画帧 / 虚拟时间）：

| Scheduler | 行为 |
| --- | --- |
| `asyncScheduler` | `setInterval`/`setTimeout` 风格（异步） |
| `asapScheduler` | 微任务（类似 Promise.then） |
| `queueScheduler` | 同步队列 |
| `animationFrameScheduler` | `requestAnimationFrame` |

常见用法：`interval(1000, animationFrameScheduler)`、`observeOn(asyncScheduler)`。
测试中可用 `TestScheduler` 做「虚拟时间」确定性测试。

---

## 9. 拦截器（Interceptor）核心知识点

> 拦截器是 NestJS 的 **AOP 切面组件**之一，而它的实现完全建立在 RxJS 之上——
> 拦截器的 `intercept()` 返回值**必须是 Observable**。理解拦截器，就是理解「如何在一条响应流上做文章」。

### 9.1 拦截器是什么

拦截器用来**在路由处理函数执行「之前」和「之后」**对请求/响应做横切处理。它既能：
- **前置**：修改/记录入参、鉴权增强、缓存命中短路；
- **后置**：改写响应体、统一包装、统计耗时、记录日志。

这正是 RxJS 的用武之地：`intercept()` 拿到的 `next.handle()` 是一个 Observable（控制器响应流），
你可以在 `.pipe(...)` 里用 operator 加工这条流。

### 9.2 在请求生命周期中的位置

```
中间件 → 守卫 → 【拦截器 前置】→ 管道 → 控制器 → 【拦截器 后置】→ 过滤器(异常时) → 响应
```

拦截器夹在「守卫之后、管道之前」的前置点，以及「控制器之后」的后置点，是唯一能同时触达
「入参」与「响应」的切面。

### 9.3 接口与 RxJS 的关系（核心）

```ts
interface NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
```

- `next.handle()` 返回一个 `Observable<any>`——它代表「下游（管道→控制器）最终产出的响应流」。
- **只有下游被订阅时，控制器才会真正执行**（懒执行）；Nest 框架负责订阅这条流。
- 你在 `.pipe(...)` 中加的 operator，就是在「控制器返回值」这个流上做变换。

### 9.4 两种写法

**① 类式（推荐，可注入依赖、可复用）**
```ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`耗时 ${Date.now() - now}ms`)),
    );
  }
}
```

**② 函数式（无状态、轻量，但不能注入依赖）**
```ts
export function loggingFnInterceptor(): NestInterceptor {
  return {
    intercept(context, next) {
      return next.handle().pipe(tap(() => console.log('done')));
    },
  };
}
```

### 9.5 注册方式

| 方式 | 作用域 | 是否能 DI |
| --- | --- | --- |
| `@UseInterceptors(LoggingInterceptor)` | 控制器/路由/参数级 | 类式可 |
| `app.useGlobalInterceptors(new LoggingInterceptor())` | 全局 | 手动 new，依赖需自行传入 |
| `APP_INTERCEPTOR` + `useClass`（推荐全局） | 全局且走 DI 容器 | ✅ 可注入 |

```ts
// app.module.ts
providers: [
  { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
]
```

> 与过滤器同理：**全局拦截器优先用 `APP_INTERCEPTOR` + `useClass`（传类）**，框架才能注入依赖。

### 9.6 典型应用场景

- **统一响应包装**：`map(data => ({ code:0, message:'ok', data }))`
- **耗时/日志监控**：`tap`（如本项目 `LoggingInterceptor`）
- **异常处理转换**：`catchError` 转统一错误格式
- **超时控制**：`timeout(5000)`
- **缓存**：`tap` 写入缓存，下次命中直接 `return of(cached)`（前置短路）
- **数据脱敏/字段裁剪**：`map` 后置改写

### 9.7 与本项目对照

你的 `src/interceptor/logging.interceptor.ts` 是教科书级示例：
- `@Injectable()` + 实现 `NestInterceptor`；
- 前置：`console.log('Before...')` 记开始时间；
- `next.handle().pipe(tap(...))`：在响应流产生后打印耗时，**用 `tap` 而非 `map`**（因为只做日志、不改响应）；
- 拦截器类本身也能通过 `constructor` 注入 `LoggerService` 等依赖（见文件末尾注释）。

> 排错提示：若拦截器「不生效」，先确认是否已注册（`@UseInterceptors` 或 `APP_INTERCEPTOR`）；
> 若想改响应内容却没变化，检查是否误用 `tap`（不改值）而非 `map`（改值）。

---

## 10. 与 NestJS 拦截器实战结合

你的 `src/interceptor/logging.interceptor.ts` 就是标准 RxJS 用法：

```ts
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const now = Date.now();
  return next.handle().pipe(
    tap(() => console.log(`After...${Date.now() - now}ms`)),
  );
}
```

- `next.handle()` 返回的是**控制器响应流**（Observable）。
- `tap` 是「**不改值只做副作用**」的操作符——所以日志拦截器用 `tap` 而非 `map`。

### 更多拦截器常用操作符

**① 统一响应包装（map）**
```ts
return next.handle().pipe(
  map((data) => ({ code: 0, message: 'ok', data })),
);
```

**② 异常转统一格式（catchError）**
```ts
return next.handle().pipe(
  catchError((err) => {
    // 返回兜底流，避免异常直接冒泡到框架默认处理器
    return of({ code: 1, message: err.message });
  }),
);
```

**③ 超时控制（timeout）**
```ts
return next.handle().pipe(
  timeout(5000), // 5 秒内没响应则抛 TimeoutError
  catchError((e) => throwError(() => new RequestTimeoutException())),
);
```

**④ 缓存（在拦截器层缓存 GET 结果）**
```ts
const cache = new Map<string, any>();
return next.handle().pipe(
  tap((data) => cache.set(key, data)),
);
```

> 在 Nest 中还有一个关键点：`next.handle()` 是「懒执行」的——只有订阅（下游 `subscribe`）时才真正调用控制器。拦截器返回的 Observable 由框架订阅，所以 `timeout`/`catchError` 等都会生效。

---

## 11. 常见问题与陷阱

1. **忘记订阅**：Observable 是「惰性的」，**不订阅就不会执行**（包括 HTTP 请求都不会发）。Nest 框架会替你订阅拦截器返回的流，但你手动 `new Observable` 调试时容易踩坑。
2. **内存泄漏**：`interval`/`fromEvent` 永不自动完结，组件销毁时要 `subscription.unsubscribe()`，或用 `takeUntil(onDestroy$)`。
3. **`tap` 当 `map` 用**：`tap` 不改值，想改响应必须用 `map`。
4. **操作符顺序敏感**：`filter` 放在 `map` 前面能少算；`debounceTime` 一般配合 `distinctUntilChanged` 使用。
5. **高阶映射选错**：搜索联想用 `switchMap`（新输入取消旧请求）；表单顺序提交用 `concatMap`；防重复点击用 `exhaustMap`。
6. **冷流重复执行**：同一个 `of(fetch())` 被多个订阅会发两次请求；要共享用 `share()` 或 `shareReplay()`（或改用 `Subject`）。

---

## 12. 速查表

| 我想做什么 | 用哪个 |
| --- | --- |
| 同步发几个值 | `of(1,2,3)` |
| 数组/Promise 转流 | `from(x)` |
| 定时重复 | `interval` / `timer` |
| 事件转流 | `fromEvent` |
| 改值 | `map` |
| 只看符合条件的值 | `filter` |
| 防抖 | `debounceTime` |
| 限流 | `throttleTime` |
| 只取前 N | `take` |
| 组件销毁取消 | `takeUntil` |
| 并发请求合并 | `mergeMap` / `forkJoin` |
| 只保留最新（搜索） | `switchMap` |
| 顺序执行 | `concatMap` |
| 忽略期间重复 | `exhaustMap` |
| 做日志/打点不改值 | `tap` |
| 捕获错误给兜底 | `catchError` |
| 失败重试 | `retry` |
| 超时 | `timeout` |
| 统一包装响应 | `map` + 拦截器 |
| 多播/状态共享 | `Subject` / `BehaviorSubject` |

---

## 一句话总结

> RxJS 用 **Observable 流 + 上百个可组合的 operator** 统一管理「随时间到达的多个异步值」。
> 掌握 `map`/`filter`/`tap`/`switchMap`/`catchError` 这几把「瑞士军刀」，
> 再理解「冷/热」「懒订阅」「终结态」三个心智模型，就能在 NestJS 拦截器、守卫、
> WebSocket 等场景中游刃有余。
