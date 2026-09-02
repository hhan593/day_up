# 14 · 进程管理、部署与容器化（PM2 / Cluster / Docker）

> 官方来源：PM2 Cluster Mode（https://pm2.keymetrics.io/docs/usage/cluster-mode/，Keymetrics）
> 版本说明：PM2 为 Node 生态主流生产进程管理器；Node v26 原生支持 `cluster` 模块与 `node --watch`。

Node.js 是**单线程事件循环**（见 `02-event-loop-async.md`），单进程只能用一个 CPU 核。生产环境需多进程利用多核，并保证进程崩溃自启。

## 一、cluster 模块（原生多核）

```js
import cluster from 'node:cluster';
import os from 'node:os';
import http from 'node:http';

if (cluster.isPrimary) {
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) cluster.fork(); // 每核一个 worker
  cluster.on('exit', (w) => cluster.fork());       // 崩溃自启
} else {
  http.createServer((req, res) => res.end('ok')).listen(3000);
}
```

- `cluster.fork()` 创建子进程，共享同一端口（底层由 master 分发）。
- Master 崩溃则全部 worker 失联 → 需要进程外守护。

## 二、PM2（生产进程管理器）

### 启动与守护
```bash
npm i -g pm2
pm2 start dist/server.js -i max     # -i max：按核数开 cluster
pm2 start npm --name api -- run start
pm2 list / pm2 logs / pm2 monit
pm2 restart api / pm2 reload api      # reload 零停机
pm2 stop api / pm2 delete api
```

### 配置文件（ecosystem）
```js
// ecosystem.config.js
export default {
  apps: [{
    name: 'api',
    script: 'dist/server.js',
    instances: 'max',         // 集群模式
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    env: { NODE_ENV: 'production' },
    max_memory_restart: '1G',
  }],
};
```
```bash
pm2 start ecosystem.config.js
pm2 save && pm2 startup        # 开机自启
```

### 集群模式原理（官方）
PM2 cluster 模式底层用 Node `cluster` 模块，fork 的子进程自动共享 server 端口，由 master 做负载均衡（round-robin），把网络请求分发到各 worker。CPU 密集任务可借此水平扩展。

## 三、容器化（Docker）

```dockerfile
FROM node:26-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

- 单容器单进程，多实例由 **K8s / 容器编排**做横向扩展（替代 PM2 cluster）。
- Alpine 镜像体积小；`npm ci` 保证依赖锁定。
- 配合 `HEALTHCHECK`、资源 limit、优雅退出（`process.on('SIGTERM')` 关闭 server）。

## 四、`node --watch` 与开机自启

- 开发热重载：`node --watch server.js`（v18.11+ 内置，替代 nodemon）。
- 生产守护：PM2 或容器编排，而非 `--watch`。

## 五、优雅关闭（重要）

```js
async function shutdown(signal) {
  console.log(signal, 'received');
  server.close(() => process.exit(0));
  await db.close();
  setTimeout(() => process.exit(1), 10000).unref(); // 超时强退
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

- K8s/PM2 滚动更新会先发 `SIGTERM`，务必处理以释放连接。

## 六、与 Java 部署对照

| Node | Java（java/13-24） |
|---|---|
| 单进程单线程 + cluster 多实例 | JVM 多线程 + 虚拟线程（java/10） |
| PM2 cluster | Tomcat 线程池 / Spring Boot 内嵌容器 |
| Docker + K8s 横向 | Spring Cloud（java/24）服务治理 |
| `node --watch` | Spring DevTools |

> 延伸：`09-process-worker-threads.md`（CPU 密集用 worker 而非 cluster）、`技术文档/nextjs`（部署）、`24-messaging-microservices.md`（服务治理）。
