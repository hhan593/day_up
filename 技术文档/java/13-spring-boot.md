# 13 - Spring Boot 核心

> 来源：Spring Boot 官方 Reference Documentation（current，docs.spring.io）
> 原文：https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/
> 说明：本页为 JS 渲染文档，web 抓取仅能取得章节目录锚点（已列于正文出处），下列核心机制基于官方文档结构与 Spring 标准 API 整理，关键锚点均标注。

Spring Boot 是构建生产级 Spring 应用的事实标准，核心理念是**约定优于配置（Convention over Configuration）**。

---

## 一、@SpringBootApplication

```java
@SpringBootApplication   // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

- 主类放在**根包**（如 `com.example.demo`），`@ComponentScan` 默认扫描其所在包及子包。
- `SpringApplication.run(...)` 启动内嵌容器并初始化 IoC 容器。

---

## 二、自动配置（Auto-configuration）

- Spring Boot 根据**类路径上的 jar** + 已定义的 Bean + 条件注解，自动装配 Bean。
- 自动配置类声明于 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`。
- 条件注解（核心机制）：
  - `@ConditionalOnClass`：类路径存在某类才生效
  - `@ConditionalOnMissingBean`：容器无该 Bean 才生效（允许用户覆盖）
  - `@ConditionalOnProperty`：配置项满足才生效
- 禁用特定自动配置：`@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)`

```java
@Configuration
@ConditionalOnClass(DataSource.class)
@ConditionalOnMissingBean(DataSource.class)
public class MyDataSourceAutoConfig { ... }
```

---

## 三、起步依赖（Starter）

- `spring-boot-starter-web`：Web（Tomcat + Spring MVC）
- `spring-boot-starter-data-jpa`：JPA
- `spring-boot-starter-test`：测试（JUnit + Mockito + AssertJ）
- 依赖版本由 `spring-boot-dependencies` 统一管理，**无需手写版本号**。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

---

## 四、依赖注入（DI）

- 原型注解：`@Component`（通用）、`@Service`（业务）、`@Repository`（持久层，额外转译异常）、`@Controller` / `@RestController`（Web）。
- **推荐构造器注入**（不可变、易测试）：

```java
@Service
public class OrderService {
    private final OrderRepository repo;
    public OrderService(OrderRepository repo) { this.repo = repo; } // 单构造器可省 @Autowired
}
```

- 字段/setter 注入也支持，但官方建议构造器注入。

---

## 五、@RestController（写 REST API）

```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    @GetMapping("/{id}")
    public Order get(@PathVariable Long id) { return service.findById(id); }

    @PostMapping
    public Order create(@RequestBody Order o) { return service.save(o); }
}
```

- `@RestController` = `@Controller` + `@ResponseBody`，返回对象自动 Jackson 序列化为 JSON。
- 常用映射：`@GetMapping` `@PostMapping` `@PutMapping` `@DeleteMapping` `@PathVariable` `@RequestBody` `@RequestParam`。

---

## 六、外部化配置（application.properties / yml）

```properties
server.port=8080
spring.datasource.url=jdbc:mysql://localhost:3306/demo
spring.jpa.hibernate.ddl-auto=update
```

- 支持 `application.yml`、环境变量、命令行参数、`@ConfigurationProperties` 类型安全绑定。
- Profile 隔离：`application-dev.properties` / `application-prod.properties`，用 `spring.profiles.active=dev` 切换。

```java
@ConfigurationProperties(prefix = "app")
public record AppConfig(String name, int limit) { }  // 构造函数绑定（Java 16+）
```

---

## 七、内嵌容器与 Actuator

- 默认内嵌 **Tomcat**（可选 Jetty / Undertow / Reactor Netty 响应式）。
- **Actuator** 提供生产就绪端点（需 `spring-boot-starter-actuator`）：
  - `health`：健康检查
  - `metrics`：指标（可导出 Prometheus）
  - `beans` / `env` / `configprops`：运行时 Bean 与配置
  - `loggers`：动态调整日志级别
  - `threaddump` / `heapdump`：诊断

```properties
management.endpoints.web.exposure.include=health,metrics,info
```

---

## 八、与系列其他文档的关系

- Spring Core 的 IoC/DI/AOP 机制见 `14-spring-core.md`。
- 对比 Nest（TS 后端，见 `技术文档/nest`）：Nest 用 TS 装饰器 + 模块，Spring 用注解 + 自动配置，理念相通（DI、拦截器、异常过滤器）。
- 对比 Next.js Route Handlers（见 `技术文档/nextjs`）：两者都做 HTTP 接口，Spring 是独立后端服务，Next 是 BFF/全栈。
- 并发场景用虚拟线程见 `10-virtual-threads.md`；Spring MVC 在 Java 21 下可配虚拟线程执行器提升吞吐。
