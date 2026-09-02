# 14 - Spring Core：IoC 容器 / 依赖注入 / AOP

> 来源：Spring Framework 官方 Reference Documentation — Core Technologies（IoC Container / AOP）
> 原文：https://docs.spring.io/spring-framework/reference/core/beans.html
> 版本：Spring Framework 7.0.9（current 稳定版；另含 6.2.x）
> 说明：官方文档为 JS 渲染页，web 抓取仅取得章节目录与概念提要（已标注出处锚点），下列机制基于官方文档结构与 Spring 标准 API 整理。

Spring Core 是整个 Spring 生态的基石：**IoC 容器** 管理对象生命周期与依赖，**AOP** 处理横切关注点。

---

## 一、IoC 容器与 Bean

- **IoC（控制反转）**：对象不再自己 `new` 依赖，而是交给容器**注入**。
- 两个核心接口：
  - `BeanFactory`：基础容器
  - `ApplicationContext`：增强版（事件、国际化、AOP 集成），**日常使用它**
- **Bean**：被容器管理的对象，由 `@Component` 或 `@Bean` 或 XML 声明。

---

## 二、原型注解（Stereotype Annotations）

| 注解 | 语义 |
|---|---|
| `@Component` | 通用组件 |
| `@Service` | 业务层 |
| `@Repository` | 持久层（额外将平台异常转译为 `DataAccessException`） |
| `@Controller` | MVC 控制器 |
| `@RestController` | `@Controller` + `@ResponseBody` |

配合 `@ComponentScan`（含于 `@SpringBootApplication`）扫描注册。

---

## 三、依赖注入（DI）

### 1. 构造器注入（推荐）
```java
@Service
public class UserService {
    private final UserRepository repo;
    public UserService(UserRepository repo) { this.repo = repo; } // 单构造器免 @Autowired
}
```

### 2. 字段 / setter 注入
```java
@Component
public class A {
    @Autowired private B b;                    // 字段注入（不推荐，难测试）
    private C c;
    @Autowired public void setC(C c) { this.c = c; } // setter 注入
}
```

### 3. 歧义解决：@Primary / @Qualifier
```java
@Primary
@Repository
public class MysqlUserRepo implements UserRepo { }

@Repository
@Qualifier("redis")
public class RedisUserRepo implements UserRepo { }

// 注入时指定
@Autowired
public void setRepo(@Qualifier("redis") UserRepo repo) { ... }
```

- `@Autowired` 默认**按类型**注入；多个候选用 `@Primary`（首选）或 `@Qualifier`（按名）缩小。

---

## 四、Java 配置：@Configuration / @Bean

```java
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource();   // 返回的对象由容器托管
    }
    @Bean
    public UserService userService() {
        return new UserService(dataSource()); // 方法间依赖调用
    }
}
```

- `@Configuration` 类被 CGLIB 增强，保证 `@Bean` 方法间调用返回同一单例。
- 启动：`new AnnotationConfigApplicationContext(AppConfig.class)`。

---

## 五、Bean 作用域（Scope）

| 作用域 | 说明 |
|---|---|
| `singleton`（默认） | 容器中仅一个实例 |
| `prototype` | 每次获取新建一个 |
| `request` | 每个 HTTP 请求一个（Web） |
| `session` | 每个会话一个（Web） |
| `application` | ServletContext 级（Web） |

```java
@Scope("prototype")
@Component
public class Task { }
```

- 注意：`singleton` 注入 `prototype` 时，prototype 只在创建 singleton 时构造一次（需用 `ObjectProvider` 或 `Provider` 获取每次新实例）。

---

## 六、AOP（面向切面编程）

解决日志、事务、安全等**横切关注点**，避免散落在业务代码。

- **Aspect（切面）**：`@Aspect` 类，封装横切逻辑。
- **Join Point（连接点）**：程序执行点（如方法调用）。
- **Pointcut（切点）**：匹配哪些连接点，用表达式。
- **Advice（通知）**：在切点做什么、何时做：
  - `@Before`：方法前
  - `@After`：方法后（无论成败）
  - `@AfterReturning`：正常返回后
  - `@AfterThrowing`：抛异常后
  - `@Around`：包裹整个方法（最灵活，可控制是否执行）

```java
@Aspect
@Component
public class LogAspect {
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}

    @Around("serviceLayer()")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.nanoTime();
        try { return pjp.proceed(); }
        finally { System.out.println(pjp.getSignature() + " 耗时 " + (System.nanoTime()-start)); }
    }
}
```

- Spring AOP 默认用 **JDK 动态代理**（接口）或 **CGLIB**（类）。
- 常见应用：声明式事务 `@Transactional`、权限校验、日志、埋点。

---

## 七、与系列其他文档的关系

- Spring Boot 在其上封装自动配置 → `13-spring-boot.md`
- 对比 Nest（TS，见 `技术文档/nest`）：Nest 的 `@Injectable()`、`@Module`、拦截器、`@UseGuards` 与 Spring 的 `@Component`、AOP、拦截器高度对应；Nest 借鉴了 Spring 的设计。
- AOP 与 Java 注解机制相关，但 AOP 是运行时代理，不同于编译期注解处理。
