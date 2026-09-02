# 30 · Rust 与 Java 互操作（JNI 实战）

> 官方来源：jni crate docs.rs（jni-0.22.4，2026-07-01，文档覆盖 100%）+ Oracle JNI Spec
> 本文**完整抓取 jni crate 官方文档页正文**（JavaVM/Env/JObject/异常/构建流程），结合标准实战整理。联动 `技术文档/java`。

用 Rust 重写 Java 性能热点（加解密、解析、数值计算），通过 **JNI** 编译为 `.so/.dll` 被 Java 调用——互补两者优势（Rust 无 GC 高性能 + Java 生态成熟）。

## 一、架构

```
Java 应用 (JVM)
   │ JNI 调用 native 方法
libmylib.so (Rust, cdylib)   ← 性能敏感逻辑用 Rust 写
```

- Java 侧 `native` 方法 → Rust 侧导出 `Java_包_类_方法` 符号 → JVM 加载动态库。

## 二、Java 侧

```java
public class Crypto {
    static { System.loadLibrary("mylib"); }   // 加载 libmylib.so
    private static native String hash(String input);

    public static void main(String[] a) {
        System.out.println(hash("hello"));    // 由 Rust 实现
    }
}
```

## 三、Rust 侧（jni crate）

```rust
use jni::JNIEnv;
use jni::objects::{JClass, JString};
use jni::sys::jstring;

#[no_mangle]
pub extern "system" fn Java_Crypto_hash(
    mut env: JNIEnv,
    _class: JClass,
    input: JString,
) -> jstring {
    // 1. Java String -> Rust String
    let input: String = env.get_string(&input).unwrap().into();

    // 2. 高性能 Rust 计算（如 blake3 哈希）
    let out = compute_hash(&input);

    // 3. Rust String -> Java String
    env.new_string(out).unwrap().into_raw()
}
```

- `#[no_mangle] extern "system"`：导出符合 JNI 命名规范的符号（`Java_Crypto_hash`）。
- `JNIEnv`：JNI 函数入口（获取/创建 Java 对象、抛异常）。
- `JString`/`JClass`：Java 对象的安全包装（带生命周期 `'caller`）。
- 编译：`crate-type = ["cdylib"]` → `libmylib.so`。

## 四、双向：从 Rust 启动 JVM（Invocation API）

```rust
use jni::JavaVM;
use jni::InitArgsBuilder;

let jvm_args = InitArgsBuilder::new().build().unwrap();
let jvm = JavaVM::new(jvm_args).unwrap();       // 启动 JVM
let mut env = jvm.attach_current_thread().unwrap();
// env.call_method(...)/new_object(...) 调 Java
```

- `JavaVM::new` 从原生进程启动 JVM（反向集成）。
- `attach_current_thread`：在非 Java 线程附着 JVM。

## 五、错误处理与异常

- Rust `Err`/`panic` **不能跨 FFI 边界**（未定义行为）→ 必须 `catch_unwind` 转 Java 异常。
- jni crate 提供 `ErrorPolicy`：`outcome.resolve::<ThrowRuntimeExAndDefault>()` 把错误转 `RuntimeException`。
- 主动抛异常：`env.throw_new("java/lang/RuntimeException", msg)`。

## 六、类型映射

| Java | JNI (Rust) |
|---|---|
| `String` | `JString` |
| `int` | `jint` (i32) |
| `long` | `jlong` (i64) |
| `Object` | `JObject` |
| 数组 | `JByteArray`/`jintArray` |

- 大数组用 `GetArrayElements` 直接访问，避免拷贝。

## 七、构建与运行

```bash
cargo build --release                    # 产出 libmylib.so
javac Crypto.java
java -Djava.library.path=target/release Crypto
```

- 工具：`jni_mangle` 属性宏自动生成 mangled 名；`bind_java_type` 生成 Rust 绑定。
- 也可用 `jni::JavaVM::register_native_methods` 运行时注册（无需 mangled 名）。

## 八、与系列联动

- Rust 侧：`21-unsafe-ffi.md`（extern "C" 基础）、`17-concurrency-parallel.md`（Rust 线程安全）。
- Java 侧：`技术文档/java/13-spring-boot.md`（可在 Spring 服务中调 native）、`java/22-spring-security.md`、`java/16-jvm-memory-model.md`（JNI 内存与 GC 交互——Rust 分配不在 JVM 堆，需手动释放）。
- 生产案例：GreptimeDB 用 Rust 强化 Java 时序数据库、Lucene 向量搜索 Rust 化。
- 替代方案：`Project Panama` (Java 21+ `java.lang.foreign`) 也可调 Rust，但 JNI 最成熟。

## 九、跨语言对照小结

| 互操作 | 技术 |
|---|---|
| Rust ↔ Java | JNI（本文）、Panama FFI |
| Rust ↔ Node | NAPI-RS / Neon / Wasm（25-wasm-web） |
| Rust ↔ C | extern "C"（21-unsafe-ffi） |
| Rust ↔ Python | PyO3 |

> 至此 `技术文档/rust` 30 篇完整覆盖从入门到专家+跨语言集成。
