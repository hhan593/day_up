# 24. WebGL 渲染管线与原生 API

> 来源可信度：**MDN 官方教程全文抓取**（Getting started with WebGL、WebGL best practices）+ three.js 官方 manual（webgl-compatibility-check）+ 源码核对
> 配套可运行示例：`threejs` 项目 `examples/24-pipeline/`（原生 WebGL 三角形 / 立方体 / Three.js 对照，共 3 个）
> 关联：`14-着色器GLSL与ShaderMaterial.md`、`25-图形状态机：深度、混合、剔除与MSAA.md`、`23-3D数学基础.md`

## 1. WebGL 是什么

- **WebGL = 浏览器里的 OpenGL ES**：把 canvas 绑定到 GPU 的底层绘图接口。WebGL 1.0 基于 OpenGL ES 2.0，WebGL 2.0 基于 OpenGL ES 3.0（当前所有现代浏览器均已支持 WebGL2，three.js r163+ 已放弃 WebGL1 支持）。
- **它不管理场景**：没有"场景、物体、光照"的概念，只有**缓冲区、着色器、状态、绘制调用**。三个三角形 = 三次顶点数据提交 + 一次 draw call。
- **Three.js 的本质**：帮你管理缓冲区（BufferGeometry）、生成着色器（各种 Material 的 GLSL 模板）、维护状态（深度/混合/剔除开关）和矩阵数学，最后仍是翻译成原生 WebGL 调用。

```
你的代码:        new THREE.Mesh(geometry, material); renderer.render()
                    │  three.js 翻译成 ↓
原生 WebGL:      bufferData(...) + useProgram(...) + drawElements(...)
                    │  GPU 执行 ↓
硬件:            顶点着色器 → 光栅化 → 片元着色器 → 帧缓冲(屏幕)
```

## 2. 渲染管线全景

一次 `drawElements` 之后 GPU 内部发生的事（理解这个，`14` 章的着色器就不再是黑盒）：

```
① 顶点着色器 Vertex Shader（逐顶点，可编程）
   输入 attribute（顶点数据）+ uniform（全局常量）
   输出 gl_Position（裁剪空间坐标）
        ↓
② 图元装配 Primitive Assembly（固定）
   按 draw 模式（POINTS/LINES/TRIANGLES）把顶点组装成图元
   裁剪 Clipping：裁掉视锥外部分
        ↓
③ 光栅化 Rasterization（固定）
   图元 → 覆盖的像素（候选片元）；对 attribute 做重心插值
   ▲ 这就是 varying 能"自动插值"的原因
        ↓
④ 片元着色器 Fragment Shader（逐像素，可编程）
   输入插值后的 varying + uniform
   输出颜色（写向帧缓冲）
        ↓
⑤ 输出合并 Output Merger（固定，可配置状态 → 见 25 章）
   深度测试 → 模板测试 → 混合(透明) → 写入帧缓冲
```

**性能直觉**：①④ 是可编程的（ GPU 核心跑你的代码），②③⑤ 是固定硬件；顶点数影响 ①，**像素数 × overdraw 影响 ④**——全屏 shader 为什么贵，答案在这里。

## 3. 原生 WebGL：画一个三角形

不用任何库，完整流程（WebGL2 + GLSL ES 3.00，示例 `examples/24-pipeline/01-webgl-triangle.html` 可直接运行）：

```js
const canvas = document.querySelector('#c');
const gl = canvas.getContext('webgl2');            // ① 取上下文（只能取一次，见 §8）

// ---- ② 着色器：GLSL 源码字符串 ----
const vsSource = `#version 300 es
in vec4 aPosition;                    // 顶点属性输入
void main() { gl_Position = aPosition; }`;

const fsSource = `#version 300 es
precision highp float;                // 片元必须声明浮点精度
out vec4 outColor;                    // WebGL2: 自己声明输出（不再有 gl_FragColor）
void main() { outColor = vec4(1.0, 0.5, 0.2, 1.0); }`;

// ---- ③ 编译链接（WebGL1/2 相同的样板代码）----
function createShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(sh));
  return sh;
}
function createProgram(gl, vsSrc, fsSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog));
  return prog;
}
const program = createProgram(gl, vsSource, fsSource);

// ---- ④ 顶点数据：缓冲区 ----
const vao = gl.createVertexArray();              // WebGL2 内建 VAO
gl.bindVertexArray(vao);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
   0.0,  0.6,      // 顶点 0
  -0.6, -0.6,      // 顶点 1
   0.6, -0.6,      // 顶点 2
]), gl.STATIC_DRAW);

const loc = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(loc);                 // 把缓冲接到 attribute
gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);  // 每顶点 2 个 float

// ---- ⑤ 绘制 ----
gl.viewport(0, 0, canvas.width, canvas.height);
gl.useProgram(program);
gl.drawArrays(gl.TRIANGLES, 0, 3);               // 3 个顶点 = 1 个三角形
```

### 原生 API ↔ Three.js 对照表

| 原生调用 | Three.js 里谁替你做了 |
|---------|---------------------|
| `getContext('webgl2')` | `new THREE.WebGLRenderer()` 内部创建 |
| 着色器字符串 + 编译链接 | 各 Material 内置 GLSL 模板，renderer 编译缓存（`ShaderMaterial` 则传你写的） |
| `createBuffer` + `bufferData` | `geometry.setAttribute('position', new THREE.BufferAttribute(...))`（见 `08`） |
| `getAttribLocation` + `vertexAttribPointer` | renderer 根据 geometry 的 attribute 布局自动接线 |
| uniform 上传 | `material.uniforms` + 内置矩阵（`modelViewMatrix` 等见 `23` §4） |
| `drawArrays / drawElements` | `renderer.render(scene, camera)` 遍历场景逐对象发出 |
| `setIndex` + `drawElements` | `geometry.setIndex([...])` |
| `viewport` | `renderer.setSize(w, h)` |
| `clearColor` + `clear` | `renderer.setClearColor()` / `scene.background` |
| `enable(DEPTH_TEST)` | 材质默认 `depthTest: true` |
| `blendFunc` / `enable(BLEND)` | 材质 `transparent: true` + `blending`（见 `25`） |

> 结论：**一行 `renderer.render()` = 上面全部步骤的编排**。理解原生流程是为了在出问题时能看懂 SPECTOR 截到的 draw call。

## 4. 从三角形到立方体

三件事把三角形变成"3D 立方体"（完整代码见 `examples/24-pipeline/02-webgl-cube.html`）：

### ① MVP 矩阵（数学见 `23` §4）

```glsl
// 顶点着色器改为接收 uniform 矩阵
in vec4 aPosition;
uniform mat4 uModelViewProjection;
void main() { gl_Position = uModelViewProjection * aPosition; }
```

```js
// JS 侧手写最小 mat4 库（列主序 Float32Array，与 three.js Matrix4 同约定）
function mat4Perspective(fovY, aspect, near, far) { /* ...示例文件含完整实现... */ }
function mat4Multiply(a, b) { /* ... */ }
const mvp = mat4Multiply(projection, mat4Multiply(view, model));
gl.uniformMatrix4fv(uMvpLoc, false, mvp);        // false = 不转置（列主序直传）
```

### ② 深度缓冲（否则面与面的遮挡关系随机）

```js
gl.enable(gl.DEPTH_TEST);                        // 开深度测试（见 25 章）
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // 每帧一起清
```

### ③ 索引绘制 + 绕序

```js
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
```

36 个索引（6 面 × 2 三角形 × 3 顶点）画 12 个三角形，**顶点只存 8 个**——索引复用顶点（`08` §4 的原理在原生层的形态）。注意面的绕序（逆时针=正面）要一致，配合剔除（`25` §5）可去掉被遮挡面的渲染。

## 5. GLSL ES 1.00 vs 3.00 语法对照

three.js 材质底层按 WebGL2 生成 `#version 300 es` 代码，但 `ShaderMaterial` 仍默认写 1.00 语法（three.js 自动转换）。手写原生 WebGL2 时必须用 3.00：

| GLSL 1.00（WebGL1） | GLSL 3.00（WebGL2，`#version 300 es`） |
|---|---|
| `attribute vec3 position;` | `in vec3 position;` |
| `varying vec2 vUv;`（两侧同写法） | 顶点 `out vec2 vUv;` / 片元 `in vec2 vUv;` |
| `gl_FragColor = vec4(...)` | `out vec4 outColor; outColor = ...`（变量名自定义） |
| `texture2D(tex, uv)` | `texture(tex, uv)` |
| `gl_FragData[i]`（MRT） | 多个 `layout(location=i) out vec4` |
| — | `gl_VertexID` / `gl_InstanceID`（内建顶点 ID，免 buffer 画全屏三角形） |
| — | `texelFetch(tex, ivec2(x,y), lod)`（按整数坐标取像素，免插值） |
| — | 整数类型 `int/uint/ivec*`、位运算 |
| `highp` 在片元可选（可能 float24） | `highp float` 保证 IEEE float32 |

**精度声明规则**：顶点着色器默认 `highp float`；**片元着色器必须显式声明**（惯例 `precision highp float;`）。

## 6. WebGL2 新能力速查（MDN best practices 核实）

| 能力 | API | 对 three.js 的意义 |
|------|-----|-------------------|
| VAO 顶点数组对象 | `createVertexArray / bindVertexArray` | 一次配置多次绘制；three.js 内部使用 |
| 实例化 Instancing | `drawArraysInstanced` + `vertexAttribDivisor` | `InstancedMesh` 的底层（`16`） |
| 纹理存储预分配 | `texStorage2D` + `texSubImage2D` | 避免 mip 链重复分配（省 33% 内存） |
| UBO 统一缓冲 | `uniformBlockBinding` + `bindBufferBase` | 一次上传、多 program 共享 |
| 多渲染目标 | 多 `out` 变量 | 后处理 G-Buffer（`13`） |
| 浮点渲染目标 | `EXT_color_buffer_float` 扩展 | HDR/泛光（`13` §Bloom）的前提 |
| 并行着色器编译 | `KHR_parallel_shader_compile` → `COMPLETION_STATUS_KHR` | 加载大场景不卡帧 |
| 同步查询 | `fenceSync / clientWaitSync` | 异步 `readPixels`（截图/拾取） |
| FBO 局部失效 | `invalidateFramebuffer` | 移动端 tiled GPU 省带宽 |

**MDN 官方 best practices 精选**（对 three.js 用户同样适用）：

- 生产环境避免每帧调用同步查询类 API（`getError`、`getParameter`、裸 `readPixels`）——可能触发 CPU-GPU 往返，单次可达 1ms+；
- 不要只查 `COMPILE_STATUS`：编译错误多数能延迟到 link 时暴露，统一查 `LINK_STATUS` 再取 info-log；
- **顶点属性 0 必须启用为数组**（`enableVertexAttribArray(0)`），否则 macOS 桌面端需昂贵模拟——three.js 已处理；
- 尽量输出 alpha = 1.0；避免 `getContext` 传 `alpha: false` 与 RGB 内部格式（浏览器常在 RGBA 上模拟，反而更慢）；
- 可见缩小的纹理要开 mipmap；假设最小限制：`MAX_TEXTURE_SIZE = 4096`、纹理单元 8、顶点属性槽 16。

## 7. WebGL 可用性检测（three.js 官方写法）

官方 manual（webgl-compatibility-check）推荐在渲染前检测：

```js
import WebGL from 'three/addons/capabilities/WebGL.js';

if (WebGL.isWebGL2Available()) {
  animate();
} else {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById('container').appendChild(warning);
}
```

该模块还提供 `isWebGLAvailable()`、`getErrorMessage()` 等，用于展示内置的降级提示面板。

## 8. 常见坑清单

| 现象 | 原因 | 解法 |
|------|------|------|
| `getContext` 返回 null | 上下文类型写错 / 多次取不同类型上下文 | 同一 canvas 只能取一种 context；用 `webgl2` 并判空（§7） |
| 画面黑屏但无报错 | shader 编译失败被吞掉 | §3 的 helper 已包含 status 检查；开发期保留 error throw |
| 画布模糊 | canvas 内部分辨率 ≠ CSS 尺寸 × devicePixelRatio | `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` |
| 截图 / `toDataURL` 全黑 | 默认绘制后缓冲被清空 | `preserveDrawingBuffer: true`，或截图前同步再 render 一帧 |
| 两层透明/深度乱 | 默认状态理解错 | 见 `25` 章状态机全表 |
| 着色器在低端机报精度错 | 片元没写精度声明，或用了隐式 highp | 显式 `precision highp float;`（移动端可降 mediump 换性能） |
| 每帧 `getParameter` 掉帧 | 同步查询强制 CPU-GPU 往返 | 缓存结果；回读用 `PIXEL_PACK_BUFFER` + `fenceSync` 异步化 |
| WebGL 上下文丢失（页面卡死/切后台） | GPU 驱动重置，canvas 尺寸超上限 | 监听 `webglcontextlost/restored` 事件；移动端画布 ≤ 4096 |

---

**延伸阅读**：MDN WebGL 教程系列（Getting started → shaders → 3D → lighting）；MDN《WebGL best practices》；Khronos WebGL 规范；`examples/24-pipeline/03-three-cube-compare.html` 可对照"原生约 200 行 vs three.js 不到 30 行"同一立方体的两种写法。
