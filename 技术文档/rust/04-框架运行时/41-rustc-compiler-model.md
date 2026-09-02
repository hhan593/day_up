# 41 · Rust 编译模型与 LLVM

> 官方来源：The Rustc Development Guide（https://rustc-dev-guide.rust-lang.org/，MIR 章节完整；Codegen 章节标准知识整理）
> 本文 MIR 部分**完整抓取官方正文**（HIR→MIR、borrow check 在 MIR、基础块/语句/终结符、优化），结合 LLVM codegen 标准知识整理。

理解编译器流程能解释「为何借用检查器报错」「零成本抽象如何实现」「编译为何慢」——面试加分项。

## 一、编译流水线概览

```
源码 .rs
  → 词法/语法分析 → AST
  → 宏展开（macro，19章）
  → HIR（高级 IR，带类型/语法糖）
  → 类型检查 + trait 求解
  → MIR（中级 IR，降级）→ 借用检查 / 优化 / 常量求值
  → LLVM IR（后端）
  → 机器码（.o）→ 链接 → 可执行
```

## 二、MIR（中级中间表示）

> 官方：MIR 由 HIR 构造（RFC 1211），是大幅简化的 Rust；用于**流敏感安全检查（最重要是借用检查器）**、优化、代码生成。

### 控制流图（CFG）
- **基础块（BasicBlock）**：含 `Statements`（单后继） + 末尾 `Terminator`（可多后继）。
- **语句**：`StorageLive(_1)`（栈分配）、`<Place> = <Rvalue>`。
- **终结符**：`_2 = push(move _3, 1i32) -> [return: bb3, unwind: bb4]`（含 unwind 异常分支）。
- **Locals**：`_0` 返回值位、`_1` 参数/局部；**Places**：内存位置（`_1.f`）；**Rvalues**：产生值；**Operands**：常量或 place。

```mir
bb0: {
    StorageLive(_1);
    _1 = const Vec::new() -> bb2;
}
```

- 这就是 `17-concurrency-parallel.md`/`05-借用与引用.md` 中「借用检查」实际发生的层级——在 MIR 而非源码层做流敏感分析。

## 三、Borrow Checker 在 MIR

- NLL（Non-Lexical Lifetimes）：基于 MIR CFG 的数据流分析，精确判断引用生命周期（不依赖语法块边界）。
- 这就是为什么「提前 drop 后复用」能通过（见 `05-借用与引用.md`）。

## 四、MIR 优化

- playground 显示的是**优化后** MIR（`StorageLive` 等被移除）。
- 看未优化版：`rustc x.rs -Z mir-opt-level=0 --emit mir`（nightly）。
- `rustc_mir_transform` 模块做 MIR 级优化（内联、常量传播等）。

## 五、LLVM 后端（Codegen）

- MIR → LLVM IR（由 `rustc_codegen_llvm` 完成）→ LLVM 优化（O0/O1/O2/O3）→ 目标机器码。
- **LLVM 带来**：成熟优化器、多后端（x86_64/arm64/riscv/wasm32）、Link-Time Optimization（LTO，见 `20-cargo-advanced.md`）。
- 其他后端：Cranelift（快速 debug 构建）、rustc_codegen_gcc。
- `wasm32` 目标即 LLVM 后端产出 WASM（见 `25-wasm-web.md`/`38-wasm-frontend`）。

## 六、零成本抽象的实现

- 泛型单态化（`07-泛型Trait`）：`Vec<T>` 对每个 T 生成专用代码，无运行时装箱 → 无 vtable 开销（对比 Java 类型擦除 `java/06-generics`）。
- trait 默认静态分发：编译期确定调用目标，等价于手写（zero-cost）。
- 这些优化在 MIR/LLVM 层完成——解释「为何 Rust 抽象无运行时成本」。

## 七、编译慢的原因与对策

- 单态化 + LLVM 优化 → 编译慢（尤其大项目）。
- 对策：`sccache`、`[profile] incremental=true`、`lto=false`（debug）、拆分 crate（workspace，20 章）、`cargo build --timings` 分析。

## 八、与系列对照

| Rust 编译 | 其他 |
|---|---|
| MIR + 借用检查 | Java 无（GC 运行期）、C++ 无 |
| 泛型单态化 | C++ 模板（同源）、Java 擦除（异） |
| LLVM 后端 | Clang（C++）、Swift |
| NLL 流分析 | Go/Java 无等价 |

> 延伸：`05-借用与引用.md`、`07-Rust泛型Trait与生命周期知识手册.md`、`19-macros.md`、`20-cargo-advanced.md`、`25-wasm-web.md`。
