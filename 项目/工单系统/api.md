# API 文档

## API 模块组织

API 接口按业务模块组织，位于 `src/api/` 目录。

```
src/api/
├── login.js               # 登录相关
├── menu.js                # 菜单路由
├── bjpa/                  # 北京机场
│   ├── bookingcheckin.js
│   ├── bookingorder.js
│   ├── callrecord.js
│   └── nzcode.js
├── callcenter/            # 呼叫中心
│   ├── callrecord.js
│   └── sip.js
├── home/                  # 首页
│   └── home.js
├── message/               # 消息服务
│   ├── application.js
│   ├── smsgsendlog.js
│   ├── smsgtask.js
│   ├── smsgtemplate.js
│   ├── voicecallresult.js
│   ├── voicecallresultsendlog.js
│   ├── voicetask.js
│   └── voicetemplate.js
├── monitor/               # 系统监控
│   ├── cache.js
│   ├── job.js
│   ├── jobLog.js
│   ├── logininfor.js
│   ├── online.js
│   ├── operlog.js
│   └── server.js
├── system/                # 系统管理
│   ├── apiLog.js
│   ├── area.js
│   ├── config.js
│   ├── dept.js
│   ├── exportrecord.js
│   ├── fileinfo.js
│   ├── menu.js
│   ├── notice.js
│   ├── post.js
│   ├── role.js
│   ├── user.js
│   ├── wxuser.js
│   └── dict/              # 字典管理
│       ├── data.js
│       └── type.js
├── tool/                  # 开发工具
│   └── gen.js
├── wechat/                # 微信相关
│   ├── wxdept.js
│   └── wxuser.js
└── work/                  # 工单核心
    ├── apirecord.js
    ├── app.js
    ├── customerInfo.js
    ├── evaluaterecord.js
    ├── order.js
    ├── order12580.js
    ├── orderbuffet.js
    ├── ordercaller.js
    ├── ordercarwash.js
    ├── ordercomplete.js
    ├── orderhandlerecord.js
    ├── orderpool.js
    ├── orderpostscript.js
    ├── orderprogress.js
    ├── orderquestion.js
    ├── ordertax.js
    ├── orderttq.js
    ├── orderV2.js
    ├── ordervaletdriving.js
    ├── ordervetc.js
    ├── orderviphall.js
    ├── receive.js
    ├── receiveetc.js
    ├── receivehandlerecord.js
    ├── rtvisitrecord.js
    └── thirdetc.js
```

## 请求封装

请求封装位于 `src/utils/request.js`，基于 Axios。

### 基础配置

```javascript
const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 1000 * 60 * 2  // 2分钟
})
```

### 请求拦截器

1. **Token 注入**: 自动从 localStorage 获取 token 并添加到请求头
2. **GET 参数处理**: 将 params 转换为 URL 查询字符串
3. **重复提交防护**: 防止短时间内重复提交相同请求

```javascript
service.interceptors.request.use(config => {
  // Token 注入
  if (getToken() && !isToken) {
    config.headers['Authorization'] = 'Bearer ' + getToken()
  }

  // GET 参数处理
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params)
    // ...
  }

  // 重复提交防护
  if (!isRepeatSubmit && (config.method === 'post' || config.method === 'put')) {
    // 检查 sessionStorage 中的请求记录
  }

  return config
})
```

### 响应拦截器

1. **状态码处理**: 统一处理 200、401、500 等状态码
2. **错误提示**: 自动显示错误消息
3. **Token 过期**: 401 状态码触发重新登录

```javascript
service.interceptors.response.use(res => {
  const code = res.data.code || 200
  const msg = errorCode[code] || res.data.msg || errorCode['default']

  if (code === 401) {
    // Token 过期，提示重新登录
    ElMessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录')
  } else if (code === 500) {
    ElMessage({ message: msg, type: 'error' })
    return Promise.reject(new Error(msg))
  } else if (code !== 200) {
    ElNotification.error({ title: msg })
    return Promise.reject('error')
  } else {
    return Promise.resolve(res.data)
  }
})
```

### 错误码处理

错误码定义位于 `src/utils/errorCode.js`:

```javascript
export default {
  '401': '认证失败，无法访问系统资源',
  '403': '没有权限，禁止访问',
  '404': '访问资源不存在',
  'default': '系统未知错误，请反馈给管理员'
}
```

## API 模块示例

### 标准 API 模块结构

```javascript
import request from '@/utils/request'

// 查询列表
export function listUser(query) {
  return request({
    url: '/system/user/list',
    method: 'get',
    params: query
  })
}

// 查询详情
export function getUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'get'
  })
}

// 新增
export function addUser(data) {
  return request({
    url: '/system/user',
    method: 'post',
    data: data
  })
}

// 修改
export function updateUser(data) {
  return request({
    url: '/system/user',
    method: 'put',
    data: data
  })
}

// 删除
export function delUser(userId) {
  return request({
    url: '/system/user/' + userId,
    method: 'delete'
  })
}

// 导出
export function exportUser(query) {
  return request({
    url: '/system/user/export',
    method: 'get',
    params: query,
    responseType: 'blob'  // 二进制数据
  })
}
```

### 在组件中使用

```vue
<script setup>
import { listUser, getUser, addUser, updateUser, delUser } from '@/api/system/user'

// 查询列表
async function getList() {
  const res = await listUser(queryParams)
  userList.value = res.rows
  total.value = res.total
}

// 新增
async function handleAdd() {
  await addUser(form.value)
  proxy.$modal.msgSuccess('新增成功')
  getList()
}

// 修改
async function handleUpdate() {
  await updateUser(form.value)
  proxy.$modal.msgSuccess('修改成功')
  getList()
}

// 删除
async function handleDelete(row) {
  await delUser(row.userId)
  proxy.$modal.msgSuccess('删除成功')
  getList()
}
</script>
```

## 文件下载

### 通用下载方法

```javascript
import { download } from '@/utils/request'

// 下载文件
download('/api/export', { id: 1 }, '导出数据.xlsx')
```

### API 模块中的导出

```javascript
import request from '@/utils/request'
import { download } from '@/utils/request'

// 方式1：使用 download 方法
export function exportData(query) {
  return download('/api/export', query, 'data.xlsx')
}

// 方式2：手动处理
export function exportData(query) {
  return request({
    url: '/api/export',
    method: 'get',
    params: query,
    responseType: 'blob'
  }).then(data => {
    const blob = new Blob([data])
    saveAs(blob, 'data.xlsx')
  })
}
```

## 特殊请求配置

### 不携带 Token

```javascript
request({
  url: '/public/api',
  method: 'get',
  headers: {
    isToken: false  // 不携带 Token
  }
})
```

### 允许重复提交

```javascript
request({
  url: '/api/submit',
  method: 'post',
  data: data,
  headers: {
    repeatSubmit: false  // 允许重复提交
  }
})
```

### 二进制响应

```javascript
request({
  url: '/api/download',
  method: 'get',
  responseType: 'blob'  // 或 'arraybuffer'
})
```

### 表单提交

```javascript
request({
  url: '/api/upload',
  method: 'post',
  data: formData,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})
```

## 环境配置

API 基础地址通过环境变量配置：

```
# .env.development
VITE_APP_BASE_API = '/dev-api'

# .env.production
VITE_APP_BASE_API = '/prod-api'
```

Vite 代理配置 (`vite.config.js`):

```javascript
server: {
  proxy: {
    '/dev-api': {
      target: 'http://119.91.100.136:8007/',
      changeOrigin: true,
      rewrite: (p) => p.replace(/^\/dev-api/, '')
    }
  }
}
```
