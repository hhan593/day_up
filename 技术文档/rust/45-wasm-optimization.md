# 45. WASM 优化实战（Rust → WebAssembly）

> 来源可信度：**官方结构确认 + 标准实践**（基于 `wasm-bindgen`、`wasm-pack`、`wasm-opt` 官方文档；Rust-WASM Book 已停维，部分以标准知识补充并标注）
> 关联：`25-wasm-web.md`、`38-wasm-frontend-leptos-yew.md`

## 1. 构建产物与体积瓶颈

Rust 编译到 WASM 默认会带：

- 标准库占位、panic 字符串、`fmt` 实现。
- 未剥离的调试名与 DWARF 信息。
- `wee_alloc`（若启用）等额外分配器。

典型 debug 产物可达数 MB，release 经优化后几十~几百 KB。

## 2. 减小体积的核心手段

### 2.1 Cargo 配置

```toml
# Cargo.toml
[profile.release]
opt-level = "z"     # 体积优先优化
lto = true          # 链接期优化
codegen-units = 1   # 单代码单元，更多内联/优化
panic = "abort"     # 丢弃 unwind 栈展开，减小体积
strip = true        # 去除符号
```

### 2.2 用 wasm-opt 二次优化

```bash
# 安装 binaryen
cargo install wasm-opt

# 构建
wasm-pack build --release --target web

# 二次压缩
wasm-opt -Oz -o pkg/optimized.wasm pkg/name_bg.wasm
```

`wasm-opt -Oz` 通常再砍掉 20%~40% 体积。

### 2.3 用 wee_alloc 或自带分配器

```rust
// 旧做法（注意 wee_alloc 已不再积极维护，仅作了解）
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// 现代做法：Rust 1.68+ 自带 Mimalloc 风格不必强依赖
// 对无分配场景可完全不启用全局分配器
```

> 注意：分配器选择需权衡。若热路径频繁小对象分配，`dlmalloc`（wasm 默认）通常够用；`wee_alloc` 仅为极致体积，但有性能代价。

## 3. 减少 JS ↔ WASM 边界开销

WASM 与 JS 之间传递数据的成本远高于 Rust 内部调用。**边界是性能关键**：

```rust
use wasm_bindgen::prelude::*;

// ❌ 慢：每次调用跨边界传 Vec，序列化成 JS 数组
#[wasm_bindgen]
pub fn sum_slice(data: &[i32]) -> i32 {
    data.iter().sum()   // &[i32] 用 TypedArray 视图，零拷贝 ✅
}

// ✅ 用 TypedArray 视图（&[T] / &mut [T]）而非 Vec 返回
#[wasm_bindgen]
pub fn double_in_place(buf: &mut [f64]) {
    for x in buf.iter_mut() { *x *= 2.0; }
}
```

要点：

- 用 `&[T]` / `&mut [T]`（对应 JS `TypedArray`）实现**零拷贝**数据共享。
- 避免频繁小函数跨边界调用（如逐元素回调 JS），尽量批量处理。
- `js_sys` / `web_sys` 的类型转换有成本，热路径减少 `.into()`。

## 4. 多线程（Web Workers + SharedArrayBuffer）

```rust
// 需开启 wasm 线程支持
// RUSTFLAGS="--cfg=web_sys_unstable_apis" wasm-pack build --target web

use wasm_bindgen::prelude::*;
use web_sys::Worker;

// 配合 Rayon（见 43-rayon-data-parallel.md）的 wasm 后端，
// 在浏览器里用 SharedArrayBuffer 做线程池
```

注意：多线程要求站点开启 **COOP/COEP** 跨源隔离头，否则 `SharedArrayBuffer` 不可用。

## 5. 性能剖析

- **浏览器 DevTools → Performance**：录制看 WASM 函数耗时。
- **twiggy**：分析 WASM 占用（哪个函数/泛型占据体积）。

```bash
cargo install twiggy
twiggy top pkg/name_bg.wasm        # 体积排名
twiggy paths pkg/name_bg.wasm      # 调用链体积
```

- **console_error_panic_hook**：开发期把 panic 打到 `console.error`，便于定位（release 可关）。

## 6. 常见陷阱

| 问题 | 解决 |
|------|------|
| 体积过大 | `opt-level="z"` + `lto` + `strip` + `wasm-opt -Oz` |
| 边界慢 | 用 `&[T]` 零拷贝，批量处理 |
| panic 字符串大 | `panic="abort"` |
| 多线程不工作 | 配置 COOP/COEP 头 |
| 调试困难 | `console_error_panic_hook` + source map |

## 7. 一句话总结

> WASM 优化 = 体积（opt-level=z/lto/strip/wasm-opt）+ 边界（TypedArray 零拷贝批量）+ 剖析（twiggy/devtools）。减少 JS↔WASM 跨边界调用次数是性能第一原则。
