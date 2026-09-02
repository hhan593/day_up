# 20. Go 内存模型与 GC 深入

> 来源可信度：**官方文档确认**（基于 Go Memory Model、Go GC 官方文档）
> 关联：`06-concurrency.md`、`15-performance-benchmark-race.md`

## 1. Go 内存模型（Happens-Before）

Go Memory Model 定义了**何时一个 goroutine 的写对其他 goroutine 的读可见**。核心规则：

- **goroutine 内**：按程序顺序 happens-before。
- **goroutine 创建**：`go` 语句 happens-before 新 goroutine 执行。
- **channel**：send happens-before 对应 receive 完成；close happens-before receive 返回零值。
- **Mutex**：`Unlock` happens-before 后续 `Lock` 成功。
- **Once**：`Do(f)` 中 f 返回 happens-before 任何 `Do` 返回。

> 没有同步原语，就没有 happens-before，读到的可能是旧值/乱序值——这就是 data race 根源。

## 2. 逃逸分析（Escape Analysis）

```go
func foo() *int {
    x := 42      // x 逃逸到堆（返回其指针）
    return &x
}
```

- 编译器决定变量在**栈**还是**堆**。返回局部变量指针、闭包捕获、过大对象 → 逃逸到堆。
- 查看：`go build -gcflags="-m"`。
- 优化：减少不必要的指针返回，小对象尽量栈上分配。

## 3. GC 机制（三色标记 + 并发）

- Go 用**并发三色标记清除**（concurrent tricolor mark-and-sweep），与用户代码并发运行。
- 触发：堆大小达阈值（由 `GOGC` 控制，默认 100，即堆涨 100% 触发）。
- STW（停顿）极短：仅做 root 扫描与标记终止，**通常 < 1ms**（Go 1.20+ 亚毫秒级）。
- `GOGC=off` 关闭 GC（仅特殊场景）；`GOMEMLIMIT` 设软内存上限（Go 1.19+）。

```bash
GOGC=200 ./app      # 堆翻倍才 GC，降 GC 频率换内存
GOMEMLIMIT=4GiB ./app
```

## 4. pprof 剖析

```go
import _ "net/http/pprof"
// 在 http server 上自动注册 /debug/pprof/

go tool pprof http://localhost:6060/debug/pprof/heap   # 内存
go tool pprof http://localhost:6060/debug/pprof/profile # CPU 30s
go tool pprof http://localhost:6060/debug/pprof/goroutine
```

- `top` / `svg` / `web` 看热点；结合 `15-performance-benchmark-race.md` 的 `go test -bench -race`。

## 5. 常见内存陷阱

| 陷阱 | 现象 | 解决 |
|------|------|------|
| goroutine 泄漏 | 数量只增不减 | 用 `context` 取消 + `select` 退出的 channel |
| 大 slice 持小对象 | 整底层数组不释放 | `copy` 到新 slice 截断引用 |
| 频繁小分配 | GC 压力大 | `sync.Pool` 复用 |
| 字符串/[]byte 转换 | 复制 | 用 `unsafe`/`bytes` 避免（谨慎） |

## 6. sync.Pool 复用

```go
var bufPool = sync.Pool{New: func() interface{} { return new(bytes.Buffer) }}
b := bufPool.Get().(*bytes.Buffer)
b.Reset()
// ... use b ...
bufPool.Put(b)
```

- 减轻 GC 压力，适合临时大对象（buffer、json encoder）。
- 注意：Pool 中对象可能随时被清，不能存需持久的状态。

## 7. 一句话总结

> Go 内存模型靠 channel/Mutex/Once 建立 happens-before；逃逸分析决定栈/堆；GC 三色标记并发、亚毫秒 STW、`GOGC`/`GOMEMLIMIT` 调频；pprof + sync.Pool 优化热点与分配。
