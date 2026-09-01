# Vue Router 4（路由）

> 来源：Vue Router 官方文档（https://router.vuejs.org/guide/）— Getting Started / Essentials
> 版本：Vue Router 4（Vue 3 配套，MIT License, © Evan You / Eduardo San Martin Morote）

---

## 一、创建路由实例

```js
import { createRouter, createWebHistory } from 'vue-router'
import Home from './Home.vue'
import About from './About.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/about', component: About },
]
export const router = createRouter({
  history: createWebHistory(), // 或 createWebHashHistory()
  routes,
})
```
- `history`：Web 历史模式（`createWebHistory`）/ Hash 模式（`createWebHashHistory`）/ 内存（`createMemoryHistory`，测试/SSR）。

---

## 二、注册插件

```js
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).use(router).mount('#app')
```
- 注册后全局可用 `<RouterView>`/`<RouterLink>`，并提供 `useRouter()`/`useRoute()`。

---

## 三、RouterView 与 RouterLink

```vue
<template>
  <nav><RouterLink to="/">Home</RouterLink> <RouterLink to="/about">About</RouterLink></nav>
  <RouterView />
</template>
```
- `<RouterView>`：当前 URL 对应组件渲染处（可嵌套）；
- `<RouterLink>`：替代 `<a>`，避免刷新、处理编码。

---

## 四、组合式 API：useRoute / useRouter

```vue
<script setup>
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()   // 当前路由（fullPath/query/params）
const router = useRouter() // 路由实例
</script>
```

---

## 五、动态路由 / 嵌套路由（核心）

```js
const routes = [
  { path: '/users/:id', component: User, props: true },  // :id 参数
  {
    path: '/parent',
    component: Parent,
    children: [                 // 嵌套路由
      { path: 'child', component: Child },
    ],
  },
]
```
- 取参：`route.params.id`（组件中 `props: true` 可直传 prop）；
- 嵌套：父模板放 `<RouterView>` 渲染 children。

---

## 六、编程式导航

```js
router.push('/about')                 // 跳转（可传对象 { path, query, params }）
router.replace({ query: { search: 'x' } }) // 替换不进历史
router.go(-1)                          // 前进/后退
```

---

## 七、导航守卫（Navigation Guards）

```js
router.beforeEach((to, from) => {
  if (to.meta.requiresAuth && !isLogin) return '/login' // 返回路径或 false 取消
})
```
- 全局 `beforeEach`/`afterEach`；路由级 `beforeEnter`；组件内 `onBeforeRouteLeave`/`onBeforeRouteUpdate`。
- 常用于权限校验、取消导航。

---

## 小结（Recap）

- `createRouter` + `createWebHistory` + `routes`；
- `useRoute`/`useRouter` 组合式访问；
- 动态 `:id`、嵌套 children、编程式 `push`、守卫 `beforeEach`。

---

## 衔接

- 组件/props：`08-components-props-events.md`
- 与 Next.js 对比：`技术文档/nextjs` 的文件系统路由（App Router 约定 vs 显式 routes 数组）
- 与 React Router 对比：本质一致（routes 树 + RouterView 组件）
