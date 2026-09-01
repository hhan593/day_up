# Next.js 配置（next.config.js）

> 来源：Next.js 官方文档（https://nextjs.org/docs/app/api-reference/config/next-config-js，2025-11-04）
> 版本：Next.js 16.3.4（© 2026 Vercel, Inc.）

---

## 一、基本结构

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [],
  redirects: async () => [],
  rewrites: async () => [],
  images: { /* ... */ },
  experimental: { cacheComponents: true },
  env: { CUSTOM_VAR: 'value' },
  transpilePackages: ['some-package'],
  output: 'standalone',
};
module.exports = nextConfig;
```

- 支持 `.js` / `.mjs` / `.ts`；自 Next.js 12.1 起可导出**异步函数**：`module.exports = async (phase, { defaultConfig }) => { ... }`。
- ⚠️ `next.config` 不被 Webpack/Babel 解析，避免用目标 Node 不支持的语法。

---

## 二、headers（自定义响应头）

```js
async headers() {
  return [{ source: '/(.*)', headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Content-Security-Policy', value: "default-src 'self'" },
  ] }];
}
```

- 用途：CSP、缓存控制、跨域等安全策略。

---

## 三、redirects（重定向）

```js
async redirects() {
  return [{ source: '/old', destination: '/new', permanent: true }];
}
```

- 支持异步函数返回数组；`permanent` 决定 308/307。
- 可用 `next/experimental/testing/server` 的 `unstable_getResponseFromNextConfig` 测试（实验，15.1+）。

---

## 四、rewrites（重写）

```js
async rewrites() {
  return [{ source: '/api/:path*', destination: 'https://api.example.com/:path*' }];
}
```

- 映射请求到目标而不改 URL（代理外部 API 常用）。

---

## 五、images（图片优化）

- 为 `next/image` 配置自定义 loader、远程域名白名单等。

```js
images: {
  remotePatterns: [{ protocol: 'https', hostname: 'example.com' }],
  formats: ['image/avif', 'image/webp'],
}
```

---

## 六、experimental.cacheComponents

```js
experimental: { cacheComponents: true }
```

- 启用 Cache Components，配合 `use cache` 指令（见 `13-caching.md`）。

---

## 七、env（环境变量）

- 构建时向应用注入环境变量（仅构建期）；运行时/客户端用 `NEXT_PUBLIC_` 前缀（见 `11-server-client-components.md`）。

```js
env: { CUSTOM_API: 'https://...' }
```

---

## 八、transpilePackages

- 转译 monorepo 包或 `node_modules` 中发布 TS/JSX/现代语法的库。

```js
transpilePackages: ['@my-org/ui']
```

---

## 九、output

- 控制输出方式：`'standalone'`（精简自托管）、`'export'`（纯静态导出，不支持 proxy/Route Handler 动态）。

---

## 执行顺序（与 proxy 配合）

`next.config` headers → redirects → proxy.ts → beforeFiles → 文件系统路由 → afterFiles → 动态路由 → fallback。

---

## 小结（Recap）

- next.config 用对象/异步函数导出；
- headers/redirects/rewrites 均为异步返回数组；
- `experimental.cacheComponents` 开启新缓存模型；
- `output: 'standalone'` 利于自托管部署。

---

## 衔接

- proxy 中间件：`09-proxy-middleware.md`
- 缓存：`13-caching.md`
- 图片优化：`next/image`（官网 Image 组件）
