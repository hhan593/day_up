# 15. Vue 3 性能优化

> 来源可信度：**官方文档确认**（基于 Vue 3 编译期优化、静态提升、PatchFlag 文档；与 `04-reactivity-fundamentals.md` 衔接）
> 关联：React `14-performance-memo.md`、Next `19-monitoring.md`

## 1. 编译期优化（Vue 3 vs Vue 2）

- **静态提升（hoistStatic）**：静态节点/属性提升到渲染函数外，避免每次重建。
- **PatchFlag**：编译时给动态节点打标记（TEXT/CLASS/PROPS…），diff 时只检查对应 flag，跳过静态部分。
- **缓存事件处理**：`@click` 内联函数编译期缓存，避免子组件不必要更新。

```vue
<!-- 编译后带 patchFlag，仅文本动态 -->
<div class="static"> {{ msg }} </div>
```

## 2. 响应式开销控制

```ts
import { shallowRef, shallowReactive, markRaw } from 'vue';

const big = shallowRef({ items: [] }); // 只监听 .value 替换，不深层
markRaw(hugeLibInstance);              // 跳过响应式代理（第三方大对象）
```

- 大对象用 `shallowRef`/`shallowReactive` 或大三方实例 `markRaw`，避免无谓代理。

## 3. 组件级优化

- `v-memo`：缓存子树，依赖变化才更新。
- `defineAsyncComponent`：路由级/重组件懒加载。
- `v-once`：一次性渲染（静态内容）。

```vue
<Comp v-memo="[dep1, dep2]" />
```

## 4. 列表渲染 key

```vue
<div v-for="item in list" :key="item.id">{{ item.name }}</div>
```

- 稳定 `key`（非 index）让 diff 复用 DOM，避免错乱（见根 README diff 算法说明）。

## 5. 打包优化

- 按需引入：`unplugin-vue-components` 自动按需导入 Element Plus 等。
- Tree-shaking：Vue 3 全 ESM，未用 API 自动剔除。
- 与 Vite 配合：构建快、产物小（对比 React 的 Vite/Turbopack）。

## 6. 一句话总结

> Vue 3 性能靠编译期（静态提升+PatchFlag 精准 diff）+ 响应式（shallowRef/markRaw 减负）+ 组件（v-memo/异步/稳定 key）+ 打包（按需/Tree-shaking）。比 Vue 2 大幅减少运行时 diff 开销。
