# Pulsea设计文档：智能推送管理平台

> 基于现有 NestJS 天气推送/邮件/用户系统，扩展为 NestJS + React 全栈项目
> 设计时间：2026-03-10

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构设计](#2-系统架构设计)
3. [技术选型清单](#3-技术选型清单)
4. [数据库设计](#4-数据库设计)
5. [后端 API 设计](#5-后端-api-设计)
6. [前端页面设计](#6-前端页面设计)
7. [认证与权限设计](#7-认证与权限设计)
8. [项目目录结构](#8-项目目录结构)
9. [开发计划与里程碑](#9-开发计划与里程碑)
10. [部署方案](#10-部署方案)
11. [扩展规划](#11-扩展规划)

---

## 1. 项目概述

### 1.1 项目背景

当前项目（nest-winston-test）已实现：

- 天气数据获取（高德 API）
- 定时推送（PushPlus 微信推送）
- 邮件发送（QQ 邮箱 SMTP）
- 基础用户实体（TypeORM + MySQL）
- 天气分组配置管理
- 自定义日志（Winston）

**目标**：在现有基础上扩展为一个完整的**智能推送管理平台**，增加 React 前端管理界面，让用户可以通过 Web 界面配置推送规则、查看推送记录、管理订阅等。

### 1.2 核心功能

```
┌──────────────────────────────────────────────────────────────────┐
│                     智能推送管理平台                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   用户管理    │  │   推送管理    │  │   数据看板    │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • 注册/登录  │  │ • 天气推送   │  │ • 推送统计   │           │
│  │ • 个人中心   │  │ • 邮件推送   │  │ • 成功/失败率│           │
│  │ • 角色权限   │  │ • 自定义消息 │  │ • 趋势图表   │           │
│  └──────────────┘  │ • 定时配置   │  │ • 日志查询   │           │
│                    │ • 推送渠道   │  └──────────────┘           │
│  ┌──────────────┐  └──────────────┘                             │
│  │   订阅管理    │  ┌──────────────┐  ┌──────────────┐           │
│  ├──────────────┤  │   城市管理    │  │   系统设置    │           │
│  │ • 订阅分组   │  ├──────────────┤  ├──────────────┤           │
│  │ • 订阅频率   │  │ • 城市列表   │  │ • API Key    │           │
│  │ • 渠道偏好   │  │ • 天气缓存   │  │ • 推送渠道   │           │
│  │ • 退订管理   │  │ • 实时查询   │  │ • 定时策略   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构设计

### 2.1 整体架构

```
                         ┌─────────────────────┐
                         │     Nginx 反代       │
                         │   (生产环境)          │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │  React SPA │  │ NestJS API │  │  静态资源   │
              │  :5173     │  │  :3000     │  │  /uploads  │
              │  (Vite)    │  │            │  │            │
              └─────┬─────┘  └─────┬─────┘  └───────────┘
                    │               │
                    │         ┌─────▼─────┐
                    │         │           │
                    │    ┌────┤  Services ├────┐
                    │    │    │           │    │
                    │    │    └───────────┘    │
                    │    │                     │
               ┌────▼────▼──┐          ┌──────▼──────┐
               │   MySQL    │          │   Redis     │
               │  (数据持久化)│          │ (缓存/队列) │
               └────────────┘          └─────────────┘
                                             │
                         ┌───────────────────┼───────────────┐
                         │                   │               │
                   ┌─────▼─────┐  ┌─────────▼───┐  ┌───────▼───┐
                   │  高德API   │  │  PushPlus   │  │  QQ SMTP  │
                   │  天气数据   │  │  微信推送    │  │  邮件发送  │
                   └───────────┘  └─────────────┘  └───────────┘
```

### 2.2 Monorepo 结构

采用 **pnpm workspace** 的 Monorepo 方案，后端和前端在同一仓库中管理：

```
cpu/
├── packages/
│   ├── server/          ← NestJS 后端（现有代码迁入）
│   └── web/             ← React 前端（新建）
├── pnpm-workspace.yaml
├── package.json
└── ...
```

> **为什么选 Monorepo？**
>
> - 共享 TypeScript 类型定义（DTO、接口）
> - 统一版本管理和 CI/CD
> - 前后端联调方便
> - 与现有项目结构平滑过渡

---

## 3. 技术选型清单

### 3.1 后端技术栈

| 类别            | 技术                                | 版本   | 说明                              |
| --------------- | ----------------------------------- | ------ | --------------------------------- |
| **框架**        | NestJS                              | ^11.x  | 现有，保持不变                    |
| **语言**        | TypeScript                          | ^5.7   | 现有，保持不变                    |
| **HTTP 平台**   | Express                             | ^4.x   | 现有，NestJS 默认底层             |
| **ORM**         | TypeORM                             | ^0.3.x | 现有，保持不变                    |
| **数据库**      | MySQL 8                             | ^8.0   | 现有，保持不变                    |
| **缓存**        | Redis                               | ^7.x   | **新增**，天气数据缓存 + 会话存储 |
| **认证**        | @nestjs/passport + JWT              | latest | **新增**，JWT 无状态认证          |
| **验证**        | class-validator + class-transformer | latest | **新增**，请求数据验证            |
| **API 文档**    | @nestjs/swagger                     | latest | **新增**，自动生成 API 文档       |
| **HTTP 客户端** | @nestjs/axios                       | ^4.x   | 现有，调用外部 API                |
| **定时任务**    | @nestjs/schedule                    | ^6.x   | 现有，保持不变                    |
| **队列**        | @nestjs/bull                        | latest | **新增**，推送任务异步处理        |
| **日志**        | Winston                             | ^3.x   | 现有，增强日志持久化              |
| **邮件**        | Nodemailer                          | ^7.x   | 现有，保持不变                    |
| **文件上传**    | Multer (内置)                       | —      | **新增**，头像/附件上传           |

### 3.2 前端技术栈

| 类别            | 技术                        | 版本   | 说明                          |
| --------------- | --------------------------- | ------ | ----------------------------- |
| **框架**        | React                       | ^19.x  | 最新稳定版                    |
| **构建工具**    | Vite                        | ^6.x   | 极速开发体验                  |
| **语言**        | TypeScript                  | ^5.7   | 与后端保持一致                |
| **路由**        | React Router                | ^7.x   | SPA 路由管理                  |
| **状态管理**    | Zustand                     | ^5.x   | 轻量级状态管理，比 Redux 简洁 |
| **CSS 方案**    | Tailwind CSS                | ^4.x   | 原子化 CSS，灵活高效          |
| **图表**        | ECharts (echarts-for-react) | ^5.x   | 数据可视化，看板图表          |
| **HTTP 客户端** | Axios                       | ^1.x   | 与后端一致                    |
| **表单**        | React Hook Form + Zod       | latest | 高性能表单 + Schema 验证      |
| **图标**        | Lucide React                | latest | 轻量图标库                    |
| **通知**        | React Hot Toast             | latest | 轻量通知提示                  |
| **日期**        | Day.js                      | ^1.x   | 与后端一致                    |
| **表格**        | TanStack Table              | ^8.x   | 强大的 Headless 表格          |

### 3.3 数据库选型分析

```
┌─────────────┬──────────────────────────────────────────────────────┐
│             │                     选型分析                         │
├─────────────┼──────────────────────────────────────────────────────┤
│ MySQL 8     │ ✅ 现有数据库，无迁移成本                            │
│ (主数据库)   │ ✅ 关系型数据适合用户、订阅、推送记录                  │
│             │ ✅ 事务支持，数据一致性强                             │
│             │ ✅ TypeORM 已集成，生态成熟                           │
├─────────────┼──────────────────────────────────────────────────────┤
│ Redis       │ ✅ 天气数据缓存（避免频繁请求高德 API）               │
│ (缓存层)    │ ✅ JWT Token 黑名单（登出 Token 失效）                │
│             │ ✅ Bull 队列后端（推送任务异步处理）                   │
│             │ ✅ 限流计数器                                        │
└─────────────┴──────────────────────────────────────────────────────┘
```

### 3.4 为什么这样选？

| 决策                         | 理由                                         |
| ---------------------------- | -------------------------------------------- |
| **保留 MySQL + TypeORM**     | 已有数据库和实体，迁移成本为零               |
| **Zustand 而非 Redux**       | 项目中等规模，Zustand 足够且更简洁           |
| **Tailwind 而非 Ant Design** | 用户偏好；自定义程度高，包体积小             |
| **Vite 而非 Webpack**        | 开发体验显著更优，HMR 毫秒级                 |
| **Bull 队列**                | 推送任务可能失败需重试，异步解耦比同步更健壮 |
| **Zod + React Hook Form**    | Zod Schema 可前后端共享，RHF 性能优于 Formik |

---

## 4. 数据库设计

### 4.1 ER 关系图

```
┌──────────────┐     1:N     ┌──────────────────┐
│    users     │────────────▶│  subscriptions   │
│              │             │                  │
│ id (PK)      │             │ id (PK)          │
│ username     │◀────────┐   │ user_id (FK)     │
│ password     │         │   │ group_id (FK)    │
│ email        │         │   │ channel          │
│ avatar       │         │   │ is_active        │
│ phone        │         │   │ created_at       │
│ role         │         │   └──────────────────┘
│ status       │         │
│ last_login_at│         │   ┌──────────────────┐
│ created_at   │         │   │  push_logs       │
│ updated_at   │         └──▶│                  │
└──────────────┘     1:N     │ id (PK)          │
                             │ user_id (FK)     │
┌──────────────┐             │ group_id (FK)    │
│ push_groups  │             │ channel          │
│              │             │ title            │
│ id (PK)      │             │ content          │
│ name         │◀────────────│ status           │
│ description  │     N:1     │ error_message    │
│ cities (JSON)│             │ sent_at          │
│ topic        │             └──────────────────┘
│ schedule_cron│
│ is_active    │
│ created_by   │    ┌──────────────────┐
│ created_at   │    │ weather_cache    │
│ updated_at   │    │                  │
└──────────────┘    │ id (PK)          │
                    │ city_code        │
┌──────────────┐    │ city_name        │
│ system_config│    │ data (JSON)      │
│              │    │ type (live/forecast) │
│ id (PK)      │    │ cached_at        │
│ key          │    │ expires_at       │
│ value        │    └──────────────────┘
│ description  │
│ updated_at   │
└──────────────┘
```

### 4.2 表结构详细设计

#### users — 用户表（扩展现有）

```sql
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,          -- bcrypt 哈希
  email         VARCHAR(100) NOT NULL UNIQUE,
  avatar        VARCHAR(500) DEFAULT NULL,
  phone         VARCHAR(20) DEFAULT NULL,
  role          ENUM('admin', 'user') DEFAULT 'user',
  status        ENUM('active', 'disabled') DEFAULT 'active',
  last_login_at DATETIME DEFAULT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### push_groups — 推送分组表（替代硬编码配置）

```sql
CREATE TABLE push_groups (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  description   TEXT DEFAULT NULL,
  cities        JSON NOT NULL,                  -- [{"name":"余杭区","code":"330110"}]
  topic         VARCHAR(100) NOT NULL,          -- PushPlus topic
  schedule_cron VARCHAR(50) NOT NULL,           -- cron 表达式
  push_channel  ENUM('wechat', 'email', 'both') DEFAULT 'wechat',
  is_active     BOOLEAN DEFAULT TRUE,
  created_by    INT,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### subscriptions — 用户订阅表

```sql
CREATE TABLE subscriptions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  group_id      INT NOT NULL,
  channel       ENUM('wechat', 'email') DEFAULT 'wechat',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES push_groups(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_group_channel (user_id, group_id, channel)
);
```

#### push_logs — 推送日志表

```sql
CREATE TABLE push_logs (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT DEFAULT NULL,
  group_id      INT DEFAULT NULL,
  channel       ENUM('wechat', 'email', 'pushplus') NOT NULL,
  title         VARCHAR(200) NOT NULL,
  content       TEXT,
  status        ENUM('pending', 'success', 'failed', 'retrying') DEFAULT 'pending',
  error_message TEXT DEFAULT NULL,
  retry_count   INT DEFAULT 0,
  sent_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (group_id) REFERENCES push_groups(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_sent_at (sent_at),
  INDEX idx_user_id (user_id)
);
```

#### weather_cache — 天气缓存表

```sql
CREATE TABLE weather_cache (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  city_code  VARCHAR(20) NOT NULL,
  city_name  VARCHAR(50) NOT NULL,
  data       JSON NOT NULL,
  type       ENUM('live', 'forecast') NOT NULL,
  cached_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  UNIQUE KEY uk_city_type (city_code, type),
  INDEX idx_expires (expires_at)
);
```

#### system_config — 系统配置表

```sql
CREATE TABLE system_config (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  config_key  VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 初始数据
INSERT INTO system_config (config_key, config_value, description) VALUES
('amap_api_key', 'ad51495439312e88e03624ff15d37356', '高德地图 API Key'),
('pushplus_token', '868a684801904cac9b16ff7e2af45e54', 'PushPlus 推送 Token'),
('default_push_channel', 'wechat', '默认推送渠道'),
('weather_cache_ttl', '3600', '天气数据缓存时间（秒）');
```

---

## 5. 后端 API 设计

### 5.1 API 概览

基础路径：`/api/v1`

```
┌─────────────────────────────────────────────────────────────────┐
│                        API 模块划分                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  /api/v1/auth          认证模块 (公开)                          │
│    POST /login         登录                                     │
│    POST /register      注册                                     │
│    POST /refresh       刷新 Token                               │
│    POST /logout        登出                                     │
│                                                                 │
│  /api/v1/users         用户模块 (需认证)                         │
│    GET  /me            当前用户信息                              │
│    PUT  /me            更新个人信息                              │
│    PUT  /me/password   修改密码                                  │
│    POST /me/avatar     上传头像                                  │
│    GET  /              用户列表 (管理员)                          │
│    PUT  /:id/status    启用/禁用用户 (管理员)                     │
│                                                                 │
│  /api/v1/push-groups   推送分组模块 (需认证)                     │
│    GET  /              分组列表                                  │
│    POST /              创建分组                                  │
│    GET  /:id           分组详情                                  │
│    PUT  /:id           更新分组                                  │
│    DELETE /:id         删除分组                                  │
│    POST /:id/trigger   手动触发推送                              │
│                                                                 │
│  /api/v1/subscriptions 订阅模块 (需认证)                         │
│    GET  /              我的订阅                                  │
│    POST /              创建订阅                                  │
│    DELETE /:id         取消订阅                                  │
│                                                                 │
│  /api/v1/push-logs     推送日志模块 (需认证)                     │
│    GET  /              日志列表 (分页+筛选)                       │
│    GET  /stats         推送统计                                  │
│    GET  /stats/daily   每日推送趋势                              │
│                                                                 │
│  /api/v1/weather       天气模块 (需认证)                         │
│    GET  /live          实况天气                                  │
│    GET  /forecast      天气预报                                  │
│    GET  /cities        支持的城市列表                             │
│                                                                 │
│  /api/v1/system        系统管理 (管理员)                         │
│    GET  /config        系统配置                                  │
│    PUT  /config/:key   更新配置                                  │
│    GET  /health        健康检查                                  │
│    GET  /dashboard     看板数据                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 关键 API 详细设计

#### 认证相关

```
POST /api/v1/auth/login
  Body:    { username: string, password: string }
  Returns: { access_token: string, refresh_token: string, user: UserInfo }

POST /api/v1/auth/register
  Body:    { username: string, email: string, password: string }
  Returns: { access_token: string, user: UserInfo }
```

#### 推送分组

```
GET /api/v1/push-groups?page=1&limit=10&keyword=xxx
  Returns: { items: PushGroup[], total: number, page: number }

POST /api/v1/push-groups
  Body: {
    name: string,
    description?: string,
    cities: { name: string, code?: string }[],
    topic: string,
    schedule_cron: string,
    push_channel: 'wechat' | 'email' | 'both'
  }

POST /api/v1/push-groups/:id/trigger
  说明: 手动触发一次推送（忽略 cron 时间）
  Returns: { message: '推送任务已加入队列', jobId: string }
```

#### 推送统计

```
GET /api/v1/push-logs/stats
  Returns: {
    total: number,
    success: number,
    failed: number,
    success_rate: number,
    today_count: number
  }

GET /api/v1/push-logs/stats/daily?days=30
  Returns: {
    dates: string[],
    success: number[],
    failed: number[]
  }
```

### 5.3 统一响应格式

```typescript
// 成功响应
{
  code: 200,
  message: 'success',
  data: T,
  timestamp: '2026-03-10T12:00:00.000Z'
}

// 分页响应
{
  code: 200,
  message: 'success',
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}

// 错误响应
{
  code: 400 | 401 | 403 | 404 | 500,
  message: '错误描述',
  error: 'BadRequest',
  timestamp: '2026-03-10T12:00:00.000Z',
  path: '/api/v1/xxx'
}
```

---

## 6. 前端页面设计

### 6.1 页面结构

```
┌────────────────────────────────────────────────────────────────┐
│  NavBar  [Logo] 智能推送管理平台          [用户头像] [退出]     │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                     │
│  Sidebar │              Main Content                           │
│          │                                                     │
│ ┌──────┐ │  ┌───────────────────────────────────────────────┐  │
│ │ 看板  │ │  │                                               │  │
│ │ 推送  │ │  │     根据路由渲染不同页面内容                   │  │
│ │  分组 │ │  │                                               │  │
│ │  日志 │ │  │                                               │  │
│ │ 天气  │ │  │                                               │  │
│ │ 订阅  │ │  │                                               │  │
│ │ 用户  │ │  │                                               │  │
│ │ 设置  │ │  │                                               │  │
│ └──────┘ │  └───────────────────────────────────────────────┘  │
│          │                                                     │
└──────────┴─────────────────────────────────────────────────────┘
```

### 6.2 页面清单

| 页面         | 路由               | 说明                         | 权限   |
| ------------ | ------------------ | ---------------------------- | ------ |
| 登录         | `/login`           | 用户名 + 密码登录            | 公开   |
| 注册         | `/register`        | 新用户注册                   | 公开   |
| 数据看板     | `/dashboard`       | 推送概览、统计图表、实时状态 | 登录   |
| 推送分组列表 | `/push-groups`     | 分组 CRUD，支持搜索/筛选     | 登录   |
| 推送分组详情 | `/push-groups/:id` | 分组配置编辑、手动触发       | 登录   |
| 推送日志     | `/push-logs`       | 日志列表、状态筛选、时间范围 | 登录   |
| 天气查询     | `/weather`         | 实时天气查询、城市搜索       | 登录   |
| 我的订阅     | `/subscriptions`   | 管理个人订阅                 | 登录   |
| 用户管理     | `/users`           | 用户列表、状态管理           | 管理员 |
| 系统设置     | `/settings`        | API Key、推送渠道、全局配置  | 管理员 |
| 个人中心     | `/profile`         | 修改个人信息、密码、头像     | 登录   |

### 6.3 数据看板设计

```
┌─────────────────────────────────────────────────────────────────┐
│  数据看板                                          [今日] [本周] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │   今日推送  │  │  成功率     │  │  活跃分组   │  │  订阅用户  │ │
│  │   128      │  │  96.5%     │  │   12       │  │   56      │ │
│  │   ↑12%     │  │  ↑2.1%    │  │  ↑3        │  │  ↑8       │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │   推送趋势 (折线图)          │  │   渠道分布 (饼图)         │ │
│  │                              │  │                          │ │
│  │  128│    ╱\                  │  │     ┌────┐               │ │
│  │     │   ╱  \    ╱\          │  │    /  微信 \  65%         │ │
│  │   64│──╱    \──╱  \─        │  │   │  邮件   │ 25%        │ │
│  │     │ ╱      ╲╱    ╲       │  │    \  两者 /  10%         │ │
│  │    0│________________________│  │     └────┘               │ │
│  │     Mon Tue Wed Thu Fri Sat  │  │                          │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │   最近推送记录                                               ││
│  │   ┌──────┬──────────┬────────┬────────┬──────────┐          ││
│  │   │ 时间  │  分组     │ 城市   │ 渠道   │ 状态     │          ││
│  │   ├──────┼──────────┼────────┼────────┼──────────┤          ││
│  │   │19:30 │ 默认分组  │ 余杭区 │ 微信   │ ✅ 成功  │          ││
│  │   │18:10 │ 晚间分组  │ 大兴区 │ 邮件   │ ❌ 失败  │          ││
│  │   └──────┴──────────┴────────┴────────┴──────────┘          ││
│  └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 认证与权限设计

### 7.1 认证流程

```
┌────────┐                    ┌────────┐                  ┌────────┐
│ Client │                    │ NestJS │                  │ MySQL  │
└───┬────┘                    └───┬────┘                  └───┬────┘
    │                             │                           │
    │  POST /auth/login           │                           │
    │  {username, password}       │                           │
    │────────────────────────────▶│                           │
    │                             │  查询用户                  │
    │                             │──────────────────────────▶│
    │                             │◀──────────────────────────│
    │                             │  bcrypt 验证密码           │
    │                             │                           │
    │  { access_token,            │                           │
    │    refresh_token }          │                           │
    │◀────────────────────────────│                           │
    │                             │                           │
    │  GET /api/v1/xxx            │                           │
    │  Authorization: Bearer xxx  │                           │
    │────────────────────────────▶│                           │
    │                             │ JwtGuard 验证 Token        │
    │                             │ RolesGuard 检查权限        │
    │                             │                           │
    │  响应数据                    │                           │
    │◀────────────────────────────│                           │
    │                             │                           │
```

### 7.2 Token 策略

| 项目     | Access Token         | Refresh Token     |
| -------- | -------------------- | ----------------- |
| 有效期   | 15 分钟              | 7 天              |
| 存储位置 | 前端内存 (Zustand)   | HttpOnly Cookie   |
| 用途     | 接口认证             | 刷新 Access Token |
| 安全     | 短有效期降低泄露风险 | HttpOnly 防止 XSS |

### 7.3 角色权限

```
角色层级：
  admin (管理员) ─── 所有权限
    │
    └── user (普通用户) ─── 基础操作权限

权限矩阵：
┌──────────────────────┬───────┬───────┐
│      功能             │ admin │ user  │
├──────────────────────┼───────┼───────┤
│ 查看数据看板          │  ✅   │  ✅   │
│ 管理推送分组          │  ✅   │  ✅(仅自己创建的) │
│ 手动触发推送          │  ✅   │  ✅(仅自己的分组) │
│ 查看推送日志          │  ✅   │  ✅(仅自己的)     │
│ 管理个人订阅          │  ✅   │  ✅   │
│ 查询天气              │  ✅   │  ✅   │
│ 修改个人信息          │  ✅   │  ✅   │
│ 用户管理              │  ✅   │  ❌   │
│ 系统配置              │  ✅   │  ❌   │
│ 查看所有日志          │  ✅   │  ❌   │
└──────────────────────┴───────┴───────┘
```

---

## 8. 项目目录结构

### 8.1 后端 (packages/server)

```
packages/server/
├── src/
│   ├── main.ts                           # 入口文件
│   ├── app.module.ts                     # 根模块
│   │
│   ├── common/                           # 共享代码
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts # @CurrentUser() 获取当前用户
│   │   │   ├── public.decorator.ts       # @Public() 公开路由标记
│   │   │   └── roles.decorator.ts        # @Roles('admin') 角色标记
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # 全局异常过滤器
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts         # JWT 认证守卫
│   │   │   └── roles.guard.ts            # 角色权限守卫
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts  # 响应格式统一
│   │   │   └── logging.interceptor.ts    # 请求日志
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts        # 全局验证管道
│   │   └── dto/
│   │       └── pagination.dto.ts         # 通用分页 DTO
│   │
│   ├── config/                           # 配置
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── weather-groups.config.ts      # (现有)
│   │
│   ├── modules/
│   │   ├── auth/                         # 认证模块 (新增)
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── user/                         # 用户模块 (扩展现有)
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── entities/user.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── push-group/                   # 推送分组模块 (新增)
│   │   │   ├── push-group.module.ts
│   │   │   ├── push-group.controller.ts
│   │   │   ├── push-group.service.ts
│   │   │   ├── entities/push-group.entity.ts
│   │   │   └── dto/
│   │   │
│   │   ├── push-log/                     # 推送日志模块 (新增)
│   │   │   ├── push-log.module.ts
│   │   │   ├── push-log.controller.ts
│   │   │   ├── push-log.service.ts
│   │   │   └── entities/push-log.entity.ts
│   │   │
│   │   ├── subscription/                 # 订阅模块 (新增)
│   │   │   ├── subscription.module.ts
│   │   │   ├── subscription.controller.ts
│   │   │   ├── subscription.service.ts
│   │   │   └── entities/subscription.entity.ts
│   │   │
│   │   ├── weather/                      # 天气模块 (从 AppService 提取)
│   │   │   ├── weather.module.ts
│   │   │   ├── weather.controller.ts
│   │   │   ├── weather.service.ts
│   │   │   └── entities/weather-cache.entity.ts
│   │   │
│   │   ├── email/                        # 邮件模块 (现有)
│   │   │   ├── email.module.ts
│   │   │   └── email.service.ts
│   │   │
│   │   ├── task/                         # 定时任务模块 (重构现有)
│   │   │   ├── task.module.ts
│   │   │   └── task.service.ts
│   │   │
│   │   └── system/                       # 系统管理模块 (新增)
│   │       ├── system.module.ts
│   │       ├── system.controller.ts
│   │       ├── system.service.ts
│   │       └── entities/system-config.entity.ts
│   │
│   ├── logger/                           # 日志 (现有 MyLogger 重构)
│   │   └── winston.config.ts
│   │
│   └── types/                            # 类型定义 (现有)
│       └── index.ts
│
├── test/
├── .env
├── nest-cli.json
├── package.json
└── tsconfig.json
```

### 8.2 前端 (packages/web)

```
packages/web/
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                          # 入口
│   ├── App.tsx                           # 根组件
│   ├── index.css                         # Tailwind 入口
│   │
│   ├── api/                              # API 层
│   │   ├── client.ts                     # Axios 实例（拦截器、Token 注入）
│   │   ├── auth.api.ts                   # 认证接口
│   │   ├── user.api.ts                   # 用户接口
│   │   ├── push-group.api.ts             # 推送分组接口
│   │   ├── push-log.api.ts              # 推送日志接口
│   │   ├── weather.api.ts               # 天气接口
│   │   └── system.api.ts                # 系统接口
│   │
│   ├── stores/                           # Zustand 状态管理
│   │   ├── auth.store.ts                 # 认证状态（Token、用户信息）
│   │   └── app.store.ts                  # 全局 UI 状态（侧边栏、主题）
│   │
│   ├── hooks/                            # 自定义 Hooks
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   └── useDebounce.ts
│   │
│   ├── components/                       # 通用组件
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx             # 主布局（侧边栏+顶栏+内容区）
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navbar.tsx
│   │   ├── Table/
│   │   │   └── DataTable.tsx             # 通用表格（基于 TanStack Table）
│   │   ├── Form/
│   │   │   └── FormField.tsx             # 表单字段封装
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── ConfirmDialog.tsx
│   │
│   ├── pages/                            # 页面组件
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── PushTrendChart.tsx
│   │   │   └── RecentLogsTable.tsx
│   │   ├── push-groups/
│   │   │   ├── PushGroupListPage.tsx
│   │   │   └── PushGroupDetailPage.tsx
│   │   ├── push-logs/
│   │   │   └── PushLogListPage.tsx
│   │   ├── weather/
│   │   │   └── WeatherPage.tsx
│   │   ├── subscriptions/
│   │   │   └── SubscriptionPage.tsx
│   │   ├── users/
│   │   │   └── UserManagePage.tsx
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx
│   │   └── profile/
│   │       └── ProfilePage.tsx
│   │
│   ├── router/                           # 路由配置
│   │   ├── index.tsx                     # 路由定义
│   │   ├── PrivateRoute.tsx              # 认证路由守卫
│   │   └── AdminRoute.tsx                # 管理员路由守卫
│   │
│   ├── types/                            # TypeScript 类型
│   │   ├── api.types.ts                  # API 响应类型
│   │   ├── user.types.ts
│   │   ├── push-group.types.ts
│   │   └── weather.types.ts
│   │
│   └── utils/                            # 工具函数
│       ├── format.ts                     # 日期、数字格式化
│       └── storage.ts                    # localStorage 封装
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## 9. 开发计划与里程碑

### Phase 1：基础设施搭建（第 1 周）

```
┌─ Phase 1: 基础设施 ──────────────────────────────────────────────┐
│                                                                  │
│  [后端]                                                          │
│  □ 重构项目结构为 Monorepo (pnpm workspace)                      │
│  □ 迁移现有代码到 packages/server                                │
│  □ 配置数据库连接（启用 TypeORM）                                 │
│  □ 创建所有数据库实体和迁移                                       │
│  □ 实现全局拦截器（统一响应格式）                                  │
│  □ 实现全局异常过滤器                                             │
│  □ 配置 Swagger API 文档                                         │
│  □ 配置 Redis 连接                                               │
│                                                                  │
│  [前端]                                                          │
│  □ 初始化 React + Vite + TypeScript 项目                         │
│  □ 配置 Tailwind CSS                                             │
│  □ 配置 React Router                                             │
│  □ 实现 AppLayout 主布局                                         │
│  □ 配置 Axios 实例 + 拦截器                                      │
│  □ 配置 Zustand Store                                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 2：认证系统（第 2 周）

```
┌─ Phase 2: 认证系统 ──────────────────────────────────────────────┐
│                                                                  │
│  [后端]                                                          │
│  □ 实现 AuthModule（登录/注册/Token 刷新/登出）                   │
│  □ 实现 JWT 策略 + Local 策略                                    │
│  □ 实现 JwtAuthGuard（全局认证守卫）                              │
│  □ 实现 RolesGuard（角色权限守卫）                                │
│  □ 扩展 User 实体（角色、状态、最后登录时间等字段）                │
│  □ 密码 bcrypt 加密                                              │
│  □ @Public() 装饰器标记公开路由                                   │
│  □ @CurrentUser() 装饰器获取当前用户                              │
│                                                                  │
│  [前端]                                                          │
│  □ 实现登录页面                                                  │
│  □ 实现注册页面                                                  │
│  □ 实现 Token 自动刷新逻辑                                       │
│  □ 实现 PrivateRoute 路由守卫                                    │
│  □ 实现 AdminRoute 管理员守卫                                    │
│  □ 实现用户状态管理 (auth.store)                                 │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 3：核心业务（第 3-4 周）

```
┌─ Phase 3: 核心业务 ──────────────────────────────────────────────┐
│                                                                  │
│  [后端]                                                          │
│  □ 推送分组 CRUD API                                             │
│  □ 重构定时任务：从数据库读取分组配置（替代硬编码）                 │
│  □ 实现动态定时任务（用户可配置 cron 表达式）                      │
│  □ 推送日志记录：每次推送写入 push_logs 表                        │
│  □ 天气数据缓存 (Redis/MySQL)                                    │
│  □ 天气查询 API                                                  │
│  □ 推送统计 API（总量、成功率、日趋势）                           │
│  □ Bull 队列：推送任务异步处理 + 失败重试                         │
│  □ 订阅管理 API                                                  │
│                                                                  │
│  [前端]                                                          │
│  □ 推送分组列表页（表格 + 搜索 + 分页）                           │
│  □ 推送分组详情/编辑页（表单 + cron 表达式配置）                   │
│  □ 推送日志列表页（筛选 + 时间范围 + 状态）                       │
│  □ 天气查询页（城市搜索 + 实时/预报展示）                         │
│  □ 我的订阅管理页                                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 4：看板与管理（第 5 周）

```
┌─ Phase 4: 看板与管理 ────────────────────────────────────────────┐
│                                                                  │
│  [后端]                                                          │
│  □ Dashboard 聚合数据 API                                        │
│  □ 系统配置 CRUD API                                             │
│  □ 用户管理 API（列表、启用/禁用）                                │
│  □ 健康检查接口                                                  │
│                                                                  │
│  [前端]                                                          │
│  □ 数据看板页面                                                  │
│  │  □ 统计卡片（今日推送、成功率、活跃分组、订阅用户）            │
│  │  □ 推送趋势折线图 (ECharts)                                   │
│  │  □ 渠道分布饼图                                               │
│  │  □ 最近推送记录表                                             │
│  □ 用户管理页面（管理员）                                        │
│  □ 系统设置页面（管理员）                                        │
│  □ 个人中心页面（头像上传、密码修改）                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Phase 5：优化与部署（第 6 周）

```
┌─ Phase 5: 优化与部署 ────────────────────────────────────────────┐
│                                                                  │
│  □ 后端单元测试（核心 Service 覆盖率 > 80%）                     │
│  □ E2E 测试（关键流程：认证、推送）                               │
│  □ 前端组件测试 (Vitest + Testing Library)                       │
│  □ 接口限流 (Throttler)                                          │
│  □ 日志文件切割 + 持久化                                         │
│  □ Docker 容器化                                                 │
│  □ Docker Compose 编排 (NestJS + React + MySQL + Redis)          │
│  □ Nginx 配置（反代 + 静态资源 + gzip）                          │
│  □ CI/CD 流水线配置                                              │
│  □ 生产环境部署                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. 部署方案

### 10.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  # MySQL 数据库
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

  # Redis 缓存
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: always

  # NestJS 后端
  server:
    build:
      context: ./packages/server
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    depends_on:
      - mysql
      - redis
    environment:
      - DATABASE_URL=mysql://root:${DB_PASSWORD}@mysql:3306/${DB_NAME}
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    restart: always

  # React 前端 (生产: Nginx 托管静态文件)
  web:
    build:
      context: ./packages/web
      dockerfile: Dockerfile
    ports:
      - '80:80'
    depends_on:
      - server
    restart: always

volumes:
  mysql_data:
  redis_data:
```

### 10.2 Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://server:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Swagger 文档
    location /api-docs {
        proxy_pass http://server:3000/api-docs;
    }

    # 文件上传
    location /uploads/ {
        alias /app/uploads/;
        expires 30d;
    }

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json;
}
```

---

## 11. 扩展规划

### 未来可选功能

| 优先级 | 功能               | 说明                         |
| ------ | ------------------ | ---------------------------- |
| P1     | WebSocket 实时通知 | 推送成功/失败实时通知到前端  |
| P1     | 推送模板           | 自定义消息模板，支持变量替换 |
| P2     | 更多推送渠道       | 钉钉、飞书、Telegram Bot     |
| P2     | 多语言支持         | i18n 国际化                  |
| P2     | 暗黑模式           | Tailwind dark mode           |
| P3     | 开放 API           | 提供 OpenAPI 给第三方调用    |
| P3     | 插件系统           | 支持自定义数据源插件         |
| P3     | 移动端适配         | 响应式布局或 PWA             |

### 技术债务关注点

- 将硬编码的 `weather-groups.config.ts` 迁移为数据库管理
- 将 `AppService` 中的天气逻辑提取到独立 `WeatherService`
- TypeORM 迁移：从 `synchronize: true` 切换到正式迁移文件
- 环境变量统一管理，移除代码中的默认值（如 API Key）

---

## 附录：关键依赖安装命令

### 后端新增依赖

```bash
# 认证
pnpm add @nestjs/passport passport passport-local passport-jwt @nestjs/jwt bcrypt
pnpm add -D @types/passport-jwt @types/bcrypt

# 数据验证
pnpm add class-validator class-transformer

# Swagger
pnpm add @nestjs/swagger

# Redis + 缓存
pnpm add @nestjs/cache-manager cache-manager ioredis

# Bull 队列
pnpm add @nestjs/bull bull
pnpm add -D @types/bull

# 限流
pnpm add @nestjs/throttler
```

### 前端初始化

```bash
# 创建项目
pnpm create vite packages/web --template react-ts

# 安装依赖
cd packages/web
pnpm add react-router-dom zustand axios dayjs echarts echarts-for-react
pnpm add @tanstack/react-table react-hook-form @hookform/resolvers zod
pnpm add lucide-react react-hot-toast clsx

# Tailwind CSS
pnpm add -D tailwindcss @tailwindcss/postcss postcss autoprefixer
```
