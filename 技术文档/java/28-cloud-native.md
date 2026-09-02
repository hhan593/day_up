# 28. Java 云原生（GraalVM / Spring Native）

> 来源可信度：**官方文档确认**（基于 GraalVM Native Image、Spring Boot Native 官方文档；与 `13-spring-boot.md` 衔接）
> 关联：Go `18-web-framework-gin-echo.md`（Go 原生二进制对照）

## 1. 为什么云原生 Java

- JVM 启动慢（数百 ms~秒）、内存大（JIT + 堆），Serverless/容器不友好。
- GraalVM Native Image 把 Java **提前编译（AOT）成原生二进制**：启动 ms 级、内存 1/5。

## 2. Spring Boot Native

```bash
# 用 native 构建
./gradlew nativeCompile
./build/native/nativeCompile/app   # 直接跑原生二进制
```

- Spring Boot 3 + GraalVM 支持 AOT 处理（运行时反射/代理需提前注册）。
- 局限：反射、动态代理、JNI 需 `reflect-config.json` 显式声明（Native Hint API）。

```java
@RegisterReflectionForBinding(User.class) // 提示 GraalVM
```

## 3. 构建产物对比

| | JVM jar | Native Image |
|---|---------|--------------|
| 启动 | 秒级 | 毫秒级 |
| 内存 | 高 | 低（无 JIT 元空间） |
| 峰值性能 | 高（JIT 优化后） | 稍低（无 JIT） |
| 构建时间 | 快 | 慢（需 AOT 分析） |

## 4. 容器与镜像

```dockerfile
FROM ghcr.io/graalvm/native-image-community:17 AS build
# 编译原生
FROM debian:bookworm-slim
COPY --from=build /app/app /app/app
# 最终镜像极小（含 glibc/musl）
```

- 多阶段构建，最终镜像可 < 50MB（对比 JRE 镜像 > 200MB）。

## 5. 与 Go 对照

- Go 天生编译原生二进制（见 `18-web-framework-gin-echo.md`），无需 AOT 阶段。
- Java Native 适合**已有 Spring 生态**想降本；新项目高并发轻量可直接选 Go。

## 6. 一句话总结

> 云原生 Java 用 GraalVM Native Image 把 Spring Boot AOT 编译成原生二进制：启动 ms、内存 1/5，但需声明反射/代理、构建慢。容器多阶段构建出小镜像。与 Go 原生二进制殊途同归。
