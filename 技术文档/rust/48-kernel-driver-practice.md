ba# 48. Linux 内核 Rust 驱动实战

> 来源可信度：**官方结构确认 + 标准实践**（基于 `rust-for-linux` 项目、内核 `Documentation/rust/` 官方文档；与 `35-linux-kernel-rust.md` 衔接，本篇偏实操）
> 关联：`35-linux-kernel-rust.md`（内核 Rust 现状与架构）

## 1. 内核 Rust 支持现状

- 自 Linux 6.1 起，Rust 作为**第二语言**进入内核（需开启 `CONFIG_RUST`）。
- 不是"用 Rust 重写内核"，而是**新增驱动/模块**可用 Rust 写，与 C 互操作。
- 维护者：Miguel Ojeda 领导的 Rust-for-Linux 团队。
- 约束：使用**特殊的内核 Rust 标准库子集**（`core` + 内核 `alloc` + `kernel` crate），**无 std**、无普通 `alloc`（用内核 `Box`/`Vec`/`Arc`）。

## 2. 内核 Rust 栈组成

| 层 | 说明 |
|----|------|
| `rustc` + `bindgen` | 用 bindgen 从 C 头文件生成 Rust 绑定 |
| `core` | 语言核心（无 std） |
| 内核 `alloc` | 内核版 `Box`/`Vec`/`Arc`（GFP 标志） |
| `kernel` crate | 内核抽象：`CString`、`TreeNode`、`Device`、`Module` 等 |
| 驱动 crate | 你的 `.rs` 驱动 |

## 3. 最简内核模块（Hello World）

```rust
// drivers/rust/hello.rs
use kernel::prelude::*;

module! {
    type: HelloModule,
    name: "rust_hello",
    author: "you",
    description: "A Rust hello-world kernel module",
    license: "GPL",
}

struct HelloModule;

impl kernel::Module for HelloModule {
    fn init(_name: &'static CStr, _module: &'static ThisModule) -> Result<Self> {
        pr_info!("Hello from Rust!\n");
        Ok(HelloModule)
    }
}

impl Drop for HelloModule {
    fn drop(&mut self) {
        pr_info!("Goodbye from Rust!\n");
    }
}
```

- `module!` 宏注册模块元数据（许可证必须是 GPL 兼容，否则符号不可用）。
- `kernel::Module::init` 在 `insmod` 时调用；`Drop` 在 `rmmod` 时调用。
- `pr_info!` 是内核版 `println!`。

## 4. 构建与加载

```bash
# 内核需开启 CONFIG_RUST=y 并安装 rust-toolchain（固定版本）
make LLVM=1 rustavailable   # 检查工具链
make LLVM=1 -j$(nproc)      # 构建含 Rust 支持的内核
make LLVM=1 modules         # 构建驱动模块

# 加载/卸载
sudo insmod rust_hello.ko
dmesg | tail               # 看到 "Hello from Rust!"
sudo rmmod rust_hello
```

> 内核 Rust 用**固定 rustc 版本**（见内核 `rust/toolchain` 与 `rust-toolchain.toml`），不能用系统最新 nightly 随意替换。

## 5. 平台设备驱动示例（概念）

```rust
use kernel::{platform, device, devres, Module, CStr, prelude::*};

struct MyDriver;
struct MyDevice {
    _res: Devres<MyReg>,
}

impl platform::Driver for MyDriver {
    type IdInfo = ();
    const COMPATIBLE: &'static CStr = c"myvendor,mydevice";

    fn probe(
        _dev: &platform::Device<'_>,
        _info: &Self::IdInfo,
    ) -> Result<Self::DeviceData> {
        // 映射 MMIO、注册中断、创建 sysfs 等
        pr_info!("probe called\n");
        Ok(())
    }
}

kernel::module_platform_driver! {
    type: MyDriver,
    name: "my_rust_driver",
    license: "GPL",
}
```

- `platform::Driver` 实现 `probe`（设备匹配时调用），用 `COMPATIBLE` 字符串匹配设备树。
- 内核提供 `devres`（托管资源，自动释放）、`TreeNode`（红黑树）、`SpinLock` 等安全抽象。
- 中断、DMA、时钟等都有对应安全封装。

## 6. 与 C 互操作

- 用 `bindgen` 自动从 `.h` 生成 `#[repr(C)]` 绑定。
- Rust 侧调用 C 函数：`extern "C" { pub fn some_c_fn(...); }`。
- C 侧调用 Rust：导出 `#[no_mangle] pub extern "C" fn rust_api(...)`。
- 安全抽象原则：**unsafe 边界收敛到 `kernel` crate 内部**，驱动代码尽量用安全 Rust。

## 7. 开发约束与陷阱

| 限制 | 说明 |
|------|------|
| 无 std | 只用 `core` + 内核 `alloc` |
| 固定工具链 | rustc 版本由内核锁定 |
| 许可证 | 必须 GPL 兼容 |
| 分配可能失败 | 内核 `Box::new` 返回 `Result`（GFP 内存压力） |
| 无 panic 展开 | 内核中 panic 即 `BUG()`，避免触发 |

## 8. 学习路径

1. 读内核 `Documentation/rust/` 与 `samples/rust/`。
2. 从 `samples/rust/rust_minimal.rs`、`rust_print.rs` 起步。
3. 参考 `35-linux-kernel-rust.md` 了解架构与社区进展。
4. 真实驱动参考 `rust-for-linux` 仓库的 `rv`、`net` 等逐步 Rust 化模块。

## 9. 一句话总结

> 内核 Rust 用 `core`+内核 `alloc`+`kernel` crate 写**新增驱动**，bindgen 做 C 互操作，`module!`/`platform::Driver` 注册，`probe` 里用安全抽象操作硬件。工具链与许可证受内核严格约束。
