这是一个非常明智的调整。**React + `assistant-ui` + Vercel AI SDK** 是目前构建 AI Chat 应用的**“黄金标准”**组合。

`assistant-ui` 是一个专门为 React 设计的 AI 聊天组件库，它不仅提供了精美的默认 UI（类似 ChatGPT/Claude），还内置了处理流式传输、Markdown 渲染、即时编辑、重新生成等复杂的交互逻辑，能将前端开发效率提升 200%。

以下是基于 **React + assistant-ui + NestJS** 的全栈项目设计方案。

---

# 🚀 OmniAI 助手 (React 版) - 全栈项目设计方案

## 1. 核心架构概述 (Architecture Overview)

我们将打造一个**“瘦客户端，胖服务端”**的架构。

- **前端**：使用 `assistant-ui` 快速构建界面，专注于用户体验和跨端适配。
    
- **后端**：NestJS 作为统一网关（Gateway），屏蔽底层模型差异（Ollama vs External API），统一输出标准流格式。
    
- **三端策略**：Web 为主，使用 **Capacitor** 将 React Web 应用包装为 Android/iOS 原生 App。
    

---

## 2. 技术选型 (Tech Stack)

### A. 前端 (Client Side)

- **核心框架**: `React 18/19` + `TypeScript` + `Vite`。
    
- **AI UI 框架**: **`assistant-ui`** (核心组件库)。
    
    - 配合 **`@ai-sdk/react`** (Vercel AI SDK 的 React 钩子，用于状态管理)。
        
- **样式方案**: `Tailwind CSS` + `shadcn/ui` (assistant-ui 基于此构建，风格统一)。
    
- **Markdown 渲染**: `assistant-ui` 内置支持，底层通常依赖 `react-markdown` 和 `remark-gfm`。
    
- **移动端容器**: `Capacitor` (将 Web 页面打包成 App，调用原生能力如震动、状态栏)。
    

### B. 后端 (Server Side)

- **框架**: `NestJS`。
    
- **AI 运行时**: **`ai` (Vercel AI SDK Core)**。
    
    - _注意_：虽然是 Node.js 后端，引入 `ai` 包可以极大地简化流式响应（Streaming）的编写。
        
- **模型连接**:
    
    - **本地**: Qwen2.5 (通过 Ollama)。
        
    - **云端**: OpenAI / DeepSeek / Claude (通过 API Key)。
        
- **数据库**: `PostgreSQL` + `Prisma` (存储聊天记录 `Thread` 和消息 `Message`)。
    

---

## 3. 详细架构设计 (Detailed Architecture)

### 3.1 交互流程图

前端 `assistant-ui` 并不直接连接 LLM，而是连接你的 NestJS API。

Code snippet

```
sequenceDiagram
    participant User
    participant ReactApp as React (assistant-ui)
    participant Nest as NestJS (API Gateway)
    participant DB as Postgres
    participant LLM as Ollama/OpenAI

    User->>ReactApp: 输入 "你好，Qwen"
    ReactApp->>Nest: POST /api/chat (Message History)
    Nest->>Nest: 鉴权 & 提取配置
    Nest->>LLM: 发送 Prompt (stream: true)
    LLM-->>Nest: 返回 Stream Chunk
    Nest-->>ReactApp: 转发 Stream (TextPart / ToolCall)
    ReactApp-->>User: 逐字显示 (打字机效果)
    Nest->>DB: 异步保存完整对话记录
```

### 3.2 目录结构规划 (Monorepo 思想)

Plaintext

```
OmniAI-Project/
├── backend/ (NestJS)
│   ├── src/
│   │   ├── ai/          # AI 核心模块
│   │   │   ├── ai.controller.ts  # 处理 /api/chat 请求
│   │   │   ├── ai.service.ts     # 调用 Ollama 或 云端 API
│   │   │   └── model-manager.ts  # 模型切换逻辑
│   │   ├── chat/        # 历史记录 CRUD
│   │   └── app.module.ts
├── frontend/ (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/      # shadcn 组件
│   │   │   └── chat/    # assistant-ui 定制组件
│   │   ├── lib/
│   │   │   └── runtime.ts # 定义 EdgeRuntime 或 自定义 Runtime
│   │   └── App.tsx
├── mobile/ (Capacitor)
│   ├── android/
│   └── ios/
```

---

## 4. 核心功能实现 (Key Implementation)

### 4.1 前端：集成 assistant-ui

`assistant-ui` 的核心在于 `Thread` 组件。我们需要构建一个 `Runtime` 来告诉它去哪里获取数据。

**安装依赖：**

Bash

```
npm install @assistant-ui/react @assistant-ui/react-markdown @ai-sdk/react ai
```

**代码实现 (`frontend/src/App.tsx`)：**

TypeScript

```
import { Thread } from "@assistant-ui/react";
import { useChat } from "@ai-sdk/react"; // Vercel AI SDK hook
import { makeMarkdownText } from "@assistant-ui/react-markdown";

const MarkdownText = makeMarkdownText();

export default function App() {
  // 1. 使用 useChat 连接 NestJS 后端
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({
    api: 'http://localhost:3000/api/ai/chat', // 指向你的 NestJS 接口
    body: {
      model: 'qwen2.5:3b', // 动态传参
    },
  });

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* 2. assistant-ui 负责所有 UI 渲染 */}
      <Thread 
        messages={messages}
        input={input}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        assistantMessage={{ components: { Text: MarkdownText } }} // 启用 Markdown
      />
    </div>
  );
}
```

### 4.2 后端：NestJS 对接 Ollama 并流式返回

这是整个系统的“心脏”。我们将使用 Vercel AI SDK 的 `streamText` 方法，它能自动处理不同厂商的 API 差异，并生成前端能看懂的 Stream 数据。

**安装依赖：**

Bash

```
npm install ai @ai-sdk/openai @ai-sdk/ollama
```

**代码实现 (`backend/src/ai/ai.controller.ts`)：**

TypeScript

```
import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { createOllama } from 'ollama-ai-provider'; // 或 @ai-sdk/ollama
import { streamText, convertToCoreMessages } from 'ai';

@Controller('api/ai')
export class AiController {
  
  @Post('chat')
  async chat(@Body() body: { messages: any[]; model: string }, @Res() res: Response) {
    const { messages, model } = body;

    // 1. 初始化模型 (这里演示 Ollama，也可以根据参数切换 OpenAI)
    const ollama = createOllama({
      baseURL: 'http://localhost:11434/api', // 本地 Ollama 地址
    });

    // 2. 调用模型并开启流
    const result = await streamText({
      model: ollama(model || 'qwen2.5:3b'), // 指定模型
      messages: convertToCoreMessages(messages), // 转换消息格式
    });

    // 3. 将流直接 pipe 到响应中
    // result.toDataStreamResponse() 会生成标准的 AI Stream 格式
    // NestJS 中需要手动处理底层 response
    result.pipeDataStreamToResponse(res);
  }
}
```

---

## 5. 三端适配方案 (Mobile & Web)

`assistant-ui` 默认是响应式的，但为了达到原生 App 的体验，需要做以下优化：

### 5.1 移动端布局 (Mobile Web)

- **视口设置**: 在 `index.html` 中禁止缩放。
    
    HTML
    
    ```
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    ```
    
- **CSS 适配**:
    
    - PC 端：显示侧边栏（历史记录），主聊天框居中，最大宽度 `max-w-4xl`。
        
    - Mobile 端：隐藏侧边栏（改为抽屉 Drawer），聊天框宽度 `100%`。
        

### 5.2 打包成 App (Capacitor)

1. **初始化**:
    
    Bash
    
    ```
    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
    npx cap init
    ```
    
2. **关键插件**:
    
    - `@capacitor/keyboard`: 解决软键盘弹出时顶起输入框的问题（非常重要）。
        
    - `@capacitor/preferences`: 用于在本地存储 API Key 或用户偏好设置。
        
3. 配置 SafeArea:
    
    使用 CSS 变量 env(safe-area-inset-top) 确保刘海屏手机顶部不被遮挡。
    

---

## 6. 进阶功能规划

为了让你的助手更强大，可以利用 `assistant-ui` 的高级特性：

1. **工具调用 (Tool Calling)**:
    
    - 在 NestJS 的 `streamText` 中定义 `tools`（例如：查询天气、搜索网页）。
        
    - Qwen2.5 支持 Function Calling，后端执行完工具后，将结果回传给模型，模型生成最终回答。
        
    - `assistant-ui` 会自动显示“正在调用天气工具...”的 UI 状态。
        
2. **生成式 UI (Generative UI)**:
    
    - 如果模型返回的数据是结构化的（如 JSON），React 端可以使用 `render` 属性渲染自定义组件（例如：生成一个股票走势图组件，而不是纯文本）。
        
3. **语音输入**:
    
    - 集成 `react-speech-recognition` 或浏览器原生 API，将语音转为文字填入 `assistant-ui` 的 Input 框。
        

---

## 7. 总结：为什么这个方案更好？

|**特性**|**纯 Vue/React 手写**|**React + assistant-ui**|
|---|---|---|
|**开发速度**|慢 (需手写打字机效果、滚动逻辑、Markdown样式)|**极快** (开箱即用)|
|**代码质量**|容易出现复杂的 `useEffect` 和状态混乱|状态由 `ai-sdk` 管理，逻辑清晰|
|**交互体验**|需自己打磨 Loading、Error、Stop 生成等细节|**商业级体验** (自带平滑动画、优雅降级)|
|**后端对接**|需手写 SSE 解析器|标准协议，**即插即用**|

这个方案能让你把精力集中在 **“如何调教 Qwen 模型”** 和 **“业务逻辑（如保存历史、鉴权）”** 上，而不是浪费在写 CSS 和处理流式字符串解析上。

下一步建议：

我可以为您提供 frontend 端集成 assistant-ui 的具体组件代码（包含如何自定义样式以适配移动端），或者 NestJS 后端对接 Ollama 的完整 Service 代码。您倾向于先看哪部分？