# 27. Kafka 与 Java 流式处理

> 来源可信度：**官方文档确认**（基于 Apache Kafka Java Client、Spring Kafka 官方文档；与 `24-messaging-microservices.md` 衔接）
> 关联：Go `19-microservices-messaging.md`

## 1. Kafka 核心概念

- **Topic**：消息分类；**Partition**：分区，并行单位。
- **Producer** 发、**Consumer** 拉；**Consumer Group** 做负载（同组一条消息只消费一次）。
- **Offset**：消费进度，Kafka 持久化。

## 2. Spring Kafka 生产/消费

```java
// 生产者
@Autowired KafkaTemplate<String, String> template;
template.send("orders", orderJson);

// 消费者
@KafkaListener(topics = "orders", groupId = "svc-a")
public void listen(String msg) {
    process(msg);
}
```

- `@KafkaListener` 声明式消费；`KafkaTemplate` 发。
- 与 `24-messaging-microservices.md` 的 Spring Cloud Stream 互补。

## 3. 精确一次（Exactly-Once）

```java
props.put("enable.idempotence", "true");        // 幂等生产
props.put("isolation.level", "read_committed"); // 事务消费
```

- 幂等 producer + 事务 = EOS，避免重复/丢失。

## 4. Kafka Streams（流处理）

```java
StreamsBuilder builder = new StreamsBuilder();
KStream<String, Order> orders = builder.stream("orders");
orders.filter((k, v) -> v.amount > 100)
      .to("big-orders");
KafkaStreams streams = new KafkaStreams(builder.build(), config);
streams.start();
```

- 做实时聚合、窗口、join；对比 Flink/Spark Streaming。

## 5. 与 Go 对照

| | Java (Spring Kafka) | Go (kafka-go) |
|---|---------------------|---------------|
| 声明式 | `@KafkaListener` | 手动 Reader |
| 流处理 | Kafka Streams | 自己写 |
| 事务 | 内置 | 需手动 |

## 6. 一句话总结

> Java 用 Spring Kafka：`KafkaTemplate` 发、`@KafkaListener` 消费，Consumer Group 负载均衡；幂等+事务保 EOS；Kafka Streams 做实时流处理。与 Go 客户端同一 Kafka 协议互通。
