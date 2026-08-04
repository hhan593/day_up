# 分销商工作台接口文档（C 端 · llm-service）

> 服务模块：`llm-service` · Controller：`com.sjht.llm.controller.portal.DistributorController`
> 适用角色：**业务员（SALES）/ 渠道商（AGENT）**
> 文档版本：v1.18+（价格去存储化，模型/分销价/视频分档价均在本库 proxy_llm 本地访问）

---

## 一、公共约定

### 1.1 基础路径（务必与网关配置核对）
- 本 Controller 在 llm-service 内映射为 `/distributor/**`。
- **外部可访问路径（推荐）**：`/llm/client/distributor/**`
  - 依据网关 `/llm/** → llm-service`，且 Controller 接收 `/{audience}/{path}`，与既有 `/llm/client/token/**` 同 audience。
  - 旧路径（已废弃）：`/cms/client/distributor/**`（controller 已从 cms 迁入 llm-service）。
  - ⚠️ `doc/url-mapping-full.md` 仍记录旧的 `/cms/client/distributor` 路由，**以 Nacos `gateway.yaml` 实际配置为准**。若网关未配 audience 段，则退化为 `/llm/distributor/**`。

### 1.2 鉴权
- 所有接口需要登录态（携带用户 token / Cookie）。
- 后端取当前登录用户，校验 `role ∈ {SALES, AGENT}`，否则返回 `403`。
- 非分销角色、未登录 → `403` / `401`（依网关策略）。

### 1.3 统一响应结构 `R<T>`
```jsonc
{
  "code": 200,            // 200=成功；非 200 为业务/系统错误
  "msg": "操作成功",       // 错误时返回可读错误信息
  "data": { ... },        // 业务数据（见各接口）
  "sign": null,           // 数据签名（前端可忽略）
  "encryptedFieldSet": null,   // 加密字段集合（前端可忽略）
  "desensitizationFieldSet": null // 脱敏字段集合（前端可忽略）
}
```

### 1.4 错误码
| code | 含义 | 触发场景 |
|---|---|---|
| 200 | 成功 | — |
| 400 | 参数校验失败 | discount/multiplier 不满足约束；视频档缺 videoPriceId |
| 403 | 无权限 | 当前用户非 SALES/AGENT |
| 404 | 资源不存在 | 用户不存在 / 模型不存在 |
| 500 | 系统错误 | 未预期异常 |

> 错误时 `msg` 字段含中文描述，可直接 toast 展示。

### 1.5 计费类型 `billingType`
| 值 | 含义 |
|---|---|
| `TOKEN_IO` | 按输入/输出 Token 计费（含缓存命中三维） |
| `PER_CALL` | 按次计费 |
| `PER_ITEM` | 按个计费（图像/视频生成按 n） |
| `VIDEO_TOKEN` | 视频分档 Token 计费（需走分档价配置） |
| `VIDEO_CREDIT` | 视频积分计费（展示积分单价即可） |

### 1.6 角色 `role`（当前用户）
`SALES`（销售） / `AGENT`（代理商） / `MANAGER` / `USER` 等。本工作台仅 `SALES`/`AGENT` 可访问。

---

## 二、价格计算模型（前端必读）

后端采用**价格去存储化**：只持久化 `discount`（折扣）与 `multiplier`（倍率），**销售价实时计算，不落库**。
前端展示加价后价格时，**自行按公式换算**，不要依赖后端返回“已加价价格”。

### 2.1 链路倍率 `chainRatio`
```
chainRatio = Π(上级链每一级 discount × multiplier)，护栏 ≥ 1（防倒挂）
```
- `SALES` 无分销上级链 → `chainRatio = 1`，上游底价 = 模型自身配置价。
- `AGENT` 链包含 `SALES` 加价，故 `chainRatio` 已含上级加价。

### 2.2 上游底价（接口返回）
```
上游底价 = 模型对应维度配置价 × chainRatio
```
接口按 `billingType` 返回：

| billingType | 返回的“上游底价”字段 |
|---|---|
| `TOKEN_IO` | `platformInputSale` / `platformOutputSale` / `platformCacheHitInputSale`（三维） |
| `PER_CALL` | `platformPerCallSale` |
| `PER_ITEM` | `platformPerItemSale` |
| `VIDEO_CREDIT` | `pointUnitPrice`（积分/元，仅供展示） |
| `VIDEO_TOKEN` | `tiers[].platformSale`（每档平台底价） |

### 2.3 我的销售价（前端计算）
```
我的销售价 = 上游底价 × 我的 discount × 我的 multiplier
```
- `discount` / `multiplier` 为 `null` 时按 `1` 处理（即不加价）。
- 金额保留 6 位小数（后端 `scale6`），前端展示可四舍五入。

---

## 三、接口明细

### 3.1 分销商概览 `GET /distributor/me`
当前登录分销商的基础信息与余额、下家数。

**响应 `data` 字段：**
| 字段 | 类型 | 说明 |
|---|---|---|
| userId | Long | 当前用户 ID |
| username | String | 用户名 |
| role | String | 角色：SALES / AGENT |
| inviteCode | String | 我的邀请码 |
| parentId | Long \| null | 上级 ID（无则 null） |
| parentType | String \| null | 上级类型 |
| balance | BigDecimal | 我的钱包余额（来自 billing-service） |
| downlineCount | Integer | 我的直属下家数 |

> ⚠️ **迁移说明**：`monthCommission`（本月提成）**已不再由本接口返回**。改为前端调用 ai-proxy 的 `/ai/distributor/commission/monthTotal` 获取。

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "userId": 1024,
    "username": "sales_zhang",
    "role": "SALES",
    "inviteCode": "INV-XYZ-1024",
    "parentId": 1001,
    "parentType": "MANAGER",
    "balance": 3280.50,
    "downlineCount": 12
  }
}
```

---

### 3.2 下家列表 `GET /distributor/downlines`
返回我的下家（直属下级）列表，**仅暴露必要字段，不含手机/邮箱/IP 等敏感信息**。

**Query 参数：**
| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| role | String | 否 | 按角色过滤：`USER` / `AGENT` |

**响应 `data`：** 数组，每项：
| 字段 | 类型 | 说明 |
|---|---|---|
| userId | Long | 下家用户 ID |
| username | String | 用户名 |
| role | String | 角色 |
| registerTime | String(ISO) | 注册时间（注意：若后端未配置日期序列化，可能为数组，前端建议兼容） |
| balance | BigDecimal | 该下家余额（来自 billing-service，批量查询） |

**响应示例：**
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    { "userId": 2001, "username": "user_a", "role": "USER", "registerTime": "2026-07-20T09:12:33", "balance": 120.00 },
    { "userId": 2002, "username": "agent_b", "role": "AGENT", "registerTime": "2026-07-21T14:03:10", "balance": 880.40 }
  ]
}
```

---

### 3.3 可定价模型列表 `GET /distributor/models`
返回当前登录分销商视角的全部公开模型，含**上游底价 + 我的倍率/折扣**，供前端渲染定价列表。

**响应 `data`：** 数组，每项通用字段：
| 字段 | 类型 | 说明 |
|---|---|---|
| modelId | Long | 模型 ID |
| modelCode | String | 模型编码 |
| modelName | String | 模型名称 |
| modelType | String | 模型类型（TEXT/IMAGE_GEN/VIDEO_GEN…） |
| billingType | String | 计费类型（见 1.5） |
| priceUnit | String | Token 计价单位：`1M` / `1K`（前端据此展示价格量级） |
| myDiscount | BigDecimal \| null | 我的折扣；未配置为 null |
| myMultiplier | BigDecimal \| null | 我的倍率；未配置为 null |
| configured | Boolean | 我是否已配置过该模型价格 |

**按 `billingType` 附加的“上游底价”字段（见 2.2）：**
- `TOKEN_IO`：`platformInputSale` / `platformOutputSale` / `platformCacheHitInputSale`
- `PER_CALL`：`platformPerCallSale`
- `PER_ITEM`：`platformPerItemSale`
- `VIDEO_CREDIT`：`pointUnitPrice`（积分/元）
- `VIDEO_TOKEN`：`tiers`（数组，结构见下）

**`VIDEO_TOKEN` 的 `tiers[]` 每项：**
| 字段 | 类型 | 说明 |
|---|---|---|
| videoPriceId | Long | 平台视频档主键（FK，配置时回填） |
| resolution | String | 分辨率：720p / 1080p / 4K |
| aspectRatio | String | 宽高比：16:9 / 9:16 / 1:1 |
| videoInputType | String | 视频输入类型：NONE / WITH_VIDEO |
| platformSale | BigDecimal | 该档平台底价 |
| myDiscount | BigDecimal \| null | 我的折扣 |
| myMultiplier | BigDecimal \| null | 我的倍率 |
| configured | Boolean | 我是否已配置该档 |

> 后端**不返回加价后价格**，前端按 `底价 × discount × multiplier` 自行计算展示。

---

### 3.4 统一加价视图 `GET /distributor/models/{modelId}/pricing`
按模型 `billingType` 聚合返回**分档或单一价加价配置**，前端一个接口拿全视图，据 `pricingMode` 渲染对应表单。

**Path 参数：**
| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| modelId | Long | 是 | 模型 ID；不存在返回 404 |

**响应 `data` 通用字段：**
| 字段 | 类型 | 说明 |
|---|---|---|
| modelId / modelCode / modelName / modelType | — | 模型基础信息 |
| billingType | String | 计费类型 |
| priceUnit | String | 计价单位 |
| pricingMode | String | `FLAT`（单一价）或 `VIDEO_TIER`（分档） |
| hasDistributionConfig | Boolean | 是否已有分销配置 |

**当 `pricingMode = VIDEO_TIER`：** `data.tiers[]`，每项：
| 字段 | 类型 | 说明 |
|---|---|---|
| videoPriceId | Long | 平台视频档主键 |
| resolution | String | 分辨率 |
| aspectRatio | String | 宽高比 |
| videoInputType | String | 视频输入类型 |
| platformSale | BigDecimal | 平台档底价 |
| platformList | BigDecimal | 平台档刊例价 |
| platformStatus | Integer | 平台档状态 |
| myDiscount | BigDecimal \| null | 我的折扣 |
| myMultiplier | BigDecimal \| null | 我的倍率 |
| myStatus | Integer \| null | 1=已启用（有配置即有启用）；未配置 null |
| configured | Boolean | 我是否已配置该档 |

**当 `pricingMode = FLAT`：** `data.flat`（对象），含：
| 字段 | 类型 | 说明 |
|---|---|---|
| myDiscount | BigDecimal \| null | 我的折扣 |
| myMultiplier | BigDecimal \| null | 我的倍率 |
| configured | Boolean | 是否已有配置 |
| platformInputSale / platformOutputSale / platformCacheHitInputSale | BigDecimal | `TOKEN_IO` 三维上游底价 |
| platformPerCallSale | BigDecimal | `PER_CALL` 上游底价 |
| platformPerItemSale | BigDecimal | `PER_ITEM` 上游底价 |
| pointUnitPrice | BigDecimal | `VIDEO_CREDIT` 积分/元（展示用） |

> 提交配置时仍走各自接口：`FLAT → POST /models/setPrice`；`VIDEO_TIER → POST /models/{modelId}/video-tiers`。

---

### 3.5 设置单一价加价 `POST /distributor/models/setPrice`
为**非视频分档模型**设置/更新自定义加价（仅持久化 discount + multiplier）。

**请求体 `SetDistributorPriceReq`：**
| 字段 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| modelId | Long | 是 | — | 模型 ID |
| discount | BigDecimal | 是 | `0 < discount ≤ 1` | 折扣 |
| multiplier | BigDecimal | 是 | `> 0` | 倍率 |

**校验与行为：**
- 参数不满足约束 → `400`，`msg` 说明（如“折扣必须 > 0”）。
- `VIDEO_TOKEN` 模型**不可**经此接口配置，返回错误并提示改用分档接口。
- 仅保存 `discount` / `multiplier`；销售价实时算 = `上游底价(=模型 salePrice × chainRatio) × discount × multiplier`，并校验 `≥ 上游底价`（防倒挂）。
- 成功后清空该模型价格缓存，下游即时生效。

**响应 `data`：**
| 字段 | 类型 | 说明 |
|---|---|---|
| modelId | Long | 模型 ID |
| salePrice | BigDecimal | 计算出的加价后销售价 |

**请求示例：**
```json
{ "modelId": 88, "discount": 0.9, "multiplier": 1.2 }
```

**响应示例：**
```json
{ "code": 200, "msg": "操作成功", "data": { "modelId": 88, "salePrice": 1.296 } }
```

---

### 3.6 设置视频分档加价 `POST /distributor/models/{modelId}/video-tiers`
为 `VIDEO_TOKEN` 模型**全量替换**视频分档加价（空数组 = 清空，回退按平台档价计费、不分销）。

**Path 参数：**
| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| modelId | Long | 是 | 模型 ID |

**请求体：** `AiDistributorVideoPriceDTO` 数组（**全量替换**）。每项：
| 字段 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| videoPriceId | Long | 是 | — | 平台视频档主键（FK，来自 `/pricing` 的 `tiers[].videoPriceId`） |
| discount | BigDecimal | 是 | `≤ 1` | 折扣 |
| multiplier | BigDecimal | 是 | `> 0` | 倍率 |

> 其他字段（`id` / `distributorId` / `distributorRole` / `modelId` / `createTime` / `updateTime`）为服务端只读，**传入无效**。

**校验与行为：**
- 仅 `VIDEO_TOKEN` 模型可配置；否则返回 404/业务错误（含当前 billingType 说明）。
- 每档销售价实时算 = 平台同档 `salePrice × discount × multiplier`，并校验 `≥ 平台档底价`。
- 成功后清空价格缓存。

**响应 `data`：**
| 字段 | 类型 | 说明 |
|---|---|---|
| modelId | Long | 模型 ID |
| tierCount | Integer | 提交的档位数（空=0，即清空） |

**请求示例：**
```json
[
  { "videoPriceId": 501, "discount": 0.95, "multiplier": 1.1 },
  { "videoPriceId": 502, "discount": 0.9,  "multiplier": 1.2 }
]
```

**响应示例：**
```json
{ "code": 200, "msg": "操作成功", "data": { "modelId": 77, "tierCount": 2 } }
```

---

## 四、前端对接建议（Axios 示例）

```js
const LLM_CLIENT_BASE = '/llm/client'; // 见 doc/url-mapping-full.md 约定

// 3.1 概览
const { data: me } = await axios.get(`${LLM_CLIENT_BASE}/distributor/me`);

// 3.2 下家列表（按角色过滤）
const { data: downlines } = await axios.get(`${LLM_CLIENT_BASE}/distributor/downlines`, {
  params: { role: 'USER' }
});

// 3.3 可定价模型列表
const { data: models } = await axios.get(`${LLM_CLIENT_BASE}/distributor/models`);

// 3.4 单一模型加价视图
const { data: pricing } = await axios.get(`${LLM_CLIENT_BASE}/distributor/models/${modelId}/pricing`);

// 3.5 设置单一价加价（FLAT）
await axios.post(`${LLM_CLIENT_BASE}/distributor/models/setPrice`, {
  modelId, discount: 0.9, multiplier: 1.2
});

// 3.6 设置视频分档加价（VIDEO_TIER）
await axios.post(`${LLM_CLIENT_BASE}/distributor/models/${modelId}/video-tiers`, [
  { videoPriceId: 501, discount: 0.95, multiplier: 1.1 }
]);

// 前端计算我的销售价（通用）
function mySalePrice(upstreamBase, discount, multiplier) {
  const d = discount ?? 1;
  const m = multiplier ?? 1;
  return Number(upstreamBase) * d * m; // 金额按需保留小数
}
```

---

## 五、迁移与注意事项（重要）
1. **服务迁移**：本组接口已从 `cms` 迁入 `llm-service`，外部路径由 `/cms/client/distributor/**` 变更为 `/llm/client/distributor/**`。
2. **提成接口已移出**：分销提成明细（原 `/commission/list`）与 `/me` 的 `monthCommission` 已迁移至 **ai-proxy** 的 `DistributorCommissionController`（`/ai/distributor/commission/**`），本月提成改用 ai-proxy `/commission/monthTotal`。
3. **价格去存储化**：后端只存 `discount`+`multiplier`，加价后价前端实时计算；不要缓存后端“已加价价”。
4. **文档与网关一致性**：`doc/url-mapping-full.md` 中 `/cms/client/distributor` 条目已过时，请以 Nacos `gateway.yaml` 为准核对 audience 段（`client`）。
5. **视频模型**：`VIDEO_TOKEN` 模型只能用 `video-tiers` 分档接口配置，误用 `setPrice` 会被拒绝。
