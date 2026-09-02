# 54. 交叉编译与发布分发

> 来源可信度：**官方结构确认 + 标准实践**（基于 Rust 官方 `rustup target`、cross、cargo-dist 文档）
> 适用：需要为 Linux/macOS/Windows/嵌入式/ musl 静态链接构建与分发产物。
> 关联：`20-cargo-advanced.md`、`53-no-std-embedded.md`

## 1. 目标三元组（Target Triple）

格式：`架构-厂商-操作系统-ABI`

| 目标 | 说明 |
|------|------|
| `x86_64-unknown-linux-gnu` | Linux 64 位，glibc |
| `x86_64-unknown-linux-musl` | Linux 静态链接（无 glibc 依赖，容器友好） |
| `aarch64-unknown-linux-gnu` | ARM64 Linux（服务器、树莓派） |
| `aarch64-apple-darwin` | Apple Silicon macOS |
| `x86_64-apple-darwin` | Intel macOS |
| `x86_64-pc-windows-msvc` | Windows（MSVC 工具链） |
| `x86_64-pc-windows-gnu` | Windows（MinGW） |
| `wasm32-wasip1` | WASI（见 `50-wasmtime-wasi.md`） |
| `wasm32-unknown-unknown` | 浏览器 WASM（见 `25-wasm-web.md`） |
| `thumbv7em-none-eabihf` | Cortex-M4F 裸机（见 `53`） |

```bash
rustup target list                  # 所有支持的目标
rustup target add aarch64-unknown-linux-gnu
rustup target add x86_64-unknown-linux-musl
rustup target add x86_64-pc-windows-msvc

cargo build --release --target x86_64-pc-windows-msvc
```

## 2. 静态链接 Linux（musl）——容器首选

glibc 动态链接的二进制在不同 Linux 发行版上可能跑不起来。musl 静态链接产物**复制到任何 Linux 都能跑**。

```bash
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl

# 验证是否静态
file target/x86_64-unknown-linux-musl/release/app
# → ELF 64-bit LSB executable, statically linked
```

### 极简 Docker 镜像

```dockerfile
FROM rust:1 AS builder
RUN rustup target add x86_64-unknown-linux-musl
WORKDIR /app
COPY . .
RUN cargo build --release --target x86_64-unknown-linux-musl

FROM scratch                                  # 空镜像！
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/app /app
ENTRYPOINT ["/app"]
```

**最终镜像只有二进制大小**（通常 < 20MB），无 OS 层，攻击面最小。

> ⚠️ musl 注意：DNS 解析、OpenSSL、jemalloc 等需适配。用 rustls（见 `52`）可避开 OpenSSL 问题。

## 3. cross：一键交叉编译

`cross` 用 Docker 提供各目标的完整工具链，省去手工配置链接器。

```bash
cargo install cross
cross build --release --target aarch64-unknown-linux-gnu
cross build --release --target x86_64-pc-windows-gnu
cross test --target aarch64-unknown-linux-gnu      # 甚至能跑测试（QEMU）
```

`Cross.toml` 配置：

```toml
[target.aarch64-unknown-linux-gnu]
pre-build = ["dpkg --add-architecture arm64", "apt-get update"]

[build.env]
passthrough = ["RUST_LOG"]
```

## 4. 处理 C 依赖

交叉编译最大的痛点是 C 库。策略：

| 问题 | 方案 |
|------|------|
| OpenSSL | 换 **rustls**（见 `52`）或开 `vendored` feature 静态编译 |
| 系统库链接 | 用 `cross` 或 `cargo-zigbuild` |
| 需要交叉链接器 | `cargo-zigbuild`（用 Zig 自带交叉链接器，极方便） |

```bash
cargo install cargo-zigbuild
# 需先装 zig
cargo zigbuild --release --target aarch64-unknown-linux-gnu
```

> **cargo-zigbuild 是目前交叉编译 Linux 目标最省事的方案**，Zig 内置了所有 glibc 版本的交叉链接能力。

## 5. 发布配置优化

```toml
[profile.release]
opt-level = 3              # 或 "z"（体积优先）、"s"
lto = "thin"               # 或 true（fat LTO，更慢但更优）
codegen-units = 1          # 更优但编译慢
panic = "abort"            # 减小体积（库不要用）
strip = "symbols"          # 去符号，减小体积
```

体积敏感时：

```toml
[profile.release]
opt-level = "z"
lto = true
codegen-units = 1
panic = "abort"
strip = true
```

检查体积构成：

```bash
cargo install cargo-bloat
cargo bloat --release --crates    # 按 crate 统计
```

## 6. 分发方式

### 6.1 crates.io 发布（库）

```bash
cargo login <token>
cargo publish --dry-run     # 先干跑
cargo publish
```

`Cargo.toml` 必需元数据：

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2021"
description = "一句话描述"
license = "MIT OR Apache-2.0"
repository = "https://github.com/..."
readme = "README.md"
keywords = ["async", "web"]
categories = ["network-programming"]
```

> ⚠️ `cargo publish` **不可撤销**，版本号不可复用（`yank` 只能阻止新依赖）。

### 6.2 cargo-dist：自动构建分发

```bash
cargo install cargo-dist
cargo dist init             # 生成 GitHub Actions 工作流
```

自动生成：多平台构建 → 打包 tar.gz/zip → 生成安装脚本 → 发布 GitHub Release → 可选 Homebrew/Scoop 公式。

### 6.3 二进制分发渠道

| 渠道 | 命令 |
|------|------|
| GitHub Releases | 直接上传二进制 |
| `cargo install` | 从 crates.io 或 git |
| Homebrew | `brew install user/tap/app` |
| Scoop / Chocolatey | Windows 包管理 |
| Docker Hub | 镜像分发 |
| Shell 安装脚本 | `curl ... \| sh` |

## 7. CI 矩阵示例（GitHub Actions）

```yaml
name: Release
on:
  push:
    tags: ["v*"]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - target: x86_64-unknown-linux-gnu
            os: ubuntu-latest
          - target: aarch64-unknown-linux-gnu
            os: ubuntu-latest
            linker: gcc-aarch64-linux-gnu
          - target: x86_64-apple-darwin
            os: macos-latest
          - target: aarch64-apple-darwin
            os: macos-latest
          - target: x86_64-pc-windows-msvc
            os: windows-latest
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}
      - run: cargo build --release --target ${{ matrix.target }}
      - uses: actions/upload-artifact@v4
        with:
          name: app-${{ matrix.target }}
          path: target/${{ matrix.target }}/release/app*
```

## 8. macOS 通用二进制（Universal Binary）

同时支持 Intel 与 Apple Silicon：

```bash
rustup target add x86_64-apple-darwin aarch64-apple-darwin
cargo build --release --target x86_64-apple-darwin
cargo build --release --target aarch64-apple-darwin

lipo -create \
  target/x86_64-apple-darwin/release/app \
  target/aarch64-apple-darwin/release/app \
  -output app-universal
```

## 9. 常见坑

| 坑 | 解决 |
|----|------|
| `linker 'cc' not found` | 装目标平台链接器或用 `cross`/`cargo-zigbuild` |
| glibc 版本不兼容 | 用 musl 或 `cargo-zigbuild --target ...glibc-2.17` |
| Windows 上 OpenSSL 报错 | 换 rustls 或用 vcpkg |
| 二进制太大 | `strip` + `opt-level="z"` + `lto` |
| 发布后想撤回 | 只能 `cargo yank`，版本号永久占用 |
| macOS 未签名被 Gatekeeper 拦 | 需 Apple Developer 签名 + 公证 |

## 10. 一句话总结

> 交叉编译：`rustup target add` + `cargo build --target`；Linux 容器用 **musl 静态链接**配 `FROM scratch` 出超小镜像；遇 C 依赖用 **cargo-zigbuild/cross**；发布用 `cargo publish`（库，不可逆）或 cargo-dist（二进制，自动多平台 Release）；macOS 用 `lipo` 合并通用二进制。
