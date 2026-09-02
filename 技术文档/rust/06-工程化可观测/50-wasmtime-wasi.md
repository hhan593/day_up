# 50. Wasmtime 与 WASI（服务端 WASM 运行时）

> 来源可信度：**完整正文级**（基于 docs.rs `wasmtime 48.0.1`，2026-08-25 文档；Apache-2.0 WITH LLVM-exception）
> 适用：插件系统、Serverless 沙箱、多租户扩展、边缘计算。
> 关联：`25-wasm-web.md`、`45-wasm-optimization.md`（浏览器侧 WASM）

## 1. Wasmtime 是什么

官方定义：*"Wasmtime is a WebAssembly engine for JIT-compiled or ahead-of-time compiled WebAssembly modules and components."*

关键特性（官方原文）：

- 可嵌入 Rust 程序执行 WASM 模块/组件。
- **宿主无需 unsafe**：*"you're guaranteed there is no undefined behavior or segfaults in either the WebAssembly guest or the host itself."*
- 支持 **Component Model**（`wasmtime::component`，与核心 `Module` API 镜像）。

```toml
wasmtime = "48"
wasmtime-wasi = "48"    # WASI 支持（独立 crate）
```

## 2. 核心概念（官方原文要点）

| 类型 | 说明 |
|------|------|
| **Engine** | 全局编译与运行环境，可用 `Config` 配置。可跨线程共享，**通常一个进程一个**。所有 Module/Component 属于它。 |
| **Store** | 存放所有 WASM 对象（函数、实例、内存）的容器。`Store<T>` 的 `T` 存宿主数据，通过 `Caller<'_, T>` 在宿主函数中访问。**创建销毁廉价，应短生命周期**。 |
| **Linker** | 给宿主函数起字符串名，供实例化时查找。启动时填充、之后复用。宿主函数应 `Fn + Send + Sync`，可变状态放 `Store<T>` 的 `T`。 |
| **Module** | 编译好的 WASM 模块，**创建昂贵**（需编译），但**可跨线程共享**，且可 `serialize`/`deserialize` 做 AOT。 |
| **Instance** | 模块实例，从中取 `Func` 调用。 |
| **Func** | WASM 函数或宿主函数包装。有 `TypedFunc` 类型化视图，调用更高效。 |

> 所有"store-connected"类型（`Func`/`Memory` 等）的方法都需传入 store 作为上下文，参数类型是 `impl AsContext` / `impl AsContextMut`（`&Store<T>`、`&mut Store<T>`、`&Caller<'_, T>` 等都实现了它）。

## 3. 最小完整例子（官方文档示例）

```rust
use wasmtime::*;

fn main() -> wasmtime::Result<()> {
    let engine = Engine::default();

    // Module 可从文本格式（wat）或二进制编译
    let wat = r#"
        (module
            (import "host" "host_func" (func $host_hello (param i32)))
            (func (export "hello")
                i32.const 3
                call $host_hello)
        )
    "#;
    let module = Module::new(&engine, wat)?;

    // 宿主函数通过 Linker 提供给 guest
    let mut linker = Linker::new(&engine);
    linker.func_wrap("host", "host_func", |caller: Caller<'_, u32>, param: i32| {
        println!("Got {} from WebAssembly", param);
        println!("my host state is: {}", caller.data());
    })?;

    // Store<T> 的 T = 宿主数据（这里是 4）
    let mut store: Store<u32> = Store::new(&engine, 4);

    // 实例化 + 取导出函数（带类型断言）
    let instance = linker.instantiate(&mut store, &module)?;
    let hello = instance.get_typed_func::<(), ()>(&mut store, "hello")?;

    hello.call(&mut store, ())?;
    Ok(())
}
```

## 4. 调用带参数/返回值的函数

```rust
// guest 导出 add(i32, i32) -> i32
let add = instance.get_typed_func::<(i32, i32), i32>(&mut store, "add")?;
let sum = add.call(&mut store, (2, 3))?;
println!("2 + 3 = {sum}");

// 无类型版本（动态）
let args = [Val::I32(2), Val::I32(3)];
let mut results = [Val::I32(0)];
instance.get_func(&mut store, "add").unwrap().call(&mut store, &args, &mut results)?;
```

## 5. 内存读写（宿主 ↔ guest）

```rust
let memory = instance.get_memory(&mut store, "memory").unwrap();

// 写字符串进 guest 内存
let msg = b"hello from host";
memory.write(&mut store, 0, msg)?;

// 从 guest 读
let mut buf = vec![0u8; 64];
memory.read(&store, 0, &mut buf)?;
```

> 典型模式：guest 分配内存后传指针+长度给宿主，宿主用 `memory.read/write` 交换数据（或反过来由宿主分配）。

## 6. WASI 支持

官方明确：*"The wasmtime crate does not natively provide support for WASI, but you can use the `wasmtime-wasi` crate."*

```toml
wasmtime = "48"
wasmtime-wasi = "48"
```

```rust
use wasmtime::*;
use wasmtime_wasi::{WasiCtxBuilder, Dir};

let engine = Engine::default();
let module = Module::from_file(&engine, "app.wasm")?;

// 构建 WASI 上下文：stdout/stderr + 预开放目录
let wasi = WasiCtxBuilder::new()
    .inherit_stdout()
    .inherit_stderr()
    .preopened_dir(
        Dir::open_ambient_dir("./data", ambient_authority())?,
        "/data",                       // guest 看到的路径
    )?
    .build();

let mut store = Store::new(&engine, wasi);

// 把 WASI 全部函数加进 Linker
let mut linker = Linker::new(&engine);
wasmtime_wasi::add_to_linker(&mut linker, |ctx| ctx)?;

let instance = linker.instantiate(&mut store, &module)?;
instance.get_typed_func::<(), ()>(&mut store, "_start")?.call(&mut store, ())?;
```

**WASI 提供能力**：文件（预开放目录）、stdout/stderr、环境变量、时钟、随机数、网络（WASIp2 sockets）等——**默认全部禁止，需显式授予**，这是沙箱安全的基础。

## 7. 资源限制（防恶意/失控 guest）

```rust
let mut config = Config::new();

// 方式一：epoch 中断（轻量，配合定时器）
config.epoch_interruption(true);
// 后台线程定时 engine.increment_epoch()
// store.set_epoch_deadline(N) 设置上限

// 方式二：fuel 计量（确定性，但插桩开销大）
config.consume_fuel(true);
store.add_fuel(1_000_000)?;        // 给 guest 分配燃料
// 执行超出则 trap

// 方式三：ResourceLimiter 限制内存/表数量
store.limiter(|s| &mut s.limits);

// 方式四：内存上限
let memory_ty = MemoryType::new(1, Some(10));  // 最少 1 页，最多 10 页（640KB）
```

## 8. 异步执行

官方说明：Wasmtime 支持通过 Rust async 函数调用 WASM，从而**阻塞 guest 而不阻塞宿主**、中断死循环、与异步宿主函数集成。

```rust
// 必须用 *_async 变体（当使用了异步特性时）
instance.get_typed_func::<(), ()>(&mut store, "run")?
    .call_async(&mut store, ()).await?;

// 异步宿主函数
linker.func_wrap_async("host", "fetch", |caller, (url_ptr, len)| {
    Box::new(async move { /* 异步 I/O */ })
})?;
```

> ⚠️ 官方警告：`Future::poll` 不应长时间阻塞。不可信 WASM 可能让 poll 无限执行。建议用 **epoch interruption + 外层 timeout** 或 **fuel + yield interval** 解决。

## 9. AOT 预编译（省启动时间）

```rust
// 编译期序列化
let bytes = module.serialize()?;
std::fs::write("app.cwasm", &bytes)?;

// 运行期快速反序列化（跳过编译）
let module = unsafe { Module::deserialize(&engine, &bytes)? };
```

> `deserialize` 是 `unsafe`：必须保证字节来自同源、同版本 Wasmtime、同平台。

## 10. 典型使用场景

| 场景 | 说明 |
|------|------|
| 插件系统 | 宿主 Rust 程序加载第三方 WASM 插件，沙箱隔离 |
| 多租户 Serverless | 每租户一个 Store，资源限额 |
| 边缘计算 | Fastly Compute@Edge 等基于 Wasmtime |
| 脚本扩展 | 游戏/工具用 WASM 跑用户脚本 |
| 策略引擎 | 用 WASM 跑不可信的策略/规则代码 |

## 11. 与浏览器 WASM 对照

| | 浏览器（`25-wasm-web.md`） | Wasmtime（本文） |
|---|---|---|
| 宿主 | JS / 浏览器 API | Rust / 系统 API |
| 能力 | DOM、Fetch | 文件、网络（WASI 显式授权） |
| 沙箱 | 浏览器沙箱 | Wasmtime + WASI 能力模型 |
| 编译 | wasm-bindgen | 编译到 `wasm32-wasip1` |

```bash
rustup target add wasm32-wasip1
cargo build --target wasm32-wasip1 --release
```

## 12. 一句话总结

> Wasmtime 48 用 **Engine（全局）/ Store（实例状态+宿主数据）/ Linker（宿主函数）/ Module（编译产物）** 四件套安全执行 WASM，全程无 unsafe；WASI 由 `wasmtime-wasi` 提供，能力默认全禁需显式授予；用 epoch/fuel/ResourceLimiter 限制资源；`serialize`/`deserialize` 做 AOT 提速；异步场景必须用 `*_async` API 并配超时。
