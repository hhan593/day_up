# 工单系统前端项目调研报告

> 调研日期: 2026-02-11
> 项目名称: 世纪恒通客服工单系统 (ticket_ui)
> 基础框架: RuoYi-Vue3 (若依)

---

## 一、项目概况

### 1.1 技术栈

| 类别       | 技术              | 版本      | 最新版    | 状态     |
| ---------- | ----------------- | --------- | --------- | -------- |
| 框架       | Vue               | 3.2.41    | 3.5+      | 严重过期 |
| 构建工具   | Vite              | 2.9.14    | 6.x       | 严重过期 |
| UI 组件库  | Element Plus      | 2.1.8     | 2.9+      | 过期     |
| 路由       | Vue Router        | 4.0.14    | 4.5+      | 过期     |
| 状态管理   | Pinia             | 2.0.14    | 2.3+      | 过期     |
| HTTP 客户端| Axios             | 0.26.1    | 1.7+      | 严重过期 |
| 图表       | ECharts           | 5.3.2     | 5.5+      | 过期     |
| 语言       | JavaScript (纯JS) | -         | -         | 无 TS    |

### 1.2 项目规模

| 指标       | 数值     |
| ---------- | -------- |
| Vue 组件数 | 159 个   |
| JS 文件数  | 111 个   |
| 总代码行数 | ~44,337 行 |
| API 模块数 | 26+ 个 (仅 work 模块) |
| Store 模块 | 12 个    |

### 1.3 项目结构

```
src/
├── api/           # API 接口层 (按业务模块划分)
│   ├── work/      # 工单业务 API (26个文件)
│   ├── system/    # 系统管理 API
│   ├── monitor/   # 监控 API
│   └── ...
├── assets/        # 静态资源 & SCSS 样式
├── components/    # 全局公共组件 (23个)
├── directive/     # 自定义指令
├── layout/        # 布局组件
├── plugins/       # 插件
├── router/        # 路由配置
├── store/         # Pinia 状态管理
├── utils/         # 工具函数
└── views/         # 页面视图
    ├── work/      # 核心工单业务 (最大模块)
    ├── system/    # 系统管理
    ├── monitor/   # 监控模块
    ├── message/   # 消息模块
    ├── callcenter/# 呼叫中心
    └── bjpa/      # 北京PA业务
```

---

## 二、代码质量问题分析

### 2.1 [严重] 组件体积过大

以下组件严重超标（建议单组件不超过 300 行）：

| 文件 | 行数 | 超标倍数 |
| ---- | ---- | -------- |
| `src/views/work/taskorder/taskorderlist_etc.vue` | 985 | 3.3x |
| `src/views/work/taskorder/taskorderlist.vue` | 896 | 3.0x |
| `src/views/system/user/index.vue` | 843 | 2.8x |
| `src/views/work/order/index.vue` | 842 | 2.8x |
| `src/views/work/wiring/rightTable.vue` | 785 | 2.6x |
| `src/views/message/voicetask/index.vue` | 655 | 2.2x |
| `src/store/modules/softphone.js` | 644 | 2.1x |
| `src/views/work/receive/index.vue` | 633 | 2.1x |
| `src/views/message/smsgtask/index.vue` | 631 | 2.1x |
| `src/views/monitor/job/index.vue` | 610 | 2.0x |
| `src/views/work/order/form.vue` | 583 | 1.9x |
| `src/views/system/menu/index.vue` | 580 | 1.9x |
| `src/views/system/role/index.vue` | 579 | 1.9x |
| `src/utils/initData.js` | 569 | 1.9x |

**问题**: 组件承担过多职责，模板、逻辑、样式混杂在一起，难以维护和测试。

### 2.2 [严重] 代码大量重复

#### (1) 存在直接复制的文件
- `src/views/work/component/handleform copy.vue` — 文件名带 "copy"，是 `handleform.vue` 的直接复制，应删除或合并。

#### (2) 高度相似的列表组件
- `taskorderlist.vue` (896行) 与 `taskorderlist_etc.vue` (985行) 结构高度相似，仅查询条件和表格列有细微差异。
- `order/index.vue` (842行) 与 `wiring/rightTable.vue` (785行) 搜索栏模板几乎相同。
- `taskorder/receivelist.vue` (558行) 与 `taskorder/rvlist.vue` 存在重复。

#### (3) 重复的搜索栏模板
几乎所有列表页面都包含近似的搜索栏模板代码（el-select + el-date-picker + el-input 组合），没有抽象成可复用组件。

### 2.3 [严重] 全局方法滥用

`src/main.js` 中通过 `app.config.globalProperties` 挂载了 **14 个全局方法**：

```
useDict, download, parseTime, resetForm, handleTree,
addDateRange, selectDictLabel, selectDictLabels, selectAreaLabel,
selectDeptLabel, selectPostLabel, selectQuestionLabel,
checkRole, checkPermi, getConfigKey, filterSpecialChar
```

**问题**:
- 全局方法无法被 IDE 追踪和自动补全
- 无法进行 Tree-shaking，增加打包体积
- 隐式依赖，组件的真实依赖关系不清晰
- 不符合 Vue 3 Composition API 的设计理念

### 2.4 [严重] Vue 编码范式陈旧

| API 类型 | 使用文件数 | 占比 |
| -------- | ---------- | ---- |
| Options API (`export default`) | 156 | **98.7%** |
| Composition API (`<script setup>`) | 2 | 1.3% |

项目几乎完全使用 Options API，未利用 Vue 3 Composition API 的优势（更好的逻辑复用、TypeScript 支持、更小的打包体积）。

### 2.5 [中等] 无代码规范工具

| 工具 | 状态 |
| ---- | ---- |
| ESLint | 未配置 |
| Prettier | 未配置 |
| TypeScript | 未使用 |
| Husky (git hooks) | 未配置 |
| lint-staged | 未配置 |

**后果**: 代码风格不统一、无法自动发现潜在 bug、无法在提交时进行代码检查。

### 2.6 [中等] 安全风险

#### (1) v-html 使用 (XSS 风险)
以下 4 个文件使用了 `v-html`，可能存在 XSS 攻击风险：
- `src/views/work/wechatform/index.vue`
- `src/views/work/taskorder/rvform.vue`
- `src/views/work/component/handleform.vue`
- `src/views/work/order/detail.vue`

#### (2) 硬编码 IP 地址
`vite.config.js` 第 34 行硬编码了服务器 IP：
```js
target: "http://119.91.100.136:8007/"
```
应使用环境变量管理。

#### (3) request.js 中的松散比较
`src/utils/request.js` 第 119 行使用 `==` 而非 `===`：
```js
if (message == "Network Error")
```

### 2.7 [中等] CSS 问题

| 问题 | 统计 |
| ---- | ---- |
| 使用 scoped 样式的组件 | 30 个 (仅 19%) |
| 无 scoped 的样式 | 129 个 (81%) |
| 使用 `!important` 的文件 | 11 个 |
| 使用内联 style 的文件 | 20+ 个 (67处) |

**问题**: 绝大多数组件样式没有 scoped 限制，容易导致样式污染和冲突。

### 2.8 [低] 遗留调试代码

| 问题 | 数量 |
| ---- | ---- |
| `console.log` 语句 | 9 处 (7个文件) |
| `alert()` 调用 | 2 处 |
| `var` 关键字 (应为 let/const) | 47 处 (17个文件) |

### 2.9 [低] API 层命名不规范

`src/api/work/` 目录下有 26 个文件，命名方式不统一：
- 有的用业务名: `order.js`, `receive.js`
- 有的加前缀: `orderbuffet.js`, `ordertax.js`, `ordervetc.js`
- 有的用版本号: `orderV2.js`
- 缺乏统一的命名规范和文件组织策略

---

## 三、问题优先级汇总

```
  严重 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┃ P0  组件体积过大(14个文件超300行)      ┃
  ┃ P0  代码大量重复(列表页/搜索栏)        ┃
  ┃ P0  全局方法滥用(14个globalProperties) ┃
  ┃ P0  Vue API范式陈旧(99% Options API)   ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

  中等 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┃ P1  无代码规范工具(ESLint/Prettier)    ┃
  ┃ P1  XSS风险(4处v-html)                ┃
  ┃ P1  CSS样式污染(81%无scoped)           ┃
  ┃ P1  依赖版本严重过期                   ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

  低级 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ┃ P2  遗留调试代码(console.log/alert)    ┃
  ┃ P2  var关键字(47处)                    ┃
  ┃ P2  API命名不规范                      ┃
  ┃ P2  硬编码IP地址                       ┃
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## 四、解决方案

### 4.1 第一阶段：建立规范基础

**目标**: 建立代码规范，阻止新的质量问题产生。

#### (1) 引入 ESLint + Prettier

```bash
npm install -D eslint eslint-plugin-vue @vue/eslint-config-prettier prettier
```

配置 `.eslintrc.cjs`:
```js
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    '@vue/eslint-config-prettier'
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-console': 'warn',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'eqeqeq': ['error', 'always'],
    'vue/no-v-html': 'warn',
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
  }
}
```

#### (2) 引入 Git Hooks

```bash
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

配置 `lint-staged` (package.json):
```json
{
  "lint-staged": {
    "src/**/*.{vue,js}": ["eslint --fix", "prettier --write"]
  }
}
```

#### (3) 清理调试代码
- 删除 9 处 `console.log`
- 删除 2 处 `alert()`
- 将 47 处 `var` 替换为 `let`/`const`
- 删除 `handleform copy.vue` 文件

### 4.2 第二阶段：抽象复用组件

**目标**: 减少代码重复，提高可维护性。

#### (1) 抽取公共搜索栏组件

创建 `src/components/SearchBar/index.vue`，将重复的搜索栏模板统一封装：

```
┌─────────────────────────────────────────────────────────┐
│                    SearchBar 组件                        │
├─────────────────────────────────────────────────────────┤
│  Props:                                                  │
│  ├── fields: Array<SearchField>  // 搜索字段配置         │
│  ├── dateRanges: Array<DateRange> // 日期范围配置        │
│  └── keywords: Boolean           // 是否启用关键字搜索   │
│                                                          │
│  Events:                                                 │
│  ├── @search    // 搜索                                  │
│  ├── @reset     // 重置                                  │
│  └── @export    // 导出                                  │
│                                                          │
│  替代对象: order/index, taskorderlist, receivelist,       │
│           rightTable, orderpool 等 10+ 个列表页          │
└─────────────────────────────────────────────────────────┘
```

#### (2) 抽取公共列表页组件

创建 `src/components/CrudTable/index.vue`，封装增删改查列表页模板：

```
┌───────────────────────────────────────────────┐
│              CrudTable 组件                    │
├───────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐      │
│  │          SearchBar (搜索栏)          │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │       Toolbar (操作按钮栏)           │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │         el-table (数据表格)          │      │
│  │  通过 columns 配置自动渲染           │      │
│  └─────────────────────────────────────┘      │
│  ┌─────────────────────────────────────┐      │
│  │        Pagination (分页)             │      │
│  └─────────────────────────────────────┘      │
└───────────────────────────────────────────────┘
```

#### (3) 合并重复列表

- 将 `taskorderlist.vue` 和 `taskorderlist_etc.vue` 合并为一个组件，通过 props 区分行为
- 将 `receivelist.vue` 和 `rvlist.vue` 合并

### 4.3 第三阶段：渐进式现代化

**目标**: 逐步采用 Vue 3 现代编码方式。

#### (1) 新代码统一使用 Composition API

所有新增/重写组件使用 `<script setup>` 语法：

```vue
<!-- 旧方式 (Options API) -->
<script>
export default {
  data() { return { list: [] } },
  methods: { getList() { ... } },
  mounted() { this.getList() }
}
</script>

<!-- 新方式 (Composition API) -->
<script setup>
import { ref, onMounted } from 'vue'
const list = ref([])
function getList() { ... }
onMounted(() => getList())
</script>
```

#### (2) 用 Composables 替代全局方法

将 `main.js` 中的 14 个 `globalProperties` 迁移为 Composable 函数：

```
globalProperties.parseTime    → import { parseTime } from '@/utils/sjht'
globalProperties.useDict      → import { useDict } from '@/utils/dict'
globalProperties.download     → import { download } from '@/utils/request'
globalProperties.resetForm    → import { resetForm } from '@/utils/sjht'
globalProperties.checkPermi   → import { checkPermi } from '@/utils/permission'
...等
```

#### (3) 为所有组件添加 scoped 样式

逐步为 129 个缺少 scoped 的组件补充 `<style scoped>`。

### 4.4 第四阶段：安全加固与依赖升级

#### (1) 修复 XSS 风险
- 审查 4 处 `v-html` 用法，确认数据来源可信
- 对不可信数据使用 DOMPurify 进行消毒处理：
  ```bash
  npm install dompurify
  ```

#### (2) 外部化配置
- 将 `vite.config.js` 中的硬编码 IP 移至 `.env.development`：
  ```
  VITE_API_TARGET=http://119.91.100.136:8007/
  ```

#### (3) 依赖升级（需充分测试）
- 优先升级安全相关: Axios 0.26 → 1.x
- 逐步升级: Element Plus → 2.9+, Vue → 3.5+, Vite → 6.x

---

## 五、架构改进建议

### 5.1 当前架构

```
┌──────────────────────────────────────────────────────┐
│                    Views (视图层)                      │
│   每个页面包含: 模板 + 数据 + 逻辑 + 样式 (紧耦合)    │
├──────────────────────────────────────────────────────┤
│                    API Layer                          │
│   26+ 个独立 JS 文件, 命名不统一                      │
├──────────────────────────────────────────────────────┤
│                    Store (Pinia)                      │
│   12 个模块, 部分模块过大 (softphone 644行)           │
├──────────────────────────────────────────────────────┤
│                 Utils / Plugins                       │
│   全局方法挂载, 工具函数散落各处                       │
└──────────────────────────────────────────────────────┘
```

### 5.2 建议目标架构

```
┌──────────────────────────────────────────────────────┐
│              Views (薄视图层, 仅布局组合)              │
├──────────────────────────────────────────────────────┤
│            Feature Components (业务组件)               │
│   SearchBar / CrudTable / FormDialog / DetailPanel    │
├──────────────────────────────────────────────────────┤
│              Composables (可组合逻辑)                  │
│   useOrderList / useFormSubmit / useDict / useAuth    │
├──────────────────────────────────────────────────────┤
│              API Layer (按模块组织)                    │
│   api/work/order/ api/work/receive/ api/system/       │
├──────────────────────────────────────────────────────┤
│              Store (Pinia, 轻量化)                    │
│   仅存放跨组件共享状态                                │
├──────────────────────────────────────────────────────┤
│              Types / Constants / Utils                │
│   类型定义 / 枚举常量 / 纯工具函数                    │
└──────────────────────────────────────────────────────┘
```

---

## 六、实施路线图

```
阶段一: 建立规范 ──────────────────►
   • ESLint + Prettier
   • Git Hooks
   • 清理调试代码/废弃文件

阶段二: 抽象复用 ──────────────────►
   • SearchBar 公共组件
   • CrudTable 公共组件
   • 合并重复列表组件

阶段三: 渐进式现代化 ──────────────►
   • 新代码用 Composition API
   • Composables 替代全局方法
   • 添加 scoped 样式

阶段四: 安全与升级 ────────────────►
   • 修复 XSS 风险
   • 外部化配置
   • 依赖版本升级
```

**原则**: 每个阶段的改动都应向后兼容，不破坏现有功能。新功能用新范式，旧代码按需渐进迁移。
