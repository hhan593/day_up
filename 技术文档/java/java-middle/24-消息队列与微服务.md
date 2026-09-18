# 24 - 消息队列 / 微服务（Kafka、Spring Cloud、RabbitMQ）

> 来源：
> - Spring for Apache Kafka 官方概览（docs.spring.io，2026-08-20 更新）：https://docs.spring.io/spring-kafka/reference/index.html
> - Spring Cloud 官方文档（LoadBalancer 2026-08-21 更新）：https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html
> - RabbitMQ 官方教程（rabbitmq.com）+ Spring AMQP 标准 API
> 说明：官方页确认版本与章节结构；下列组件用法基于 Spring 标准 API 整理，并标注可信度。

本篇覆盖异步消息（Kafka / RabbitMQ）与微服务基础设施（注册中心 / 配置 / 网关 / 负载均衡）。

---

## 一、消息队列的价值

- **解耦**：生产者不依赖消费者。
- **异步**：请求快速返回，重活后台做。
- **削峰**：突发流量进队列，消费者按能力消费。
- **可靠**：持久化 + 确认机制防丢失。

---

## 二、Spring for Apache Kafka

> 官方概览（2026-08-20）：Spring for Apache Kafka 将核心 Spring 概念应用于 Kafka 消息开发。

### 1. 生产者
```java
@Autowired KafkaTemplate<String, String> kafkaTemplate;

public void send(String topic, String msg) {
    kafkaTemplate.send(topic, msg);             // 异步发送
    // 带回调
    kafkaTemplate.send(topic, msg).whenComplete((r, e) -> {
        if (e == null) System.out.println("发送成功 offset=" + r.getRecordMetadata().offset());
    });
}
```

### 2. 消费者（@KafkaListener）
```java
@KafkaListener(topics = "order-created", groupId = "order-group")
public void consume(OrderEvent event) {
    orderService.handle(event);
}
```

- `groupId`：消费组，同组多实例**均分分区**（横向扩展）；不同组**都收到**（发布订阅）。
- 配置：`spring.kafka.bootstrap-servers=localhost:9092`、`consumer.group-id` 等。
- 顺序性：同 partition 内有序；需要分区键保证同业务 ID 落同分区。

### 3. Kafka 核心概念
- **Topic**：逻辑主题；**Partition**：物理分片（并行度）。
- **Offset**：消费位移；**Consumer Group**：消费组。
- **Ack**：`acks=all` 保证不丢；**幂等/事务**：`enable.idempotence=true`。

---

## 三、RabbitMQ（Spring AMQP）

- 模型：Exchange → Binding → Queue；消息经 Exchange 路由到 Queue。
- 交换机类型：`direct`（精确 routingKey）、`topic`（通配符）、`fanout`（广播）、`headers`。

```java
// 发送
@Autowired RabbitTemplate rabbitTemplate;
rabbitTemplate.convertAndSend("order.exchange", "order.created", event);

// 监听
@RabbitListener(queues = "order.queue")
public void onOrder(OrderEvent e) { ... }
```

- 对比 Kafka：RabbitMQ 适合任务分发、复杂路由、低延迟；Kafka 适合高吞吐日志流、事件溯源、流处理。

---

## 四、微服务基础设施（Spring Cloud）

> 官方文档确认（2026-08-21）：Spring Cloud LoadBalancer 为每个 service id 创建子上下文，提供服务端负载均衡。

### 1. 服务注册与发现（Eureka / Nacos / Consul）
```yaml
spring:
  application: { name: order-service }
eureka:
  client: { service-url: { defaultZone: http://localhost:8761/eureka } }
```
- 服务启动时注册自己，调用方从注册中心查可用实例。

### 2. 客户端负载均衡（Spring Cloud LoadBalancer）
```java
@Bean
public RestClient.Builder restClientBuilder() { return RestClient.builder(); }

// 用服务名调用，自动负载均衡
restClient.get().uri("http://user-service/api/users/1").retrieve().body(User.class);
```
- `@LoadBalanced` 标注的 `RestTemplate` / `WebClient` / `RestClient` 支持按服务名解析。

### 3. 配置中心（Spring Cloud Config / Nacos）
- 配置外置到 Git / Nacos，动态刷新（`@RefreshScope`）。

### 4. API 网关（Spring Cloud Gateway）
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order
          uri: lb://order-service         # lb:// 走负载均衡
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
```
- 统一入口、路由、鉴权、限流、熔断。

### 5. 熔断与限流（Resilience4j）
```java
@CircuitBreaker(name = "order", fallbackMethod = "fallback")
public Order getOrder(Long id) { ... }
public Order fallback(Long id, Throwable t) { return Order.empty(); }
```
- 防雪崩：熔断（失败率超阈值打开）、限流（令牌桶）、重试、舱壁隔离。

---

## 五、微服务典型架构

```
客户端
  └─ Gateway（鉴权/路由/限流）
       ├─ user-service   ─┐
       ├─ order-service  ─┤ 注册中心 Eureka/Nacos
       ├─ product-service ─┘
       │   服务间调用（OpenFeign + LoadBalancer）
       ├─ MQ（Kafka/Rabbit）异步解耦
       ├─ Redis（缓存/会话，见 23）
       └─ Config Server（配置中心）
```

- **OpenFeign**：声明式 HTTP 客户端（接口 + 注解即调用）。
- **Sleuth/Micrometer + Tracing**：链路追踪（配合 Zipkin）。

---

## 六、与系列其他文档的关系

- 缓存用 Redis（23）；鉴权在网关统一校验 JWT（22）。
- 数据库访问（19/20/21）在各自 service 内。
- 对比 Nest 微服务（见 `技术文档/nest`）：Nest 也支持 Kafka/RabbitMQ 传输层、网关模式，概念对应。
- 异步消费配合虚拟线程（10）可提升处理吞吐；Kafka 消费逻辑阻塞时优先用虚拟线程执行器。
- 对比 Node（事件循环）：Kafka 消费者是多线程拉取，并发模型更接近 Java 线程池 + 虚拟线程。
