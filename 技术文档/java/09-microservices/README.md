# 微服务架构知识总纲

> 定位：把单体应用拆分为**可独立开发、部署、伸缩**的小服务，围绕业务能力组织团队。
> 衔接：`02-java-middle/24-消息队列与微服务.md`（Spring Cloud 代码层：注册发现/网关/熔断）、`02-java-middle/30-可观测性.md`（总纲第十节链路追踪深挖）、`08-springboot/README.md`（单服务实现）、`11-nacos/README.md`（注册/配置）、`15-kubernetes/README.md`（编排）、`14-docker/README.md`（容器化）。

---

## 目录

- [一、什么是微服务](#一什么是微服务)
- [二、优缺点](#二优缺点)
- [三、服务拆分原则](#三服务拆分原则)
- [四、服务通信](#四服务通信)
- [五、服务注册与发现](#五服务注册与发现)
- [六、API 网关](#六api-网关)
- [七、配置中心](#七配置中心)
- [八、服务容错：熔断限流降级](#八服务容错熔断限流降级)
- [九、分布式事务](#九分布式事务)
- [十、链路追踪与可观测](#十链路追踪与可观测)
- [十一、服务安全与鉴权](#十一服务安全与鉴权)
- [十二、常见面试考点](#十二常见面试考点)

---

## 一、什么是微服务

- 由 Martin Fowler 提出：把单个应用拆成一组**小型、松耦合、可独立部署**的服务。
- 每个服务：独立进程、独立数据库（Database per Service）、围绕业务能力、由小团队拥有。
- 对比单体：单体部署简单但耦合重、扩缩只能整体；微服务独立但运维复杂。

---

## 二、优缺点

| 优点 | 缺点 |
|------|------|
| 独立部署、故障隔离 | 分布式复杂度高（网络、一致性） |
| 技术栈灵活 | 运维/监控/链路追踪成本高 |
| 按需伸缩（热点服务单独扩） | 分布式事务难 |
| 团队边界清晰（康威定律） | 数据一致性、调试困难 |
| 更易持续交付 | 服务治理（发现/配置/容错）必要 |

---

## 三、服务拆分原则

- **单一职责 / 高内聚低耦合**：按业务域（DDD 限界上下文）拆分，如用户、订单、库存。
- **Database per Service**：服务私有数据，禁止别的服务直连其库（通过 API 访问）。
- **康威定律**：组织沟通结构决定系统结构。
- **粒度适中**：别过度拆分（"纳米服务"反而增加开销）；先粗后细。
- **AKF 扩展立方体**：X（水平复制）、Y（按功能拆分）、Z（按数据/租户分片）。

---

## 四、服务通信

### 4.1 同步（REST / gRPC）

- REST + JSON：简单通用，跨语言，性能一般。
- gRPC：基于 HTTP/2 + Protobuf，强类型、低延迟、双向流，内部高性能场景优选。

```java
// OpenFeign 声明式 HTTP 客户端（底层用 Nacos 做服务发现）
@FeignClient(name = "order-service")
public interface OrderClient {
    @PostMapping("/orders")
    OrderDTO create(@RequestBody OrderReq req);
}
```

### 4.2 异步（消息队列）

- Kafka / RabbitMQ / RocketMQ：解耦、削峰、最终一致（见 `02-java-middle/24-消息队列与微服务.md`）。
- 事件驱动（Event-Driven）：服务发事件、订阅方消费，降低直接依赖。

---

## 五、服务注册与发现

- 问题：实例 IP 动态变化，调用方无法硬编码地址。
- 方案：服务启动时**注册**到注册中心（Nacos/Eureka/Consul），调用方**订阅**实例列表 + 负载均衡。
- 详细见 `11-nacos/README.md`。

---

## 六、API 网关

- 统一入口，承担：路由、认证、限流、日志、灰度、协议转换。
- 常见：Spring Cloud Gateway（见 `02-java-middle/22-SpringSecurity与OAuth2与JWT.md`）、Kong、APISIX。
- 典型路由：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-route
          uri: lb://user-service          # lb:// 走服务发现
          predicates: [Path=/api/user/**]
          filters: [StripPrefix=2, name=RequestRateLimiter]
```

---

## 七、配置中心

- 问题：多服务、多环境配置散落、改配置要重启。
- 方案：集中管理 + 动态推送（Nacos / Apollo / Spring Cloud Config）。
- 详见 `11-nacos/README.md#四配置管理`。

---

## 八、服务容错：熔断限流降级

- **雪崩**：一个服务慢，线程/连接耗尽，拖垮调用链。
- **熔断（Circuit Breaker）**：错误率超阈值则快速失败，半开探测恢复（Sentinel/Hystrix）。
- **限流（Rate Limit）**：令牌桶/漏桶，保护自身（网关 + Sentinel 双重限流）。
- **降级（Fallback）**：非核心功能失败时返回默认/缓存值。
- **超时 + 重试**：重试要配合幂等，避免放大故障。
- **隔离**：线程池隔离 / 信号量隔离，防止单依赖拖垮全局。

```java
@SentinelResource(value = "createOrder", fallback = "fallback")
public Order create(OrderReq req) { ... }
public Order fallback(OrderReq req, Throwable t) { return Order.DEGRADED; }
```

---

## 九、分布式事务

- 难点：跨库/跨服务无法用本地 `@Transactional`。
- **两阶段提交（2PC）**：强一致但锁资源、性能差，少用。
- **TCC**（Try-Confirm-Cancel）：业务侵入强，性能较好。
- **本地消息表 / 事务消息**（RocketMQ）：可靠消息 + 最终一致。
- **Saga**：长事务拆成一系列本地事务 + 补偿。
- 框架：**Seata**（AT 模式对业务侵入小，常用）、RocketMQ 事务消息。
- 原则：优先**最终一致性**而非强一致；能避免分布式事务就避免（聚合/本地化）。

---

## 十、链路追踪与可观测

- 三大支柱：**Metrics（指标）/ Logs（日志）/ Traces（链路）**。
- 链路追踪：每个请求生成 `TraceId`，跨服务透传（`traceparent` / B3），聚合到 Jaeger/Zipkin。
- 技术栈：**OpenTelemetry** 采集 → Jaeger 展示；Prometheus 抓指标；ELK/Loki 收日志。
- 结合 K8s 探针（见 `15-kubernetes/README.md#八探针与自愈`）实现自愈。

---

## 十一、服务安全与鉴权

- 网关统一认证（JWT/OAuth2），内部服务互信用 mTLS。
- 详情见 `02-java-middle/22-SpringSecurity与OAuth2与JWT.md`。
- 零信任：每个请求都校验；敏感服务网络策略隔离。

---

## 十二、常见面试考点

1. **微服务 vs 单体？** → 独立部署/伸缩/技术栈 vs 简单/强一致。
2. **如何拆分服务？** → DDD 限界上下文、单一职责、Database per Service。
3. **服务之间怎么通信？** → 同步（REST/gRPC/Feign）+ 异步（MQ）。
4. **怎么保证服务可用（雪崩）？** → 熔断、限流、降级、超时、隔离、重试+幂等。
5. **分布式事务怎么解？** → 最终一致优先（Seata AT / 事务消息 / Saga/TCC）。
6. **CAP 在微服务中如何体现？** → 注册中心常选 AP（可用）；配置/交易需 CP（一致）。
7. **链路追踪原理？** → TraceId 透传 + 各 Span 上报聚合。
8. **网关作用？** → 路由、鉴权、限流、灰度、日志统一入口。
9. **数据一致性难点？** → 每个服务私有库，跨服务需事件/补偿，放弃强一致。
10. **服务发现为什么必要？** → 实例地址动态，需注册中心解耦调用方与提供方。
