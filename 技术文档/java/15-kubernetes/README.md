# Kubernetes (K8s) 知识总纲

> 定位：容器编排的事实标准，负责**调度、伸缩、自愈、服务发现、配置与密钥管理**。
> 衔接：`02-java-middle/29-Kubernetes部署.md`（Spring Boot 侧的镜像/探针/容器内存落地）、`14-docker/README.md`（容器）、`08-springboot/README.md#十一actuator-生产就绪`（探针）、`11-nacos/README.md`（服务注册）。

---

## 目录

- [一、架构总览](#一架构总览)
- [二、核心对象](#二核心对象)
- [三、Pod](#三pod)
- [四、Deployment 与滚动更新](#四deployment-与滚动更新)
- [五、Service 与网络](#五service-与网络)
- [六、Ingress](#六ingress)
- [七、ConfigMap 与 Secret](#七configmap-与-secret)
- [八、探针与自愈](#八探针与自愈)
- [九、资源限制与 HPA](#九资源限制与-hpa)
- [十、StatefulSet](#十statefulset)
- [十一、命名空间与 RBAC](#十一命名空间与-rbac)
- [十二、可观测性](#十二可观测性)
- [十三、常用命令](#十三常用命令)
- [十四、常见面试考点](#十四常见面试考点)

---

## 一、架构总览

- **Control Plane（控制面）**：`kube-apiserver`（唯一入口）、`etcd`（唯一数据源）、`kube-scheduler`（调度）、`kube-controller-manager`（控制器循环）。
- **Node（工作节点）**：`kubelet`（与 apiserver 通信、管容器）、`kube-proxy`（网络规则）、容器运行时（containerd/CRI-O）。
- 声明式 API：用户提交"期望状态"，控制器不断**调和（reconcile）**使其趋近。

---

## 二、核心对象

| 对象 | 作用 |
|------|------|
| Pod | 最小调度单元，含 1~n 个共享网络的容器 |
| Deployment | 管理无状态 Pod 副本、滚动更新 |
| StatefulSet | 有状态应用（有序、稳定网络标识、持久存储） |
| Service | 稳定虚拟 IP + 负载均衡，屏蔽 Pod 漂移 |
| Ingress | 七层路由（域名/路径 → Service） |
| ConfigMap | 配置（非敏感） |
| Secret | 密钥（base64，建议结合 KMS/密封） |
| Namespace | 资源逻辑隔离 |
| PV/PVC | 持久卷抽象 |
| HPA | 基于指标自动扩缩容 |

---

## 三、Pod

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: user-service
  labels: { app: user-service }
spec:
  containers:
    - name: app
      image: registry.example.com/user-service:1.2.0
      ports: [{ containerPort: 8080 }]
      envFrom:
        - configMapRef: { name: user-config }
      resources:
        requests: { cpu: "100m", memory: "256Mi" }
        limits:   { cpu: "500m", memory: "512Mi" }
  restartPolicy: Always
```

- Pod 内多个容器共享 `localhost` 网络与挂载卷（sidecar 模式：日志收集/代理同 Pod 协作）。

---

## 四、Deployment 与滚动更新

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels: { app: user-service }
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0     # 保证零停机
  template:
    metadata:
      labels: { app: user-service }
    spec:
      containers:
        - name: app
          image: registry.example.com/user-service:1.2.0
          ports: [{ containerPort: 8080 }]
```

- 升级：`kubectl set image deployment/user-service app=...:1.3.0` → 滚动替换。
- 回滚：`kubectl rollout undo deployment/user-service`。
- 发布策略：滚动更新、蓝绿（两套 Deployment 切 Service）、金丝雀（HPA + 小部分流量）。

---

## 五、Service 与网络

```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector: { app: user-service }   # 选中的 Pod
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP     # 默认，仅集群内可达
```

- `ClusterIP`：集群内部虚拟 IP。
- `NodePort`：在每个节点开端口（30000-32767），测试用。
- `LoadBalancer`：云厂商创建外部 LB。
- `Headless`（clusterIP: None）：用于 StatefulSet 直接暴露 Pod DNS。

---

## 六、Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gateway-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /user
            pathType: Prefix
            backend:
              service:
                name: user-service
                port: { number: 80 }
```

- Ingress Controller（如 ingress-nginx）监听规则、配置底层 LB。

---

## 七、ConfigMap 与 Secret

```bash
kubectl create configmap app-config --from-file=application.yml
kubectl create secret generic db-secret --from-literal=password=xxxx
```

```yaml
envFrom:
  - configMapRef: { name: app-config }     # 普通配置
  - secretRef:   { name: db-secret }       # 密钥
```

- 配置变更：挂载为文件可用 `reloader` 或滚动重启生效；Spring Boot 配合外部化配置中心（Nacos）可热更新。

---

## 八、探针与自愈

```yaml
livenessProbe:        # 失败 → 杀掉并重启容器
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  initialDelaySeconds: 20
  periodSeconds: 10
readinessProbe:       # 失败 → 从 Service 后端摘除（不重启）
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
startupProbe:         # 启动慢的应用，保护 liveness 误杀
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5
```

- 自愈：节点宕机，Pod 被重新调度到健康节点；进程崩溃，kubelet 按 `restartPolicy` 重启。

---

## 九、资源限制与 HPA

```yaml
resources:
  requests: { cpu: "100m", memory: "256Mi" }   # 调度依据 & 保障
  limits:   { cpu: "500m", memory: "512Mi" }   # 硬上限（OOMKill/Throttle）
```

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: user-service-hpa }
spec:
  scaleTargetRef: { kind: Deployment, name: user-service }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

- `requests` 影响调度（保证最小资源），`limits` 防止超额。内存超限 → OOMKill；CPU 超限 → 限流（throttle）。
- 配合 Prometheus + KEDA 可实现基于队列长度、QPS 的弹性。

---

## 十、StatefulSet

- 适用：数据库、Redis 集群、ZooKeeper 等**有状态**服务。
- 特性：稳定的网络标识（`pod-0.svc`）、稳定的持久存储（PVC 随 Pod）、有序部署/扩缩。

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata: { name: redis }
spec:
  serviceName: redis
  replicas: 3
  selector: { matchLabels: { app: redis } }
  template:
    metadata: { labels: { app: redis } }
    spec:
      containers:
        - name: redis
          image: redis:7
          volumeMounts: [{ name: data, mountPath: /data }]
  volumeClaimTemplates:
    - metadata: { name: data }
      spec:
        accessModes: [ReadWriteOnce]
        resources: { requests: { storage: 10Gi } }
```

---

## 十一、命名空间与 RBAC

- Namespace：`dev` / `test` / `prod` 逻辑隔离资源与配额。
- RBAC：`Role`/`ClusterRole` + `RoleBinding` 控制"谁能在哪对什么做什么"。
- 配额：`ResourceQuota` 限制命名空间资源总量。

---

## 十二、可观测性

- **Metrics**：Prometheus 抓取 `/actuator/prometheus`，Grafana 展示（见 `08-springboot/README.md#十一actuator-生产就绪`）。
- **Logs**：容器日志打到 stdout → `kubectl logs` / 采集到 ELK/Loki。
- **Tracing**：OpenTelemetry + Jaeger 做全链路追踪（微服务必备，见 `09-microservices/README.md`）。

---

## 十三、常用命令

```bash
kubectl get pods -n prod
kubectl describe pod user-service-xxx        # 排障
kubectl logs -f deployment/user-service
kubectl apply -f deploy.yaml                 # 声明式部署
kubectl rollout status deployment/user-service
kubectl rollout undo deployment/user-service # 回滚
kubectl scale deployment/user-service --replicas=5
kubectl exec -it user-service-xxx -- sh
kubectl top pod / kubectl top node           # 资源占用
```

---

## 十四、常见面试考点

1. **K8s 为什么是声明式？** → 提交期望状态，控制器持续调和（reconcile loop）。
2. **Pod 是最小调度单元，为什么还需要 Deployment？** → Deployment 管理副本数、滚动更新、回滚。
3. **Service 如何发现后端 Pod？** → Endpoints/EndpointSlice 由 kube-proxy 维护（iptables/IPVS）。
4. **liveness 与 readiness 区别？** → liveness 失败杀人重启；readiness 失败摘流量不重启。
5. **HPA 基于什么扩缩？** → 指标（CPU/内存/自定义，如 QPS、队列长度）。
6. **Deployment vs StatefulSet？** → 无状态用 Deployment（Pod 可互换）；有状态用 StatefulSet（稳定标识+存储）。
7. **Pod 如何从 Pending 变 Running？** → 调度（scheduler 选节点）→ 拉镜像 → 启动容器 → 探针通过。
8. **亲和/反亲和？** → `affinity` 控制 Pod 调到哪里（同/不同节点/可用区），提升容灾。
