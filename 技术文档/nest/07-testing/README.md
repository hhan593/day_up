# 07 - NestJS 测试（Testing）

> 来源：NestJS 中文文档测试章节（[nestjs.bootcss.com/fundamentals/unit-testing](https://nestjs.bootcss.com/fundamentals/unit-testing)、[nestjs.com.cn/recipes/automock](https://www.nestjs.com.cn/recipes/automock)，与 docs.nestjs.cn 同源中文镜像）
> 注：主站 docs.nestjs.cn 未单列 testing 页，本文采用其官方中文镜像同内容源整理。
> 测试 = 用 `Test` 工具类构建模拟运行时 + Jest 断言 + supertest 发 HTTP。分"单元测试"(零件)与"E2E"(整车)。

---

## 一、文档清单

| 文档 | 主题 | 对应来源 |
|---|---|---|
| [unit-testing.md](./unit-testing.md) | 单元测试：隔离测试、Test.createTestingModule、get/resolve、overrides 三法、请求作用域 | bootcss 单元测试 |
| [e2e-testing.md](./e2e-testing.md) | 端到端：supertest、init 样板、全应用链路、overrides | bootcss（备注）+ 官方标准实践 |
| [automock.md](./automock.md) | Automock：TestBed、unit/unitRef、.mock().using() 自动模拟 | 中文网 recipes/automock |

---

## 二、测试金字塔

```
        /\        E2E（少量，慢，全链路）     e2e-testing.md
       /  \       
      /----\     集成测试（多模块）
     /      \    
    /--------\   单元测试（大量，快，单类）   unit-testing.md
   /__________\  + Automock 加速             automock.md
```

---

## 三、核心 API 速查

| API | 用途 | 文件 |
|---|---|---|
| `Test.createTestingModule(meta)` | 搭迷你 DI 容器 | unit-testing |
| `module.compile()` | 异步引导,返回 TestingModule | unit-testing |
| `module.get(Token)` | 取静态(单例)实例 | unit-testing |
| `module.resolve(Token)` | 动态解析(请求/瞬态作用域) | unit-testing |
| `.overrideProvider/G/Filter/Pipe(T).useX()` | 替换部件 | unit-testing |
| `createNestApplication()` / `app.init()` | E2E 造应用 | e2e-testing |
| `app.getHttpServer()` + `supertest` | E2E 发请求 | e2e-testing |
| `TestBed.create(Class).compile()` | Automock 自动 mock | automock |
| `unitRef.get(Dep)` | 取依赖 mock | automock |

---

## 四、与基础章节衔接（跨目录）

| 测试知识点 | 基础章节 |
|---|---|
| `overrideProvider` 用法 = 自定义提供者 | `../01-fundamentals/providers.md`、`dependency-injection.md` |
| 全局 `APP_GUARD` 用 `useExisting` 才能 override | `../01-fundamentals/guards.md`、`dependency-injection.md` |
| `resolve()` 解析请求作用域实例 | `../01-fundamentals/injection-scopes.md` |
| 覆盖守卫/拦截器 = 验证真实链 | `../01-fundamentals/guards.md`、`interceptors.md`、`pipes.md` |
| E2E 测全应用含 WS/微服务 | `../05-websockets`、`../04-microservices` |

---

## 五、与 02/03 章节衔接

- **02-techniques**：`validation.md`(E2E 验证 ValidationPipe 行为)、`serialization.md`(E2E 验证脱敏响应)
- **03-security**：`authentication.md`/`authorization.md`(E2E 测鉴权链,用 overrideGuard 放开或 mock)

---

## 六、坑速查

1. 单元测试漏 `beforeEach` 重建模块 → 状态串味
2. 请求作用域用 `resolve()` 不是 `get()`
3. 全局增强器 `APP_GUARD` 用 `useExisting` 才能 override
4. E2E 漏 `return` supertest → 断言不生效
5. E2E 漏 `app.init()` → server not initialized
6. E2E 漏 `afterAll(app.close())` → 句柄泄漏
7. Automock 不验证守卫/管道链(虚拟容器),那部分用原生 E2E

---

## 七、学习顺序建议

```
unit-testing（基础）→ 写 override/resolve → e2e-testing（全链路）
  → automock（加速纯单测，可选）
```
