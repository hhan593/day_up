n# 20. Node.js 打包与构建工具（esbuild / Rollup / Turbopack）

> 来源可信度：**官方文档确认**（基于 esbuild、Rollup、Turbopack 官方文档结构）
> 关联：`04-modules-cjs-esm.md`、`15-bun-deno-fullstack.md`

## 1. 为什么 Node 也要打包

- 减小部署体积（去掉 devDeps、合并文件）。
- 缩短冷启动（Lambda/Serverless 单文件快）。
- 编译 TS/JSX、Tree-shaking、产物统一。

## 2. esbuild（极速）

```js
// build.js
require('esbuild').build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  external: ['pg', 'sharp'], // 原生模块不打包
}).catch(() => process.exit(1));
```

```bash
esbuild src/index.ts --bundle --platform=node --outfile=dist/index.js
```

- Go 写的解析器，比 webpack 快 10-100x。
- 不支持深度 Tree-shaking 配置，但速度碾压；适合 server 打包。

## 3. Rollup（精准 tree-shaking）

```js
// rollup.config.js
export default {
  input: 'src/index.js',
  output: { file: 'dist/index.mjs', format: 'esm' },
  external: ['node:fs', 'express'],
  plugins: [/* nodeResolve, commonjs */],
};
```

- 库（library）打包首选，tree-shaking 最彻底。
- Node 应用用 esbuild 更省心，库用 Rollup 更优。

## 4. Turbopack / SWC（Rust 系）

- `Turbopack`（Next.js 默认，Rust 写）：增量构建，HMR 极快。
- `SWC`（Rust 写）：替代 Babel，TS/JS 编译快 20x。
- 与 Rust 目录 `21-unsafe-ffi.md`/`17` 呼应：前端工具链 Rust 化趋势。

## 5. 产物格式与 external

- `platform: 'node'` 时不应打包 Node 内置模块（`node:*`）与原生模块。
- CJS 库用 `format: 'cjs'`，ESM 用 `format: 'esm'`（见 `04-modules-cjs-esm.md`）。
- Serverless 部署建议 `bundle: true` + 单文件。

## 6. 选择建议

| 场景 | 工具 |
|------|------|
| Node 服务/CLI 打包 | esbuild |
| 发布 npm 库 | Rollup |
| Next.js 应用 | Turbopack（内置） |
| TS 编译 | tsc / swc |

## 7. 一句话总结

> Node 打包：esbuild 极速适合服务/CLI，Rollup tree-shaking 适合库，Turbopack/SWC 是 Rust 系新秀。记得 `external` 原生模块与 `node:*` 内置，Serverless 用单文件 bundle 加速冷启。
