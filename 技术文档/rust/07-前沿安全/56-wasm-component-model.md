# 56. WebAssembly 组件模型（Component Model / WIT）

> 来源可信度：**官方结构确认 + 标准实践**（基于 `wasmtime 48.0.1` 官方 docs 中 `component` 模块说明、WASI/WIT 官方规范；Wasmtime 官方文档明确其 component 支持）
> 关联：`25-wasm-web.md`、`45-wasm-optimization.md`、`50-wasmtime-wasi.md`

## 1. 从核心 WASM 到组件模型

**核心 WASM（Core Wasm）** 只懂 `i32/i64/f32/f64` 和线性内存。跨语言互操作要手写序列化、手动管理内存——痛苦且易错。

**组件模型（Component Model）** 在核心 WASM 之上加一层：

- 用 **WIT（Wasm Interface Type）** 描述接口（记录、枚举、字符串、列表、资源等高级类型）。
- 工具链自动生成**规范 ABI（Canonical ABI）** 的胶水代码。
- 组件可**组合（compose）**：一个组件导入的接口由另一个组件提供。

```
                组件模型（Component）
   ┌─────────────────────────────────────────┐
   │  WIT 接口  +  高级类型  +  规范 ABI        │
   │  ┌─────────────────────────────────┐    │
   │  │     核心 WASM 模块（Core Module） │    │
   │  └─────────────────────────────────┘    │
   └─────────────────────────────────────────┘
```

## 2. WIT 接口定义语言

```wit
// world.wit —— 描述一个"世界"
package example:calculator@1.0.0;

// 接口
interface ops {
    // 高级类型：变体（类似 Rust enum）
    variant error {
        divide-by-zero,
        overflow,
    }

    // 记录（类似 struct）
    record point { x: f64, y: f64 }

    // 函数，返回 Result 风格
    add(a: f64, b: f64) -> f64;
    div(a: f64, b: f64) -> result<f64, error>;
    distance(p1: point, p2: point) -> f64;
}

// world：导入/导出的组合
world calculator {
    export ops;              // 对外提供 ops 接口
    import wasi:logging/logging@1.0.0;   // 导入 WASI 日志
}
```

**WIT 类型**：`u8..u64`/`s8..s64`/`f32`/`f64`/`bool`/`char`/`string`、`record`、`variant`、`enum`、`union`、`list<T>`、`option<T>`、`result<T,E>`、`tuple`、`resource`、`flags`。

## 3. Wasmtime 的组件支持

官方文档（见 `50-wasmtime-wasi.md`）明确：

> The second half of the crate is for use with the **WebAssembly Component Model**. The implementation of the component model is present in `wasmtime::component` and roughly mirrors the structure for core WebAssembly, for example `component::Func` mirrors `Func`.

```toml
wasmtime = { version = "48", features = ["component-model"] }   # 默认已启用
```

**核心类型对照**：

| 核心 WASM | 组件模型 |
|-----------|---------|
| `Module` | `component::Component` |
| `Instance` | `component::Instance` |
| `Func` | `component::Func` |
| `TypedFunc` | `component::TypedFunc` |
| `Linker` | `component::Linker` |
| `Resource` | `component::Resource`（资源句柄） |

## 4. 用 Rust 写组件（cargo-component）

```bash
cargo install cargo-component
cargo component new my-calc --lib
```

生成项目含 `wit/world.wit` 与 `src/lib.rs`。

```rust
// src/lib.rs
use bindings::exports::example::calculator::ops::{Guest, Point, Error};

// 让 cargo-component 生成绑定
mod bindings;

struct Component;

// 必须有一个 "Guest" 实现，作为组件入口
impl Guest for Component {
    fn add(a: f64, b: f64) -> f64 { a + b }

    fn div(a: f64, b: f64) -> Result<f64, Error> {
        if b == 0.0 { Err(Error::DivideByZero) } else { Ok(a / b) }
    }

    fn distance(p1: Point, p2: Point) -> f64 {
        ((p1.x - p2.x).powi(2) + (p1.y - p2.y).powi(2)).sqrt()
    }
}

bindings::export!(Component with_types_in bindings);
```

```bash
cargo component build --release
# 产物：target/wasm32-wasip1/release/my_calc.wasm （已是组件，非核心模块）
```

**关键**：`cargo component build` 产出的 `.wasm` 是**组件**，而普通 `cargo build --target wasm32-wasip1` 产出的是**核心模块**。二者不通用。

## 5. 用 Wasmtime 宿主调用组件

```rust
use wasmtime::component::*;
use wasmtime::{Config, Engine, Store};

#[tokio::main]
async fn main() -> wasmtime::Result<()> {
    let mut config = Config::new();
    config.wasm_component_model(true);      // 显式启用（默认已开）
    let engine = Engine::new(&config)?;

    let component = Component::from_file(&engine, "my_calc.wasm")?;

    let mut linker = Linker::new(&engine);
    // 添加 WASI（组件版）
    wasmtime_wasi::add_to_linker_async(&mut linker)?;

    let mut store = Store::new(&engine, MyState::default());
    let (bindings, _) = MyCalc::instantiate_async(&mut store, &component, &linker).await?;

    // 直接调用高级类型方法（自动做 Canonical ABI 转换）
    let sum = bindings.example_calculator_ops().call_add(&mut store, 2.0, 3.0).await?;
    println!("2 + 3 = {sum}");       // 5

    let div = bindings.example_calculator_ops()
        .call_div(&mut store, 10.0, 0.0).await?;
    match div {
        Ok(v) => println!("= {v}"),
        Err(e) => println!("error: {e:?}"),   // DivideByZero
    }

    Ok(())
}
```

> Wasmtime 提供 `bindgen!` 宏，从 WIT 直接生成 Rust 绑定类型（上例的 `MyCalc`）：

```rust
wasmtime::component::bindgen!({
    path: "wit/world.wit",
    world: "calculator",
    async: true,
});
```

## 6. 组件组合（Composition）

组件模型的杀手级特性：**不用重编译就能把两个组件接起来**。

```
   my-app.wasm  (imports: example:calculator/ops)
 + my-calc.wasm (exports: example:calculator/ops)
 ─────────────────────────────────────────────
 = composed.wasm  （自包含，无未满足导入）
```

```bash
# 用 wac 工具组合
cargo install wac-cli
wac compose my-app.wasm --dep my-calc.wasm -o composed.wasm

# 或用 Wasmtime 的 wasm-compose feature
```

**价值**：像拼乐高一样组合不同语言写的组件——Rust 写的加密组件 + Go 写的业务组件 + JS 写的脚本组件，无需 FFI 胶水。

## 7. 跨语言互操作

| 语言 | 工具链 |
|------|--------|
| Rust | `cargo-component`（最成熟） |
| C/C++ | `wit-bindgen` c 生成器 |
| Go | TinyGo `wasm-abi` / `go.bytecodealliance.org` |
| JS/TS | `jco`（Bytecode Alliance 官方 JS 工具链） |
| Python | `componentize-py` |

```bash
# JS 侧：把组件转成 JS 模块
npm i @bytecodealliance/jco
jco transpile my-calc.wasm -o out-dir/
```

```js
import { ops } from './out-dir/my-calc.js';
console.log(ops.add(2, 3));      // 5
```

> 这才是"**一次编译，多语言调用**"的真正落地——与 `30-rust-java-jni.md` 的 JNI、`21-unsafe-ffi.md` 的 C FFI 相比，组件模型类型安全、无 unsafe、无需手写胶水。

## 8. 与 WASI 的关系

- **WASI Preview 1（WASIp1）**：基于核心 WASM 的 POSIX 风格系统调用（`wasm32-wasip1` target）。
- **WASI 0.2 / Preview 2（WASIp2）**：**基于组件模型**，接口用 WIT 描述（`wasi:filesystem`、`wasi:sockets`、`wasi:http`、`wasi:logging` 等）。

```wit
world my-server {
    import wasi:logging/logging@1.0.0;
    export wasi:http/incoming-handler@0.2.0;   // 实现 HTTP handler
}
```

> WASIp2 让"用任意语言写一个 HTTP 服务组件"成为可能，是 Serverless/边缘计算的重要方向。

## 9. 组件 vs 核心模块 对照

| | 核心模块（Core Module） | 组件（Component） |
|---|------------------------|-------------------|
| 类型 | 只有 i32/i64/f32/f64 | 记录/变体/字符串/List/资源 |
| 接口 | 靠约定 + 手动序列化 | WIT 声明 + 自动生成 |
| 组合 | ❌ 需手写链接 | ✅ `wac compose` 自动 |
| 目标 | `wasm32-wasip1`（`cargo build`） | `cargo component build` |
| 宿主 API | `wasmtime::Module` | `wasmtime::component::Component` |
| 适用 | 简单嵌入、浏览器 | 跨语言插件、微服务、Serverless |

## 10. 常见坑

| 坑 | 解决 |
|----|------|
| `Module` 与 `Component` 混用报错 | 二者 API 不同：组件用 `wasmtime::component::*` |
| 普通 `cargo build` 产物无法当组件加载 | 必须用 `cargo component build` |
| WIT 版本不匹配 | `package name@version` 要严格对齐 |
| 资源（resource）泄漏 | 组件的资源句柄需显式 drop |
| async 与 sync 混用 | 组件若用 async host 函数，全程 `*_async` |
| 生成绑定找不到 | 检查 `bindgen!` 的 `world` 名与 wit 文件一致 |

## 11. 一句话总结

> 组件模型给 WASM 加**高级类型 + 标准 ABI**：用 **WIT** 声明接口，`cargo-component` 生成绑定（注意产物是**组件**而非核心模块，API 不可混用），`wasmtime::component::*` 调用，`wac compose` **无需重编译即可组合**多语言组件。WASIp2 正建立在这套模型上，是跨语言安全互操作（替代 JNI/手写 FFI）的未来方向。
