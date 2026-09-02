# Recipes - 文件上传（File Upload）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/file-upload`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第十三章。基于 `multer`（Express 文件中间件），Nest 用拦截器封装。

## 一、安装

```bash
npm i -D @types/multer   # multer 已随平台依赖带
```

- 单文件：`@nestjs/platform-express` 的 `FileInterceptor`（默认 Express 平台）
- Fastify 平台用 `FastifyMulter` 变体

## 二、单文件上传

```ts
import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Post('upload')
@UseInterceptors(FileInterceptor('file'))   // 'file' = 表单字段名
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file.originalname, file.buffer);
  return { filename: file.originalname };
}
```

- `FileInterceptor('file')` 拦截 `multipart/form-data` 的 `file` 字段。
- `@UploadedFile()` 注入解析后的文件对象。

## 三、多文件

```ts
import { FilesInterceptor, UploadedFiles } from '@nestjs/platform-express';

@Post('upload-many')
@UseInterceptors(FilesInterceptor('files', 10))   // 字段名, 最多 10
uploadMany(@UploadedFiles() files: Express.Multer.File[]) {}
```

- 还有 `FileFieldsInterceptor`（多字段）、`AnyFilesInterceptor`（任意字段）。

## 四、磁盘存储（落地到硬盘）

```ts
import { diskStorage } from 'multer';
import { extname } from 'path';

FileInterceptor('file', {
  storage: diskStorage({
    destination: './uploads',             // 保存目录
    filename: (req, file, cb) => {
      const unique = Date.now() + extname(file.originalname);
      cb(null, unique);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('只支持图片'), false);
    }
    cb(null, true);
  },
})
```

- `diskStorage` 替代默认内存 buffer，文件直接写磁盘。
- `fileFilter` 做类型校验。

## 五、全局限制 / 校验

- 用 `ValidationPipe` 管不了文件（它是 body），需 `FileInterceptor` 的 `limits` 选项（大小）或 `fileFilter`。
- 文件元数据可配合 DTO 一并接收（`@Body()` + `@UploadedFile()`）。

## 六、要点

| 场景 | 拦截器 |
|------|--------|
| 单文件 | `FileInterceptor('field')` + `@UploadedFile()` |
| 多文件 | `FilesInterceptor('field', n)` + `@UploadedFiles()` |
| 存磁盘 | `diskStorage({ destination, filename })` |
| 类型/大小 | `fileFilter` / `limits` |

> 跨框架对比：Spring 的 `@RequestParam MultipartFile`、Express 原生 `multer` 中间件、Laravel 的 `Request->file()`——Nest 用拦截器把 multer 接进 DI，最贴近 Express 原生但更声明式。

## 下一篇

→ `cors.md` + `prisma.md`：CORS 安全与 Prisma ORM。
