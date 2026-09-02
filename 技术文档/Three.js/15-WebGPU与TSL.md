# 15. WebGPU 渲染器与 TSL

> 来源可信度：**完整正文级**（基于 three.js 官方中文手册 `threejs.org/manual/zh/webgpurenderer.html`，2026-07-03；TSL 函数名录基于 threejs.org 官方 API `TSL/` 分类抓取确认）
> 关联：`14-着色器GLSL与ShaderMaterial.md`、`13-后期处理EffectComposer.md`

## 1. WebGPURenderer 是什么

官方手册原文定义：

> `WebGPURenderer` 被设计为 `WebGLRenderer` 的现代替代方案。它优先使用 WebGPU（现代高性能图形与计算 API），同时也被设计成通用渲染器：**若设备/浏览器不支持 WebGPU，会自动回退到 WebGL 2 后端**。

除接入 WebGPU 外，还提供：

- 内置**全新的节点材质系统**，开发自定义材质更灵活、更稳健。
- 支持 **TSL（Three.js Shading Language）**：用 JavaScript 跨平台编写 shader，根据后端自动转译为 **WGSL 或 GLSL**。
- 内置**全新后处理栈**，支持 MRT（多渲染目标），可借助节点系统自动合并 pass。

## 2. 使用方式（官方手册原文要点）

### 2.1 改导入入口

```diff
- import * as THREE from 'three';
+ import * as THREE from 'three/webgpu';
```

### 2.2 import map 配置

```html
<script type="importmap">
{
  "imports": {
    "three": "../build/three.webgpu.js",
    "three/webgpu": "../build/three.webgpu.js",
    "three/tsl": "../build/three.tsl.js",
    "three/addons/": "./jsm/"
  }
}
</script>
```

### 2.3 创建渲染器

```js
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(render);
document.body.appendChild(renderer.domElement);
```

> ⚠️ **WebGPU 初始化是异步的**，因此官方**推荐使用 `setAnimationLoop()`**，它能确保首次渲染前完成初始化。

若坚持用 `requestAnimationFrame()` 或需在初始化阶段直接用渲染器，要额外 await：

```js
const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(render);
document.body.appendChild(renderer.domElement);

await renderer.init();   // ★ 手动等待初始化
```

### 2.4 强制 WebGL 2（测试/兼容）

```js
const renderer = new THREE.WebGPURenderer({
  antialias: true,
  forceWebGL: true,       // 禁用 WebGPU，强制 WebGL 2 后端
});
```

## 3. 完整例子：WebGPU 场景

```js
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a1a);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 8);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.setAnimationLoop(animate);       // 推荐，内部处理异步初始化
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 标准材质在 WebGPU 下同样工作
const knot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.2, 0.4, 128, 32),
  new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.2, metalness: 0.9 })
);
scene.add(knot);

const dir = new THREE.DirectionalLight(0xffffff, 3);
dir.position.set(5, 8, 5);
scene.add(dir);
scene.add(new THREE.AmbientLight(0x404060, 2));

function animate() {
  knot.rotation.y += 0.005;
  controls.update();
  renderer.render(scene, camera);
}
```

## 4. TSL 入门

TSL = 用 **JavaScript 写 shader**，自动编译到 WGSL（WebGPU）或 GLSL（WebGL2）。

```js
import { color, uv, vec3, mix, sin, time, positionLocal, normalLocal } from 'three/tsl';
```

### 4.1 第一个 TSL 材质

```js
import * as THREE from 'three/webgpu';
import { color, uv, mix, sin, time, vec2 } from 'three/tsl';

// 用 TSL 给 MeshStandardNodeMaterial 的 colorNode 赋值
const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = mix(
  color(0xff0088),
  color(0x0088ff),
  sin(uv().x.mul(10).add(time)).mul(0.5).add(0.5)   // 动态波纹
);

const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), material);
```

**对比 GLSL 写法**：无需写字符串、无需编译，直接 JS 链式调用，且**自动适配两种后端**。

### 4.2 顶点位移

```js
import { positionLocal, normalLocal, sin, time } from 'three/tsl';

material.positionNode = positionLocal.add(
  normalLocal.mul(sin(positionLocal.y.mul(5).add(time)).mul(0.2))
);
```

### 4.3 常用 TSL 节点（官方 API 名录节选）

| 类别 | 函数 |
|------|------|
| 输入 | `uv()`, `positionLocal`, `positionWorld`, `normalLocal`, `normalWorld`, `time`, `deltaTime`, `screenUV`, `screenSize`, `cameraPosition` |
| 数学 | `add/sub/mul/div`, `sin/cos/tan`, `abs`, `floor`, `fract`, `mod`, `pow`, `sqrt`, `mix`, `clamp`, `smoothstep`, `step`, `min`, `max`, `dot`, `cross`, `normalize`, `length`, `distance` |
| 向量 | `vec2/vec3/vec4`, `float`, `int` |
| 纹理 | `texture(map, uvNode)`, `cubeTexture`, `texture3D` |
| 材质属性 | `color()`, `materialColor`, `materialRoughness`, `materialMetalness`, `materialOpacity`, `materialEmissive` |
| 流程控制 | `If`, `Loop`, `Switch`, `Break`, `Continue`, `Return`, `Discard` |
| 变量 | `Var`, `Const`, `uniform()`, `attribute()`, `varying()` |
| 后处理 | `pass()`, `bloom()`, `gaussianBlur()`, `fxaa()`, `ssr()`, `dof()`, `godrays()`, `film()`, `vignette()`, `rgbShift()`, `sobel()` |
| 噪声 | `snoise` (simplex), `curlNoise`, `triNoise3D`, `hash` |
| 常量 | `PI`, `PI2`, `EPSILON`, `INFINITY` |

### 4.4 uniform 与 JS 交互

```js
import { uniform, vec3, mix } from 'three/tsl';

const uIntensity = uniform(0.5);        // 可后续修改
const uColorA = uniform(new THREE.Color(0xff0000));

material.colorNode = mix(uColorA, vec3(0, 0, 1), uIntensity);

// 每帧改值（直接改 .value）
renderer.setAnimationLoop(() => {
  uIntensity.value = Math.sin(clock.getElapsedTime()) * 0.5 + 0.5;
  renderer.render(scene, camera);
});
```

## 5. 完整例子：TSL 自定义波纹材质

```js
import * as THREE from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  positionLocal, normalLocal, uv, vec3, vec4, float,
  sin, cos, mix, smoothstep, time, uniform,
} from 'three/tsl';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGPURenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// --- TSL 材质 ---
const uAmp = uniform(0.25);
const uFreq = uniform(4.0);

const material = new THREE.MeshStandardNodeMaterial({
  roughness: 0.3,
  metalness: 0.1,
});

// 顶点位移：沿法线做正弦波
const wave = sin(positionLocal.x.mul(uFreq).add(time))
  .mul(cos(positionLocal.y.mul(uFreq).add(time)))
  .mul(uAmp);
material.positionNode = positionLocal.add(normalLocal.mul(wave));

// 颜色：按波高在两个颜色间插值
const t = wave.div(uAmp).mul(0.5).add(0.5);
material.colorNode = mix(
  vec3(0.05, 0.2, 0.6),
  vec3(0.9, 0.3, 0.1),
  smoothstep(float(0.0), float(1.0), t)
);

// 自发光强度也随波动
material.emissiveNode = vec3(0.1, 0.0, 0.2).mul(t);

const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.2, 256, 256), material);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(3, 5, 4);
scene.add(dir);

function animate() {
  mesh.rotation.y += 0.003;
  controls.update();
  renderer.render(scene, camera);
}
```

## 6. WebGPU 后处理（新栈）

传统 `EffectComposer` **不被支持**，改用 `PostProcessing` + TSL：

```js
import * as THREE from 'three/webgpu';
import { pass, bloom } from 'three/tsl';

const postProcessing = new THREE.PostProcessing(renderer);

// pass() 取场景渲染结果
const scenePass = pass(scene, camera);
const scenePassColor = scenePass.getTextureNode('output');

// 叠加 bloom
const bloomPass = bloom(scenePassColor, 0.8, 0.4, 0.85);

// 合成输出
postProcessing.outputNode = scenePassColor.add(bloomPass);

renderer.setAnimationLoop(() => {
  postProcessing.render();   // 用 postProcessing 而非 renderer.render
});
```

**新后处理栈优势**（官方手册）：

- 支持 MRT（多渲染目标）。
- 可借助节点系统**自动合并 pass**（减少带宽）。
- 新增 SSGI、SSS、更好的 DoF 等效果，常用效果都有性能更好的节点版本。

### 其他后处理节点

```js
import {
  bloom, gaussianBlur, dof, godrays, fxaa, smaa, film, vignette,
  rgbShift, chromaticAberration, sobel, pixelationPass, denoise, traa, ssgi, ssr,
} from 'three/tsl';

// 组合：泛光 + 暗角 + 胶片颗粒
postProcessing.outputNode = vignette(
  film(scenePassColor.add(bloomPass), 0.35), 0.4, 0.9
);
```

## 7. 迁移注意事项（官方手册原文要点）

1. **`ShaderMaterial`、`RawShaderMaterial` 以及通过 `onBeforeCompile()` 改造内置材质，在 `WebGPURenderer` 中不受支持。** 相关逻辑需要迁移到节点材质与 TSL。
2. **`EffectComposer` 及其传统 pass 在这里不支持**，因为 WebGPURenderer 提供了新一代后处理栈。后处理效果使用 TSL 编写，以节点组合表达。
3. 渲染器整体仍属**实验阶段**，尽管成熟度近年明显提升。依据应用和场景，仍可能遇到缺失特性，或某些场景下 `WebGLRenderer` 更快。
4. `WebGLRenderer` 常见方法（`clear()`、`setRenderTarget()`、`dispose()`）在 `WebGPURenderer` 中同样可用。

**WebGLRenderer 现状**（官方手册）：

> 虽然当前研发重点在 `WebGPURenderer`、节点材质和 TSL，`WebGLRenderer` 仍在维护，且依然是**纯 WebGL 2 应用的推荐选择**。但项目已不计划为 `WebGLRenderer` 增加大型新特性。

## 8. 选型建议

| 场景 | 选择 |
|------|------|
| 纯 WebGL2、稳定优先、老项目 | `WebGLRenderer` |
| 新项目、要计算着色器/大量实例化 | `WebGPURenderer` |
| 需要自定义 shader 且要跨后端 | TSL |
| 必须用 GLSL 字符串 / onBeforeCompile | 留在 WebGLRenderer |

## 9. 一句话总结

> WebGPURenderer 用 `three/webgpu` 入口、优先 WebGPU 自动回退 WebGL2，异步初始化推荐 `setAnimationLoop()`；TSL 用 JS 写 shader 自动编译到 WGSL/GLSL，节点材质取代 ShaderMaterial，新后处理栈取代 EffectComposer。纯 WebGL2 项目仍推荐 WebGLRenderer。
