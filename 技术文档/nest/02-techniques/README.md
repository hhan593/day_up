# NestJS 技术（Techniques）知识库

> 内容来源：https://docs.nestjs.cn/techniques（对应官方文档「技术」章节）
> 整理风格：通俗解释 + 跨框架对比（Spring / Express / Fastify / Java / C# 等）+ 代码示例
> 最后更新：2026-09-01

---

## 📑 文档索引（共 17 篇）

| 文档 | 核心内容 | 高频考点 |
|---|---|---|
| [validation.md](./validation.md) | ValidationPipe + class-validator，全局/局部校验、映射类型、数组解析 | DTO 必须 class、import type 不能用 |
| [caching.md](./caching.md) | CacheModule、CacheInterceptor、Redis 多层缓存、TTL | 只缓存 GET、写后清 key |
| [serialization.md](./serialization.md) | ClassSerializerInterceptor、@Exclude/@Expose/@Transform | 实体脱敏、必须返回实例 |
| [versioning.md](./versioning.md) | URI/Header/MediaType/Custom 四策略、中性版本 | 忘了标版本就 404 |
| [task-scheduling.md](./task-scheduling.md) | @nestjs/schedule、@Cron/@Interval/@Timeout、SchedulerRegistry | 多实例防重复执行 |
| [queues.md](./queues.md) | @nestjs/bullmq、Producer/Processor、Job 选项、事件 | Redis 持久化、失败重试 |
| [logger.md](./logger.md) | Logger/ConsoleLogger、级别、自定义、DI | 生产接 Winston/Pino |
| [cookies.md](./cookies.md) | Express cookie-parser / Fastify cookie、@Cookies 装饰器 | passthrough:true |
| [events.md](./events.md) | @nestjs/event-emitter、@OnEvent、通配符 | 解耦副作用、防启动前丢失 |
| [compression.md](./compression.md) | compression / @fastify/compress、brotli/gzip | 生产交给 Nginx |
| [file-upload.md](./file-upload.md) | multer、FileInterceptor 系列、ParseFilePipe | 不支持 Fastify |
| [streaming-files.md](./streaming-files.md) | StreamableFile 返回文件流 | 保留拦截器、勿 pipe(res) |
| [http-module.md](./http-module.md) | @nestjs/axios、HttpService、Observable | firstValueFrom 转 Promise |
| [sessions.md](./sessions.md) | express-session / @fastify/secure-session、@Session | 生产换 Redis 存储 |
| [mvc.md](./mvc.md) | Express/Fastify 模板渲染、@Render | 模板名扩展名差异 |
| [performance.md](./performance.md) | FastifyAdapter 性能优化 | 近 2 倍吞吐、中间件替换 |
| [server-sent-events.md](./server-sent-events.md) | @Sse、Observable、EventSource | 单向推送、必须返回 Observable |

---

## 🔗 知识关联图

```
请求进入
  └─ ValidationPipe 校验（validation.md）
       └─ DTO 用 class-validator 声明规则
响应返回
  ├─ SerializationInterceptor 脱敏（serialization.md）
  ├─ CacheInterceptor 自动缓存 GET（caching.md）
  ├─ Compression 压缩（compression.md）
  ├─ StreamingFile 大文件流（streaming-files.md）
  └─ SSE 实时推送（server-sent-events.md）

业务解耦
  ├─ Events 发布订阅（events.md）
  ├─ Queues 异步任务（queues.md）
  ├─ TaskScheduling 定时任务（task-scheduling.md）
  └─ HttpModule 调外部 API（http-module.md）

状态与身份
  ├─ Cookies（cookies.md）
  └─ Sessions（sessions.md）

架构与运维
  ├─ Logger（logger.md）
  ├─ Versioning API 版本（versioning.md）
  ├─ MVC 服务端渲染（mvc.md）
  └─ Performance Fastify 性能（performance.md）
```

---

## 💡 与 TypeScript 文档的衔接

- DTO 为何必须用 `class` 而非 `interface`/`type`：见 `validation.md` 第四章说明（TS 类型擦除，运行时需读取装饰器元数据）。
- 数组校验为何要显式 `ParseArrayPipe`：TS 泛型元数据擦除（见 `validation.md` 第七章）。
- `import type` 与 DTO 值导入的分工：见 `validation.md` 4.2 注意点。

---

## 📌 使用建议

1. 入门：先读 `validation.md` + `logger.md`（最常用）。
2. 面试：重点 `validation` / `serialization` / `caching` / `queues` / `events` 的"对比其他框架"段落。
3. 排错：按上方索引表直接定位对应文档末尾的"口诀"/"最佳实践"。
