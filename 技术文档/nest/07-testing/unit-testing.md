# NestJS 单元测试（Unit Testing）

> 来源：[NestJS 中文文档 · 单元测试](https://nestjs.bootcss.com/fundamentals/unit-testing)（bootcss 中文镜像，与 docs.nestjs.cn 同源）
> 单元测试聚焦"单个类/模块"，用 Jest + `Test.createTestingModule` 构建模拟运行时，隔离依赖。

---

## 一、为什么需要单元测试？（通俗对比）

单元测试像"零件单独质检"——发动机拆下来在台架上测,不装整车。集成/E2E 像"整车路试"。Nest 让你**不启动真服务器**就能测 controller/service,速度快、定位准。

**对比其他框架**：
- **Spring Boot Test**：`@WebMvcTest` / `@DataJpaTest` 分片测;Nest 用 `Test.createTestingModule({ controllers:[X], providers:[Y] })` 手动选片,思路一致。
- **Jest 原生**：`jest.mock()` 全局 mock;Nest 额外提供 `Test` 工具类搭 DI 容器,比纯 jest.mock 更贴近"运行时行为"。
- **Angular TestBed**：`TestBed.configureTestingModule(...)` —— Nest 的 `Test.createTestingModule` 直接借鉴定 Angular,连名字都像。

---

## 二、环境

```bash
npm i --save-dev @nestjs/testing jest ts-jest @types/jest
```

- 默认测试框架 **Jest**(runner + 断言 + mock/spy);Nest 保持中立,可换 Jasmine/Mocha。
- 测试文件后缀 `.spec.ts` 或 `.test.ts`,放在被测类附近。
- `nest new` 已自动脚手架 Jest 配置与样例。

---

## 三、隔离测试（最基础，不用 DI）

直接 `new` 实例化,手动传依赖。适合"只测这个类本身逻辑",不验证注入:

```ts
describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);  // 手动注入
  });

  describe('findAll', () => {
    it('应返回数组', () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);  // mock service
      expect(catsController.findAll()).toBe(result);
    });
  });
});
```

> 局限:不测 DI 解析、不测守卫/管道/拦截器链。生产项目用下面的 `Test.createTestingModule` 更贴近真实。

---

## 四、Test.createTestingModule（模拟运行时）

`@nestjs/testing` 的 `Test` 构建"迷你 Nest 应用",完整走 DI:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let controller: CatsController;
  let service: CatsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatsController],
      providers: [CatsService],
    }).compile();

    controller = module.get<CatsController>(CatsController);
    service = module.get<CatsService>(CatsService);
  });

  it('应被定义', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('应返回 cats', () => {
      const result = ['test'];
      jest.spyOn(service, 'findAll').mockResolvedValue(result);  // 异步 mock
      expect(controller.findAll()).resolves.toBe(result);
    });
  });
});
```

- `createTestingModule` 接收与 `@Module()` **相同元数据**。
- `compile()` 异步,引导依赖图,返回 `TestingModule`。
- `module.get(Token)` 取**静态实例**(单例)。

---

## 五、请求作用域 / 瞬态：用 `resolve()`

单例用 `get()` 即可;请求作用域(`Scope.REQUEST`)或瞬态(`Scope.TRANSIENT`)需 `resolve()` 动态解析(见 `../01-fundamentals/injection-scopes.md`):

```ts
const service = await module.resolve(CatsService);  // 每次独立子树
```

---

## 六、Provider 覆盖（Overrides）—— 核心技巧

测试时常用**假实现**替换真数据库 provider。`TestingModuleBuilder` 提供三种 override,用法与 `providers.md` 的自定义提供者一致:

```ts
const moduleRef = await Test.createTestingModule({ controllers:[CatsController], providers:[CatsService] })
  .overrideProvider(CatsService)          // 要替换的令牌
  .useValue({ findAll: () => ['mock'] })  // 假实例
  .compile();
```

| 方法 | 用法 | 适合 |
|---|---|---|
| `overrideProvider(T).useClass(Fake)` | 传入类,Nest 实例化 | 用子类/替身类 |
| `overrideProvider(T).useValue(obj)` | 传入现成对象 | 手写假对象 |
| `overrideProvider(T).useFactory(fn)` | 工厂返回实例 | 需计算的创建 |

同样有 `.overrideGuard()` / `.overrideInterceptor()` / `.overrideFilter()` / `.overridePipe()` 替换增强器:

```ts
const moduleRef = await Test.createTestingModule({ controllers:[CatsController] })
  .overrideGuard(AuthGuard)
  .useValue({ canActivate: () => true })   // 测试时放行所有鉴权
  .compile();
```

> ⚠️ **全局增强器 `APP_GUARD` 坑**:模板里用 `useClass` 注册的全局守卫,`overrideGuard` 替换不掉。需改成 `useExisting` 指向具名 provider,再 override 那个具名 provider:
>
> ```ts
> // 原：providers:[{ provide: APP_GUARD, useClass: RolesGuard }]
> // 改：
> providers: [
>   RolesGuard,
>   { provide: APP_GUARD, useExisting: RolesGuard },  // 具名
> ],
> // 测试：module.overrideProvider(RolesGuard).useValue(fake)
> ```

---

## 七、测试请求作用域实例

```ts
import { ContextIdFactory } from '@nestjs/core';

const contextId = ContextIdFactory.create();
jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);

const service = await moduleRef.resolve(CatsService, contextId);  // 同一子树
```

> 确保多次 `resolve` 拿到的请求作用域实例同属一个请求上下文(见 `../01-fundamentals/injection-scopes.md` 的 ContextId)。

---

## 八、Service 单元测试

Service 本身是 provider,测法有二:
1. 直接 `new Service(depMock)`(类似隔离测试)
2. 放 `createTestingModule({ providers:[Service, { provide: Repo, useValue: repoMock }] })` 取实例

```ts
const module = await Test.createTestingModule({
  providers: [
    CatsService,
    { provide: CatsRepository, useValue: { findAll: jest.fn().mockResolvedValue([]) } },
  ],
}).compile();
const service = module.get(CatsService);
```

---

## 九、与类型系统衔接

- `jest.spyOn` 要求方法是对象真实存在——对应 `typescript-advanced-type-system.md` 的"结构化类型":mock 对象只要形状对就能注入。
- `useValue` 假对象类型约束宽松,Nest 的 `strict` 模式不会拦测试(测试不走 tsc 严格检查编译,靠 ts-jest)。

---

## 十、坑 & 最佳实践

1. **别在 `beforeEach` 之外 compile**:每个用例重建模块,隔离状态。
2. **异步 mock**:service 返回 Promise 用 `mockResolvedValue` + `expect(...).resolves`。
3. **全局增强器用 useExisting**:否则 override 不掉(见第六节)。
4. **DI 要真**:涉及守卫/管道逻辑时,用 `createTestingModule` 而非纯 `new`,才能验证真实行为。

---

## 十一、一句话总结

> 单元测试 = Jest + `Test.createTestingModule({controllers,providers}).compile()` 搭迷你 DI 容器;`module.get()` 取实例,`jest.spyOn` mock 依赖;overrideProvider/Guard/Pipe 替换部件;请求作用域用 `resolve()`。
