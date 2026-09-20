# 38 - Spring MVC 请求流程与 Web 层（DispatcherServlet / 异常 / 校验 / 拦截器 / CORS）

> 来源：Spring Framework Reference — «Spring MVC» / «Web on Servlet Stack»（webmvc 章节）；Jakarta Bean Validation 3.0 规范；Spring Boot Reference（错误页与 CORS 部分）
> 官方：https://docs.spring.io/spring-framework/reference/web/webmvc.html 、https://jakarta.ee/specifications/bean-validation/
> 补充：统一响应体与全局异常的分层约定、拦截器 vs 过滤器选型表属业界标准实践整理，非 Spring 官方逐字原文。

本篇主线只有一条：**一个 HTTP 请求进入 Spring Boot 之后发生了什么**——经过哪些层、每层留了什么扩展点、参数怎么变成对象、异常与校验错误怎么统一出口、跨域怎么放行。13 篇讲"接口怎么写"，本篇讲"请求怎么流进来、横切逻辑挂在哪一层"。

---
## 一、请求全链路（本篇骨架）

```
客户端 → Nginx/网关（TLS、限流、跨域、路由：横切优先放这层，见 29 / 24）
  → Servlet 容器（内嵌 Tomcat）解析报文 → HttpServletRequest
    → Filter 链（容器层 jakarta.servlet.Filter）：编码 / CORS / 脱敏 / body 缓存包装
      → DispatcherServlet.doDispatch()            ← 前端控制器，MVC 唯一入口
        → HandlerMapping：URL+method+headers → 命中哪个方法（未命中 → 404）
        → Interceptor.preHandle()（任一返回 false 整链中断）
        → HandlerAdapter 反射调用：
            ArgumentResolver 绑定参数（@PathVariable/@RequestParam/@RequestBody…）+ @Valid 触发校验
            AOP 环绕 →【Controller 方法】→ Service（事务边界）
            ReturnValueHandler：@ResponseBody → HttpMessageConverter（Jackson 写 JSON）；否则 ViewResolver
        → Interceptor.postHandle()（仅正常路径）→ 异常则 HandlerExceptionResolver（@ExceptionHandler）
        → Interceptor.afterCompletion()（一定执行，带 Exception）
  → 回溯 Filter 链（doFilter 中 response 之后的代码此时才跑）→ 响应写出
```

| 哪一步 | 对应扩展点 | 典型用途 |
|---|---|---|
| 进容器后、MVC 前 | `Filter` / `FilterRegistrationBean` | 改原始报文、包 request、CORS |
| HandlerMapping | `HandlerInterceptor.preHandle` | 鉴权、拿到 handler 与方法注解 |
| 参数解析 / 校验 | `HandlerMethodArgumentResolver`、Bean Validation | 自定义参数注入、约束与分组 |
| 方法执行 | Spring AOP `@Around` | 缓存、限流、幂等、方法日志 |
| 返回值序列化 | `HttpMessageConverter` + Jackson 注解 / `ResponseBodyAdvice` | 字段裁剪、Long 转字符串、统一包装 |
| 异常出口 / 收尾 | `@RestControllerAdvice` / `afterCompletion` | 统一错误体、状态码策略、清 ThreadLocal |

> 注意：**Filter 属 Servlet 容器规范，Interceptor 属 SpringMVC**。Filter 在 `DispatcherServlet` 之前跑完、看不到 handler；Interceptor 能拿到 `HandlerMethod`（方法注解、路径变量），但静态资源不经过 MVC、不会被拦。

---
## 二、DispatcherServlet 与内嵌 Tomcat 的装配

- `DispatcherServlet` 由 **`DispatcherServletAutoConfiguration`** 自动注册（Bean 名 `dispatcherServlet`），经 `ServletRegistrationBean` 挂到 `/`；主配置前缀 `spring.mvc.*`（`static-path-pattern`、`throw-exception-if-no-handler-found`、`async.request-timeout`，默认值**需按版本核对**）。容器侧：`server.servlet.context-path`（**不影响** `@RequestMapping` 里写的路径）、`server.port`、`server.tomcat.*`。
- 手动注册用 `ServletRegistrationBean` / `FilterRegistrationBean` / `ServletListenerRegistrationBean`，好处是**可控 urlPatterns 与 order**（`@WebFilter` + `@ServletComponentScan` 优先级不可控）：`bean.addUrlPatterns("/api/*")` —— **Servlet 的 urlPattern 只认 `/*`、`*.ext`、精确三种，不认 `**`**；`bean.setOrder(Ordered.HIGHEST_PRECEDENCE + 100)` 决定与别的 Filter 的先后。
- **Boot 3 默认 MVC + 阻塞栈**（一请求一线程，可换虚拟线程执行器，见 10 / 13）。WebFlux 是**另一套体系**：没有 Filter 也没有 HandlerInterceptor，只有 `WebFilter`，见 `26-WebFlux响应式编程.md`。

---
## 三、@RequestMapping 匹配规则细节

| 写法 | 含义 / 易错点 |
|---|---|
| `/users/{id}` 与 `/users/{id:\\d+}` | 路径变量**只匹配一段**（不含 `/`）；不加正则时 `/users/abc` 也会命中，到类型转换才报 400 |
| `/files/{path:**}` | 贪婪吞掉剩余段；Boot 3 的 `PathPatternParser` 要求 `**` **只能在末尾** |
| `/api/*` vs `/api/**`；Ant `?`/`*`/`**` | 一段 vs 多段；单字符/单段/多段。用 `/api/**` 放行时容易把 `/api/internal/**` 一起放过 |
| `produces = "application/vnd.api.v2+json"` | 内容协商做版本；`Accept` 不匹配报 **406**，不是 404 |
| `consumes = "application/json"` | 限定请求体类型；不匹配报 **415** |

- **404 vs 405**：URL 命中但方法不对 → **405 `HttpRequestMethodNotSupportedException`**；URL 完全没命中 → **404**。前者查前端/网关的 method，后者查映射与 context-path。
> 注意：Boot 3 / Spring 6 默认改用 **`PathPatternParser`**（旧实现 `AntPathMatcher`），启动预编译、匹配更快，但**个别边缘语法行为不同**（尤其 `**` 的位置）。开关 `spring.mvc.pathmatch.matching-strategy` 与具体差异**需按所用版本核对 release notes**。

---
## 四、参数绑定的四条路

| 来源 | 注解 / 类型 | 关键点 |
|---|---|---|
| URL 路径段 | `@PathVariable` | 路径变量必然存在，默认可当必填处理 |
| 查询串 / 表单 | `@RequestParam` | 支持 `required`/`defaultValue`；**写了 defaultValue 即视为非必填** |
| 请求体 JSON | `@RequestBody` | 走 `MappingJackson2HttpMessageConverter`；body 缺失/语法错 → `HttpMessageNotReadableException` |
| 整个对象 | 不加注解的 POJO/record | `WebDataBinder` 逐字段绑定，适合 GET 多参数查询对象；校验失败抛 `BindException` |
| 头 / Cookie / 模型属性 | `@RequestHeader` / `@CookieValue` / `@ModelAttribute` | 头名大小写不敏感；`@ModelAttribute` 偏传统表单 |
| 文件 / 原始对象 | `MultipartFile` / `HttpServletRequest` | 后者什么都能拿但**牺牲可测试性**，只留给取 IP、remoteUser 等少数场景 |

```java
@GetMapping("/list")
public Result<List<Order>> list(@RequestParam(defaultValue = "1") int page,
                                @RequestParam List<Long> ids, OrderQuery query) { ... }  // 末个是对象绑定
```
- **`List` 绑定的两种形式**：`?ids=1&ids=2`（重复参数名）是原生支持的标准写法；`?ids=1,2`（逗号串）能否直接拆开**取决于转换服务配置，不同 Boot 版本行为有差异，跨版本务必实测**——最稳是收成 `String idsRaw` 自己 `split`，或注册 `Converter<String, List<Long>>`。
> 注意：`@RequestBody` 的输入流**只能读一次**，Filter 里读过之后 Controller 拿到空 body（解法见第九节）。

---
## 五、HttpMessageConverter 与 Jackson 定制

- 读请求按 **`Content-Type`**、写响应按 **`Accept` + 返回值支持的媒体类型**，取 converter 链第一个匹配的。`String` 返回值默认走 `StringHttpMessageConverter`（原样输出、不带引号），对象走 Jackson——这就是"返回字符串为什么没引号 / 返回对象为什么变成了字符串"。要"XML 优先"这类需求，调整 converter 顺序 + 内容协商配置（`favorPathExtension` 已废弃）。
- `JacksonAutoConfiguration` 提供 `ObjectMapper` 并暴露 `spring.jackson.*`：`date-format`、`default-property-inclusion`、`serialization.write-dates-as-timestamps`、`deserialization.fail-on-unknown-properties=false`（前端多传字段不炸）。常用注解：`@JsonIgnore`、`@JsonProperty("user_name")`、**`@JsonFormat(pattern="yyyy-MM-dd HH:mm:ss", timezone="GMT+8")`（日期最稳，逐字段可控）**、`@JsonInclude(NON_NULL)`、`@JsonTypeInfo`（多态）。
- > 注意：`spring.jackson.date-format` **传统上作用于 legacy `java.util.Date`/`Calendar`**；`java.time.*` 由 `JavaTimeModule` 按 ISO-8601 处理，两者不共用同一格式化入口（不同版本表现有差异，**需按版本核对**），统一格式推荐逐字段 `@JsonFormat`；`java.time` API 见 `33-字符串与常用API.md`。自己 `@Bean ObjectMapper` 会**整体覆盖 Boot 默认**、`spring.jackson.*` 随之失效，只改局部请用 `Jackson2ObjectMapperBuilderCustomizer`。

**Long 精度丢失（面试 + 实战双高频）**：雪花 ID 是 64 位 Long，而 JS `Number` 只有 **53 位安全整数**（`9007199254740991`），前端拿到 `1850000000000000001` 会静默变 `1850000000000000000`。解法是全局把 Long 序列化成字符串：

```java
@Configuration
class JacksonConfig {
    @Bean Jackson2ObjectMapperBuilderCustomizer longToString() {
        return b -> b.serializerByType(Long.class, ToStringSerializer.instance)
                     .serializerByType(Long.TYPE,  ToStringSerializer.instance);
        // 反序列化方向默认能接受 "123" 字符串形式的数字；只想影响局部就在字段上加
        // @JsonSerialize(using = ToStringSerializer.class)，前端要算数请自己用 BigInt
    }
}
```

---
## 六、文件上传与下载

上传由 `MultipartResolver`（Boot 默认 `StandardServletMultipartResolver`，走容器实现）解析，Controller 只面对 `MultipartFile`；大小限制在 `spring.servlet.multipart.{max-file-size, max-request-size, file-size-threshold, location}`（单文件 / 整请求 / 转磁盘阈值 / 临时目录）。

```java
@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Result<String> upload(@RequestPart("file") MultipartFile file) throws IOException {
    if (file.isEmpty()) throw new BizException(400, "文件为空");
    Path t = dir.resolve(UUID.randomUUID() + suffixOf(file.getOriginalFilename()));
    file.transferTo(t.toFile());   // 落盘；大文件别转 byte[]，直接 OOM
    return Result.ok(t.getFileName().toString());
}
```
- 超限抛 **`MaxUploadSizeExceededException`**，必须在 `@RestControllerAdvice` 里**单独兜住**，否则用户看到 500。
- > 注意：**容器层还有独立限制项**（Tomcat 的 `maxSwallowSize`、`multipart-limit` 一类，名称与开关**需按版本核对**），只调 Spring 层可能被容器先拒甚至重置连接；Nginx 侧还有 `client_max_body_size`——**Spring / 容器 / 网关三层要同时放宽**。
- 下载：小文件 `ResponseEntity<Resource>`，大文件或边生成边发用 `StreamingResponseBody`；中文文件名交给 `ContentDisposition` 生成 `filename*=UTF-8''...`（RFC 5987/6266），别手拼引号：

```java
@GetMapping("/files/{id}")
public ResponseEntity<Resource> download(@PathVariable Long id) {
    Path p = resolveSafely(id);   // 必须校验：防 ../ 路径穿越
    var cd = ContentDisposition.attachment().filename("年度报告.pdf", StandardCharsets.UTF_8).build();
    return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
            .contentType(MediaType.APPLICATION_OCTET_STREAM).body(new PathResource(p));
}
```
- 上传文件**不能放 jar 内**：jar 是只读归档、重新部署即丢失。用外部卷/对象存储，静态资源靠 `spring.web.resources.static-locations` 映射（Boot 3 前缀；旧版 `spring.resources.*`，**需按版本核对**）。

---
## 七、参数校验（Bean Validation）

**先确认依赖** `spring-boot-starter-validation`：Boot 2.3 起校验 starter 被移出 web starter，**没引依赖时所有约束注解静默不生效**——这是"@Valid 没用"的第一大原因；Boot 3 / Spring 6 已全面迁到 **`jakarta.validation.*`**（老代码的 `javax.validation.*` 必须改）。**`@Valid` 是 Jakarta 标准注解**（含 `groups()`，用于参数与字段级联）；**`@Validated` 是 Spring 扩展**，支持分组，且**放在类上可开启方法级参数校验**（配合 `@NotNull @PathVariable Long id`）。

| 注解 | 可作用于 | 判失败条件 |
|---|---|---|
| **`@NotNull`** | 任意类型 | 仅 `== null`（空串、空集合都算**通过**） |
| **`@NotBlank`** | **只能 CharSequence** | null 或 `trim()` 后为空 |
| **`@NotEmpty`** | CharSequence / Collection / Map / 数组 | null 或长度/个数为 0（**不 trim**，`"  "` 通过） |
| `@Size(min,max)` | 字符串/集合/数组/Map | 长度或元素个数越界 |
| `@Min/@Max/@DecimalMin/@Digits` | 数字（含可转数的字符串） | 值越界 |
| `@Pattern` / `@Email` | 字符串 | 不匹配 / 格式非法；**两者对 null 都放行** |
| `@Future` / `@Past` / `@AssertTrue` | 日期时间 / boolean getter | 不在未来或过去 / 断言不成立 |

> 注意：除少数注解外 **Jakarta 校验对 null 一律视为通过**；字段"可能不传、传了要限格式"需 `@NotNull` + `@Pattern` 组合。**级联**只在标了 `@Valid` 处生效：集合要写 `List<@Valid ItemDto>`（元素级）或在字段上加 `@Valid`，否则元素**完全不校验**。

**分组校验**（新增不校验 id、修改必须带 id）：

```java
public interface Create {}  public interface Update {}
public class UserDto {
    @NotNull(groups = Update.class) private Long id;   // 仅修改场景要求
    @NotBlank @Size(max = 32)       private String name;
    @Email                          private String email;
    @Valid                          private List<ItemDto> items;   // 元素级级联
}
@PostMapping public Result<Long> create(@Validated(Create.class) @RequestBody UserDto d) { ... }
@PutMapping  public Result<Void> update(@Validated(Update.class)  @RequestBody UserDto d) { ... }
```

**三种校验异常触发场景不同（高频坑，必须在同一个 Advice 里分别兜住）**：

| 异常 | 什么时候抛 | 错误从哪取 |
|---|---|---|
| **`MethodArgumentNotValidException`** | `@Valid @RequestBody` 的 JSON 对象校验失败 | `getBindingResult().getFieldErrors()` |
| **`BindException`** | 表单 / query 参数绑定到对象后校验失败 | 同上 |
| **`ConstraintViolationException`** | **类上 `@Validated`** 的方法参数级校验失败 | `getConstraintViolations()` |
| `HttpMessageNotReadableException` | body 缺失 / JSON 语法错 / 类型不匹配（早于校验） | 给固定提示即可 |
| `HandlerMethodValidationException` | Spring 6 原生方法校验接管了部分原 `ConstraintViolationException` 场景 | **版本相关，需核对** |

```java
@RestControllerAdvice
@Slf4j
class GlobalExceptionHandler {
    private String msgs(BindingResult br) {
        return br.getFieldErrors().stream().map(f -> f.getField() + ": " + f.getDefaultMessage())
                 .collect(Collectors.joining("; "));
    }
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})  // 参数错：只 warn 不打栈
    Result<Void> handleValidation(Exception e) {
        BindingResult br = (e instanceof MethodArgumentNotValidException m)
                ? m.getBindingResult() : ((BindException) e).getBindingResult();
        return Result.fail(400, msgs(br));
    }
    @ExceptionHandler(ConstraintViolationException.class)
    Result<Void> handleConstraint(ConstraintViolationException e) {
        return Result.fail(400, e.getConstraintViolations().stream()
                .map(v -> lastPart(v.getPropertyPath()) + ": " + v.getMessage())
                .collect(Collectors.joining("; ")));
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    Result<Void> tooBig(MaxUploadSizeExceededException e) { return Result.fail(413, "文件超过大小限制"); }
}
```

---
## 八、全局异常处理

`@ControllerAdvice` 把 `@ExceptionHandler`/`@ModelAttribute`/`@InitBinder` 提到全局；**`@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`**。用 `basePackages`/`basePackageClasses`/`annotations` 限定作用范围（例如对外 API 与内部页面各一套出口）。

```java
@RestControllerAdvice(basePackages = "com.demo.web")
@Slf4j
class ApiExceptionHandler {
    @ExceptionHandler(BizException.class)                             // 可预期业务异常
    ResponseEntity<Result<Void>> handleBiz(BizException e) {
        log.warn("biz error code={} msg={}", e.getCode(), e.getMessage());
        return ResponseEntity.ok(Result.fail(e.getCode(), e.getMessage()));
    }
    @ExceptionHandler(Exception.class)                               // 兜底：必须打全栈
    ResponseEntity<Result<Void>> handleOther(Exception e) {
        log.error("unhandled error, uri={}", currentRequestUri(), e);  // traceId 由 MDC 自动带出
        return ResponseEntity.status(500).body(Result.fail(500, "服务繁忙，请稍后重试")); // 别透传 e.getMessage()
    }
}
```
- **复用 Spring 内置异常的 400/404/405/406/415 映射**：继承 `ResponseEntityExceptionHandler` 重写对应 `handleXXX`（Spring 6 签名已改用 `HttpStatusCode`），例如把 `handleHttpRequestMethodNotSupported` 改成返回 `Result.fail(405, ...)`。异常里的 **traceId**：拦截器 `preHandle` 里 `MDC.put("traceId", ...)` + `@Slf4j` 输出并回填响应体，链路检索见 `30-可观测性.md`。

| 状态码流派 | 做法 | 代价 |
|---|---|---|
| **HTTP 语义派** | 参数错 400、未登录 401、无权限 403、不存在 404、限流 429 | 监控按 5xx 报警、网关按 4xx 决定是否重试，语义清晰 |
| **业务码派（国内主流）** | 一律 200，body 里 `code != 0` 表示失败 | 监控**看状态码全是 200**、失败率失真，要靠日志埋点补；重试/熔断失去依据 |

折中约定：**框架与鉴权类错误保留 4xx/5xx，纯业务失败走 200 + code**，并在网关侧对"200 带错误码"单独打点——团队必须先定一个，别混用。
- > 注意：**不要在 `@Transactional` 方法里 catch 掉异常再"正常返回"**——Spring 靠异常触发回滚，吞掉后事务会提交（或延后抛 `UnexpectedRollbackException`），见 `39-Spring事务与传播机制.md`。同理 **`Error` 不该被兜**：`OutOfMemoryError`/`StackOverflowError` 是 JVM 级故障，`@ExceptionHandler(Throwable.class)` 一把抓会掩盖节点即将崩溃的事实（见 `04-异常处理.md`）。

---
## 九、Filter vs HandlerInterceptor vs AOP vs @ControllerAdvice（选型）

| 维度 | Filter | HandlerInterceptor | AOP `@Around` | `@RestControllerAdvice` |
|---|---|---|---|---|
| 规范归属 | Servlet 容器（`jakarta.servlet`） | SpringMVC | Spring AOP 代理 | SpringMVC 异常解析 |
| 触发范围 | **所有**进容器的请求（含静态资源） | 仅映射到 handler 的 MVC 请求 | 被代理 Bean 的匹配方法 | 抛到 MVC 层的异常 |
| 能拿到 | 原始 request/response，**不知道 handler** | `HandlerMethod`（注解/参数）、`getRemoteUser()` | 方法参数、返回值（可改可抛） | 异常对象 + 请求上下文 |
| 典型用途 | 编码、**CORS**、日志脱敏、body 缓存包装 | 鉴权、按注解放行、埋点计时 | 缓存、限流、事务、幂等 | 统一异常出口、统一响应包装 |
| 注册方式 | `@WebFilter`+`@ServletComponentScan`，或 `FilterRegistrationBean`（**推荐**） | `WebMvcConfigurer.addInterceptors` | `@Aspect` + `@Component` | `@RestControllerAdvice` |

```
Filter.doFilter(前半) → DispatcherServlet → Interceptor.preHandle（多个按 order；任一 false 即中断，
  其后 preHandle 不再执行）→ AOP 环绕前 → Controller → Service（事务）→ AOP 环绕后
  → Interceptor.postHandle（仅正常路径）→ 异常则 HandlerExceptionResolver
  → Interceptor.afterCompletion（一定走，带 Exception）→ Filter 响应后代码
```

```java
@Override public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(new AuthInterceptor()).addPathPatterns("/api/**")
            .excludePathPatterns("/api/login", "/api/public/**", "/error", "/actuator/**");
}
```
- **`afterCompletion` 在响应处理之后执行**，是清理 `ThreadLocal`（用户上下文、数据源 key）的正确位置；放 `postHandle` 会在异常路径漏执行，线程复用时上下文串号。
- **重复读 body（真实坑）**：`getInputStream()` 只能消费一次。`ContentCachingRequestWrapper` 只是把**下游读过的字节旁存一份**供事后 `getContentAsByteArray()` 查看，**不能**让下游重读；要"多处都能读"必须自己写 wrapper：构造时把 body 全量读进 `byte[]`，重写 `getInputStream()`/`getReader()` 每次返回新流。
- **多 Filter 顺序**由 `@Order`/`Ordered`/`setOrder` 决定；**Spring Security 的过滤器链默认排在很前**，手写 CORS 挂在其后就收不到预检（见第十节与 `22-SpringSecurity与OAuth2与JWT.md`）。

---
## 十、CORS 与跨域

**同源策略**由**浏览器**实施：协议 + 主机 + 端口全同才同源（`localhost:5173` vs `localhost:8080` 不同源）。服务端本来就收得到请求，是浏览器拦掉了响应——这就是"Postman 通、浏览器不通"的原因。**预检（preflight）**：满足任一条件先发 `OPTIONS`（带 `Access-Control-Request-Method/Headers`），通过后才发真实请求——① 方法非 `GET/POST/HEAD`；② `Content-Type` 不在 `text/plain`/`multipart/form-data`/`application/x-www-form-urlencoded` 之列（**`application/json` 必然触发预检**）；③ 带自定义头（`Authorization`、`X-Trace-Id`）。`Access-Control-Max-Age` 决定浏览器缓存预检的秒数，配大可显著减少 `OPTIONS` 量。

| 方式 | 粒度 / 推荐度 |
|---|---|
| `@CrossOrigin` 标 Controller 或方法 | 单接口；★ 配置散落，难与安全链协同 |
| `WebMvcConfigurer.addCorsMappings` | 按路径的映射；★★★★ 日常首选 |
| `CorsFilter` / `UrlBasedCorsConfigurationSource` | 容器最前端；★★★★★ 需与 Security 协同或全站统一时用 |

```java
@Override public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
            .allowedOriginPatterns("https://*.example.com")    // 带凭证时必须用 Patterns，见下
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*").exposedHeaders("Content-Disposition")  // 前端才读得到下载文件名
            .allowCredentials(true).maxAge(3600);
}
```
- **`allowedOrigins` 要求精确来源；`allowedOriginPatterns` 支持通配子域/端口。**
- > 注意（必考）：**`allowCredentials(true)`（要带 Cookie）时 `Access-Control-Allow-Origin` 不能是 `*`**，浏览器会直接拒绝；正确做法是用 `allowedOriginPatterns` 回显**具体来源**（Spring 会自动加 `Vary: Origin`）。
- **与安全链共存**：CORS 必须在 Security 之前处理，否则无凭证的 `OPTIONS` 被认证拦成 **401/403**，表现为"GET 能通、POST 全挂"。做法：注册 `CorsFilter` 给最高优先级，或在 `SecurityFilterChain` 里 `http.cors(withDefaults())` + 提供 `CorsConfigurationSource` Bean（细节在 `22-SpringSecurity与OAuth2与JWT.md`）。
- **生产建议跨域统一交给网关/Nginx**：一处配置、多服务共享、换域名只改一处（见 `29-Kubernetes部署.md`、`24-消息队列与微服务.md`）。前端 `vite`/`webpack devServer proxy` 只是**开发期同源化**（由 dev server 转发，压根不存在跨域），上线即失效，不是解决方案。

---
## 十一、REST 设计与统一响应体

- 资源用**名词复数**、层级表达归属（`/api/v1/users/{id}/orders`），别把动词塞 URL；版本前缀 `/api/v1` 最直观，`produces` 内容协商版本更正统但前端难调。幂等性是重试的前提：**只有幂等方法才允许网关自动重试**（与 24 / 27 的消费端幂等呼应）。

| 方法 | GET | POST | PUT | PATCH | DELETE |
|---|---|---|---|---|---|
| 语义 | 查 | 建 / 复杂动作 | 全量替换 | 局部更新 | 删 |
| 幂等 / 安全 | 是 / 是 | **否** / 否 | 是 / 否 | 视实现 / 否 | 是 / 否 |

```java
public record Result<T>(int code, String message, T data, String traceId) {
    public static <T> Result<T> ok(T d) { return new Result<>(0, "ok", d, MDC.get("traceId")); }
    public static <T> Result<T> fail(int c, String m) { return new Result<>(c, m, null, MDC.get("traceId")); }
}   // 分页统一 { list, page, size, total }，不要各接口各写一套
```
> 注意：全局包装返回体（`ResponseBodyAdvice`）会与 `ResponseEntityExceptionHandler`、文件下载、Actuator 端点打架——**凡是自定义 `ResponseEntity` 的场景要能被跳过**，否则字节流被包成 JSON。

---
## 十二、接口文档与调试

- **springdoc-openapi**（Boot 3 用 `springdoc-openapi-starter-webmvc-ui`）：`@OpenAPIDoc` 分组、`@Operation(summary=...)`、`@Schema(description=..., example=...)`，自带 Swagger UI；**旧 springfox（`@ApiModelProperty`）与 Boot 3 / Spring 6 不兼容**，迁移必换。
- 测试：`@WebMvcTest(OrderController.class)` 只起 MVC 切片 + `MockMvc` 断言状态码与 JSON 路径，校验/异常分支最值得测（`17-单元测试JUnit与Mockito.md`）。排障：Actuator `mappings` 端点列出全部注册映射（404 先看映射在不在，配置见 `13-SpringBoot.md`），`logging.level.org.springframework.web=DEBUG` 打开分发日志。

---
## 十三、易错与面试答题模板

> **① 讲一次请求的完整链路**：容器接收 → Filter 链 → DispatcherServlet → HandlerMapping 定位 handler（Interceptor.preHandle）→ HandlerAdapter 用 ArgumentResolver 绑定并校验 → Controller（外层 AOP/事务）→ ReturnValueHandler：`@ResponseBody` 走 HttpMessageConverter，否则 ViewResolver → postHandle → 异常走 HandlerExceptionResolver → afterCompletion → 回溯 Filter 写响应。
> **② Filter vs Interceptor 五点**：规范层（Servlet vs SpringMVC）、触发范围（全部请求 vs 命中 handler）、能否拿到 handler 与方法注解（不能 vs 能）、执行位置（外圈 vs 内圈）、典型用途（编码/CORS/body 包装 vs 鉴权/埋点/按注解放行）。
> **③ 三种校验异常分别是谁**：`@RequestBody`+`@Valid` → `MethodArgumentNotValidException`；表单/对象绑定 → `BindException`；类上 `@Validated` 的方法参数约束 → `ConstraintViolationException`。三者都要在同一个 Advice 里兜住。
> **④ `@Valid` 不生效四条**：没引 `spring-boot-starter-validation`；参数前忘了写 `@Valid`/`@Validated`（只给字段加注解不会触发）；方法级校验时**类上没加 `@Validated`**；级联缺失（嵌套对象/集合元素没写 `@Valid`）。另注：非 public 方法、不被 Spring 管理的 Bean 上的校验同样不生效。
> **⑤ `@NotNull`/`@NotBlank`/`@NotEmpty`**：null；CharSequence 且 null 或 trim 后空；null 或长度/个数为 0（集合/数组/Map/字符串，不 trim）。
> **⑥ 跨域**：`allowCredentials=true` 时 origin 不能是 `*`，要用 `allowedOriginPatterns`；与 Security 并存时 CORS 必须排在安全链之前，否则预检 401。
> **⑦ Long 精度丢失**：JS 只有 53 位安全整数，雪花 ID 全局 `ToStringSerializer` 转字符串。
> **⑧ `@RequestBody` 只能读一次**：Filter 读过就要自定义 wrapper 缓存 body；`ContentCachingRequestWrapper` 只供事后查看、不能重放。

---
## 十四、与系列其他文档的关系

- `13-SpringBoot.md`：那篇讲怎么起服务、写接口、外部化配置与 Actuator；本篇讲请求在框架内部的流转与扩展点。`14-Spring核心IoC与AOP.md`：第九节选型表第三层（AOP 代理）；`40-Bean生命周期与循环依赖.md`：`WebMvcConfigurer` 如何被收集、`@ControllerAdvice` 何时被扫描成 Bean。
- `31-反射与注解.md`：参数解析、注解驱动分发、`HandlerMethod` 的反射调用都建立在它之上。`17-单元测试JUnit与Mockito.md`：`@WebMvcTest` 切片测试；`33-字符串与常用API.md`：`java.time` 与 Jackson 日期格式化。
- `22-SpringSecurity与OAuth2与JWT.md`：安全过滤器链与 CORS 的先后顺序、预检被 401 的根因；`39-Spring事务与传播机制.md`：第八节"catch 掉异常导致不回滚"的完整解释；`04-异常处理.md`：为什么 `Error` 不该被全局兜住。
- `26-WebFlux响应式编程.md`：完全没有 Servlet/Filter/Interceptor 那套，`WebFilter` 属另一体系；`10-虚拟线程.md`：MVC 阻塞栈在 Java 21 下的吞吐改造入口。
- `30-可观测性.md`：traceId 进 MDC、日志与链路关联、统一响应体里的 traceId 字段；`29-Kubernetes部署.md` / `24-消息队列与微服务.md`：跨域、限流、请求体上限等横切能力下沉到 Nginx/网关的取舍。
