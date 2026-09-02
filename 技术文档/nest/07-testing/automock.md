# NestJS Automock（自动模拟）

> 来源：[NestJS 中文文档 · Automock 配方](https://www.nestjs.com.cn/recipes/automock)（NestJS 中文网 recipes 章节）
> Automock 是第三方库,基于 TS 反射**自动生成所有依赖的 mock**,免去手动 `overrideProvider`/`jest.spyOn` 的繁冗。

---

## 一、为什么用 Automock？（通俗对比）

传统单测:每测一个 service,得手动 `jest.spyOn(db, 'find')`、`overrideProvider` 把每个依赖换成 mock——依赖越多越累。

Automock 像"自动把所有零件换成质检假件":你只声明"被测件",它的依赖自动变成 `jest.Mocked<X>`,直接 stub。

**对比**：
- **Nest 原生 `overrideProvider`**：手动逐个换(见 `unit-testing.md`);Automock 全自动换。
- **Spring `@MockBean`**：`@WebMvcTest` 里 `@MockBean` 自动 mock 依赖——Automock 的 `unitRef.get()` 等价于这个。
- **ts-auto-mock / typemoq**：通用 mock 库;Automock 专为 Nest DI 设计,用"虚拟容器"而非真 DI 容器。

---

## 二、安装

```bash
npm i -D @automock/jest @automock/adapters.nestjs
```
> Automock 非 Nest 核心团队维护(支持 Jest / Sinon);问题反馈去其独立仓库。

---

## 三、TestBed 基本用法

```ts
import { TestBed } from '@automock/jest';
import { CatsService } from './cats.service';
import { Database } from './database';

describe('CatsService', () => {
  let service: CatsService;
  let database: jest.Mocked<Database>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(CatsService).compile();
    service = unit;                          // 被测类真实实例
    database = unitRef.get(Database);        // 自动生成的依赖 mock
  });

  it('应返回 cats', async () => {
    database.getCats.mockResolvedValue(['mock']);   // stub 依赖方法
    expect(await service.findAll()).toEqual(['mock']);
  });
});
```

- `TestBed.create(Class).compile()` 返回 `{ unit, unitRef }`。
- `unit`：被测类**真实实例**(可直接调方法)。
- `unitRef`：依赖句柄,`unitRef.get(DepClass)` 拿自动生成的 `jest.Mocked<Dep>`。

> 原理:Automock 用"虚拟容器"自动 mock 所有外部依赖,**不操作真实 Nest DI 容器**(与 `overrideProvider` 本质不同)。

---

## 四、unitRef 按令牌取

接口/自定义令牌的依赖,用字符串/symbol 令牌获取(因 TS 反射限制):

```ts
const logger = unitRef.get('LOGGER_TOKEN');   // 按字符串令牌
const db = unitRef.get(Database);             // 按类
```
> 自定义令牌(Symbol/常量)的取法,对应 `../01-fundamentals/dependency-injection.md` 的"非类令牌"。

---

## 五、声明式模拟 `.mock().using()`

在编译阶段集中声明依赖行为,免去在 `it` 里手写 stub:

```ts
const { unit, unitRef } = TestBed.create(CatsService)
  .mock(Database)                    // 选依赖
  .using({ getCats: async () => mockCats })   // 声明其行为
  .compile();

// 之后 it 里直接 service.findAll() 即用上述行为
```

- 多层依赖可链式逐层 `.mock().using()`:
  ```ts
  TestBed.create(OrderService)
    .mock(Database).using({ find: jest.fn() })
    .mock(Payment).using({ pay: jest.fn().mockResolvedValue(true) })
    .compile();
  ```
- 效果:所有 mock 行为在 `compile()` 前声明完,`it` 块更干净。

---

## 六、与 Nest 原生测试对照

| 方面 | 原生 `Test.createTestingModule` | Automock `TestBed` |
|---|---|---|
| mock 方式 | 手动 `overrideProvider`/`jest.spyOn` | 自动生成 |
| 容器 | 真 DI 容器 | 虚拟容器 |
| 取 mock | `module.get(Token)` | `unitRef.get(Token)` |
| 适合 | 需验证 DI/增强器链 | 纯单测、依赖多、求快 |
| 守卫/管道 | 可真实生效 | 不验证(虚拟容器) |

> 选谁:想测"DI + 守卫/管道/拦截器真实生效"用原生;纯逻辑单测、依赖多、求开发快用 Automock。

---

## 七、坑 & 最佳实践

1. **第三方库**:Automock 独立维护,问题去其 GitHub 仓库。
2. **不验证增强器**:虚拟容器不跑守卫/管道/拦截器——这部分用原生 E2E 测。
3. **接口令牌用字符串**:`unitRef.get('TOKEN')` 而非按接口(反射限制)。
4. **混合使用**:可在 Automock 测纯逻辑,原生 `createTestingModule` 测 DI 链,互补。

---

## 八、一句话总结

> Automock = `TestBed.create(Class).compile()` 得 `{ unit(真实实例), unitRef(依赖mock) }`;自动 mock 所有依赖,`unitRef.get(Dep)` 取 mock stub;`.mock(Dep).using({...})` 声明式集中定义行为;适合依赖多的纯单测。
