# Nacos 知识总纲

> 定位：阿里巴巴开源的**动态服务发现、配置管理、服务管理平台**，一个产品同时覆盖注册中心与配置中心。
> 衔接：`microservices/README.md`（服务发现/配置中心选型）、`springboot/README.md`（Spring Cloud 集成）。

---

## 目录

- [一、Nacos 是什么](#一nacos-是什么)
- [二、核心概念](#二核心概念)
- [三、服务注册与发现](#三服务注册与发现)
- [四、配置管理](#四配置管理)
- [五、与 Spring Cloud 集成](#五与-spring-cloud-集成)
- [六、Namespace / Group / Data ID](#六namespace--group--data-id)
- [七、一致性协议（CP/AP）](#七一致性协议cpap)
- [八、集群部署](#八集群部署)
- [九、最佳实践](#九最佳实践)
- [十、常见面试考点](#十常见面试考点)

---

## 一、Nacos 是什么

Nacos = **Na**ming + **Co**nfiguration + **S**ervice，核心两大能力：

1. **服务发现（Naming）**：服务注册、健康检查、负载均衡清单下发。
2. **配置管理（Config）**：动态配置、灰度发布、监听变更、配置回滚。

> 在微服务体系中，它常**同时替代** Eureka（注册中心）与 Spring Cloud Config（配置中心）。

---

## 二、核心概念

| 概念 | 说明 |
|------|------|
| Service | 一个微服务（如 `user-service`） |
| Instance | 服务的一个实例（IP:PORT） |
| Namespace | 租户隔离（常用于 env：dev/test/prod） |
| Group | 服务/配置分组（逻辑聚合） |
| Data ID | 配置项的唯一标识（`应用名.yml`） |
| Cluster | 实例的集群划分（同机房优先调用） |

---

## 三、服务注册与发现

### 3.1 注册流程

1. 服务启动时，向 Nacos Server 发送 `register` 请求，写入自身元数据（IP、端口、权重、健康状态）。
2. Nacos 定期进行**健康检查**（客户端心跳 / 服务端探测）。
3. 消费者拉取（或订阅推送）服务实例列表，配合本地负载均衡调用。

### 3.2 健康检查

- **临时实例**：客户端心跳（默认 5s，15s 超时则剔除）。
- **持久实例**：服务端主动探测（TCP/HTTP/MySQL 探测）。
- 临时实例基于 **Distro 协议**（AP，高可用）；持久实例基于 **Raft**（CP，强一致）。

### 3.3 客户端调用（Spring Cloud Alibaba）

```java
@FeignClient(name = "user-service")   // 名称即 Nacos 注册的服务名
public interface UserClient {
    @GetMapping("/{id}")
    User getById(@PathVariable("id") Long id);
}
```

- 配合 `@LoadBalanced` `RestTemplate` 或 OpenFeign，自动从 Nacos 拉取实例并负载均衡。

---

## 四、配置管理

`bootstrap.yml`（优先级高于 application.yml）：

```yaml
spring:
  application:
    name: user-service
  cloud:
    nacos:
      config:
        server-addr: nacos.example.com:8848
        file-extension: yaml
        group: DEFAULT_GROUP
        namespace: prod                       # 命名空间 ID
        refresh-enabled: true                 # 支持 @RefreshScope 热更新
```

```java
@RestController
@RefreshScope                  // 配置变更自动刷新 Bean
public class ConfigController {
    @Value("${feature.newUI:false}")
    private boolean newUI;
}
```

- 监听机制：客户端长轮询（30s）+ 服务端变更推送，秒级感知配置改动。
- 灰度：基于 `Beta` 发布（按 IP 白名单）先行验证。

---

## 五、与 Spring Cloud 集成

依赖（`spring-cloud-alibaba`）：

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

启动类开启注册发现：

```java
@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

---

## 六、Namespace / Group / Data ID

三者构成配置的"三维定位"，典型用法：

- **Namespace**：环境隔离（`dev` / `test` / `prod` 各自独立空间，互不可见）。
- **Group**：业务分组（如 `ORDER_GROUP`、`USER_GROUP` 聚合相关配置）。
- **Data ID**：具体配置文件，约定 `应用名-激活profile.后缀`（如 `user-service-prod.yaml`）。

> 最佳实践：**Namespace 区分环境，Group 区分业务域，Data ID 区分应用与 profile。**

---

## 七、一致性协议（CP/AP）

Nacos 同时支持两种模式，可按场景切换：

- **AP 模式（Distro）**：临时实例，牺牲强一致换可用性，适合注册中心对可用性的高要求。
- **CP 模式（Raft）**：持久实例 + 配置管理，需强一致，选主后写入多数派才生效。
- 通过 `spring.cloud.nacos.discovery.ephemeral=true/false` 选择实例类型。

---

## 八、集群部署

- 至少 **3 节点**组成集群，使用 **MySQL**（外部存储）持久化配置与元数据。
- 集群节点通过 Raft 选主，对外以 VIP / Nginx / SLB 暴露统一地址。
- 推荐架构：`Nginx(LB) → Nacos × 3（Raft）→ MySQL 主从`。

---

## 九、最佳实践

1. 生产用**集群 + 外部 MySQL**，杜绝单点。
2. 多环境用 **Namespace 隔离**，避免配置串味。
3. 敏感配置放在 **Secret + Nacos 加密插件**，不要明文。
4. 客户端开启**本地快照（failover）**：Nacos 宕机时仍能加载上次配置启动。
5. 配置变更走**灰度/Beta** 验证再全量。
6. 注册中心与配置中心可分离部署，按负载独立扩缩。

---

## 十、常见面试考点

1. **Nacos 同时解决什么问题？** → 注册中心 + 配置中心（替代 Eureka + Config）。
2. **AP 还是 CP？还是都支持？** → 都支持；临时实例走 AP（Distro），持久实例与配置走 CP（Raft）。
3. **服务是怎么被发现的？** → 实例注册 + 心跳健康 + 客户端订阅（拉取 + 推送）。
4. **Nacos 和 Eureka 区别？** → Nacos 支持 CP/AP 切换、配置管理、健康检查更丰富、性能更好。
5. **配置热更新原理？** → 客户端长轮询 + 服务端变更推送，`@RefreshScope` 重建 Bean。
6. **Namespace/Group/Data ID 怎么用？** → 环境/业务域/应用-profile 的三层定位。
7. **CAP 怎么取舍？** → 注册发现侧重可用（AP），配置与持久元数据侧重一致（CP）。
