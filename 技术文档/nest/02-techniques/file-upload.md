# NestJS 文件上传（File Upload）技术详解

> 来源：https://docs.nestjs.cn/techniques/file-upload
> 作用：处理 `multipart/form-data` 文件上传。基于 Express 的 multer 中间件。
> ⚠️ multer 不支持 FastifyAdapter（Fastify 需用 `@fastify/multipart` + 对应拦截器）。

---

## 一、MulterModule 配置

```bash
npm i -D @types/multer
```
```ts
// 默认
MulterModule.register({ dest: './upload' });
// 异步
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (cfg: ConfigService) => ({ dest: cfg.get('MULTER_DEST') }),
  inject: [ConfigService],
});
```

---

## 二、拦截器与装饰器（核心）

均从 `@nestjs/platform-express` 导入拦截器，`@nestjs/common` 导入装饰器。

### 单文件：FileInterceptor + @UploadedFile
```ts
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {}
```
- `'file'` 是表单字段名。

### 同字段多文件：FilesInterceptor + @UploadedFiles
```ts
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {}
```

### 不同字段多文件：FileFieldsInterceptor
```ts
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[]; background?: Express.Multer.File[] }) {}
```

### 任意字段：AnyFilesInterceptor / 无文件：NoFilesInterceptor
```ts
@UseInterceptors(AnyFilesInterceptor()) uploadFile(@UploadedFiles() files) {}
@UseInterceptors(NoFilesInterceptor()) handleMultiPartData(@Body() body) {}
```

---

## 三、文件校验

### 内置 ParseFilePipe + 验证器
```ts
@UploadedFile(new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: 1000 }),
    new FileTypeValidator({ fileType: 'image/jpeg' }),
  ],
})) file: Express.Multer.File {}
```
- 可选：`errorHttpStatusCode`、`exceptionFactory`、`fileIsRequired: false`

### ParseFilePipeBuilder 简化
```ts
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: 'jpeg' })
    .addMaxSizeValidator({ maxSize: 1000 })
    .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
) file: Express.Multer.File {}
```

### 自定义 FileValidator
```ts
export abstract class FileValidator<T = Record<string, any>> {
  constructor(protected readonly validationOptions: T) {}
  abstract isValid(file?: any): boolean | Promise<boolean>;
  abstract buildErrorMessage(file: any): string;
}
```

> 与前面 `validation.md` 的 `ValidationPipe` 一脉相承：文件也有"管道校验"机制，复用 `PipeTransform` 思想。

**对比**：类似 **Spring 的 `MultipartFile` + `@Valid`**、**Express 原生 multer**，Nest 用拦截器 + 管道做声明式校验。

> 口诀：**"FileInterceptor 管单，Files 管多，Fields 管异名；要校验用 ParseFilePipe，大小类型都管。"**
