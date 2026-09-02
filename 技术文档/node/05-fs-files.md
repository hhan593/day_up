# 05 - 文件系统（fs 模块）

> 来源：Node.js 官方 `fs` 模块文档（v26.8.1）
> 官方：https://nodejs.org/api/fs.html
> 模块稳定性：2 - Stable

`fs` 模块提供文件与目录操作，支持**同步 / 回调 / Promise** 三种形式。

---

## 一、引入方式

```js
import * as fs from 'node:fs';            // 回调 + 同步
import * as fsp from 'node:fs/promises';  // Promise API（推荐现代写法）
```

- `node:fs/promises`：Promise 形式，配合 `async/await`。
- 底层用线程池执行，非线程安全（并发改同一文件需串行）。

---

## 二、读取与写入（Promise）

```js
import { readFile, writeFile, unlink } from 'node:fs/promises';

// 读
const data = await readFile('a.txt', 'utf8');   // 返回 string（指定编码）
const buf = await readFile('a.bin');            // 返回 Buffer

// 写
await writeFile('b.txt', 'hello');              // 覆盖写
await writeFile('b.txt', 'more', { flag: 'a' }); // 'a' 追加

// 删
await unlink('b.txt');
```

- `readFile` 返回 `Buffer` 或 `string`（传编码）。
- **同步形式**会阻塞事件循环（仅脚本启动/初始化用）：`readFileSync`。

---

## 三、文件描述符与 FileHandle

```js
import { open } from 'node:fs/promises';

const fh = await open('a.txt', 'r');   // FileHandle（EventEmitter）
const buf = Buffer.alloc(100);
await fh.read(buf, 0, 100, 0);          // 读 100 字节
await fh.close();                       // 必须显式关闭
```

- 不显式 `close` 会触发进程警告，**务必关闭**。
- `FileHandle` 是数值 fd 的包装，有 `'close'` 事件。

---

## 四、流式读写（大文件必用，见 06）

```js
import { createReadStream, createWriteStream } from 'node:fs';

createReadStream('big.iso').pipe(createWriteStream('copy.iso'));
```

- `highWaterMark` 默认 64KB；大文件绝不用 `readFile` 一次性读入内存。

---

## 五、目录与状态

```js
import { mkdir, rm, readdir, stat, rename, cp } from 'node:fs/promises';

await mkdir('logs', { recursive: true });   // 递归建目录
await cp('src', 'dist', { recursive: true });
const info = await stat('a.txt');           // 文件信息
console.log(info.size, info.isFile(), info.isDirectory());
await rename('a.txt', 'b.txt');
await rm('old', { recursive: true, force: true });
await readdir('logs');                      // 列出目录
```

- `stat` 返回 `size`/`mtime`/`isFile`/`isDirectory` 等。
- `fs.constants`：`F_OK`/`R_OK`/`W_OK`/`X_OK` 权限常量。

---

## 六、监视文件变化

```js
import { watch } from 'node:fs/promises';

const ac = new AbortController();
setTimeout(() => ac.abort(), 10000);
for await (const event of watch(__filename, { signal: ac.signal })) {
  console.log(event);   // { eventType, filename }
}
```

- 回调版 `fs.watch` 返回 `FSWatcher`（EventEmitter，有 `'change'` 事件）。
- 注意：基于 inode，文件替换可能失效；`recursive` 非所有平台支持。

---

## 七、与系列其他文档的关系

- 流是 fs 大文件处理基础 → `06-streams.md`
- 同步 API 阻塞事件循环 → `02-event-loop-async.md`
- 对比 Java JDBC/IO（java/18）：Node fs 异步非阻塞，Java 用 InputStream/OutputStream 同步或 NIO
- 对比前端：浏览器 `fetch` + Blob 是受限版 fs；Node fs 是完整文件系统访问
