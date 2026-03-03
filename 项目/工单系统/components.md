# 组件文档

## 全局组件

全局组件在 `main.js` 中注册，可在任意页面直接使用。

### DictTag 字典标签

显示字典数据的标签组件。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| options | Array | 字典数据数组 |
| value | String/Number | 字典值 |

**示例:**

```vue
<dict-tag :options="wk_order_type" :value="form.orderType" />
```

### Pagination 分页

分页组件，配合列表使用。

**Props:**

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| total | Number | 0 | 总条数 |
| page.sync | Number | 1 | 当前页 |
| limit.sync | Number | 10 | 每页条数 |

**示例:**

```vue
<pagination
  v-show="total > 0"
  :total="total"
  v-model:page="queryParams.pageNum"
  v-model:limit="queryParams.pageSize"
  @pagination="getList"
/>
```

### TreeSelect 树形选择

下拉树形选择组件。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| options | Array | 树形数据 |
| value | String/Number | 选中值 |
| placeholder | String | 占位符 |

### FileUpload 文件上传

文件上传组件，支持多文件。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| v-model | String | 文件URL，多个用逗号分隔 |
| limit | Number | 最大上传数量 |
| fileSize | Number | 单个文件大小限制(MB) |
| fileType | Array | 允许的文件类型 |

**示例:**

```vue
<file-upload v-model="form.fileUrls" :limit="5" :fileSize="10" />
```

### ImageUpload 图片上传

图片上传组件，支持预览。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| v-model | String | 图片URL |
| limit | Number | 最大上传数量 |
| fileSize | Number | 文件大小限制(MB) |

### ImagePreview 图片预览

图片预览组件。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| src | String | 图片URL |
| width | String | 宽度 |
| height | String | 高度 |

### RightToolbar 右侧工具栏

表格右侧工具栏，控制列显示和搜索。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| showSearch | Boolean | 显示搜索栏 |
| columns | Array | 列配置 |
| search | Boolean | 搜索按钮 |

**示例:**

```vue
<right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
```

### Editor 富文本编辑器

基于 Quill 的富文本编辑器。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| v-model | String | 内容 |
| height | Number | 高度(px) |
| minHeight | Number | 最小高度(px) |
| readOnly | Boolean | 只读 |

**示例:**

```vue
<editor v-model="form.content" :minHeight="300" />
```

## 布局组件

### Layout 布局容器

主布局组件，包含侧边栏、顶部导航、内容区。

```
Layout
├── Sidebar (侧边栏)
│   ├── Logo
│   └── SidebarItem (菜单项)
├── Navbar (顶部导航)
├── TagsView (标签页)
├── AppMain (内容区)
└── Settings (设置面板)
```

### AppMain 内容区

路由视图容器，处理 keep-alive。

## 业务组件

位于 `src/views/work/component/` 目录，工单模块的公共组件。

### handleform 处理表单

工单处理表单组件。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| orderId | String/Number | 工单ID |
| visible | Boolean | 显示状态 |

### handlerecord 处理记录

工单处理记录列表。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| orderId | String/Number | 工单ID |

### selecthandler 选择处理人

选择工单处理人组件。

**Props:**

| 属性 | 类型 | 说明 |
|------|------|------|
| v-model | String/Number | 选中用户ID |
| deptId | String/Number | 部门ID筛选 |

### uploadItem 上传项

文件上传项组件，用于表单中的单个文件上传。

### player 播放器

音频/视频播放组件。

### taxmsg 税务消息

税务相关消息展示组件。

## 首页组件

位于 `src/components/Home/` 目录。

### callCenter 呼叫中心

首页呼叫中心状态面板。

### Left1 / Left2 / Right1 / Right2

首页统计面板组件，展示各类工单统计数据。

## 组件开发规范

### 文件结构

```vue
<template>
  <!-- 模板 -->
</template>

<script setup>
// Composition API 写法
import { ref, computed } from 'vue'

// Props 定义
const props = defineProps({
  // ...
})

// Emits 定义
const emit = defineEmits(['update:modelValue', 'change'])

// 逻辑代码
</script>

<style scoped>
/* 样式 */
</style>
```

### 命名规范

- **组件文件名**: PascalCase（如 `FileUpload.vue`）
- **组件目录名**: 小写（如 `file-upload/`）
- **Props**: camelCase
- **Events**: kebab-case（如 `update:modelValue`）

### Props 定义规范

```javascript
const props = defineProps({
  // 基础类型
  title: {
    type: String,
    default: ''
  },
  // 对象类型
  config: {
    type: Object,
    default: () => ({})
  },
  // 数组类型
  list: {
    type: Array,
    default: () => []
  },
  // 必填项
  id: {
    type: String,
    required: true
  }
})
```
