## 19、hmr的原理
- hmr是webpack提供的热更新机制，
- 通过websocket实时监听文件变化，
- webpack-dev-server会实时编译，当本地资源发生变化时，会通知客户端并携带上构建的文件hash，客户端会和上次的资源进行比对，如果不一致，会重新加载资源，