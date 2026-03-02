这是基于我们所有讨论的**最终完整版 OmniAI 全栈设计方案**。

本方案集成了 **React + assistant-ui** (前端极致体验)、**NestJS + Vercel AI SDK** (后端流式标准)、**pnpm** (Monorepo 管理) 以及 **TypeORM + PostgreSQL** (企业级数据存储)。

---

# 🚀 OmniAI 全栈架构方案 v3.0 (最终版)

## 1. 架构总览 (Architecture)

### 系统交互图

Code snippet

```
graph TD
    subgraph Client [前端 (React + Capacitor)]
        UI[assistant-ui Thread]
        Hook[useChat Hook]
        User[用户]
    end

    subgraph Server [后端 (NestJS API)]
        Gateway[Chat Controller]
        Logic[Chat Service]
        SDK[Vercel AI SDK Core]
        ORM[TypeORM Repository]
    end

    subgraph Infrastructure [基础设施]
        DB[(PostgreSQL)]
        LLM[Ollama / OpenAI / DeepSeek]
    end

    User --> UI
    UI --> Hook
    Hook -- "POST /api/chat (Stream)" --> Gateway
    Gateway --> Logic
    Logic -- "1. Save User Msg" --> ORM
    Logic -- "2. streamText()" --> SDK
    SDK <--> LLM
    SDK -- "Stream Chunks" --> Gateway
    Gateway -- "SSE Stream" --> UI
    SDK -- "3. onFinish: Save AI Msg" --> ORM
    ORM --> DB
```

---

## 2. 技术栈详细清单 (Tech Stack)

| **领域**     | **技术选型**                 | **理由**                                  |
| ---------- | ------------------------ | --------------------------------------- |
| **包管理器**   | **pnpm**                 | 高效的磁盘空间利用，原生支持 Monorepo (Workspace)。    |
| **前端框架**   | **React 19** + Vite      | 目前生态最丰富、性能最好的组合。                        |
| **UI 组件**  | **assistant-ui**         | 专为 AI Chat 设计，内置打字机、Markdown、工具调用 UI。   |
| **样式库**    | Tailwind CSS + shadcn/ui | 现代、灵活，与 assistant-ui 风格统一。              |
| **移动端**    | Capacitor                | 将 React Web 应用无缝打包为 Android/iOS 原生 App。 |
| **后端框架**   | **NestJS**               | 模块化、依赖注入，适合构建可维护的大型后端。                  |
| **AI 运行时** | **ai** (Vercel AI SDK)   | 统一了各大模型厂商的 API，极大地简化了流式开发。              |
| **ORM**    | **TypeORM**              | 使用装饰器定义实体，与 NestJS 风格完美契合 (替代 Prisma)。  |
| **数据库**    | **PostgreSQL**           | 强大的关系型数据库，支持 JSONB 和向量扩展 (pgvector)。    |

---

## 3. 项目目录结构 (Monorepo)

Plaintext

```
OmniAI/
├── pnpm-workspace.yaml   # 定义 workspace (frontend, backend)
├── package.json          # 根配置，包含 concurrently 启动脚本
├── docker-compose.yml    # 数据库编排
├── backend/              # NestJS 应用
│   ├── src/
│   │   ├── entities/     # TypeORM 实体 (ChatSession, ChatMessage)
│   │   ├── chat/         # 聊天模块 (Controller, Service)
│   │   └── app.module.ts
│   └── package.json
└── frontend/             # React 应用
    ├── src/
    │   ├── lib/          # 运行时配置
    │   └── App.tsx       # assistant-ui 入口
    └── package.json
```

---

## 4. 后端核心实现 (NestJS + TypeORM)

### 4.1 实体定义 (Entities)

定义**会话 (Session)** 和 **消息 (Message)** 的表结构。

**`backend/src/entities/chat-session.entity.ts`**

TypeScript

```
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, Column } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity()
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'New Chat' })
  title: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages: ChatMessage[];
}
```

**`backend/src/entities/chat-message.entity.ts`**

TypeScript

```
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity()
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column()
  role: 'user' | 'assistant' | 'system';

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ChatSession, (session) => session.messages)
  session: ChatSession;
}
```

### 4.2 聊天服务 (Service) - 核心流逻辑

这里展示如何**一边流式输出，一边异步保存数据**。

**`backend/src/chat/chat.service.ts`**

TypeScript

```
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';
import { streamText, convertToCoreMessages } from 'ai';
import { createOllama } from 'ollama-ai-provider';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private msgRepo: Repository<ChatMessage>,
  ) {}

  async streamResponse(messages: any[], sessionId: string) {
    // 1. 配置模型 (Ollama 或 OpenAI)
    const ollama = createOllama({ baseURL: 'http://localhost:11434/api' });
    
    // 2. 异步保存用户发送的最新一条消息
    const lastUserMsg = messages[messages.length - 1];
    await this.msgRepo.save({
      role: 'user',
      content: lastUserMsg.content,
      session: { id: sessionId }
    });

    // 3. 调用 AI SDK 生成流
    const result = await streamText({
      model: ollama('qwen2.5:7b'),
      messages: convertToCoreMessages(messages),
      // 4. [关键] 生命周期钩子：当流结束时，保存 AI 完整回复
      onFinish: async ({ text }) => {
        await this.msgRepo.save({
          role: 'assistant',
          content: text,
          session: { id: sessionId }
        });
      },
    });

    // 5. 返回流对象
    return result;
  }
}
```

### 4.3 控制器 (Controller)

**`backend/src/chat/chat.controller.ts`**

TypeScript

```
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async handleChat(
    @Body() body: { messages: any[]; sessionId: string }, 
    @Res() res: Response
  ) {
    const result = await this.chatService.streamResponse(body.messages, body.sessionId);
    // 将流直接 Pipe 给前端
    result.pipeDataStreamToResponse(res);
  }
}
```

---

## 5. 前端核心实现 (React + assistant-ui)

### 5.1 界面集成

**`frontend/src/App.tsx`**

TypeScript

```
import { Thread } from "@assistant-ui/react";
import { useChat } from "@ai-sdk/react";
import { makeMarkdownText } from "@assistant-ui/react-markdown";

// 引入样式
import "@assistant-ui/react/styles/index.css";
import "@assistant-ui/react-markdown/styles/index.css";

const MarkdownText = makeMarkdownText();

export default function App() {
  // 1. 模拟一个 Session ID (实际项目应从 URL 或路由获取)
  const sessionId = "550e8400-e29b-41d4-a716-446655440000";

  // 2. 连接 NestJS 后端
  const runtime = useChat({
    api: "http://localhost:3000/api/chat",
    body: { sessionId }, // 将 SessionID 传给后端用于存储
  });

  return (
    <div className="h-screen w-full flex justify-center bg-gray-50">
      <div className="w-full max-w-3xl h-full bg-white shadow-lg flex flex-col">
        {/* 3. assistant-ui 核心组件 */}
        <Thread 
          runtime={runtime}
          assistantMessage={{ components: { Text: MarkdownText } }}
        />
      </div>
    </div>
  );
}
```

---

## 6. 基础设施 (Docker Compose)

在根目录下创建 `docker-compose.yml`，用于快速启动 PostgreSQL。

YAML

```
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: omniai_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 7. 快速启动流程 (Quick Start)

由于使用了 pnpm monorepo，启动非常简单：

1. **启动数据库**：
    
    Bash
    
    ```
    docker-compose up -d
    ```
    
2. **安装依赖**：
    
    Bash
    
    ```
    pnpm install
    ```
    
3. **一键启动前后端** (假设你在根目录 `package.json` 配置了 `dev` 脚本)：
    
    Bash
    
    ```
    pnpm dev
    ```
    

这将同时启动：

- NestJS 后端 @ `http://localhost:3000`
    
- React 前端 @ `http://localhost:5173`
    

---

## 8. 下一步建议 (Next Step)

现在的代码已经是一个功能完整的 MVP（最小可行性产品）。

**您想先看哪一部分？**

1. **数据库迁移**：如何设置 TypeORM 的 `synchronize` 或 Migrations 以便建表？
    
2. **移动端打包**：如何运行 Capacitor 命令将这个 React 页面变成 Android APK？
    
3. **多模型切换**：如何在前端添加一个下拉菜单，让用户选择切换 Qwen 或 DeepSeek？