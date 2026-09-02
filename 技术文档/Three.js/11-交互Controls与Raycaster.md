# 11. 交互：Controls 与 Raycaster 拾取

> 来源可信度：**完整正文级**（`OrbitControls` 基于 three.js 官方源码 `examples/jsm/controls/OrbitControls.js` 的 JSDoc 与实现；`Raycaster` 基于官方 API 名录 `Core/Raycaster`）
> 关联：`07-相机与坐标系.md`、`06-场景图与Object3D变换.md`

## 1. OrbitControls（最常用）

> 官方源码说明：*"OrbitControls performs orbiting, dollying (zooming), and panning. Unlike TrackballControls, it maintains the 'up' direction."*

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);

// 必须调用 update() 才能生效（尤其开了 damping/autoRotate 时）
function animate() {
  controls.update();
  renderer.render(scene, camera);
}
```

### 1.1 核心属性（源码确认）

| 属性 | 默认值 | 说明 |
|------|--------|------|
| `target` | `Vector3(0,0,0)` | 相机围绕的焦点 |
| `enableDamping` | `false` | 惯性阻尼，**开了必须每帧 `update()`** |
| `dampingFactor` | `0.05` | 阻尼系数 |
| `autoRotate` | `false` | 自动旋转，**开了必须每帧 `update()`** |
| `autoRotateSpeed` | `2.0` | 30 秒/圈（60fps） |
| `enableZoom` | `true` | 允许缩放 |
| `zoomSpeed` | `1.0` | 缩放速度 |
| `enableRotate` | `true` | 允许旋转 |
| `rotateSpeed` | `1.0` | |
| `enablePan` | `true` | 允许平移 |
| `panSpeed` | `1.0` | |
| `screenSpacePanning` | `true` | 屏幕空间平移 |
| `minDistance` / `maxDistance` | `0` / `Infinity` | 透视相机缩放限制 |
| `minZoom` / `maxZoom` | `0` / `Infinity` | 正交相机缩放限制 |
| `minPolarAngle` / `maxPolarAngle` | `0` / `Math.PI` | 垂直旋转限制（弧度） |
| `minAzimuthAngle` / `maxAzimuthAngle` | `-Infinity` / `Infinity` | 水平旋转限制 |
| `minTargetRadius` / `maxTargetRadius` | `0` / `Infinity` | target 距 cursor 范围 |
| `zoomToCursor` | `false` | 缩放到鼠标位置 |
| `cursorStyle` | `'auto'` | `'grab'` 时鼠标抓手样式 |
| `keys` | 方向键 | 键盘平移 |
| `mouseButtons` | LEFT:ROTATE, MIDDLE:DOLLY, RIGHT:PAN | 鼠标映射 |
| `touches` | ONE:ROTATE, TWO:DOLLY_PAN | 触摸映射 |

### 1.2 常用方法（源码确认）

```js
controls.update(deltaTime);   // 每帧调用；传 deltaTime 让 autoRotate 与帧率无关
controls.saveState();         // 保存当前状态
controls.reset();             // 恢复到 saveState/初始状态
controls.dispose();           // 移除监听（组件卸载时必须）
controls.getPolarAngle();     // 当前垂直角
controls.getAzimuthalAngle(); // 当前水平角
controls.getDistance();       // 相机到 target 距离
controls.listenToKeyEvents(window);  // 启用键盘控制
controls.pan(dx, dy);         // 编程式平移
controls.rotateLeft(angle);   // 编程式旋转
controls.dollyIn(scale);      // 编程式缩放
```

### 1.3 事件

```js
controls.addEventListener('change', () => console.log('相机变了'));
controls.addEventListener('start',  () => console.log('开始交互'));
controls.addEventListener('end',    () => console.log('结束交互'));
```

### 1.4 完整例子：限制角度 + 自动巡游

```js
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 1, 0);

// 限制：不能到地面以下，距离 3~20
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 3;
controls.maxDistance = 20;

// 空闲自动旋转
controls.autoRotate = true;
controls.autoRotateSpeed = 1.0;

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();       // 传 deltaTime → 自动旋转与帧率无关
  controls.update(dt);
  renderer.render(scene, camera);
});
```

## 2. 其他 Controls

| 控制器 | 用途 |
|--------|------|
| `MapControls` | 地图式（平移为主，OrbitControls 的子类） |
| `TrackballControls` | 无"上方向"约束的自由旋转 |
| `FlyControls` | 飞行（WASD） |
| `FirstPersonControls` | 第一人称 |
| `PointerLockControls` | FPS 鼠标锁定（游戏） |
| `DragControls` | 拖拽物体 |
| `TransformControls` | 显示移动/旋转/缩放 gizmo（编辑器） |
| `ArcballControls` | 轨迹球 |

## 3. Raycaster 拾取

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(event) {
  // 转 NDC 坐标 [-1, 1]
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('pointermove', onPointerMove);

// 在渲染循环或事件里检测
raycaster.setFromCamera(pointer, camera);
const intersects = raycaster.intersectObjects(scene.children, true); // true=递归子级
if (intersects.length > 0) {
  const hit = intersects[0];
  console.log(hit.object.name, hit.distance, hit.point, hit.face?.normal);
}
```

`intersect` 结果包含：`object`、`distance`、`point`（世界坐标交点）、`face`、`faceIndex`、`uv`、`instanceId`。

## 4. 完整例子：点击高亮 + 悬停提示

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.5);
dir.position.set(5, 10, 7);
scene.add(dir);

// 造 6 个可点物体
const colors = [0xff5555, 0x55ff55, 0x5555ff, 0xffff55, 0xff55ff, 0x55ffff];
const pickables = [];
colors.forEach((c, i) => {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshStandardMaterial({ color: c })
  );
  m.position.set((i % 3) * 2.5 - 2.5, 0.75, Math.floor(i / 3) * 2.5 - 1.25);
  m.name = `box-${i}`;
  m.userData.baseColor = c;      // 存原色，便于还原
  scene.add(m);
  pickables.push(m);
});

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;
let selected = null;

renderer.domElement.addEventListener('pointermove', (e) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});

renderer.domElement.addEventListener('click', () => {
  if (hovered) {
    if (selected) selected.material.emissive.setHex(0x000000);
    selected = hovered;
    selected.material.emissive.setHex(0x333300);   // 选中发光
    console.log('选中:', selected.name);
  }
});

renderer.setAnimationLoop(() => {
  // 悬停检测
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, false);

  if (hits.length > 0) {
    const obj = hits[0].object;
    if (hovered !== obj) {
      if (hovered && hovered !== selected) hovered.scale.setScalar(1);
      hovered = obj;
      hovered.scale.setScalar(1.1);                // 悬停放大
      document.body.style.cursor = 'pointer';
    }
  } else if (hovered) {
    if (hovered !== selected) hovered.scale.setScalar(1);
    hovered = null;
    document.body.style.cursor = 'auto';
  }

  controls.update();
  renderer.render(scene, camera);
});
```

## 5. Raycaster 进阶

```js
// 只对特定图层检测（配合 layers）
raycaster.layers.set(1);

// 设置检测距离范围
raycaster.near = 0;
raycaster.far = 100;

// Points / Line 的检测阈值
raycaster.params.Points.threshold = 0.1;
raycaster.params.Line.threshold = 0.1;

// 手动射线（不用相机）
raycaster.set(originVec3, directionVec3.normalize());

// 检测与平面交点（做拖拽放置）
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const target = new THREE.Vector3();
raycaster.ray.intersectPlane(plane, target);
```

## 6. 拖拽放置物体（Raycaster + Plane）

```js
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y=0 水平面
const hitPoint = new THREE.Vector3();

renderer.domElement.addEventListener('pointermove', (e) => {
  updatePointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
    if (isDragging) dragMesh.position.copy(hitPoint);
  }
});
```

## 7. 性能优化

- 把可拾取物体放进**专门数组**，只对它们 `intersectObjects`，别整个 `scene.children`。
- 复杂模型用**包围盒**做粗筛，或给模型加简化的碰撞代理（不可见 Box）。
- 高频拾取（pointermove）可节流到每帧一次（放在渲染循环里而非事件里）。

## 8. 一句话总结

> `OrbitControls` 靠 `target` + `enableDamping`/`autoRotate`（都要求每帧 `update()`），`minDistance`/`maxPolarAngle` 限制范围；`Raycaster` 用 NDC 坐标 `setFromCamera` 后 `intersectObjects` 拾取，配合 `Plane` 做拖拽放置。拾取只针对白名单数组并节流。
