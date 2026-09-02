# 40 · Serde 内部原理

> 官方来源：Serde crate docs.rs（serde-1.0.229，2026-07-18，文档覆盖率 100%）+ https://serde.rs
> 本文**完整抓取 serde 官方文档页正文**（核心 trait/Serializer/Deserializer/derive/数据格式清单/零开销设计），结合标准实战整理。

Serde 是 Rust 序列化事实标准（axum/tonic/sqlx/配置全用它）。理解其内部即理解 `#[derive(Serialize)]` 的魔法（见 `26-proc-macro-deep.md`）。

## 一、四大核心 Trait

| Trait | 角色 | 模块 |
|---|---|---|
| `Serialize` | 数据结构 → 任意格式 | `ser` |
| `Deserialize` | 任意格式 → 数据结构 | `de` |
| `Serializer` | 格式如何写数据 | `ser` |
| `Deserializer` | 格式如何读数据 | `de` |

- 数据结构只实现 `Serialize/Deserialize`；格式只实现 `Serializer/Deserializer`；Serde 中间层桥接二者 → **任意结构 × 任意格式**。
- 对比 Java 的 Jackson（`java/13` 未讲但思路同）：基于注解反射；Serde 基于**编译期 trait，无反射**。

## 二、基于 trait 而非反射（零开销）

官方说明：Serde 不依赖运行时反射/类型信息，编译器通常能**彻底优化掉**"结构↔格式"交互，使性能等同于为该结构+格式手写的序列化器。

```rust
use serde::{Serialize, Deserialize};
#[derive(Serialize, Deserialize)]
struct Point { x: i32, y: i32 }
```

- `#[derive(Serialize, Deserialize)]`（需 `features=["derive"]`）在编译期生成 `impl`：遍历字段调用 `serializer.serialize_i32(...)`。
- 这就是过程宏（26 章）的价值：把样板代码生成移出运行时。

## 三、数据格式（社区实现，部分）

| 格式 | 用途 |
|---|---|
| `serde_json` | HTTP API（最常用，配 axum 22 章） |
| `serde_yaml` | 配置文件 |
| `toml` | Cargo 配置（20-cargo） |
| `serde_cbor`/`rmp`(MessagePack) | 紧凑二进制 |
| `postcard` | `no_std`/嵌入式（27 章） |
| `bson` | MongoDB |
| `csv` | 表格 |
| `serde_urlencoded` | 表单 |
| `FlexBuffers` | 零拷贝（类 FlatBuffers） |

## 四、自定义数据格式

实现 `Serializer`/`Deserializer` trait：

```rust
impl serde::Serializer for MyFormat { type Ok = ...; type Error = ...;
    fn serialize_i32(self, v: i32) -> Result<Self::Ok, Self::Error> { /* 写 */ }
    // ... 各类型方法
}
```

- `forward_to_deserialize_any!` 宏：自定义 Deserializer 时转发未知字段到 `deserialize_any`，减少样板。

## 五、零拷贝/性能要点

- 官方未直接提 "zero-copy" 词，但 "编译期优化消除交互开销" + 生态含 FlexBuffers 等零拷贝格式。
- `serde_json::from_str` 返回 `Value`（运行时解析）；`serde_json::from_str::<T>()` 直接映射强类型。
- `&'de str` 借用：反序列化生命周期 `'de` 可让字段借用输入切片（零拷贝解析大 JSON）。

## 六、与系列对照

| Serde | Java | Node |
|---|---|---|
| `#[derive]` 编译期 | Jackson 注解（运行期反射） | JSON.parse（动态） |
| `serde_json` | Gson/Jackson | JSON (内置) |
| 强类型 `from_str::<T>()` | `objectMapper.readValue` | 无类型校验 |
| 零拷贝 `'de` | 无 | 无 |

- Serde 的"类型安全序列化"是 Rust 哲学延伸（对比 `36-data-redis-sqlx.md` 的 sqlx 编译期检查）。

> 延伸：`26-proc-macro-deep.md`、`22-web-framework-axum.md`、`32-tonic-grpc.md`、`技术文档/java/13-spring-boot.md`。
