# 18. 粒子系统与 Points

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org `Materials/PointsMaterial`、`Textures/Sprite`、`Objects/Points/Line`；API 名录经官网抓取确认）
> 关联：`08-几何体与BufferGeometry.md`、`14-着色器GLSL与ShaderMaterial.md`、`16-性能优化与调试.md`

## 1. 三种粒子实现对比

| 方案 | 一个对象渲染 | 各自独立变换 | 各自贴图 | 适用 |
|------|-------------|-------------|---------|------|
| `Points` + `PointsMaterial` | ✅ 1 draw call | ❌（需改顶点） | ❌ 共用一个 | 星空、雨雪、点云 |
| `Sprite` | ❌ 每个一个 | ✅ | ✅ | 标签、光晕、少量图标 |
| `InstancedMesh` | ✅ 1 draw call | ✅ | ❌ | 大量有朝向的碎片/道具 |

**选型直觉**：几万以上无差别小点 → `Points`；几百个带图片的方向性元素 → `Sprite`；几万个需旋转的实体 → `InstancedMesh`（见 `16`）。

## 2. Points + PointsMaterial 基础

```js
const geometry = new THREE.BufferGeometry();
const count = 5000;

const positions = new Float32Array(count * 3);
const colors = new Float32Array(count * 3);

for (let i = 0; i < count; i++) {
  positions[i * 3 + 0] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

  colors[i * 3 + 0] = Math.random();
  colors[i * 3 + 1] = Math.random();
  colors[i * 3 + 2] = Math.random();
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
  size: 0.05,
  vertexColors: true,      // 用 color 属性
  sizeAttenuation: true,   // 近大远小（false 则固定像素大小）
  map: particleTexture,
  transparent: true,
  alphaTest: 0.01,         // 解决透明排序问题
  depthWrite: false,
  blending: THREE.AdditiveBlending,   // 发光叠加
});

const points = new THREE.Points(geometry, material);
scene.add(points);
```

**PointsMaterial 关键属性**：

| 属性 | 说明 |
|------|------|
| `size` | 点的大小 |
| `sizeAttenuation` | 是否随距离衰减（默认 true） |
| `vertexColors` | 启用顶点颜色 |
| `map` | 点贴图（圆形光斑最常用） |
| `alphaMap` | 用贴图灰度控制透明 |
| `blending` | `AdditiveBlending` 做发光 |
| `depthWrite` | 透明叠加时通常设 false |

## 3. 完整例子：可交互星云（自定义 shader 粒子）

用 `ShaderMaterial` 控制每个点的大小与旋转，比 `PointsMaterial` 灵活得多。

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000008);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = 15;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// ---- 生成圆盘星云分布 ----
const COUNT = 30000;
const geometry = new THREE.BufferGeometry();

const positions = new Float32Array(COUNT * 3);
const colors    = new Float32Array(COUNT * 3);
const sizes     = new Float32Array(COUNT);
const phases    = new Float32Array(COUNT);      // 各自闪烁相位

const inner = new THREE.Color(0xffddaa);        // 星系中心色
const outer = new THREE.Color(0x4488ff);        // 边缘色
const tmp = new THREE.Color();

for (let i = 0; i < COUNT; i++) {
  const radius = 1 + Math.pow(Math.random(), 0.6) * 11;
  const branch = (i % 3) / 3 * Math.PI * 2;             // 3 条旋臂
  const spin   = radius * 0.35;
  const rand   = () => Math.pow(Math.random(), 2) * (radius * 0.12);

  positions[i * 3 + 0] = Math.cos(branch + spin) * radius + rand();
  positions[i * 3 + 1] = rand() * 0.4;                  // 扁平
  positions[i * 3 + 2] = Math.sin(branch + spin) * radius + rand();

  tmp.copy(inner).lerp(outer, radius / 12);
  colors[i * 3 + 0] = tmp.r;
  colors[i * 3 + 1] = tmp.g;
  colors[i * 3 + 2] = tmp.b;

  sizes[i]  = Math.random() * 0.12 + 0.02;
  phases[i] = Math.random() * Math.PI * 2;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('aPhase',   new THREE.BufferAttribute(phases, 1));

// ---- 自定义粒子材质 ----
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime:       { value: 0 },
    uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
    uSizeScale:  { value: 30.0 },
  },
  vertexShader: /* glsl */`
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aPhase;

    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSizeScale;

    varying vec3 vColor;
    varying float vTwinkle;

    void main() {
      vColor = aColor;
      // 闪烁：0.6 ~ 1.4
      vTwinkle = 0.6 + sin(uTime * 2.0 + aPhase) * 0.4;

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      // 透视衰减：距离越远越小
      gl_PointSize = aSize * uSizeScale * uPixelRatio * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: /* glsl */`
    varying vec3 vColor;
    varying float vTwinkle;

    void main() {
      // 把方形点裁剪成圆形 + 径向柔化
      float d = distance(gl_PointCoord, vec2(0.5));
      if (d > 0.5) discard;                       // 圆形裁剪
      float strength = pow(1.0 - d * 2.0, 3.0);   // 中心亮、边缘淡

      gl_FragColor = vec4(vColor * vTwinkle, strength);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

const galaxy = new THREE.Points(geometry, material);
scene.add(galaxy);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  material.uniforms.uTime.value = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  material.uniforms.uPixelRatio.value = Math.min(devicePixelRatio, 2);
});
```

**关键点解析**：

- `gl_PointSize`：顶点着色器里设置点的**像素大小**（片元阶段无法改）。
- `gl_PointCoord`：片元着色器里提供点在方形内的坐标 `[0,1]`，用它做圆形裁剪与径向渐变。
- `AdditiveBlending` + `depthWrite: false`：让密集粒子叠加发光而不互相遮挡。
- `aSize`/`aColor`/`aPhase` 是自定义 attribute（见 `08`）。

## 4. Sprite（永远面向相机）

```js
const map = new THREE.TextureLoader().load('/flare.png');
const material = new THREE.SpriteMaterial({
  map,
  color: 0xffffff,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const sprite = new THREE.Sprite(material);
sprite.position.set(0, 2, 0);
sprite.scale.set(2, 2, 1);    // z 无意义
scene.add(sprite);
```

**特点**：无论相机怎么转都正对屏幕，适合做**光晕、图标标记、文字标签、血条**。

### HTML 标签：CSS2DRenderer

比 Sprite 更清晰（真正的 DOM 元素）：

```js
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const div = document.createElement('div');
div.className = 'label';
div.textContent = '发动机';
const label = new CSS2DObject(div);
mesh.add(label);            // 挂到物体上，自动跟随

// 渲染循环里
renderer.render(scene, camera);
labelRenderer.render(scene, camera);
```

## 5. 每帧更新粒子（CPU 动画）

```js
const positions = geometry.attributes.position.array;

renderer.setAnimationLoop(() => {
  for (let i = 0; i < COUNT; i++) {
    // 让粒子缓慢上升，超出顶部则回到底部
    positions[i * 3 + 1] += 0.02;
    if (positions[i * 3 + 1] > 10) positions[i * 3 + 1] = -10;
  }
  geometry.attributes.position.needsUpdate = true;   // ★ 必须
  renderer.render(scene, camera);
});
```

> ⚠️ **CPU 逐粒子更新在数万级会掉帧**。更优做法：把动画逻辑放进**顶点着色器**（用 `uTime` 算位置），CPU 完全不动（如第 3 节的闪烁）。参见 `14-着色器`。

## 6. 性能要点

| 问题 | 解法 |
|------|------|
| 粒子过多掉帧 | 动画移入 shader；或用 `InstancedMesh` |
| 透明粒子互相遮挡 | `depthWrite: false` + `AdditiveBlending` |
| 半透明边缘有黑框 | 用 `alphaTest` 或预乘 alpha 贴图 |
| 高分屏粒子过大 | gl_PointSize 乘 `pixelRatio`（但别超过 2） |
| 深度排序闪烁 | 粒子通常关排序，靠加法混合规避 |

## 7. 一句话总结

> 大量无差别小点用 `Points`（1 draw call），带图片的方向元素用 `Sprite`，HTML 标签用 `CSS2DRenderer`；自定义外观靠 `ShaderMaterial`（顶点设 `gl_PointSize`、片元用 `gl_PointCoord` 裁圆）；动画优先放 shader 避免逐粒子 CPU 更新；加法混合 + `depthWrite:false` 出光效。
