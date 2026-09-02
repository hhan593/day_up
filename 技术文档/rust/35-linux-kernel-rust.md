# 35 · Linux 内核中的 Rust

> 官方来源：The Linux Kernel Documentation — Rust（https://www.kernel.org/doc/html/latest/rust/index.html，含中文版 zh_CN；内核 v6.12+）
> 说明：官方文档确认 Rust 已合入主线内核（6.1 起），提供 Quick Start、abstractions、`kernel` crate；本文基于官方文档结构与标准知识整理。

Rust for Linux 让内核驱动/模块用 Rust 编写，借助类型安全减少内存安全 bug（C 内核长期痛点）。

## 一、现状

- Linux 6.1（2022）起合并 Rust 基础设施；6.12 已有可用驱动示例（如网络、GPU 试点）。
- 仅支持 `x86_64` / `arm64` / `riscv` 等架构；需启用 `CONFIG_RUST`。
- 不替代 C，而是**增量共存**：C 接口通过 `bindgen` 生成 Rust 绑定。

## 二、核心抽象（Abstractions）

内核提供 `rust/kernel` crate 的安全封装层：

| Rust 抽象 | 对应 C 内核概念 |
|---|---|
| `kernel::alloc` | `kmalloc`/`kfree` |
| `kernel::sync::Mutex`/`SpinLock` | 内核锁原语 |
| `kernel::device::Device` | `struct device` |
| `kernel::Driver`/`kernel::Module` | `struct device_driver`/`module` |

```rust
use kernel::prelude::*;
use kernel::sync::Mutex;

struct MyDriver {
    data: Mutex<Vec<u8>>,
}

kernel::module_platform_driver! {
    type: MyDriver,
    name: "my_driver",
    author: "me",
    description: "Rust platform driver",
}
```

- `kernel::module_platform_driver!`：过程宏注册平台驱动（见 `26-proc-macro-deep.md`）。
- 所有对外调用包在安全抽象内，驱动作者不直接写 `unsafe`。

## 三、与 C 互操作

- `bindgen` 由内核 C 头生成 Rust 绑定（`extern "C"` 风格，见 `21-unsafe-ffi.md`）。
- Rust 侧通过 `Opaque<T>` 持有 C 结构体（不透明，避免 Rust 假设布局）。
- 错误处理：Rust `Result` 映射到内核错误码（`kernel::Error`）。

## 四、构建与开发

```bash
# .config 启用
CONFIG_RUST=y
# 构建
make LLVM=1 rustavailable
make LLVM=1 drivers/...  # 或整编
```

- 需要 `rustc` + `bindgen` + `clang`（LLVM 工具链）。
- `make rustdoc`：生成 Rust 内核 API 文档。

## 五、学习路径

1. 读内核 `rust/` 目录与 `samples/rust/` 示例（如 `rust_minimal.rs`）。
2. 理解 `kernel` crate 抽象（alloc/sync/device）。
3. 对照 `21-unsafe-ffi.md`、`27-embedded-rtic.md`（底层/寄存器/unsafe）。

## 六、与系列对照

| 内核 Rust | 其他 |
|---|---|
| `rust/kernel` 安全封装 | 用户态 `std`（无 std，用 core+alloc） |
| `Opaque<T>` | FFI 不透明指针（21 章） |
| bindgen 绑定 | jni crate 反向（30-rust-java-jni） |
| 无 GC 确定性 | 实时系统（27 RTIC） |

- 内核 Rust 印证 Rust「系统级 + 安全」定位（见 `23-cross-lang-comparison.md`）。

> 延伸：`21-unsafe-ffi.md`、`27-embedded-rtic.md`、`30-rust-java-jni.md`、`23-cross-lang-comparison.md`。
