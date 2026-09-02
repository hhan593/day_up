# 24 · Rustlings 习题解析与学习法

> 官方来源：rust-lang/rustlings（https://github.com/rust-lang/rustlings，Rust Team 官方小练习，150+ 题）
> 说明：基于官方 exercises 目录结构与主题分类整理；Rustlings 官网 2026-08-21 仍在维护。

Rustlings 是 Rust 官方推荐的**小练习集**，通过「读/改/补」源码快速熟悉语法与所有权——配合 `技术文档/rust` 01-16 手册效果最佳。

## 一、安装与运行

```bash
cargo install rustlings
rustlings init                      # 在当前目录生成 exercises/
cd rustlings
rustlings watch                    # 监视模式：保存即编译并提示错误
# 或
rustlings run <exercise>           # 单独运行某题
rustlings verify                   # 校验全部
```

- `watch` 模式实时反馈，是官方推荐的学习循环。
- 每个练习文件顶部有 `// I AM NOT DONE` 注释，完成后删掉即可。

## 二、主题分类（对应本目录手册）

| 主题 | Rustlings 目录 | 对应手册 |
|------|---------------|----------|
| 变量/可变性 | `variables` | 02 速查 |
| 函数/控制流 | `functions`/`flow_control` | 02 速查 |
| 基本类型 | `primitive_types` | 02 速查 |
| 结构体 | `structs` | 03 结构体 |
| 枚举 | `enums` | 04 枚举 |
| 字符串 | `strings` | 06 String |
| 模块 | `modules` | 10 模块 |
| 集合 | `collections` | 09 集合 |
| 错误处理 | `error_handling` | 08 错误处理、16 Option/Result |
| 泛型/Trait | `traits`/`generics` | 07、12 Trait |
| 测试 | `tests` | 11 测试 |
| 闭包/迭代器 | `closures`/`iterators` | 13 闭包、14 迭代器 |
| 智能指针 | `smart_pointers` | 15 智能指针 |
| 宏 | `macros` | 19 宏 |
| 并发 | `threads`/`async` | 17 并发、18 异步 |

## 三、典型题型解析（示例）

### 1. 所有权移动（variables）
```rust
// TODO: 让代码通过
fn main() {
    let vec0 = vec![22, 44, 66];
    let vec1 = vec0;                 // 移动
    println!("{:?}", vec0);         // 错误：vec0 已移动
}
```
- 修正：用 `let vec1 = vec0.clone();` 或 `let vec1 = &vec0;`（借用，见 05 借用与引用）。

### 2. 借用与可变（primitive/structs）
```rust
fn main() {
    let mut vec = vec![1, 2, 3];
    add_one(&mut vec);              // 可变借用
    println!("{:?}", vec);          // [2,3,4]
}
fn add_one(v: &mut Vec<i32>) { for x in v { *x += 1; } }
```

### 3. Result 强制处理（error_handling）
```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let r = produces_error()?;      // ? 提前返回
    Ok(())
}
```

## 四、与系列对照

- Rustlings 的 `threads`/`async` 题直接对应 17 并发、18 异步。
- `macros` 题对应 19 宏（声明宏入门）。
- 与 Java 的 **JUnit 练习**（java/17）、Node 的 **rustlings 等价物不存在**——Rustlings 是 Rust 独特的高效入门路径。

## 五、学习建议

1. 先读对应手册（01-16）再做题，错误即知识点。
2. `rustlings watch` 形成「改→编译→懂」闭环。
3. 卡住看官方 hint（`// HINT` 注释）与 `exercises/README.md`。
4. 完成后做 `23-cross-lang-comparison.md` 巩固跨语言认知。

> 延伸：`02-Rust快速参考手册.md`、`05-借用与引用.md`、`19-macros.md`、`17-concurrency-parallel.md`。
