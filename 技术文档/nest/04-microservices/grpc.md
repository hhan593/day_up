# NestJS gRPC 微服务

> 来源：[NestJS 中文文档 · 微服务 > gRPC](https://docs.nestjs.cn/microservices/grpc)
> gRPC 用 protobuf 强类型契约，跨语言友好，流式支持好。注意：它**不用** `@MessagePattern`。

---

## 一、gRPC 是什么？（通俗对比）

普通微服务用 JSON + 字符串 pattern 对暗号；gRPC 用 `.proto` 文件**先约定好"有哪些方法、参数什么类型"**，像"签了正式合同再办事"——编译期就能发现参数错。

**对比其他框架**：
- **Spring gRPC / grpc-go**：同一套 protobuf 契约，Nest 用 TS 装饰器把 `.proto` 的方法映射到类方法。
- **REST + JSON**：gRPC 用二进制 protobuf，更小更快；但需额外工具链（`.proto` 加载）。

---

## 二、安装

```bash
npm i --save @grpc/grpc-js @grpc/proto-loader
```

---

## 三、proto 文件（契约）

```protobuf
// hero.proto
syntax = "proto3";
package hero;

service HeroesService {
  rpc FindOne (HeroById) returns (Hero);
}

message HeroById { int32 id = 1; }
message Hero { int32 id = 1; string name = 2; }
```

> `package: 'hero'` 必须和 proto 里的 `package` 一致。

---

## 四、nest-cli.json 配资源

让 `.proto` 复制到 `dist` 并监听：

```json
{
  "compilerOptions": { "assets": ["**/*.proto"], "watchAssets": true }
}
```

---

## 五、服务端配置

```ts
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.GRPC,
  options: {
    package: 'hero',                              // 必填，匹配 proto package
    protoPath: join(__dirname, 'hero/hero.proto'),// 必填
    url: '0.0.0.0:50051',                         // 可选，默认 'localhost:5000'
  },
});
```

`options` 字段：
| 字段 | 说明 |
|---|---|
| `package` | Protobuf 包名（必填） |
| `protoPath` | .proto 路径（必填） |
| `url` | 连接地址（默认 `localhost:5000`） |
| `protoLoader` | 加载器（默认 `@grpc/proto-loader`） |
| `loader` | @grpc/proto-loader 详细选项 |
| `credentials` | 服务器凭证 |

---

## 六、处理方法用 `@GrpcMethod`（非 @MessagePattern）

```ts
import { GrpcMethod } from '@nestjs/microservices';

@GrpcMethod('HeroesService', 'FindOne')   // 服务名, 方法名
findOne(data: { id: number }): { id: number; name: string } {
  return { id: data.id, name: 'Hero' };
}
```

> ⚠️ **gRPC 不用 `@MessagePattern`**，改用 `@GrpcMethod`（一元调用）或 `@GrpcStreamMethod`/`@GrpcStreamCall`（流式）。这是与其它传输器最大的不同。

---

## 七、客户端调用

```ts
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'HERO_PACKAGE',
        transport: Transport.GRPC,
        options: { package: 'hero', protoPath: join(__dirname, 'hero.proto') },
      },
    ]),
  ],
})
export class AppModule {}
```

```ts
constructor(@Inject('HERO_PACKAGE') private client: ClientGrpc) {}

onModuleInit() {
  this.heroService = this.client.getService<HeroesService>('HeroesService');
}

call(): Observable<Hero> {
  return this.heroService.findOne({ id: 1 });  // 直接调契约方法
}
```
> 客户端用 `ClientGrpc.getService()` 拿**代理对象**，像调用本地方法一样调远程——类型安全（对比 TCP 的 `send({ cmd })` 字符串对暗号）。

---

## 八、流式（Streaming）

- `@GrpcStreamMethod()`：服务端流式接收。
- `@GrpcStreamCall()`：服务端流式响应。
- 返回 `Observable`，支持背压、cancel。

---

## 九、坑 & 最佳实践

1. **别混用 `@MessagePattern`**：gRPC 一律 `@GrpcMethod`。
2. **proto 必须配对**：`package` / `protoPath` 与服务端一致，否则启动报错。
3. **assets 配置**：忘了配 `nest-cli.json` 的 `assets`，`dist` 缺 proto 文件运行时报错。
4. **跨语言**：proto 是语言无关的，前端/Go/Java 都能生成客户端。

---

## 十、一句话总结

> gRPC 用 `.proto` 契约 + `@GrpcMethod('Service','Method')`（不用 @MessagePattern）；客户端 `ClientGrpc.getService()` 像本地方法调远程；需 `@grpc/grpc-js` + 配 `nest-cli.json` 的 `assets`。
