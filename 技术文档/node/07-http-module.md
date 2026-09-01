# 07 - HTTP 模块（服务端与客户端）

> 来源：Node.js 官方 `http` 模块文档（v26.8.1）
> 官方：https://nodejs.org/api/http.html
> 模块稳定性：2 - Stable

`http` 模块让 Node 直接构建 HTTP 服务器与客户端，是 Express / Nest / Next.js 的底层。

---

## 一、创建服务器

```js
import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('okay');
});
server.listen(8000, () => console.log('listening on 8000'));
```

- `createServer(requestListener)`：监听 `'request'` 事件。
- `req`：可读流（IncomingMessage）；`res`：可写流（ServerResponse）。

---

## 二、请求对象（req）

| 属性 | 说明 |
|---|---|
| `req.url` | 路径+查询，如 `/api?x=1` |
| `req.method` | `GET`/`POST`... |
| `req.headers` | 头对象（键小写） |
| `req.socket` | 底层 TCP socket |

### 读取请求体（流）
```js
let body = '';
req.on('data', chunk => { body += chunk; });
req.on('end', () => {
  console.log('body:', body);
  res.end('received');
});
```

---

## 三、响应对象（res）

```js
res.writeHead(200, { 'Content-Type': 'application/json' });
res.setHeader('X-Powered-By', 'Node');
res.statusCode = 201;
res.write('part1');
res.end('part2');   // 必须调用，通知响应完成
```

- `writeHead()`：发头（一次）。
- `end(data)`：发体并结束；不调用 `end()` 连接不关闭。
- `Content-Length` 用 `Buffer.byteLength()` 算字节数（非字符数）。

---

## 四、路由与状态码

```js
const server = http.createServer((req, res) => {
  if (req.url === '/api/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ id: 1, name: 'Tom' }]));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});
```

- `http.STATUS_CODES`：标准状态码表（`200`/`400`/`404`/`500`...）。
- 生产用框架（Express/Nest/Fastify）封装路由，不必手写 if-else。

---

## 五、客户端请求

```js
import http from 'node:http';

const req = http.request(
  { hostname: 'localhost', port: 8000, path: '/', method: 'GET' },
  (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => console.log(data));
  }
);
req.end();   // 必须调用发送

// 便捷 GET
http.get('http://localhost:8000', (res) => { /* ... */ });
```

- `req.end()` 触发发送（GET 自动调）。
- `http.Agent`：连接池（keepAlive 复用）。
- Node 18+ 内置 `fetch()`（基于 undici），多数场景用它替代 `http.request`。

---

## 六、服务器配置项

| 属性 | 默认 | 说明 |
|---|---|---|
| `server.timeout` | 0 | 套接字超时（0=无） |
| `server.keepAliveTimeout` | 5000ms | keep-alive 超时 |
| `server.requestTimeout` | 300000ms | 请求超时 |
| `server.maxHeadersCount` | 2000 | 最大头数 |

---

## 七、与系列其他文档的关系

- req/res 是流（06 篇），body 用 `'data'`/`'end'` 消费。
- 对比 Nest（技术文档/nest）：Nest 的 `@Controller`/`@Get` 封装了 http 模块。
- 对比 Next.js（技术文档/nextjs）：Route Handler 底层是 Node http/undici。
- 对比 Java Spring（java/13）：`@RestController` 对应 `http.createServer` + 路由；Spring 用 Tomcat 容器。
- 对比前端 fetch：Node 内置 `fetch` 与浏览器 API 一致（跨端复用代码）。
