# 06 - 流（Stream）与背压

> 来源：Node.js 官方 `stream` 模块文档（v26.8.1）
> 官方：https://nodejs.org/api/stream.html
> 模块稳定性：2 - Stable

流是 Node 处理流式数据的核心抽象，**所有流都是 EventEmitter 实例**，用于高效处理大文件、网络数据。

---

## 一、四种流类型

| 类型 | 说明 | 例子 |
|---|---|---|
| **Readable** 可读流 | 数据源 | `fs.createReadStream`、HTTP 请求、`process.stdin` |
| **Writable** 可写流 | 写入目标 | `fs.createWriteStream`、HTTP 响应、`process.stdout` |
| **Duplex** 双工流 | 可读可写 | `net.Socket`、zlib |
| **Transform** 转换流 | 写入时转换 | `zlib.createGzip()`、`crypto` 流 |

---

## 二、可读流两种模式

- **paused（暂停，默认）**：需显式 `read()` 取数据。
- **flowing（流动）**：自动发射 `'data'` 事件。
- 切换为 flowing：加 `'data'` 监听 / 调 `resume()` / `pipe()`。

```js
// flowing 模式
readable.on('data', chunk => console.log(chunk));
readable.on('end', () => console.log('done'));

// paused 模式
readable.on('readable', () => {
  let chunk;
  while ((chunk = readable.read()) !== null) { /* ... */ }
});
```

### 异步迭代（for await）
```js
for await (const chunk of fs.createReadStream('a.txt', { encoding: 'utf8' })) {
  console.log(chunk);
}
```

---

## 三、可写流

```js
const ws = fs.createWriteStream('out.txt');
ws.write('hello');
ws.end('done');                 // 结束写入

ws.on('finish', () => console.log('written'));
ws.on('drain', () => console.log('可以继续写'));   // 背压信号
```

- `write()` 返回 `false` 表示缓冲已满，应暂停直到 `'drain'`。
- `cork()` / `uncork()`：暂存批量刷新。

---

## 四、pipe 与 pipeline（背压自动处理）

```js
import { createReadStream, createWriteStream } from 'node:fs';

// 简单 pipe
createReadStream('big.iso').pipe(createWriteStream('copy.iso'));

// 链式 + 转换
import { createGzip } from 'node:zlib';
createReadStream('a.txt').pipe(createGzip()).pipe(createWriteStream('a.txt.gz'));

// 推荐：pipeline（自动清理错误）
import { pipeline } from 'node:stream/promises';
await pipeline(
  createReadStream('a.txt'),
  createGzip(),
  createWriteStream('a.txt.gz')
);
```

- `pipe()` 自动管理**背压**（慢消费者不会压垮内存）。
- `pipeline()` 比 `pipe()` 更安全：出错时正确销毁所有流，支持 Promise。

---

## 五、背压（Backpressure）原理

- 可读/可写流各有内部缓冲，容量由 `highWaterMark` 决定（默认 64KB）。
- 可读：`push()` 填满后停调 `_read()`。
- 可写：`write()` 返回 `false` 时，生产者应停手等 `'drain'`。

```js
function write(data, cb) {
  if (!stream.write(data)) stream.once('drain', cb);
  else process.nextTick(cb);
}
```

> 不尊重背压 → 内存暴涨、GC 恶化，甚至被远程利用（socket 不 drain）。

---

## 六、Transform 转换流

```js
import { Transform } from 'node:stream';

const upper = new Transform({
  transform(chunk, enc, cb) {
    cb(null, chunk.toString().toUpperCase());
  }
});
createReadStream('a.txt').pipe(upper).pipe(process.stdout);
```

---

## 七、与系列其他文档的关系

- 背压本质是事件循环下的流量控制（02 篇）。
- HTTP 请求/响应即流（07 篇）。
- 对比 Java IO（java/18）：Node 流是异步拉推模型；Java 用 InputStream/OutputStream 同步；
  `pipe` ≈ Java 的 IO 拷贝但非阻塞。
- 对比 React：流式 SSR（`nextjs` 的 `renderToPipeableStream`）底层即 Node 流。
