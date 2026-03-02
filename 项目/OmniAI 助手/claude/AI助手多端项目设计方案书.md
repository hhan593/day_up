
  

## 一、项目概述

  

### 1.1 项目简介

基于React + NestJS构建的全栈AI助手应用，支持PC端、移动端Web访问，后续扩展移动APP。集成本地Qwen2.5:3b模型和第三方AI API，为用户提供智能对话服务。

  

### 1.2 项目目标

- 构建统一的AI对话交互界面

- 支持多AI模型切换（本地Qwen + 云端API）

- 实现跨平台响应式设计

- 提供用户管理和对话历史功能

- 可扩展的架构设计

  

### 1.3 技术选型

  

#### 前端技术栈

- **框架**: React 18 + TypeScript

- **构建工具**: Vite 5

- **UI组件**: assistant-ui (AI对话组件)

- **UI框架**: TailwindCSS / Ant Design Mobile

- **状态管理**: Zustand / Jotai

- **路由**: React Router v6

- **HTTP客户端**: Axios

- **实时通信**: Socket.io-client

- **包管理**: pnpm

  

#### 后端技术栈

- **框架**: NestJS

- **语言**: TypeScript

- **数据库**: MySQL (云数据库)

- **ORM**: TypeORM

- **认证**: JWT + Passport

- **实时通信**: Socket.io

- **API文档**: Swagger

- **日志**: Winston

- **缓存**: Redis (可选)

  

#### AI集成

- **本地模型**: Qwen2.5:3b (Ollama)

- **云端API**: OpenAI API / Claude API / 其他兼容接口

- **流式响应**: Server-Sent Events (SSE)

  

---

  

## 二、系统架构设计

  

### 2.1 整体架构图

  

```

┌─────────────────────────────────────────────────────────┐

│                    客户端层 (Client)                      │

├─────────────┬─────────────┬──────────────────────────────┤

│   PC Web    │  Mobile Web │    Native App (Future)       │

│  (Desktop)  │  (H5/PWA)   │    (React Native)            │

└─────────────┴─────────────┴──────────────────────────────┘

                      │

                      │ HTTPS / WSS

                      ▼

┌─────────────────────────────────────────────────────────┐

│                   API网关层 (Gateway)                     │

│  - 路由转发  - 身份认证  - 限流控制  - 日志记录           │

└─────────────────────────────────────────────────────────┘

                      │

        ┌─────────────┼─────────────┐

        │             │             │

        ▼             ▼             ▼

┌──────────────┐ ┌──────────────┐ ┌──────────────┐

│   用户服务   │ │   AI服务     │ │   对话服务   │

│  (User)      │ │  (AI)        │ │  (Chat)      │

└──────────────┘ └──────────────┘ └──────────────┘

        │             │             │

        └─────────────┼─────────────┘

                      ▼

        ┌─────────────────────────────┐

        │      数据访问层 (DAL)        │

        │       TypeORM + MySQL        │

        └─────────────────────────────┘

                      │

        ┌─────────────┼─────────────┐

        │             │             │

        ▼             ▼             ▼

    ┌───────┐   ┌────────┐   ┌──────────┐

    │ Redis │   │ MySQL  │   │ 文件存储 │

    │ Cache │   │   DB   │   │  (OSS)   │

    └───────┘   └────────┘   └──────────┘

  

                AI引擎层

        ┌─────────────┼─────────────┐

        │             │             │

        ▼             ▼             ▼

    ┌───────┐   ┌────────┐   ┌──────────┐

    │ Qwen  │   │ OpenAI │   │  Claude  │

    │ Local │   │  API   │   │   API    │

    └───────┘   └────────┘   └──────────┘

```

  

### 2.2 技术架构分层

  

#### 2.2.1 前端架构

  

```

src/

├── pages/              # 页面组件

│   ├── Home/          # 首页

│   ├── Chat/          # 对话页

│   ├── History/       # 历史记录

│   ├── Settings/      # 设置

│   └── Auth/          # 登录注册

├── components/        # 通用组件

│   ├── ChatMessage/   # 消息组件

│   ├── ModelSelector/ # 模型选择器

│   └── Layout/        # 布局组件

├── hooks/             # 自定义Hooks

│   ├── useChat.ts     # 对话逻辑

│   ├── useAuth.ts     # 认证逻辑

│   └── useStream.ts   # 流式响应

├── stores/            # 状态管理

│   ├── authStore.ts   # 用户状态

│   ├── chatStore.ts   # 对话状态

│   └── settingStore.ts # 设置状态

├── services/          # API服务

│   ├── api.ts         # 统一API封装

│   ├── chat.ts        # 对话API

│   └── auth.ts        # 认证API

├── utils/             # 工具函数

├── types/             # TypeScript类型

└── config/            # 配置文件

```

  

#### 2.2.2 后端架构

  

```

src/

├── modules/

│   ├── auth/          # 认证模块

│   │   ├── auth.controller.ts

│   │   ├── auth.service.ts

│   │   ├── auth.module.ts

│   │   └── strategies/

│   ├── user/          # 用户模块

│   │   ├── user.controller.ts

│   │   ├── user.service.ts

│   │   ├── user.entity.ts

│   │   └── user.module.ts

│   ├── chat/          # 对话模块

│   │   ├── chat.controller.ts

│   │   ├── chat.service.ts

│   │   ├── chat.gateway.ts  # WebSocket

│   │   ├── chat.entity.ts

│   │   └── chat.module.ts

│   └── ai/            # AI服务模块

│       ├── ai.controller.ts

│       ├── ai.service.ts

│       ├── providers/

│       │   ├── qwen.provider.ts

│       │   ├── openai.provider.ts

│       │   └── claude.provider.ts

│       └── ai.module.ts

├── common/

│   ├── decorators/    # 装饰器

│   ├── filters/       # 异常过滤器

│   ├── guards/        # 守卫

│   ├── interceptors/  # 拦截器

│   └── pipes/         # 管道

├── config/            # 配置

│   ├── database.config.ts

│   ├── jwt.config.ts

│   └── ai.config.ts

└── main.ts

```

  

---

  

## 三、数据库设计

  

### 3.1 数据表结构

  

#### 用户表 (users)

```sql

CREATE TABLE users (

  id VARCHAR(36) PRIMARY KEY,

  username VARCHAR(50) UNIQUE NOT NULL,

  email VARCHAR(100) UNIQUE NOT NULL,

  password_hash VARCHAR(255) NOT NULL,

  avatar_url VARCHAR(500),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  last_login_at TIMESTAMP,

  is_active BOOLEAN DEFAULT TRUE,

  INDEX idx_username (username),

  INDEX idx_email (email)

);

```

  

#### 对话会话表 (conversations)

```sql

CREATE TABLE conversations (

  id VARCHAR(36) PRIMARY KEY,

  user_id VARCHAR(36) NOT NULL,

  title VARCHAR(200) DEFAULT '新对话',

  model_type VARCHAR(50) NOT NULL,  -- qwen, openai, claude

  model_name VARCHAR(100),           -- qwen2.5:3b, gpt-4, etc.

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  is_archived BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_id (user_id),

  INDEX idx_created_at (created_at)

);

```

  

#### 消息表 (messages)

```sql

CREATE TABLE messages (

  id VARCHAR(36) PRIMARY KEY,

  conversation_id VARCHAR(36) NOT NULL,

  role ENUM('user', 'assistant', 'system') NOT NULL,

  content TEXT NOT NULL,

  tokens_used INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  metadata JSON,  -- 额外信息如模型参数等

  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,

  INDEX idx_conversation_id (conversation_id),

  INDEX idx_created_at (created_at)

);

```

  

#### 用户设置表 (user_settings)

```sql

CREATE TABLE user_settings (

  id VARCHAR(36) PRIMARY KEY,

  user_id VARCHAR(36) UNIQUE NOT NULL,

  default_model VARCHAR(50) DEFAULT 'qwen',

  theme VARCHAR(20) DEFAULT 'light',

  language VARCHAR(10) DEFAULT 'zh-CN',

  settings JSON,  -- 其他自定义设置

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

);

```

  

#### API密钥表 (api_keys)

```sql

CREATE TABLE api_keys (

  id VARCHAR(36) PRIMARY KEY,

  user_id VARCHAR(36) NOT NULL,

  provider VARCHAR(50) NOT NULL,  -- openai, claude, etc.

  api_key_encrypted VARCHAR(500) NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  INDEX idx_user_provider (user_id, provider)

);

```

  

### 3.2 TypeORM实体示例

  

```typescript

// user.entity.ts

@Entity('users')

export class User {

  @PrimaryGeneratedColumn('uuid')

  id: string;

  

  @Column({ unique: true, length: 50 })

  username: string;

  

  @Column({ unique: true, length: 100 })

  email: string;

  

  @Column({ name: 'password_hash', length: 255 })

  passwordHash: string;

  

  @Column({ name: 'avatar_url', nullable: true, length: 500 })

  avatarUrl?: string;

  

  @CreateDateColumn({ name: 'created_at' })

  createdAt: Date;

  

  @UpdateDateColumn({ name: 'updated_at' })

  updatedAt: Date;

  

  @Column({ name: 'last_login_at', nullable: true })

  lastLoginAt?: Date;

  

  @Column({ name: 'is_active', default: true })

  isActive: boolean;

  

  @OneToMany(() => Conversation, (conversation) => conversation.user)

  conversations: Conversation[];

  

  @OneToOne(() => UserSettings, (settings) => settings.user)

  settings: UserSettings;

}

```

  

---

  

## 四、核心功能设计

  

### 4.1 AI对话流程

  

```

用户输入消息

    │

    ▼

前端发送请求 (POST /api/chat/stream)

    │

    ▼

后端AI服务接收

    │

    ├─→ 验证用户身份

    ├─→ 检查模型可用性

    ├─→ 保存用户消息到数据库

    │

    ▼

选择AI Provider

    │

    ├─→ 本地Qwen (http://localhost:11434)

    ├─→ OpenAI API

    └─→ Claude API

    │

    ▼

流式生成响应 (SSE)

    │

    ├─→ 前端实时显示

    │

    ▼

生成完成

    │

    ├─→ 保存AI回复到数据库

    ├─→ 更新token使用统计

    │

    ▼

返回完成状态

```

  

### 4.2 认证流程

  

```

用户注册/登录

    │

    ▼

后端验证凭证

    │

    ▼

生成JWT Token (Access + Refresh)

    │

    ▼

前端存储Token (localStorage/sessionStorage)

    │

    ▼

后续请求携带Token (Authorization Header)

    │

    ▼

后端JWT Guard验证

    │

    ├─→ 有效: 放行

    └─→ 无效: 返回401

```

  

---

  

## 五、前端关键实现

  

### 5.1 使用assistant-ui

  

```typescript

// Chat.tsx

import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";

import { Thread } from "@assistant-ui/react";

  

export const ChatPage = () => {

  const runtime = useLocalRuntime({

    adapters: {

      chat: async ({ messages }) => {

        const response = await fetch('/api/chat/stream', {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json',

            'Authorization': `Bearer ${token}`

          },

          body: JSON.stringify({ messages })

        });

  

        return response.body; // 返回ReadableStream

      }

    }

  });

  

  return (

    <AssistantRuntimeProvider runtime={runtime}>

      <Thread />

    </AssistantRuntimeProvider>

  );

};

```

  

### 5.2 响应式设计

  

```typescript

// 使用TailwindCSS断点

<div className="

  w-full

  max-w-4xl

  mx-auto

  px-4 sm:px-6 lg:px-8

  py-4 sm:py-6 lg:py-8

">

  {/* PC端: 侧边栏 + 主内容 */}

  <div className="hidden lg:flex gap-6">

    <Sidebar />

    <MainContent />

  </div>

  

  {/* 移动端: 全屏内容 */}

  <div className="lg:hidden">

    <MobileContent />

  </div>

</div>

```

  

---

  

## 六、后端关键实现

  

### 6.1 AI服务抽象

  

```typescript

// ai.service.ts

export abstract class AIProvider {

  abstract chat(messages: Message[], options?: ChatOptions): Promise<AsyncIterableIterator<string>>;

}

  

// qwen.provider.ts

@Injectable()

export class QwenProvider extends AIProvider {

  async *chat(messages: Message[]): AsyncIterableIterator<string> {

    const response = await fetch('http://localhost:11434/api/chat', {

      method: 'POST',

      body: JSON.stringify({

        model: 'qwen2.5:3b',

        messages,

        stream: true

      })

    });

  

    const reader = response.body.getReader();

    while (true) {

      const { done, value } = await reader.read();

      if (done) break;

      yield new TextDecoder().decode(value);

    }

  }

}

  

// openai.provider.ts

@Injectable()

export class OpenAIProvider extends AIProvider {

  async *chat(messages: Message[]): AsyncIterableIterator<string> {

    const openai = new OpenAI({ apiKey: this.apiKey });

    const stream = await openai.chat.completions.create({

      model: 'gpt-4',

      messages,

      stream: true

    });

  

    for await (const chunk of stream) {

      yield chunk.choices[0]?.delta?.content || '';

    }

  }

}

```

  

### 6.2 流式响应控制器

  

```typescript

// chat.controller.ts

@Post('stream')

@UseGuards(JwtAuthGuard)

async streamChat(@Req() req, @Body() dto: ChatDto, @Res() res: Response) {

  res.setHeader('Content-Type', 'text/event-stream');

  res.setHeader('Cache-Control', 'no-cache');

  res.setHeader('Connection', 'keep-alive');

  

  const provider = this.aiService.getProvider(dto.model);

  const stream = provider.chat(dto.messages);

  

  for await (const chunk of stream) {

    res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);

  }

  

  res.write('data: [DONE]\n\n');

  res.end();

}

```

  

---

  

## 七、部署方案

  

### 7.1 开发环境

  

```yaml

# docker-compose.yml

version: '3.8'

services:

  mysql:

    image: mysql:8.0

    environment:

      MYSQL_ROOT_PASSWORD: password

      MYSQL_DATABASE: ai_assistant

    ports:

      - "3306:3306"

    volumes:

      - mysql_data:/var/lib/mysql

  

  redis:

    image: redis:alpine

    ports:

      - "6379:6379"

  

  backend:

    build: ./backend

    ports:

      - "3000:3000"

    environment:

      DATABASE_URL: mysql://root:password@mysql:3306/ai_assistant

      REDIS_URL: redis://redis:6379

    depends_on:

      - mysql

      - redis

  

  frontend:

    build: ./frontend

    ports:

      - "5173:5173"

    environment:

      VITE_API_URL: http://localhost:3000

  

volumes:

  mysql_data:

```

  

### 7.2 生产环境

  

```

前端部署: Vercel / Netlify / Nginx

后端部署: 云服务器 (阿里云/腾讯云) + PM2 / Docker

数据库: 云数据库MySQL

CDN: 静态资源加速

SSL: Let's Encrypt / 云服务商SSL

```

  

---

  

## 八、开发计划

  

### Phase 1: 基础架构 (2周)

- [ ] 初始化monorepo项目结构

- [ ] 配置pnpm workspace

- [ ] 搭建前端React + Vite项目

- [ ] 搭建后端NestJS项目

- [ ] 配置TypeORM + 云数据库连接

- [ ] 实现基础认证系统 (JWT)

  

### Phase 2: 核心功能 (3周)

- [ ] 集成assistant-ui组件

- [ ] 实现Qwen本地模型调用

- [ ] 实现流式对话功能

- [ ] 对话历史存储和读取

- [ ] 多模型切换功能

- [ ] 响应式UI设计 (PC + Mobile)

  

### Phase 3: 高级功能 (2周)

- [ ] 集成OpenAI/Claude API

- [ ] 用户自定义API Key

- [ ] 对话导出功能

- [ ] 主题切换 (深色/浅色)

- [ ] 多语言支持

  

### Phase 4: 优化与部署 (1周)

- [ ] 性能优化

- [ ] 安全加固

- [ ] 生产环境部署

- [ ] 监控和日志系统

- [ ] 文档完善

  

### Phase 5: 移动APP (待定)

- [ ] React Native环境搭建

- [ ] 复用前端组件逻辑

- [ ] 原生功能集成

- [ ] APP打包与发布

  

---

  

## 九、关键技术点

  

### 9.1 Monorepo结构

  

```

ai-assistant/

├── packages/

│   ├── frontend/          # React前端

│   ├── backend/           # NestJS后端

│   ├── shared/            # 共享类型和工具

│   └── mobile/            # React Native (Future)

├── pnpm-workspace.yaml

├── package.json

└── turbo.json             # Turborepo配置 (可选)

```

  

### 9.2 环境变量管理

  

```env

# backend/.env

DATABASE_HOST=your-cloud-db.mysql.rds.aliyuncs.com

DATABASE_PORT=3306

DATABASE_USER=admin

DATABASE_PASSWORD=your-password

DATABASE_NAME=ai_assistant

  

JWT_SECRET=your-secret-key

JWT_EXPIRES_IN=7d

  

QWEN_API_URL=http://localhost:11434

OPENAI_API_KEY=sk-xxx (可选)

CLAUDE_API_KEY=sk-xxx (可选)

  

# frontend/.env

VITE_API_URL=http://localhost:3000

VITE_WS_URL=ws://localhost:3000

```

  

### 9.3 安全考虑

  

1. API Key加密存储 (使用crypto加密)

2. SQL注入防护 (TypeORM自动处理)

3. XSS防护 (React自动转义)

4. CSRF防护 (使用csrf token)

5. 请求限流 (使用@nestjs/throttler)

6. HTTPS强制

7. 敏感信息脱敏

  

---

  

## 十、预期成果

  

1. **PC端网页**: 完整的桌面端AI对话界面，支持Chrome/Edge/Safari

2. **移动端网页**: 响应式H5页面，支持主流移动浏览器

3. **功能完备**:

   - 用户注册登录

   - 多模型对话 (Qwen本地 + 云端API)

   - 对话历史管理

   - 流式实时响应

   - 个性化设置

4. **可扩展性**: 模块化设计，易于添加新AI模型

5. **性能优化**: 首屏加载 < 2s，流式响应延迟 < 500ms

  

---

  

## 附录

  

### 推荐的NPM包

  

**前端**:

- `@assistant-ui/react` - AI对话UI

- `zustand` - 轻量状态管理

- `react-router-dom` - 路由

- `axios` - HTTP客户端

- `tailwindcss` - CSS框架

- `framer-motion` - 动画库

- `react-markdown` - Markdown渲染

- `highlight.js` - 代码高亮

  

**后端**:

- `@nestjs/typeorm` - ORM集成

- `@nestjs/jwt` - JWT认证

- `@nestjs/passport` - 认证策略

- `@nestjs/swagger` - API文档

- `class-validator` - 数据验证

- `bcrypt` - 密码加密

- `winston` - 日志

- `socket.io` - WebSocket

  

---

  

**文档版本**: v1.0

**最后更新**: 2026-01-30

**作者**: Claude Code