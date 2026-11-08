# 25. 图形状态机：深度、混合、剔除与颜色空间

> 来源可信度：**官方来源核对**（MDN《WebGL best practices》、three.js 官方 Color Management manual 全文抓取、`src/renderers/WebGLRenderer.js` 上下文默认值源码逐字核对 @r178）；GL 状态默认值依据 OpenGL ES/WebGL 规范（Khronos registry 有 Cloudflare 防护未能直接抓取，均为稳定规范事实）
> 配套可运行示例：`threejs` 项目 `examples/25-state/`（深度测试 / 混合模式 / 背面剔除，均可交互开关）
> 关联：`09-材质与纹理详解.md`（色彩空间实战）、`10-光照与阴影.md`（阴影中的深度原理）、`24-WebGL渲染管线与原生API.md`

## 1. WebGL 是一台"状态机"

WebGL 没有对象系统，只有**一组全局状态**：`enable/disable` 开关 + 参数值。状态在两次 draw 之间**持续存在**，绘制时按当前状态执行：

```
gl.enable(gl.DEPTH_TEST);   // 拨动开关（持续生效，直到 disable）
gl.depthFunc(gl.LEQUAL);    // 调整参数
gl.drawElements(...);       // 此刻按 开关+参数 执行
```

Three.js 的材质属性本质上就是**这组状态的封装**——每次 `render()` 前按材质切换状态。所以"透明为什么排序乱""背面为什么不见了"这类问题，答案都在原生状态里。

## 2. 深度测试 Depth Test

### 2.1 原理与默认值

每个像素有一个**深度缓冲（z-buffer）**，记录当前离相机最近的片元深度。新片元先与缓冲比较，通过才写入（深度 + 颜色一起写）。

| 状态 | 默认值 | 说明 |
|------|--------|------|
| `enable(DEPTH_TEST)` | **关** | 原生 WebGL 默认不测试（后画的盖前画的） |
| `depthFunc` | `gl.LESS` | 更近才通过；常改 `LEQUAL`（共面叠加如描边） |
| `clearDepth` | `1.0` | 每帧清空后的"最远"值（配合 `gl.clear(DEPTH_BUFFER_BIT)`） |
| `depthMask` | `true` | 深度可写；画透明粒子时常设 `false` 只比较不写入 |

three.js 对照：材质 `depthTest`（默认 true，替你开了 DEPTH_TEST）、`depthWrite`（默认 true）、`renderer.clearDepth()`。

### 2.2 深度精度与 Z-Fighting

透视投影下深度值**非线性分布**：near 平面附近占绝大部分精度，远处急剧变差（规范事实，与 23 章投影矩阵一致）。两个共面/近平面的几何体会因精度不足轮流胜出——**闪烁条纹即 Z-Fighting**。

```js
// 解法 ①：多边形偏移——把贴花/地板线的深度"推远"一点
new THREE.MeshStandardMaterial({
  polygonOffset: true,
  polygonOffsetFactor: 1,   // 对应 gl.polygonOffset(factor, units)
  polygonOffsetUnits: 1,
});

// 解法 ②：加大 near（深度缓冲精度大头在 near 附近）
// camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000)  ← near=1 别写 0.01

// 解法 ③：大规模场景开启对数深度缓冲（精度换均匀）
const renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true });
```

> 💡 新方向：反向深度（reversed-Z，近处存 1.0）在浮点深度下精度分布更优。three.js 新版已提供 `reversedDepthBuffer` 构造参数，WebGPURenderer 默认支持反向深度（`23` 章源码核实的 `makePerspective(..., reversedDepth)` 参数即为此服务）。

### 2.3 阴影的底层就是一次深度测试

Shadow Map（`10` 章）= 从光源视角渲染一张**只含深度的纹理**（FBO，见下文 Render Target），主渲染时把片元深度换算到光源空间与之比较。理解"深度也是数据"是理解阴影、软阴影、接触阴影的基础。

## 3. 模板测试 Stencil Test

模板缓冲是每像素一个整数（默认 8bit）的"画布遮罩"。深度测试前后可按模板值决定**丢弃哪些像素**。上下文默认**不含**模板缓冲——要用它必须创建时声明（three.js r178 源码核实默认 `stencil: false`）：

```js
const renderer = new THREE.WebGLRenderer({ stencil: true });  // 显式开启
```

```glsl
// 原生层核心 API
gl.enable(gl.STENCIL_TEST);                 // 默认关
gl.stencilFunc(gl.EQUAL, ref, mask);        // 比较函数：NEVER/ALWAYS/LESS/LEQUAL/EQUAL/GEQUAL/NOTEQUAL
gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE); // 通过后怎么写：KEEP/ZERO/REPLACE/INCR/DECR/INVERT
```

three.js 材质基类提供 `stencilWrite / stencilRef / stencilFunc / stencilFail / stencilZFail / stencilZPass` 等属性一一对应。

**典型应用**：平面镜/传送门（只在世界窗口矩形内渲染反射场景）、模型描边（放大背面壳 + 模板排除）、小地图遮罩、反色高亮。

## 4. 混合 Blending（透明的真相）

### 4.1 原理与默认值

片元颜色与帧缓冲已有颜色按公式混合。**原生默认关闭**（关闭 = 直接覆盖）；`blendFunc` 默认参数 `(GL_ZERO, GL_ONE)` 也等于"不变"——双重保险的 no-op。

```
最终色 = srcFactor × 片元色 + dstFactor × 缓冲色
```

| 常用组合 | 参数 | 效果 |
|---------|------|------|
| 标准 alpha 透明 | `(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)` | 常规半透明 |
| 预乘 alpha | `(ONE, ONE_MINUS_SRC_ALPHA)` | 边缘光晕更干净（canvas 默认 `premultipliedAlpha: true` 的原因） |
| 加法发光 | `(SRC_ALPHA, ONE)` | 火焰、光束、粒子叠加（越叠越亮） |
| 相乘（染色玻璃） | `(ZERO, SRC_COLOR)` | 与背景相乘变暗 |

three.js 对照：`material.transparent = true` 才会开启 BLEND；`blending: THREE.NormalBlending | AdditiveBlending | SubtractiveBlending | MultiplyBlending`；细粒度用 `blendSrc / blendDst / blendEquation`。

### 4.2 透明排序：混合不满足交换律

`A 混 B ≠ B 混 A`，所以透明必须**从远到近**画。GPU 不做排序，靠约定：

1. **不透明先画**（three.js 自动：先 opaque 队列，后 transparent 队列）；
2. **transparent 对象按相机距离排序**（three.js 自动，远→近）；
3. 排序解决不了（同一物体内部、粒子云穿插）时手动控制：

```js
// 粒子/烟/玻璃：只比较深度不写入深度，避免互相"打洞"
new THREE.PointsMaterial({ transparent: true, depthWrite: false });

// 手动定序：renderOrder 越大越后画
glass.renderOrder = 10;

// 完全不透明边缘的贴图（草、栅栏贴花）：放弃混合走 alphaTest，可正常写深度
new THREE.MeshStandardMaterial({ alphaTest: 0.5, transparent: false });
```

> **口诀**：透明的默认策略是 `transparent: true, depthWrite: false`；写深度 + 混合 = 最常见的排序 bug 来源。

## 5. 面剔除 Culling

GPU 通过**顶点绕序**判断正反面：屏幕上逆时针（CCW）= 正面。原生默认**不剔除**（两面都画）；默认约定 `frontFace(CCW)`、`cullFace(BACK)`。

```js
gl.enable(gl.CULL_FACE);   // 原生默认关
gl.cullFace(gl.BACK);      // BACK/FRONT/FRONT_AND_BACK
gl.frontFace(gl.CCW);      // CCW/CW
```

three.js 用材质的 `side` 封装：

| 材质属性 | 行为 |
|---------|------|
| `THREE.FrontSide`（默认） | 开启背面剔除——省一半光栅化，`renderer.render` 时替你 enable |
| `THREE.BackSide` | 只画背面（天空盒、阴影壳、描边壳） |
| `THREE.DoubleSide` | 关闭剔除，两面都画（平面/布料/手动几何体保险项） |

> ⚠️ 自己用 `BufferGeometry` 手搓几何体时，若模型"看起来消失/内外翻"，先查绕序——`08` 章的手搓例子默认 `DoubleSide` 正是绕开此坑。法线方向与绕序必须一致。

## 6. 多重采样抗锯齿 MSAA

### 6.1 默认帧缓冲（屏幕）

`antialias` 上下文参数请求硬件 MSAA（WebGL 规范默认 `true`）。**但 three.js r178 源码核实：`WebGLRenderer` 传给上下文的默认是 `antialias: false`**（新版已改默认；很多旧教程写"默认开启"已过时）：

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });  // 显式开启最稳妥
```

### 6.2 离屏渲染目标（后处理时）

`antialias` 只管屏幕帧缓冲。一旦使用 EffectComposer（`13` 章），渲染进 RenderTarget 就没有 MSAA 了，需要显式恢复：

```js
// WebGL2：RenderTarget 的 samples 参数 = MSAA 采样数
const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4, type: THREE.HalfFloatType });

// 底层实现（MDN 核实）：
// gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, ...) 多采样存储
// + gl.blitFramebuffer(...) 解析(blit resolve)回普通纹理

const composer = new EffectComposer(renderer, rt);   // 后处理链自带 MSAA
```

无 MSAA 时的替代：FXAA/SMAA 后处理 Pass（更快，模糊细节），或直接提高分辨率（DPR/SSAA）。

## 7. 颜色空间（three.js 官方 Color Management 要点）

以下全部来自官方 manual《Color Management》原文：

- 颜色空间 = **三原色(primarys) + 白点(D65) + 传递函数(transfer functions)**。`SRGBColorSpace` 与 `LinearSRGBColorSpace` **三原色和白点相同（色域一样）**，只差传递函数——sRGB 非线性，贴近人眼感知与显示设备；Linear-sRGB 与物理光强成正比。
- **光照与混合运算必须在线性空间**；**存储与显示用 sRGB 更高效**——这就是"输入转线性 → 线性计算 → 输出转 sRGB"管线的由来。
- three.js 的**工作色彩空间固定为 Linear-sRGB**；`ColorManagement.enabled` **默认为 true**：十六进制/CSS 颜色按 sRGB 自动转线性。

```js
// 纹理三分类（贴错是"颜色不对/发灰"的第一大原因）
texture.colorSpace = THREE.SRGBColorSpace;        // 颜色纹理：map、emissiveMap（PNG/JPG）
texture.colorSpace = THREE.NoColorSpace;          // 数据纹理：normalMap、roughnessMap（默认值）
texture.colorSpace = THREE.LinearSRGBColorSpace;  // 线性数据：OpenEXR 环境贴图、lightMap 等

// 输出：默认 sRGB
renderer.outputColorSpace = THREE.SRGBColorSpace; // 默认值，写给屏幕
```

- **后处理必须加 `OutputPass`**：它负责"线性 → sRGB"转换（以及色调映射），否则画面发暗发灰（`13` 章）。
- **8bit 精度账**：sRGB 编码 8bit 够用；线性存储同样范围要 ≥12bit（半浮点）。所以 RenderTarget 一般用 `HalfFloatType`（HDR/泛光前提），中间缓冲别用 sRGB 编码。
- `ShaderMaterial` 不会自动做输出转换，需在片元 `main()` 末尾加 `#include <colorspace_fragment>`；`RawShaderMaterial` 全部自己来。
- 手动转换：`color.convertSRGBToLinear()` / `convertLinearToSRGB()`。

## 8. 上下文属性总表（创建 renderer 的参数）

`new WebGLRenderer({...})` ↔ `canvas.getContext('webgl2', attrs)`（默认值为 **r178 源码核实**；括号内为 WebGL 规范默认）：

| 参数 | three.js 默认 | 作用 |
|------|--------------|------|
| `antialias` | `false`（规范 true） | 屏幕 MSAA，见 §6 |
| `alpha` | `false`（规范 true） | 画布是否含 alpha 通道；MDN 提醒 `alpha:false` 常被浏览器模拟反而慢，且无法与页面做透明合成 |
| `depth` | `true` | 深度缓冲，几乎总是要 |
| `stencil` | `false`（规范 false） | 模板缓冲，需要描边/镜像才开（§3） |
| `premultipliedAlpha` | `true` | 与页面合成方式，通常不动 |
| `preserveDrawingBuffer` | `false` | true 才能截帧 `toDataURL`（有性能代价，按需开） |
| `powerPreference` | `'default'` | `'high-performance'` 提示用独立 GPU |
| `logarithmicDepthBuffer` | `false` | 对数深度（§2.2） |
| `reversedDepthBuffer` | `false` | 反向深度（§2.2，新版新增） |

## 9. 状态 ↔ three.js 对照总表（速查）

| 原生 GL | three.js 封装 |
|---------|--------------|
| `enable(DEPTH_TEST)` / `depthFunc` | `material.depthTest` /（LEQUAL 等内部管理） |
| `depthMask(false)` | `material.depthWrite = false` |
| `enable(BLEND)` + `blendFunc*` | `material.transparent` + `blending` / `blendSrc/blendDst/blendEquation` |
| `enable(CULL_FACE)` / `cullFace` | `material.side`（FrontSide 默认开剔除 / DoubleSide 关） |
| `enable(POLYGON_OFFSET_FILL)` + `polygonOffset` | `material.polygonOffset / polygonOffsetFactor / polygonOffsetUnits` |
| `enable(STENCIL_TEST)` + `stencilFunc/Op` | `material.stencilWrite / stencilFunc / stencilRef / stencilFail...` |
| `clearColor` + `clear(COLOR_BUFFER_BIT)` | `renderer.setClearColor()` / `scene.background` |
| `clear(DEPTH_BUFFER_BIT)` | `renderer.clearDepth()` |
| `viewport` | `renderer.setSize()` |
| RenderTarget / FBO | `THREE.WebGLRenderTarget`（`samples` = MSAA，`13`/`16` 章） |
| 同步 `readPixels` | `renderer.readRenderTargetPixels()`（异步方案见 `24` §6） |

## 10. 调试建议

- **SPECTOR.js 浏览器扩展**：截取一帧，看每条 draw call 的状态（depthFunc、blendFunc、CULL_FACE）与绑定的 program/纹理——排透明与剔除问题的终极手段；
- `renderer.info.render.calls / triangles`：确认合批与剔除是否生效（`16` 章）；
- 透明排序问题先自查三件套：`transparent? depthWrite? renderOrder?`；
- 颜色不对（发灰/过饱和）先查：纹理 `colorSpace`、是否漏了 `OutputPass`、`outputColorSpace` 是否被改。

---

**延伸阅读**：three.js 官方 manual《Color Management》；MDN《WebGL best practices》；`25-state` 三个交互示例（深度开关对比 / 四种混合模式 / 剔除与绕序可视化）。
