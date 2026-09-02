# 13. 后期处理（Post Processing）

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org `Addons → POSTPROCESSING` 分类：EffectComposer / RenderPass / UnrealBloomPass / OutputPass / SSAOPass / GTAOPass / OutlinePass / SMAAPass / FXAAPass 等；API 名录经官网抓取确认）
> ⚠️ 注意：**`EffectComposer` 传统 Pass 在 `WebGPURenderer` 中不受支持**，需改用 TSL 节点后处理（见 `15-WebGPU与TSL.md`）

## 1. 原理

正常渲染：场景 → 屏幕。
后期处理：场景 → **RenderTarget（离屏纹理）** → 一系列 Pass 依次处理 → 屏幕。

```
RenderPass → BloomPass → OutputPass → 屏幕
```

## 2. 基础用法

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);

// ① 必须有：把场景渲染进缓冲区
composer.addPass(new RenderPass(scene, camera));

// ② 各种效果 Pass ...

// ③ 放在最后：色调映射 + 色彩空间转换
composer.addPass(new OutputPass());

// 渲染时调用 composer 而非 renderer
renderer.setAnimationLoop(() => {
  composer.render();
});
```

> ⚠️ **常见坑**：加了 composer 后如果画面偏暗/发灰，多半是**漏了 `OutputPass`**（它负责 tone mapping 与 sRGB 转换）。另外 `WebGLRenderer` 的 `outputColorSpace` 由 OutputPass 接管。

## 3. 泛光 Bloom（最常用）

```js
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.2,   // strength 强度
  0.4,   // radius 半径
  0.85   // threshold 阈值（低于此亮度不发光）
);
composer.addPass(bloom);
```

### 完整例子：发光物体 + 抗锯齿

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000010);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 2, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 发光球（emissive 超 1 才会被 bloom 捕捉）
const glow = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    color: 0x000000,
    emissive: 0x00aaff,
    emissiveIntensity: 3,      // ★ 大于 1
  })
);
scene.add(glow);

// 普通物体（不发光）
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(2.5, 0.2, 16, 100),
  new THREE.MeshStandardMaterial({ color: 0x333344, roughness: 0.4, metalness: 0.8 })
);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

scene.add(new THREE.AmbientLight(0xffffff, 0.2));
const light = new THREE.PointLight(0xffffff, 20);
light.position.set(5, 5, 5);
scene.add(light);

// ---- 后期处理链 ----
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  1.5,   // strength
  0.6,   // radius
  0.9    // threshold
);
composer.addPass(bloom);

composer.addPass(new OutputPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);   // ★ composer 也要 resize
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  glow.position.y = Math.sin(t) * 0.5;
  glow.material.emissiveIntensity = 2 + Math.sin(t * 3) * 1;
  ring.rotation.z = t * 0.3;
  controls.update();
  composer.render();
});
```

## 4. 常用 Pass 一览

| Pass | 作用 | 开销 |
|------|------|------|
| `RenderPass` | 渲染场景（**必需，第一个**） | 低 |
| `OutputPass` | 色调映射+sRGB（**放最后**） | 低 |
| `UnrealBloomPass` | 泛光 | 中 |
| `BokehPass` | 景深（DoF） | 高 |
| `SSAOPass` / `GTAOPass` | 环境光遮蔽 | 高 |
| `SSRPass` | 屏幕空间反射 | 很高 |
| `OutlinePass` | 物体描边（选中高亮） | 中 |
| `FXAAPass` / `SMAAPass` | 抗锯齿（composer 下 antialias 失效） | 低-中 |
| `FilmPass` | 胶片颗粒/扫描线 | 低 |
| `GlitchPass` | 故障艺术 | 低 |
| `AfterimagePass` | 残影 | 低 |
| `RenderPixelatedPass` | 像素化 | 低 |
| `LUTPass` | 颜色查找表调色 | 低 |

## 5. OutlinePass（物体描边）

```js
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

const outline = new OutlinePass(
  new THREE.Vector2(innerWidth, innerHeight), scene, camera
);
outline.selectedObjects = [selectedMesh];   // 要描边的物体
outline.edgeStrength = 5;
outline.edgeGlow = 0.5;
outline.edgeThickness = 2;
outline.pulsePeriod = 2;                    // 呼吸脉冲
outline.visibleEdgeColor.set('#ff0000');
outline.hiddenEdgeColor.set('#220000');     // 被遮挡部分的颜色
composer.addPass(outline);
```

配合 `Raycaster` 做"悬停高亮描边"非常实用。

## 6. 自定义 ShaderPass

```js
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const MyShader = {
  uniforms: {
    tDiffuse: { value: null },   // 上一 pass 的输出，固定这个名字
    uTime:    { value: 0 },
    uAmount:  { value: 0.5 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // 简单的扫描线效果
      float scan = sin(vUv.y * 800.0 + uTime * 10.0) * 0.04;
      color.rgb -= scan;
      // 暗角
      float d = distance(vUv, vec2(0.5));
      color.rgb *= smoothstep(0.8, 0.2, d) * uAmount + (1.0 - uAmount);
      gl_FragColor = color;
    }
  `,
};

const myPass = new ShaderPass(MyShader);
composer.addPass(myPass);

// 每帧更新 uniform
myPass.uniforms.uTime.value = clock.getElapsedTime();
```

## 7. 抗锯齿注意事项

用 `EffectComposer` 后，`WebGLRenderer({ antialias: true })` **会失效**（因为渲染到 RenderTarget 而非默认帧缓冲）。

解决方案（选一）：

```js
// 方案 A：多重采样 RenderTarget（WebGL2，推荐）
const rt = new THREE.WebGLRenderTarget(w, h, {
  samples: 4,                              // MSAA
  type: THREE.HalfFloatType,               // 配合 bloom 更准确
});
const composer = new EffectComposer(renderer, rt);

// 方案 B：加 FXAA/SMAA Pass
composer.addPass(new FXAAPass());  // 需 three/addons/postprocessing/FXAAPass.js
```

## 8. 性能建议

- Pass 数量直接乘算开销，生产环境控制在 3-5 个。
- `setSize` 时 composer 也要更新。
- 移动端慎用 SSAO/SSR。
- 用 `composer.render()` 替代 `renderer.render()`。

## 9. 一句话总结

> 后期处理 = `RenderPass`（首）→ 效果 Pass → `OutputPass`（尾），用 `composer.render()` 渲染；Bloom 靠 `emissiveIntensity > 1` + threshold；composer 下 `antialias` 失效，改用 `samples: 4` 或 FXAA；resize 要同时 `composer.setSize()`。WebGPU 下需迁移到 TSL。
