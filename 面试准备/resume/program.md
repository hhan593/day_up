#### 项目背景：
行思工作室每年都会招新，
每年都会进行人员对比，确认人员的留任率，然而用excel记录用户信息，由于之间间隔时间比较长很容易出现丢失，所以新增了用户管理模块
招新完之后会进行分组培训，由于各个组组别不一致并且大家学习进度不一致所以开展培训就比较麻烦，所以写了一个人员的后台管理系统，可以确切的知道每一位同学的学习情况，然后根据学习情况组织相应的培训，并且还可以申请时间点和工作室的地点进行培训，然后由主任审批，为方便大家展开培训等尝试写了一个这样的人员管理和审批的后台管理系统。

#### 为什么要封装 localstorage：
- 设置命名空间，防止每个项目中的 localstorage 搞得乱七八糟的
- 原生的不好用，每次用的时候内容都要转为字符串，用的不舒服，不能像给对象设置值一样舒服的去使用
```js
// 对象版本，其实应该是作为一个模块暴露出去的，这里为了演示就用了对象版本
const $storage = {
  getItem(key) {
    return $storage.getStorage()[key]
  },
  setItem(key, val) {
    let storage = $storage.getStorage()
    storage[key] = val
    window.localStorage.setItem('manager', JSON.stringify(storage))
  },
  removeItem(key) {
    let storage = $storage.getStorage()
    delete storage[key]
    window.localStorage.setItem('manager', JSON.stringify(storage))
  },
  clearAll() {
    window.localStorage.clear()
  },
  getStorage() {
    return JSON.parse(window.localStorage.getItem('manager')) || {}
  }
}
```

#### 全局 mock 和 单个 mock 的设计：
在每一个 api 下的 request 中都有一个选项是 mock，并且该 mock 的优先级比全局 mock 优先级高。


##### 项目的登录注册？
用的 JWT

什么是 JWT？
JWT 是跨域认证解决方案，http 是无状态的，服务端会生成


JWT 解决什么问题？
1、数据传输更加高效
2、jwt 会生成签名，保证传输安全
3、jwt 具有时效性
4、jwt 更高效利用集群做好单点登录（因为 token 是存在客户端，只需要客户端带上 token 就可以了，然后给服务端，服务端只需要验证，也不需要像 session、cookie 那样去 redis 中查找了，session、cookie 在不同服务器上都要进行存储信息，那么就无法做到单点登陆）

#####  jwt 的详细介绍（优缺点）？

##### jwt 算法？

##### token 和 cookie 两种方式有什么区别？

##### 你项目中 token 在哪里存储？
在 localstorage 中存储

##### 企业有多个服务器多个域名怎么实现jwt？

##### 项目里HTTP请求用的是json数据么？content-type设置的是什么？

#### 项目问题：

##### 弹框控件问题：
项目中新增的和编辑用的一个弹框控件，然后根据 showValue 控制展示与否，刚开始是在展开的时候直接赋值进去，但是发现先点编辑，然后再点新增的时候弹框的内容没有重置，然后经过排查发现上面那种写法会将初始状态不为空，所以重置的时候不起作用，解决方案，将拷贝操作放到 nextTick 中进行。

##### 自定义指令问题：

##### 如何区分不同用户？


##### 如何实现登陆验证？

##### 项目有没有打包部署过，你对项目完成之后打包过程中一些配置，以及部署到服务器上需要做什么，是手动部署还是采用了一些持续集成的方式之类的？