# 14. 着色器 GLSL 与 ShaderMaterial

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org `Materials/ShaderMaterial`、`Materials/RawShaderMaterial`；API 名录经官网抓取确认）
> ⚠️ WebGPU 迁移注意：`ShaderMaterial`/`RawShaderMaterial`/`onBeforeCompile` **在 WebGPURenderer 中不受支持**，需迁移到 TSL（见 `15`）

## 1. 渲染管线速记

```
顶点着色器 (Vertex Shader)
  ├─ 输入：attribute（position/uv/normal）+ uniform
  ├─ 逐顶点执行一次
  └─ 输出：gl_Position（裁剪空间坐标）+ varying（传给片元）

      ↓ 光栅化（插值）

片元着色器 (Fragment Shader)
  ├─ 输入：varying（已插值）+ uniform
  ├─ 逐像素执行一次
  └─ 输出：gl_FragColor
```

## 2. ShaderMaterial vs RawShaderMaterial

| | ShaderMaterial | RawShaderMaterial |
|---|---|---|
| 自动注入 | ✅ 内置 uniform（`modelViewMatrix` 等）+ attribute | ❌ 全部自己声明 |
| 代码量 | 少 | 多 |
| 适用 | 常规自定义材质 | 需要完全控制 |

## 3. 第一个 ShaderMaterial

```js
const material = new THREE.ShaderMaterial({
  // 自定义 uniform
  uniforms: {
    uTime:   { value: 0 },
    uColor:  { value: new THREE.Color(0x00aaff) },
  },

  vertexShader: /* glsl */`
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      vUv = uv;

      vec3 pos = position;
      // 顶点波浪位移
      float wave = sin(pos.x * 3.0 + uTime) * 0.3;
      pos.z += wave;
      vWave = wave;

      // ★ 固定写法：把局部坐标转裁剪空间
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,

  fragmentShader: /* glsl */`
    uniform vec3 uColor;
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;

    void main() {
      // 用波高做颜色渐变
      vec3 color = mix(uColor, vec3(1.0, 0.3, 0.8), vWave * 2.0 + 0.5);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5, 64, 64), material);
scene.add(mesh);

// 每帧更新
renderer.setAnimationLoop(() => {
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
});
```

**ShaderMaterial 自动提供的内置量**（无需声明）：

```glsl
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
```

## 4. 完整例子：渐变波纹球（顶点+片元联动）

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.z = 4;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const uniforms = {
  uTime:       { value: 0 },
  uNoiseScale: { value: 2.5 },
  uSpeed:      { value: 1.0 },
  uColorA:     { value: new THREE.Color(0x1a2a6c) },
  uColorB:     { value: new THREE.Color(0xb21f1f) },
  uColorC:     { value: new THREE.Color(0xfdbb2d) },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */`
    uniform float uTime;
    uniform float uNoiseScale;
    uniform float uSpeed;
    varying vec2 vUv;
    varying float vElevation;

    // 经典 3D simplex noise（简化版 cnoise）
    vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      vUv = uv;
      float noise = snoise(position * uNoiseScale + uTime * uSpeed);
      vElevation = noise;
      vec3 newPos = position + normal * noise * 0.25;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec2 vUv;
    varying float vElevation;

    void main() {
      float t = vElevation * 0.5 + 0.5;          // 映射到 0~1
      vec3 color = mix(uColorA, uColorB, smoothstep(0.0, 0.5, t));
      color = mix(color, uColorC, smoothstep(0.5, 1.0, t));
      gl_FragColor = vec4(color, 1.0);
    }
  `,
  side: THREE.DoubleSide,
});

const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), material);
scene.add(sphere);

renderer.setAnimationLoop(() => {
  uniforms.uTime.value = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
});
```

## 5. 用 onBeforeCompile 改造内置材质

想保留 PBR 光照但加自定义效果：

```js
const material = new THREE.MeshStandardMaterial({ color: 0x3399ff });
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  material.userData.shader = shader;   // 存起来以便更新

  // 在顶点着色器开头插入
  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
     uniform float uTime;`
  );

  // 修改位置计算
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>
     transformed.y += sin(transformed.x * 5.0 + uTime) * 0.1;`
  );
};

// 每帧更新
renderer.setAnimationLoop(() => {
  const shader = material.userData.shader;
  if (shader) shader.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
});
```

> 注意：改了 shader 源码后要设 `material.customProgramCacheKey = () => 'myKey'` 避免与其他材质共用缓存。
> WebGPU 不支持此方式 → 用 TSL。

## 6. GLSL 常用函数速查

```glsl
// 数学
float s = smoothstep(edge0, edge1, x);  // 平滑 0→1
float c = clamp(x, 0.0, 1.0);
float m = mix(a, b, t);                 // 线性插值
float len = length(v);
float d = distance(a, b);
float dp = dot(a, b);
vec3 n = normalize(v);
vec3 cr = cross(a, b);
float f = fract(x);                     // 小数部分
float md = mod(x, y);

// 三角/指数
sin, cos, tan, asin, acos, atan(y,x)
pow(x, y), exp(x), log(x), sqrt(x), abs(x), sign(x)

// 纹理采样
vec4 c = texture2D(map, uv);

// 导数（抗锯齿/法线）
dFdx(v), dFdy(v), fwidth(v)

// 丢弃片元（做镂空）
if (alpha < 0.5) discard;
```

## 7. GLSL 调试技巧

```glsl
// 用颜色可视化调试值
gl_FragColor = vec4(vec3(vUv.x, vUv.y, 0.0), 1.0);        // 看 UV
gl_FragColor = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0); // 看法线
gl_FragColor = vec4(vec3(vElevation), 1.0);               // 看标量
```

## 8. 常见坑

| 问题 | 原因/解决 |
|------|----------|
| 编译错误 "undeclared identifier" | RawShaderMaterial 需手动声明所有 attribute/uniform |
| 数值精度问题 | 加 `precision highp float;`（片元着色器默认 mediump） |
| 整数/浮点混用报错 | GLSL 严格类型：`1.0` 不能写 `1` |
| 改了 shader 没效果 | 需要 `material.needsUpdate = true` |
| 性能差 | 减少 `pow`/`sin` 等复杂运算；用内置噪声纹理代替程序化噪声 |
| ShaderMaterial 不受光 | 需自己实现光照，或用 `onBeforeCompile` 改内置材质 |

## 9. 一句话总结

> 顶点着色器算 `gl_Position`、片元着色器算 `gl_FragColor`，用 `varying` 传数据、`uniform` 传参数；ShaderMaterial 自动注入内置矩阵，RawShaderMaterial 全自己声明；改内置材质用 `onBeforeCompile`（WebGPU 不支持，需转 TSL）。
