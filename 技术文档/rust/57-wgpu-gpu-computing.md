# 57. wgpu：跨平台 GPU 图形与通用计算

> 来源可信度：**完整正文级**（基于 docs.rs `wgpu 30.0.1`，2026-08 文档；**MSRV 1.87**）
> 适用：跨平台图形渲染、GPU 通用计算（GPGPU）、机器学习推理、浏览器 WebGPU。
> 关联：`34-bevy-game.md`（Bevy 底层即 wgpu）、Three.js `15-WebGPU与TSL.md`

## 1. wgpu 是什么

官方定义（docs.rs 原文）：

> wgpu is a **cross-platform, safe, pure-Rust graphics API**. It runs natively on Vulkan, Metal, D3D12, and OpenGL; and on top of WebGL2 and WebGPU on wasm.
>
> The API is based on the **WebGPU standard**, but is a fully native Rust library. It serves as the core of the WebGPU integration in **Firefox, Servo, and Deno**.

关键信息：

- 纯 Rust、**安全**（无 unsafe 可写出 GPU 程序）。
- 一套代码跑 Vulkan / Metal / D3D12 / OpenGL / WebGL2 / WebGPU。
- **MSRV 1.87**（注意版本要求较新）。
- API 是**引用计数**的：所有 handle 可 clone，依赖资源自动保活。
- 坐标系采用 **D3D / Metal** 约定：**深度范围 `[0, 1]`**（与 OpenGL 的 `[-1,1]` 不同！）。

```toml
wgpu = "30"
winit = "0.30"          # 窗口（可选）
bytemuck = "1"          # 零拷贝字节转换
pollster = "0.4"        # 简单 block_on
```

## 2. 后端 feature（官方清单）

| feature | 说明 | 默认 |
|---------|------|------|
| `vulkan` | Vulkan（Win/Linux/Android） | ✅ |
| `metal` | Metal（macOS/iOS） | ✅ |
| `dx12` | DX12（Windows） | ✅ |
| `gles` | OpenGL/GLES | ✅ |
| `webgpu` | WebGPU（wasm） | ✅ |
| `webgl` | GLES on wasm（条件后端） | ❌ |
| `angle` | macOS 上 ANGLE | ❌ |
| `vulkan-portability` | macOS 上 MoltenVK | ❌ |
| `spirv` / `glsl` | 接受 SPIR-V / GLSL 着色器 | ❌ |
| `wgsl` | 接受 WGSL 着色器 | ✅ |

## 3. 着色器语言支持（官方原文要点）

wgpu 可消费 **WGSL、SPIR-V、GLSL**，内部用 naga 转换到后端所需格式。

> While WebGPU does not support any shading language other than WGSL, we will **automatically convert your non-WGSL shaders** if you're running on WebGPU.

- `wgsl`（默认启用）—— **推荐**
- `spirv`、`glsl`、`naga-ir` 需显式启用

```rust
// 编译期加载 WGSL
let shader = device.create_shader_module(wgpu::include_wgsl!("shader.wgsl"));
```

## 4. 核心对象模型

```
Instance          GPU 系统入口
  └─ Adapter      物理 GPU 适配器
       └─ Device  逻辑设备（创建所有资源）
            ├─ Queue       命令队列
            ├─ Buffer      GPU 缓冲（顶点/索引/uniform/storage）
            ├─ Texture     纹理
            ├─ ShaderModule 着色器
            ├─ BindGroupLayout / BindGroup   资源绑定
            ├─ PipelineLayout
            ├─ RenderPipeline    图形管线
            └─ ComputePipeline   计算管线
  └─ Surface      呈现表面（窗口/画布）
```

**官方原文**：*"The main entry point to the API is the `Instance` type, from which you can create `Adapter`, `Device`, and `Surface`."*

## 5. 初始化（无窗口，纯计算）

```rust
use wgpu::*;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // ① Instance
    let instance = Instance::new(&InstanceDescriptor {
        backends: Backends::all(),
        ..Default::default()
    });

    // ② Adapter（选一个 GPU）
    let adapter = instance
        .request_adapter(&RequestAdapterOptions {
            power_preference: PowerPreference::HighPerformance,
            compatible_surface: None,     // 无窗口
            force_fallback_adapter: false,
        })
        .await
        .ok_or("no adapter")?;

    println!("GPU: {:?}", adapter.get_info().name);

    // ③ Device + Queue
    let (device, queue) = adapter
        .request_device(&DeviceDescriptor {
            label: None,
            required_features: Features::empty(),
            required_limits: Limits::default(),
            memory_hints: MemoryHints::Performance,
        })
        .await?;

    Ok(())
}
```

## 6. 完整例子：GPU 并行计算（向量加法）

这是 GPGPU 的 "Hello World"——用 compute shader 在 GPU 上并行加两个数组。

### 6.1 WGSL 计算着色器

```wgsl
// shader.wgsl
@group(0) @binding(0)
var<storage, read> a: array<f32>;

@group(0) @binding(1)
var<storage, read> b: array<f32>;

@group(0) @binding(2)
var<storage, read_write> result: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let index = global_id.x;
    // 防越界（数组长度可能不是 64 整数倍）
    if index >= arrayLength(&result) {
        return;
    }
    result[index] = a[index] + b[index];
}
```

**WGSL 要点**：

- `@compute` + `@workgroup_size(64)` 声明计算入口与工作组大小。
- `@builtin(global_invocation_id)` 是全局线程 ID。
- `var<storage, read>` / `read_write` 声明存储缓冲访问模式。
- `arrayLength(&result)` 取运行时数组长度。

### 6.2 Rust 宿主代码

```rust
use wgpu::*;
use bytemuck::{Pod, Zeroable};

const SIZE: usize = 1 << 20;      // 100 万元素
const WORKGROUP: u32 = 64;

async fn run() -> Result<(), Box<dyn std::error::Error>> {
    let instance = Instance::new(&InstanceDescriptor::default());
    let adapter = instance.request_adapter(&RequestAdapterOptions::default())
        .await.ok_or("no adapter")?;
    let (device, queue) = adapter.request_device(
        &DeviceDescriptor::default()
    ).await?;

    // ---- 准备数据 ----
    let a: Vec<f32> = (0..SIZE).map(|i| i as f32).collect();
    let b: Vec<f32> = (0..SIZE).map(|i| (i * 2) as f32).collect();

    // ---- 创建 GPU 缓冲 ----
    let make_buffer = |data: &[f32], usage_extra: BufferUsages| -> Buffer {
        device.create_buffer_init(&util::BufferInitDescriptor {
            label: None,
            contents: bytemuck::cast_slice(data),      // &[f32] → &[u8]
            usage: usage_extra,
        })
    };

    let buf_a = make_buffer(&a, BufferUsages::STORAGE);
    let buf_b = make_buffer(&b, BufferUsages::STORAGE);
    // 结果缓冲需要能读回 CPU
    let buf_result = device.create_buffer(&BufferDescriptor {
        label: Some("result"),
        size: (SIZE * std::mem::size_of::<f32>()) as u64,
        usage: BufferUsages::STORAGE | BufferUsages::COPY_SRC,
        mapped_at_creation: false,
    });
    // 读回中转缓冲（MAP_READ 只能与 COPY_DST 搭配）
    let buf_staging = device.create_buffer(&BufferDescriptor {
        label: Some("staging"),
        size: (SIZE * std::mem::size_of::<f32>()) as u64,
        usage: BufferUsages::MAP_READ | BufferUsages::COPY_DST,
        mapped_at_creation: false,
    });

    // ---- 着色器 ----
    let shader = device.create_shader_module(include_wgsl!("shader.wgsl"));

    // ---- 绑定组布局 ----
    let bind_group_layout = device.create_bind_group_layout(&BindGroupLayoutDescriptor {
        label: None,
        entries: &[
            BindGroupLayoutEntry {
                binding: 0,
                visibility: ShaderStages::COMPUTE,
                ty: BindingType::Buffer {
                    ty: BufferBindingType::Storage { read_only: true },
                    has_dynamic_offset: false, min_binding_size: None,
                },
                count: None,
            },
            BindGroupLayoutEntry {
                binding: 1,
                visibility: ShaderStages::COMPUTE,
                ty: BindingType::Buffer {
                    ty: BufferBindingType::Storage { read_only: true },
                    has_dynamic_offset: false, min_binding_size: None,
                },
                count: None,
            },
            BindGroupLayoutEntry {
                binding: 2,
                visibility: ShaderStages::COMPUTE,
                ty: BindingType::Buffer {
                    ty: BufferBindingType::Storage { read_only: false },
                    has_dynamic_offset: false, min_binding_size: None,
                },
                count: None,
            },
        ],
    });

    let bind_group = device.create_bind_group(&BindGroupDescriptor {
        label: None,
        layout: &bind_group_layout,
        entries: &[
            BindGroupEntry { binding: 0, resource: buf_a.as_entire_binding() },
            BindGroupEntry { binding: 1, resource: buf_b.as_entire_binding() },
            BindGroupEntry { binding: 2, resource: buf_result.as_entire_binding() },
        ],
    });

    // ---- 计算管线 ----
    let pipeline_layout = device.create_pipeline_layout(&PipelineLayoutDescriptor {
        label: None,
        bind_group_layouts: &[&bind_group_layout],
        immediate_size: 0,
    });

    let pipeline = device.create_compute_pipeline(&ComputePipelineDescriptor {
        label: Some("vector add"),
        layout: Some(&pipeline_layout),
        module: &shader,
        entry_point: Some("main"),
        compilation_options: Default::default(),
        cache: None,
    });

    // ---- 编码并提交命令 ----
    let mut encoder = device.create_command_encoder(&CommandEncoderDescriptor::default());
    {
        let mut pass = encoder.begin_compute_pass(&ComputePassDescriptor::default());
        pass.set_pipeline(&pipeline);
        pass.set_bind_group(0, &bind_group, &[]);
        // 分派工作组数 = ceil(SIZE / 64)
        let workgroups = (SIZE as u32 + WORKGROUP - 1) / WORKGROUP;
        pass.dispatch_workgroups(workgroups, 1, 1);
    }
    // 把结果拷到可读缓冲
    encoder.copy_buffer_to_buffer(&buf_result, 0, &buf_staging, 0, buf_staging.size());
    queue.submit(Some(encoder.finish()));

    // ---- 读回结果 ----
    let slice = buf_staging.slice(..);
    let (tx, rx) = futures_intrusive::channel::shared::oneshot_channel();
    slice.map_async(MapMode::Read, move |result| { tx.send(result).unwrap(); });
    device.poll(PollType::Wait).unwrap();       // 等待完成
    rx.receive().await.unwrap().unwrap();

    let data = slice.get_mapped_range();
    let result: &[f32] = bytemuck::cast_slice(&data);
    println!("result[0]   = {} (期望 0)",   result[0]);
    println!("result[100] = {} (期望 300)", result[100]);
    println!("result[999] = {} (期望 2997)", result[999]);

    Ok(())
}
```

## 7. 渲染管线（图形）

```rust
// ---- 顶点缓冲布局 ----
let vertex_layout = VertexBufferLayout {
    array_stride: (std::mem::size_of::<f32>() * 5) as u64,   // pos(3) + uv(2)
    step_mode: VertexStepMode::Vertex,
    attributes: &vertex_attr_array![0 => Float32x3, 1 => Float32x2],
};

// ---- 渲染管线 ----
let pipeline = device.create_render_pipeline(&RenderPipelineDescriptor {
    label: None,
    layout: Some(&pipeline_layout),
    vertex: VertexState {
        module: &shader,
        entry_point: Some("vs_main"),
        compilation_options: Default::default(),
        buffers: &[vertex_layout],
    },
    fragment: Some(FragmentState {
        module: &shader,
        entry_point: Some("fs_main"),
        compilation_options: Default::default(),
        targets: &[Some(ColorTargetState {
            format: surface_format,                       // ★ 必须匹配 surface
            blend: Some(BlendState::ALPHA_BLENDING),
            write_mask: ColorWrites::ALL,
        })],
    }),
    primitive: PrimitiveState {
        topology: PrimitiveTopology::TriangleList,
        cull_mode: Some(Face::Back),
        front_face: FrontFace::Ccw,
        ..Default::default()
    },
    depth_stencil: Some(DepthStencilState {
        format: TextureFormat::Depth32Float,
        depth_write_enabled: true,
        depth_compare: CompareFunction::Less,
        stencil: Default::default(),
        bias: Default::default(),
    }),
    multisample: MultisampleState {
        count: 4,                                          // 4x MSAA
        ..Default::default()
    },
    multiview_mask: None,
    cache: None,
});

// ---- 渲染循环 ----
let mut encoder = device.create_command_encoder(&Default::default());
{
    let mut pass = encoder.begin_render_pass(&RenderPassDescriptor {
        label: None,
        color_attachments: &[Some(RenderPassColorAttachment {
            view: &view,
            depth_slice: None,
            resolve_target: None,               // MSAA resolve target
            ops: Operations {
                load: LoadOp::Clear(Color::BLACK),
                store: StoreOp::Store,
            },
        })],
        depth_stencil_attachment: Some(RenderPassDepthStencilAttachment {
            view: &depth_view,
            depth_ops: Some(Operations {
                load: LoadOp::Clear(1.0),       // ★ 深度清除值是 1.0
                store: StoreOp::Store,
            }),
            stencil_ops: None,
        }),
        timestamp_writes: None,
        occlusion_query_set: None,
    });

    pass.set_pipeline(&pipeline);
    pass.set_bind_group(0, &bind_group, &[]);
    pass.set_vertex_buffer(0, vertex_buffer.slice(..));
    pass.set_index_buffer(index_buffer.slice(..), IndexFormat::Uint16);
    pass.draw_indexed(0..index_count, 0, 0..1);
}
queue.submit(Some(encoder.finish()));
```

> ⚠️ **深度范围 `[0,1]`**（D3D/Metal 约定）：清除深度用 `1.0`，比较用 `CompareFunction::Less`。这与 OpenGL 的 `[-1,1]` 不同，是常见移植坑。

## 8. Surface 与颜色空间（官方要点）

官方详细说明了 HDR / 广色域输出的规则，核心结论：

> **wgpu applies the transfer function for you only when you render to an `*Srgb` texture view format.** For every other color space, the values your shader writes must **already be encoded by you**.

| 颜色空间 | 典型格式 | 你的 shader 应输出 | wgpu 是否自动编码 |
|---------|---------|------------------|------------------|
| `Srgb`（`*Srgb` 格式） | `Rgba8UnormSrgb` | **线性** | ✅ 硬件自动 |
| `Srgb`（非 srgb 格式） | `Rgba8Unorm` | sRGB 编码 | ❌ 自己编码 |
| `ExtendedSrgbLinear` | `Rgba16Float` | 线性（1.0 = SDR 白） | ❌（无需编码） |
| `Bt2100Pq`（HDR10） | `Rgb10a2Unorm` | PQ 编码 + BT.2020 色域 | ❌ 自己编码 |

**实用流程**（官方 "practical path" 精简）：

1. `Surface::get_capabilities()` 查能力（HDR 看 `format_capabilities`，不是 `formats`）。
2. 可选：`Surface::display_hdr_info()` 查显示器亮度信息（**均为建议值**，`None` 表示"无法判断"）。
3. 选格式与颜色空间（保留 SDR 兜底）。
4. 配 `SurfaceConfiguration { format, color_space }`（`Auto` 默认，**永不选 HDR**）。
5. shader 按要求编码输出。
6. 正常 present；OS HDR 开关变化需重新查询。

> **wgpu 不做 tone mapping / gamut mapping**——这是应用的职责。

## 9. 实验性特性

官方标注 🧪EXPERIMENTAL（API 可能变更，误用可能 UB）：

- **Ray Tracing**（`Blas` / `Tlas` 加速结构）
- **Mesh Shading**（`MeshPipelineDescriptor` / `TaskState`）

## 10. 调试技巧

```rust
// ① 打开校验与追踪
let instance = Instance::new(&InstanceDescriptor {
    flags: InstanceFlags::DEBUG | InstanceFlags::VALIDATION,
    ..Default::default()
});

// ② 给所有对象加 label（错误信息会显示）
device.create_buffer(&BufferDescriptor { label: Some("vertex buf"), /* ... */ });

// ③ 捕获未捕获错误
device.on_uncaptured_error(Box::new(|e| eprintln!("wgpu error: {e:?}")));

// ④ 错误作用域（精确定位）
device.push_error_scope(ErrorFilter::Validation);
// ... 一些 wgpu 调用 ...
let error = device.pop_error_scope().await;

// ⑤ 录制 trace 用于复现/回放（需 feature `trace`）
```

## 11. 常见坑

| 坑 | 解决 |
|----|------|
| 深度测试反了 | 深度范围 `[0,1]`，清除值 `1.0` |
| 画面全黑/颜色不对 | shader 输出编码与 surface 颜色空间不匹配（见第 8 节） |
| `MAP_READ` 与其他 usage 冲突 | `MAP_READ` 只能配 `COPY_DST`，需经 staging 缓冲中转 |
| dispatch 数量不对 | `workgroups = ceil(N / workgroup_size)`，shader 内要防越界 |
| buffer size 未对齐 | 注意 `COPY_BUFFER_ALIGNMENT`（4）与 `COPY_BYTES_PER_ROW_ALIGNMENT`（256） |
| MSRV 报错 | wgpu 30 要求 **rustc ≥ 1.87** |
| 编译慢 | 关闭不用的后端 feature |

## 12. 一句话总结

> wgpu 30 是**纯 Rust、安全、跨平台**（Vulkan/Metal/DX12/GL/WebGL2/WebGPU）的 WebGPU 实现：入口 `Instance` → `Adapter` → `Device`+`Queue`；计算用 `ComputePipeline` + `dispatch_workgroups`，渲染用 `RenderPipeline` + `RenderPass`；着色器用 **WGSL**（可自动转换其他语言）；**深度 `[0,1]`**、颜色编码除 `*Srgb` 外需自己处理；MSRV 1.87，调试用 label + `on_uncaptured_error` + error scope。
