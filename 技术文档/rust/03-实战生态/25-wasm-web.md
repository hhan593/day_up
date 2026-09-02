# 25 · Rust + WebAssembly（前端高性能扩展）

> 官方来源：Rust and WebAssembly Book（https://rustwasm.github.io/docs/book/）
> ⚠️ 状态说明：该官方书项目**已停维（no longer maintained）**，本文基于其确认过的章节结构（wasm-pack/wasm-bindgen/JS 互操作/性能/体积/部署）与标准 API 整理；WASM 标准本身仍在演进。

Rust 编译到 WebAssembly（Wasm）可在浏览器跑接近原生速度的代码，是 JS/TS（见 `技术文档/typescript`、`react`）性能瓶颈处的理想补充。

## 一、工具链

- **`wasm-pack`**：把 Rust crate 构建为 npm 可用包（`wasm-pack build` → `pkg/`）。
- **`wasm-bindgen`**：Rust 与 JS 间的桥接（函数/类型互调）。
- **`wasm-bindgen-cli`** / **`twiggy`**（体积分析）/ **`wasmpack`** plugin for webpack。

```bash
cargo install wasm-pack
wasm-pack new mylib      # 脚手架
cd mylib && wasm-pack build --target web
```

## 二、#[wasm_bindgen] 基础

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);          // 声明 JS 全局函数
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    let msg = format!("Hello, {}!", name);
    alert(&msg);
    msg
}
```

- `#[wasm_bindgen]` 标注的导出函数/结构体可被 JS `import` 调用。
- `extern "C"` 块声明要调用的 JS 函数（如 `alert`、`console.log`）。
- 与 `21-unsafe-ffi.md` 的 C FFI 思路一致，但目标是 Wasm ABI。

## 三、结构体与 JS 类

```rust
#[wasm_bindgen]
pub struct Counter { count: u32 }

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Counter { Counter { count: 0 } }

    pub fn increment(&mut self) -> u32 {
        self.count += 1;
        self.count
    }
}
```
- JS 侧：`const c = new Counter(); c.increment();`

## 四、DOM 操作（web-sys）

```rust
use web_sys::document;
let window = web_sys::window().unwrap();
let doc = window.document().unwrap();
let body = doc.body().unwrap();
let p = doc.create_element("p").unwrap();
p.set_text_content(Some("来自 Rust!"));
body.append_child(&p).unwrap();
```

- `web-sys`：浏览器 API 绑定（DOM/Canvas/WebGL）。
- `js-sys`：JS 标准对象（Promise/Array/Date）。

## 五、与 JS/TS 互操作注意

- **字符串**：Rust `String` ↔ JS `string` 自动转换但有拷贝成本（大字符串用 `js_sys::Uint8Array` 零拷贝）。
- **内存**：Wasm 线性内存，Rust 堆在 Wasm 内存内；JS 不能直接读 Rust 指针。
- **异步**：Rust `async` 可返回 `js_sys::Promise`（`wasm_bindgen_futures`）。

## 六、性能与体积

- 时间性能分析：浏览器 DevTools Performance 面板 + `console.time`。
- 缩减 `.wasm` 体积：`wasm-opt -Oz`、`[profile.release] opt-level="z"`、`lto=true`、`panic="abort"`。
- 适合场景：图像/音频处理、加密、游戏、物理引擎、解析器——把热点从 JS 迁到 Rust。

## 七、与系列对照

| Rust + Wasm | 其他 |
|---|---|
| `#[wasm_bindgen]` | TS `declare` / `ffi` 类型 |
| `web-sys` | 浏览器 DOM API（TS 直接调） |
| Rust 计算密集 | React/TS 逻辑（react、typescript） |
| Wasm 线性内存 | JS 堆（node/08 Buffer） |

- 典型架构：React/Next.js（前端框架）调 Rust-Wasm 模块做重计算——Rust 补 Node/TS 性能短板（见 `23-cross-lang-comparison.md` 第 7 节）。
- `wasm-bindgen` 与 `21-unsafe-ffi.md` 的 `extern` 机制同源。

> 延伸：`21-unsafe-ffi.md`、`技术文档/typescript`、`技术文档/react`、`23-cross-lang-comparison.md`。
