# 26 · 过程宏实战（syn / quote / proc-macro2）

> 官方来源：syn crate docs.rs（syn-3.0.4，dtolnay，2026-08-24，文档覆盖 26.6%）+ quote + proc-macro2
> 本文**完整抓取 syn 官方文档页正文**（解析流程、DeriveInput、quote!、Span、feature flags），结合标准实战整理。

过程宏是 Rust 元编程的核心（见 `19-macros.md` 概览）。`syn`+`quote` 是生态标准组合（serde/thiserror/tokio 全用它）。

## 一、依赖配置

```toml
[lib]
proc-macro = true          # 必须：声明为过程宏 crate

[dependencies]
syn = { version = "3", features = ["full", "extra-traits"] }
quote = "1"
proc-macro2 = "1"          # syn 内部依赖，通常直接用 syn/quote
```

## 二、Derive 宏完整流程

```rust
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, DeriveInput};

#[proc_macro_derive(HelloMacro)]
pub fn hello_derive(input: TokenStream) -> TokenStream {
    // 1. 解析：TokenStream -> 语法树
    let ast = parse_macro_input!(input as DeriveInput);
    let name = &ast.ident;                       // 类型名

    // 2. 生成代码（quasi-quotation）
    let expanded = quote! {
        impl HelloMacro for #name {
            fn hello() {
                println!("Hello from {}!", stringify!(#name));
            }
        }
    };

    // 3. 交还编译器
    TokenStream::from(expanded)
}
```

- `parse_macro_input!(input as DeriveInput)`：将编译器传入的 token 解析为语法树；失败即编译错误。
- `#name`：`quote!` 中插值 syn 语法节点（ident/type 等）。

## 三、DeriveInput 数据结构（syn 官方）

`DeriveInput` 表示 `#[derive(...)]` 修饰的结构体/枚举/联合体，含：

- `ident`：类型名
- `generics`：泛型参数（生命周期/类型/const）
- `data`：`Data::Struct(DataStruct)` / `Data::Enum(DataEnum)` / `Data::Union`
- `attrs`：属性（如 `#[repr(transparent)]`）
- `Fields`：`FieldsNamed` / `FieldsUnnamed` / `FieldsUnit`；`Field` 含 `ident`、`ty`、`attrs`

```rust
// 遍历结构体字段生成代码
if let syn::Data::Struct(s) = &ast.data {
    for f in &s.fields {
        let ty = &f.ty;
        // 据字段类型生成 trait 方法
    }
}
```

## 四、自定义语法解析

```rust
use syn::parse::{Parse, ParseStream};
use syn::{Ident, Token, Result};

struct MyArgs { name: Ident }
impl Parse for MyArgs {
    fn parse(input: ParseStream) -> Result<Self> {
        let name: Ident = input.parse()?;
        Ok(MyArgs { name })
    }
}
```

- `ParseStream` + `Parse` trait 解析任意 DSL，用于属性宏/函数式宏。

## 五、Span 与精准报错

- syn 为每个 token 记录 `Span`（行列），生成代码触发用户错误时编译器能指向**用户源码**位置而非宏内。
- 例：字段类型未实现 trait → 错误精准指向该字段。

## 六、调试宏展开

```bash
cargo install cargo-expand
cargo expand                        # 输出宏展开后的真实代码
# 或
cargo rustc -- -Zunstable-options -Zunpretty=expanded
```

- `trybuild`：为宏写编译错误用例测试，防止重构后报错退化。

## 七、Feature flags（syn 官方）

| flag | 作用 |
|---|---|
| `derive`/`parsing`/`printing` | 默认开 |
| `full` | 完整语法树（items+expr） |
| `extra-traits` | Debug/Eq/Hash |
| `visit`/`visit-mut`/`fold` | 遍历/变换语法树 |

## 八、实战案例：手写 thiserror 式 derive

```rust
#[proc_macro_derive(DisplayError, attributes(display))]
pub fn display_error(input: TokenStream) -> TokenStream {
    let ast = parse_macro_input!(input as DeriveInput);
    // 读 #[display = "..."] 属性，生成 impl std::fmt::Display
    // ... 详见 08-Rust错误处理知识手册.md 的 thiserror 用法
}
```

## 九、与系列对照

- C++ 宏：Rust 过程宏是**类型化 AST 操作**，安全且可调试（vs C 文本替换）。
- Java 注解处理器（APT）：类 derive，但运行在独立处理阶段、生成新源文件。
- TS 装饰器：运行时/编译期，无 AST 级生成能力。
- `serde`/`tokio::main`/`sqlx` 全基于本篇技术（`22-web-framework-axum.md` 的 sqlx 即用过程宏）。

> 延伸：`19-macros.md`、`08-Rust错误处理知识手册.md`、`22-web-framework-axum.md`、`技术文档/java/22-spring-security.md`（注解对照）。
