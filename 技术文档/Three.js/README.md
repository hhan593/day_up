# Three.js 学习路线与知识点全景

> 整理日期：2026-08-14 ｜ 参考：Three.js 官方文档 / Three.js Journey / 掘金·51CTO·CSDN 社区 / 2025–2026 前端 3D 技术全景
>
> 本文档为 Markdown 拆分版（原 HTML 版见同目录 `threejs-learning-roadmap.html`）。按「四阶段学习路线 + 资源」拆分为 5 个文件，便于分主题阅读。

一份从"渲染第一个立方体"到"WebGPU / WebXR 工业级应用"的系统化路线图，涵盖核心概念、阶段目标、实战项目与权威学习资源。

## 目录

### 学习路线（01-05，概览向）

- [01 基础入门](./01-基础入门.md) — 三大对象、场景图、坐标系、动画循环
- [02 核心功能](./02-核心功能.md) — 光照与阴影、纹理贴图、模型加载、交互
- [03 进阶实战](./03-进阶实战.md) — GLSL 着色器、后期处理、粒子、性能优化
- [04 高级前沿](./04-高级前沿.md) — WebGPU / TSL、WebXR、物理引擎、R3F
- [05 学习资源与实战](./05-学习资源与实战.md) — 资源清单、项目梯度、避坑调试

### 系统化知识点（06-17，API 详解 + 大量可运行例子）

| 编号 | 文档 | 主题 |
|------|------|------|
| 06 | [场景图与 Object3D 变换](./06-场景图与Object3D变换.md) | 父子变换、太阳系例子、traverse、世界/局部坐标、Group |
| 07 | [相机、坐标系与投影](./07-相机与坐标系.md) | 右手系、Perspective/Orthographic/CubeCamera、resize、Frustum |
| 08 | [几何体与 BufferGeometry](./08-几何体与BufferGeometry.md) | 21 种内置几何体、BufferAttribute、索引、动态波浪、merge |
| 09 | [材质与纹理详解](./09-材质与纹理详解.md) | 12 种材质、PBR、色彩空间、PMREM 环境贴图、透明混合 |
| 10 | [光照与阴影](./10-光照与阴影.md) | 7 种光源、阴影三开关、阴影相机/bias、色调映射 |
| 11 | [交互：Controls 与 Raycaster](./11-交互Controls与Raycaster.md) | OrbitControls 源码级属性表、Raycaster 拾取、拖拽放置 |
| 12 | [动画系统](./12-动画系统.md) | delta time、lerp/damp、KeyframeTrack、AnimationMixer、glTF 动画切换 |
| 13 | [后期处理 EffectComposer](./13-后期处理EffectComposer.md) | RenderPass/OutputPass、Bloom、OutlinePass、自定义 ShaderPass、MSAA |
| 14 | [着色器 GLSL 与 ShaderMaterial](./14-着色器GLSL与ShaderMaterial.md) | 渲染管线、顶点/片元、noise 波纹球、onBeforeCompile、GLSL 速查 |
| 15 | [WebGPU 与 TSL](./15-WebGPU与TSL.md) | WebGPURenderer 官方手册要点、importmap、TSL 节点、新后处理栈 |
| 16 | [性能优化与调试](./16-性能优化与调试.md) | renderer.info、InstancedMesh 星域、BatchedMesh、LOD、dispose、调试助手 |
| 17 | [模型加载与 glTF 生态](./17-模型加载与glTF生态.md) | GLTFLoader、DRACO/KTX2/Meshopt、LoadingManager、GLTFExporter |
| 18 | [粒子系统与 Points](./18-粒子系统与Points.md) | Points/PointsMaterial、ShaderMaterial 星云、Sprite、CSS2DRenderer |
| 19 | [WebXR（VR/AR）](./19-WebXR.md) | VRButton/ARButton、手柄抓取、hit-test 放置、手部追踪、setFoveation |
| 20 | [物理引擎集成](./20-物理引擎集成.md) | Rapier 箱子堆叠、RigidBody/Collider、固定步长、碰撞事件、Raycast |
| 21 | [React Three Fiber](./21-React-Three-Fiber.md) | Canvas/args/useFrame/事件、drei 速查、产品展示例子、Next.js 集成 |
| 22 | [综合实战案例](./22-综合实战案例.md) | 产品展示 / 数据大屏（飞线地球）/ 全景看房（热点跳转） |

## 为什么学 Three.js

- **它解决什么问题**：原生 WebGL 需要手写着色器、管理缓冲区和渲染管线，门槛极高。Three.js 提供 `Scene / Camera / Renderer` 三件套、丰富的几何体/材质/光照，以及 `GLTFLoader`、`EffectComposer`、`OrbitControls` 等开箱即用能力。
- **典型应用场景**：电商 3D 商品展示、数据可视化大屏、数字孪生、在线 3D 编辑器、虚拟展厅、网页小游戏，以及 VR/AR（WebXR）沉浸式体验。某品牌 3D 展示使转化率提升 45%、退货率降低 30%。
- **技术定位正在升级**：从 r171（2025）起 `WebGPURenderer` 进入生产可用，r182 起作为推荐渲染器；TSL（Three Shading Language）让同一份着色器同时编译到 WebGL 与 WebGPU。Three.js 正从"3D 库"演变为"轻量级 3D 引擎"。
- **前置知识**：扎实的 JavaScript（ES Module）、基础 HTML/CSS，以及对线性代数/坐标变换的直觉；图形学基础非必须，但理解渲染管线（顶点→光栅化→片元）会事半功倍。

## 整体学习路线图

| 阶段 | 时长 | 核心目标 |
| --- | --- | --- |
| ① 基础入门 | 第 1–2 周 | 场景图与三大对象、右手坐标系/相机、基础几何体与材质、第一个动画循环 |
| ② 核心功能 | 第 3–5 周 | 光照与阴影、纹理/UV 贴图、模型加载（glTF）、交互 Raycaster |
| ③ 进阶实战 | 第 6–10 周 | GLSL 着色器、后期处理、粒子系统、性能优化 |
| ④ 高级前沿 | 第 11 周+ | WebGPU / TSL、WebXR（VR/AR）、物理引擎、R3F 工程化 |

建议按"基础 → 核心 → 进阶 → 前沿"四阶段推进，全程保持编码实践（每周 ≥ 15 小时）。遇到瓶颈可研读源码 `src/renderers/WebGLRenderer.js`。

## 版本演进要点（2025–2026）

- r171（2025）起 `WebGPURenderer` 生产可用；r182 起作为推荐渲染器。
- 新项目可直接 `import { WebGPURenderer } from 'three/webgpu'`，不支持 WebGPU 的浏览器自动 fallback 到 WebGL2。
- TSL 让"写一次着色器"同时编译到 GLSL 与 WGSL，是未来自定义着色器的首选方式。

---

## 06–17 系统化篇目的来源说明

新增的 06–17 篇按来源可信度分层标注，均写在各篇开头：

| 可信度 | 说明 | 涉及篇目 |
|--------|------|---------|
| **完整正文级** | 官方文档/源码原文抓取，内容逐字可核对 | 11（OrbitControls.js 官方源码 JSDoc）、15（官方中文手册 webgpurenderer.html 全文） |
| **官方 API 名录确认** | threejs.org 官方 API 分类名录（Core/Materials/Geometries/Lights/Objects/Addons/TSL/WEBXR/PHYSICS 等）经抓取确认，配合标准实践撰写 | 06–10、12–14、16–22 |
| **社区权威** | 非 three.js 官方的成熟生态（R3F / drei），已明确标注来源 | 21 |

> 说明：threejs.org 文档站为单页应用（SPA），`web_fetch` 只能取到侧边栏 API 名录而非具体页正文。因此采用"**官方 API 名录确认 + 标准实践**"方式撰写，并在需要正文的两篇改为抓取 GitHub 官方源码与 static manual 页，确保内容可靠、不臆造。

## 目录状态

`技术文档/Three.js` 共 **22 篇**（5 篇学习路线 + 17 篇系统化知识点），另有 `Three.js 通关秘籍/` 子目录 144 篇细分笔记。

建议阅读顺序：

1. **建立全局观**：先读 01–05 学习路线。
2. **打基础**：06 场景图 → 07 相机 → 08 几何体 → 09 材质纹理。
3. **做效果**：10 光照阴影 → 11 交互 → 12 动画 → 13 后期处理。
4. **进阶**：14 着色器 → 15 WebGPU/TSL。
5. **扩展能力**：18 粒子 → 19 WebXR → 20 物理引擎 → 21 R3F（React 项目）。
6. **上生产**：16 性能优化 → 17 模型生态 → 22 综合实战。
