# Local-First 实时协作空间 — 项目计划书

## 一、项目概述

### 项目名称
**SyncBoard** — 基于 Local-First 架构的实时协作白板

### 项目定位
一款开源的、支持离线使用和多人实时协作的白板/文档工具。数据优先存储在本地，联网后自动同步，零冲突、零延迟。

### 核心理念
- **离线优先**：断网状态下完全可用，体验无感知差异
- **实时协作**：多人同时编辑，光标/选区实时可见
- **数据主权**：用户数据本地存储，服务端仅作同步中继

### 技术栈
| 层级 | 技术选型 |
|------|---------|
| 前端框架 | React 18+ (TypeScript) |
| 状态同步 | Yjs (CRDT) |
| 画布渲染 | tldraw / Konva.js / 自研 Canvas |
| 本地存储 | IndexedDB (via y-indexeddb) |
| 实时通信 | WebSocket (y-websocket) |
| 后端框架 | NestJS (TypeScript) |
| 数据库 | PostgreSQL + Redis |
| 部署 | Docker Compose |

---

## 二、核心功能规划

### Phase 1：MVP（4-6 周）

> 目标：单人可用的本地白板 + 基础协作能力

#### 前端
- [ ] 画布基础能力：自由绘制、矩形、圆形、文本、箭头连线
- [ ] 无限画布：平移、缩放
- [ ] 撤销/重做（基于 Yjs UndoManager）
- [ ] IndexedDB 本地持久化，刷新不丢失
- [ ] 基础工具栏 UI

#### 后端
- [ ] NestJS WebSocket Gateway 搭建
- [ ] y-websocket 同步服务集成
- [ ] 房间（Room）管理：创建、加入、离开
- [ ] 基础 REST API：用户注册/登录（JWT）

#### 协作
- [ ] 两人以上实时同步绘制
- [ ] 远程光标显示（awareness protocol）
- [ ] 离线编辑 → 上线后自动合并

---

### Phase 2：体验增强（4 周）

> 目标：接近生产级的编辑体验

- [ ] 富文本编辑节点（基于 Tiptap + y-prosemirror）
- [ ] 图形样式系统：颜色、边框、填充、字体
- [ ] 图层管理：置顶、置底、锁定
- [ ] 小地图导航
- [ ] 选区框选与批量操作
- [ ] 快捷键系统
- [ ] 导出功能：PNG / SVG / JSON
- [ ] 深色模式

---

### Phase 3：协作深化（4 周）

> 目标：完整的多人协作工作流

- [ ] 用户头像 + 在线状态指示
- [ ] 跟随模式（Follow Mode）：点击头像跟随他人视角
- [ ] 评论/批注系统
- [ ] 版本历史与快照回滚（基于 Yjs snapshots）
- [ ] 房间权限管理：查看者 / 编辑者 / 管理员
- [ ] 分享链接（只读 / 可编辑）

---

### Phase 4：高级特性（4 周）

> 目标：差异化能力，社区吸引力

- [ ] 模板系统：流程图、思维导图、看板模板
- [ ] 插件架构：允许社区扩展自定义图形/工具
- [ ] AI 辅助（可选）：自然语言生成图表、智能排版
- [ ] 多标签页 / 多画布项目空间
- [ ] PWA 支持：可安装为桌面应用
- [ ] 国际化（i18n）

---

## 三、技术架构

```
┌─────────────────────────────────────────────────┐
│                   客户端 (React)                  │
│                                                   │
│  ┌───────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Canvas    │  │  Yjs Doc │  │  IndexedDB    │ │
│  │  Renderer  │←→│  (CRDT)  │←→│  (离线存储)    │ │
│  └───────────┘  └────┬─────┘  └───────────────┘ │
│                      │                            │
│                      │ WebSocket                  │
└──────────────────────┼────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│               服务端 (NestJS)                      │
│                                                    │
│  ┌──────────────┐  ┌───────────┐  ┌───────────┐ │
│  │  WebSocket   │  │  Auth     │  │  Room      │ │
│  │  Gateway     │  │  Module   │  │  Manager   │ │
│  │  (y-websocket│  │  (JWT)    │  │            │ │
│  └──────┬───────┘  └───────────┘  └───────────┘ │
│         │                                         │
│         ▼                                         │
│  ┌──────────────┐  ┌───────────┐                 │
│  │  PostgreSQL  │  │  Redis    │                 │
│  │  (持久化)     │  │  (Pub/Sub)│                 │
│  └──────────────┘  └───────────┘                 │
└──────────────────────────────────────────────────┘
```

### 数据流说明

1. 用户在画布上操作 → 产生 Yjs 增量更新（Update）
2. Update 同时写入本地 IndexedDB（离线保障）
3. Update 通过 WebSocket 发送到 NestJS 服务端
4. 服务端广播给同一房间的其他客户端
5. 其他客户端的 Yjs Doc 自动合并（CRDT 无冲突）
6. 服务端将文档快照定期持久化到 PostgreSQL

---

## 四、项目结构

```
syncboard/
├── apps/
│   ├── web/                    # React 前端
│   │   ├── src/
│   │   │   ├── components/     # UI 组件
│   │   │   ├── canvas/         # 画布核心逻辑
│   │   │   ├── collaboration/  # Yjs 协作层
│   │   │   ├── store/          # 状态管理 (Zustand)
│   │   │   ├── hooks/          # 自定义 Hooks
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   │
│   └── server/                 # NestJS 后端
│       ├── src/
│       │   ├── auth/           # 认证模块
│       │   ├── room/           # 房间管理模块
│       │   ├── sync/           # WebSocket 同步模块
│       │   ├── storage/        # 持久化模块
│       │   └── app.module.ts
│       └── package.json
│
├── packages/
│   └── shared/                 # 前后端共享类型/工具
│       ├── types/
│       └── constants/
│
├── docker-compose.yml
├── turbo.json                  # Turborepo 管理 Monorepo
├── package.json
└── README.md
```

---

## 五、关键技术学习点

| 技术领域 | 你将学到的能力 |
|---------|--------------|
| **CRDT / Yjs** | 分布式数据结构、冲突解决算法、增量同步原理 |
| **WebSocket** | 长连接管理、心跳检测、断线重连、房间广播 |
| **Canvas/WebGL** | 高性能渲染、事件系统、坐标变换、命中检测 |
| **离线存储** | IndexedDB 操作、Service Worker 缓存策略 |
| **NestJS 高级** | 自定义 Gateway、Guard、Interceptor、微服务通信 |
| **Monorepo** | Turborepo 工作流、共享包管理、统一构建 |
| **性能优化** | 虚拟化渲染、防抖节流、Web Worker 计算卸载 |
| **安全** | JWT 鉴权、房间级权限控制、WebSocket 安全 |

---

## 六、开源运营建议

### 仓库规范
- 清晰的 README（含 GIF 演示）
- Contributing Guide + Code of Conduct
- Issue / PR 模板
- GitHub Actions CI/CD（Lint + Test + Build）
- Changesets 管理版本发布

### 吸引关注
- 在 Reddit (r/webdev, r/reactjs)、Hacker News、V2EX 发布
- 录制 Demo 视频发布到 YouTube / B站
- 撰写技术博客解析 CRDT 和 Local-First 架构
- 提供在线 Demo（部署到 Vercel + Railway）

### 里程碑
| 阶段 | 目标 Star 数 | 关键动作 |
|------|-------------|---------|
| MVP 发布 | 100+ | 在线 Demo + Reddit 首发 |
| Phase 2 完成 | 500+ | 技术博客 + B站视频 |
| Phase 3 完成 | 1000+ | 插件 API 开放 + 社区贡献 |
| Phase 4 完成 | 3000+ | Product Hunt 上线 |

---

## 七、开发节奏建议

| 周次 | 重点任务 |
|------|---------|
| 第 1 周 | 搭建 Monorepo 脚手架、集成 Yjs + IndexedDB |
| 第 2 周 | 实现画布基础图形绘制 + 无限画布 |
| 第 3 周 | 接入 y-websocket，实现双端实时同步 |
| 第 4 周 | NestJS WebSocket Gateway + 房间管理 |
| 第 5 周 | 离线编辑 + 上线自动合并 + 远程光标 |
| 第 6 周 | 用户系统 + 权限 + MVP 部署上线 |
| 第 7-10 周 | Phase 2 体验打磨 |
| 第 11-14 周 | Phase 3 协作深化 |
| 第 15-18 周 | Phase 4 高级特性 |

---

## 八、参考项目

| 项目 | 参考价值 |
|------|---------|
| [Excalidraw](https://github.com/excalidraw/excalidraw) | 协作白板标杆，学习画布架构 |
| [tldraw](https://github.com/tldraw/tldraw) | 画布引擎设计、状态管理 |
| [Yjs Examples](https://github.com/yjs/yjs-demos) | CRDT 集成示例 |
| [Hocuspocus](https://github.com/ueberdosis/hocuspocus) | Yjs 后端同步方案 |
| [BlockSuite](https://github.com/toeverything/blocksuite) | Local-First 编辑器框架 |

---

> **一句话总结**：从一个能离线画方块、上线能同步的最小白板开始，逐步迭代成一个有社区影响力的协作工具。
