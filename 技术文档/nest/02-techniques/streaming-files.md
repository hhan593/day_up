# NestJS 流式文件（Streaming Files）技术详解

> 来源：https://docs.nestjs.cn/techniques/streaming-files
> 作用：向客户端返回大文件流（不占内存）。推荐返回 `StreamableFile`。
> 仅适用于 HTTP 应用（非 GraphQL/微服务）。

---

## 一、为什么用 StreamableFile

❌ 传统方式：直接 `file.pipe(res)` 会**失去控制器后拦截器**（如日志、响应头处理）的能力。
✅ 推荐：返回 `StreamableFile` 实例，框架自动管道传输流，**保留拦截器**。

> 对比：类似 **Java 的 `StreamingResponseBody`**、**ASP.NET 的 `FileStreamResult`**，把"流"作为一等返回类型，框架负责管道。

---

## 二、基础用法

```ts
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```
- 构造函数接收 `Buffer` 或 `Stream`。
- 默认 `Content-Type: application/octet-stream`。
- Express / Fastify 都兼容（无需 `pipe(res)`）。

---

## 三、自定义响应头

### 方式 1：StreamableFile 选项
```ts
return new StreamableFile(file, {
  type: 'application/json',
  disposition: 'attachment; filename="package.json"',
  // length: 123,
});
```

### 方式 2：passthrough 直接操作 Response
```ts
@Get()
getFileChangingResponseObjDirectly(
  @Res({ passthrough: true }) res: Response,
): StreamableFile {
  const file = createReadStream(join(process.cwd(), 'package.json'));
  res.set({ 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="package.json"' });
  return new StreamableFile(file);
}
```

### 方式 3：@Header 装饰器（静态）
```ts
@Get()
@Header('Content-Type', 'application/json')
@Header('Content-Disposition', 'attachment; filename="package.json"')
getFileUsingStaticValues(): StreamableFile {
  return new StreamableFile(createReadStream(join(process.cwd(), 'package.json')));
}
```

---

## 四、关键点

| 主题 | 说明 |
|---|---|
| 适用 | REST API 返回文件流 |
| 推荐 | 返回 `StreamableFile` 而非 `pipe(res)` |
| 平台无关 | Express / Fastify 均兼容 |
| 默认头 | `application/octet-stream` |
| 头自定义 | 构造选项 / `res.set` / `@Header` |

> 口诀：**"大文件别吃内存，StreamableFile 管流；拦截器还管用，三法设头都行。"**
