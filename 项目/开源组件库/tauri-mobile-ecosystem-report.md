# Tauri 移动端插件生态调研报告

> 调研日期：2026-03-04
> 目标：对标 Expo SDK，全面梳理 Tauri v2 移动端插件覆盖情况，识别缺失模块，规划 SDK 路线图。

---

## 1. 背景与动机

Tauri v2（2024.10 稳定版）新增了 iOS/Android 移动端支持，但移动端插件生态远不如 React Native / Expo 成熟。本报告旨在回答：

1. Tauri 移动端目前有哪些可用插件？
2. 对比 Expo SDK，还缺什么？
3. 哪些模块最值得优先开发？

### 核心判断

> UI 层不是 Tauri 移动端的痛点（shadcn/ui、Framework7、Konsta UI 等 Web UI 库均可直接在 Tauri WebView 中使用），**缺的是原生能力——相机、通讯录、媒体库、后台任务等系统 API 的桥接**。

---

## 2. Tauri 官方插件（移动端支持情况）

数据来源：[tauri-apps/plugins-workspace](https://github.com/tauri-apps/plugins-workspace) | [官方插件页](https://v2.tauri.app/plugin/)

### 2.1 全平台支持（Desktop + Mobile）

| 插件 | 包名 | 说明 |
|------|------|------|
| clipboard-manager | `tauri-plugin-clipboard-manager` | 读写系统剪贴板 |
| deep-link | `tauri-plugin-deep-link` | 注册为 URL 默认处理程序 |
| dialog | `tauri-plugin-dialog` | 原生文件/消息对话框 |
| fs | `tauri-plugin-fs` | 文件系统访问 |
| http | `tauri-plugin-http` | Rust 实现的 HTTP 客户端 |
| log | `tauri-plugin-log` | 可配置日志 |
| notification | `tauri-plugin-notification` | 本地通知（移动端支持 Actions） |
| opener | `tauri-plugin-opener` | 用默认应用打开文件/URL |
| os | `tauri-plugin-os` | 操作系统信息 |
| sql | `tauri-plugin-sql` | SQLite/MySQL/PostgreSQL |
| store | `tauri-plugin-store` | 持久化 KV 存储 |
| upload | `tauri-plugin-upload` | HTTP 文件上传 |

### 2.2 仅移动端（iOS + Android）

| 插件 | 包名 | 说明 |
|------|------|------|
| barcode-scanner | `tauri-plugin-barcode-scanner` | QR/EAN-13 等条码扫描 |
| biometric | `tauri-plugin-biometric` | 生物识别认证（Face ID/Touch ID/指纹） |
| geolocation | `tauri-plugin-geolocation` | GPS 定位（含海拔、航向、速度） |
| haptics | `tauri-plugin-haptics` | 触觉反馈和振动 |
| nfc | `tauri-plugin-nfc` | NFC 标签读写 |

### 2.3 仅桌面端

| 插件 | 说明 |
|------|------|
| autostart | 开机自启 |
| cli | 命令行参数解析 |
| global-shortcut | 全局快捷键 |
| localhost | 生产环境 localhost 服务器 |
| persisted-scope | 持久化文件访问权限 |
| positioner | 窗口定位 |
| process | 进程管理 |
| shell | 子进程 + 打开文件/URL |
| single-instance | 单实例 |
| stronghold | 加密安全存储 (IOTA) |
| updater | 应用内更新 |
| websocket | WebSocket 客户端 |
| window-state | 窗口状态持久化 |

---

## 3. 社区插件（移动端相关）

### 3.1 较成熟（>50 stars，活跃维护）

| 插件 | Stars | 平台 | 说明 | 链接 |
|------|-------|------|------|------|
| tauri-plugin-blec | 216 | iOS/Android/Desktop | 蓝牙 BLE 客户端 | [GitHub](https://github.com/MnlPhlp/tauri-plugin-blec) |
| tauri-plugin-aptabase | 153 | iOS/Android/Desktop | 隐私优先的应用分析 | [GitHub](https://github.com/aptabase/tauri-plugin-aptabase) |
| tauri-plugin-cache | 119 | iOS/Android/Desktop | 磁盘缓存 + 内存层 | [GitHub](https://github.com/Taiizor/tauri-plugin-cache) |
| tauri-plugin-sharesheet | 109 | iOS/Android | 系统分享面板 | [GitHub](https://github.com/buildyourwebapp/tauri-plugin-sharesheet) |
| tauri-plugin-view | 97 | iOS/Android | 文件预览和分享 | [GitHub](https://github.com/ecmel/tauri-plugin-view) |
| tauri-plugin-iap (Choochmeque) | 55 | iOS/Android/macOS/Win | 应用内购买（StoreKit 2 / Google Play Billing） | [GitHub](https://github.com/Choochmeque/tauri-plugin-iap) |
| tauri-plugin-notifications (Choochmeque) | 48 | iOS/Android/Desktop | 远程推送（FCM + APNs） | [GitHub](https://github.com/Choochmeque/tauri-plugin-notifications) |

### 3.2 可用但较早期（<50 stars）

| 插件 | Stars | 平台 | 说明 | 链接 |
|------|-------|------|------|------|
| tauri-plugin-android-fs | 29 | Android | Android Scoped Storage | [GitHub](https://github.com/aiueo13/tauri-plugin-android-fs) |
| tauri-plugin-biometry (Choochmeque) | 21 | iOS/Android/macOS/Win | 生物识别 + 安全存储 | [GitHub](https://github.com/Choochmeque/tauri-plugin-biometry) |
| tauri-plugin-camera | 15 | Android | 相机访问（仅 Android） | [GitHub](https://github.com/charlesschaefer/tauri-plugin-camera) |
| tauri-plugin-device-info | <10 | Mobile/Desktop | 设备信息 | [GitHub](https://github.com/edisdev/tauri-plugin-device-info) |
| tauri-plugin-status-bar | 6 | Android | 状态栏管理 | [GitHub](https://github.com/wtto00/tauri-plugin-status-bar) |
| tauri-plugin-virtual-keyboard | 3 | iOS | 键盘行为管理 | [GitHub](https://github.com/voxelbee/tauri-plugin-virtual-keyboard) |
| tauri-plugin-ios-photos | 1 | iOS | iOS 相册访问 | [GitHub](https://github.com/Gbyte-Group/tauri-plugin-ios-photos) |
| tauri-plugin-in-app-review | 1 | iOS/Android | 应用内评价 | [GitHub](https://github.com/Gbyte-Group/tauri-plugin-in-app-review) |
| tauri-plugin-orientation | 0 | Android | 屏幕方向控制 | [GitHub](https://github.com/Fanick-ZJ/tauri-plugin-orientation) |

### 3.3 inKibra 插件套件（iOS 专注）

仓库：[inKibra/tauri-plugins](https://github.com/inKibra/tauri-plugins)（54 stars）

| 插件 | 说明 | 平台 |
|------|------|------|
| tauri-plugin-auth | ASWebAuthenticationSession + Keychain | iOS |
| tauri-plugin-iap | StoreKit 应用内购 | iOS |
| tauri-plugin-sharing | 内容分享 | iOS |
| tauri-plugin-map-display | 原生地图 | iOS |
| tauri-plugin-notifications | 推送通知 | iOS |
| tauri-plugin-ota | OTA 热更新 | iOS |

---

## 4. 对标 Expo SDK：缺失模块分析

### 4.1 Expo SDK 主要模块列表

数据来源：[Expo SDK Reference](https://docs.expo.dev/versions/latest/)

| 模块 | 说明 | Tauri 有对应方案？ |
|------|------|--------------------|
| expo-camera | 相机 | ⚠️ 仅社区早期 Android 插件 |
| expo-image-picker | 图片/视频选择 | ❌ 无 |
| expo-media-library | 媒体库访问 | ⚠️ 仅 iOS Photos 早期插件 |
| expo-audio | 音频录制/播放 | ❌ 无 |
| expo-video | 视频播放 | ❌ 无 |
| expo-contacts | 通讯录 | ❌ 无 |
| expo-calendar | 日历 | ❌ 无 |
| expo-location | GPS 定位 | ✅ 官方 geolocation |
| expo-notifications | 通知 | ✅ 官方本地 + 社区远程推送 |
| expo-haptics | 触觉反馈 | ✅ 官方 haptics |
| expo-sensors | 传感器 | ❌ 无 |
| expo-barcode-scanner | 条码扫描 | ✅ 官方 barcode-scanner |
| expo-clipboard | 剪贴板 | ✅ 官方 clipboard-manager |
| expo-file-system | 文件系统 | ✅ 官方 fs |
| expo-sqlite | SQLite | ✅ 官方 sql |
| expo-secure-store | 安全存储 | ❌ 移动端无 |
| expo-auth-session | OAuth 认证 | ❌ 无 |
| expo-apple-authentication | Apple 登录 | ❌ 无 |
| expo-local-authentication | 本地认证 | ✅ 官方 biometric |
| expo-linking | Deep Linking | ✅ 官方 deep-link |
| expo-web-browser | 应用内浏览器 | ❌ 无 |
| expo-sharing | 系统分享 | ⚠️ 社区插件 |
| expo-document-picker | 文档选择 | ❌ 无 |
| expo-maps | 地图 | ⚠️ 仅 iOS 社区插件 |
| expo-task-manager | 后台任务 | ❌ 无 |
| expo-background-fetch | 后台抓取 | ❌ 无 |
| expo-network | 网络状态 | ❌ 无 |
| expo-device | 设备信息 | ⚠️ 社区早期插件 |
| expo-battery | 电池信息 | ❌ 无 |
| expo-brightness | 屏幕亮度 | ❌ 无 |
| expo-screen-orientation | 屏幕方向 | ⚠️ 社区早期插件 |
| expo-splash-screen | 启动屏 | ❌ 无 |
| expo-crypto | 加密 | ❌ JS 端无 API |
| expo-cellular | 蜂窝网络 | ❌ 无 |
| expo-store-review | 应用内评价 | ⚠️ 社区早期插件 |
| expo-app-integrity | App 完整性 | ❌ 无 |
| expo-glass-effect | 毛玻璃效果 | ❌ 无 |

**统计：**
- ✅ 已有成熟方案：10 个
- ⚠️ 有早期/不完整方案：7 个
- ❌ 完全缺失：20 个

### 4.2 缺失模块优先级排序

#### 🔴 高优先级（几乎所有移动 App 都需要）

| 模块 | Expo 对应 | 理由 |
|------|-----------|------|
| Camera | expo-camera | 拍照/录像是最基础的移动能力 |
| Image Picker | expo-image-picker | 选择相册图片/视频，使用频率极高 |
| Secure Store | expo-secure-store | Token/密钥安全存储，认证流程必备 |
| Auth Session | expo-auth-session | OAuth/社交登录，几乎所有 App 必需 |
| Audio | expo-audio | 音频录制和播放 |
| Background Task | expo-task-manager | 后台同步、下载、定位等 |

#### 🟡 中优先级（特定品类 App 需要）

| 模块 | Expo 对应 | 理由 |
|------|-----------|------|
| Contacts | expo-contacts | 社交/通讯类 App |
| Calendar | expo-calendar | 日程/效率类 App |
| Media Library | expo-media-library | 媒体/社交类 App |
| Document Picker | expo-document-picker | 文件管理/办公类 App |
| Web Browser | expo-web-browser | OAuth 回调、外链预览 |
| Maps | expo-maps | LBS/外卖/出行类 App |
| Video | expo-video | 视频播放 |
| Network | expo-network | 网络状态监听 |
| Crypto | expo-crypto | 端到端加密 |
| Splash Screen | expo-splash-screen | 启动体验 |
| Apple Auth | expo-apple-authentication | iOS App Store 审核要求 |

#### 🟢 低优先级（锦上添花）

| 模块 | Expo 对应 | 理由 |
|------|-----------|------|
| Brightness | expo-brightness | 阅读类 App |
| Battery | expo-battery | 电池优化展示 |
| Sensors | expo-sensors | 运动/健康/AR 类 App |
| Device | expo-device | 设备信息采集 |
| Screen Orientation | expo-screen-orientation | 视频/游戏类 App |
| Cellular | expo-cellular | 运营商信息 |
| Local Auth (PIN) | expo-local-authentication | biometric 已覆盖大部分场景 |
| App Integrity | expo-app-integrity | 安全审计 |

---

## 5. 架构设计建议

### 5.1 项目架构

```
@aspect/sdk                     ← 统一 TypeScript API 层
    │  封装
    ▼
@aspect/plugin-xxx              ← Tauri 插件层 (Rust + Swift/Kotlin)
    │  调用
    ▼
iOS / Android 原生 API
```

每个模块的结构：

```
@aspect/plugin-camera/
├── src/                        ← Rust 核心 (桥接层)
│   ├── lib.rs
│   ├── mobile.rs               ← 移动端实现 (调用 Swift/Kotlin)
│   └── desktop.rs              ← 桌面端实现 (Web fallback)
├── ios/                        ← Swift 原生代码 (从 Expo 移植)
├── android/                    ← Kotlin 原生代码 (从 Expo 移植)
├── guest-js/                   ← TypeScript API
│   └── index.ts
├── Cargo.toml
└── package.json
```

### 5.2 关键设计原则

1. **Platform Fallback** — 移动端走原生，桌面端走 Web API，无能力时静默降级
2. **Expo API 兼容** — TypeScript API 尽量与 Expo 保持一致，降低迁移成本
3. **独立发布** — 每个插件独立 crate + npm 包，按需安装
4. **原生代码复用** — Swift/Kotlin 层尽量从 Expo 模块源码移植，减少重复工作

### 5.3 移植策略（以 expo-camera 为例）

```
expo-camera 源码结构：
├── ios/CameraModule.swift          → 复制到 plugin-camera/ios/
├── android/CameraModule.kt        → 复制到 plugin-camera/android/
├── src/Camera.tsx                  → 不需要 (React Native 组件)
└── src/Camera.types.ts             → 参考，重写为 guest-js/index.ts

需要新写的：
├── src/lib.rs                      → Rust 桥接层
├── src/mobile.rs                   → invoke Swift/Kotlin
└── guest-js/index.ts               → TypeScript API (invoke Tauri commands)

核心工作量：剥离 Expo Module API 依赖，替换为 Tauri Plugin API
```

---

## 6. 推荐路线图

```
Phase 1 — 核心能力（让 App 能做基本的事）         预计 3-4 个月
├── @aspect/camera              ← expo-camera 移植
├── @aspect/image-picker        ← expo-image-picker 移植
├── @aspect/secure-store        ← expo-secure-store 移植
├── @aspect/auth-session        ← expo-auth-session 移植
└── @aspect/audio               ← expo-audio 移植

Phase 2 — 数据访问（让 App 能访问用户数据）       预计 2-3 个月
├── @aspect/contacts            ← expo-contacts 移植
├── @aspect/calendar            ← expo-calendar 移植
├── @aspect/media-library       ← expo-media-library 移植
├── @aspect/document-picker     ← expo-document-picker 移植
└── @aspect/network             ← expo-network 移植

Phase 3 — 增强体验（让 App 更完善）               预计 3-4 个月
├── @aspect/background-task     ← expo-task-manager 移植
├── @aspect/web-browser         ← expo-web-browser 移植
├── @aspect/maps                ← expo-maps 移植
├── @aspect/video               ← expo-video 移植
├── @aspect/splash-screen       ← expo-splash-screen 移植
├── @aspect/brightness          ← expo-brightness 移植
└── @aspect/apple-auth          ← expo-apple-authentication 移植
```

### 不需要做的（Tauri 已有成熟方案）

- 触觉反馈 → `tauri-plugin-haptics`
- 条码扫描 → `tauri-plugin-barcode-scanner`
- 生物识别 → `tauri-plugin-biometric`
- 地理定位 → `tauri-plugin-geolocation`
- NFC → `tauri-plugin-nfc`
- 本地通知 → `tauri-plugin-notification`
- 剪贴板 → `tauri-plugin-clipboard-manager`
- 文件系统 → `tauri-plugin-fs`
- HTTP → `tauri-plugin-http`
- SQLite → `tauri-plugin-sql`
- 存储 → `tauri-plugin-store`
- Deep Link → `tauri-plugin-deep-link`
- BLE → `tauri-plugin-blec` (社区)

---

## 7. POC 建议

从 **expo-haptics** 开始做第一个 POC（虽然 Tauri 已有官方 haptics 插件，但 expo-haptics 代码量极小，适合验证完整移植流程）：

1. Fork expo-haptics 源码
2. 提取 iOS Swift / Android Kotlin 原生代码
3. 剥离 Expo Module API 依赖
4. 包装为 Tauri Plugin (Rust 桥接)
5. 编写 TypeScript API (guest-js)
6. 发布 npm + crates.io

跑通后，按路线图推进 Phase 1 的 5 个核心模块。

---

## 参考链接

- [Tauri 官方插件仓库](https://github.com/tauri-apps/plugins-workspace)
- [Tauri 官方插件页面](https://v2.tauri.app/plugin/)
- [Tauri 移动端插件开发文档](https://v2.tauri.app/develop/plugins/develop-mobile/)
- [Expo SDK 参考文档](https://docs.expo.dev/versions/latest/)
- [Expo GitHub 仓库](https://github.com/expo/expo)
- [awesome-tauri](https://github.com/tauri-apps/awesome-tauri)
- [CrabNebula - Tauri UI 库推荐](https://crabnebula.dev/blog/the-best-ui-libraries-for-cross-platform-apps-with-tauri/)
- [Choochmeque 插件套件](https://github.com/Choochmeque)
- [inKibra 插件套件](https://github.com/inKibra/tauri-plugins)
