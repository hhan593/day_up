# 20. TSX 运行时与 TS 直接执行

> 来源可信度：**官方文档确认**（基于 `tsx`、`ts-node`、Node `--experimental-strip-types` 官方文档）
> 关联：`04-modules-cjs-esm.md`、`11-tsconfig.md`

## 1. 为什么需要 TS 运行时

Node 不原生认 `.ts`。执行 TS 需：先编译（tsc）再跑，或用运行时直接加载（strip types）。

## 2. Node 原生（20.6+）：--experimental-strip-types

```bash
node --experimental-strip-types app.ts
```

- Node 22+ 已稳定支持（无需 flag 在某些版本）。仅做**类型擦除**，不类型检查。
- 限制：不支持 `enum`/`namespace`/参数属性等需降级的语法（需 `tsc` 或 tsx）。

## 3. tsx（推荐开发/脚本）

```bash
npm i -D tsx
tsx app.ts            # 直接跑
tsx watch app.ts      # 热重载
```

- 基于 esbuild，快、零配置、支持全部 TS 语法 + ESM/CJS 互转。
- 适合 CLI 脚本、构建脚本、测试入口。

## 4. ts-node（老牌）

```bash
ts-node app.ts
# 配合 tsconfig-paths 解析路径别名
```

- 比 tsx 慢，配置多，但生态成熟。

## 5. 生产部署怎么选

| 场景 | 建议 |
|------|------|
| 开发/脚本 | `tsx` |
| 库发布 | `tsc`/`tsup` 编译成 js + dts（见 `17-engineering`） |
| Node 22+ 简单服务 | 原生 strip-types |
| 需要完整类型检查 | 编译期 `tsc --noEmit` 校验 |

## 6. 路径别名

```jsonc
// tsconfig.json
{ "paths": { "@/*": ["src/*"] } }
```

- 运行时需 `tsx`/`ts-node` + `tsconfig-paths`，或 `tsup` 的 `alias` 在构建期解析。

## 7. 一句话总结

> 跑 TS：Node 22+ 原生 `--experimental-strip-types` 最快（仅擦除），`tsx` 最省心（全语法+热重载），`tsc` 出产品质 js。开发用 tsx，发布用 tsup/tsc 编译。
