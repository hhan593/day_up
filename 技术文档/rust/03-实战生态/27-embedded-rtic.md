# 27 · 嵌入式与 RTIC（实时系统）

> 官方来源：RTIC 框架（https://rtic.rs/，实时中断驱动并发）、rust-embedded 书（https://docs.rust-embedded.org/）
> 说明：RTIC 官网为重定向页（仅占位），本文基于 RTIC 标准架构与 rust-embedded 官方书结构整理；Rust 嵌入式生态成熟（no_std、cortex-m）。

Rust 因**无 GC、零成本抽象、内存安全**成为嵌入式/C 替代首选，RTIC 是主流实时并发框架。

## 一、嵌入式 Rust 基础（no_std）

```rust
#![no_std]                       // 不链接标准库（无 OS）
#![no_main]                      // 无 main（用入口宏）

use cortex_m_rt::entry;
use cortex_m::asm::wfi;

#[entry]
fn main() -> ! {
    loop {
        wfi();                   // 等待中断
    }
}
```

- `#![no_std]`：嵌入式无操作系统环境，用 `core` 库 + `alloc`（可选）。
- `#![no_main]` + `#[entry]`：自定义复位入口（cortex-m-rt 提供）。
- 与 `21-unsafe-ffi.md`：嵌入式大量 `unsafe` 操作寄存器（MMIO）。

## 二、RTIC 架构（Real-Time Interrupt-driven Concurrency）

RTIC 用**中断 + 静态任务**实现确定性实时调度，无动态分配、无隐藏锁。

```rust
#[rtic::app(device = stm32f4xx_hal::pac, peripherals = true)]
mod app {
    use stm32f4xx_hal::prelude::*;

    #[shared]
    struct Shared { counter: u32 }

    #[local]
    struct Local { led: gpio::Output }

    #[init]
    fn init(cx: init::Context) -> (Shared, Local, init::Monotonics) {
        (Shared { counter: 0 }, Local { led: /* ... */ }, init::Monotonics())
    }

    // 软件任务（可调度）
    #[task(shared = [counter])]
    fn task1(cx: task1::Context) {
        *cx.shared.counter += 1;
    }

    // 硬件中断任务
    #[task(binds = TIM2, shared = [counter])]
    fn tick(cx: tick::Context) {
        *cx.shared.counter += 1;
    }
}
```

- `#[shared]`：任务间共享资源（RTIC 编译期证明无数据竞争，对应 `17-concurrency-parallel.md` 的 Send/Sync 思想）。
- `#[local]`：单任务私有资源。
- `#[task(binds = TIM2)]`：绑定硬件中断。
- **优先级**：高优先级任务可抢占低优先级，共享资源自动临界区保护。

## 三、RTIC 关键特性

| 特性 | 说明 |
|---|---|
| 零成本 | 编译为直接中断向量，无运行时调度器 |
| 静态分析 | 共享资源锁在编译期确定，无死锁 |
| 消息传递 | 任务间用 `spawn`/`schedule` 而非共享内存 |
| 定时 | `schedule` 在指定时刻触发任务（基于单调时钟） |
| 确定性 | 中断延迟可计算，适合硬实时 |

## 四、与系列对照

| Rust 嵌入式 | 其他 |
|---|---|
| `no_std` + `#[entry]` | C `main` + 启动文件 |
| RTIC 任务 | FreeRTOS 任务 / Zephyr 线程 |
| 编译期无竞争 | Java `synchronized`（运行期，java/15） |
| `unsafe` MMIO | C volatile 寄存器 |

- RTIC 的「编译期并发安全」与 Rust 所有权哲学一致（见 `17-concurrency-parallel.md`）。

## 五、常用生态

- `cortex-m` / `cortex-m-rt`：ARM Cortex-M 支持
- `stm32f4xx-hal` / `nrf-hal`：芯片 HAL
- `defmt`：高效日志（嵌入式环境）
- `probe-rs`：调试烧录

## 六、学习路径

1. 跑通 `cortex-m-quickstart` 模板（blinky）。
2. 学 RTIC book 的 shared/local/init/task。
3. 结合 `05-借用与引用.md`、`17-concurrency-parallel.md` 理解静态并发。

> 延伸：`21-unsafe-ffi.md`、`17-concurrency-parallel.md`、`技术文档/java/24-messaging-microservices.md`（实时对照）。
