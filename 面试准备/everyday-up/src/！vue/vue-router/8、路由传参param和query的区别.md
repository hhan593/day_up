### 8、路由传参的 param 和 query 的区别?

- params 参数 是路由参数，需要在编写路由时进行配置 /:id 通过 params 进行传递时必须使用 不可以使用 path 和 params 结合进行传参，params 会被丢弃。可以使用 name + params 进行传参，path: /${变量}
- query 参数 是查询参数，其会以 ?key=value 的形式拼接在 url 后
- 参数可以通过 在 optionsAPI 中可以使用 this 获取，在 componsitionAPI 中使用 useRoute 进行获取
- 可以通过设置路由配置项 props:true 将params参数在组件中作为props参数传递给组件，不需要使用route.params去获取。

### 在进行导航是通过 router.push(参数)

- 可以直接传递 path 路径
- 可以传递对象 包含路径 { path:'' }
- 可以传递参数 包含路由名 {name: '' } 可以在对象中携带 params query 等参数

怎样保证每次传参不丢失？
