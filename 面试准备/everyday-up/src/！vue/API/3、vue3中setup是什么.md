<!--
 * @Author: hh
 * @Date: 2025-06-25 09:24:23
 * @LastEditors: hh
 * @LastEditTime: 2025-06-27 10:43:40
 * @Description:
-->

### 3、vue3 中 setup 是什么？

setup 是组件的入口函数，很多东西（composition API）都要放到 setup 中比如：computed、生命周期钩子函数啊，等等
setup 是组合式 API（Composition API）的核心入口函数，用于替代 Vue 2 中的 data、methods、computed 等选项式 API。它是 Vue 3 构建组件逻辑的主要方式，使得代码更灵活、可复用性更强，并支持更清晰的逻辑组织。
setup 的核心作用
集中管理组件逻辑

将响应式数据、计算属性、方法、生命周期钩子等统一在 setup 函数中管理，避免 Vue 2 中逻辑分散在多个选项（如 data、methods）的问题。
替代 data 和 methods

在 Vue 2 中，数据通过 data 返回，方法通过 methods 定义；而在 Vue 3 中，这些逻辑直接在 setup 中通过 ref、reactive、computed 等函数实现。
支持逻辑复用

通过自定义组合函数（Composables），可以将通用逻辑提取为独立模块，便于在多个组件间复用。
与 TypeScript 深度集成

setup 函数天然支持 TypeScript 的类型推断和类型检查，提升开发体验。
