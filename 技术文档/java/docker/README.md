# Docker 知识总纲

> 定位：把应用及其依赖打包成**标准化、可移植、隔离**的容器，实现"一次构建，处处运行"。
> 衔接：`springboot/README.md`（Boot 应用容器化）、`kubernetes/README.md`（容器编排）。

---

## 目录

- [一、核心概念](#一核心概念)
- [二、镜像分层](#二镜像分层)
- [三、Dockerfile](#三dockerfile)
- [四、多阶段构建](#四多阶段构建)
- [五、容器操作命令](#五容器操作命令)
- [六、数据卷与持久化](#六数据卷与持久化)
- [七、网络](#七网络)
- [八、Docker Compose](#八docker-compose)
- [九、镜像仓库](#九镜像仓库)
- [十、最佳实践](#十最佳实践)
- [十一、常见面试考点](#十一常见面试考点)

---

## 一、核心概念

| 概念 | 说明 |
|------|------|
| 镜像 Image | 只读模板，包含应用 + 运行环境，由多层（layer）叠加 |
| 容器 Container | 镜像的运行实例，具有可写层（copy-on-write） |
| 仓库 Registry | 存储/分发镜像，如 Docker Hub、Harbor、阿里云 ACR |
| Dockerfile | 构建镜像的"配方"文本文件 |
| Volume | 独立于容器生命周期的持久化存储 |

- 容器 vs 虚拟机：容器共享宿主机内核，更轻量（秒级启动、MB 级）；VM 含完整 Guest OS。

---

## 二、镜像分层

- 每个 Dockerfile 指令生成一个**只读层**，容器在顶层增加一个可写层。
- 层有缓存：指令未变则复用缓存，加速构建。
- 同类镜像共享底层（如多个 Java 镜像共用 `eclipse-temurin` 基础层），节省磁盘与带宽。

---

## 三、Dockerfile

```dockerfile
# 基础镜像
FROM eclipse-temurin:21-jre

# 元信息（作者、端口）
LABEL maintainer="dev@example.com"
EXPOSE 8080

# 设置工作目录
WORKDIR /app

# 复制文件（注意 .dockerignore 排除无关文件）
COPY target/app.jar app.jar

# 设置环境变量
ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV TZ=Asia/Shanghai

# 非 root 运行（安全）
RUN addgroup --system app && adduser --system --group app
USER app

# 容器启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

常用指令：`FROM` / `RUN` / `COPY` / `ADD`（少用）/ `ENV` / `ARG` / `EXPOSE` / `VOLUME` / `WORKDIR` / `USER` / `CMD` / `ENTRYPOINT`。

- `CMD` vs `ENTRYPOINT`：`ENTRYPOINT` 定义固定可执行命令，`CMD` 提供默认参数，二者组合最常见。

---

## 四、多阶段构建

```dockerfile
# ---- 构建阶段 ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY . .
RUN mvn -B package -DskipTests

# ---- 运行阶段 ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
COPY --from=build /src/target/app.jar app.jar
USER app
ENTRYPOINT ["java", "-jar", "app.jar"]
```

- 最终镜像只含运行所需 jar + JRE，**体积大幅减小**，且不暴露源码与构建工具。

---

## 五、容器操作命令

```bash
# 构建
docker build -t myapp:1.0.0 -f Dockerfile .

# 运行
docker run -d -p 8080:8080 --name myapp \
  -e SPRING_PROFILES_ACTIVE=prod \
  -v /data/logs:/app/logs \
  --restart unless-stopped myapp:1.0.0

# 查看
docker ps                       # 运行中容器
docker logs -f --tail 100 myapp # 日志
docker stats myapp              # 资源占用

# 进入与调试
docker exec -it myapp sh

# 清理
docker stop myapp && docker rm myapp
docker image prune -f           # 删除悬空镜像
docker system prune -a          # 深度清理（谨慎）
```

---

## 六、数据卷与持久化

- `bind mount`：挂载宿主机目录（如 `-v /data:/app/data`），开发调试常用。
- `volume`：由 Docker 管理的命名卷（`docker volume create dbdata`），生产推荐。
- 容器删除后，写入卷的数据依然存在；**不要**把数据库数据写在容器可写层。

```bash
docker volume create pgdata
docker run -d -v pgdata:/var/lib/postgresql/data postgres:16
```

---

## 七、网络

- 默认 `bridge` 网络：容器间通过容器名互通需加入自定义网络。
```bash
docker network create mynet
docker run -d --net mynet --name db postgres:16
docker run -d --net mynet --name app myapp   # app 可直接访问 db:5432
```
- `host` 网络：容器共享宿主机网络栈（性能高，牺牲隔离）。
- `none`：无网络。

---

## 八、Docker Compose

用声明式 `docker-compose.yml` 编排多容器应用：

```yaml
version: "3.8"
services:
  app:
    build: .
    ports: ["8080:8080"]
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_HOST: db
    depends_on: [db, redis]
    networks: [backend]
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
    volumes: ["pgdata:/var/lib/postgresql/data"]
    networks: [backend]
  redis:
    image: redis:7
    networks: [backend]
volumes:
  pgdata:
networks:
  backend:
```

```bash
docker compose up -d          # 启动
docker compose down          # 停止并删容器（卷保留）
docker compose logs -f app   # 看日志
```

---

## 九、镜像仓库

- 公有：Docker Hub（`docker pull nginx`）。
- 私有：Harbor、阿里云 ACR、AWS ECR。
```bash
docker tag myapp:1.0.0 registry.example.com/library/myapp:1.0.0
docker push registry.example.com/library/myapp:1.0.0
```

---

## 十、最佳实践

1. **使用官方、精简基础镜像**（如 `eclipse-temurin:21-jre` 而非 `ubuntu` + 手动装 JDK）。
2. **多阶段构建**减小体积。
3. **一个容器一个进程**，前台运行，日志打到 stdout/stderr（便于 K8s 采集）。
4. **写 `.dockerignore`** 排除 `.git`、`target`、`node_modules`。
5. **非 root 用户运行**；用 `--read-only` 挂载增强安全。
6. **固定 TAG 或 Digest**，避免 `latest` 不可复现。
7. **设置资源限制**（K8s 侧 `resources.limits`），防止单容器拖垮宿主机。
8. **HEALTHCHECK** 声明应用健康状态。

---

## 十一、常见面试考点

1. **镜像和容器的关系？** → 类是镜像，对象是容器；镜像是静态模板，容器是运行实例。
2. **容器为什么比 VM 轻？** → 共享宿主机内核，无 Guest OS。
3. **COPY 与 ADD 区别？** → `ADD` 支持 URL 下载与 tar 自动解压，`COPY` 更纯粹，推荐 `COPY`。
4. **CMD 与 ENTRYPOINT 区别？** → `ENTRYPOINT` 不可被 `docker run` 参数覆盖（除非 `--entrypoint`），`CMD` 可被覆盖作为默认参数。
5. **如何减小镜像？** → 多阶段构建、精简基础镜像、合并 RUN 减少层数、清理缓存。
6. **数据如何持久化？** → Volume 或 bind mount，避免写容器可写层。
7. **Docker 网络模式？** → bridge（默认）、host、none、overlay（跨主机，Swarm/K8s 用）。
