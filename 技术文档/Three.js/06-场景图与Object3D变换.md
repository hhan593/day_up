# 06. 场景图与 Object3D 变换

> 来源可信度：**官方 API 名录确认 + 标准实践**（基于 threejs.org 官方 API 目录 `Core/Object3D`、`Core/Group`；API 名录经官网抓取确认）
> 关联：`01-基础入门.md`（三大对象）

## 1. 场景图是什么

场景图（Scene Graph）是一棵**树**：`Scene` 是根，子节点可以是 `Mesh`、`Light`、`Camera`、`Group`，每个子节点又可以有自己的子节点。

```
Scene
 ├─ Camera
 ├─ AmbientLight
 └─ Group (robot)
     ├─ Mesh (body)
     └─ Group (arm)
         └─ Mesh (hand)
```

**核心语义**：子对象的变换（`position` / `rotation` / `scale`）是**相对于父对象**的。移动父 Group，所有子对象跟着动。

## 2. Object3D 三件套

```js
import * as THREE from 'three';

const obj = new THREE.Object3D();

// 位置（局部坐标）
obj.position.set(1, 2, 3);
obj.position.x += 0.1;

// 旋转（欧拉角，弧度）
obj.rotation.set(0, Math.PI / 2, 0);
obj.rotation.y += 0.01;

// 缩放
obj.scale.set(2, 2, 2);
obj.scale.multiplyScalar(1.1);
```

> 注意：角度单位是**弧度**，`Math.PI / 180 * deg` 或 `THREE.MathUtils.degToRad(90)` 转换。

## 3. 完整例子：太阳系（父子变换）

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 15, 25);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// --- 太阳（父）---
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(2, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0xffaa33 })
);
scene.add(sun);

// --- 地球（太阳的子）：绕太阳公转 ---
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.8, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x2266ff })
);
earth.position.x = 8;          // 轨道半径
sun.add(earth);                // 关键：作为 sun 的子节点

// --- 月球（地球的子）：绕地球转 ---
const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xcccccc })
);
moon.position.x = 2;           // 相对地球
earth.add(moon);               // 嵌套：sun -> earth -> moon

scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const light = new THREE.PointLight(0xffffff, 200);
scene.add(light);

function animate() {
  requestAnimationFrame(animate);
  sun.rotation.y += 0.005;     // 父转动，子自动跟随
  earth.rotation.y += 0.02;    // 自转（局部）
  renderer.render(scene, camera);
}
animate();
```

**要点**：只需 `sun.rotation.y += ...`，地球和月球自动绕日公转——这就是场景图的威力。

## 4. 常用方法与属性

| 成员 | 说明 |
|------|------|
| `add(...objs)` | 添加子对象（自动从原父节点移除） |
| `remove(obj)` | 移除子对象 |
| `traverse(cb)` | 递归遍历所有后代 |
| `getObjectByName(name)` | 按 `name` 查找 |
| `visible` | 是否渲染（false 则整棵子树不渲染） |
| `layers` | 图层，配合 camera.layers 做选择性渲染 |
| `userData` | 自定义数据挂载点（不要污染对象本身） |
| `up` | 上方向，默认 `(0,1,0)` |
| `matrixAutoUpdate` | 默认 true，每帧自动重算矩阵；静态物体设 false 省性能 |

## 5. 遍历与查找

```js
// 递归遍历：给所有 Mesh 换材质
scene.traverse((child) => {
  if (child.isMesh) {
    child.castShadow = true;
    child.receiveShadow = true;
  }
});

// 按名字查找
const target = scene.getObjectByName('hand');
target.position.y = 5;
```

## 6. 局部坐标 ↔ 世界坐标

```js
// 局部 → 世界
mesh.updateMatrixWorld();  // 确保矩阵最新
const worldPos = new THREE.Vector3();
mesh.getWorldPosition(worldPos);

// 世界 → 局部
const localPos = mesh.worldToLocal(new THREE.Vector3(1, 2, 3));

// 把一个子对象挂到另一个父节点但保持世界位置不变
scene.attach(mesh);   // attach 保留世界变换（add 会重置为局部）
```

## 7. Group 的作用

```js
const car = new THREE.Group();
car.add(body, wheel1, wheel2, wheel3, wheel4);
car.position.y = 1;   // 整车一起抬升
scene.add(car);
```

`Group` 本身不可见，纯粹用于**逻辑分组 + 统一变换**。是组织复杂模型的标准做法。

## 8. 性能提示

- 静态不变的对象：`obj.matrixAutoUpdate = false; obj.updateMatrix();`（见 `16-性能优化.md`）
- 深层级场景图会增加矩阵计算量，尽量扁平。
- 大量同构物体用 `InstancedMesh` 而非多个 `Group`（见 `16`）。

## 9. 一句话总结

> 场景图是一棵树，子对象变换相对父对象；`add` 建父子、`attach` 保世界坐标、`traverse` 递归遍历、`getWorldPosition` 取世界坐标。用 `Group` 分组统一变换，静态物体关掉 `matrixAutoUpdate`。
