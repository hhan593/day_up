# 51. Rust 测试进阶（proptest / criterion / mockall）

> 来源可信度：**完整正文级**（基于 docs.rs `proptest 1.11.0`，2026-07-04 文档；criterion、mockall 为社区标准实践）
> 关联：`11-Rust测试与文档手册.md`（基础测试）

## 1. 三层测试策略

| 层 | 工具 | 目的 |
|----|------|------|
| 单元/集成 | `cargo test`（内置） | 正确性 |
| 属性测试 | `proptest` | 找边界/反例 |
| 基准测试 | `criterion` | 性能回归 |
| Mock | `mockall` | 隔离外部依赖 |

## 2. proptest：属性测试

不写具体输入，而是**声明属性（不变量）**，让框架随机生成成百上千个用例去找反例。

```toml
[dev-dependencies]
proptest = "1.11"
```

### 2.1 第一个属性测试

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn add_commutative(a in 0..1000i32, b in 0..1000i32) {
        prop_assert_eq!(a + b, b + a);
    }

    #[test]
    fn parse_roundtrip(s in "\\PC*") {
        // 字符串经某变换再还原应相等
        let encoded = encode(&s);
        prop_assert_eq!(decode(&encoded), s);
    }
}
```

**宏**（官方 API 名录）：
- `proptest!` — 定义属性测试
- `prop_assert!` / `prop_assert_eq!` / `prop_assert_ne!` — 与 `assert!` 系列同义，但返回测试失败而非 panic
- `prop_assume!` — 前置条件不满足则丢弃该输入（不是失败）
- `prop_oneof!` — 从多个策略中挑一个
- `prop_compose!` — 组合出新策略

### 2.2 策略（Strategy）模块

官方 `proptest` 模块划分：

| 模块 | 生成什么 |
|------|---------|
| `num` | 数值（含范围分布） |
| `string` | 字符串、字节串（支持正则 `"[a-z]+"`） |
| `collection` | Vec/HashMap 等集合 |
| `option` / `result` | Option / Result |
| `bool` / `char` / `bits` | 布尔、字符、位集 |
| `array` / `tuple` | 定长数组、元组 |
| `sample` | 从集合采样 |
| `path` | `PathBuf` |
| `range_subset` | 索引范围采样 |
| `strategy` | 核心 trait |
| `test_runner` | 运行配置 |

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn vec_len_preserved(v in prop::collection::vec(any::<i32>(), 0..100)) {
        let sorted = { let mut s = v.clone(); s.sort(); s };
        prop_assert_eq!(sorted.len(), v.len());
    }
}
```

### 2.3 自定义策略

```rust
use proptest::prelude::*;

#[derive(Debug, Clone)]
struct User { name: String, age: u8 }

fn user_strategy() -> impl Strategy<Value = User> {
    ("[a-zA-Z]{1,10}", 0u8..120).prop_map(|(name, age)| User { name, age })
}

proptest! {
    #[test]
    fn user_valid(user in user_strategy()) {
        prop_assert!(user.age < 120 || user.age == 0);
    }
}
```

### 2.4 配置与失败收缩（shrinking）

proptest 失败时会自动**收缩**输入到最小反例：

```
Test failed: minimal failing input: a = 0, b = 0.
```

配置用例数：

```rust
proptest! {
    #![proptest_config(ProptestConfig::with_cases(10000))]
    #[test]
    fn heavy(a in any::<u64>()) { /* ... */ }
}
```

### 2.5 何时用属性测试

- 序列化/反序列化往返
- 解析器（任意输入不应 panic）
- 数据结构不变量（排序后有序、长度不变）
- 数值算法的交换律/结合律/边界

## 3. criterion：基准测试

内置 `#[bench]` 需 nightly，**criterion 是 stable 上的事实标准**。

```toml
[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }

[[bench]]
name = "my_bench"
harness = false
```

```rust
// benches/my_bench.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    match n { 0 | 1 => n, _ => fibonacci(n - 1) + fibonacci(n - 2) }
}

fn bench_fib(c: &mut Criterion) {
    c.bench_function("fib 20", |b| {
        b.iter(|| fibonacci(black_box(20)))
    });

    // 对比不同输入规模
    let mut group = c.benchmark_group("fib-scaling");
    for n in [10u64, 15, 20] {
        group.bench_with_input(format!("fib {n}"), &n, |b, &n| {
            b.iter(|| fibonacci(black_box(n)))
        });
    }
    group.finish();
}

criterion_group!(benches, bench_fib);
criterion_main!(benches);
```

```bash
cargo bench                    # 运行，输出在 target/criterion/report/index.html
cargo bench -- --save-baseline main    # 存基线
cargo bench -- --baseline main         # 对比基线（性能回归检测）
```

**要点**：
- `black_box(x)` 防止编译器把计算优化掉。
- `harness = false` 必须设（否则用内置 harness）。
- criterion 自动做统计分析、检测性能回归。

## 4. mockall：Mock 外部依赖

```toml
[dev-dependencies]
mockall = "0.13"
```

```rust
use mockall::{automock, predicate::*};

#[automock]                      // 自动生成 MockUserRepo
pub trait UserRepo {
    fn find(&self, id: u64) -> Option<String>;
    fn save(&self, id: u64, name: &str) -> Result<(), String>;
}

struct UserService<R: UserRepo> { repo: R }

impl<R: UserRepo> UserService<R> {
    fn get_name(&self, id: u64) -> String {
        self.repo.find(id).unwrap_or_else(|| "anonymous".into())
    }
}

#[test]
fn test_get_name() {
    let mut mock = MockUserRepo::new();
    mock.expect_find()
        .with(eq(1))
        .times(1)
        .returning(|_| Some("alice".to_string()));

    let svc = UserService { repo: mock };
    assert_eq!(svc.get_name(1), "alice");
}

#[test]
fn test_missing_user() {
    let mut mock = MockUserRepo::new();
    mock.expect_find().returning(|_| None);
    let svc = UserService { repo: mock };
    assert_eq!(svc.get_name(99), "anonymous");
}
```

**常用 API**：`expect_xxx()`、`with(predicate)`、`times(n)`、`returning(closure)`、`return_const(v)`、`returning_err`。

> 设计提示：依赖注入（泛型或 `Box<dyn Trait>`）是可 mock 的前提——这也是 `22-web-framework-axum.md` 里 `State` 注入数据库池的同一思路。

## 5. 其他测试技巧

### 5.1 测试异步代码

```rust
#[tokio::test]
async fn test_async_fn() {
    let result = fetch_data().await;
    assert!(result.is_ok());
}

// 需要多线程 runtime
#[tokio::test(flavor = "multi_thread")]
async fn test_multi() { /* ... */ }
```

### 5.2 临时目录/文件

```rust
let dir = tempfile::tempdir()?;
let path = dir.path().join("test.txt");
std::fs::write(&path, "data")?;
// dir 被 drop 时自动清理
```

### 5.3 测试 panic

```rust
#[test]
#[should_panic(expected = "index out of bounds")]
fn test_panic() {
    let v = vec![1];
    let _ = v[10];
}
```

### 5.4 覆盖率

```bash
cargo install cargo-tarpaulin      # Linux
cargo tarpaulin --out Html

# 或 llvm-cov（推荐，跨平台）
cargo install cargo-llvm-cov
cargo llvm-cov --html
```

## 6. 组织与 CI

```rust
// tests/ 目录 = 集成测试（只能用公开 API）
// src/lib.rs 里的 #[cfg(test)] mod tests = 单元测试（可测私有项）

// #[cfg(test)] 让测试代码不进 release 产物
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn it_works() { assert_eq!(add(1, 2), 3); }
}
```

CI 建议命令：

```bash
cargo fmt --check          # 格式
cargo clippy -- -D warnings  # lint
cargo test --all-features  # 测试
cargo llvm-cov --fail-under-lines 80   # 覆盖率门禁
cargo bench -- --baseline main         # 性能回归
```

## 7. 一句话总结

> 测试三层：内置 `cargo test` 管正确性；**proptest 1.11** 用策略声明不变量并自动收缩最小反例（配 `prop_assert!`/`prop_assume!`）；**criterion** 在 stable 上做统计化基准与回归对比（`black_box` + `harness = false`）；**mockall** 靠 `#[automock]` + 依赖注入隔离外部系统。
