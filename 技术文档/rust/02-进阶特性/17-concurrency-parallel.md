# 17 · 并发与并行（Fearless Concurrency）

> 官方来源：The Rust Programming Language（The Book）第 16 章 "Fearless Concurrency"（https://doc.rust-lang.org/book/ch16-00-concurrency.html，Rust Team）
> 说明：官方页为章节导言（确认章节范围），本文基于官方文档结构与 Rust 标准库 std::thread / std::sync 标准 API 整理；示例代码为官方示例风格真实片段。

Rust 的并发哲学：**所有权与类型系统既是内存安全工具，也是并发安全工具**——许多并发 bug 在编译期就被拒绝（"无畏并发"）。

## 一、线程：spawn 与 move

```rust
use std::thread;

let v = vec![1, 2, 3];
let handle = thread::spawn(move || {
    println!("子线程: {:?}", v); // move 把 v 所有权转移进闭包
});
handle.join().unwrap();         // 等待子线程结束
```

- `thread::spawn` 返回 `JoinHandle`，`join()` 阻塞等待。
- 闭包必须 `move`：子线程可能比当前栈活得久，不能借用栈上数据。
- 与 Java `Thread`/`Runnable`（java/10、java/15）对照：Rust 线程无 GC，靠所有权保证线程安全。

## 二、消息传递：channel（mpsc）

```rust
use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();     // multi-producer, single-consumer
let tx2 = tx.clone();
thread::spawn(move || { tx.send(1).unwrap(); });
thread::spawn(move || { tx2.send(2).unwrap(); });
for received in rx {                // rx 迭代器阻塞接收
    println!("收到: {received}");
}
```

- `mpsc::channel()`：多个发送者、一个接收者（Go channel 是 CSP 模型，与此一致）。
- 发送值被**移动**进 channel（所有权转移），天然避免数据竞争。

## 三、共享状态：Mutex

```rust
use std::sync::{Mutex, Arc};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];
for _ in 0..10 {
    let c = Arc::clone(&counter);
    handles.push(thread::spawn(move || {
        let mut num = c.lock().unwrap(); // 获取锁，返回 MutexGuard
        *num += 1;                        // 离开作用域自动解锁
    }));
}
for h in handles { h.join().unwrap(); }
println!("结果: {}", *counter.lock().unwrap()); // 10
```

- `Mutex<T>`：互斥锁，同一时刻仅一个线程可访问内部数据。
- `Arc<T>`（原子引用计数）：多线程共享所有权；`Rc<T>` 不是 `Send`，不能跨线程。
- 与 Java `synchronized`/`ReentrantLock`（java/15）对照：`lock()` 返回 RAII 守卫，`Drop` 时自动释放，不可能忘记解锁。

## 四、Send 与 Sync：并发安全标记 trait

| Trait | 含义 |
|---|---|
| `Send` | 类型的所有权可**转移**到另一个线程 |
| `Sync` | 类型可被多个线程**同时**共享引用（`&T` 是 `Send`） |

- 标准库类型自动实现：`i32`（两者皆 `Send+Sync`）、`Mutex<T>`（`Send+Sync` 若 `T: Send`）、`Rc<T>`（**两者皆否**，故不能跨线程）。
- `Arc<T>` 是 `Send+Sync` 当 `T: Send+Sync`。
- 自定义类型通常自动派生；手动实现 `unsafe impl Send` 需自己保证安全。

## 五、并发 vs 并行

- **并发（concurrent）**：不同部分独立推进（不一定同时）。
- **并行（parallel）**：不同部分同时执行（多核）。
- Rust 不强制范式：消息传递（channel）或共享状态（Mutex/原子）按场景选用。

## 六、原子类型

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc; use std::thread;

let n = Arc::new(AtomicUsize::new(0));
// 多个线程 n.fetch_add(1, Ordering::SeqCst)
```

- `AtomicUsize` 等无需锁即可安全并发修改，对应 Java `AtomicInteger`（java/15）。
- `Ordering` 控制内存顺序（SeqCst/Acquire/Release），对应 Java 内存模型（java/16）。

## 七、与系列对照

- Java：`java/10` 虚拟线程、`java/15` 并发进阶（`synchronized`/Lock/JUC）、`java/16` JVM 内存模型。
- Go：goroutine + channel（CSP）与 Rust channel 同源思想。
- Node：`node/02` 单线程事件循环、`node/09` worker_threads。
- C++：`std::thread`/`std::mutex` 类似，但 Rust 编译期防数据竞争。

> 延伸：`18-async-await.md`（高并发 I/O）、`21-unsafe-ffi.md`、`技术文档/java/15-concurrency-advanced.md`。
