# 22 - Spring Security / OAuth2 / JWT（认证授权）

> 来源：Spring Security 官方参考文档（最新稳定版 6.5.6，docs.spring.io）
> 官方章节：https://docs.spring.io/spring-security/reference/6.5/7.0/servlet/oauth2/resource-server/index.html
> 补充：Spring Authorization Server（独立项目）、JWT 标准（RFC 7519）
> 说明：官方文档为 JS 渲染页，已确认最新稳定版 **6.5.6** 与 OAuth2 章节结构；下列组件与用法基于 Spring Security 6 标准 API 整理。

Spring Security 是 Spring 生态的安全基石，覆盖认证（Authentication）、授权（Authorization）、防护（CSRF/CORS 等）。

---

## 一、核心概念

- **Authentication（认证）**：你是谁——校验凭证（用户名密码、Token）。
- **Authorization（授权）**：你能做什么——基于角色/权限拦截访问。
- **SecurityFilterChain**：Spring Security 6 用 `SecurityFilterChain` Bean 声明规则（取代旧 `WebSecurityConfigurerAdapter`）。
- **Principal**：当前登录主体（如 `UserDetails`）。

---

## 二、Spring Security 6 配置（表单/HTTP 基础）

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .formLogin(form -> form.permitAll())
            .csrf(csrf -> csrf.disable());   // 无状态 API 通常关闭 CSRF
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();   // 密码哈希（不可逆）
    }
}
```

- 认证管理器：`AuthenticationManager` + `UserDetailsService`（加载用户）+ `PasswordEncoder`（校验密码）。
- `hasRole("ADMIN")` 对应权限 `ROLE_ADMIN`；`hasAuthority("USER:READ")` 精确权限。

---

## 三、JWT（JSON Web Token）

无状态认证的主流方案（RFC 7519），由三部分组成：`header.payload.signature`（base64url 点分隔）。

### 生成（登录成功后）
```java
public String generateToken(UserDetails u) {
    return Jwts.builder()
        .subject(u.getUsername())
        .claim("roles", u.getAuthorities())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + 3600_000))  // 1h
        .signWith(secretKey)                 // HS256 对称签名
        .compact();
}
```

### 校验（过滤器中）
```java
// 每个请求：取 Authorization: Bearer <token> → 解析 → 设 SecurityContext
String username = Jwts.parser().verifyWith(secretKey)
    .build().parseSignedClaims(token).getPayload().getSubject();
```

- 标准库：`jjwt`（io.jsonwebtoken）或 `spring-security-oauth2-jose` 的 `JwtEncoder`/`JwtDecoder`。
- 优点：服务端无会话、易横向扩展；缺点：注销需黑名单/短过期+刷新。

---

## 四、OAuth2 资源服务器（Resource Server）

> 官方文档确认（6.5.6）：Spring Security 支持用 **JWT** 或 **Opaque Token** 两种 Bearer Token 保护端点，适用于应用把授权委托给授权服务器（如 Okta、Auth0、Keycloak）的场景。

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(a -> a.anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));  // 用 JWT 校验
    return http.build();
}
```

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/demo   # 自动获取 JWKS 公钥
```

- **资源服务器**：校验 Token、解析 `scope`/角色，不含登录页。
- **授权服务器**：发放 Token（Spring Authorization Server 独立项目，或 Keycloak/Auth0）。
- **客户端 / OAuth2 登录**：对接第三方（Google/GitHub）登录。

### 角色从 JWT 提取
```java
.oauth2ResourceServer(o -> o.jwt(j -> j
    .jwtAuthenticationConverter(jwt -> {
        var roles = jwt.getClaimAsStringList("roles");
        var auths = roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_"+r)).toList();
        return new JwtAuthenticationToken(jwt, auths);
    })));
```

---

## 五、方法级安全（@PreAuthorize）

```java
@EnableMethodSecurity   // 替代旧 @EnableGlobalMethodSecurity
@Service
public class OrderService {
    @PreAuthorize("hasRole('ADMIN') or #user == authentication.name")
    public Order getOrder(String user) { ... }
}
```

- `@PreAuthorize` / `@PostAuthorize` / `@Secured`：在方法上细粒度控制。

---

## 六、与其他方案的关系

| 方案 | 场景 |
|---|---|
| Session-Cookie | 传统单体 Web（有状态） |
| JWT | 前后端分离 / 微服务（无状态） |
| OAuth2 资源服务器 | 对接统一授权中心 / 第三方登录 |
| Spring Authorization Server | 自建授权服务器 |

> 生产建议：内网微服务用 JWT（自签）+ 网关统一校验；对外用 OAuth2 + 授权服务器（Keycloak）。

---

## 七、与系列其他文档的关系

- 认证才能取 `AuditorAware`（21 篇审计用当前用户）。
- 对比 Nest（Passport/JWT，见 `技术文档/nest`）：Nest 的 `@UseGuards()` + JWT 策略与 Spring `@PreAuthorize` + 资源服务器高度对应。
- 网关统一鉴权见 `24-消息队列-微服务.md`；Token 存入 Redis 见 `23-redis-cache.md`。
- 密码哈希 BCrypt 与前端无直接关系，是后端职责。
