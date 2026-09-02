# 19. Go 微服务与消息队列

> 来源可信度：**标准实践**（基于 NATS / Kafka Go 客户端公开 API；与 `16-grpc-microservices.md` 衔接）
> 关联：`06-concurrency.md`、`11-context-in-server.md`、`12-project-layout.md`

## 1. 同步 vs 异步通信

| 方式 | 场景 | Go 实现 |
|------|------|---------|
| gRPC（同步） | 请求-响应、低延迟 | `google.golang.org/grpc` |
| 消息队列（异步） | 解耦、削峰、事件驱动 | NATS / Kafka / RabbitMQ |

微服务通常**二者结合**：gRPC 做命令式调用，消息队列做事件广播。

## 2. NATS（轻量、极快）

```go
import "github.com/nats-io/nats.go"

nc, _ := nats.Connect(nats.DefaultURL)
defer nc.Close()

// 发布
nc.Publish("orders.created", []byte(`{"id":1}`))

// 订阅
nc.Subscribe("orders.created", func(m *nats.Msg) {
    log.Printf("got: %s", m.Data)
    m.Ack()
})

// JetStream（持久化、至少一次）
js, _ := nc.JetStream()
js.Publish("orders.created", []byte(payload))
```

- NATS 核心极简，JetStream 提供持久化、流、消费者组。
- 适合：高频事件、IoT、内部通知。

## 3. Kafka（高吞吐、分区）

```go
import "github.com/segmentio/kafka-go"

w := kafka.NewWriter(kafka.WriterConfig{
    Brokers: []string{"localhost:9092"},
    Topic:   "orders",
})
w.WriteMessages(ctx, kafka.Message{Key: []byte("1"), Value: payload})

r := kafka.NewReader(kafka.ReaderConfig{
    Brokers:   []string{"localhost:9092"},
    Topic:     "orders",
    GroupID:   "svc-a",   // 消费者组，自动 rebalance
})
for {
    m, _ := r.ReadMessage(ctx)
    process(m.Value)
}
```

- 分区 → 并行消费；`GroupID` 实现消费者组（同组一条消息只消费一次）。
- 适合：日志流、订单流水、大数据管道。

## 4. 用 channel 做进程内解耦

Go 原生 `chan` 也能做轻量事件总线（见 `06-concurrency.md`）：

```go
events := make(chan Event, 1024)
go func() {
    for e := range events { handlers[e.Type](e) }
}()
```

- 跨进程才需要 NATS/Kafka；同进程内用 channel + worker pool 即可。

## 5. 服务发现与配置

- 服务发现：Consul / etcd / k8s Service。
- 配置：Viper（`spf13/viper`）统一读 env/yaml/etcd。
- 与 `12-project-layout.md` 的 `internal/`、`cmd/` 分层结合。

## 6. 一句话总结

> Go 微服务 = gRPC（命令）+ 消息队列（事件）。NATS 轻快、Kafka 高吞吐分区，消费者组做负载；进程内小解耦用 channel。配合 Viper/Consul 做配置与发现。
