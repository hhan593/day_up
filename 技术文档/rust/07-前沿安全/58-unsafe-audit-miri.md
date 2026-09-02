# 58. unsafe 代码审计、Miri 与未定义行为

> 来源可信度：**标准实践 + 官方工具**（基于 Rust Reference "Behavior considered undefined"、Miri、`cargo-careful`、Clippy/`clippy::undocumented_unsafe_blocks` 官方行为）
> 关联：`21-unsafe-ffi.md`、`41-rustc-compiler-model.md`、`53-no-std-embedded.md`

## 1. 为什么需要审计 unsafe

Rust 的安全保证有个前提：**`unsafe` 块里的代码由程序员自己保证正确性**。一旦写错，就是**未定义行为（UB）**——编译器可以生成任何代码，且往往"看起来能跑"，直到某次优化后爆炸。

**原则**：减少 unsafe 的面积，并让每一处 unsafe 都有**书面契约**。

## 2. Rust 中的未定义行为清单

以下行为在 Rust 中是 UB（官方 Reference）：

| 类别 | 具体 |
|------|------|
| 数据竞争 | 两个线程同时访问同一内存，至少一个写，且无同步 |
| 悬垂引用 | 解引用已释放的内存 |
| 空指针/未对齐 | 解引用 null、未对齐指针 |
| 越界 | 指针算术越出分配对象 |
| 破坏别名规则 | 通过 `&mut T` 之外的路径写同一内存 |
| 非法值 | 产生 `bool` 非 0/1、`enum` 无效判别值、`char` 越界、`&T` 为 null 等 |
| 违反 `unsafe trait` 契约 | 如错误的 `Send`/`Sync` 实现 |
| 错误 `#[no_mangle]` 冲突 | 符号重复 |
| 栈溢出 / 无限递归 | |
| 调用 UB 的 ABI | 跨 `extern` 边界 panic、类型不匹配 |

## 3. 写 unsafe 的规范流程

**核心方法：把 unsafe 封装成安全抽象，并在边界写清楚契约。**

```rust
/// 从切片读取 `index` 处元素，不做边界检查。
///
/// # Safety
///
/// 调用者必须保证 `index < slice.len()`。
/// 违反此约定将产生未定义行为。
///
/// # Examples
///
/// ```
/// # fn main() {
/// let data = [1, 2, 3];
/// // SAFETY: 2 < 3
/// assert_eq!(unsafe { get_unchecked(&data, 2) }, &3);
/// # }
/// ```
#[inline]
pub unsafe fn get_unchecked<T>(slice: &[T], index: usize) -> &T {
    debug_assert!(index < slice.len());   // debug 下仍检查，帮助发现问题
    // SAFETY: 调用者保证 index < len
    unsafe { slice.get_unchecked(index) }
}
```

**四要素**：

1. 函数签名标 `unsafe fn`（或 `unsafe` 块）。
2. `# Safety` 文档段写明**前置条件**。
3. 内部每处 unsafe 操作配 `// SAFETY:` 注释说明**为何满足**。
4. `debug_assert!` 在 debug 构建下兜底。

## 4. 开启 lint 强制规范

```rust
// src/lib.rs —— 强制每个 unsafe 块写 SAFETY 注释
#![warn(clippy::undocumented_unsafe_blocks)]
#![warn(clippy::multiple_unsafe_ops_per_block)]
#![deny(unsafe_op_in_unsafe_fn)]      // unsafe fn 内也需显式 unsafe 块
```

```toml
# Cargo.toml
[lints.rust]
unsafe_op_in_unsafe_fn = "deny"

[lints.clippy]
undocumented_unsafe_blocks = "warn"
multiple_unsafe_ops_per_block = "warn"
missing_safety_doc = "warn"
```

`unsafe_op_in_unsafe_fn` 尤其重要：让 `unsafe fn` 内部也必须用 `unsafe {}` 包裹实际操作，**缩小 unsafe 区域**。

## 5. Miri：UB 解释器

**Miri** 是 Rust 的**未定义行为检测解释器**，在 MIR 层执行程序，能发现：

- 越界访问、use-after-free、悬垂引用
- 数据竞争（部分，需特定配置）
- 违反别名规则（Stacked Borrows / Tree Borrows）
- 未初始化内存读取
- 内存泄漏
- 类型不变量破坏（非法 bool/enum 值）

```bash
rustup +nightly component add miri
cargo +nightly miri test
cargo +nightly miri run
```

> Miri 需要 **nightly** 工具链。

### 5.1 示例：Miri 能抓到什么

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let r = &v[0];          // 不可变借用
    v.push(4);              // 可变借用 —— 会让 r 失效
    println!("{}", r);      // ❌ 借用检查器会拦截（编译不过）
}
```

上面会被编译器拦住，但 **unsafe 里的同类错误不会**：

```rust
fn main() {
    let mut v = vec![1i32, 2, 3];
    let ptr = v.as_mut_ptr();
    unsafe {
        let r = &*ptr;                  // 从裸指针造引用
        v.push(4);                      // vec 可能重新分配 → ptr 悬垂
        println!("{}", r);              // ❌ UB！编译器不会报错
    }
}
```

Miri 输出：

```
error: Undefined Behavior: attempting a read access
  --> src/main.rs:6:13
   |
6  |         println!("{}", r);
   |                        ^ using <tag> created here, but that tag
   |                          was invalidated when ... v.push(4)
```

### 5.2 Miri 常用配置

```bash
# 用 Tree Borrows（更宽松但更快的别名模型）
MIRIFLAGS="-Zmiri-tree-borrows" cargo +nightly miri test

# 检测内存泄漏
MIRIFLAGS="-Zmiri-ignore-leaks" cargo +nightly miri test   # 反过来：忽略泄漏

# 严格 provenance 检查
MIRIFLAGS="-Zmiri-strict-provenance" cargo +nightly miri test

# 符号级对齐检查
MIRIFLAGS="-Zmiri-symbolic-alignment-check" cargo +nightly miri test

# 禁止未支持的系统调用（嵌入/no_std 场景）
MIRIFLAGS="-Zmiri-disable-isolation" cargo +nightly miri test
```

### 5.3 Miri 局限

- 慢（解释执行，比原生慢 100-1000x）。
- 只测**被执行到的路径**——需要配合好的测试覆盖。
- 不能测 FFI 到 C 的行为。
- 数据竞争检测不完整（用 Loom 或 TSan 补）。

## 6. cargo-careful（stable 上的轻量检查）

Miri 需 nightly 且慢；`cargo-careful` 用标准 rustc 但**启用额外的 UB 检查**（如`debug_assertions` + 特定 sanitizer flags），能在 stable 跑：

```bash
cargo install cargo-careful
cargo +nightly careful test       # 仍需 nightly，但比 miri 快很多
```

## 7. Sanitizer（真实硬件上检测）

```bash
# AddressSanitizer：越界、use-after-free
RUSTFLAGS="-Zsanitizer=address" cargo +nightly test --target x86_64-unknown-linux-gnu

# ThreadSanitizer：数据竞争
RUSTFLAGS="-Zsanitizer=thread" cargo +nightly test --target x86_64-unknown-linux-gnu

# LeakSanitizer：内存泄漏
RUSTFLAGS="-Zsanitizer=leak" cargo +nightly test --target x86_64-unknown-linux-gnu
```

> ASan/TSan 需 nightly；macOS 上 TSan 支持较好。

## 8. Loom：并发正确性测试

对并发数据结构（自己写的 `Mutex`/队列/无锁结构）做**穷举调度**：

```toml
[dev-dependencies]
loom = "0.7"
```

```rust
#[test]
fn test_mpsc() {
    loom::model(|| {
        let (tx, rx) = my_channel();

        let t1 = loom::thread::spawn(move || { tx.send(1); });
        let t2 = loom::thread::spawn(move || { let _ = rx.recv(); });

        t1.join().unwrap();
        t2.join().unwrap();
    });
}
```

Loom 会穷举所有可能的线程交错，找出竞争。

## 9. unsafe 审查清单

对每个 `unsafe` 块依次确认：

| # | 检查项 |
|---|--------|
| 1 | 能否**完全避免** unsafe？（优先用安全替代：`get` 而非 `get_unchecked`、`Arc` 而非裸指针、`split_at_mut` 而非指针算术） |
| 2 | 是否有 `# Safety` 文档，写清**前置条件**？ |
| 3 | 内部每个 unsafe 操作是否有 `// SAFETY:` 注释？ |
| 4 | 指针算术是否**始终在分配范围内**（含边界情况：len=0）？ |
| 5 | 是否可能**别名冲突**（同时存在 `&mut` 和 `&` 指向同一内存）？ |
| 6 | 是否可能读到**未初始化内存**（`MaybeUninit` 使用是否正确）？ |
| 7 | 是否处理了**对齐**（`align_of` / `#[repr(align)]`）？ |
| 8 | FFI 边界：类型布局是否匹配（`#[repr(C)]`）、所有权是否明确、是否会 panic 跨 ABI？ |
| 9 | `Send`/`Sync` 实现是否正确（手工 `unsafe impl` 要特别小心）？ |
| 10 | 是否用 **Miri / ASan / TSan / Loom** 验证过？ |
| 11 | 是否有对应的**单元测试与属性测试**（proptest，见 `51`）？ |

## 10. 常见 unsafe 陷阱与正确写法

### 10.1 MaybeUninit（避免未初始化读取）

```rust
use std::mem::MaybeUninit;

// ❌ 错：读取未初始化
let x: i32 = unsafe { std::mem::MaybeUninit::uninit().assume_init() };   // UB!

// ✅ 对：先写后读
let mut buf: [MaybeUninit<u8>; 1024] = unsafe { MaybeUninit::uninit().assume_init() };
// ... 由外部写入（如 read syscall）...
let initialized: [u8; 1024] = unsafe { std::mem::transmute(buf) };
```

### 10.2 指针算术不越界

```rust
// ❌ 可能越出分配对象（即使不越 slice 长度，越出分配也是 UB）
let p = slice.as_ptr();
let q = unsafe { p.add(slice.len()) };      // 指向末尾后一位是允许的
let r = unsafe { p.add(slice.len() + 1) };  // ❌ UB：越出分配对象
```

### 10.3 别名规则

```rust
// ❌ UB：通过 &mut 之外的路径写
let x = &mut 1u8;
let p = x as *mut u8;
unsafe { *p = 2; }        // 可以（p 源自 &mut）
let y = &*x;              // 新的共享引用
unsafe { *p = 3; }        // ❌ UB：y 存在期间通过 p 写

// ✅ 分开作用域
let x = &mut 1u8;
{
    let y = &*x;
    println!("{y}");
}                          // y 生命周期结束
unsafe { *(x as *mut u8) = 3; }
```

### 10.4 FFI 边界

```rust
// ✅ repr(C) 保证布局
#[repr(C)]
struct Point { x: f64, y: f64 }

extern "C" {
    fn c_draw(p: *const Point, n: usize);
}

// 包装成安全 API，并保证不跨 FFI panic
pub fn draw(points: &[Point]) {
    // catch_unwind 防止 panic 跨越 FFI 边界（panic 跨 extern "C" 是 UB）
    let _ = std::panic::catch_unwind(|| {
        unsafe { c_draw(points.as_ptr(), points.len()) }
    });
}
```

> 详见 `21-unsafe-ffi.md`。

## 11. CI 集成

```yaml
name: unsafe-audit
on: [push, pull_request]
jobs:
  miri:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
        with: { components: miri }
      - run: cargo miri test
        env:
          MIRIFLAGS: -Zmiri-strict-provenance

  clippy-unsafe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cargo clippy -- -W clippy::undocumented_unsafe_blocks -W clippy::missing_safety_doc

  sanitizer:
    runs-on: ubuntu-latest
    steps:
      - uses: dtolnay/rust-toolchain@nightly
      - run: cargo test --target x86_64-unknown-linux-gnu
        env:
          RUSTFLAGS: -Zsanitizer=address
```

## 12. 第三方审计工具

| 工具 | 用途 |
|------|------|
| `cargo-geiger` | 统计依赖树中 unsafe 代码量 |
| `cargo-audit` | 检查依赖的已知漏洞 |
| `cargo-deny` | 依赖策略（许可证/漏洞/来源） |
| `cargo-vet` | 供应链审计 |
| `cargo-crev` | 分布式代码评审 |

```bash
cargo install cargo-geiger
cargo geiger            # 看 unsafe 占比（`#![forbid(unsafe_code)]` 的 crate 显示为 0）
```

## 13. 一句话总结

> unsafe 的正确姿势：**能不用就不用**，用则封成安全抽象并写 `# Safety` + `// SAFETY:` 契约，开 `unsafe_op_in_unsafe_fn` 与 `undocumented_unsafe_blocks` 强制规范；验证靠 **Miri**（nightly 解释执行，抓 UB/别名/未初始化/泄漏）、**ASan/TSan**（硬件上）、**Loom**（并发调度穷举）、**cargo-careful**（快速）；CI 里跑 Miri + Clippy unsafe lint + sanitizer，并用 `cargo-geiger` 监控依赖 unsafe 面积。
