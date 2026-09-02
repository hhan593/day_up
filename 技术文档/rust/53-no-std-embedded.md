# 53. no_std 与嵌入式 Rust（embedded-hal / Embassy）

> 来源可信度：**官方结构确认 + 标准实践**（基于 `embedded-hal` 官方仓库、Embassy 官方文档结构、Rust `no_std` 官方书）
> 适用：MCU 固件、裸机程序、内核态/引导程序、极致体积场景。
> 关联：`27-embedded-rtic.md`、`48-kernel-driver-practice.md`

## 1. no_std 是什么

`#![no_std]` 告诉编译器**不使用标准库 `std`**，改用核心库 `core`（无操作系统依赖）。

```rust
#![no_std]
#![no_main]          // 无标准 main（自定义入口）

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}          // 嵌入式里 panic 后通常重启或死循环
}
```

**std 与 core 的区别**：

| 能力 | core | std |
|------|------|-----|
| 基本类型、迭代器、Option/Result | ✅ | ✅ |
| 堆分配（`Box`/`Vec`/`String`） | ❌ 需 `alloc` | ✅ |
| 文件/网络/线程/时间 | ❌ | ✅ |
| `println!`（需 stdout） | ❌ | ✅ |

## 2. 三层：core / alloc / std

```rust
#![no_std]
extern crate alloc;                  // 启用 alloc（需实现全局分配器）
use alloc::{vec::Vec, string::String, boxed::Box};

// 必须提供全局分配器
#[global_allocator]
static ALLOC: MyAllocator = MyAllocator;
```

常用第三方分配器：`embedded-alloc`（配合 `linked_list_allocator`）、`talc`、`buddy-alloc`。

```toml
embedded-alloc = "0.5"
```

```rust
#[global_allocator]
static HEAP: embedded_alloc::Heap = embedded_alloc::Heap::empty();

// 启动时初始化堆
unsafe {
    const HEAP_SIZE: usize = 64 * 1024;
    static mut HEAP_MEM: [u8; HEAP_SIZE] = [0; HEAP_SIZE];
    HEAP.init(addr_of_mut!(HEAP_MEM) as *mut u8, HEAP_SIZE);
}
```

## 3. embedded-hal：硬件抽象层

`embedded-hal` 定义**trait**，让驱动与具体芯片解耦。同一份传感器驱动可在 STM32、nRF、RP2040 上跑。

```toml
embedded-hal = "1.0"
```

核心 trait（`embedded-hal 1.0`）：

| trait | 用途 |
|-------|------|
| `digital::OutputPin` / `InputPin` | GPIO 输入/输出 |
| `digital::StatefulOutputPin` | 可读回当前状态 |
| `spi::SpiDevice` / `SpiBus` | SPI 通信 |
| `i2c::I2c` | I2C 通信 |
| `serial::Read` / `Write` | 串口 |
| `delay::DelayNs` | 延时 |
| `pwm::SetDutyCycle` | PWM |
| `adc::OneShot` / `Channel` | ADC 采样 |

### 用 trait 写通用驱动

```rust
use embedded_hal::{delay::DelayNs, digital::OutputPin};

// 任意实现了 trait 的引脚都能用
pub struct Led<P: OutputPin> { pin: P }

impl<P: OutputPin> Led<P> {
    pub fn new(pin: P) -> Self { Self { pin } }
    pub fn on(&mut self)  { let _ = self.pin.set_high(); }
    pub fn off(&mut self) { let _ = self.pin.set_low(); }

    pub fn blink<D: DelayNs>(&mut self, delay: &mut D, ms: u32) {
        self.on();  delay.delay_ms(ms);
        self.off(); delay.delay_ms(ms);
    }
}
```

## 4. Embassy：异步嵌入式框架

Embassy 用 **async/await + 硬件中断驱动的执行器**写固件，无需 RTOS。

```toml
embassy-executor = { version = "0.7", features = ["defmt", "executor-thread"] }
embassy-time = { version = "0.4", features = ["defmt"] }
embassy-stm32 = { version = "0.2", features = ["stm32f407vg", "time-driver-any"] }
```

```rust
#![no_std]
#![no_main]

use embassy_executor::Spawner;
use embassy_time::{Delay, Duration, Timer};
use embassy_stm32::gpio::{Level, Output, Speed};
use embedded_hal::delay::DelayNs;

#[embassy_executor::main]
async fn main(_spawner: Spawner) {
    let p = embassy_stm32::init(Default::default());

    let mut led = Output::new(p.PA5, Level::High, Speed::Low);

    loop {
        led.set_high();
        Timer::after(Duration::from_millis(500)).await;   // 异步等待，不阻塞
        led.set_low();
        Timer::after(Duration::from_millis(500)).await;
    }
}
```

**为什么异步适合 MCU**：多个任务（读传感器、刷屏、通信）在单核上协作调度，`Timer::after().await` 期间 CPU 可进入低功耗睡眠。

### 多任务

```rust
#[embassy_executor::task]
async fn blink(mut led: Output<'static>) {
    loop {
        led.toggle();
        Timer::after(Duration::from_millis(300)).await;
    }
}

#[embassy_executor::task]
async fn read_sensor(mut i2c: I2c<'static, I2C1>) {
    loop {
        let mut buf = [0u8; 2];
        let _ = i2c.write_read(0x44, &[0x00], &mut buf).await;
        Timer::after(Duration::from_secs(1)).await;
    }
}

#[embassy_executor::main]
async fn main(spawner: Spawner) {
    let p = embassy_stm32::init(Default::default());
    spawner.spawn(blink(Output::new(p.PA5, Level::Low, Speed::Low))).unwrap();
    spawner.spawn(read_sensor(I2c::new(p.I2C1, /* ... */))).unwrap();
}
```

## 5. 调试输出：defmt

嵌入式没有 stdout，用 **defmt**（高效二进制日志，通过 SWD 传输）。

```toml
defmt = "1.0"
defmt-rtt = "0.4"        # 通过 RTT 输出
panic-probe = { version = "0.3", features = ["print-defmt"] }
```

```rust
use defmt::*;

#[embassy_executor::main]
async fn main(_s: Spawner) {
    info!("booted");
    let value = 42;
    debug!("value = {}", value);
    trace!("heap left: {} bytes", 1024);
}
```

> defmt 把格式化**放到主机端**做，MCU 只发原始字节——比 `printf` 省 flash 与带宽。

## 6. 构建与烧录

```bash
# 加目标（以 Cortex-M4F 为例）
rustup target add thumbv7em-none-eabihf

# 构建
cargo build --release

# 生成二进制 + 查看体积
cargo install cargo-binutils
cargo size --release -- -A

# 烧录（probe-rs）
cargo install probe-rs-tools
probe-rs run --chip STM32F407VG target/thumbv7em-none-eabihf/release/app

# 或 elf2uf2（RP2040）
cargo install elf2uf2-rs
cargo run --release
```

`.cargo/config.toml`：

```toml
[target.thumbv7em-none-eabihf]
rustflags = [
  "-C", "link-arg=-Tlink.x",        # 链接脚本
  "-C", "link-arg=-Tdefmt.x",
]
runner = "probe-rs run --chip STM32F407VG"

[build]
target = "thumbv7em-none-eabihf"
```

## 7. 体积优化

```toml
[profile.release]
opt-level = "z"        # 体积优先
lto = true
codegen-units = 1
panic = "abort"        # 去掉栈展开
strip = true
overflow-checks = false
```

用 `cargo bloat` 看谁占体积：

```bash
cargo install cargo-bloat
cargo bloat --release --target thumbv7em-none-eabihf
```

## 8. 与 RTIC 对照

| | Embassy | RTIC（`27-embedded-rtic.md`） |
|---|---------|------------------------------|
| 模型 | async/await 协作式 | 中断驱动 + 优先级抢占 |
| 调度 | 执行器 | 硬件中断控制器 |
| 实时性 | 软实时 | **硬实时**，有优先级保证 |
| 上手 | 类似普通异步代码 | 需理解中断与资源模型 |

选 Embassy 若：任务多、逻辑复杂、要网络协议栈。
选 RTIC 若：硬实时 deadline、电机控制、精确时序。

## 9. 常见坑

| 坑 | 解决 |
|----|------|
| `error: language item required: eh_personality` | `panic = "abort"` 或加 `eh_personality` lang item |
| 忘记 `#[panic_handler]` | 自定义 panic 处理（或 panic-probe） |
| 堆溢出 | 调大 heap size，或避免分配（用 `heapless`） |
| 栈溢出 | 增大栈（`_stack_start` 或 linker script） |
| 用了 `std` 的 crate | 选 `no_std` 版本（看 crate 的 `default-features = false`） |
| 浮点性能差 | 确认目标支持硬件 FPU（`-eabihf`） |

## 10. 一句话总结

> no_std 用 `core`（+可选 `alloc`）写无 OS 代码；`embedded-hal` 用 trait 解耦驱动与芯片；**Embassy 用 async/await 在单核 MCU 上协作调度**（软实时），RTIC 用中断抢占（硬实时）；defmt 做高效日志，`opt-level="z"` + `panic="abort"` 压体积，probe-rs 烧录调试。
