g# 17. TypeScript 工程化实践

> 来源可信度：**标准实践**（基于 tsup、Vitest、Changesets 官方文档结构；与 `11-tsconfig.md`/`13-typescript-best-practices.md` 衔接）
> 关联：Rust `20-cargo-advanced.md`（Cargo workspace 对照）

## 1. 构建：tsup（零配置）

```ts
// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],   // 双格式
  dts: true,                 // 生成 .d.ts
  clean: true,
  minify: true,
  sourcemap: true,
});
```

- 基于 esbuild（见 Node `20-bundling-esbuild-rollup.md`），快。
- 库发布首选：`package.json` 配 `exports` 指向 cjs/esm/dts。

## 2. 测试：Vitest

```ts
// math.test.ts
import { describe, it, expect } from 'vitest';
import { add } from './math';

describe('add', () => {
  it('sums', () => expect(add(1, 2)).toBe(3));
});
```

```bash
vitest run        # CI
vitest            # watch
```

- 兼容 Jest API，但用 ESM、Vite 转化，更快。
- 与 Rust `11-rust测试与文档手册.md`/`17-rustlings` 思路相通：测试即文档。

## 3. Monorepo：pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

- 与 Rust `20-cargo-advanced.md` 的 `[workspace]` 对照：pnpm 管 JS 多包，Cargo 管 Rust 多 crate。
- 用 `tsup` 各自构建，根 `turbo`/`nx` 编排任务依赖。

## 4. 发布：Changesets

```bash
npx changeset add     # 选改动的包 + semver
npx changeset version # 改版本号 + 生成 CHANGELOG
npx changeset publish # 发 npm
```

## 5. 类型发布最佳实践

- `compilerOptions.declaration: true` + `emitDeclarationOnly` 单独出 `.d.ts`。
- `package.json`：`types` 指向 dts、`exports` 字段区分 import/require。
- 避免发布 `src`、锁文件、测试。

## 6. 与 Rust 工程化对照

| 能力 | TS (pnpm) | Rust (Cargo) |
|------|-----------|--------------|
| 多包 | workspace | [workspace] |
| 构建 | tsup/tsc | cargo build |
| 测试 | vitest | cargo test |
| 发版 | changeset | cargo publish |
| 类型 | .d.ts | 编译内联 |

## 7. 一句话总结

> TS 工程化：tsup 双格式打包 + dts，Vitest 跑测试，pnpm workspace 管多包，Changesets 发版。与 Rust Cargo workspace 一一对照，思路同源。
