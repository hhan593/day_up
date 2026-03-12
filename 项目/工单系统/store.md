# 状态管理文档

项目使用 [Pinia](https://pinia.vuejs.org/) 进行状态管理，位于 `src/store/` 目录。

## Store 模块列表

| 模块 | 文件 | 说明 |
|------|------|------|
| user | `modules/user.js` | 用户认证信息 |
| app | `modules/app.js` | 应用状态（侧边栏、设备） |
| permission | `modules/permission.js` | 路由权限 |
| settings | `modules/settings.js` | 系统设置 |
| dict | `modules/dict.js` | 数据字典 |
| tagsView | `modules/tagsView.js` | 标签页管理 |
| area | `modules/area.js` | 地区数据 |
| dept | `modules/dept.js` | 部门数据 |
| post | `modules/post.js` | 岗位数据 |
| orderquestion | `modules/orderquestion.js` | 工单问题类型 |

## 核心模块详解

### user - 用户模块

**State:**

```javascript
{
  token: '',        // 登录凭证
  name: '',         // 用户名
  avatar: '',       // 头像URL
  roles: [],        // 角色列表
  permissions: []   // 权限列表
}
```

**Actions:**

| 方法 | 说明 | 参数 |
|------|------|------|
| login | 用户登录 | { username, password, code, uuid } |
| getInfo | 获取用户信息 | - |
| logOut | 退出登录 | - |

**使用示例:**

```javascript
import useUserStore from '@/store/modules/user'

const userStore = useUserStore()

// 登录
await userStore.login({ username, password, code, uuid })

// 获取用户信息
await userStore.getInfo()

// 退出
await userStore.logOut()

// 读取状态
console.log(userStore.token)
console.log(userStore.roles)
console.log(userStore.permissions)
```

### app - 应用状态模块

**State:**

```javascript
{
  sidebar: {
    opened: true,           // 侧边栏展开状态
    withoutAnimation: false, // 是否禁用动画
    hide: false             // 是否隐藏侧边栏
  },
  device: 'desktop',        // 设备类型: desktop/mobile
  size: 'default'           // 组件尺寸: large/default/small
}
```

**Actions:**

| 方法 | 说明 | 参数 |
|------|------|------|
| toggleSideBar | 切换侧边栏 | withoutAnimation |
| closeSideBar | 关闭侧边栏 | withoutAnimation |
| toggleDevice | 切换设备类型 | device |
| setSize | 设置组件尺寸 | size |
| toggleSideBarHide | 切换侧边栏隐藏 | status |

**使用示例:**

```javascript
import useAppStore from '@/store/modules/app'

const appStore = useAppStore()

// 切换侧边栏
appStore.toggleSideBar()

// 读取侧边栏状态
const sidebar = computed(() => appStore.sidebar)
```

### permission - 权限路由模块

**State:**

```javascript
{
  routes: [],           // 所有路由
  addRoutes: [],        // 动态添加的路由
  defaultRoutes: [],    // 默认路由
  topbarRouters: [],    // 顶部导航路由
  sidebarRouters: []    // 侧边栏路由
}
```

**Actions:**

| 方法 | 说明 | 参数 |
|------|------|------|
| setRoutes | 设置路由 | routes |
| generateRoutes | 生成动态路由 | - |

**使用示例:**

```javascript
import usePermissionStore from '@/store/modules/permission'

const permissionStore = usePermissionStore()

// 生成动态路由（在权限守卫中调用）
await permissionStore.generateRoutes()
```

### settings - 系统设置模块

**State:**

```javascript
{
  title: '',            // 页面标题
  sideTheme: '',        // 侧边栏主题
  showSettings: false,  // 显示设置面板
  topNav: false,        // 顶部导航
  tagsView: true,       // 显示标签页
  fixedHeader: false,   // 固定头部
  sidebarLogo: true,    // 显示Logo
  dynamicTitle: false   // 动态标题
}
```

**Actions:**

| 方法 | 说明 | 参数 |
|------|------|------|
| changeSetting | 修改设置 | { key, value } |
| setTitle | 设置页面标题 | title |

### dict - 数据字典模块

**State:**

```javascript
{
  dict: {}  // 字典数据缓存 { dictType: [dictData] }
}
```

**Actions:**

| 方法 | 说明 | 参数 |
|------|------|------|
| getDict | 获取字典数据 | dictType |
| setDict | 设置字典数据 | { dictType, data } |

**使用示例:**

```javascript
import { useDict } from '@/utils/dict'

// 在 setup 中使用
const { wk_order_type, wk_order_status } = useDict(
  'wk_order_type',
  'wk_order_status'
)

// 在模板中使用
<dict-tag :options="wk_order_type" :value="form.type" />
```

### tagsView - 标签页模块

**State:**

```javascript
{
  visitedViews: [],    // 已访问的视图
  cachedViews: []      // 缓存的视图
}
```

**Actions:**

| 方法 | 说明 | 参数 |
|------|------|------|
| addView | 添加视图 | view |
| delView | 删除视图 | view |
| delOthersViews | 删除其他视图 | view |
| delAllViews | 删除所有视图 | - |

## Store 使用最佳实践

### 1. 在组合式函数中使用

```javascript
import { storeToRefs } from 'pinia'
import useUserStore from '@/store/modules/user'

export function useAuth() {
  const userStore = useUserStore()

  // 使用 storeToRefs 保持响应式
  const { token, roles } = storeToRefs(userStore)

  const isAuthenticated = computed(() => !!token.value)

  return {
    token,
    roles,
    isAuthenticated,
    login: userStore.login,
    logout: userStore.logOut
  }
}
```

### 2. 在组件中使用

```vue
<script setup>
import useUserStore from '@/store/modules/user'
import useAppStore from '@/store/modules/app'

const userStore = useUserStore()
const appStore = useAppStore()

// 直接读取响应式状态
const sidebar = computed(() => appStore.sidebar)
const device = computed(() => appStore.device)

// 调用 action
function toggleSidebar() {
  appStore.toggleSideBar()
}
</script>
```

### 3. 避免直接修改 state

```javascript
// ❌ 错误
userStore.token = 'xxx'

// ✅ 正确 - 通过 action 修改
userStore.login({ username, password })
```

### 4. 持久化状态

部分状态使用 localStorage/sessionStorage/Cookies 持久化：

- **token**: localStorage (通过 auth.js)
- **sidebar.opened**: Cookies
- **size**: Cookies

```javascript
// src/utils/auth.js
import Cookies from 'js-cookie'

const TokenKey = 'Admin-Token'

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  return localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return localStorage.removeItem(TokenKey)
}
```
