# NestJS MVC（模型-视图-控制器）技术详解

> 来源：https://docs.nestjs.cn/techniques/mvc
> 作用：服务端渲染模板（SSR），返回 HTML 页面。Express / Fastify 用法不同。

---

## 一、Express 下 MVC

### 安装
```bash
npm install --save hbs   # Handlebars 模板引擎（可换其他）
```

### 配置（main.ts）
```ts
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useStaticAssets(join(__dirname, '..', 'public'));   // 静态目录
app.setBaseViewsDir(join(__dirname, '..', 'views'));    // 视图目录
app.setViewEngine('hbs');                               // 模板引擎
await app.listen(process.env.PORT ?? 3000);
```

### 渲染
```ts
// views/index.hbs
// <body>{{ "{{ message }\\}" }}</body>

import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')   // 指定模板（无扩展名）
  root() {
    return { message: 'Hello world!' };
  }
}
```

### 动态渲染（@Res）
```ts
@Get()
root(@Res() res: Response) {
  return res.render(this.appService.getViewName(), { message: 'Hello world!' });
}
```

---

## 二、Fastify 下 MVC

```bash
npm i --save @fastify/static @fastify/view handlebars
```
```ts
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
app.useStaticAssets({ root: join(__dirname, '..', 'public'), prefix: '/public/' });
app.setViewEngine({ engine: { handlebars: require('handlebars') }, templates: join(__dirname, '..', 'views') });
```
- `@Render('index.hbs')` 必须带扩展名。
- 动态：`res.view('index.hbs', { title: '...' })`（`res` 为 `FastifyReply`）。

---

## 三、差异对照

| 项 | Express | Fastify |
|---|---|---|
| 静态目录 | `useStaticAssets(join(...))` | `useStaticAssets({root, prefix})` |
| 视图目录 | `setBaseViewsDir` | `setViewEngine({templates})` |
| 引擎 | `setViewEngine('hbs')` | `setViewEngine({engine:{handlebars}})` |
| `@Render` 模板名 | 无扩展名 | 有扩展名 `.hbs` |
| 动态渲染 | `res.render` | `res.view` |

**对比**：类似 **Spring MVC 的 `Thymeleaf`/`FreeMarker` 视图解析**、**Express 原生 `res.render`**，Nest 用 `@Render` 装饰器声明式渲染。

> 口诀：**"Express 用 hbs 无扩展，Fastify 要带 .hbs；静态视图两函数，@Render 最省事。"**
