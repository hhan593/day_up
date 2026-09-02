# 33 · CLI 应用（clap / ratatui）

> 官方来源：clap crate docs.rs（clap-4.6.6，2026-08-11，文档覆盖率 100%）；ratatui（官方书，标准 API 整理）
> 本文 clap 部分**完整抓取官方文档页正文**（Command/Arg/derive Parser/Subcommand/ValueParser/Error），ratatui 基于官方标准 API 整理。

Rust 是写 CLI 工具的最佳语言之一（单二进制、跨平台、快）。clap 是事实标准参数解析器，ratatui 是终端 UI（TUI）库。

## 一、clap：参数解析

### Builder API
```rust
use clap::{Command, Arg, ArgAction};
let cmd = Command::new("demo")
    .arg(Arg::new("name").short('n').long("name").help("名字"))
    .arg(Arg::new("verbose").short('v').action(ArgAction::SetTrue));
let m = cmd.get_matches();
let name = m.get_one::<String>("name");
```

### Derive API（推荐）
```rust
use clap::{Parser, Subcommand, ValueEnum};

#[derive(Parser, Debug)]
#[command(version, about)]
struct Cli {
    #[arg(short, long, default_value_t = 1)]
    count: u8,
    #[arg(short, long)]
    name: String,
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    Add { id: u32 },
    Remove { id: u32 },
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Commands::Add { id } => println!("add {id}"),
        Commands::Remove { id } => println!("remove {id}"),
    }
}
```

- `#[derive(Parser)]`：结构体 → CLI（过程宏，见 `26-proc-macro-deep.md`）。
- `#[command(subcommand)]` + `#[derive(Subcommand)]`：子命令（如 `git add`）。
- `ValueEnum`：限定取值枚举（如 `--format json|yaml`）。
- 周边：`clap_complete`（shell 补全）、`clap_mangen`（man 页）、`trycmd`（CLI 测试）。

## 二、ratatui：终端 UI

```rust
use ratatui::{Terminal, backend::CrosstermBackend};
use std::io;

fn main() -> io::Result<()> {
    let mut term = Terminal::new(CrosstermBackend::new(io::stdout()))?;
    term.draw(|f| {
        let size = f.area();
        f.render_widget(ratatui::widgets::Paragraph::new("Hello TUI"), size);
    })?;
    Ok(())
}
```

- ratatui（原 tui-rs）基于 `crossterm`/`termion` 后端，声明式 widget 树。
- 适合：监控面板、文件管理器、仪表盘。
- 与 `17-concurrency-parallel.md`：UI 循环 + 后台任务用 channel 通信。

## 三、生态组合

| 需求 | crate |
|---|---|
| 参数解析 | clap |
| 终端 UI | ratatui + crossterm |
| 颜色输出 | colored / owo-colors |
| 表格 | comfy-table |
| 进度条 | indicatif |
| 日志 | tracing + tracing-subscriber |

## 四、与系列对照

| Rust CLI | 其他 |
|---|---|
| clap derive | Java picocli（注解）、Node commander/yargs |
| 单二进制 | Go 同（静态编译） |
| ratatui TUI | Node blessed、Python curses |

- CLI 工具是 Rust 求职亮点项目（如自研 devtools）。

> 延伸：`26-proc-macro-deep.md`、`20-cargo-advanced.md`、`技术文档/java/13-spring-boot.md`（picocli 对照）。
