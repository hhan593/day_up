# 29. Java 与 Kubernetes 部署

> 来源可信度：**标准实践**（基于 K8s 官方文档 + Spring Boot 生产就绪特性；与 `28-cloud-native.md`/`23-redis-cache.md` 衔接）
> 关联：Next `18-deployment.md`、Go `12-project-layout.md`

## 1. 容器化 Spring Boot

```dockerfile
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
COPY build/libs/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- 用 `eclipse-temurin` 官方 JRE 镜像；配合 `28-cloud-native.md` 可换 Native 镜像。

## 2. 生产就绪：Actuator

```yaml
# application.yml
management:
  endpoints.web.exposure.include: health,info,metrics,prometheus
  endpoint.health.probes.enabled: true   # k8s 探针
```

- `/actuator/health/liveness`、`/readiness` 供 K8s 探针。
- `/actuator/prometheus` 暴露指标（Prometheus 抓取）。

## 3. Deployment 与探针

```yaml
livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 20
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
resources:
  requests: { memory: "512Mi", cpu: "250m" }
  limits:   { memory: "1Gi",   cpu: "1" }
```

- liveness 失败 → 重启 Pod；readiness 失败 → 摘流量不重启。

## 4. 配置与密钥

- 外部化配置：`ConfigMap` + `Secret`，通过 env/volume 注入（Spring 读 `SPRING_*` env）。
- 不用硬编码，遵守 `13-spring-boot.md` 的外部化配置原则。

## 5. 弹性与伸缩

- HPA（HorizontalPodAutoscaler）：按 CPU/自定义指标扩缩。
- JVM 需设 `-XX:MaxRAMPercentage=75` 让容器内存限制生效（避免 OOMKill）。

## 6. 一句话总结

> K8s 部署 Spring Boot：Actuator 开 health/metrics，liveness/readiness 探针接探针，ConfigMap/Secret 外部化配置，HPA 按指标伸缩，`-XX:MaxRAMPercentage` 防 OOM。容器化与 Next/Go 同理。
