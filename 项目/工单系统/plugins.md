# 插件和工具函数文档

## 全局插件

全局插件在 `src/plugins/` 目录，通过 `app.config.globalProperties` 挂载到全局。

### $auth - 权限验证

用于 JavaScript 代码中的权限验证。

**方法:**

| 方法 | 说明 | 参数 | 返回值 |
|------|------|------|--------|
| hasPermi | 验证单个权限 | permission: string | boolean |
| hasPermiOr | 验证多个权限（满足其一） | permissions: string[] | boolean |
| hasPermiAnd | 验证多个权限（全部满足） | permissions: string[] | boolean |
| hasRole | 验证单个角色 | role: string | boolean |
| hasRoleOr | 验证多个角色（满足其一） | roles: string[] | boolean |
| hasRoleAnd | 验证多个角色（全部满足） | roles: string[] | boolean |

**使用示例:**

```javascript
// 在组件中
const { proxy } = getCurrentInstance()

// 验证单个权限
if (proxy.$auth.hasPermi('system:user:add')) {
  // 有权限
}

// 验证多个权限（满足其一）
if (proxy.$auth.hasPermiOr(['system:user:add', 'system:user:edit'])) {
  // 有任一权限
}

// 验证角色
if (proxy.$auth.hasRole('admin')) {
  // 是管理员
}
```

### $cache - 缓存操作

封装 localStorage 和 sessionStorage 操作。

**结构:**

```javascript
$cache: {
  session: {  // sessionStorage
    set(key, value)
    get(key)
    setJSON(key, jsonValue)
    getJSON(key)
    remove(key)
  },
  local: {    // localStorage
    set(key, value)
    get(key)
    setJSON(key, jsonValue)
    getJSON(key)
    remove(key)
  }
}
```

**使用示例:**

```javascript
const { proxy } = getCurrentInstance()

// sessionStorage
proxy.$cache.session.set('key', 'value')
proxy.$cache.session.setJSON('user', { name: '张三' })
const user = proxy.$cache.session.getJSON('user')

// localStorage
proxy.$cache.local.set('theme', 'dark')
const theme = proxy.$cache.local.get('theme')
```

### $modal - 消息提示

封装 Element Plus 的消息框和通知。

**方法:**

| 方法 | 说明 | 参数 |
|------|------|------|
| msgSuccess | 成功消息 | message: string |
| msgError | 错误消息 | message: string |
| msgInfo | 信息消息 | message: string |
| msgWarning | 警告消息 | message: string |
| alert | 警告框 | message, title, callback |
| confirm | 确认框 | message, title, callback |
| prompt | 输入框 | message, title, callback |
| notify | 通知 | options |

**使用示例:**

```javascript
const { proxy } = getCurrentInstance()

// 消息提示
proxy.$modal.msgSuccess('操作成功')
proxy.$modal.msgError('操作失败')

// 确认框
proxy.$modal.confirm('确认删除该数据吗？').then(() => {
  // 确认
}).catch(() => {
  // 取消
})
```

### $tab - 页签操作

操作 TagsView 页签。

**方法:**

| 方法 | 说明 | 参数 |
|------|------|------|
| openPage | 打开页面 | title, url |
| updatePage | 更新页签 | obj |
| closePage | 关闭页签 | obj |
| closeAllPage | 关闭所有页签 | - |
| closeLeftPage | 关闭左侧页签 | obj |
| closeRightPage | 关闭右侧页签 | obj |
| closeOtherPage | 关闭其他页签 | obj |
| refreshPage | 刷新页签 | obj |

**使用示例:**

```javascript
const { proxy } = getCurrentInstance()

// 刷新当前页签
proxy.$tab.refreshPage()

// 关闭当前页签
proxy.$tab.closePage()
```

### $download - 文件下载

用于文件下载操作。

**使用示例:**

```javascript
const { proxy } = getCurrentInstance()

// 下载文件
proxy.$download('/api/download/file', { id: 1 }, 'filename.pdf')
```

## 工具函数

工具函数位于 `src/utils/` 目录。

### 常用工具函数 (sjht.js)

| 函数 | 说明 | 示例 |
|------|------|------|
| parseTime | 日期格式化 | parseTime(new Date(), '{y}-{m}-{d}') => '2024-01-15' |
| resetForm | 重置表单 | resetForm.call(this, 'formRef') |
| addDateRange | 添加日期范围 | addDateRange(params, dateRange) |
| handleTree | 处理树形数据 | handleTree(data, 'id', 'parentId') |
| selectDictLabel | 字典标签回显 | selectDictLabel(dict, value) |
| selectDictLabels | 多选字典回显 | selectDictLabels(dict, values) |
| tansParams | 转换参数为 URL | tansParams({ a: 1 }) => 'a=1&' |

### 日期格式化 (parseTime)

```javascript
import { parseTime } from '@/utils/sjht'

// 基本用法
parseTime(new Date())
// => '2024-01-15 10:30:00'

// 自定义格式
parseTime(new Date(), '{y}-{m}-{d}')
// => '2024-01-15'

parseTime(new Date(), '{y}年{m}月{d}日 星期{a}')
// => '2024年01月15日 星期一'

// 时间戳
parseTime(1705312200000)
// => '2024-01-15 18:30:00'
```

**格式占位符:**

| 占位符 | 说明 | 示例 |
|--------|------|------|
| {y} | 年 | 2024 |
| {m} | 月 | 01-12 |
| {d} | 日 | 01-31 |
| {h} | 时 | 00-23 |
| {i} | 分 | 00-59 |
| {s} | 秒 | 00-59 |
| {a} | 星期 | 日-六 |

### 树形数据处理 (handleTree)

```javascript
import { handleTree } from '@/utils/sjht'

const data = [
  { id: 1, parentId: 0, name: '父节点' },
  { id: 2, parentId: 1, name: '子节点1' },
  { id: 3, parentId: 1, name: '子节点2' }
]

// 转换为树形结构
const tree = handleTree(data, 'id', 'parentId')
// => [
//   {
//     id: 1,
//     parentId: 0,
//     name: '父节点',
//     children: [
//       { id: 2, parentId: 1, name: '子节点1' },
//       { id: 3, parentId: 1, name: '子节点2' }
//     ]
//   }
// ]
```

### 字典标签回显

```javascript
import { selectDictLabel, selectDictLabels } from '@/utils/sjht'

const dict = [
  { value: '0', label: '正常' },
  { value: '1', label: '停用' }
]

// 单选
selectDictLabel(dict, '0')
// => '正常'

// 多选
selectDictLabels(dict, '0,1', ',')
// => '正常,停用'
```

### 权限检查 (permission.js)

```javascript
import { checkPermi, checkRole } from '@/utils/permission'

// 检查权限
const hasPermission = checkPermi(['system:user:add'])

// 检查角色
const hasRole = checkRole(['admin'])
```

### 认证相关 (auth.js)

```javascript
import { getToken, setToken, removeToken } from '@/utils/auth'

// 获取 Token
const token = getToken()

// 设置 Token
setToken('xxx')

// 移除 Token
removeToken()
```

### 动态标题 (dynamicTitle.js)

```javascript
import { setPageTitle } from '@/utils/dynamicTitle'

// 设置页面标题
setPageTitle('用户管理')
```

## 全局方法挂载

在 `main.js` 中挂载到全局：

```javascript
// 全局方法
app.config.globalProperties.parseTime = parseTime
app.config.globalProperties.resetForm = resetForm
app.config.globalProperties.handleTree = handleTree
app.config.globalProperties.addDateRange = addDateRange
app.config.globalProperties.selectDictLabel = selectDictLabel
app.config.globalProperties.selectDictLabels = selectDictLabels
app.config.globalProperties.checkPermi = checkPermi
app.config.globalProperties.checkRole = checkRole

// 全局组件
app.component('DictTag', DictTag)
app.component('Pagination', Pagination)
app.component('TreeSelect', TreeSelect)
app.component('FileUpload', FileUpload)
app.component('ImageUpload', ImageUpload)
app.component('ImagePreview', ImagePreview)
app.component('RightToolbar', RightToolbar)
app.component('Editor', Editor)
```

在组件中使用全局方法：

```vue
<script setup>
const { proxy } = getCurrentInstance()

function handleClick() {
  const time = proxy.parseTime(new Date())
  console.log(time)
}
</script>
```
