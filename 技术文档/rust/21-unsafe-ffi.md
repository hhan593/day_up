# 21 · unsafe Rust 与 FFI（外部函数接口）

> 官方来源：The Rust Reference — Unsafe Code（https://doc.rust-lang.org/reference/unsafe.html）；The Rustonomicon
> 说明：基于官方文档结构与标准 API 整理；unsafe 是 Rust 高级主题（路线图 Level 4）。

Rust 默认安全；`unsafe` 关键词用于**绕过编译器部分检查**，仅在必要时使用（FFI、底层数据结构、性能优化）。

## 一、unsafe 的 5 种超能力

```rust
unsafe {
    // 1. 解引用裸指针
    let mut x = 5;
    let r = &mut x as *mut i32;
    *r = 10;

    // 2. 调用 unsafe 函数（如 FFI）
    // 3. 实现 unsafe trait
    // 4. 访问/修改可变静态变量
    // 5. 访问 union 字段
}
```

- `unsafe` **不关闭借用检查器对安全代码的检查**，只放宽上述 5 项约束。
- unsafe 块内仍要保证不触发 UB（悬垂指针、数据竞争等由开发者负责）。

## 二、裸指针

```rust
let mut num = 5;
let r1 = &num as *const i32;     // *const T
let r2 = &mut num as *mut i32;   // *mut T
unsafe { println!("{}", *r1); }
```

- `*const T` / `*mut T` 可同时存在多个可变/别名，无生命周期约束——风险自负。

## 三、FFI：调用 C

```rust
use std::os::raw::c_int;

extern "C" {
    fn abs(input: c_int) -> c_int;   // 声明外部 C 函数
}

fn main() {
    unsafe {
        println!("C abs(-3) = {}", abs(-3));
    }
}
```

- `extern "C"` 指定 C ABI（调用约定）；与 C 互操作标准手段。
- 导出给 C 调用：`#[no_mangle] pub extern "C" fn my_fn() {}`。
- 工具：`cbindgen` 由 Rust 生成 C 头文件；`bindgen` 由 C 头生成 Rust 绑定。

## 四、unsafe trait

```rust
unsafe trait Foo {}          // 实现者须自证满足 trait 的不变量
unsafe impl Foo for MyType {}
```

- 例：`Send`/`Sync`（见 `17-concurrency-parallel.md`）本质 unsafe trait，编译器自动实现安全情况，手动 `unsafe impl` 需自证。

## 五、与系列对照

| Rust | C/C++ | 其他 |
|---|---|---|
| `unsafe` 局部 | 整语言 unsafe | — |
| FFI `extern "C"` | 原生 | Java JNI（java/21 无，但类似 native 互操作） |
| `#[no_mangle]` | `extern "C"` | — |

- Rust 的"安全包装 + unsafe 内核"是核心设计：标准库/第三方库用 unsafe 实现安全 API（如 `Vec`、`Mutex`），用户只写安全代码。
- 与 C++ 不同：Rust 把不安全限制在 `unsafe` 块，便于审计边界。

## 六、何时用 unsafe

- 调用 C/系统库（FFI）
- 实现底层容器（如 `Vec` 内部）
- 性能关键且编译器无法证明安全
- **不要**为图省事用 unsafe 绕过借用检查。

> 延伸：`17-concurrency-parallel.md`（Send/Sync）、`22-web-framework-axum.md`、`技术文档/java/24-messaging-microservices.md`。
