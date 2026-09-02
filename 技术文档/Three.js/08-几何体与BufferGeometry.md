# 08. 几何体与 BufferGeometry

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org `Geometries/` 全 21 个内置几何体、`Core/BufferGeometry`、`Core/BufferAttribute`；API 名录经官网抓取确认）
> 关联：`06-场景图与Object3D变换.md`

## 1. 几何体 = 顶点数据

几何体（Geometry）只描述**形状**（顶点位置、法线、UV、索引），**不含材质和位置**。
`Mesh = Geometry + Material`。

Three.js 的几何体统一是 `BufferGeometry`：用**扁平 TypedArray** 存顶点数据，直接上传 GPU。

## 2. 内置几何体速查

| 几何体 | 构造参数（主要） | 典型用途 |
|--------|-----------------|---------|
| `BoxGeometry` | w, h, d, segW, segH, segD | 盒子、建筑 |
| `SphereGeometry` | radius, widthSeg, heightSeg | 球体、行星 |
| `PlaneGeometry` | w, h, segW, segH | 地面、墙面 |
| `CylinderGeometry` | rTop, rBottom, h, radialSeg | 柱子、管道 |
| `ConeGeometry` | radius, height, radialSeg | 锥体 |
| `TorusGeometry` | radius, tube, radialSeg, tubularSeg | 圆环 |
| `TorusKnotGeometry` | radius, tube, tubularSeg, radialSeg | 装饰体 |
| `CircleGeometry` | radius, segments | 圆盘 |
| `RingGeometry` | innerR, outerR, thetaSeg | 圆环面 |
| `TubeGeometry` | path, tubularSeg, radius | 沿曲线管道 |
| `LatheGeometry` | points, segments | 旋转成型（花瓶） |
| `ExtrudeGeometry` | shape, options | 2D 挤出 3D（文字/Logo） |
| `ShapeGeometry` | shape | 平面 2D 形状 |
| `CapsuleGeometry` | radius, length, capSeg | 胶囊（角色碰撞体） |
| `IcosahedronGeometry` / `DodecahedronGeometry` / `TetrahedronGeometry` / `OctahedronGeometry` | radius, detail | 多面体/低模星球 |
| `EdgesGeometry` | geometry, threshold | 提取边线（描边） |
| `WireframeGeometry` | geometry | 线框 |

```js
const box = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2); // 分段越多越平滑/越耗
```

## 3. 手动构建 BufferGeometry

```js
const geometry = new THREE.BufferGeometry();

// 3 个顶点，每个 3 个 float (x,y,z)
const positions = new Float32Array([
   0,  1, 0,    // 顶点 0
  -1, -1, 0,    // 顶点 1
   1, -1, 0,    // 顶点 2
]);

// itemSize = 3 表示每个顶点消费 3 个数
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.computeVertexNormals();   // 自动算法线（受光必需）

const mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ side: THREE.DoubleSide })
);
scene.add(mesh);
```

## 4. 索引复用顶点（Indexed）

直接列顶点会产生重复；用 `index` 复用：

```js
// 一个四边形 = 2 个三角形，但只需 4 个顶点（而非 6 个）
const positions = new Float32Array([
  0, 0, 0,   // 0
  1, 0, 0,   // 1
  1, 1, 0,   // 2
  0, 1, 0,   // 3
]);
const indices = [0, 1, 2,  0, 2, 3];   // 两个三角形

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setIndex(indices);
```

**索引能显著减小体积**，是 glTF/DRACO 压缩的基础。

## 5. 完整例子：动态波浪平面（每帧改顶点）

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 3, 6);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// 20x20 分段的平面
const geometry = new THREE.PlaneGeometry(10, 10, 20, 20);
geometry.rotateX(-Math.PI / 2);           // 躺平（几何体自身旋转，不改 mesh）
const pos = geometry.attributes.position; // BufferAttribute
const baseZ = pos.array.slice();          // 保存初始高度

const mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ color: 0x33aaff, wireframe: true })
);
scene.add(mesh);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dir = new THREE.DirectionalLight(0xffffff, 1);
dir.position.set(5, 10, 5);
scene.add(dir);

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();

  // 逐顶点改 z（旋转前是 z，旋转后表现为高度）
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 1.5 + t * 2) * 0.3 + Math.cos(y * 1.5 + t) * 0.2);
  }
  pos.needsUpdate = true;          // ★ 必须标记，否则 GPU 不更新
  geometry.computeVertexNormals(); // 重算法线，光照才正确

  renderer.render(scene, camera);
});
```

**关键点**：修改顶点后必须 `attribute.needsUpdate = true`；改形状后要 `computeVertexNormals()` 否则光照错误。

## 6. 常用操作

```js
// 几何体自身变换（不影响 mesh 的 transform）
geometry.translate(1, 0, 0);
geometry.rotateY(Math.PI / 4);
geometry.scale(2, 2, 2);
geometry.center();            // 居中到原点

// 包围盒 / 包围球（做碰撞、相机定位）
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
console.log(geometry.boundingBox);

// 合并多个几何体（减少 draw call）
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const merged = mergeGeometries([geo1, geo2, geo3]);

// 释放（切换场景时务必调用，防内存泄漏）
geometry.dispose();
```

## 7. 自定义属性（给着色器用）

```js
// 为每个顶点加一个随机值，供 shader 使用（见 14-着色器）
const count = pos.count;
const randoms = new Float32Array(count);
for (let i = 0; i < count; i++) randoms[i] = Math.random();
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
```

## 8. 一句话总结

> 几何体 = 顶点数据（`position`/`normal`/`uv` + `index`）；内置 21 种覆盖常见形状；手动用 `BufferAttribute` 构造，改顶点后 `needsUpdate = true` + `computeVertexNormals()`；索引用 `setIndex` 复用顶点；切换场景记得 `dispose()`。
