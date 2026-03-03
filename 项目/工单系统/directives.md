# 自定义指令文档

项目使用 Vue 3 的自定义指令来实现权限控制、DOM 操作等功能。

指令文件位于 `src/directive/` 目录。

## 指令列表

| 指令 | 说明 | 位置 |
|------|------|------|
| `v-hasPermi` | 权限控制（操作权限） | `directive/permission/hasPermi.js` |
| `v-hasRole` | 角色控制 | `directive/permission/hasRole.js` |
| `v-copyText` | 复制文本 | `directive/common/copyText.js` |
| `v-safe-html` | XSS 安全 HTML | `directive/safeHtml/index.js` |

## 权限指令

### v-hasPermi - 操作权限

根据用户权限控制元素显示/隐藏。

**用法:**

```vue
<!-- 单个权限 -->
<el-button v-hasPermi="['system:user:add']">新增</el-button>

<!-- 多个权限（满足其一） -->
<el-button v-hasPermi="['system:user:edit', 'system:user:add']">编辑</el-button>
```

**原理:**

- 检查用户 permissions 数组
- 如果包含 `*:*:*`（超级权限）或指令值中的任一权限，显示元素
- 无权限时，从 DOM 中移除元素

**权限格式:**

```
module:function:action

示例：
- system:user:add      用户管理-用户-新增
- system:user:edit     用户管理-用户-修改
- system:user:remove   用户管理-用户-删除
```

### v-hasRole - 角色控制

根据用户角色控制元素显示/隐藏。

**用法:**

```vue
<!-- 单个角色 -->
<el-button v-hasRole="['admin']">管理员操作</el-button>

<!-- 多个角色（满足其一） -->
<el-button v-hasRole="['admin', 'operator']">操作</el-button>
```

**原理:**

- 检查用户 roles 数组
- 如果包含 `admin`（超级角色）或指令值中的任一角色，显示元素
- 无权限时，从 DOM 中移除元素

## 通用指令

### v-copyText - 复制文本

点击元素复制文本到剪贴板。

**用法:**

```vue
<el-button v-copyText="copyContent">复制</el-button>
```

**参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| value | String | 要复制的文本内容 |

**实现:**

```javascript
import { ElMessage } from 'element-plus'

export default {
  mounted(el, binding) {
    el.$value = binding.value
    el.handler = () => {
      // 创建 textarea 执行复制
      const textarea = document.createElement('textarea')
      textarea.value = el.$value
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('Copy')
      document.body.removeChild(textarea)
      ElMessage.success('复制成功')
    }
    el.addEventListener('click', el.handler)
  },
  updated(el, binding) {
    el.$value = binding.value
  },
  unmounted(el) {
    el.removeEventListener('click', el.handler)
  }
}
```

### v-safe-html - XSS 安全 HTML

安全地渲染 HTML 内容，防止 XSS 攻击。

**用法:**

```vue
<!-- 不安全：直接使用 v-html -->
<div v-html="content"></div>

<!-- 安全：使用 v-safe-html -->
<div v-safe-html="content"></div>
```

**原理:**

使用 [DOMPurify](https://github.com/cure53/DOMPurify) 库净化 HTML 内容，移除危险的标签和属性。

**实现:**

```javascript
import DOMPurify from 'dompurify'

export default {
  mounted(el, binding) {
    el.innerHTML = DOMPurify.sanitize(binding.value || '')
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.innerHTML = DOMPurify.sanitize(binding.value || '')
    }
  }
}
```

## 指令注册

所有指令在 `src/directive/index.js` 中注册：

```javascript
import hasRole from './permission/hasRole'
import hasPermi from './permission/hasPermi'
import copyText from './common/copyText'
import safeHtml from './safeHtml'

export default function directive(app) {
  app.directive('hasRole', hasRole)
  app.directive('hasPermi', hasPermi)
  app.directive('copyText', copyText)
  app.directive('safe-html', safeHtml)
}
```

在 `main.js` 中应用：

```javascript
import directive from './directive'

const app = createApp(App)
directive(app)
```

## 开发自定义指令

### 指令钩子

Vue 3 指令支持以下钩子：

| 钩子 | 说明 |
|------|------|
| `created` | 绑定元素属性或事件监听器前 |
| `beforeMount` | 指令第一次绑定到元素并在挂载父组件前 |
| `mounted` | 绑定元素的父组件被挂载后 |
| `beforeUpdate` | 更新包含组件的 VNode 前 |
| `updated` | 包含组件的 VNode 及其子组件更新后 |
| `beforeUnmount` | 卸载绑定元素的父组件前 |
| `unmounted` | 指令与元素解绑且父组件卸载后 |

### 指令钩子参数

```javascript
export default {
  mounted(el, binding, vnode, prevVnode) {
    // el: 绑定元素
    // binding: 包含以下属性的对象
    //   - value: 指令值
    //   - oldValue: 旧值
    //   - arg: 参数
    //   - modifiers: 修饰符
    //   - instance: 组件实例
    //   - dir: 指令定义对象
    // vnode: 代表绑定元素的 VNode
    // prevVnode: 之前的 VNode（仅在 beforeUpdate/updated 中）
  }
}
```

### 示例：自定义指令

```javascript
// directive/focus/index.js
export default {
  mounted(el) {
    el.focus()
  }
}

// 使用
<input v-focus />
```
