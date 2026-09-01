# 11 · Express 框架（Node.js Web 框架）

> 官方来源：Express.js 4.x API Reference（https://expressjs.com/en/4x/api.html，OpenJS Foundation）
> 版本：Express 4.x（当前主线为 4.21.x，5.x 已发布但生态仍大量使用 4.x）
> 说明：Express 官网 API 页为目录式（仅章节锚点），本文基于官方文档结构与 Express 标准 API 整理；示例代码为官方示例风格的真实可用写法。

Express 是 Node.js 生态最成熟的 Web 框架，本质是对 `node:http` 模块的轻量封装：路由 + 中间件 + 请求/响应增强。理解它先回顾 `07-http-module.md`。

## 一、应用创建与监听

```js
import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('hello world'));
app.listen(3000, () => console.log('on 3000'));
```

- `express()` 返回 `app`（`Application` 对象）。
- `app.listen(port, cb)` 内部调用 `http.createServer(app).listen(...)`。

## 二、路由（Routing）

`app.METHOD(path, handler)` 注册路由；支持 `get/post/put/delete/patch/all`。

```js
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});
```

- `req.params`：路径参数（`/users/:id`）。
- `req.query`：查询字符串（`?page=2`）。
- `req.body`：需先挂 `express.json()` 等中间件才可用（见下文）。

`express.Router()` 创建模块化路由：

```js
import { Router } from 'express';
const router = Router();
router.get('/', listUsers);
app.use('/users', router); // 挂载到 /users
```

## 三、中间件（Middleware）—— Express 核心

中间件函数签名：`(req, res, next) => {}`。`next()` 把控制权交给下一个中间件；不调用 `next()` 且不响应则请求挂起。

```js
// 应用级中间件
app.use(express.json());              // 解析 JSON body
app.use((req, res, next) => {         // 日志中间件
  console.log(`${req.method} ${req.url}`);
  next();
});

// 路由级中间件（数组）
app.get('/secure', authMiddleware, handler);
```

### 内置中间件
- `express.json()`：解析 `application/json` 请求体 → `req.body`。
- `express.urlencoded({ extended: true })`：解析表单。
- `express.static('public')`：托管静态文件。

```js
app.use(express.static('public')); // 访问 /style.css -> public/style.css
```

### 第三方中间件
`cors`、`morgan`(日志)、`multer`(文件上传)、`cookie-parser`、`helmet`(安全头)。

## 四、请求与响应对象（增强版）

`req`（继承 http.IncomingMessage）：
- `req.params` / `req.query` / `req.body` / `req.headers` / `req.ip`

`res`（继承 http.ServerResponse）：
- `res.send()` / `res.json()` / `res.sendFile()`
- `res.status(201).send()`
- `res.redirect(302, '/login')`
- `res.setHeader()/res.cookie()`
- `res.render()`（配合模板引擎）

## 五、错误处理中间件

**签名必须有 4 个参数 `(err, req, res, next)`**，否则 Express 不识别为错误处理中间件：

```js
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message });
});
```

- 用 `next(err)` 在任意中间件/路由中抛出错误，交给错误处理中间件。
- 与 `react/16-全局错误处理`、`nest/05-异常过滤器` 对照：Nest 的异常过滤器就是 Express 错误处理中间件的框架化封装。

## 六、与 Nest / Next.js 的衔接

- **NestJS**（`技术文档/nest`）：Nest 底层就是 Express（或 Fastify）适配器，`@Controller` 路由、`@UseGuards` 守卫、`@UseFilters` 过滤器全部翻译为 Express 中间件链。学 Nest 前先懂 Express 中间件模型事半功倍。
- **Next.js**（`技术文档/nextjs`）：Next 的自定义 server 可用 Express 包裹；Route Handler 本质是在 Node 运行时处理请求。

## 七、Express 5.x 关键变化（了解）
- 路径匹配改用 `path-to-regexp` v8，`:param` 需显式，正则写法收紧。
- `res.sendFile` 的 `options` 校验更严格。
- 默认更多安全行为。

## 八、典型生产结构

```
src/
  app.js          # express() + 中间件 + 路由挂载
  routes/         # express.Router 模块
  middlewares/    # auth / logger / errorHandler
  controllers/    # 业务逻辑
  services/
```

> 延伸阅读：`07-http-module.md`（底层）、`13-fastify.md`（更快的替代）、`14-node-test.md`（测试）、`10-README.md`。
