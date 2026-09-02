# 52. rustls 与现代 TLS / 密码学生态

> 来源可信度：**官方结构确认 + 标准实践**（基于 rustls、ring、RustCrypto 官方仓库与文档结构）
> 适用：需要 HTTPS/TLS、签名验签、哈希、加密的服务。
> 关联：`37-actix-web-deep.md`、`39-tokio-deep.md`

## 1. 为什么用 rustls 而非 OpenSSL

| | rustls | OpenSSL (openssl crate) |
|---|--------|------------------------|
| 内存安全 | ✅ 纯 Rust（crypto 后端 ring/aws-lc-rs） | ❌ C，历史上 Heartbleed 等漏洞 |
| 依赖 | 无 C 依赖，交叉编译简单 | 需系统 OpenSSL 库 |
| FIPS | aws-lc-rs 后端支持 | 支持 |
| API | 现代 Rust | C 绑定风格 |

**rustls** 是 Rust 生态的 TLS 事实标准，被 `reqwest`、`axum-server`、`tokio-rustls` 等广泛采用。

```toml
rustls = "0.23"
tokio-rustls = "0.26"
rustls-pemfile = "2"
webpki-roots = "1"      #  Mozilla 根证书
```

## 2. rustls 核心概念

- **`ClientConfig` / `ServerConfig`**：共享的 TLS 配置（证书、协议、加密套件），应通过 `Arc` 复用。
- **`rustls::ClientConnection` / `ServerConnection`**：同步 TLS 状态机（不自己做 I/O）。
- **`tokio_rustls::TlsConnector` / `TlsAcceptor`**：把 connection 包成异步 stream。

> rustls **不做 I/O**：你负责读写字节，rustls 负责处理 TLS 协议状态。这种设计让它能适配任何 I/O 模型。

## 3. 客户端：HTTPS 请求

```rust
use tokio::net::TcpStream;
use tokio_rustls::TlsConnector;
use rustls::{ClientConfig, RootCertStore};
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ① 根证书库（用 Mozilla 根证书）
    let mut roots = RootCertStore::empty();
    roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());

    // ② 构建配置
    let config = ClientConfig::builder()
        .with_root_certificates(roots)
        .with_no_client_auth();      // 客户端不需要证书

    let connector = TlsConnector::from(Arc::new(config));
    let dnsname = "www.rust-lang.org".try_into()?;

    // ③ 连接 + TLS 握手
    let stream = TcpStream::connect("www.rust-lang.org:443").await?;
    let mut tls = connector.connect(dnsname, stream).await?;

    // ④ 之后当普通 AsyncRead/AsyncWrite 用
    use tokio::io::{AsyncWriteExt, AsyncReadExt};
    tls.write_all(b"GET / HTTP/1.0\r\nHost: www.rust-lang.org\r\n\r\n").await?;
    let mut buf = vec![0u8; 2048];
    let n = tls.read(&mut buf).await?;
    println!("{}", String::from_utf8_lossy(&buf[..n]));

    Ok(())
}
```

> 实际应用直接用 `reqwest`（内部已用 rustls/Hyper），此处展示底层组合。

## 4. 服务端：TLS 监听器

```rust
use tokio_rustls::{TlsAcceptor, rustls::{ServerConfig, Certificate, PrivateKey}};
use rustls_pemfile::{certs, pkcs8_private_keys};
use std::{sync::Arc, fs::File, io::BufReader};

fn load_config() -> anyhow::Result<ServerConfig> {
    // 读证书链 PEM
    let cert_file = &mut BufReader::new(File::open("certs/fullchain.pem")?);
    let cert_chain: Vec<Certificate> = certs(cert_file)
        .collect::<Result<Vec<_>, _>>()?
        .into_iter().map(Certificate).collect();

    // 读私钥 PKCS#8
    let key_file = &mut BufReader::new(File::open("certs/privkey.pem")?);
    let mut keys = pkcs8_private_keys(key_file).collect::<Result<Vec<_>, _>>()?;
    let key = PrivateKey(keys.remove(0));

    Ok(ServerConfig::builder()
        .with_no_client_auth()          // 不做客户端证书认证
        .with_single_cert(cert_chain, key)?)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let acceptor = TlsAcceptor::from(Arc::new(load_config()?));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:443").await?;

    loop {
        let (stream, _) = listener.accept().await?;
        let acceptor = acceptor.clone();
        tokio::spawn(async move {
            match acceptor.accept(stream).await {
                Ok(tls_stream) => handle(tls_stream).await,
                Err(e) => eprintln!("TLS 握手失败: {e}"),
            }
        });
    }
}
```

**mTLS（双向认证）**：

```rust
use rustls_pemfile::certs;

let client_roots = /* 加载允许的客户端 CA */;
let config = ServerConfig::builder()
    .with_client_cert_verifier(
        rustls::server::AllowAnyAuthenticatedClient::new(client_roots)
    )
    .with_single_cert(cert_chain, key)?;
```

## 5. axum 加 TLS

```rust
use axum_server::tls_rustls::RustlsConfig;

let config = RustlsConfig::from_pem_file(
    "certs/fullchain.pem",
    "certs/privkey.pem",
).await?;

axum_server::bind_rustls("0.0.0.0:443".parse()?, config)
    .serve(app.into_make_service())
    .await?;
```

> 常见生产部署：应用内跑 HTTP，由 Nginx/Caddy/云 LB 终止 TLS。内部服务间通信才在应用层做 TLS/mTLS。

## 6. 密码学后端选择

rustls 本身不实现加密原语，用以下之一：

| 后端 | 特点 |
|------|------|
| **ring** | 最常用，BoringSSL 衍生，性能与兼容性好 |
| **aws-lc-rs** | AWS 维护，支持 **FIPS**，逐渐成为推荐 |
| **rustls-rustcrypto** | 纯 Rust 实现，适合特殊平台 |

```toml
rustls = { version = "0.23", features = ["ring"] }       # 默认
rustls = { version = "0.23", features = ["aws_lc_rs"] }  # FIPS 场景
```

## 7. 通用密码学：RustCrypto

不是 TLS 而是通用算法时，用 RustCrypto 系列：

```toml
sha2 = "0.10"          # SHA-256/512
hmac = "0.12"          # HMAC
aes-gcm = "0.10"       # AES-GCM 认证加密
argon2 = "0.5"         # 密码哈希（推荐）
rsa = "0.9"            # RSA
ed25519-dalek = "2"    # Ed25519 签名
rand = "0.8"           # 随机数
```

### 7.1 密码哈希（存用户密码）

```rust
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{SaltString, rand_core::OsRng};

// 注册：哈希
let salt = SaltString::generate(&mut OsRng);
let hash = Argon2::default()
    .hash_password(password.as_bytes(), &salt)?
    .to_string();          // 存数据库

// 登录：验证
let parsed = PasswordHash::new(&stored_hash)?;
Argon2::default().verify_password(password.as_bytes(), &parsed)?;
```

> ⚠️ **永远不要用 SHA-256 存密码**——用 Argon2/bcrypt/scrypt 这类慢哈希。

### 7.2 对称加密

```rust
use aes_gcm::{Aes256Gcm, KeyInit, Nonce, aead::{Aead, OsRng as _}};
use aes_gcm::aead::rand_core::RngCore;

let key = Aes256Gcm::generate_key(&mut OsRng);   // 或从 KMS 取
let cipher = Aes256Gcm::new(&key);

let mut nonce_bytes = [0u8; 12];
OsRng.fill_bytes(&mut nonce_bytes);
let nonce = Nonce::from_slice(&nonce_bytes);

let ciphertext = cipher.encrypt(nonce, b"secret data".as_ref())?;
let plaintext  = cipher.decrypt(nonce, ciphertext.as_ref())?;
```

### 7.3 签名

```rust
use ed25519_dalek::{SigningKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;

let signing_key = SigningKey::generate(&mut OsRng);
let verifying_key = signing_key.verifying_key();

let sig: Signature = signing_key.sign(b"message");
assert!(verifying_key.verify(b"message", &sig).is_ok());
```

## 8. 常见坑

| 坑 | 解决 |
|----|------|
| `ClientConfig` 每次都建 | 用 `Arc` 复用（构建昂贵） |
| 证书链不完整 | fullchain.pem 需含中间证书 |
| 私钥格式错 | rustls 要 **PKCS#8**，`openssl pkcs8 -topk8` 转换 |
| 忘记证书续期 | 用 ACME（Let's Encrypt）自动续期 |
| 用 SHA 存密码 | 换 Argon2 |
| 自己实现加密 | ❌ 用成熟库，别自造 |

## 9. 一句话总结

> rustls 是 Rust 生态 TLS 标准：纯 Rust 无 C 依赖，`ClientConfig`/`ServerConfig` 用 `Arc` 复用，配合 `tokio-rustls` 拿到异步 stream，rustls **不做 I/O**；通用密码学用 RustCrypto（argon2 存密码、aes-gcm 加密、ed25519 签名）。
