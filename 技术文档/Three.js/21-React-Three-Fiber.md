# 21. React Three Fiber（R3F）

> 来源可信度：**社区权威**（React Three Fiber 由 Poimandres 维护，非 three.js 官方；基于 R3F v9 / React 19、drei、官方文档结构）
> 前置：`技术文档/react`（React 基础）、本文档集 01-17
> 关联：`11-交互Controls与Raycaster.md`、`12-动画系统.md`

## 1. R3F 是什么

**React Three Fiber** 是 Three.js 的 **React 渲染器**（renderer）：用 JSX 声明式地描述 Three.js 场景。

```jsx
// 命令式（原生 Three.js）
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 'orange' })
);
scene.add(mesh);

// 声明式（R3F）
<mesh>
  <boxGeometry args={[1, 1, 1]} />
  <meshStandardMaterial color="orange" />
</mesh>
```

**核心映射规则**：Three.js 的类名首字母小写即 JSX 标签（`Mesh` → `<mesh>`），构造参数用 `args`。

```bash
npm i three @react-three/fiber @react-three/drei
```

> `@react-three/drei` 是官方生态的辅助库，提供 `OrbitControls`、`Environment`、`Text`、`useGLTF` 等大量封装。

## 2. 最小例子

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function Box() {
  return (
    <mesh rotation={[0.5, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [3, 3, 3], fov: 50 }} shadows>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} castShadow />
      <Box />
      <OrbitControls enableDamping />
    </Canvas>
  );
}
```

`<Canvas>` 自动创建 `Scene`、`WebGLRenderer`、默认相机、渲染循环、resize 处理——**无需手写样板代码**。

## 3. 核心概念

### 3.1 属性与 args

```jsx
// position/rotation/scale 可用数组
<mesh position={[1, 2, 3]} rotation={[0, Math.PI / 2, 0]} scale={1.5} />

// 构造参数用 args（改变 args 会重建对象！）
<sphereGeometry args={[1, 32, 32]} />

// 点语法设置嵌套属性
<meshStandardMaterial color="red" metalness={0.8} roughness={0.2} />
<directionalLight position={[5, 5, 5]} castShadow shadow-mapSize={[2048, 2048]} />
```

### 3.2 事件（内置 Raycaster）

```jsx
function InteractiveBox() {
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  return (
    <mesh
      onClick={(e) => setActive(!active)}                  // 点击
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onPointerMove={(e) => console.log(e.point)}           // 世界坐标交点
      scale={active ? 1.5 : 1}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}
```

R3F **自动处理 Raycaster**，无需自己写 `setFromCamera`。事件对象 `e` 含 `point`、`distance`、`face`、`object`、`instanceId` 等。

### 3.3 useFrame（每帧回调）

```jsx
import { useFrame } from '@react-three/fiber';

function SpinningBox() {
  const meshRef = useRef();

  useFrame((state, delta) => {
    // state: { clock, camera, scene, mouse, raycaster, ... }
    // delta: 距上一帧秒数
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry />
      <meshStandardMaterial color="royalblue" />
    </mesh>
  );
}
```

> 用 `delta` 保证帧率无关（与 `12-动画系统.md` 同一原则）。

### 3.4 useThree（访问全局状态）

```jsx
import { useThree } from '@react-three/fiber';

function CameraInfo() {
  const { camera, gl, scene, size, viewport } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;   // gl = renderer
  }, [gl]);

  return null;
}
```

## 4. 完整例子：交互式产品展示

```jsx
import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';

// ---- 加载模型 ----
function Model({ color }) {
  const { scene } = useGLTF('/models/shoe.glb');

  // 遍历改材质颜色
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.name.includes('body')) {
        child.material.color.set(color);
      }
    });
  }, [scene, color]);

  return <primitive object={scene} />;
}

// ---- 自动旋转平台 ----
function Turntable({ children }) {
  const group = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (!hovered) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {children}
    </group>
  );
}

// ---- 主应用 ----
export default function ProductViewer() {
  const [color, setColor] = useState('#ff5533');
  const presetColors = ['#ff5533', '#3355ff', '#33ff88', '#222222', '#ffffff'];

  return (
    <div style={{ height: '100vh' }}>
      {/* HTML UI 叠在 canvas 上 */}
      <div style={{ position: 'absolute', zIndex: 1, padding: 20 }}>
        {presetColors.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              background: c, width: 32, height: 32, margin: 4,
              border: c === color ? '2px solid white' : 'none',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>

      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 2]}                                   // 限制像素比
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        <Suspense fallback={null}>
          <Turntable>
            <Model color={color} />
          </Turntable>
          <Environment preset="studio" />              {/* HDR 环境光 */}
        </Suspense>

        <ContactShadows
          position={[0, -1, 0]} opacity={0.6} scale={10}
          blur={2} far={4}
        />

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

// 预加载
useGLTF.preload('/models/shoe.glb');
```

## 5. drei 常用组件速查

| 组件 | 作用 |
|------|------|
| `OrbitControls` / `MapControls` | 相机控制 |
| `Environment` | HDR 环境贴图（`preset` 或自定义文件） |
| `ContactShadows` | 接触阴影（比真实阴影便宜） |
| `useGLTF` / `useTexture` | 加载模型/纹理（带 Suspense 缓存） |
| `Text` / `Text3D` | 3D 文字 |
| `Html` | 在 3D 场景中嵌 HTML（类似 `CSS2DRenderer`） |
| `Float` | 漂浮动画 |
| `RoundedBox` | 圆角盒子 |
| `MeshTransmissionMaterial` | 玻璃/透射材质 |
| `Sparkles` | 粒子闪光 |
| `Sky` / `Stars` | 天空/星空 |
| `PerformanceMonitor` | 自适应降质 |
| `Bvh` | 加速 Raycaster 拾取 |
| `AccumulativeShadows` | 高质量烘焙阴影 |

## 6. 性能优化

```jsx
// ① 实例化：大量重复物体
import { Instances, Instance } from '@react-three/drei';

<Instances limit={1000} range={500}>
  <boxGeometry />
  <meshStandardMaterial />
  {positions.map((p, i) => <Instance key={i} position={p} />)}
</Instances>

// ② 按需渲染（静止场景省电）
<Canvas frameloop="demand">
  {/* 需要时调用 invalidate() */}
</Canvas>

// ③ 自适应降级
<PerformanceMonitor onDecline={() => setDpr(1)} />
<AdaptiveDpr pixelated />

// ④ 复用来避免重建
const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
<mesh geometry={geometry} />
```

> ⚠️ 改变 `args` 会**销毁并重建**对象，热路径要避免。用 `useMemo` 缓存 geometry/material。

## 7. R3F vs 原生 Three.js

| | R3F | 原生 Three.js |
|---|-----|--------------|
| 代码风格 | 声明式 JSX | 命令式 |
| 状态管理 | React state/store | 手动 |
| 生态复用 | React 生态（Redux/zustand/React Query） | 需自己整合 |
| 渲染开销 | 略高（React reconciler） | 最低 |
| 学习成本 | 需懂 React + Three.js | 只需 Three.js |
| 适合 | React 项目、复杂交互 UI | 纯 3D、极致性能、非 React 项目 |

**建议**：项目已是 React/Next.js → R3F；纯 3D 展示/游戏/非 React 栈 → 原生。

## 8. 与 Next.js 集成

R3F 是客户端组件，Next.js App Router 需加 `'use client'` 并动态导入（避免 SSR 报错）：

```jsx
'use client';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('./Scene'), {
  ssr: false,                                  // 3D 场景不服务端渲染
  loading: () => <p>Loading...</p>,
});

export default function Page() {
  return <Scene />;
}
```

## 9. 一句话总结

> R3F 是 Three.js 的 React 渲染器：`<Canvas>` 自动建场景/渲染器/循环，JSX 标签对应 Three.js 类、`args` 传构造参数、`useFrame` 跑每帧逻辑、事件自动 Raycaster；配 drei（OrbitControls / Environment / useGLTF / ContactShadows）效率倍增；注意 `args` 变更会重建对象、用 `useMemo` 缓存。
