# Local-First 实时协作空间 — 技术实现细节

## 目录

1. [CRDT 与 Yjs 核心原理](#1-crdt-与-yjs-核心原理)
2. [前端画布引擎实现](#2-前端画布引擎实现)
3. [离线存储与本地持久化](#3-离线存储与本地持久化)
4. [WebSocket 实时同步层](#4-websocket-实时同步层)
5. [NestJS 后端架构](#5-nestjs-后端架构)
6. [认证与权限系统](#6-认证与权限系统)
7. [版本历史与快照](#7-版本历史与快照)
8. [性能优化策略](#8-性能优化策略)
9. [部署架构](#9-部署架构)

---

## 1. CRDT 与 Yjs 核心原理

### 1.1 为什么选 CRDT 而不是 OT

| 对比维度 | OT (Operational Transform) | CRDT (Conflict-free Replicated Data Type) |
|---------|---------------------------|------------------------------------------|
| 代表产品 | Google Docs | Figma, Excalidraw |
| 服务端依赖 | 需要中心服务器做变换计算 | 不依赖服务端，P2P 即可 |
| 离线支持 | 困难，需重连后回放 | 天然支持，合并无冲突 |
| 实现复杂度 | 变换函数组合爆炸 | 数据结构本身保证一致性 |
| 适合场景 | 纯文本协作 | 富文本 + 图形 + 结构化数据 |

**结论**：Local-First 架构下，CRDT 是唯一合理选择。

### 1.2 Yjs 核心数据结构

Yjs 提供的共享类型直接映射到我们的业务模型：

```typescript
import * as Y from 'yjs'

// 创建一个 Yjs 文档 —— 这就是协作的核心单元
const ydoc = new Y.Doc()

// Y.Map → 对应一个图形元素
// Y.Array → 对应图层中的元素列表
// Y.Text → 对应文本节点的内容

// 画布上的所有图形元素
const yElements = ydoc.getMap<Y.Map<any>>('elements')

// 图层顺序
const yLayers = ydoc.getArray<string>('layers')

// 页面元信息
const yMeta = ydoc.getMap<any>('meta')
```

### 1.3 元素数据模型设计

```typescript
// 单个图形元素的数据结构
interface CanvasElement {
  id: string                    // 唯一标识 (nanoid)
  type: 'rectangle' | 'ellipse' | 'arrow' | 'text' | 'freehand' | 'image'

  // 几何属性
  x: number
  y: number
  width: number
  height: number
  rotation: number              // 弧度

  // 样式属性
  style: {
    strokeColor: string
    fillColor: string
    strokeWidth: number
    opacity: number
    fontSize?: number
    fontFamily?: string
  }

  // 连线专用
  points?: Array<{ x: number; y: number }>
  startBinding?: { elementId: string; anchor: number }
  endBinding?: { elementId: string; anchor: number }

  // 文本内容（Y.Text 引用）
  text?: string

  // 元数据
  layerIndex: number
  locked: boolean
  createdBy: string
  createdAt: number
  updatedAt: number
}
```

### 1.4 Yjs 操作示例：增删改如何产生增量同步

```typescript
// ✅ 添加元素
function addElement(ydoc: Y.Doc, element: CanvasElement) {
  const yElements = ydoc.getMap('elements')
  const yElement = new Y.Map()

  // 使用 transact 包裹，保证原子性
  ydoc.transact(() => {
    Object.entries(element).forEach(([key, value]) => {
      yElement.set(key, value)
    })
    yElements.set(element.id, yElement)
  })
}

// ✅ 修改元素（只传增量字段）
function updateElement(ydoc: Y.Doc, id: string, updates: Partial<CanvasElement>) {
  const yElements = ydoc.getMap('elements')
  const yElement = yElements.get(id) as Y.Map<any>

  if (!yElement) return

  ydoc.transact(() => {
    Object.entries(updates).forEach(([key, value]) => {
      yElement.set(key, value)
    })
    yElement.set('updatedAt', Date.now())
  })
}

// ✅ 删除元素
function deleteElement(ydoc: Y.Doc, id: string) {
  const yElements = ydoc.getMap('elements')
  yElements.delete(id)
}

// ✅ 监听变更 → 驱动 UI 重绘
function observeChanges(ydoc: Y.Doc, onUpdate: (elements: Map<string, any>) => void) {
  const yElements = ydoc.getMap('elements')

  yElements.observeDeep((events) => {
    // 每次有任何变更（本地或远程），这里都会触发
    const allElements = new Map<string, any>()
    yElements.forEach((value, key) => {
      allElements.set(key, (value as Y.Map<any>).toJSON())
    })
    onUpdate(allElements)
  })
}
```

### 1.5 冲突解决：CRDT 如何保证一致性

```
场景：用户 A 和用户 B 同时修改同一个矩形的颜色

时间线：
  T1: A 离线，将矩形改为红色     → Y.Map.set('fillColor', 'red')
  T2: B 离线，将矩形改为蓝色     → Y.Map.set('fillColor', 'blue')
  T3: 两人同时上线，Yjs 自动合并

合并规则（Yjs 的 Last-Writer-Wins Register）：
  - 每个操作都带有 (clientID, clock) 的逻辑时钟
  - 对同一个 key 的并发写入，clientID 更大的胜出
  - 结果确定性地收敛到同一个值（所有客户端一致）

⚠️ 注意：Y.Map 的 LWW 语义意味着"最后写入的字段覆盖之前的"
   如果需要更细粒度的合并（比如文本），应使用 Y.Text
```

---

## 2. 前端画布引擎实现

### 2.1 渲染方案选型

```
方案对比：

┌──────────┬────────────┬────────────┬────────────┐
│          │  SVG       │ Canvas 2D  │  WebGL     │
├──────────┼────────────┼────────────┼────────────┤
│ 元素 <500 │ ✅ 最优    │ ✅ 良好     │ ❌ 过度    │
│ 500-5000 │ ⚠️ 卡顿   │ ✅ 最优     │ ✅ 良好    │
│ >5000    │ ❌ 不可用  │ ⚠️ 需优化   │ ✅ 最优    │
│ 交互事件  │ ✅ 原生DOM │ ❌ 需自研   │ ❌ 需自研  │
│ 文本渲染  │ ✅ 原生    │ ⚠️ 较弱    │ ❌ 困难    │
│ 学习价值  │ 低         │ ★★★★       │ ★★★★★    │
└──────────┴────────────┴────────────┴────────────┘

推荐：Canvas 2D 起步，学习价值最高，后期可渐进升级到 WebGL
```

### 2.2 画布核心类设计

```typescript
// canvas/CanvasEngine.ts

interface Viewport {
  offsetX: number    // 画布平移 X
  offsetY: number    // 画布平移 Y
  zoom: number       // 缩放比例 (0.1 ~ 5.0)
}

class CanvasEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private viewport: Viewport = { offsetX: 0, offsetY: 0, zoom: 1 }
  private elements: Map<string, CanvasElement> = new Map()
  private rafId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.setupHiDPI()
  }

  // 高清屏适配
  private setupHiDPI() {
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.ctx.scale(dpr, dpr)
    this.canvas.style.width = `${rect.width}px`
    this.canvas.style.height = `${rect.height}px`
  }

  // 屏幕坐标 → 画布坐标（核心变换）
  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewport.offsetX) / this.viewport.zoom,
      y: (screenY - this.viewport.offsetY) / this.viewport.zoom,
    }
  }

  // 画布坐标 → 屏幕坐标
  canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    return {
      x: canvasX * this.viewport.zoom + this.viewport.offsetX,
      y: canvasY * this.viewport.zoom + this.viewport.offsetY,
    }
  }

  // 主渲染循环（requestAnimationFrame 驱动）
  private renderLoop = () => {
    this.clear()
    this.applyViewportTransform()
    this.renderGrid()
    this.renderElements()
    this.renderSelections()
    this.renderCursors()
    this.rafId = requestAnimationFrame(this.renderLoop)
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private applyViewportTransform() {
    this.ctx.save()
    this.ctx.translate(this.viewport.offsetX, this.viewport.offsetY)
    this.ctx.scale(this.viewport.zoom, this.viewport.zoom)
  }

  private renderElements() {
    // 按 layerIndex 排序后绘制
    const sorted = [...this.elements.values()]
      .sort((a, b) => a.layerIndex - b.layerIndex)

    for (const element of sorted) {
      this.renderElement(element)
    }
    this.ctx.restore()
  }

  private renderElement(el: CanvasElement) {
    this.ctx.save()
    this.ctx.translate(el.x + el.width / 2, el.y + el.height / 2)
    this.ctx.rotate(el.rotation)
    this.ctx.translate(-(el.width / 2), -(el.height / 2))
    this.ctx.globalAlpha = el.style.opacity

    switch (el.type) {
      case 'rectangle':
        this.drawRectangle(el)
        break
      case 'ellipse':
        this.drawEllipse(el)
        break
      case 'freehand':
        this.drawFreehand(el)
        break
      case 'text':
        this.drawText(el)
        break
      case 'arrow':
        this.drawArrow(el)
        break
    }
    this.ctx.restore()
  }

  private drawRectangle(el: CanvasElement) {
    const { strokeColor, fillColor, strokeWidth } = el.style
    if (fillColor !== 'transparent') {
      this.ctx.fillStyle = fillColor
      this.ctx.fillRect(0, 0, el.width, el.height)
    }
    this.ctx.strokeStyle = strokeColor
    this.ctx.lineWidth = strokeWidth
    this.ctx.strokeRect(0, 0, el.width, el.height)
  }

  private drawEllipse(el: CanvasElement) {
    const cx = el.width / 2
    const cy = el.height / 2
    this.ctx.beginPath()
    this.ctx.ellipse(cx, cy, cx, cy, 0, 0, Math.PI * 2)
    if (el.style.fillColor !== 'transparent') {
      this.ctx.fillStyle = el.style.fillColor
      this.ctx.fill()
    }
    this.ctx.strokeStyle = el.style.strokeColor
    this.ctx.lineWidth = el.style.strokeWidth
    this.ctx.stroke()
  }

  private drawFreehand(el: CanvasElement) {
    if (!el.points || el.points.length < 2) return
    this.ctx.beginPath()
    this.ctx.moveTo(el.points[0].x, el.points[0].y)

    // 使用二次贝塞尔曲线平滑连接点
    for (let i = 1; i < el.points.length - 1; i++) {
      const midX = (el.points[i].x + el.points[i + 1].x) / 2
      const midY = (el.points[i].y + el.points[i + 1].y) / 2
      this.ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, midX, midY)
    }

    this.ctx.strokeStyle = el.style.strokeColor
    this.ctx.lineWidth = el.style.strokeWidth
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.stroke()
  }

  // 启动/销毁
  start() { this.rafId = requestAnimationFrame(this.renderLoop) }
  destroy() { if (this.rafId) cancelAnimationFrame(this.rafId) }
}
```

### 2.3 命中检测（Hit Testing）

```typescript
// canvas/HitTest.ts

class HitTester {
  /**
   * 判断点击位置命中了哪个元素
   * 从上层到下层遍历（后绘制的在上层）
   */
  hitTest(
    point: { x: number; y: number },
    elements: CanvasElement[]
  ): CanvasElement | null {
    // 从上到下遍历（layerIndex 大的在上面）
    const sorted = [...elements].sort((a, b) => b.layerIndex - a.layerIndex)

    for (const el of sorted) {
      if (el.locked) continue
      if (this.isPointInElement(point, el)) {
        return el
      }
    }
    return null
  }

  private isPointInElement(point: { x: number; y: number }, el: CanvasElement): boolean {
    // 将点转换到元素的本地坐标系（考虑旋转）
    const local = this.toLocalCoords(point, el)

    switch (el.type) {
      case 'rectangle':
      case 'text':
      case 'image':
        return this.isPointInRect(local, el.width, el.height)
      case 'ellipse':
        return this.isPointInEllipse(local, el.width / 2, el.height / 2)
      case 'freehand':
        return this.isPointNearPath(point, el.points!, el.style.strokeWidth)
      case 'arrow':
        return this.isPointNearPath(point, el.points!, el.style.strokeWidth + 4)
      default:
        return false
    }
  }

  private toLocalCoords(
    point: { x: number; y: number },
    el: CanvasElement
  ): { x: number; y: number } {
    // 反向旋转变换
    const cx = el.x + el.width / 2
    const cy = el.y + el.height / 2
    const cos = Math.cos(-el.rotation)
    const sin = Math.sin(-el.rotation)
    const dx = point.x - cx
    const dy = point.y - cy
    return {
      x: dx * cos - dy * sin + el.width / 2,
      y: dx * sin + dy * cos + el.height / 2,
    }
  }

  private isPointInRect(p: { x: number; y: number }, w: number, h: number): boolean {
    return p.x >= 0 && p.x <= w && p.y >= 0 && p.y <= h
  }

  private isPointInEllipse(p: { x: number; y: number }, rx: number, ry: number): boolean {
    const nx = (p.x - rx) / rx
    const ny = (p.y - ry) / ry
    return nx * nx + ny * ny <= 1
  }

  private isPointNearPath(
    point: { x: number; y: number },
    points: Array<{ x: number; y: number }>,
    threshold: number
  ): boolean {
    for (let i = 1; i < points.length; i++) {
      const dist = this.pointToSegmentDistance(point, points[i - 1], points[i])
      if (dist <= threshold) return true
    }
    return false
  }

  private pointToSegmentDistance(
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ): number {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)

    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
  }
}
```

### 2.4 交互状态机

```typescript
// canvas/InteractionStateMachine.ts

type ToolType = 'select' | 'rectangle' | 'ellipse' | 'arrow' | 'text' | 'freehand' | 'pan'

type InteractionState =
  | { type: 'idle' }
  | { type: 'selecting'; startPoint: Point }
  | { type: 'dragging'; elementId: string; offset: Point }
  | { type: 'resizing'; elementId: string; handle: ResizeHandle; origin: Rect }
  | { type: 'drawing'; elementId: string }
  | { type: 'panning'; lastPoint: Point }

/**
 * 有限状态机管理所有画布交互
 *
 * 状态转换图：
 *
 *   idle ──mousedown──→ selecting / dragging / drawing / panning
 *     ↑                        │
 *     └────────mouseup─────────┘
 */
class InteractionStateMachine {
  private state: InteractionState = { type: 'idle' }
  private activeTool: ToolType = 'select'

  handlePointerDown(e: PointerEvent, canvasPoint: Point, hitElement: CanvasElement | null) {
    switch (this.activeTool) {
      case 'select':
        if (hitElement) {
          const handle = this.getResizeHandle(canvasPoint, hitElement)
          if (handle) {
            this.state = {
              type: 'resizing',
              elementId: hitElement.id,
              handle,
              origin: { x: hitElement.x, y: hitElement.y, w: hitElement.width, h: hitElement.height },
            }
          } else {
            this.state = {
              type: 'dragging',
              elementId: hitElement.id,
              offset: {
                x: canvasPoint.x - hitElement.x,
                y: canvasPoint.y - hitElement.y,
              },
            }
          }
        } else {
          this.state = { type: 'selecting', startPoint: canvasPoint }
        }
        break

      case 'rectangle':
      case 'ellipse':
      case 'freehand':
        const newId = this.createNewElement(this.activeTool, canvasPoint)
        this.state = { type: 'drawing', elementId: newId }
        break

      case 'pan':
        this.state = { type: 'panning', lastPoint: { x: e.clientX, y: e.clientY } }
        break
    }
  }

  handlePointerMove(e: PointerEvent, canvasPoint: Point) {
    switch (this.state.type) {
      case 'dragging':
        // 更新元素位置（通过 Yjs 写入 → 自动同步）
        this.updateElementPosition(this.state.elementId, {
          x: canvasPoint.x - this.state.offset.x,
          y: canvasPoint.y - this.state.offset.y,
        })
        break

      case 'drawing':
        this.updateDrawingElement(this.state.elementId, canvasPoint)
        break

      case 'resizing':
        this.updateElementSize(this.state.elementId, canvasPoint, this.state.handle, this.state.origin)
        break

      case 'selecting':
        this.updateSelectionBox(this.state.startPoint, canvasPoint)
        break

      case 'panning':
        const dx = e.clientX - this.state.lastPoint.x
        const dy = e.clientY - this.state.lastPoint.y
        this.panViewport(dx, dy)
        this.state = { type: 'panning', lastPoint: { x: e.clientX, y: e.clientY } }
        break
    }
  }

  handlePointerUp() {
    if (this.state.type === 'drawing') {
      this.finalizeDrawing(this.state.elementId)
    }
    this.state = { type: 'idle' }
  }

  // 缩放处理（滚轮）
  handleWheel(e: WheelEvent, canvasPoint: Point) {
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05
    this.zoomAtPoint(canvasPoint, zoomFactor)
  }
}
```

---

## 3. 离线存储与本地持久化

### 3.1 y-indexeddb 集成

```typescript
// collaboration/LocalPersistence.ts

import { IndexeddbPersistence } from 'y-indexeddb'
import * as Y from 'yjs'

class LocalPersistence {
  private persistence: IndexeddbPersistence | null = null

  /**
   * 将 Yjs 文档绑定到 IndexedDB
   * - 页面加载时自动从 IndexedDB 恢复文档状态
   * - 每次文档变更自动写入 IndexedDB
   * - 完全透明，上层无感知
   */
  async bind(roomId: string, ydoc: Y.Doc): Promise<void> {
    this.persistence = new IndexeddbPersistence(
      `syncboard-${roomId}`,  // IndexedDB 数据库名
      ydoc
    )

    // 等待本地数据加载完成
    await new Promise<void>((resolve) => {
      this.persistence!.once('synced', () => {
        console.log(`[LocalPersistence] 本地数据已恢复: ${roomId}`)
        resolve()
      })
    })
  }

  // 清除本地缓存（用户主动退出房间时）
  async clear(roomId: string): Promise<void> {
    if (this.persistence) {
      await this.persistence.clearData()
      this.persistence.destroy()
      this.persistence = null
    }
  }

  // 获取本地存储大小（用于 UI 显示）
  async getStorageSize(roomId: string): Promise<number> {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(`syncboard-${roomId}`)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    // 估算大小...
    db.close()
    return 0
  }
}
```

### 3.2 离线/在线状态管理

```typescript
// collaboration/ConnectionManager.ts

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

class ConnectionManager {
  private status: ConnectionStatus = 'disconnected'
  private wsProvider: WebsocketProvider | null = null
  private listeners = new Set<(status: ConnectionStatus) => void>()

  /**
   * 连接流程：
   * 1. 先从 IndexedDB 恢复本地数据（离线数据立即可用）
   * 2. 尝试建立 WebSocket 连接
   * 3. 连接成功后，Yjs 自动同步本地与远程的差异
   * 4. 连接断开后，继续在本地工作，重连后自动合并
   */
  async connect(roomId: string, ydoc: Y.Doc): Promise<void> {
    // Step 1: 本地数据先行
    const localPersistence = new LocalPersistence()
    await localPersistence.bind(roomId, ydoc)

    // Step 2: 尝试 WebSocket 连接
    this.setStatus('connecting')

    this.wsProvider = new WebsocketProvider(
      'wss://your-server.com/ws',
      roomId,
      ydoc,
      {
        connect: true,
        // 断线重连策略
        maxBackoffTime: 10000,          // 最大重连间隔 10s
        WebSocketPolyfill: WebSocket,
      }
    )

    this.wsProvider.on('status', ({ status }: { status: string }) => {
      this.setStatus(status === 'connected' ? 'connected' : 'connecting')
    })

    this.wsProvider.on('connection-close', () => {
      this.setStatus('disconnected')
    })
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    this.listeners.forEach(fn => fn(status))
  }

  onStatusChange(fn: (status: ConnectionStatus) => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  disconnect() {
    this.wsProvider?.disconnect()
    this.wsProvider?.destroy()
    this.wsProvider = null
    this.setStatus('disconnected')
  }
}
```

### 3.3 离线队列与合并流程图

```
用户操作流程（以离线编辑为例）：

 ┌────────── 在线状态 ──────────┐
 │                               │
 │  用户绘制 → Yjs Update        │
 │       │                       │
 │       ├──→ IndexedDB (本地)   │
 │       └──→ WebSocket (远程)   │
 │                               │
 └───────────┬───────────────────┘
             │ 网络断开
             ▼
 ┌────────── 离线状态 ──────────┐
 │                               │
 │  用户继续绘制 → Yjs Update    │
 │       │                       │
 │       └──→ IndexedDB (本地)   │
 │       （WebSocket 队列暂存）    │
 │                               │
 └───────────┬───────────────────┘
             │ 网络恢复
             ▼
 ┌────────── 重连同步 ──────────┐
 │                               │
 │  1. WebSocket 自动重连        │
 │  2. Yjs 发送本地积累的 Update │
 │  3. 接收远程积累的 Update     │
 │  4. CRDT 自动合并，无冲突      │
 │  5. UI 刷新为合并后的状态      │
 │                               │
 └──────────────────────────────┘
```

---

## 4. WebSocket 实时同步层

### 4.1 Awareness 协议（远程光标 & 在线状态）

```typescript
// collaboration/AwarenessManager.ts

import { Awareness } from 'y-protocols/awareness'

interface UserAwareness {
  user: {
    id: string
    name: string
    color: string       // 用户颜色标识
    avatar?: string
  }
  cursor: {
    x: number
    y: number
  } | null
  selection: string[]   // 选中的元素 ID 列表
  viewport: {
    x: number
    y: number
    zoom: number
  }
}

class AwarenessManager {
  private awareness: Awareness
  private colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']

  constructor(ydoc: Y.Doc) {
    this.awareness = new Awareness(ydoc)
  }

  // 设置本地用户信息（登录后调用）
  setLocalUser(user: { id: string; name: string }) {
    this.awareness.setLocalStateField('user', {
      ...user,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
    })
  }

  // 更新光标位置（mousemove 时节流调用）
  updateCursor(x: number, y: number) {
    this.awareness.setLocalStateField('cursor', { x, y })
  }

  // 清除光标（鼠标离开画布）
  clearCursor() {
    this.awareness.setLocalStateField('cursor', null)
  }

  // 更新选中元素
  updateSelection(elementIds: string[]) {
    this.awareness.setLocalStateField('selection', elementIds)
  }

  // 获取所有远程用户的状态
  getRemoteStates(): Map<number, UserAwareness> {
    const states = new Map<number, UserAwareness>()
    this.awareness.getStates().forEach((state, clientId) => {
      if (clientId !== this.awareness.clientID) {
        states.set(clientId, state as UserAwareness)
      }
    })
    return states
  }

  // 监听远程用户变化 → 重绘光标
  onRemoteChange(callback: (states: Map<number, UserAwareness>) => void) {
    this.awareness.on('change', () => {
      callback(this.getRemoteStates())
    })
  }
}
```

### 4.2 远程光标渲染

```typescript
// canvas/CursorRenderer.ts

class CursorRenderer {
  /**
   * 在画布上绘制其他用户的光标
   * 每个用户有独特的颜色和名字标签
   */
  render(ctx: CanvasRenderingContext2D, remoteUsers: Map<number, UserAwareness>) {
    remoteUsers.forEach((state) => {
      if (!state.cursor || !state.user) return

      const { x, y } = state.cursor
      const { name, color } = state.user

      ctx.save()

      // 绘制光标箭头
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + 2, y + 16)
      ctx.lineTo(x + 8, y + 12)
      ctx.closePath()
      ctx.fill()

      // 绘制用户名标签
      ctx.font = '12px sans-serif'
      const textWidth = ctx.measureText(name).width
      const labelX = x + 10
      const labelY = y + 18

      // 标签背景
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(labelX, labelY, textWidth + 8, 20, 4)
      ctx.fill()

      // 标签文字
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(name, labelX + 4, labelY + 14)

      ctx.restore()
    })
  }
}
```

---

## 5. NestJS 后端架构

### 5.1 模块结构

```
server/src/
├── app.module.ts
├── main.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts        # POST /auth/login, /auth/register
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── ws-auth.guard.ts          # WebSocket 连接鉴权
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── room/
│   ├── room.module.ts
│   ├── room.controller.ts        # CRUD /rooms
│   ├── room.service.ts
│   ├── room.entity.ts
│   └── dto/
│       ├── create-room.dto.ts
│       └── update-room.dto.ts
│
├── sync/
│   ├── sync.module.ts
│   ├── sync.gateway.ts           # WebSocket Gateway（核心）
│   ├── yjs.service.ts            # Yjs 文档管理
│   └── persistence.service.ts    # 文档持久化
│
└── shared/
    ├── filters/
    │   └── ws-exception.filter.ts
    ├── interceptors/
    │   └── logging.interceptor.ts
    └── utils/
        └── rate-limiter.ts
```

### 5.2 WebSocket Gateway 实现

```typescript
// sync/sync.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets'
import { Server, WebSocket } from 'ws'
import { YjsService } from './yjs.service'
import { WsAuthGuard } from '../auth/ws-auth.guard'

@WebSocketGateway({
  path: '/ws',
  // 跨域配置
  cors: { origin: process.env.FRONTEND_URL },
})
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  // roomId → Set<WebSocket>
  private rooms = new Map<string, Set<WebSocket>>()

  constructor(
    private readonly yjsService: YjsService,
    private readonly authGuard: WsAuthGuard,
  ) {}

  async handleConnection(client: WebSocket, request: Request) {
    try {
      // 1. 验证 JWT（从 URL 参数或 header 中提取）
      const user = await this.authGuard.validateWsConnection(request)
      ;(client as any).userId = user.id
      ;(client as any).userName = user.name

      // 2. 从 URL 中提取 roomId
      const url = new URL(request.url, 'http://localhost')
      const roomId = url.searchParams.get('room')

      if (!roomId) {
        client.close(4001, 'Missing room parameter')
        return
      }

      // 3. 检查房间权限
      const hasAccess = await this.yjsService.checkRoomAccess(roomId, user.id)
      if (!hasAccess) {
        client.close(4003, 'Access denied')
        return
      }

      // 4. 加入房间
      ;(client as any).roomId = roomId
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set())
      }
      this.rooms.get(roomId)!.add(client)

      // 5. 获取或创建 Yjs 文档，发送初始状态
      const ydoc = await this.yjsService.getOrCreateDoc(roomId)
      const stateVector = Y.encodeStateAsUpdate(ydoc)
      client.send(this.encodeMessage('sync-step-1', stateVector))

      console.log(`[WS] ${user.name} joined room ${roomId}`)
    } catch (error) {
      client.close(4002, 'Authentication failed')
    }
  }

  handleDisconnect(client: WebSocket) {
    const roomId = (client as any).roomId
    if (roomId && this.rooms.has(roomId)) {
      this.rooms.get(roomId)!.delete(client)

      // 房间空了，延迟释放 Yjs 文档（可能有人马上重连）
      if (this.rooms.get(roomId)!.size === 0) {
        setTimeout(() => {
          if (this.rooms.get(roomId)?.size === 0) {
            this.yjsService.releaseDoc(roomId)
            this.rooms.delete(roomId)
          }
        }, 30_000) // 30 秒后释放
      }
    }
  }

  @SubscribeMessage('yjs-update')
  handleYjsUpdate(client: WebSocket, data: Uint8Array) {
    const roomId = (client as any).roomId
    if (!roomId) return

    // 1. 将 update 应用到服务端的 Yjs 文档
    this.yjsService.applyUpdate(roomId, data)

    // 2. 广播给同房间的其他客户端
    this.broadcastToRoom(roomId, client, 'yjs-update', data)
  }

  @SubscribeMessage('awareness-update')
  handleAwarenessUpdate(client: WebSocket, data: Uint8Array) {
    const roomId = (client as any).roomId
    if (!roomId) return

    // 光标/选区等 awareness 数据直接广播，不持久化
    this.broadcastToRoom(roomId, client, 'awareness-update', data)
  }

  private broadcastToRoom(roomId: string, sender: WebSocket, type: string, data: Uint8Array) {
    const clients = this.rooms.get(roomId)
    if (!clients) return

    const message = this.encodeMessage(type, data)
    clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  private encodeMessage(type: string, data: Uint8Array): Buffer {
    // 简单的消息编码：[type_length][type_bytes][data_bytes]
    const typeBytes = Buffer.from(type, 'utf-8')
    const buf = Buffer.alloc(1 + typeBytes.length + data.length)
    buf[0] = typeBytes.length
    typeBytes.copy(buf, 1)
    Buffer.from(data).copy(buf, 1 + typeBytes.length)
    return buf
  }
}
```

### 5.3 Yjs 文档管理服务

```typescript
// sync/yjs.service.ts

import { Injectable, OnModuleDestroy } from '@nestjs/common'
import * as Y from 'yjs'
import { PersistenceService } from './persistence.service'

@Injectable()
export class YjsService implements OnModuleDestroy {
  // 内存中活跃的文档
  private docs = new Map<string, Y.Doc>()
  // 持久化定时器
  private persistTimers = new Map<string, NodeJS.Timeout>()

  constructor(private readonly persistence: PersistenceService) {}

  async getOrCreateDoc(roomId: string): Promise<Y.Doc> {
    if (this.docs.has(roomId)) {
      return this.docs.get(roomId)!
    }

    const ydoc = new Y.Doc()

    // 从数据库恢复文档状态
    const savedState = await this.persistence.loadDocument(roomId)
    if (savedState) {
      Y.applyUpdate(ydoc, savedState)
    }

    // 监听变更，定期持久化
    ydoc.on('update', () => {
      this.schedulePersist(roomId, ydoc)
    })

    this.docs.set(roomId, ydoc)
    return ydoc
  }

  applyUpdate(roomId: string, update: Uint8Array) {
    const ydoc = this.docs.get(roomId)
    if (ydoc) {
      Y.applyUpdate(ydoc, update)
    }
  }

  /**
   * 防抖持久化：变更后 5 秒内没有新操作才写入数据库
   * 避免高频操作时频繁写入
   */
  private schedulePersist(roomId: string, ydoc: Y.Doc) {
    if (this.persistTimers.has(roomId)) {
      clearTimeout(this.persistTimers.get(roomId)!)
    }

    this.persistTimers.set(
      roomId,
      setTimeout(async () => {
        const state = Y.encodeStateAsUpdate(ydoc)
        await this.persistence.saveDocument(roomId, state)
        this.persistTimers.delete(roomId)
      }, 5000),
    )
  }

  async releaseDoc(roomId: string) {
    const ydoc = this.docs.get(roomId)
    if (ydoc) {
      // 释放前做一次最终持久化
      const state = Y.encodeStateAsUpdate(ydoc)
      await this.persistence.saveDocument(roomId, state)

      ydoc.destroy()
      this.docs.delete(roomId)

      if (this.persistTimers.has(roomId)) {
        clearTimeout(this.persistTimers.get(roomId)!)
        this.persistTimers.delete(roomId)
      }
    }
  }

  async checkRoomAccess(roomId: string, userId: string): Promise<boolean> {
    return this.persistence.checkAccess(roomId, userId)
  }

  async onModuleDestroy() {
    // 服务关闭前持久化所有文档
    for (const [roomId, ydoc] of this.docs) {
      const state = Y.encodeStateAsUpdate(ydoc)
      await this.persistence.saveDocument(roomId, state)
      ydoc.destroy()
    }
    this.docs.clear()
  }
}
```

### 5.4 数据库持久化服务

```typescript
// sync/persistence.service.ts

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DocumentSnapshot } from './entities/document-snapshot.entity'
import { RoomMember } from '../room/entities/room-member.entity'

@Injectable()
export class PersistenceService {
  constructor(
    @InjectRepository(DocumentSnapshot)
    private readonly snapshotRepo: Repository<DocumentSnapshot>,
    @InjectRepository(RoomMember)
    private readonly memberRepo: Repository<RoomMember>,
  ) {}

  async loadDocument(roomId: string): Promise<Uint8Array | null> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { roomId },
      order: { updatedAt: 'DESC' },
    })
    return snapshot?.data ?? null
  }

  async saveDocument(roomId: string, data: Uint8Array): Promise<void> {
    await this.snapshotRepo.upsert(
      {
        roomId,
        data: Buffer.from(data),
        updatedAt: new Date(),
      },
      { conflictPaths: ['roomId'] },
    )
  }

  /**
   * 保存历史快照（用于版本回溯）
   * 由定时任务调用，每 10 分钟保存一次
   */
  async saveHistorySnapshot(roomId: string, data: Uint8Array): Promise<void> {
    await this.snapshotRepo.save({
      roomId,
      data: Buffer.from(data),
      isHistorySnapshot: true,
      createdAt: new Date(),
    })
  }

  async checkAccess(roomId: string, userId: string): Promise<boolean> {
    const member = await this.memberRepo.findOne({
      where: { roomId, userId },
    })
    return !!member
  }
}
```

---

## 6. 认证与权限系统

### 6.1 数据库实体

```typescript
// auth/entities/user.entity.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  name: string

  @Column()
  passwordHash: string

  @CreateDateColumn()
  createdAt: Date
}

// room/entities/room.entity.ts
@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  name: string

  @Column()
  ownerId: string

  @Column({ default: false })
  isPublic: boolean

  @Column({ nullable: true })
  shareToken: string           // 分享链接 token

  @CreateDateColumn()
  createdAt: Date
}

// room/entities/room-member.entity.ts
@Entity()
export class RoomMember {
  @PrimaryColumn()
  roomId: string

  @PrimaryColumn()
  userId: string

  @Column({ type: 'enum', enum: ['viewer', 'editor', 'admin'] })
  role: 'viewer' | 'editor' | 'admin'

  @CreateDateColumn()
  joinedAt: Date
}
```

### 6.2 WebSocket 鉴权 Guard

```typescript
// auth/ws-auth.guard.ts

@Injectable()
export class WsAuthGuard {
  constructor(private readonly jwtService: JwtService) {}

  async validateWsConnection(request: Request): Promise<{ id: string; name: string }> {
    // 方式 1: URL 参数中的 token
    const url = new URL(request.url, 'http://localhost')
    const token = url.searchParams.get('token')

    // 方式 2: Sec-WebSocket-Protocol header
    // const token = request.headers['sec-websocket-protocol']

    if (!token) {
      throw new Error('No token provided')
    }

    try {
      const payload = this.jwtService.verify(token)
      return { id: payload.sub, name: payload.name }
    } catch {
      throw new Error('Invalid token')
    }
  }
}
```

---

## 7. 版本历史与快照

### 7.1 快照机制

```typescript
// sync/snapshot.service.ts

@Injectable()
export class SnapshotService {
  /**
   * Yjs 支持从任意两个状态之间计算差异
   * 利用这个特性实现版本历史：
   *
   * 1. 定期保存完整快照 (State Vector + Full Update)
   * 2. 用户可以浏览历史快照
   * 3. 回滚 = 将某个快照的状态应用到新文档
   */

  // 创建快照
  async createSnapshot(roomId: string, ydoc: Y.Doc, label?: string) {
    const snapshot = Y.snapshot(ydoc)
    const encodedSnapshot = Y.encodeSnapshot(snapshot)

    await this.snapshotRepo.save({
      roomId,
      data: Buffer.from(encodedSnapshot),
      label: label || `Snapshot at ${new Date().toISOString()}`,
      createdAt: new Date(),
    })
  }

  // 预览历史快照（只读，不影响当前文档）
  async previewSnapshot(roomId: string, snapshotId: string, currentDoc: Y.Doc) {
    const record = await this.snapshotRepo.findOneBy({ id: snapshotId })
    if (!record) throw new Error('Snapshot not found')

    const snapshot = Y.decodeSnapshot(record.data)
    // 从快照恢复出该时刻的文档状态
    const restoredDoc = Y.createDocFromSnapshot(currentDoc, snapshot)

    return restoredDoc.getMap('elements').toJSON()
  }

  // 回滚到快照（创建一个新版本，内容为快照时的状态）
  async rollbackToSnapshot(roomId: string, snapshotId: string, currentDoc: Y.Doc) {
    const elements = await this.previewSnapshot(roomId, snapshotId, currentDoc)

    currentDoc.transact(() => {
      const yElements = currentDoc.getMap('elements')
      // 清除当前所有元素
      yElements.forEach((_, key) => yElements.delete(key))
      // 写入快照中的元素
      Object.entries(elements).forEach(([key, value]) => {
        const yEl = new Y.Map()
        Object.entries(value as any).forEach(([k, v]) => yEl.set(k, v))
        yElements.set(key, yEl)
      })
    })
    // transact 结束后，Yjs 自动将变更广播给所有客户端
  }
}
```

---

## 8. 性能优化策略

### 8.1 画布渲染优化

```typescript
// 优化 1: 脏区域重绘（Dirty Rect）
// 只重绘变化区域，而非整个画布
class DirtyRectOptimizer {
  private dirtyRects: Array<{ x: number; y: number; w: number; h: number }> = []

  markDirty(rect: { x: number; y: number; w: number; h: number }) {
    this.dirtyRects.push(rect)
  }

  getDirtyRegion() {
    if (this.dirtyRects.length === 0) return null
    // 合并所有脏区域为一个包围盒
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const r of this.dirtyRects) {
      minX = Math.min(minX, r.x)
      minY = Math.min(minY, r.y)
      maxX = Math.max(maxX, r.x + r.w)
      maxY = Math.max(maxY, r.y + r.h)
    }
    this.dirtyRects = []
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
  }
}

// 优化 2: 视口裁剪（Viewport Culling）
// 只渲染视口内可见的元素
function getVisibleElements(elements: CanvasElement[], viewport: Viewport, canvasSize: { w: number; h: number }) {
  const viewBounds = {
    left: -viewport.offsetX / viewport.zoom,
    top: -viewport.offsetY / viewport.zoom,
    right: (-viewport.offsetX + canvasSize.w) / viewport.zoom,
    bottom: (-viewport.offsetY + canvasSize.h) / viewport.zoom,
  }

  return elements.filter((el) =>
    el.x + el.width >= viewBounds.left &&
    el.x <= viewBounds.right &&
    el.y + el.height >= viewBounds.top &&
    el.y <= viewBounds.bottom
  )
}

// 优化 3: 空间索引（R-tree）
// 当元素数量 > 1000 时，用 R-tree 加速查询
import RBush from 'rbush'

class SpatialIndex {
  private tree = new RBush<{ id: string; minX: number; minY: number; maxX: number; maxY: number }>()

  rebuild(elements: CanvasElement[]) {
    this.tree.clear()
    this.tree.load(elements.map(el => ({
      id: el.id,
      minX: el.x,
      minY: el.y,
      maxX: el.x + el.width,
      maxY: el.y + el.height,
    })))
  }

  queryViewport(bounds: { left: number; top: number; right: number; bottom: number }): string[] {
    return this.tree.search({
      minX: bounds.left,
      minY: bounds.top,
      maxX: bounds.right,
      maxY: bounds.bottom,
    }).map(item => item.id)
  }
}
```

### 8.2 Yjs 同步优化

```typescript
// 优化 4: Update 合并与节流
// 高频操作（拖拽、绘制）时合并 Yjs Updates

class UpdateThrottler {
  private pendingUpdates: Uint8Array[] = []
  private timer: NodeJS.Timeout | null = null

  /**
   * 将多次 update 合并为一次网络发送
   * 间隔：50ms（20fps 同步率，人眼感知足够流畅）
   */
  enqueue(update: Uint8Array, sendFn: (merged: Uint8Array) => void) {
    this.pendingUpdates.push(update)

    if (!this.timer) {
      this.timer = setTimeout(() => {
        const merged = Y.mergeUpdates(this.pendingUpdates)
        sendFn(merged)
        this.pendingUpdates = []
        this.timer = null
      }, 50)
    }
  }
}

// 优化 5: Web Worker 卸载 Yjs 计算
// 大文档的 update 应用和合并放到 Worker 中

// yjs.worker.ts
self.onmessage = (e) => {
  const { type, payload } = e.data
  switch (type) {
    case 'apply-update': {
      Y.applyUpdate(ydoc, payload.update)
      const state = ydoc.getMap('elements').toJSON()
      self.postMessage({ type: 'state-updated', payload: state })
      break
    }
    case 'encode-state': {
      const update = Y.encodeStateAsUpdate(ydoc)
      self.postMessage({ type: 'state-encoded', payload: update })
      break
    }
  }
}
```

### 8.3 网络优化

```
优化 6: WebSocket 消息压缩

客户端:
  const ws = new WebSocket(url)
  // 启用 permessage-deflate 扩展（浏览器原生支持）

服务端 (NestJS):
  @WebSocketGateway({
    perMessageDeflate: {
      zlibDeflateOptions: { chunkSize: 1024, memLevel: 7, level: 3 },
      threshold: 1024,  // 超过 1KB 才压缩
    }
  })

效果：Yjs binary updates 通常可压缩 60-80%
```

---

## 9. 部署架构

### 9.1 开发环境

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: syncboard
      POSTGRES_USER: syncboard
      POSTGRES_PASSWORD: devpassword
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://syncboard:devpassword@postgres:5432/syncboard
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-prod
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - '3000:3000'
    environment:
      VITE_API_URL: http://localhost:3001
      VITE_WS_URL: ws://localhost:3001/ws

volumes:
  pgdata:
```

### 9.2 生产部署方案

```
推荐：Vercel (前端) + Railway/Fly.io (后端)

                    ┌─────────────┐
                    │   Vercel    │
                    │   (React)   │
                    │   CDN 分发   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         ┌─────────┐ ┌─────────┐ ┌─────────┐
         │ Fly.io  │ │ Fly.io  │ │ Fly.io  │
         │ Node 1  │ │ Node 2  │ │ Node 3  │
         │ NestJS  │ │ NestJS  │ │ NestJS  │
         └────┬────┘ └────┬────┘ └────┬────┘
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────┼────────────┐
              ▼                         ▼
         ┌─────────┐             ┌─────────┐
         │  Neon    │             │ Upstash │
         │ Postgres │             │  Redis  │
         │ (托管)   │             │ (Pub/Sub)│
         └─────────┘             └─────────┘

多节点注意事项：
  - WebSocket 是有状态的，同一房间的用户可能连到不同节点
  - 通过 Redis Pub/Sub 在节点间转发 Yjs Updates
  - 使用 sticky session 或在连接层做房间亲和性路由
```

### 9.3 多节点 Redis Pub/Sub 同步

```typescript
// sync/redis-sync.service.ts

@Injectable()
export class RedisSyncService implements OnModuleInit {
  private pub: Redis
  private sub: Redis

  constructor(private readonly yjsService: YjsService) {
    this.pub = new Redis(process.env.REDIS_URL)
    this.sub = new Redis(process.env.REDIS_URL)
  }

  async onModuleInit() {
    // 订阅所有房间的更新频道
    await this.sub.psubscribe('room:*:update')

    this.sub.on('pmessage', (_pattern, channel, message) => {
      const roomId = channel.split(':')[1]
      const update = Buffer.from(message, 'base64')

      // 将其他节点的更新应用到本地 Yjs 文档
      this.yjsService.applyUpdate(roomId, update)
      // 广播给本节点连接的客户端（由 SyncGateway 处理）
    })
  }

  // 当本地收到客户端更新时，发布到 Redis
  async publishUpdate(roomId: string, update: Uint8Array) {
    await this.pub.publish(
      `room:${roomId}:update`,
      Buffer.from(update).toString('base64'),
    )
  }
}
```

---

## 附录：关键依赖清单

```json
{
  "前端 (apps/web)": {
    "react": "^18.3",
    "yjs": "^13.6",
    "y-websocket": "^2.0",
    "y-indexeddb": "^9.0",
    "y-protocols": "^1.0",
    "zustand": "^4.5",
    "nanoid": "^5.0",
    "rbush": "^3.0",
    "perfect-freehand": "^1.2",
    "@tiptap/react": "^2.4 (Phase 2)",
    "y-prosemirror": "^1.2 (Phase 2)"
  },
  "后端 (apps/server)": {
    "@nestjs/core": "^10",
    "@nestjs/websockets": "^10",
    "@nestjs/typeorm": "^10",
    "@nestjs/jwt": "^10",
    "ws": "^8.16",
    "yjs": "^13.6",
    "typeorm": "^0.3",
    "pg": "^8.12",
    "ioredis": "^5.3",
    "bcrypt": "^5.1"
  },
  "工具链": {
    "turbo": "^2.0",
    "typescript": "^5.4",
    "vite": "^5.2",
    "vitest": "^1.4",
    "eslint": "^8",
    "prettier": "^3"
  }
}
```
