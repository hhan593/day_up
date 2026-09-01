# NestJS 加密与哈希（Encryption & Hashing）技术详解

> 来源：https://docs.nestjs.cn/security/encryption-hashing
> 作用：保护数据机密性（加密，可还原）与凭证安全（哈希，不可逆）。
> Nest 本身**不封装** crypto/bcrypt/argon2，直接用 Node 生态包，避免额外抽象。
> 最后更新：2026/8/9（文档日期）

---

## 一、加密 vs 哈希（先分清）

| | 加密 Encryption | 哈希 Hashing |
|---|---|---|
| 方向 | 双向（可解密还原） | 单向（不可逆） |
| 用途 | 需还原的敏感数据（如手机号、卡号） | 密码等无需还原的凭证 |
| 典型 | AES、RSA | bcrypt、argon2、sha256 |

**对比**：类似 **Java 的 `Cipher`（AES）/ `MessageDigest`（SHA）**、**PHP 的 `openssl_encrypt`/`password_hash`**。

---

## 二、加密（Node 内置 crypto，AES-256-CTR）

### 加密
```ts
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const iv = randomBytes(16); // 初始化向量
const key = (await promisify(scrypt)('Password used to generate key', 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const encryptedText = Buffer.concat([cipher.update('Nest'), cipher.final()]);
```

### 解密
```ts
import { createDecipheriv } from 'crypto';
const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
```
- 注意：`iv` 和 `salt` 需与密文一起存储/传输才能解密（通常拼接后 base64）。

---

## 三、哈希（推荐 bcrypt / argon2）

### bcrypt（文档示例）
```bash
npm i bcrypt && npm i -D @types/bcrypt
```
```ts
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;                  // 成本因子，越大越慢越安全
const hash = await bcrypt.hash('random_password', saltOrRounds);
const isMatch = await bcrypt.compare('random_password', hash); // boolean
// 也可手动 genSalt()
```

### argon2（文档仅推荐，补充示例）
```bash
npm i argon2
```
```ts
import * as argon2 from 'argon2';
const hash = await argon2.hash('password');           // 默认 argon2id，自带盐
const isMatch = await argon2.verify(hash, 'password');
```
- argon2 是 **Password Hashing Competition 冠军**，比 bcrypt 更现代；Nest 官方推荐（文档未给代码，此处为补充标准用法）。

**对比**：
- **bcrypt**：经典、广泛支持，自适应成本。
- **argon2**：内存硬哈希，抗 GPU/ASIC 暴力破解，推荐新项目。
- 类似 **PHP 的 `password_hash()`**（底层正是 bcrypt/argon2）、**Spring Security 的 `BCryptPasswordEncoder`/`Argon2PasswordEncoder`**。

---

## 四、在认证流程中的标准用法

结合 `authentication.md` 的登录：
```ts
// 注册：存储哈希
await usersService.create({ username, password: await bcrypt.hash(rawPwd, 10) });

// 登录：比对哈希（而非明文）
const ok = await bcrypt.compare(rawPwd, user.password);
if (!ok) throw new UnauthorizedException();
```

---

## 五、最佳实践

1. **密码永远只存哈希**，绝不存明文、绝不日志打印。
2. 用 **bcrypt 或 argon2**，别自己用 SHA256+Rice（易被彩虹表/暴力破解）。
3. 加密密钥走环境变量；`iv`/`salt` 随机生成并随数据保存。
4. 需要还原的敏感字段（如身份证）才用 AES 加密，数据库层也要控访问。

> 口诀：**"加密可逆存敏感，哈希不可逆存密码；bcrypt/argon2 二选一，明文日志都不要。"**
