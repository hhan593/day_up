# 08 - Buffer 与 crypto（二进制与加密）

> 来源：Node.js 官方 `buffer` 与 `crypto` 模块文档（v26.8.1）
> 官方：https://nodejs.org/api/buffer.html 、https://nodejs.org/api/crypto.html
> 模块稳定性：2 - Stable

Node 处理二进制（文件、网络字节）用 `Buffer`，安全相关用 `crypto`。

---

## 一、Buffer（二进制数据）

- `Buffer` 是固定长度字节序列，继承自 `Uint8Array`。
- v26 起建议显式 `import { Buffer } from 'node:buffer'`（虽仍全局可用）。

### 创建（用静态方法，别用旧 `new Buffer`）
```js
import { Buffer } from 'node:buffer';

Buffer.alloc(10);                    // 零填充，安全
Buffer.alloc(10, 1);                 // 全填 1
Buffer.allocUnsafe(10);              // 未初始化（可能含旧数据，快）
Buffer.from('hello', 'utf8');        // 从字符串
Buffer.from([1, 2, 3]);              // 从数组
Buffer.concat([b1, b2]);             // 拼接
```

- `allocUnsafe` 不初始化内存，可能泄露旧数据，**务必手动 fill 或使用 `alloc`**。

### 编码
```js
const b = Buffer.from('hello world', 'utf8');
b.toString('hex');       // 68656c6c6f...（十六进制）
b.toString('base64');    // aGVsbG8...（base64）
```

- 支持：`utf8`（默认）、`utf16le`、`latin1`、`base64`/`base64url`、`hex`。
- 与 TypedArray：`Buffer` 是 `Uint8Array` 子类，共享内存视图用 `subarray()`。

### Blob / File
- `Blob`（v15.7+）：不可变数据，跨线程安全共享，`blob.arrayBuffer()` / `blob.text()`。

---

## 二、crypto（加密哈希）

```js
import { createHash, createHmac, randomBytes, pbkdf2, scrypt, timingSafeEqual } from 'node:crypto';
```

### 1. 哈希（Hash）
```js
const hash = createHash('sha256');
hash.update('some data');
console.log(hash.digest('hex'));     // 十六进制摘要
// 也可作流：pipe 到 hash
```
- 支持 `sha256` / `sha512` / `md5`（md5 不安全，仅校验用）。

### 2. HMAC（带密钥哈希）
```js
const hmac = createHmac('sha256', 'secret');
hmac.update('data');
console.log(hmac.digest('hex'));
```

### 3. 随机字节
```js
const buf = randomBytes(16);   // 密码学安全随机
console.log(buf.toString('hex'));
```

### 4. 密码派生（scrypt / pbkdf2）
```js
// 推荐 scrypt 做密码哈希
const key = scryptSync('password123', 'salt', 64);  // 存 key + salt

// pbkdf2
pbkdf2('password', 'salt', 100000, 64, 'sha512', (err, key) => { /* ... */ });
```

### 5. 对称加密（AES）
```js
import { scrypt, randomFill, createCipheriv } from 'node:crypto';

scrypt('password', 'salt', 24, (err, key) => {
  randomFill(new Uint8Array(16), (err, iv) => {
    const cipher = createCipheriv('aes-192-cbc', key, iv);
    let enc = cipher.update('plain text', 'utf8', 'hex');
    enc += cipher.final('hex');
    console.log('密文:', enc);
  });
});
```

### 6. 定时安全比较
```js
const a = createHmac('sha256', 's').update('x').digest();
const b = createHmac('sha256', 's').update('x').digest();
if (timingSafeEqual(a, b)) { /* 防时序攻击 */ }
```

---

## 三、与系列其他文档的关系

- Buffer 是流/网络数据载体（06、07 篇）。
- 加密用于 JWT 签名（java/22 的 JWT 用对称签名，原理相同）。
- 对比前端 Web Crypto API：浏览器 `crypto.subtle` 与 Node `crypto` 接口不同但功能一致。
- 对比 Java（java/22）：Java 用 `MessageDigest`/`Cipher`，Node 用 `createHash`/`createCipheriv`，概念对应。
- 生产密码哈希：Node 社区常用 `bcrypt`/`argon2`（基于 scrypt 思想）。
