## pinia 的原理：

- pinia 就是一个全局单例模式创建的对象，通过 provide 注入 到 vue 组件中，通过 definePinia 创建 store 实例并挂载到 Pinia_s，Map 映射表上，在使用 usexxx 的时候通过 inject 获取 pinia 实例上的 \_s 中的对应 store。从而获取 Store 上面的一些方法。比如说经过响应式的 state,经过 computed 保证的 getter 和改变 state 状态的 action 方法。

## 为什么通过 use×××，可以拿到 store 实例。

- 因为通过 use 函数在 vue 组件中执行可以通过 inject 获取到 pinia 实例，所以就可以拿到 pinia.\_s 中的 store 实例 ;其实 use 函数就是 definePinia 中返回的一个闭包函数，引用这 definePinia 创建的 store。并且将 store 挂载到 Pinia 实例的\_s Map 映射表上。

## 多个 defineStore 创建出来的 store 是隔离的吗？

pinia 相较于 vuex 的一大优点就是他将 moduel 进行了扁平化，每一个 store 都是一个独立的模块存储在 pinia.\_s 中，每一个 store 的 state,getters,action 都是独立的不相互影响的。

## pinia 中使用 effectScope 是干什么的？ 为什么要用他？

- pinia 在创建 store 的时候被放到了 effectScope 创建的响应式作用域，给我们提供了一个能力就是可以通过 scope.stop 去将 store 的响应式进行清除的能力。

## pinia 中有哪几种方法修改 state 中的状态

- $patch 可以进行批量的修改 state 中的数据
- $state 可以直接对 state 进行替换
- $reset 可以对 options 方式创建的 store 回复其 state 状态的原始值。
- 通过调用 action 的方法可以对 state 中的数据进行改变。
- 可以直接通过 store.state.xxx 对数据进行修改。

## 如果想监听 store 中的状态可以使用什么进行监听。

- 可以使用$subscribe 对数据进行监听，其实他的内部原理就是 watch 方法进行的数据监听
