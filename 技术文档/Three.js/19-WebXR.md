# 19. WebXR（VR / AR）

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org `Addons → WEBXR` 分类：ARButton / VRButton / XRButton / XRControllerModelFactory / XRHandModelFactory / XREstimatedLight / XRPlanes / OculusHandModel / XRControllerModel；API 名录经官网抓取确认）
> 关联：`07-相机与坐标系.md`、`11-交互Controls与Raycaster.md`

## 1. WebXR 是什么

WebXR Device API 让网页访问 **VR 头显**（Quest、Vision Pro、SteamVR）与 **AR**（手机 ARCore/ARKit、Hololens）。Three.js 通过 `WebXRManager` 封装。

**VR** = 完全沉浸式虚拟场景；**AR** = 把虚拟物体叠加到真实摄像头画面上。

## 2. 最快上手：三行开启

```js
import { VRButton } from 'three/addons/webxr/VRButton.js';

renderer.xr.enabled = true;                       // ① 启用 XR
document.body.appendChild(VRButton.createButton(renderer));  // ② 加进入按钮

renderer.setAnimationLoop(animate);               // ③ 必须用 setAnimationLoop
function animate() {
  renderer.render(scene, camera);                 // xr 模式下自动渲染到头显
}
```

> ⚠️ **必须用 `renderer.setAnimationLoop()` 而非 `requestAnimationFrame()`**——XR 有自己的帧循环节奏。

**按钮类型**：

| 按钮 | 用途 |
|------|------|
| `VRButton` | 进入 VR（头显） |
| `ARButton` | 进入 AR（透视摄像头） |
| `XRButton` | 通用，自动选择 |

## 3. 完整例子：VR 场景 + 双手柄射线交互

```js
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x505050);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 3);      // 1.6m ≈ 人眼高度

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
renderer.xr.enabled = true;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// ---- 环境 ----
const room = new THREE.Mesh(
  new THREE.BoxGeometry(6, 3, 6),
  new THREE.MeshStandardMaterial({ color: 0x808080, side: THREE.BackSide })
);
room.position.y = 1.5;
room.receiveShadow = true;
scene.add(room);

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(2, 4, 2);
light.castShadow = true;
scene.add(light);

// ---- 可抓取的方块 ----
const cubes = [];
const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
colors.forEach((c, i) => {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.2, 0.2),
    new THREE.MeshStandardMaterial({ color: c })
  );
  cube.position.set(-0.6 + i * 0.4, 1.2, -1);
  cube.castShadow = true;
  scene.add(cube);
  cubes.push(cube);
});

// ---- 双手柄 ----
const controllerModelFactory = new XRControllerModelFactory();
const controllers = [];

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  controller.addEventListener('connected', (e) => {
    controller.userData.isXRInput = e.data.targetRayMode !== 'gaze';
  });
  scene.add(controller);

  // 手柄模型
  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  // 射线指示线
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  line.name = 'line';
  line.scale.z = 5;
  controller.add(line);

  controllers.push(controller);
}

// ---- 抓取逻辑 ----
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
let grabbed = [null, null];   // 每个手柄抓的物体

function onSelectStart(event) {
  const controller = event.target;
  const intersections = getIntersections(controller);
  if (intersections.length > 0) {
    const object = intersections[0].object;
    const idx = controllers.indexOf(controller);
    // 把手柄的世界变换应用到物体
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    object.matrix.premultiply(tempMatrix);
    object.matrix.decompose(object.position, object.quaternion, object.scale);
    controller.attach(object);      // attach 保留世界变换
    grabbed[idx] = object;
  }
}

function onSelectEnd(event) {
  const controller = event.target;
  const idx = controllers.indexOf(controller);
  if (grabbed[idx]) {
    scene.attach(grabbed[idx]);     // 放回场景（保留世界位置）
    grabbed[idx] = null;
  }
}

function getIntersections(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
  return raycaster.intersectObjects(cubes, false);
}

renderer.setAnimationLoop(() => {
  renderer.render(scene, camera);
});
```

**关键 API**：

- `renderer.xr.getController(i)` — 获取第 i 个手柄（用于射线/抓取）。
- `renderer.xr.getControllerGrip(i)` — 手柄握持位姿（用于挂模型）。
- 事件：`selectstart` / `selectend` / `squeezestart` / `connected` / `disconnected`。
- `controller.attach(obj)` — 把物体挂到手柄，**保留世界变换**。

## 4. AR（透视 + 平面检测）

```js
import { ARButton } from 'three/addons/webxr/ARButton.js';

renderer.xr.enabled = true;
document.body.appendChild(ARButton.createButton(renderer, {
  requiredFeatures: ['hit-test'],        // 命中检测（放物体到地面）
  optionalFeatures: ['dom-overlay', 'light-estimation'],
  domOverlay: { root: document.getElementById('ui') },
}));
```

### 命中检测（把物体放到真实地面）

```js
let hitTestSource = null;
let hitTestSourceRequested = false;
const reticle = new THREE.Mesh(
  new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 })
);
reticle.visible = false;
scene.add(reticle);

renderer.setAnimationLoop((timestamp, frame) => {
  if (frame) {
    const referenceSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();

    // 首次请求 hit test source
    if (!hitTestSourceRequested) {
      session.requestReferenceSpace('viewer').then((space) => {
        session.requestHitTestSource({ space }).then((src) => {
          hitTestSource = src;
        });
      });
      session.addEventListener('end', () => { hitTestSourceRequested = false; hitTestSource = null; });
      hitTestSourceRequested = true;
    }

    // 每帧取命中结果，摆放光标
    if (hitTestSource) {
      const results = frame.getHitTestResults(hitTestSource);
      if (results.length > 0) {
        const pose = results[0].getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
  }

  renderer.render(scene, camera);
});

// 点击屏幕：在光标处放物体
controller = renderer.xr.getController(0);
controller.addEventListener('select', () => {
  if (reticle.visible) {
    const obj = new THREE.Mesh(boxGeo, boxMat);
    obj.position.setFromMatrixPosition(reticle.matrix);
    scene.add(obj);
  }
});
```

**AR 常用 session feature**：

| Feature | 作用 |
|---------|------|
| `hit-test` | 射线与真实平面求交（放物体） |
| `dom-overlay` | 在 AR 画面上叠 HTML UI |
| `light-estimation` | 获取环境光照，让虚拟物体光照匹配真实 |
| `anchors` | 空间锚点（物体固定不飘） |
| `plane-detection` | 检测桌面/墙面（配 `XRPlanes`） |
| `depth-sensing` | 深度感知（遮挡） |
| `hand-tracking` | 手部追踪（配 `XRHandModelFactory`） |

## 5. 手部追踪

```js
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

const handModelFactory = new XRHandModelFactory();

const hand = renderer.xr.getHand(0);
hand.add(handModelFactory.createHandModel(hand, 'mesh'));   // 'mesh' | 'spheres' | 'boxes'
scene.add(hand);

// 捏合检测
hand.addEventListener('pinchstart', () => console.log('捏合开始'));
hand.addEventListener('pinchend',   () => console.log('捏合结束'));
```

## 6. 参考空间与移动

```js
// 参考空间类型
renderer.xr.setReferenceSpaceType('local-floor');   // 默认：地面为 y=0，有高度
// 其他：'local'（无地面高度）、'viewer'（相对头部）、'unbounded'（大空间）

// 让玩家（相机）前后移动：移动一个包住相机的 Group
const player = new THREE.Group();
player.add(camera);
scene.add(player);

// 手柄摇杆输入移动
function handleMove(controller, dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const source of session.inputSources) {
    const axes = source.gamepad?.axes;
    if (axes && source.handedness === 'left') {
      const x = axes[2], z = axes[3];
      // 按相机朝向移动
      const dir = new THREE.Vector3(x, 0, z).applyQuaternion(camera.quaternion);
      player.position.addScaledVector(dir, dt * 1.5);
    }
  }
}
```

## 7. 兼容与调试

| 问题 | 解决 |
|------|------|
| 无法进入 VR | 需 **HTTPS**（或 localhost）+ 支持 WebXR 的浏览器 |
| 桌面调试 | Chrome 装 **WebXR API Emulator** 插件模拟头显 |
| 帧率不足 | VR 要求 72/90/120fps；降多边形、关后处理、用 `renderer.xr.setFoveation()` |
| 晕动症 | 保持高帧率、避免相机被强制移动、提供固定参考物 |

```js
// 注视点渲染（周边降分辨率提性能）
renderer.xr.setFoveation(0.7);   // 0=关，1=最强
```

## 8. 一句话总结

> WebXR：`renderer.xr.enabled = true` + `VRButton`/`ARButton` + **`setAnimationLoop`**；手柄用 `getController(i)`（射线抓取，靠 `controller.attach` 保留变换）与 `getControllerGrip(i)`（挂模型）；AR 靠 `hit-test` 把物体放到真实平面，`light-estimation` 匹配光照；必须 HTTPS，桌面用 WebXR Emulator 调试。
