# 19 · 宏（Macros）

> 官方来源：The Rust Reference — Macros（https://doc.rust-lang.org/reference/macros.html，Rust 语言文档团队）
> 本文**完整抓取官方参考页正文**（宏调用语法、声明宏/过程宏界定、内置宏示例），并结合标准用法整理。

宏以 `some_macro!(...)` 形式在**编译期展开**，是 Rust 的元编程能力。

## 一、两种宏

| 类型 | 定义方式 | 用途 |
|---|---|---|
| 声明宏（Macros by Example） | `macro_rules!` | 模式匹配的重复代码、DSL |
| 过程宏（Procedural Macros） | `#[proc_macro]` / `#[proc_macro_derive]` / `#[proc_macro_attribute]` | 自定义 derive、属性、函数式宏 |

官方说明：宏调用在编译期展开为结果代码；可出现于表达式/语句、模式、类型、条目（item）等位置。`vec!`/`println!`/`thread_local!` 为标准库内置宏示例。

## 二、声明宏 macro_rules!

```rust
macro_rules! vec_of_strings {
    // 匹配零个或多个表达式，以逗号分隔
    ($($e:expr),*) => {
        {
            let mut v = Vec::new();
            $( v.push($e.to_string()); )*   // 重复片段
            v
        }
    };
}

let s = vec_of_strings!["a", "b", "c"]; // ["a","b","c"]
```

- `$($e:expr),*`：重复匹配 `expr`，`,` 分隔；`$(...)*` 在展开中重复。
- 类似 `match` 多臂：可写多条规则按序匹配。
- 常用内置：`vec!`、`println!`、`format!`、`panic!`、`assert_eq!`、`eprintln!`。

## 三、过程宏（procedural macros）

需在独立 crate（`proc-macro = true`）中定义，操作 token 流：

```rust
use proc_macro::TokenStream;

#[proc_macro_derive(HelloMacro)]
pub fn hello_derive(input: TokenStream) -> TokenStream {
    // 解析 input，生成新代码
    let ast = syn::parse(input).unwrap();
    impl_hello_macro(&ast).into()
}
```

- `#[proc_macro_derive(HelloMacro)]`：自定义 `#[derive(HelloMacro)]`，如 serde 的 `Serialize`/`Deserialize`。
- `#[proc_macro_attribute]`：自定义属性（`#[route(GET, "/")]` 类似 axum 的 `22-web-framework-axum.md`）。
- `#[proc_macro]`：类函数宏（`sqlx::query!`）。

> 生态：`serde`（序列化）、`tokio::main`（属性宏）、`thiserror`/`anyhow` 错误处理（见 `08-Rust错误处理知识手册.md`/`16-Option 与 Result 深度解析.md`）均基于过程宏。

## 四、宏 vs 函数 / 泛型

- 宏可做**编译期代码生成**与不定参数（函数不能），但报错信息不如函数清晰。
- 优先用函数/泛型，宏仅在不行时（DSL、derive、编译期计算）使用。

## 五、与系列对照

- C/C++ 宏：Rust 宏是** hygienic（卫生）**的，不会意外捕获/污染标识符（vs C 的 text 替换）。
- Java 注解 + 注解处理器（APT）：类 Rust 过程宏的 derive，但运行在独立处理阶段。
- TypeScript：`type`/`interface` 无宏；TS 装饰器（`技术文档/typescript`、`nest`）类似属性宏但运行时/编译期语义不同。
- Rust 宏是面试高频考点（卫生性、两类宏区别）。

> 延伸：`07-Rust泛型Trait与生命周期知识手册.md`、`12-Rust_Trait知识手册.md`、`22-web-framework-axum.md`。
