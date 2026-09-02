# 38 · WASM 前端框架（Leptos / Yew）

> 官方来源：Leptos（https://leptos.dev/，首页确认 signals/server-functions/SSR/hydration）；Yew（https://yew.rs/，标准知识整理，首页 404 故标注）
> 说明：Leptos 首页**完整确认**核心特性（fine-grained reactive signals、`#[component]`、`view!`、`#[server]`、SSR+hydration、Tailwind/热重载）；Yew 基于官方标准 API 整理并标注来源。

Rust 编译到 WebAssembly 做前端（见 `25-wasm-web.md`）有两大框架：**Leptos**（细粒度响应式）与 **Yew**（类 React 虚拟 DOM）。它们是对 `技术文档/react`、`nextjs` 的 Rust 替代。

## 一、Leptos（细粒度响应式）

### 信号与组件
```rust
use leptos::*;

#[component]
fn Counter() -> impl IntoView {
    let (count, set_count) = signal(0);          // 响应式信号
    view! {
        <button on:click=move |_| set_count.update(|c| *c += 1)>
            "Clicked: " {count}
        </button>
    }
}
```

- `signal(0)`：细粒度信号，仅更新依赖它的 DOM 节点（无需整组件重渲染）。
- `view!` 宏：JSX 风格模板（过程宏，见 `26-proc-macro-deep.md`）。
- `#[component]`：定义组件（返回 `impl IntoView`）。

### 服务端函数（全栈）
```rust
#[server(GetUser, "/api")]
async fn get_user(id: u32) -> Result<User, ServerFnError> {
    // 可直接用 sqlx（36章）查库，前后端共享类型
    sqlx::query_as!(User, "SELECT ...").fetch_one(&pool).await.map_err(|e| ...)
}
```

- `#[server]`：函数跨客户端/服务端边界，无需手写 API 端点；对比 `31-async-graphql.md`、`32-tonic-grpc.md`。
- SSR + Hydration：服务端渲染 HTML，客户端 WASM "注水" 交互（对比 Next.js `技术文档/nextjs`）。

## 二、Yew（虚拟 DOM，类 React）

```rust
use yew::prelude::*;

#[function_component]
fn App() -> Html {
    let counter = use_state(|| 0);
    let onclick = {
        let counter = counter.clone();
        move |_| counter.set(*counter + 1)
    };
    html! {
        <button onclick={onclick}>{ *counter }</button>
    }
}
```

- `html!` 宏 = JSX；`use_state` = React `useState`（见 `技术文档/react`）。
- `function_component` 类 React 函数组件。
- 与 Leptos 区别：Yew 用虚拟 DOM 整体 diff；Leptos 用细粒度信号精准更新。

## 三、与系列对照

| Rust 前端 | React/TS | 说明 |
|---|---|---|
| `view!` / `html!` | JSX/TSX | 模板语法 |
| `signal` | `useState`/`useSignal` | 状态 |
| `#[server]` | Server Action / Route Handler | 全栈 |
| Leptos SSR | Next.js SSR | 服务端渲染 |
| WASM 运行时 | V8/浏览器 | 见 `25-wasm-web.md` |

- 优势：Rust 类型安全贯穿前后端（共享 `User` 类型，编译期校验）。
- 劣势：WASM 体积/启动（25 章优化）、生态不如 React 成熟。

## 四、构建（trunk）

```bash
cargo install trunk
trunk serve            # Leptos/Yew 开发服务器
trunk build --release  # 产出 wasm + html
```

- `trunk` 是 Rust WASM 前端构建工具（类比 Vite，见 `技术文档/nextjs` 的 Vite）。

> 延伸：`25-wasm-web.md`、`技术文档/react`、`技术文档/nextjs`、`26-proc-macro-deep.md`、`36-data-redis-sqlx.md`。
