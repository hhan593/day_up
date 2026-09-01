# Recipes - HTTP 模块（调用外部 API）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/http-module`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第十二章。Nest 内部要调第三方 HTTP 接口时，用 `@nestjs/axios`（封装 axios）。

## 一、安装

```bash
npm i @nestjs/axios axios
```

## 二、注册 HttpModule

```ts
import { HttpModule } from '@nestjs/axios';

@Module({ imports: [HttpModule] })
export class AppModule {}
```

- 全局：`HttpModule.register({ isGlobal: true })` 或 `registerAsync` 接 ConfigModule 配 baseURL/超时。

## 三、注入 HttpService

```ts
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GithubService {
  constructor(private http: HttpService) {}

  async getUser(login: string) {
    const { data } = await firstValueFrom(
      this.http.get(`https://api.github.com/users/${login}`),
    );
    return data;
  }
}
```

- `HttpService.get/post/put/delete` 返回 **Observable**（RxJS），用 `firstValueFrom` 转 Promise（见 `12-RxJS核心概念与API详解.md`）。
- ⚠️ 必须 `await firstValueFrom(...)` 否则不会发送请求（cold Observable）。

## 四、全局配置

```ts
HttpModule.register({
  timeout: 5000,
  maxRedirects: 5,
  baseURL: 'https://api.github.com',
});
```

## 五、动态 baseURL / 拦截器

- 用 `registerAsync({ useFactory, inject })` 读 ConfigModule 动态配。
- axios 拦截器可挂在 `HttpService.axiosRef.interceptors` 上（加 token、统一错误处理）。

## 六、要点

| 关注点 | 做法 |
|--------|------|
| 注册 | `HttpModule.register/registerAsync` |
| 调用 | 注入 `HttpService`，`get/post` 返回 Observable |
| 取值 | `firstValueFrom(observable)` 转 Promise |
| 配置 | `timeout` / `baseURL` |

> 跨框架对比：Spring 的 `RestTemplate`/`WebClient`、Angular 的 `HttpClient`——Nest 的 `HttpService` 几乎是 Angular `HttpClient` 同款（都返回 Observable）。

## 下一篇

→ `file-upload.md`：文件上传。
