# NestJS 端到端测试（E2E Testing）

> 来源：[NestJS 中文文档](https://nestjs.bootcss.com/fundamentals/unit-testing)（备注提及"开箱集成 Jest 与 Supertest，E2E 在更聚合层面覆盖类与模块交互"）+ 官方 E2E 标准实践补充（⚠️ 标注）
> E2E 测"整条链路"——启动真实(或近似)应用,通过 HTTP 发请求,验证响应。像"整车路试"。

---

## 一、E2E 是什么？（通俗对比）

单元测试测"零件",E2E 测"整车跑起来后,踩油门车真的走"——从 HTTP 入口到 controller→service→DB mock→响应,全链路验证。

**对比其他框架**：
- **Spring `@SpringBootTest` + MockMvc**：启动 Spring 上下文发请求;Nest 的 E2E 用 `NestFactory.create` + `supertest` 发 HTTP 请求,等价。
- **Supertest 原生(Express)**：`request(app).get('/cats')`——Nest E2E 直接复用 supertest,只是 `app` 是 Nest 实例包出来的 HTTP server。
- 文档原文："与聚焦控制单个模块和类的单元测试不同,E2E 在更聚合的层面覆盖了类和模块的交互——和生产环境下终端用户类似。"

---

## 二、安装

```bash
npm i --save-dev supertest @types/supertest
```
> `nest new` 默认已生成 `test/**/*.e2e-spec.ts` 与 supertest 依赖。

---

## 三、标准样板（init）

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],          // 导入整个 AppModule（整条链路）
    }).compile();

    app = moduleFixture.createNestApplication();   // 创建真实应用实例
    await app.init();                               // 初始化（等价于 listen 前）
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())   // supertest 拿 HTTP server
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterAll(async () => {
    await app.close();                  // 关应用，释放资源
  });
});
```

关键点：
- `imports: [AppModule]`：导入**整个应用**,测全链路(与单元测试只选 controllers/providers 不同)。
- `createNestApplication()`：造真实 `INestApplication`(还没真的监听端口)。
- `app.init()`：初始化(等价于 `listen` 之前做的事;E2E 不真正监听端口,用 `getHttpServer()` 给 supertest)。
- `app.getHttpServer()`：把 Nest 的 HTTP server 交给 supertest 发请求。
- `afterAll` 里 `app.close()` 释放。

---

## 四、覆盖全局配置（管道/守卫等）

E2E 默认带模块里所有全局增强器。要替换,在 `createTestingModule` 后 override:

```ts
const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
  .overrideGuard(AuthGuard)
  .useValue({ canActivate: () => true })   // 测试放开鉴权
  .compile();
```

> 同样适用 `overrideProvider`/`overrideInterceptor`/`overrideFilter`/`overridePipe`(见 `unit-testing.md` 第六节)。

---

## 五、自定义配置（setGlobalPrefix、cors 等）

若应用用了全局前缀,需 E2E 里同样设:

```ts
app = moduleFixture.createNestApplication();
app.setGlobalPrefix('api');   // 与 main.ts 保持一致
app.useGlobalPipes(...);
await app.init();
```

---

## 六、测试 WebSocket / 微服务（进阶）

E2E 也能测 WS/微服务,但复杂度高:
- WS:用 socket.io-client 连 `app.getHttpServer()`。
- 微服务:用 `createMicroservice` + `createNestApplication().connectMicroservice`(见 `../04-microservices/hybrid-application.md`)。

---

## 七、断言库

- 响应状态码/体:`supertest` 的 `.expect(200)` / `.expect('body')`。
- 复杂断言:`expect(...).toEqual(...)`(Jest)。
- 异步返回:`return request(...)` 让 Jest 等 Promise 完成(别漏 `return`,否则用例提前结束)。

---

## 八、坑 & 最佳实践

1. **漏 `return`**:`it` 不返回 supertest Promise,Jest 立即结束,断言不生效。
2. **忘了 `app.init()`**:报"server not initialized"。
3. **`afterAll` 关 app**:漏了可能端口/句柄泄漏,影响后续用例。
4. **全局前缀不一致**:production 有 `api` 前缀,E2E 不设会 404。
5. **DB 依赖**:E2E 应 mock 外部 DB(用 `overrideProvider`),或接测试库(如 testcontainers)。

---

## 九、与单元测试对照

| | 单元测试 | E2E |
|---|---|---|
| 范围 | 单类/模块 | 全应用链路 |
| 创建 | `createTestingModule({controllers,providers})` | `createTestingModule({imports:[AppModule]}).createNestApplication()` |
| 触发 | 直接调方法 | supertest 发 HTTP 请求 |
| 速度 | 快 | 慢 |
| 测什么 | 逻辑、DI | 路由、守卫链、序列化 |

---

## 十、一句话总结

> E2E = `createTestingModule({imports:[AppModule]}).compile()` → `createNestApplication()` → `init()` → `supertest(app.getHttpServer()).get(...)` 发真实 HTTP 请求;覆盖全链路;记得 `return` 断言、`afterAll` 关 app。
