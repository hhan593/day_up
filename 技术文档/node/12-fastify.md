# 12 · Fastify 框架（高性能 Node.js Web 框架）

> 官方来源：Fastify Docs (latest, v5.12.1)（https://fastify.dev/docs/latest/，OpenJS Foundation）
> 说明：Fastify 官网为目录式（章节锚点 Factory/Plugins/Routes/Hooks/Decorators/Validation/Logging 均确认），本文基于官方文档结构与 Fastify 标准 API 整理。

Fastify 主打**低开销、高吞吐**（JSON 序列化用 `fast-json-stringify`、模式校验用 `ajv`），是 Express 的现代替代，也是 NestJS 的可选底层适配器之一。

## 一、实例创建与启动

```js
import Fastify from 'fastify';
const app = Fastify({ logger: true });

app.get('/', async () => ({ hello: 'world' })); // 直接返回对象 = JSON

await app.listen({ port: 3000 });
```

- handler 返回对象自动序列化为 JSON；返回字符串即文本。
- 默认开 `logger`（pino）。

## 二、路由（Routes）

```js
app.get('/users/:id', async (request, reply) => {
  const { id } = request.params;
  return { id };
});
app.post('/users', async (request, reply) => {
  const body = request.body;       // 已按 schema 解析校验
  reply.code(201);
  return { created: body };
});
```

- `request` = `{ params, query, body, headers, ... }`
- `reply` = `{ code(), send(), header() }`；也可用 `return` 直接返回。

## 三、插件与 register（核心架构）

Fastify 用**插件模型**实现封装（encapsulation）：每个 `register` 创建独立作用域，避免全局污染。

```js
import dbPlugin from './plugins/db.js';
app.register(dbPlugin);            // 注册插件
app.register(import('./routes/users.js'), { prefix: '/users' });
```

```js
// plugins/db.js
export default async function (fastify, opts) {
  fastify.decorate('db', createDb());
}
```

- 插件异步加载，`await app.ready()` 等待就绪。
- 与 Express 中间件不同：Fastify 插件强调**封装边界**，跨插件共享需显式 `decorate`。

## 四、钩子（Hooks）

```js
app.addHook('onRequest', async (request, reply) => { /* 鉴权 */ });
app.addHook('preHandler', async (request, reply) => { /* handler 前 */ });
app.addHook('onError', async (request, reply, err) => {});
app.addHook('onResponse', async (request, reply) => {});
```

- 钩子类比 Express 中间件，但执行时机更明确（生命周期阶段）。
- `onRequest → preParsing → preValidation → preHandler → handler → onSend → onResponse`。

## 五、装饰器（Decorators）

`decorate` 向实例注入复用能力（类似 Nest 的 `@Injectable` 容器）：

```js
fastify.decorate('authenticate', async (request, reply) => { /* JWT 校验 */ });
```

## 六、Schema 校验与序列化（性能核心）

Fastify 用 JSON Schema 同时做**请求校验**和**响应序列化**，显著提升性能：

```js
app.post('/users', {
  schema: {
    body: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
    response: { 201: { type: 'object', properties: { id: { type: 'number' } } } },
  },
}, async (request, reply) => {
  reply.code(201);
  return { id: 1, name: request.body.name };
});
```

- 校验失败自动返回 400，无需手写 if。
- 与 Java 的 Bean Validation（`19-jpa.md` 的 `@NotNull`）思路一致。

## 七、与 Express 对比

| 维度 | Express 4.x | Fastify 5.x |
|---|---|---|
| 性能 | 中 | 高（schema 序列化） |
| 中间件模型 | `(req,res,next)` 链 | 插件封装 + 生命周期钩子 |
| 校验 | 手写 / 第三方 | 内置 JSON Schema |
| 日志 | 第三方 morgan | 内置 pino |
| TypeScript | 需 `@types/express` | 一等公民 |
| 学习成本 | 低 | 中 |

> NestJS 同时支持 Express 与 Fastify 平台适配器，故两者都值得掌握。

## 八、错误处理

```js
app.setErrorHandler((error, request, reply) => {
  reply.code(error.statusCode || 500).send({ message: error.message });
});
```

> 延伸：`11-express.md`、`14-node-test.md`、`技术文档/nest`（Fastify 适配器）。
