

背景（Context）  

本文档详细说明了多平台 AI 助手系统的技术架构与关键设计决策。该系统将支持三大客户端平台：React Native（移动 App）、React 移动端网页、React 桌面端网页，并通过统一的 NestJS 后端提供服务。

  

目标与非目标（Goals / Non-Goals）

  

✅ 目标

  

- 代码复用最大化：三端共用一套代码库，最大程度共享逻辑与组件

- 实时流式响应：通过 SSE 实现 AI 回复的逐字流式输出

- 灵活的 AI 模型集成：同时支持外部 API（如 OpenAI）和本地部署模型（如 Qwen2.5:3b）

- 安全认证体系：支持 JWT + OAuth 多种登录方式

- 平台专属体验：针对各端优化交互与布局（响应式设计）

- 类型安全开发：全栈 TypeScript 保障类型一致性

- 高效构建流程：基于 pnpm workspaces 的单体仓库（monorepo）管理

  

❌ 非目标（V1 不包含）

  

- 支持老旧浏览器（如 IE11）

- 实时语音交互能力

- 中英文以外的多语言界面

- 完整离线优先架构（仅基础离线同步）

  

架构概览（Architecture Overview）

  

单体仓库结构（Monorepo Structure）

ai-assistant/

├── packages/

│ ├── backend/ # NestJS 后端服务

│ ├── web/ # React 网页应用（桌面+移动）

│ ├── mobile/ # React Native 移动应用

│ ├── shared-ui/ # 跨平台 UI 组件库

│ ├── shared-types/ # 全局 TypeScript 类型定义

│ └── shared-utils/ # 工具函数集合

├── docker/ # Docker 配置文件

├── docs/ # 技术文档

└── scripts/ # 构建与部署脚本

  

技术栈（Technology Stack）

  

🔧 后端（Backend）

类别 技术选型

框架 NestJS + TypeScript

  

数据库 PostgreSQL + TypeORM

  

认证 JWT + passport.js

  

实时通信 WebSocket (socket.io)

  

文件存储 AWS S3（开发环境可用本地存储）

  

缓存 Redis（会话 & 数据缓存）

  

数据校验 class-validator + class-transformer

  

🌐 前端 - 网页端（Web）

类别 技术选型

框架 React 18 + TypeScript

  

构建工具 Vite（极速开发体验）

  

聊天组件 Assistant-UI

  

路由 React Router v6

  

状态管理 Zustand

  

样式方案 Tailwind CSS + CSS Modules

  

图标库 Lucide React

  

文件上传 react-dropzone

  

📱 前端 - 移动端（React Native）

类别 技术选型

框架 React Native + TypeScript

  

导航 React Navigation

  

UI 组件 React Native Paper + 自定义组件

  

状态管理 Zustand

  

实时通信 socket.io-client

  

文件选择 react-native-document-picker

  

推送通知 react-native-push-notification

  

核心组件设计（Core Components）

  

1. 认证系统（Authentication System）

   // 用户实体

   interface User {

   id: string;

   email: string;

   role: 'user' | 'admin';

   providers: OAuthProvider[]; // 如 Google, GitHub

   settings: UserSettings;

   }

  

// 会话管理（支持 Token 刷新）按照文档的开发放大

interface Session {

id: string;

userId: string;

refreshToken: string;

expiresAt: Date;

isActive: boolean;

}

  

1. AI 服务集成层（AI Service Integration）

   // 统一 AI 服务接口

   interface AIService {

   streamResponse(prompt: string, context: Message[]): AsyncIterable;

   getTokenUsage(): { input: number; output: number };

   switchModel(model: AIModel): void;

   }

  

// 支持的模型枚举

enum AIModel {

OPENAI_GPT4 = 'openai-gpt4',

QWEN_LOCAL = 'qwen-local' // 本地 Ollama 部署

}

  

1. WebSocket 网关（Real-time Gateway）

   @WebSocketGateway()

   export class ChatGateway {

   @SubscribeMessage('message')

   async handleMessage(

   client: Socket,

   payload: { conversationId: string; content: string }

   ): Promise {

   // 调用 AI 服务并流式推送回复

   const stream = this.aiService.streamResponse(...);

   for await (const chunk of stream) {

   client.emit('response_chunk', { chunk });

   }

   }

   }

  

数据库设计（Database Design）

  

主要实体（Entities）

  

1. User：用户账户与配置

2. Conversation：对话会话（含元数据）

3. Message：单条消息（支持附件）

4. ApiKey：外部 API 密钥（带调用限额）

5. Session：JWT 会话管理

6. Attachment：文件元数据与存储路径

  

关键关系示例

@Entity()

export class Conversation {

@PrimaryGeneratedColumn('uuid')

id: string;

  

@ManyToOne(() => User)

user: User;

  

@OneToMany(() => Message, message => message.conversation)

messages: Message[];

  

@Column({ default: () => 'CURRENT_TIMESTAMP' })

createdAt: Date;

}

  

@Entity()

export class Message {

@PrimaryGeneratedColumn('uuid')

id: string;

  

@ManyToOne(() => Conversation)

conversation: Conversation;

  

@ManyToOne(() => User)

user?: User; // AI 消息时为 null

  

@Column('text')

content: string;

  

@Column({ type: 'json', nullable: true })

attachments: Attachment[]; // 图片/文件列表

  

@Column({ default: () => 'CURRENT_TIMESTAMP' })

createdAt: Date;

}

  

平台专属实现（Platform-Specific Implementations）

  

🖥️ 网页端（Web）

  

- 桌面版：侧边栏布局 + 键盘快捷键

- 移动版：底部导航抽屉 + 手势操作

- 共用逻辑：同一套 React 组件，通过响应式设计适配

  

📲 移动端（React Native）

  

- 原生能力：推送通知、系统文件选择器

- 离线支持：SQLite 缓存消息（基础同步）

- 深度链接：Universal Links 支持会话分享

  

安全考量（Security Considerations）

  

🔒 认证安全

  

- JWT 短期有效（15 分钟）+ 刷新令牌轮换机制

- 社交登录（Google/GitHub）

- 认证接口限流防爆破

  

🛡️ 数据保护

  

- 全站 HTTPS

- 用户输入消毒（XSS 防护）

- 文件上传校验 + 病毒扫描

- 数据库连接加密

  

🚧 API 安全

  

- 外部 API 密钥自动轮换

- 关键操作请求签名

- 多域名 CORS 精细控制

  

性能优化（Performance Optimization）

  

⚙️ 后端优化

  

- 数据库外键 & 时间戳字段索引

- Redis 缓存高频访问数据

- 数据库连接池管理

- WebSocket 连接生命周期管控

  

🚀 前端优化

  

- 代码分割 + 懒加载

- 长对话虚拟滚动（避免 DOM 膨胀）

- 图片懒加载 + CDN 优化

- PWA Service Worker 缓存

  

开发工作流（Development Workflow）

  

包管理（pnpm workspaces）

{

"name": "ai-assistant",

"private": true,

"workspaces": ["packages/*"],

"scripts": {

"dev": "pnpm run:all", // 并行启动所有子项目

"build": "pnpm run:all build",

"lint": "pnpm run:all lint"

}

}

  

代码共享策略

共享包 内容

shared-types API 接口类型定义（前后端一致）

  

shared-ui 跨平台聊天组件（适配 Web/RN）

  

shared-utils 日期格式化、文件处理等工具函数

  

实施路线图（Migration Plan）

  

📌 阶段 1：后端搭建（2 周）

  

1. 初始化 NestJS + TypeORM 项目

2. 实现用户认证 & 基础实体

3. 开发 WebSocket 聊天网关

  

📌 阶段 2：网页端开发（2 周）

  

1. 搭建 React + Vite 项目

2. 集成 Assistant-UI 聊天界面

3. 实现 WebSocket 客户端 & Zustand 状态管理

  

📌 阶段 3：移动端开发（2 周）

  

1. React Native 应用框架搭建

2. 平台专属功能开发（推送、文件）

3. 三端交叉测试

  

📌 阶段 4：生产部署（2 周）

  

1. Docker 容器化

2. CI/CD 流水线（GitHub Actions）

3. 监控告警（Prometheus + Grafana）

  

风险与权衡（Risks / Trade-offs）

风险 缓解措施

单体仓库复杂度高 明确 workspace 规范 + 文档化约定

  

多端性能差异 平台专属优化 + CDN 资源分发

  

AI 模型集成复杂 抽象统一接口，隔离模型实现细节

  

WebSocket 连接不稳定 自动重连（指数退避算法）

  

待决议事项（Open Questions）

问题 决策

WebSocket 协议选型 采用 socket.io（内置重连、房间管理）

  

生产环境 AI 成本控制 实现用量追踪 + 账户额度限制

  

初始 OAuth 提供商 Google + GitHub（覆盖开发者 & 普通用户）

  

文件上传是否用 CDN 生产环境用 AWS S3 + 签名 URL

  

数据库迁移方案 TypeORM 自动迁移 + 手动回滚脚本

  

此架构设计兼顾了开发效率、运行性能与未来扩展性，为打造企业级多端 AI 助手奠定坚实基础。