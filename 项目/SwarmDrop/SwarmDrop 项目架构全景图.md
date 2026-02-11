##

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SwarmDrop 项目结构                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │                    前端 (src/)                           │           │
│   │         React 19 + TypeScript + Vite + Tailwind         │           │
│   └──────────────────────┬──────────────────────────────────┘           │
│                          │ invoke() / Channel                           │
│                     Tauri IPC 桥                                        │
│                          │                                              │
│   ┌──────────────────────▼──────────────────────────────────┐           │
│   │                  后端 (src-tauri/)                       │           │
│   │              Rust 2021 + Tauri 2 框架                    │           │
│   └──────────────────────┬──────────────────────────────────┘           │
│                          │ 依赖                                         │
│   ┌──────────────────────▼──────────────────────────────────┐           │
│   │              P2P 核心库 (libs/)                          │           │
│   │           libp2p 0.56 — swarm-p2p-core                  │           │
│   └─────────────────────────────────────────────────────────┘           │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────┐           │
│   │              文档站 (docs/)                              │           │
│   │              Astro + Starlight                           │           │
│   └─────────────────────────────────────────────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 一、前端模块 (`src/`)

```
src/
├── main.tsx                        # 应用入口
├── index.css                       # 全局样式 (Tailwind)
├── vite-env.d.ts                   # Vite 类型声明
│
├── commands/                       # 🔌 IPC 桥接层（前后端通信）
│   ├── index.ts                    #   统一导出
│   ├── network.ts                  #   网络命令: start, shutdown
│   ├── identity.ts                 #   密钥命令: generate_keypair, register_keypair
│   └── pairing.ts                  #   配对命令: generate_pairing_code 等
│
├── stores/                         # 📦 状态管理 (Zustand)
│   ├── auth-store.ts               #   认证状态 → localStorage
│   ├── preferences-store.ts        #   偏好设置 → tauri-plugin-store
│   ├── secret-store.ts             #   密钥存储 → Stronghold 加密保险箱
│   ├── network-store.ts            #   网络状态 → 纯运行时
│   └── pairing-store.ts            #   配对状态 → 纯运行时
│
├── routes/                         # 🗺️ 路由页面 (TanStack Router)
│   ├── __root.tsx                  #   根布局
│   ├── index.tsx                   #   首页重定向
│   ├── _auth.tsx                   #   未认证布局 (Aurora 背景)
│   ├── _auth/welcome.lazy.tsx      #     欢迎页
│   ├── _auth/setup-password.lazy.tsx   # 设置密码
│   ├── _auth/unlock.lazy.tsx       #     解锁页
│   ├── _auth/enable-biometric.lazy.tsx # 生物识别
│   ├── _app.tsx                    #   已认证布局 (侧边栏)
│   ├── _app/devices.lazy.tsx       #     设备列表页
│   └── _app/settings.lazy.tsx      #     设置页
│
├── components/                     # 🧩 UI 组件
│   ├── ui/                         #   shadcn/ui 基础组件 (18个)
│   │   ├── button.tsx, dialog.tsx, sheet.tsx, sidebar.tsx ...
│   │
│   ├── layout/                     #   布局组件
│   │   ├── sidebar.tsx             #     桌面端侧边栏
│   │   ├── bottom-nav.tsx          #     移动端底部导航
│   │   └── nav-items.ts            #     导航项定义
│   │
│   ├── devices/                    #   设备相关
│   │   └── device-card.tsx         #     设备卡片
│   │
│   ├── network/                    #   网络状态组件
│   │   ├── network-dialog.tsx      #     网络详情弹窗
│   │   ├── network-status-bar.tsx  #     状态栏
│   │   ├── start-node-sheet.tsx    #     启动节点抽屉
│   │   ├── stop-node-sheet.tsx     #     停止节点抽屉
│   │   └── offline-empty-state.tsx #     离线空状态
│   │
│   ├── pairing/                    #   配对相关 (Phase 2 核心)
│   │   ├── add-device-menu.tsx     #     添加设备菜单
│   │   ├── generate-code-dialog.tsx    # 生成配对码弹窗
│   │   ├── connection-request-dialog.tsx # 连接请求弹窗
│   │   ├── desktop-input-code-page.tsx  # 桌面端输入码页
│   │   ├── mobile-pairing-page.tsx #     移动端配对页
│   │   ├── mobile-generate-code-view.tsx
│   │   ├── mobile-input-code-view.tsx
│   │   └── device-icon.ts         #     设备图标映射
│   │
│   ├── aurora-background.tsx       #   极光背景效果
│   └── responsive-dialog.tsx       #   响应式弹窗
│
├── hooks/                          # 🪝 自定义 Hooks
│   ├── use-breakpoint.ts           #   响应式断点
│   └── use-mobile.ts               #   移动端检测
│
├── lib/                            # 🔧 工具库
│   ├── utils.ts                    #   通用工具 (cn 等)
│   ├── stronghold.ts               #   Stronghold 加密存储封装
│   ├── tauri-store.ts              #   Tauri Store 持久化
│   ├── auth-messages.ts            #   认证相关消息
│   ├── i18n.ts                     #   国际化初始化
│   └── format-uptime.ts            #   运行时间格式化
│
└── locales/                        # 🌍 国际化翻译 (8种语言)
    ├── zh/messages.po
    ├── en/messages.po
    ├── ja/messages.po
    └── ... (zh-TW, ko, es, fr, de)
```

---

## 二、后端模块 (`src-tauri/`)

```
src-tauri/src/
├── main.rs                         # 程序入口（调用 lib.rs::run()）
├── lib.rs                          # 🏗️ Tauri 主配置
│                                   #   - 插件注册 (Stronghold, Biometry, Store, OS, FS)
│                                   #   - invoke_handler 注册 8 个命令
│                                   #   - tracing 日志初始化
│
├── commands/                       # 📡 Tauri 命令（前端 invoke 的目标）
│   ├── mod.rs                      #   网络命令：start, shutdown
│   │                               #   NetManager（管理 NetClient + PairingManager）
│   │                               #   引导节点配置 (47.115.172.218)
│   ├── identity.rs                 #   密钥命令：generate_keypair, register_keypair
│   └── pairing.rs                  #   配对命令：generate_pairing_code,
│                                   #             get_device_info,
│                                   #             request_pairing,
│                                   #             respond_pairing_request
│
├── pairing/                        # 🤝 配对子系统
│   ├── mod.rs                      #   模块声明
│   ├── code.rs                     #   6位配对码生成、SHA256→DHT key 映射
│   └── manager.rs                  #   PairingManager — DHT 发布/查询、上下线通告
│
├── device.rs                       # 📱 设备信息 (OsInfo: 主机名, 平台, agent_version)
├── protocol.rs                     # 📨 应用层协议 (AppRequest/AppResponse, CBOR 编码)
└── error.rs                        # ❌ 错误类型 (AppError, AppResult)
```

---

## 三、P2P 核心库 (`libs/`)

```
libs/
├── Cargo.toml                      # Workspace 根
│
├── core/                           # 🌐 swarm-p2p-core — 通用 P2P 引擎
│   ├── src/
│   │   ├── lib.rs                  #   导出：NetClient, NodeConfig, NodeEvent, start()
│   │   ├── config.rs               #   节点配置（mDNS, relay, DCUtR, autonat 等开关）
│   │   ├── error.rs                #   P2P 错误类型
│   │   ├── event.rs                #   节点事件定义
│   │   ├── pending_map.rs          #   待处理请求映射
│   │   ├── util.rs                 #   工具函数
│   │   │
│   │   ├── client/                 #   NetClient — 面向上层的 API
│   │   │   ├── mod.rs              #     客户端主体
│   │   │   ├── kad.rs              #     Kademlia DHT 操作
│   │   │   ├── req_resp.rs         #     Request-Response 操作
│   │   │   └── future.rs           #     异步 Future 封装
│   │   │
│   │   ├── command/                #   内部命令系统
│   │   │   ├── handler.rs          #     命令处理器
│   │   │   ├── dial.rs             #     拨号命令
│   │   │   ├── kad/                #     DHT 子命令
│   │   │   │   ├── bootstrap.rs, get_record.rs, put_record.rs
│   │   │   │   ├── get_providers.rs, start_provide.rs, stop_provide.rs
│   │   │   │   ├── get_closest_peers.rs, remove_record.rs
│   │   │   └── req_resp/           #     请求-响应子命令
│   │   │       ├── send_request.rs, send_response.rs
│   │   │
│   │   └── runtime/                #   运行时核心
│   │       ├── mod.rs
│   │       ├── node.rs             #     节点运行时
│   │       ├── behaviour.rs        #     libp2p Behaviour 组合
│   │       └── event_loop.rs       #     事件循环
│   │
│   └── tests/                      #   集成测试
│       ├── kad.rs                  #     DHT 测试
│       └── req_resp.rs             #     请求-响应测试
│
└── bootstrap/                      # 🚀 引导节点（独立可执行程序）
    └── src/
        ├── main.rs                 #     引导节点入口
        ├── lib.rs
        ├── behaviour.rs            #     引导节点行为定义
        └── util/                   #     工具：identity, signal
```

---

## 四、数据流与模块边界

```
┌─────────────────────────────────────────────────────────────────────┐
│                          前端 (React)                               │
│                                                                     │
│  ┌──────────┐   ┌───────────┐   ┌──────────────┐   ┌───────────┐  │
│  │  Routes   │──▶│Components │──▶│    Stores     │──▶│  commands/ │  │
│  │ (页面)    │   │  (UI)     │   │   (Zustand)   │   │  (IPC封装) │  │
│  └──────────┘   └───────────┘   └──────────────┘   └─────┬─────┘  │
│                                                           │         │
├───────────────────────────────────────────────────────────┼─────────┤
│                    Tauri IPC 边界                          │         │
│              invoke() ↑↓ Channel (事件流)                  │         │
├───────────────────────────────────────────────────────────┼─────────┤
│                                                           │         │
│  ┌───────────┐   ┌───────────┐   ┌──────────────┐   ┌───▼───────┐ │
│  │  device   │   │  pairing/ │   │  protocol    │   │ commands/ │ │
│  │  (设备)   │   │  (配对)   │   │  (协议)      │   │ (Tauri)   │ │
│  └───────────┘   └─────┬─────┘   └──────────────┘   └───────────┘ │
│                        │                                            │
│                   后端 (Rust/Tauri)                                  │
├────────────────────────┼────────────────────────────────────────────┤
│                        │ 调用                                       │
│  ┌─────────────────────▼───────────────────────────────────────┐   │
│  │                 swarm-p2p-core                               │   │
│  │     ┌──────────┐   ┌──────────┐   ┌───────────┐            │   │
│  │     │ NetClient│   │ Runtime  │   │  libp2p   │            │   │
│  │     │  (API)   │──▶│(事件循环)│──▶│ (Swarm)   │            │   │
│  │     └──────────┘   └──────────┘   └───────────┘            │   │
│  │                                                             │   │
│  │     协议: mDNS, Kademlia DHT, Relay, DCUtR, AutoNAT        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                        P2P 核心库 (Rust)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 五、模块分类汇总

|分类|目录|语言|职责|
|---|---|---|---|
|**前端 - UI**|`src/components/`|TSX|18 个 shadcn 基础组件 + 业务组件|
|**前端 - 路由**|`src/routes/`|TSX|10 个路由页面，分 `_auth` / `_app` 两个布局|
|**前端 - 状态**|`src/stores/`|TS|5 个 Zustand Store，4 种持久化策略|
|**前端 - IPC**|`src/commands/`|TS|3 个模块，封装 `invoke()` 调用|
|**前端 - 工具**|`src/lib/`, `src/hooks/`|TS|加密、i18n、响应式等工具|
|**前端 - i18n**|`src/locales/`|.po|8 种语言的翻译目录|
|**后端 - 命令**|`src-tauri/src/commands/`|Rust|8 个 Tauri 命令处理函数|
|**后端 - 配对**|`src-tauri/src/pairing/`|Rust|配对码 + PairingManager|
|**后端 - 协议**|`src-tauri/src/protocol.rs`|Rust|CBOR 编码的应用层协议|
|**后端 - 设备**|`src-tauri/src/device.rs`|Rust|OS 信息采集|
|**P2P 核心**|`libs/core/`|Rust|通用 P2P 引擎，可独立复用|
|**引导节点**|`libs/bootstrap/`|Rust|部署在 VPS 的独立服务|
|**文档站**|`docs/`|Astro|Starlight 文档站点|

---

## 几个有趣的架构观察

**1. 前后端的"镜像"结构**

前端的 `src/commands/` 和后端的 `src-tauri/src/commands/` 是一一对应的镜像：

```
前端 commands/network.ts    ◄──invoke──►   后端 commands/mod.rs (start/shutdown)
前端 commands/identity.ts   ◄──invoke──►   后端 commands/identity.rs
前端 commands/pairing.ts    ◄──invoke──►   后端 commands/pairing.rs
```

**2. P2P 库是完全解耦的**

`libs/core/` 是一个通用 P2P 引擎，不依赖 Tauri。它通过泛型 `<AppRequest, AppResponse>` 与上层应用解耦。这意味着它可以被其他 Rust 项目复用，引导节点 `libs/bootstrap/` 就是证明。

**3. 状态分层很清晰**

```
持久化策略                    Store               存什么
─────────────                ──────              ──────────
localStorage                auth-store           认证流程状态
tauri-plugin-store           preferences-store    主题/语言/设备名
Stronghold 加密保险箱         secret-store         Ed25519 密钥对
纯内存（不持久化）             network-store        P2P 运行时状态
纯内存（不持久化）             pairing-store        配对运行时状态
```