# AI Agent — 协议标准：Function Calling / MCP / A2A

> 深入解析 Agent 生态的三层通信协议，理解"工具如何被调用"与"Agent 之间如何通信"

---

## 一、协议体系概览

```
┌──────────────────────────────────────────────────────────┐
│                    AG-UI 协议                             │
│              Agent ↔ 前端界面交互标准                     │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    A2A 协议（Google）                     │
│              Agent ↔ Agent 跨框架通信标准                  │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   MCP 协议（Anthropic）                   │
│              Agent ↔ 外部工具/服务标准接口                  │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│               Function Calling（各厂商）                   │
│              LLM 生成结构化工具调用指令                      │
└──────────────────────────────────────────────────────────┘
```

**一句话理解：**
- Function Calling → LLM 说"我要调用这个函数"
- MCP → Agent 通过标准接口连接工具
- A2A → 多个 Agent 之间互相委托任务
- AG-UI → Agent 与前端界面实时交互

---

## 二、Function Calling（函数调用）

### 2.1 核心原理

Function Calling 并不是让 LLM 真正"执行"代码，而是让 LLM **生成结构化的 JSON 调用指令**，由外部系统真正执行。

```
1. 开发者定义工具 Schema（函数名、参数、描述）
2. 用户提问 + 工具 Schema → 发送给 LLM
3. LLM 分析意图 → 生成 JSON 格式的工具调用指令
4. 外部系统解析 JSON → 实际执行函数
5. 将执行结果返回给 LLM → LLM 生成最终回答
```

### 2.2 各厂商实现对比

**OpenAI 格式：**
```typescript
// 定义工具
const tools = [{
  type: "function",
  function: {
    name: "get_weather",
    description: "获取指定城市的当前天气",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "城市名" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] }
      },
      required: ["city"]
    }
  }
}];

// 发送请求
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "北京今天天气如何？" }],
  tools,
  tool_choice: "auto"  // auto/none/required
});

// 解析工具调用
const toolCall = response.choices[0].message.tool_calls?.[0];
if (toolCall) {
  const args = JSON.parse(toolCall.function.arguments);
  // args = { city: "北京", unit: "celsius" }
  const result = await getWeather(args.city, args.unit);
  
  // 将结果返回给 LLM
  const finalResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: "北京今天天气如何？" },
      response.choices[0].message,  // 包含 tool_calls
      { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) }
    ]
  });
}
```

**Anthropic Claude 格式：**
```typescript
const response = await anthropic.messages.create({
  model: "claude-opus-4-6",
  max_tokens: 1024,
  tools: [{
    name: "get_weather",
    description: "获取城市天气",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string" }
      },
      required: ["city"]
    }
  }],
  messages: [{ role: "user", content: "北京天气？" }]
});

// Claude 的工具调用在 content 中
const toolUse = response.content.find(c => c.type === "tool_use");
```

**Rust 实现（调用 Anthropic API）：**
```rust
use serde_json::{json, Value};
use reqwest::Client;

async fn call_with_tool(client: &Client, query: &str) -> anyhow::Result<Value> {
    let body = json!({
        "model": "claude-opus-4-6",
        "max_tokens": 1024,
        "tools": [{
            "name": "get_weather",
            "description": "获取城市天气",
            "input_schema": {
                "type": "object",
                "properties": {
                    "city": { "type": "string", "description": "城市名" }
                },
                "required": ["city"]
            }
        }],
        "messages": [{ "role": "user", "content": query }]
    });

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", std::env::var("ANTHROPIC_API_KEY")?)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await?
        .json::<Value>()
        .await?;

    Ok(resp)
}
```

### 2.3 Function Calling 的局限性

| 问题 | 描述 |
|---|---|
| 无统一标准 | OpenAI、Claude、Gemini 格式各不同 |
| M×N 问题 | M 个应用 × N 个工具 = 大量重复对接工作 |
| 单步执行 | 每次只能调一个工具，多步需多轮对话 |
| 工具复用难 | 工具实现绑定在特定应用中 |

---

## 三、MCP 协议（Model Context Protocol）

### 3.1 什么是 MCP？

MCP 由 **Anthropic 于 2024 年 11 月开源**，是一个**标准化的 Agent ↔ 工具接口协议**。

**核心思路：** 将 M×N 问题变为 M+N
```
传统方式：M 个应用 × N 个工具 = M×N 个适配器
MCP 方式：M 个 MCP Client + N 个 MCP Server = M+N 个实现
```

### 3.2 MCP 架构

```
┌─────────────────────────────────────────────┐
│              MCP Host（主机）                 │
│   Claude Desktop / Cursor / 自定义应用        │
│                                             │
│   ┌─────────────┐    ┌─────────────┐        │
│   │ MCP Client  │    │ MCP Client  │        │
│   └──────┬──────┘    └──────┬──────┘        │
└──────────┼────────────────  ┼───────────────┘
           │                  │
     ┌─────▼─────┐      ┌─────▼─────┐
     │ MCP Server│      │ MCP Server│
     │ (文件系统) │      │ (数据库)  │
     └───────────┘      └───────────┘
```

**三层组件：**
- **MCP Host**：AI 应用（Claude Desktop、Cursor 等），解析用户意图
- **MCP Client**：Host 内置，与 Server 建立 1:1 连接
- **MCP Server**：封装具体工具（数据库、API、文件等），提供标准接口

### 3.3 MCP 提供的三类能力

| 能力 | 描述 | 示例 |
|---|---|---|
| **Resources（资源）** | 暴露数据供模型读取 | 文件内容、数据库记录 |
| **Tools（工具）** | 可执行的函数 | 搜索、发邮件、查数据库 |
| **Prompts（提示词）** | 预设的提示词模板 | 代码审查模板、分析报告模板 |

### 3.4 开发 MCP Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "我的工具服务",
  version: "1.0.0"
});

// 注册工具
server.tool(
  "query_database",
  "查询业务数据库",
  {
    sql: z.string().describe("SQL 查询语句"),
    limit: z.number().optional().describe("返回行数上限")
  },
  async ({ sql, limit = 100 }) => {
    const result = await db.query(sql, { limit });
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 注册资源
server.resource(
  "company-docs",
  "company://documents",
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: "text/markdown",
      text: await loadDocument(uri.pathname)
    }]
  })
);

// 启动服务
const transport = new StdioServerTransport();
await server.connect(transport);
```

```rust
// Rust 实现 MCP Server（使用 rmcp 库）
use rmcp::{tool, ServerHandler, ServiceExt};
use serde_json::Value;

#[derive(Clone)]
struct MyMcpServer;

#[tool(tool_box)]
impl MyMcpServer {
    /// 搜索知识库
    #[tool(description = "搜索公司知识库，返回相关文档片段")]
    async fn search_knowledge(
        &self,
        #[tool(description = "搜索关键词")] query: String,
        #[tool(description = "返回结果数量")] top_k: Option<u32>,
    ) -> String {
        let k = top_k.unwrap_or(5);
        // 实际搜索逻辑
        format!("搜索 '{}' 的前 {} 个结果：...", query, k)
    }
}

#[tokio::main]
async fn main() {
    let server = MyMcpServer;
    server.serve(rmcp::transport::stdio()).await.unwrap();
}
```

### 3.5 MCP 通信协议

MCP 基于 **JSON-RPC 2.0**，支持两种传输方式：
- **stdio**：进程间通信（本地工具）
- **SSE（Server-Sent Events）**：HTTP 远程通信

```json
// 工具调用请求
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "query_database",
    "arguments": { "sql": "SELECT * FROM users LIMIT 10" }
  }
}

// 响应
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{ "type": "text", "text": "[{\"id\": 1, ...}]" }]
  }
}
```

---

## 四、A2A 协议（Agent to Agent）

### 4.1 什么是 A2A？

A2A 由 **Google 于 2025 年 4 月发布**，现由 Linux 基金会托管，是**标准化的 Agent ↔ Agent 跨框架通信协议**。

**解决的问题：** 不同框架（LangGraph、CrewAI、AutoGen）构建的 Agent 之间无法互相调用。

### 4.2 A2A 核心概念

```
Agent Card（能力名片）: 描述 Agent 能做什么的 JSON 文件
Task（任务）:           一次 Agent 间的委托
Message（消息）:        任务执行中的通信单元
Artifact（产物）:       任务完成后的输出
```

**Agent Card 示例：**
```json
{
  "name": "数据分析 Agent",
  "description": "专业的数据分析智能体，可以处理 CSV、Excel 数据",
  "url": "https://agents.example.com/data-analyst",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "analyze_csv",
      "name": "CSV 数据分析",
      "description": "分析 CSV 文件，生成统计报告和可视化",
      "inputModes": ["text", "file"],
      "outputModes": ["text", "file"]
    }
  ],
  "authentication": {
    "schemes": ["bearer"]
  }
}
```

### 4.3 A2A 通信流程

```
客户端 Agent                    远程 Agent
    │                               │
    │── POST /tasks/send ──────────→│  发起任务
    │                               │  执行中...
    │← 200 { taskId: "xxx" } ──────│
    │                               │
    │── GET /tasks/{id} ──────────→│  轮询状态
    │← { status: "working" } ─────│
    │                               │
    │ (或使用 SSE 实时推送)           │
    │←── event: task-update ───────│
    │←── event: task-completed ────│  完成通知
    │                               │
    │── GET /tasks/{id}/artifacts ─→│  获取结果
    │← { artifact: {...} } ────────│
```

### 4.4 MCP vs A2A 的关系

```
                    Agent
                   /     \
          MCP 协议         A2A 协议
              │                │
         外部工具           其他 Agent
       (数据库/API)       (专业智能体)

类比：
MCP = Agent 的"手"（操作工具）
A2A = Agent 的"嘴"（与同伴沟通）
```

**生活案例：**
```
零售商店场景：
库存 Agent
├── 通过 MCP 连接：库存数据库、商品 API
└── 通过 A2A 委托：
    ├── 供应商 Agent（外部，不同框架）
    └── 物流 Agent（外部，不同框架）
```

---

## 五、AG-UI 协议（Agent-User Interaction）

**发布方：** CopilotKit  
**作用：** 规范 Agent 与前端界面的实时交互

**解决的问题：** 用户在界面上与 Agent 交互时，需要实时流式展示 Agent 的思考过程、工具调用状态、中间结果等。

```typescript
// AG-UI 事件类型（前端接收）
type AgentEvent =
  | { type: "TEXT_MESSAGE_CONTENT"; delta: string }        // 流式文字输出
  | { type: "TOOL_CALL_START"; toolName: string }          // 开始调用工具
  | { type: "TOOL_CALL_RESULT"; result: string }           // 工具调用结果
  | { type: "STATE_SNAPSHOT"; snapshot: Record<string, unknown> }  // 状态快照
  | { type: "RUN_FINISHED" };                              // 执行完成
```

---

## 六、协议对比总结

| 维度 | Function Calling | MCP | A2A | AG-UI |
|---|---|---|---|---|
| **发布方** | 各厂商（OpenAI等）| Anthropic | Google | CopilotKit |
| **发布时间** | 2023 | 2024.11 | 2025.04 | 2025 |
| **解决的问题** | LLM 调用函数 | Agent↔工具标准化 | Agent↔Agent 通信 | Agent↔前端交互 |
| **协议基础** | 厂商私有格式 | JSON-RPC 2.0 | HTTP + SSE + JSON-RPC | 事件流 |
| **标准化程度** | 低（各自为政）| 高（统一标准）| 高（开源基金会）| 中 |
| **成熟度** | 成熟 | 快速普及 | 新兴 | 新兴 |

---

## 七、学习建议

1. **先理解 Function Calling**：这是基础，所有框架底层都依赖它
2. **掌握 MCP**：目前最实用，各大 IDE（Cursor、VS Code）已全面支持
3. **关注 A2A**：多 Agent 系统的未来方向，适合提前布局
4. **按需了解 AG-UI**：如果你需要构建 Agent 前端界面

---

*相关文档：*
- [01-核心概念与架构原理](01-核心概念与架构原理.md)
- [04-工程实践与生产部署](04-工程实践与生产部署.md)
