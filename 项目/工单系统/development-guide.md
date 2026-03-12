# 开发指南

## 环境准备

### 开发环境要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本
- Git

### 项目初始化

```bash
# 克隆项目
git clone https://git.code.tencent.com/SJHT_TICKET/ticket_ui.git

# 进入项目目录
cd ticket_ui

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 (http://localhost:8081) |
| `npm run build:prod` | 生产环境构建 |
| `npm run build:stage` | 测试环境构建 |
| `npm run preview` | 预览生产构建 |

## 编码规范

### Vue 组件规范

#### 文件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
// 1. 导入
import { ref, computed, onMounted } from 'vue'
import useUserStore from '@/store/modules/user'
import { listData } from '@/api/system/user'

// 2. Props / Emits 定义
const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update', 'delete'])

// 3. 响应式数据
const loading = ref(false)
const list = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10
})

// 4. 计算属性
const isEmpty = computed(() => list.value.length === 0)

// 5. 方法
async function getList() {
  loading.value = true
  try {
    const res = await listData(queryParams)
    list.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleUpdate(row) {
  emit('update', row)
}

// 6. 生命周期
onMounted(() => {
  getList()
})
</script>

<style scoped>
/* 样式 */
</style>
```

#### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件名 | PascalCase | `UserList.vue`, `OrderDetail.vue` |
| 文件名 | 小写/kebab-case | `user-list.vue` (不推荐), `user.js` |
| Props | camelCase | `userId`, `isLoading` |
| Events | camelCase | `update:modelValue`, `onChange` |
| 方法名 | camelCase | `getList()`, `handleSubmit()` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_SIZE`, `DEFAULT_PAGE` |
| Store | camelCase | `useUserStore`, `useAppStore` |

### JavaScript 规范

#### 变量声明

```javascript
// ✅ 优先使用 const
const user = { name: '张三' }

// ✅ 需要重新赋值时使用 let
let count = 0
count++

// ❌ 不使用 var
var name = '李四'
```

#### 导入顺序

```javascript
// 1. Vue 核心
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

// 2. 第三方库
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 3. 组件
import UserForm from './components/UserForm.vue'

// 4. Store
import useUserStore from '@/store/modules/user'

// 5. API
import { listUser, getUser } from '@/api/system/user'

// 6. 工具函数
import { parseTime, resetForm } from '@/utils/sjht'
```

#### 异步处理

```javascript
// ✅ 使用 async/await
async function fetchData() {
  try {
    const res = await getUser(id)
    user.value = res.data
  } catch (error) {
    console.error('获取用户失败:', error)
  }
}

// ✅ Promise 链式调用（简单场景）
getUser(id)
  .then(res => {
    user.value = res.data
  })
  .catch(error => {
    console.error(error)
  })
```

## 新增功能流程

### 新增页面完整流程

```
1. 创建 API 文件
   └── src/api/{module}/{feature}.js

2. 创建 Vue 页面
   └── src/views/{module}/{feature}/index.vue
   └── src/views/{module}/{feature}/form.vue (如有)

3. 配置路由（后端菜单管理）
   无需修改前端代码，通过后端菜单管理配置

4. 配置权限（后端角色管理）
   在角色管理中分配菜单和按钮权限
```

### 示例：新增用户管理页面

#### 1. 创建 API

```javascript
// src/api/system/user.js
import request from '@/utils/request'

export function listUser(query) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  })
}

export function getUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'get'
  })
}

export function addUser(data) {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  })
}

export function updateUser(data) {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

export function delUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'delete'
  })
}
```

#### 2. 创建页面

```vue
<!-- src/views/system/user/index.vue -->
<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-form :model="queryParams" ref="queryRef">
      <el-form-item label="用户名" prop="userName">
        <el-input v-model="queryParams.userName" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作栏 -->
    <el-row :gutter="10">
      <el-col :span="1.5">
        <el-button type="primary" @click="handleAdd" v-hasPermi="['system:user:add']">新增</el-button>
      </el-col>
    </el-row>

    <!-- 表格 -->
    <el-table v-loading="loading" :data="userList">
      <el-table-column label="用户ID" prop="userId" />
      <el-table-column label="用户名" prop="userName" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button @click="handleUpdate(row)" v-hasPermi="['system:user:edit']">编辑</el-button>
          <el-button @click="handleDelete(row)" v-hasPermi="['system:user:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <pagination :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 弹窗 -->
    <el-dialog v-model="open" title="用户管理">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="form.userName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { listUser, getUser, addUser, updateUser, delUser } from '@/api/system/user'
import { resetForm } from '@/utils/sjht'

const { proxy } = getCurrentInstance()

// 数据
const loading = ref(false)
const open = ref(false)
const userList = ref([])
const total = ref(0)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  userName: undefined
})

const form = reactive({
  userId: undefined,
  userName: undefined
})

const rules = {
  userName: [{ required: true, message: '用户名不能为空', trigger: 'blur' }]
}

// 方法
async function getList() {
  loading.value = true
  const res = await listUser(queryParams)
  userList.value = res.rows
  total.value = res.total
  loading.value = false
}

function handleQuery() {
  queryParams.pageNum = 1
  getList()
}

function resetQuery() {
  resetForm.call(proxy, 'queryRef')
  handleQuery()
}

function handleAdd() {
  form.userId = undefined
  form.userName = undefined
  open.value = true
}

async function handleUpdate(row) {
  const res = await getUser(row.userId)
  Object.assign(form, res.data)
  open.value = true
}

async function handleDelete(row) {
  await proxy.$modal.confirm('确认删除该用户吗？')
  await delUser(row.userId)
  proxy.$modal.msgSuccess('删除成功')
  getList()
}

function cancel() {
  open.value = false
  resetForm.call(proxy, 'formRef')
}

async function submitForm() {
  await proxy.$refs.formRef.validate()
  if (form.userId) {
    await updateUser(form)
    proxy.$modal.msgSuccess('修改成功')
  } else {
    await addUser(form)
    proxy.$modal.msgSuccess('新增成功')
  }
  open.value = false
  getList()
}

onMounted(() => {
  getList()
})
</script>
```

## 权限控制

### 菜单权限

在后台管理菜单配置，控制侧边栏显示。

### 按钮权限

使用 `v-hasPermi` 指令控制按钮显示：

```vue
<el-button v-hasPermi="['system:user:add']">新增</el-button>
<el-button v-hasPermi="['system:user:edit']">编辑</el-button>
<el-button v-hasPermi="['system:user:remove']">删除</el-button>
```

### 路由权限

在路由配置中设置：

```javascript
{
  path: '/system/user',
  component: Layout,
  permissions: ['system:user:list'],  // 需要权限
  children: [...]
}
```

### 代码中权限检查

```javascript
const { proxy } = getCurrentInstance()

// 检查权限
if (proxy.$auth.hasPermi('system:user:add')) {
  // 有权限
}

// 检查角色
if (proxy.$auth.hasRole('admin')) {
  // 是管理员
}
```

## 数据字典使用

### 定义字典

在后台管理 -> 系统管理 -> 字典管理 中定义字典类型和数据。

### 在组件中使用

```vue
<script setup>
import { useDict } from '@/utils/dict'

// 获取字典数据
const { sys_user_status, sys_user_sex } = useDict(
  'sys_user_status',
  'sys_user_sex'
)
</script>

<template>
  <!-- 下拉选择 -->
  <el-select v-model="form.status">
    <el-option
      v-for="dict in sys_user_status"
      :key="dict.value"
      :label="dict.label"
      :value="dict.value"
    />
  </el-select>

  <!-- 字典标签 -->
  <dict-tag :options="sys_user_status" :value="row.status" />
</template>
```

## 常见问题

### 1. 页面无法访问（404）

- 检查后端菜单配置是否正确
- 检查角色是否有该菜单权限
- 检查路由路径是否正确

### 2. 按钮无法点击

- 检查用户是否有按钮权限（v-hasPermi）
- 检查角色权限配置

### 3. API 请求 401

- Token 已过期，需要重新登录
- 检查请求是否携带 Token

### 4. 字典数据不显示

- 检查字典类型是否正确
- 检查字典数据是否已启用

### 5. 页面白屏

- 检查浏览器控制台错误
- 检查组件导入路径是否正确
- 检查是否有语法错误

### 6. 热更新失效

- 重新启动开发服务器
- 检查文件保存是否触发重新编译

## 调试技巧

### Vue Devtools

安装 Vue Devtools 浏览器插件，可以查看：
- 组件树
- Pinia 状态
- 路由信息
- 事件监听

### 日志输出

```javascript
// 使用 console 进行调试
console.log('数据:', data)
console.table(list.value)
console.time('计时')
// ...
console.timeEnd('计时')
```

### 断点调试

在 Chrome DevTools 中：
1. Sources 面板找到源文件
2. 点击行号添加断点
3. 刷新页面触发断点
