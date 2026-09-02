# NestJS 循环依赖（Circular Dependency）

> 来源：[NestJS 中文文档 · 循环依赖](https://docs.nestjs.cn/fundamentals/circular-dependency)
> 当两个类互相依赖（A→B→A），Nest 的 DI 会失败。本文讲解法与根治。

---

## 一、循环依赖是什么？（通俗对比）

A 需要 B，B 又需要 A——像"先有鸡还是先有蛋"。DI 容器实例化 A 时发现要 B，去建 B 又发现要 A，死循环。

**对比其他框架**：
- **Spring**：同样有循环依赖，Spring 用"三级缓存"**字段注入**缓解；Nest 默认构造注入，更严格，需显式 `forwardRef`。
- **Angular**：`forwardRef()` 同样的 API——Nest 借鉴定 Angular。

---

## 二、识别循环

报错形如：`Nest cannot create the X instance. Potential circular dependency? Use forwardRef() to avoid it.`

---

## 三、解法 1：`forwardRef()`

在两侧都用 `forwardRef`，Nest 用惰性令牌延迟解析。

```ts
// A 依赖 B
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => DogsService))
    private dogsService: DogsService,
  ) {}
}

// B 依赖 A
@Injectable()
export class DogsService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private catsService: CatsService,
  ) {}
}
```

模块间循环：

```ts
@Module({
  imports: [forwardRef(() => DogsModule)],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

---

## 四、解法 2：`ModuleRef.resolve()`（运行时按需取）

避免在构造期拿依赖，运行时再取（打破构造期死锁）：

```ts
constructor(private moduleRef: ModuleRef) {}
async onModuleInit() {
  this.dogsService = await this.moduleRef.resolve(DogsService, undefined, { strict: false });
}
```

---

## 五、根治：重构（最佳实践）

`forwardRef` 是"创可贴"。真正该做的是**消灭循环**：
- 抽公共逻辑到第三个模块/服务（C），A、B 都依赖 C。
- 用**事件**解耦（见 `../02-techniques/events.md`）：A 发事件，B 监听，不再直接依赖。

---

## 六、请求作用域下的循环

请求作用域（`Scope.REQUEST`）实例不能用 `root` 的 `moduleRef.get`，要用 `resolve()`。

---

## 七、一句话总结

> 循环依赖 = A↔B 互相注入导致 DI 死锁；应急用 `forwardRef(() => X)`，模块级同样包裹；根治靠抽公共模块或用事件（`../02-techniques/events.md`）解耦。
