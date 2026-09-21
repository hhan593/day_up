# 40 - Spring Bean 生命周期与循环依赖（三级缓存 / BeanPostProcessor / Aware）

> 来源：Spring Framework Reference — «The Containers» 章节（Container Lifecycle、`BeanFactoryPostProcessor`/`BeanPostProcessor`、`Aware` 接口、`@PostConstruct`/`@PreDestroy`）；`AbstractAutowireCapableBeanFactory` / `DefaultSingletonBeanRegistry` 源码（Spring Framework 6.x / Boot 3.x）
> 官方：https://docs.spring.io/spring-framework/reference/core/beans.html 、https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html
> 补充：三级缓存的取舍与循环依赖治理建议属源码级分析与业界标准实践整理，非官方逐字原文；Jakarta 注解（`jakarta.annotation.PostConstruct`）取代旧 `javax.*`。

Spring 的所有"黑魔法"——AOP、声明式事务、`@Cacheable`、`@Value`、自动配置、`@Scheduled`——都不是独立机制，而是**挂在 Bean 生命周期固定节点上的扩展点**。吃透这条流水线和三级缓存，`14-Spring核心IoC与AOP.md` 里"容器怎么用"的每个注解、`31-反射与注解.md` 里"代理怎么生成"的每个细节，就有了共同的因果解释。

---

## 一、全景：一条流水线 + 两类扩展点

### 1. 完整流水线（本篇地图，务必先背准顺序）

```text
BeanDefinition 注册（组件扫描 / `@Bean` / XML / `@Import`）
  → 【容器级】BeanDefinitionRegistryPostProcessor → BeanFactoryPostProcessor（改的是 **定义**）
  → 实例化 Instantiation（构造器 or 工厂方法；**构造器注入在此完成 → 循环依赖无解的根源**）
  → 属性填充 Populate（setter / 字段注入；**在此递归触发依赖 Bean 的创建**）
  → 【Aware 回调】BeanNameAware / BeanFactoryAware（**初始化之前**）
  → 【BPP 前置】postProcessBeforeInitialization
       （`ApplicationContextAware` 等由 `ApplicationContextAwareProcessor` 在此回调；
         `@PostConstruct` 由 `CommonAnnotationBeanPostProcessor` 在此执行）
  → 初始化 InitializingBean.afterPropertiesSet()  →  自定义 init-method
  → 【BPP 后置】postProcessAfterInitialization
       （**AOP 代理在此生成**：`AnnotationAwareAspectJAutoProxyCreator`；事务 / `@Async` / `@Cacheable` 代理同理）
  → 就绪：单例放入一级缓存，开始被使用
  → 销毁 @PreDestroy  →  DisposableBean.destroy()  →  destroy-method
```

### 2. 扩展点 × 能做什么 × 典型实现 × 正确姿势

| 扩展点 | 改什么 | 时机 | 框架内典型实现 | 自定义姿势 |
|---|---|---|---|---|
| `BeanDefinitionRegistryPostProcessor` | **注册新定义** | 定义已加载、实例化前 | `ConfigurationClassPostProcessor`（解析 `@Configuration`/`@Import`/`@Bean`/`@ComponentScan`） | 动态批量注册 Bean（`@EnableXxx`、Mapper 扫描） |
| `BeanFactoryPostProcessor` | **改已有定义 / 拿早期实例** | 定义就绪、实例化前 | `PropertySourcesPlaceholderConfigurer`（`${}` 占位符） | 只读 `BeanDefinition` 做校验；避免 `getBean()` |
| `InstantiationAwareBeanPostProcessor` | 干预实例化与属性填充 | 实例化前后 / populate | `AutowiredAnnotationBeanPostProcessor`（`@Autowired` 注入在此） | 一般不自定义，知道注入发生在这里即可 |
| `BeanPostProcessor` | **改实例**（包代理/填字段） | 每个 Bean 初始化前 + 后各一次 | `CommonAnnotationBeanPostProcessor`、`AnnotationAwareAspectJAutoProxyCreator` | 无副作用地包装；**不要在字段上注入其他 Bean**（见第七节） |
| `SmartInitializingSingleton` | 所有单例造完后的钩子 | 容器 refresh 末尾 | `ScheduledAnnotationBeanPostProcessor`（注册 `@Scheduled`） | "启动后批量初始化"的首选挂载点 |
| `DestructionAwareBeanPostProcessor` | 销毁前干预 | 每个 Bean 销毁前 | `CommonAnnotationBeanPostProcessor`（`@PreDestroy`） | 同 BPP |

> 注意：**`BeanFactoryPostProcessor` 改「定义」、只跑一次、此时不该有实例；`BeanPostProcessor` 改「实例」、每个 Bean 前置/后置各一次**。这层"静态 vs 依赖已创建"的差别是必考答案：BFPP 做不了基于对象状态的决策；BPP 拿到真对象，但代价是它自己的注册顺序会影响后续所有 Bean 的包装结果。

---

## 二、BeanDefinition 从哪来

### 1. 扫描与配置类解析

`@ComponentScan` 由 `ClassPathBeanDefinitionScanner` 完成：候选类 → `@Conditional` 过滤 → 生成 `ScannedGenericBeanDefinition`（此时**只读元数据，不加载类**）。`@Configuration`/`@Import`/`@Bean`/嵌套 `@ComponentScan` 则由 `ConfigurationClassPostProcessor` 统一解析（它是 `BeanDefinitionRegistryPostProcessor`，在所有 BFPP 中优先级最高）。

- **`@Configuration` 类会被 CGLIB 增强**：`@Bean` 方法互调时，增强子类拦截方法调用改查容器，保证仍返回同一单例；`proxyBeanMethods = false`（lite 模式）则退化为普通方法调用，每次 `new` 一个新对象。原理见 `31-反射与注解.md` 第六节，Boot 侧的取舍见 `13-SpringBoot.md`。
- **`@Conditional` 在定义阶段评估**（`PARSE_CONFIGURATION` 与 `REGISTER_BEAN` 两个阶段各评一次），因此条件里不要依赖尚未创建的 Bean；自动配置的 `@ConditionalOnMissingBean` 语义完全依赖这个时机，详见 `13-SpringBoot.md`。

### 2. `@Import` 三种用法：自定义 `@EnableXxx` 与 starter 的原理

| 用法 | 效果 |
|---|---|
| `@Import(SomeConfig.class)` | 直接注册一个配置类 |
| `@Import(SomeComponent.class)` | 注册任意普通类为 Bean（不需要 `@Component`） |
| `@Import(MySelector.class)` | `ImportSelector` 返回**类名数组**（按条件选配置）；`ImportBeanDefinitionRegistrar` 直接操作注册表**手写定义** |

```java
@Retention(RetentionPolicy.RUNTIME) @Target(ElementType.TYPE)
@Import(MetricsRegistrar.class)              // 一个注解开启一整套能力 = @EnableXxx 的全部秘密
public @interface EnableMetrics { boolean prometheus() default true; }

class MetricsRegistrar implements ImportBeanDefinitionRegistrar {
    @Override public void registerBeanDefinitions(AnnotationMetadata meta, BeanDefinitionRegistry reg) {
        Map<String, Object> attrs = meta.getAnnotationAttributes(EnableMetrics.class.getName());
        if (attrs != null && Boolean.TRUE.equals(attrs.get("prometheus"))) {   // 注解未标注时 attrs 为 null；数组型属性的值是 List
            reg.registerBeanDefinition("prometheusMeterRegistry", BeanDefinitionBuilder
                    .genericBeanDefinition(PrometheusMetrics.class).getBeanDefinition());
        }
    }
}
```

> 注意：`ImportSelector` 用**类名字符串**返回，因此被选类可以不在编译期依赖里（自动配置正是这么做的）；`selectImports` 抛异常会让容器启动失败——这是它比 `@Conditional` 更"重"的地方。

---

## 三、实例化（Instantiation）

- **构造器解析**：无 `@Autowired` 时，多构造器选"最多参数且都能解析"的那个；**单构造器可省略 `@Autowired`**（Spring 4.3+ 起），Boot 文档推荐构造器注入正是基于此。
- **可选与延迟**：`Optional<Foo>`、`@Nullable Foo`、`ObjectProvider<Foo>`（`getIfAvailable()` / `getIfUnique()` / `orderedStream()` / `getObject(args)`）。`ObjectProvider` 是**延迟解析**——真正取值时才触发目标 Bean 创建，因此它能破构造器循环依赖。
- **工厂方法**：`@Bean` 方法即"工厂方法式实例化"，其参数就是该 Bean 的依赖，故 `@Bean` 方法之间的环等价于构造器环（见第四节）。
- **`FactoryBean`**：`getObjectType()` 声明"我生产什么类型"，`getObject()` 给出实例；容器按 `getBean("x")` 返回产品、按 `getBean("&x")` 返回工厂本身。

```java
@Mapper public interface OrderMapper { List<Order> findByUid(long uid); }   // 没有任何实现类
@Component class OrderService {
    private final OrderMapper mapper;                     // 注入的是 FactoryBean 产品（JDK 动态代理），不是实现类
    OrderService(OrderMapper mapper) { this.mapper = mapper; }
}
// 容器里注册的其实是 MapperFactoryBean<OrderMapper>：getObject() 用 SqlSession 生成代理
```

> 注意：`FactoryBean` 的提前实例化会影响 `@ConditionalOnBean`、类型判断与**缓存 key 计算**（早期 `isTypeMatch` 可能被迫创建工厂），这是"MyBatis Mapper 上写 `@Conditional` 不生效"一类问题的根。详见 `20-MyBatis.md`。

---

## 四、三级缓存与循环依赖（本篇最重要）

### 1. 先复现：同样的环，字段注入能启动、构造器注入报错

```java
@Component class B1 { @Autowired A1 a; }   @Component class A1 { @Autowired B1 b; }  // 启动成功
@Component class B2 { final A2 a; B2(A2 a) { this.a = a; } }                          // 启动失败
@Component class A2 { final B2 b; A2(B2 b) { this.b = b; } }
// Error: BeanCurrentlyInCreationException: Requested bean is currently in creation: Is there an unresolvable circular reference?
```

原因一句话：**属性填充发生在实例化之后**，所以 A 可以"先存在、后补齐"；构造器注入要求依赖在 A 存在之前就绪，`A → B → A` 里没有任何一个"半成品"可以先交出去。

### 2. 三级缓存分别存什么（`DefaultSingletonBeanRegistry` 的真实字段名）

| 级 | 字段 | 内容 | 语义 |
|---|---|---|---|
| 一级 | `singletonObjects` | 成品 Bean（可能是代理） | 正常 `getBean` 命中这里 |
| 二级 | `earlySingletonObjects` | 提前曝光的**半成品**（原始对象或早期代理） | 一旦某 Bean 被早期取用，其工厂调用结果就缓存在此，三级条目被删除 |
| 三级 | `singletonFactories` | `ObjectFactory<?>`，**"要不要现在生成代理"的决策函数** | 实例化完成后注册：`addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean))` |

`getEarlyBeanReference` 由 `SmartInstantiationAwareBeanPostProcessor` 接口定义，AOP 的 `AbstractAutoProxyCreator` 实现了它——**这就是"提前曝光"能给出代理而不是原始对象的机制**。

### 3. A/B 环的完整推演（这张表是标准答案）

```text
步 动作                                        一级 singletonObjects  二级 earlySingletonObjects  三级 singletonFactories
1  getBean(A)：实例化 A（构造完成，属性未填）  (空)                   (空)                         A -> ObjectFactory
2  populate(A) 需要 B -> getBean(B)            (空)                   (空)                         A -> ObjectFactory
3  实例化 B，注册 B 的工厂                     (空)                   (空)                         A -> OF, B -> OF
4  populate(B) 需要 A：一级无、二级无、三级命中 -> 调用 A 的工厂
     A 需要 AOP：生成代理 A' 放二级，删三级；A 不需要 AOP：原始 A 放二级，删三级
5  B 完成初始化 -> addSingleton(B)              B                        (空)                       B -> OF
6  A 拿到与二级同一引用（A' 或原始 A）          B                        (空)                       B -> OF
7  A 初始化完成 -> addSingleton(A)，清理残留    A, B                     (空)                        (空)
```

### 4. 为什么必须是三级，两级不行（高频追问）

三级缓存存的不是对象而是 **`ObjectFactory`**，它把"是否现在生成代理"这个决定**推迟到真的发生循环依赖、且这个 Bean 真被别人提前要走时**才做。收益：

- 绝大多数 Bean 一生不卷入环，它们**仍在 `postProcessAfterInitialization` 的正常时机**被代理，符合"代理在初始化之后创建"的设计（此时 Aware、`@PostConstruct`、`init-method` 都跑完了，代理包住的是已初始化对象）；只有卷入环的那个 Bean 被提前代理，`AbstractAutoProxyCreator` 用内部记录（`earlyProxyReferences`）标记"我提前处理过它"，后置阶段不再重复包装，避免生成**两层代理**。
- 若只有两级：实例化后就得**无条件立刻代理**（否则二级放原始对象、后置又换成代理，两个引用不一致），既破坏上述设计，又让每个 Bean 都付代理创建成本。

> 注意：答案的关键词是"**把代理决策延迟到真正发生循环依赖时**"，不是"缓存三个 Map 所以更快"。

### 5. Spring 解决不了什么

| 场景 | 能否解决 | 说明 |
|---|---|---|
| 字段 / setter 注入单例环 | ✅ | 三级缓存正常工作 |
| **构造器注入环** | ❌ | 无半成品可曝光，直接抛 `BeanCurrentlyInCreationException`；`@Lazy` 或 `ObjectProvider` 可破 |
| `@Bean` 方法互相调用形成的环 | ❌ | 依赖表达为工厂方法参数，等价构造器环 |
| `prototype` 环 | ❌ | 无单例缓存，"创建中"集合直接报错 |
| `@Async` 参与的环 | ⚠️ 通常不行 | 其 `AsyncAnnotationBeanPostProcessor` 不提供早期代理能力，代理只在后置阶段生成，导致"注入的是原始对象、最终却是代理"的暴露不一致而报错，需 `@Lazy` |
| AOP + 构造器 + 环 | ❌ | 同上，且自调用失效问题叠加（`31-反射与注解.md`） |

**Boot 2.x 起默认禁止循环依赖**（`spring.main.allow-circular-references=false`，版本为 2.6 起，请按实际 Boot 版本核对），报错会直接打印"form a cycle"的依赖链。这个默认值不是倒退，而是在**逼你重构设计**；把开关打开只是止痛，它把设计异味固化进了启动配置。

### 6. 治理顺序（把它当设计异味，而不是用注解消掉）

按代价从小到大：**① 依赖倒置**（A、B 各自依赖抽象，实现类不再互相依赖）→ **② 拆第三个 Bean**（把双方共用的逻辑下沉为 `C`，环变树）→ **③ 事件解耦**（A 发 `ApplicationEvent` / `@TransactionalEventListener`，B 监听，方向单一）→ **④ 最后才 `@Lazy` / `ObjectProvider`**，并在注释里写明是临时手段。

---

## 五、Aware 接口族与 `SmartInitializingSingleton`

| 接口 | 给你什么 | 备注 |
|---|---|---|
| `BeanNameAware` | 自己的 beanName | 容器直接回调，**最先** |
| `BeanFactoryAware` | 所属 `BeanFactory` | 容器直接回调 |
| `ApplicationContextAware` | 上下文 | 由 `ApplicationContextAwareProcessor`（一个 BPP）在前置阶段回调，故**严格说发生在 Aware 组稍后时点**，但整体仍在初始化之前 |
| `EnvironmentAware` / `EmbeddedValueResolverAware` / `ResourceLoaderAware` | 配置 / `${}` 解析器 / 资源 | 同上，前置阶段；`EmbeddedValueResolverAware` 是自己实现"注解驱动"扩展点的常用入口 |

```java
@Component public class SpringContextHolder implements ApplicationContextAware {
    private static ApplicationContext ctx;            // 反模式：静态持有上下文
    @Override public void setApplicationContext(ApplicationContext c) { ctx = c; }
    public static <T> T get(Class<T> t) { return ctx.getBean(t); }
}
```

> 注意：`SpringContextHolder` 把依赖从"声明"降级为"运行时查找"，单测要起容器、编译期无法检查依赖、且上下文在容器关闭后仍可能残留引用——它是**设计坏味道**，但大量遗留代码里到处都是（常见于静态工具类、拦截器里取 Bean）。新代码用构造器注入，只在框架集成层（无法注入的场景）保留这种手段，并优先 `ObjectProvider`。

**`SmartInitializingSingleton.afterSingletonsInstantiated()`**：容器 refresh 末尾、**所有单例都已创建**之后回调一次。它是 `@Scheduled` 任务注册的挂载点（`ScheduledAnnotationBeanPostProcessor` 实现该接口），也是"需要遍历所有同类 Bean 做汇总初始化"（如策略表构建、指标注册、缓存预热）的**正确位置**——放在 `@PostConstruct` 里会因为别的 Bean 还没造完而拿到不完整集合。

---

## 六、三种初始化回调 / 三种销毁回调（必考，含实测顺序）

| 方式 | 由谁处理 | 初始化顺序 | 销毁顺序 | 优点 / 代价 |
|---|---|---|---|---|
| `@PostConstruct` / `@PreDestroy`（jakarta） | `CommonAnnotationBeanPostProcessor`（BPP） | **1** | **1** | 语义清晰；依赖 BPP，非 Spring 环境（如纯 CDI）需另配 |
| `InitializingBean` / `DisposableBean` | 容器直接调 | **2** | **2** | 无注解也能生效；侵入 Spring API，测试需手动调 |
| `init-method` / `destroy-method`（XML、`@Bean(initMethod=/destroyMethod=)`） | 容器反射调用 | **3** | **3** | 最不侵入，适合第三方类；`@Bean` 的 `destroyMethod` **默认推断** `close`/`shutdown`（AutoCloseable） |

```java
public class LifecycleDemo implements InitializingBean, DisposableBean {
    @PostConstruct void a1() { System.out.println("1 @PostConstruct"); }
    @Override public void afterPropertiesSet() { System.out.println("2 afterPropertiesSet()"); }
    public void myInit() { System.out.println("3 init-method"); }
    @PreDestroy void a4() { System.out.println("4 @PreDestroy"); }
    @Override public void destroy() { System.out.println("5 destroy()"); }
    public void myDestroy() { System.out.println("6 destroy-method"); }
}
@Bean(initMethod = "myInit", destroyMethod = "myDestroy")   // 挂在 @Configuration 里
LifecycleDemo lifecycleDemo() { return new LifecycleDemo(); }
// 实测：启动打印 1 → 2 → 3；context.close() 打印 4 → 5 → 6
```

- **`destroyMethod` 默认是"推断"**：实现 `AutoCloseable`/`Closeable` 的第三方资源（如 `DataSource`）会自动调 `close`；只有 `shutdown` 这类命名需显式写 `@Bean(destroyMethod = "shutdown")`，`destroyMethod = ""` 可彻底关闭推断。
- **`prototype` 的销毁 Spring 不管**：容器把实例交出去就结束责任，`@PreDestroy` 不会被调用——需自己管理。**优雅关闭**走 `context.close()`（Boot 由 shutdown hook 触发），按**创建的逆序**销毁单例并跑回调；K8s 的 `SIGTERM` 正是这条路，线程池的 `@PreDestroy` 关闭模板见 `35-线程池与线程协作.md`，探针与宽限期见 `29-Kubernetes部署.md`。

> 注意：初始化三者的顺序可实测、也可推理——注解由 BPP 处理（在前），接口回调其次，自定义方法最后。**销毁侧顺序同样是 4→5→destroy-method**。别答成"接口在前"。

---

## 七、BeanPostProcessor / BeanFactoryPostProcessor 实战

### 1. BPP：扫描自定义 `@InjectConfig` 字段并从配置源填值（注解解析见 `31-反射与注解.md`）

```java
@Component
public class InjectConfigProcessor implements BeanPostProcessor {
    @Override public Object postProcessBeforeInitialization(Object bean, String beanName) {
        ReflectionUtils.doWithFields(AopProxyUtils.ultimateTargetClass(bean), f -> {   // 穿透代理类 + 遍历父类
            InjectConfig ic = f.getAnnotation(InjectConfig.class);
            if (ic != null) { ReflectionUtils.makeAccessible(f); ReflectionUtils.setField(f, bean, ConfigCenter.get(ic.value(), f.getType())); }
        });
        return bean;                          // 返回原对象；返回新对象即"偷梁换柱"（AOP 代理正是这么替换的）
    }
}
```

### 2. BFPP：给所有 `*Service` 的 BeanDefinition 打开懒加载（改的是定义，此时还没有实例）

```java
public class LazyServiceCustomizer implements BeanFactoryPostProcessor {
    @Override public void postProcessBeanFactory(ConfigurableListableBeanFactory bf) {
        for (String name : bf.getBeanDefinitionNames()) {
            BeanDefinition bd = bf.getBeanDefinition(name);
            if (bd.getBeanClassName() != null && bd.getBeanClassName().endsWith("Service")) bd.setLazyInit(true);
        }
    }
}
```

> 注意（真实高频坑）：在 `BeanPostProcessor` 里 `@Autowired` 业务 Bean，会迫使这些 Bean 在**所有 BPP 注册完成之前**被创建，于是它们得不到后续 BPP 的处理，日志出现 `Bean 'x' of type [...] is not eligible for getting processed by all BeanPostProcessors (for example: not eligible for auto-proxying)`——最常见后果是"我的切面/事务偶尔对某个 Bean 不生效"。修法：BPP 内不注入 Bean；确需容器时用 `BeanFactoryAware` / `ObjectProvider` / `@Lazy` 延迟取值。
> 第二个坑：`@Bean` 方法返回 BPP/BFPP 时应声明为 **`static`**，否则配置类本身会被提前实例化，导致它的 `@Value`、`@Autowired` 字段还没装配就已经"作为 BPP 的宿主"跑了。

---

## 八、作用域与代理

| 作用域 | 每容器/每请求 | 销毁由容器负责 | 备注 |
|---|---|---|---|
| `singleton`（默认） | 一个 | ✅ | 只有它进三级缓存，也**只有它能被循环依赖"救"** |
| `prototype` | 每次 `getBean` 新建 | ❌ | 三个 web 作用域见下；singleton 的"销毁"由容器关闭驱动 |
| `request` / `session` | 每请求 / 每会话 | ✅ | 由 web 应用上下文自动注册（常量在 `WebApplicationContext`：`SCOPE_REQUEST`/`SCOPE_SESSION`/`SCOPE_APPLICATION`）；非 web 容器需自行 `registerScope`。见 `38-SpringMVC请求流程与Web层.md` |
| `application` | 每 `ServletContext` | ✅ | 全局共享一份 |

**经典 bug：singleton 注入 prototype，prototype 只被创建一次。**

```java
@Component @Scope("prototype") class Job { void execute() { /* 有可变状态 */ } }
@Service class Runner {
    private final Job job;                    // 注入时机 = Runner 构造时，此后恒为同一实例
    Runner(Job job) { this.job = job; }
    void run() { job.execute(); }             // 期望每次新 Job —— 实际复用 → 并发下互相污染
}
```

三个修法：

```java
class R1 { private final ObjectProvider<Job> jobs;                       // 1) ObjectProvider#getObject() 每次新建
           void run() { jobs.getObject().execute(); } }
abstract class R2 { @Lookup protected abstract Job newJob(); }           // 2) 方法注入：容器生成子类覆盖它
@Component @Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)
class J3 { }                                                             // 3) scoped proxy：注入代理，调用时才解析目标
```

> 注意：`@Scope("request")` 直接注入 singleton 会失败（此时可能没有请求），必须 `proxyMode = ScopedProxyMode.TARGET_CLASS`（或 `INTERFACES`）——scoped proxy 的本质也是 BPP 生成的代理，与第四节同源。

---

## 九、"启动后做一件事"选型表

| 手段 | 时机 | 适合 | 坑 |
|---|---|---|---|
| `@PostConstruct` | 该 Bean 初始化时（别人可能还没造完） | 单 Bean 自校验/资源准备 | 拿不到"全部 Bean"；抛异常导致启动失败 |
| `SmartInitializingSingleton` | **所有单例造完之后** | 遍历同类 Bean 建策略表、注册 `@Scheduled` 类 | 无参数，不做 args 解析 |
| `CommandLineRunner` / `ApplicationRunner` | 容器 refresh 后、`ApplicationReadyEvent` **之前**（两者先收集再按 `@Order` 稳定排序，**无 `@Order` 时 `ApplicationRunner` 先执行**） | 命令行任务、初始化数据、CI 一次性作业 | **抛异常 → 整个应用启动失败并退出** |
| `@EventListener(ApplicationReadyEvent.class)` | Runner 之后 | Web 应用真正"可对外"之后 | Tomcat 在 refresh 阶段已监听，Ready 之前外部流量可能已进来 |
| `ApplicationListener<ContextRefreshedEvent>` | refresh 结束（Ready 更早） | 需要"上下文已刷新"而非"应用已就绪" | 父子上下文会触发多次，需判重 |

顺序记忆：`refresh()`（含内嵌 Tomcat 启动）→ `ContextRefreshedEvent` → `ApplicationStartedEvent` → Runner（`ApplicationRunner` / `CommandLineRunner`，按 `@Order`）→ `ApplicationReadyEvent`。Runner 的 `@Order` 只排 Runner 之间，不改变 Bean 创建顺序（见第十节）。`29-Kubernetes部署.md` 的 readiness 语义对应的正是 Ready 时刻——**端口在 refresh 阶段就已打开，不能拿"能连上"当就绪信号**。

---

## 十、Bean 覆盖与顺序控制

- **`spring.main.allow-bean-definition-overriding`**：Boot 2.1 起默认 `false`，同名 Bean 重复注册直接抛 `BeanDefinitionOverrideException`（组件扫描撞 `@Bean`、两个 starter 撞名是最常见成因）。解法是改 `@Bean` 方法名/加 `@Primary`，而不是打开开关。
- **`@Order` / `Ordered` / `PriorityOrdered`**：影响**集合注入的排序**（`List<Foo>`、`Map<String,Foo>` 的 key 顺序）、`@Aspect` 的嵌套顺序、BPP/BFPP 之间的执行顺序。
- **`@Order` 不影响 Bean 创建顺序**（高频误解）：实例化顺序由依赖图与定义注册顺序决定；想强制先后用 `@DependsOn`，想让 AOP 切面有序才用 `@Order`。
- **`@DependsOn("a")`**：只表达"a 必须先于我创建、销毁逆序"，用于无直接依赖但需时序的场景（初始化数据源先于缓存加载）。局限：对 `@Bean` 方法间已可推断的依赖是冗余；且它不保证"配置类里通过 CGLIB 互调的 Bean"顺序，也可能被 `@Lazy` 绕开。

---

## 十一、易错与面试答题模板

> **生命周期一句话版**：定义注册 →（BFPP 改定义）→ 实例化 → 属性填充 → Aware → BPP 前置（含 `@PostConstruct`）→ `afterPropertiesSet` → `init-method` → BPP 后置（**AOP 代理在此**）→ 使用 → `@PreDestroy` → `destroy()` → `destroy-method`。
> **BPP vs BFPP**：BFPP 改 **BeanDefinition**、在所有 Bean 实例化前跑一次；BPP 改 **Bean 实例**、每个 Bean 前置/后置各一次，是 AOP/注入/回调的实现载体。
> **三种初始化回调顺序**：`@PostConstruct` → `InitializingBean.afterPropertiesSet()` → 自定义 `init-method`；销毁同序（`@PreDestroy` → `destroy()` → `destroy-method`）。
> **三级缓存为什么不是两级**：三级放的是 `ObjectFactory`，把"是否提前生成代理"的决策推迟到真发生循环依赖时才做，从而让绝大多数 Bean 仍在初始化后被正常代理，并避免同一个 Bean 被代理两次。
> **哪些循环依赖解决不了**：构造器注入环、`@Bean` 方法环、prototype 环、`@Async` 参与环；Boot 2.x 起默认直接禁止循环依赖。
> **prototype 注入 singleton**：只创建一次，用 `ObjectProvider` / `@Lookup` / `proxyMode = TARGET_CLASS` 三者之一修正。
> **`@Order` 不控制创建顺序**：它只管集合排序与切面/扩展点执行顺序，别拿它当依赖顺序的解决方案。
> **别把 BPP 当普通 Bean 写**：在里面注入业务 Bean 会引发 `is not eligible for getting processed by all BeanPostProcessors`，代价是部分 Bean 悄悄失去代理。

---

## 十二、与系列其他文档的关系

- `14-Spring核心IoC与AOP.md`：用法层（有哪些注解、怎么注入）；本篇是它的**实现流水线**。
- `31-反射与注解.md`：代理与注解解析正是各 `BeanPostProcessor` 在做的事；`@Inherited`/元注解决定扫描能否命中。
- `13-SpringBoot.md`：自动配置 = `@Import` + `@Conditional` + BFPP/BPP 的组合应用，本篇第二节是其原理侧。
- `39-Spring事务与传播机制.md`：事务代理在本篇流水线"后置"步骤生成；**为什么同类自调用、`final`/`private` 方法会导致事务失效**属应用层后果，见 39。
- `20-MyBatis.md`：`MapperFactoryBean` 让"无实现类的接口"可注入（第三节）。
- `23-Redis缓存.md`：`@Cacheable` 与事务代理是同一套后置包装机制。
- `35-线程池与线程协作.md`：`@PreDestroy` 关闭线程池模板、ThreadLocal 上下文 Bean 的作用域选择。
- `38-SpringMVC请求流程与Web层.md`：`WebMvcConfigurer`、`@ControllerAdvice` 都是被 BPP 发现并消费的 Bean。
- `29-Kubernetes部署.md`：`SIGTERM` → 容器 `close()` → 销毁回调与 Runner 生命周期。
- `25-设计模式与面试专项.md`：三级缓存条目是本篇第四节的浓缩结论。
