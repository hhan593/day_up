# 30. Java 可观测性（Micrometer / OTel / Logging）

> 来源可信度：**官方文档确认**（基于 Micrometer、OpenTelemetry Java、Spring Boot Actuator 官方文档；与 `29-kubernetes.md` 衔接）
> 关联：Node `19-diagnostics-tracing.md`、Next `19-monitoring.md`

## 1. 三支柱：Metrics / Logs / Traces

| 支柱 | Java 工具 | 输出 |
|------|-----------|------|
| Metrics | Micrometer + Actuator | Prometheus |
| Logs | Logback/Log4j2 | 结构化 JSON |
| Traces | Micrometer Tracing / OTel | Jaeger/Tempo |

## 2. Micrometer 指标

```java
@Bean MeterRegistryCustomizer customize() {
    return reg -> reg.config().commonTags("app", "order-svc");
}
Counter.builder("http.requests").register(reg).increment();
Timer.Sample sample = Timer.start(reg);
// ... work ...
sample.stop(Timer.builder("work.time").register(reg));
```

- Micrometer 是**指标门面**（类似 SLF4J 之于日志），后端可换 Prometheus/StatsD。
- 与 `29-kubernetes.md` 的 `/actuator/prometheus` 配合被抓取。

## 3. 分布式追踪（OTel）

```java
// 自动埋点：加 opentelemetry-javaagent.jar
-javaagent:opentelemetry-javaagent.jar \
  -Dotel.service.name=order-svc \
  -Dotel.exporter.otlp.endpoint=http://collector:4317
```

- Java agent 无侵入自动追踪 Spring/web/jdbc；与 Node/Go/Rust 同走 OTLP 协议（见 Node `19`）。

## 4. 结构化日志

```xml
<!-- logback：输出 JSON 给 Loki/ELK -->
<encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
  <providers><timestamp/><message/><mdc/></providers>
</encoder>
```

- MDC 注入 traceId，日志与 trace 关联。

## 5. 全栈统一

- 所有语言（Java/Go/Node/Rust）用 OTLP + W3C traceparent 串链路。
- Prometheus 抓指标、Grafana 看板、Loki/ELK 查日志、Jaeger 看 trace。

## 6. 一句话总结

> Java 可观测：Micrometer 出指标（Prometheus 抓）、OTel Java agent 自动追踪（与全栈 OTLP 统一）、Logback JSON + MDC 串 traceId。三支柱与 Node/Go/Rust 同体系互操作。
