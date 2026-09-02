# 17. 模型加载与 glTF 生态

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org `Addons → LOADERS` 全 50+ 加载器、`Addons → EXPORTERS`；API 名录经官网抓取确认）
> 关联：`09-材质与纹理详解.md`、`12-动画系统.md`、`16-性能优化与调试.md`

## 1. 为什么用 glTF

**glTF / GLB 是 Web 3D 推荐格式**（"3D 界的 JPEG"）：

- 完整描述网格、材质、纹理、动画、相机、场景层级。
- `.gltf`（JSON + 外部文件）/ `.glb`（单文件二进制，推荐）。
- PBR 材质原生支持。

## 2. 加载器总览

| 格式 | 加载器 | 说明 |
|------|--------|------|
| **glTF/GLB** | `GLTFLoader` | ✅ 首选 |
| OBJ/MTL | `OBJLoader` + `MTLLoader` | 老格式，无动画 |
| FBX | `FBXLoader` | 动画丰富，体积大 |
| Collada (dae) | `ColladaLoader` | |
| STL | `STLLoader` | 3D 打印，只有几何 |
| PLY | `PLYLoader` | 点云/扫描 |
| USD/USDZ | `USDLoader` | 苹果 AR 生态 |
| 3DM (Rhino) | `Rhino3dmLoader` | CAD |
| LDraw | `LDrawLoader` | 乐高 |
| VOX | `VOXLoader` | 体素 |
| 点云 | `PCDLoader`, `XYZLoader` | |
| 字体/3D 文字 | `FontLoader` + `TextGeometry` | |

## 3. GLTFLoader 基础

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load(
  '/models/scene.glb',
  (gltf) => {
    // gltf.scene      → 模型根节点（Group）
    // gltf.scenes     → 所有场景
    // gltf.animations → AnimationClip 数组
    // gltf.cameras    → 相机
    // gltf.asset      → 元数据
    scene.add(gltf.scene);
  },
  (xhr) => console.log(`${(xhr.loaded / xhr.total * 100).toFixed(1)}%`),
  (err) => console.error('加载失败', err)
);
```

**Promise 写法**（推荐，便于 async/await）：

```js
const gltf = await loader.loadAsync('/models/scene.glb');
scene.add(gltf.scene);
```

## 4. 完整例子：加载带动画的 GLB + 自动居中缩放

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 2);
dir.position.set(5, 10, 7);
scene.add(dir);

let mixer;

new GLTFLoader().load('/models/robot.glb', (gltf) => {
  const model = gltf.scene;

  // ① 自动居中 + 缩放到合适大小
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);                     // 居中
  const maxDim = Math.max(size.x, size.y, size.z);
  model.scale.setScalar(5 / maxDim);              // 归一化到 5 单位

  // ② 开启阴影
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);

  // ③ 播放动画
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  }

  // ④ 调整相机到模型距离
  camera.position.set(0, 2, 8);
  controls.target.set(0, 0, 0);
  controls.update();
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  mixer?.update(clock.getDelta());
  controls.update();
  renderer.render(scene, camera);
});
```

## 5. 压缩：DRACO + KTX2 + Meshopt

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const loader = new GLTFLoader();

// DRACO：几何压缩（顶点/索引）
const draco = new DRACOLoader();
draco.setDecoderPath('/libs/draco/');       // 放 decoder 文件
draco.setDecoderConfig({ type: 'js' });     // 'js' 或 'wasm'
loader.setDRACOLoader(draco);

// KTX2：GPU 压缩纹理
const ktx2 = new KTX2Loader()
  .setTranscoderPath('/libs/basis/')
  .detectSupport(renderer);                 // 必须传 renderer
loader.setKTX2Loader(ktx2);

// Meshopt：另一种几何压缩（比 DRACO 解码快）
loader.setMeshoptDecoder(MeshoptDecoder);

loader.load('/models/compressed.glb', (gltf) => scene.add(gltf.scene));
```

**压缩效果**：DRACO 通常把几何体压到 10-20%，KTX2 把纹理压到 1/4~1/6 显存。

## 6. 加载进度管理（LoadingManager）

```js
const manager = new THREE.LoadingManager();

manager.onStart = (url, loaded, total) => console.log('开始加载');
manager.onProgress = (url, loaded, total) => {
  console.log(`进度 ${loaded}/${total}`);
  document.getElementById('bar').style.width = `${loaded / total * 100}%`;
};
manager.onLoad = () => {
  document.getElementById('loading').style.display = 'none';   // 隐藏加载页
  startAnimation();
};
manager.onError = (url) => console.error('失败:', url);

// 所有加载器共享 manager
const gltfLoader = new GLTFLoader(manager);
const texLoader  = new THREE.TextureLoader(manager);
```

## 7. 导出模型（GLTFExporter）

把场景存成 glTF：

```js
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const exporter = new GLTFExporter();

// 导出为 GLB 二进制
exporter.parse(
  scene,
  (result) => {
    const blob = new Blob([result], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'scene.glb'; a.click();
  },
  (err) => console.error(err),
  { binary: true }    // true=GLB, false=glTF JSON
);

// 只导出部分对象 + 带走动画
exporter.parse(mesh, onDone, onError, {
  binary: true,
  animations: [clip],
  onlyVisible: true,
});
```

其他导出器：`OBJExporter`、`STLExporter`、`PLYExporter`、`USDZExporter`（AR Quick Look）、`DRACOExporter`、`EXRExporter`。

## 8. 材质与纹理调整

加载外部模型后常需修正：

```js
gltf.scene.traverse((child) => {
  if (!child.isMesh) return;

  // 颜色贴图必须是 sRGB
  if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
  if (child.material.emissiveMap) child.material.emissiveMap.colorSpace = THREE.SRGBColorSpace;

  // 开启 mipmap + 各向异性
  for (const key in child.material) {
    const v = child.material[key];
    if (v && v.isTexture) {
      v.anisotropy = renderer.capabilities.getMaxAnisotropy();
      v.generateMipmaps = true;
      v.minFilter = THREE.LinearMipmapLinearFilter;
    }
  }

  child.material.envMapIntensity = 1.0;
  child.material.needsUpdate = true;
});
```

## 9. 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 模型全黑 | 无光源 / 无环境贴图 | 加光源或 `scene.environment` |
| 颜色发灰 | 颜色贴图没设 sRGB | `map.colorSpace = SRGBColorSpace` |
| 模型巨大/极小 | 单位不一致 | 用 `Box3` 归一化（见 4） |
| 加载很慢 | 未压缩 | DRACO + KTX2 |
| 动画不动 | 没建 AnimationMixer | 见 `12-动画系统.md` |
| 透明排序错乱 | 深度写入 | `depthWrite = false` 或改用 `alphaTest` |
| 无法加载 | CORS / MIME | 服务器配置正确 MIME |

## 10. 一句话总结

> glTF/GLB 是 Web 3D 首选格式：`GLTFLoader`（可 `loadAsync`）加载，配 DRACO（几何）+ KTX2（纹理）+ Meshopt 压缩；用 `Box3` 自动居中缩放、`traverse` 批量修正材质；`LoadingManager` 管进度，`GLTFExporter` 导出。
