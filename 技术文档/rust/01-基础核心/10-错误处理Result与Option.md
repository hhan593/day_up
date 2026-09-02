# 10 · 错误处理：Result 与 Option

> 体系定位：Rust **没有异常（exception）**，用类型系统在编译期强制你处理错误。这是它可靠性的来源。
> 深入：`补充知识点/08-Rust错误处理知识手册.md`、`16-Option 与 Result 深度解析.md`、`51-testing-advanced.md`。

---

## 1. Option<T>：可能为空

```rust
fn find_even(nums: &[i32]) -> Option<i32> {
    for &n in nums {
        if n % 2 == 0 { return Some(n); }
    }
    None
}

match find_even(&[1, 3, 4]) {
    Some(n) => println!("found {n}"),
    None => println!("none"),
}
```

取代其他语言的 `null`：调用方**必须** `match`/`if let` 处理 `None`，否则编译不过。无法写出"忘判空导致运行时崩溃"的代码。

---

## 2. Result<T, E>：可能失败

```rust
use std::fs::File;

fn open() -> Result<File, std::io::Error> {
    File::open("missing.txt")     // 返回 Result
}

match open() {
    Ok(f) => println!("opened"),
    Err(e) => println!("error: {e}"),
}
```

`Result` 区分"成功值"与"错误值"，两者类型独立。

---

## 3. ? 运算符：提前返回错误

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username() -> Result<String, io::Error> {
    let mut f = File::open("user.txt")?;   // 失败则自动 return Err(...)
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}
```

`?` 等价于"若 `Err` 则 `return Err`，否则解包出 `Ok` 的值"。它让错误传播像异常一样简洁，但**全程是显式类型**——调用链上每个函数签名都写明可能返回什么错误。

> `?` 只能在返回 `Result`/`Option` 的函数里用。

---

## 4. panic! 与不可恢复错误

```rust
let v = vec![1, 2, 3];
v[99];                 // 越界 → panic!（程序崩溃）
```

`panic!` 用于**程序逻辑不可能发生**的情况（bug）。可恢复错误用 `Result`。生产服务应捕获顶层 `Result` 错误而非依赖 panic（见 `52-rustls-crypto.md` 的错误处理实践）。

---

## 5. 自定义错误

```rust
#[derive(Debug)]
struct MyError(String);
// 实战中用 thiserror 派生，详见 补充知识点/08
```

---

## ✅ 验收清单

- [ ] 用 `Option` 取代"可能为 null"
- [ ] 用 `?` 传播 `Result` 错误
- [ ] 区分"可恢复错误（Result）"与"bug（panic）"

→ 下一篇：[11-迭代器与闭包](./11-迭代器与闭包.md)
