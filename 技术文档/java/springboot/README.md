# Spring Boot 知识总纲

> 定位：构建生产级 Spring 应用的事实标准，核心理念是 **约定优于配置（Convention over Configuration）**。
> 衔接：`java-middle/14-Spring核心IoC与AOP.md`、`java-middle/19-JPA与SpringDataJPA.md`、`java-middle/22-SpringSecurity与OAuth2与JWT.md`。

---

## 目录

- [一、快速开始](#一快速开始)
- [二、自动配置原理](#二自动配置原理)
- [三、配置文件与 Profile](#三配置文件与-profile)
- [四、Starter 机制](#四starter-机制)
- [五、Web 开发](#五web-开发)
- [六、数据访问](#六数据访问)
- [七、事务管理](#七事务管理)
- [八、异步与定时](#八异步与定时)
- [九、缓存抽象](#九缓存抽象)
- [十、统一异常处理](#十统一异常处理)
- [十一、Actuator 生产就绪](#十一actuator-生产就绪)
- [十二、日志](#十二日志)
- [十三、单元测试](#十三单元测试)
- [十四、打包与部署](#十四打包与部署)
- [十五、常见面试考点](#十五常见面试考点)

---

## 一、快速开始

```java
@SpringBootApplication   // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

- 主类放在**根包**（如 `com.example.demo`），`@ComponentScan` 默认扫描其所在包及子包。
- `SpringApplication.run(...)` 启动内嵌容器（Tomcat/Netty）并初始化 IoC 容器。

最小依赖（`pom.xml`）：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
</parent>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

---

## 二、自动配置原理

- Spring Boot 根据**类路径上的 jar** + 已定义的 Bean + 条件注解，自动装配 Bean。
- 自动配置类声明于 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`。
- 条件注解（核心机制）：
  - `@ConditionalOnClass`：类路径存在某类才生效
  - `@ConditionalOnMissingBean`：容器无该 Bean 才生效（允许用户覆盖）
  - `@ConditionalOnProperty`：配置项满足才生效
- 禁用特定自动配置：

```java
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
```

- 调试自动配置：`--debug` 启动或 `application.yml` 中 `debug: true`，查看 `CONDITIONS EVALUATION REPORT`。

---

## 三、配置文件与 Profile

- 加载顺序（优先级由高到低，后加载覆盖先加载）：
  1. 命令行参数 `--server.port=8081`
  2. `application-{profile}.yml`
  3. `application.yml`
  4. 默认配置（`spring-boot-autoconfigure`）
- 多环境隔离：

```yaml
# application.yml
spring:
  profiles:
    active: dev
---
spring:
  config:
    activate:
      on-profile: dev
server:
  port: 8080
---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
```

- 读取配置：`@Value("${key}")`、`@ConfigurationProperties(prefix="app")`、环境变量、外部 `config/` 目录。

---

## 四、Starter 机制

- Starter 是**依赖描述符**，把一组相关依赖打包，避免手动管理版本。
- 原理：starter 引入 `spring-boot-autoconfigure` 中的自动配置类。
- 自定义 Starter 三要素：
  1. `autoconfigure` 模块：写 `@AutoConfiguration` 类。
  2. `starter` 模块（空 jar，仅依赖 autoconfigure）。
  3. 在 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 注册。

---

## 五、Web 开发

### 5.1 常用注解

```java
@RestController          // = @Controller + @ResponseBody
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")              // 查询
    public User get(@PathVariable Long id) { ... }

    @PostMapping                       // 新增
    public ResponseEntity<Void> create(@Valid @RequestBody UserDTO dto) { ... }

    @PutMapping("/{id}")               // 更新
    public User update(@PathVariable Long id, @RequestBody UserDTO dto) { ... }

    @DeleteMapping("/{id}")            // 删除
    public void delete(@PathVariable Long id) { ... }
}
```

### 5.2 参数绑定

- `@PathVariable`：路径变量
- `@RequestParam`：查询参数
- `@RequestBody`：JSON 体（`@Valid` 触发 JSR-303 校验）
- `@RequestHeader` / `@CookieValue`

### 5.3 拦截器

```java
@Component
public class AuthInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        // 鉴权逻辑
        return true;
    }
}
// 注册：实现 WebMvcConfigurer.addInterceptors
```

---

## 六、数据访问

- `spring-boot-starter-data-jpa` → Spring Data JPA（见 `java-middle/19-JPA与SpringDataJPA.md`）
- `spring-boot-starter-data-redis` → Redis（见 `java-middle/23-Redis缓存.md`）
- MyBatis：`mybatis-spring-boot-starter`
- 多数据源：用 `@Configuration` + `@Primary` + `@Qualifier` 分别声明 `DataSource`/`SqlSessionFactory`。

---

## 七、事务管理

```java
@Service
public class OrderService {
    @Transactional(
        isolation = Isolation.READ_COMMITTED,
        propagation = Propagation.REQUIRED,
        rollbackFor = Exception.class,
        timeout = 5)
    public void createOrder(Order order) { ... }
}
```

- 传播行为：`REQUIRED`（默认，加入或新建）、`REQUIRES_NEW`（挂起当前，新建）、`NESTED` 等。
- 隔离级别：READ_UNCOMMITTED / READ_COMMITTED / REPEATABLE_READ / SERIALIZABLE。
- 注意：`@Transactional` 基于**代理**，同类方法自调用不生效；默认只对 `RuntimeException` 回滚。

---

## 八、异步与定时

```java
@SpringBootApplication
@EnableAsync          // 开启异步
@EnableScheduling     // 开启定时
public class DemoApplication {}

@Service
public class TaskService {
    @Async
    public CompletableFuture<String> asyncJob() { ... }

    @Scheduled(cron = "0 0 2 * * ?")   // 每天 2 点
    public void nightlyJob() { ... }
}
```

- `@Async` 默认使用 `SimpleAsyncTaskExecutor`，生产应自定义线程池 `TaskExecutor` Bean。

---

## 九、缓存抽象

```java
@Cacheable(value = "user", key = "#id")          // 查缓存，无则执行并写入
public User getById(Long id) { ... }

@CachePut(value = "user", key = "#user.id")       // 更新缓存
public User update(User user) { ... }

@CacheEvict(value = "user", key = "#id")          // 删除缓存
public void delete(Long id) { ... }
```

- 后端可接 Caffeine（本地）、Redis（分布式，见 `java-middle/23-Redis缓存.md`）。
- 启用：`@EnableCaching`。

---

## 十、统一异常处理

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValid(Exception e) {
        return ResponseEntity.badRequest().body(ApiError.of("参数校验失败"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handle(Exception e) {
        return ResponseEntity.internalServerError().body(ApiError.of("系统异常"));
    }
}
```

- 结合 `@ControllerAdvice` / `@RestControllerAdvice` 做全局拦截，返回统一 `Result<T>`。

---

## 十一、Actuator 生产就绪

```yaml
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus,env
  endpoint.health.probes.enabled: true
  endpoints.web.base-path: /actuator
```

- `/actuator/health`：健康检查（含 `liveness`/`readiness` 探针，供 K8s 使用）。
- `/actuator/metrics`：JVM、HTTP、线程等指标。
- `/actuator/prometheus`：对接 Prometheus（见 `kubernetes/README.md`）。

---

## 十二、日志

- 默认使用 Logback，`application.yml`：

```yaml
logging:
  level:
    root: INFO
    com.example.demo: DEBUG
  file:
    name: logs/app.log
```

- 生产建议：异步 appender、滚动切割、不打印敏感字段。

---

## 十三、单元测试

```java
@SpringBootTest
class OrderServiceTest {

    @MockBean
    private PaymentClient paymentClient;   // 模拟外部依赖

    @Autowired
    private OrderService orderService;

    @Test
    void createOrder_success() {
        when(paymentClient.pay(any())).thenReturn(true);
        orderService.createOrder(new Order());
        // 断言
    }
}
```

- 切片测试：`@WebMvcTest`（仅 web 层）、`@DataJpaTest`（仅 JPA 层）、`@JsonTest`。
- 用 `MockMvc` 做 HTTP 层测试，`Testcontainers` 做集成测试（真实 DB/Redis）。

---

## 十四、打包与部署

```xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

```bash
mvn package        # 生成可执行 fat jar
java -jar app.jar   # 直接运行（内嵌容器）
```

- 容器化：见 `docker/README.md`；云原生编译：见 `java-middle/28-云原生GraalVM.md`。

---

## 十五、常见面试考点

1. **`@SpringBootApplication` 由哪三个注解组成？** → `@Configuration` + `@EnableAutoConfiguration` + `@ComponentScan`。
2. **自动配置如何避免冲突？** → 条件注解；用户自定义 Bean 用 `@ConditionalOnMissingBean` 占位。
3. **Starter 是什么？** → 依赖聚合 + 自动配置。
4. **`@Transactional` 失效场景？** → 同类自调用、非 public、异常被 catch、数据库引擎不支持事务（如 MyISAM）。
5. **Bean 生命周期？** → 实例化 → 属性填充 → `Aware` → `BeanPostProcessor` 前置 → 初始化(`@PostConstruct`/`InitializingBean`) → 后置 → 使用 → 销毁(`@PreDestroy`/`DisposableBean`)。
6. **Spring Boot 3 变化？** → 基于 Jakarta EE（包名 `jakarta.*`）、要求 Java 17+、支持虚拟线程、GraalVM Native。
