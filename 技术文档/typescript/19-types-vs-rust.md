# 19. TypeScript 类型系统 vs Rust 类型系统

> 来源可信度：**对比分析**（基于两语言类型系统特性；与 Rust `07-泛型Trait与生命周期`、`12-Trait` 对照）
> 关联：Rust `23-cross-lang-comparison.md`

## 1. 根本差异：运行时存在 vs 编译期擦除

| | TypeScript | Rust |
|---|-----------|------|
| 类型存在 | 编译期（运行时无类型） | 编译期（零成本抽象，运行时也无对象但生成代码） |
| 类型错误 | 运行可能炸（类型只保编译） | 编译期全拦 |
| 空值 | `null`/`undefined` 需 `strictNullChecks` | `Option<T>` 强制 |
| 类型守卫 | 运行时 `typeof`/`in`（`04-narrowing.md`） | 模式匹配 `match` |

## 2. 泛型与 trait / interface

```ts
// TS：interface + 泛型
interface Repository<T> { save(t: T): void; }
```

```rust
// Rust：trait + 泛型
trait Repository<T> { fn save(&self, t: T); }
```

- TS `interface` 是**结构类型**（鸭子类型）：形状匹配即可。结构子类型是 TS 核心（`03-everyday-types.md`）。
- Rust `trait` 是**名义类型**：必须显式 `impl`，但零成本、单态化。

## 3. 联合类型 vs 枚举

```ts
type Shape = { kind: 'circle'; r: number } | { kind: 'rect'; w: number };
// 穷尽检查靠 switch + never
```

```rust
enum Shape { Circle { r: f64 }, Rect { w: f64 } }
// match 强制穷尽，编译器保证
```

- TS 用判别联合（discriminated union）+ `never` 模拟穷尽。
- Rust `match` 编译期强制穷尽，漏分支直接报错（见 `04-枚举与模式匹配.md`）。

## 4. 类型编程

- TS：`Conditional Types`、`infer`、`keyof`、`映射类型`（`08-creating-types-from-types.md`、`12-advanced-type-system.md`）极强大，图灵完备。
- Rust：关联类型、泛型约束（`where`）、`PhantomData`，偏保守且保证单态化零开销。

## 5. 互操作：TS 调用 Rust

- 用 WASM（Rust `25-wasm-web.md`/`38-wasm-frontend`）：Rust 编译成 wasm，TS 通过 `wasm-bindgen` 调用，类型用 `.d.ts` 生成。
- 用 NAPI（`napi-rs`，见 Node `17-native-addons-napi.md`）：Rust 写原生扩展，TS 拿到类型安全绑定。

## 6. 选型直觉

- 要**灵活、快速迭代、前端友好**：TS 结构类型 + 联合类型爽。
- 要**正确性强、零成本、并发安全**：Rust 名义类型 + 枚举 + 所有权。

## 7. 一句话总结

> TS 类型编译期擦除、结构子类型、联合类型灵活；Rust 类型单态化零成本、名义 trait、枚举 match 穷尽。TS 调 Rust 走 WASM 或 NAPI。两者类型思维可互相迁移。
