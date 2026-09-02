# 17. Node.js 原生模块（N-API / Node-API）

> 来源可信度：**官方文档确认**（基于 Node.js N-API 官方文档）
> 关联：`08-buffer-crypto.md`、`09-process-worker-threads.md`

## 1. 为什么写原生模块

- 极致 CPU 性能（加解密、图像处理、压缩）。
- 调用 C/C++/Rust 存量库（见 Rust `21-unsafe-ffi.md`）。
- 访问系统底层能力。

## 2. N-API（Node-API）是什么

N-API 是**稳定 ABI** 的 C API，与 Node 版本、V8 版本解耦——编译一次，多版本 Node 可用。

```cpp
// addon.c
#include <node_api.h>

napi_value Add(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, NULL, NULL);

  double a, b;
  napi_get_value_double(env, args[0], &a);
  napi_get_value_double(env, args[1], &b);

  napi_value result;
  napi_create_double(env, a + b, &result);
  return result;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_value fn;
  napi_create_function(env, NULL, 0, Add, NULL, &fn);
  napi_set_named_property(env, exports, "add", fn);
  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
```

## 3. 用 node-addon-api（C++ 封装，更友好）

```cpp
#include <napi.h>
Napi::Value Add(const Napi::CallbackInfo& info) {
  double a = info[0].As<Napi::Number>().DoubleValue();
  double b = info[1].As<Napi::Number>().DoubleValue();
  return Napi::Number::New(info.Env(), a + b);
}
Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("add", Napi::Function::New(env, Add));
  return exports;
}
NODE_API_MODULE(addon, Init)
```

## 4. Rust 写原生模块（napi-rs / neon）

```rust
// napi-rs
#[napi]
pub fn add(a: f64, b: f64) -> f64 { a + b }
```

```bash
npx napi build --platform --release
```

- `napi-rs`：Rust 写、零成本绑定，前端工具链（如 swc、Rolldown）大量使用。
- 与 Rust 目录 `21-unsafe-ffi.md` 呼应：FFI 能力的 Node 侧应用。

## 5. 构建方式

- `node-gyp`：传统，需 Python + 编译工具链。
- `napi-rs` / `neon`：现代，交叉编译预编译二进制（prebuild）。
- 推荐预编译（prebuild）发布，免去用户现场编译。

## 6. 线程安全

- N-API 提供 `napi_create_threadsafe_function`，让原生线程回调 JS。
- 重计算放原生线程，避免阻塞事件循环（见 `02-event-loop-async.md`）。

## 7. 一句话总结

> N-API 提供稳定 ABI 的原生扩展接口；C 用 `node-addon-api`、Rust 用 `napi-rs`/`neon` 写，预编译发布。CPU 密集或复用 C/Rust 库时选原生模块，注意别阻塞事件循环。
