# NestJS HTTP 模块（HTTP Module）技术详解

> 来源：https://docs.nestjs.cn/techniques/http-module
> 作用：在 Nest 服务内发起出站 HTTP 请求（调用第三方 API）。基于 Axios 封装。

---

## 一、安装

```bash
npm i --save @nestjs/axios axios
```

---

## 二、注册与注入

```ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

@Module({ imports: [HttpModule], providers: [CatsService] })
export class CatsModule {}
```
```ts
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';

@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```
- `HttpService` 方法返回 **Observable<AxiosResponse>**（RxJS 流）。

**对比**：类似 **Angular 的 `HttpClient`**（同样返回 Observable）、**Java 的 `RestTemplate`/`WebClient`**，Nest 用 DI 注入 Service 封装。

---

## 三、请求方法

`get`/`post`/`put`/`delete` 等签名同 Axios：
```ts
this.httpService.post(url, body).subscribe(...)
```

---

## 四、配置

### 静态
```ts
HttpModule.register({ timeout: 5000, maxRedirects: 5 });
```

### 异步（ConfigModule）
```ts
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (cfg: ConfigService) => ({
    timeout: cfg.get('HTTP_TIMEOUT'),
    maxRedirects: cfg.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
// 也支持 useClass / useExisting（实现 HttpModuleOptionsFactory）
```

---

## 五、直接访问 Axios 实例

```ts
findAll(): Promise<AxiosResponse<Cat[]>> {
  return this.httpService.axiosRef.get('http://localhost:3000/cats');
}
```

---

## 六、Promise 化 + 错误处理（常用模式）

```ts
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

async findAll(): Promise<Cat[]> {
  const { data } = await firstValueFrom(
    this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
      catchError((error: AxiosError) => {
        this.logger.error(error.response.data);
        throw 'An error happened!';
      }),
    ),
  );
  return data;
}
```
- `firstValueFrom` 把 Observable 转 Promise（async/await 友好）。

> 口诀：**"HttpModule 注入 Service，方法返回 Observable；要 async 用 firstValueFrom，错误 catchError 兜。"**
