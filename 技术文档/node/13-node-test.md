# 13 · Node.js 内置测试（node:test）

> 官方来源：Node.js v26.8.1 Test Runner（https://nodejs.org/api/test.html，OpenJS Foundation）
> 稳定性：Test Runner 自 v20.0.0 为 Stable(2)；Watch Mode 实验性、Test Tags 早期(v26.2.0)
> 本文**完整抓取官方正文**（v26.8.1），逐节整理。

Node.js 自带 `node:test` 测试运行器，无需 Jest/Mocha 即可写单元测试，适合服务端/工具库。

## 一、基本写法

```js
import test from 'node:test';
import assert from 'node:assert';

test('加法正确', () => {
  assert.strictEqual(1 + 1, 2);
});

import { describe, it } from 'node:test';
describe('数组', () => {
  it('map 返回新数组', () => {
    assert.deepStrictEqual([1, 2].map(x => x * 2), [2, 4]);
  });
});
```

- `describe` = `suite` 别名；`it` = `test` 别名（v19.8.0 起）。
- 同步抛错 / Promise reject / `done(err)` 首参为真 → 失败。
- 任一失败退出码为 `1`。

## 二、子测试与上下文

```js
test('父', async (t) => {
  await t.test('子 1', () => assert.ok(true));
  t.test('子 2', { todo: true }, () => {}); // todo 不计失败
});
```

- `TestContext`（`t`）：`t.test()`、`t.skip()`、`t.todo()`、`t.plan(n)`、`t.assert`、快照。

## 三、钩子

| 钩子 | 说明 | 引入 |
|---|---|---|
| `before(fn)` | suite 前 | v18.8.0 |
| `after(fn)` | suite 后（失败也跑） | v18.8.0 |
| `beforeEach(fn)` | 每测试前 | v18.8.0 |
| `afterEach(fn)` | 每测试后（失败也跑） | v18.8.0 |

```js
describe('db', () => {
  before(async () => { await connect(); });
  after(async () => { await close(); });
  beforeEach(() => resetTable());
});
```

## 四、跳过 / TODO / only

- `test.skip([msg])` / `t.skip()`：不执行。
- `test.todo()`：执行但不计失败。
- `test.only()` + CLI `--test-only`：只跑标记测试。
- `expectFailure`（v25.5.0）：须抛错才通过（反向断言）。

## 五、过滤与标签

- `--test-name-pattern=<regex>` / `--test-skip-pattern`：按名正则过滤。
- Test Tags（v26.2.0，实验）：`test('x', { tags: ['db','flaky'] }, ...)`，CLI `--experimental-test-tag-filter='not flaky'` 支持 `& | !`、`and/or/not`、通配 `*`。

## 六、Mocking

```js
import { mock } from 'node:test';

const fn = mock.fn((a) => a * 2);
fn(3);
console.log(fn.mock.callCount()); // 1

const obj = { greet() {} };
const m = mock.method(obj, 'greet', () => 'hi');
obj.greet();
console.log(m.mock.calls.length);
m.mock.restore();
```

- `mock.fn / mock.method / mock.property(v24.3) / mock.module(v22.3 实验)`。
- 定时器/日期模拟：`mock.timers.enable({ apis: ['setTimeout','Date'] })` + `tick()/runAll()`。

## 七、快照测试

```js
test('快照', (t) => {
  t.assert.snapshot({ a: 1 }); // --test-update-snapshots 生成 .snapshot
});
```

## 八、运行方式

```bash
node --test                         # 默认匹配 **/*.test.js 等
node --test --test-concurrency=4
node --test --watch                # 实验性
node --test --experimental-test-coverage
node --test --test-reporter=lcov --test-reporter-destination=out.lcov
```

- 默认每文件独立子进程（`isolation: 'process'`），并发受 `--test-concurrency` 控。
- 编程式：`import { run } from 'node:test'; run({ files: [...] }).compose(tap).pipe(stdout)`。

## 九、与 Java JUnit 对照

| node:test | JUnit 6（java/17） |
|---|---|
| `test()` / `it()` | `@Test` |
| `describe()` | 测试类 / `@Nested` |
| `before/after` | `@BeforeAll/@AfterAll` |
| `beforeEach/afterEach` | `@BeforeEach/@AfterEach` |
| `assert.strictEqual` | `assertEquals` |
| `mock.fn` | Mockito `mock()` |
| `node --test` | `mvn test` |

> 延伸：Express/Fastify 路由可配合 `supertest` 做集成测试；`技术文档/java/17-junit-testing.md`。
