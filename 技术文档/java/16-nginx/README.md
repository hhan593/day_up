# Nginx 知识总纲

> 定位：高性能 HTTP 服务器 / 反向代理 / 负载均衡 / 动静分离，后端架构的流量入口。
> 衔接：`08-springboot/README.md`（后端服务）、`09-microservices/README.md#六api-网关`（网关对比）、`15-kubernetes/README.md#六ingress`（Ingress 底层即 Nginx）、`12-network/README.md`（HTTP/HTTPS）、`13-linux/README.md`（部署与排查）。

---

## 目录

- [一、Nginx 是什么](#一nginx-是什么)
- [二、安装与目录](#二安装与目录)
- [三、配置文件结构](#三配置文件结构)
- [四、反向代理](#四反向代理)
- [五、负载均衡](#五负载均衡)
- [六、动静分离](#六动静分离)
- [七、HTTPS / SSL](#七https--ssl)
- [八、Gzip 与缓存](#八gzip-与缓存)
- [九、限流与安全](#九限流与安全)
- [十、与 Spring Boot / K8s 衔接](#十与-spring-boot--k8s-衔接)
- [十一、常用命令与排查](#十一常用命令与排查)
- [十二、常见面试考点](#十二常见面试考点)

---

## 一、Nginx 是什么

- 俄罗斯 Igor Sysoev 开发，**事件驱动、异步非阻塞**的高性能 Web 服务器。
- 核心能力：静态资源服务、反向代理、负载均衡、API 网关前置、SSL 终止、限流。
- 架构：`master` 进程（管理）+ 多个 `worker` 进程（处理请求，= CPU 核数），单 worker 单线程基于 `epoll`（见 `12-network/README.md#七io-模型`）。
- 性能：轻松支撑数万并发连接，内存占用低。

---

## 二、安装与目录

```bash
# Ubuntu
apt install -y nginx
# 常用路径
/etc/nginx/nginx.conf            # 主配置
/etc/nginx/conf.d/*.conf         # 站点配置（推荐放这里）
/etc/nginx/sites-enabled/        # 启用的站点（Debian 系）
/var/log/nginx/access.log        # 访问日志
/var/log/nginx/error.log         # 错误日志
/usr/share/nginx/html            # 默认根目录
```

---

## 三、配置文件结构

```nginx
# 全局块
user  nginx;
worker_processes  auto;          # = CPU 核数
error_log  /var/log/nginx/error.log warn;
events {
    worker_connections  1024;     # 单 worker 最大连接
    use epoll;                    # Linux 高效多路复用
}
http {
    include       mime.types;
    sendfile      on;
    keepalive_timeout  65;

    # 可定义 upstream、server 等
    server {
        listen 80;
        server_name example.com;
        location / {
            proxy_pass http://backend;
        }
    }
}
```

- 层级：`http` → `server`（虚拟主机）→ `location`（URI 匹配）。
- `location` 匹配优先级：`=` 精确 > `^~` 前缀 > `~` 正则 > 普通前缀。

---

## 四、反向代理

```nginx
server {
    listen 80;
    server_name api.example.com;
    location / {
        proxy_pass http://127.0.0.1:8080;     # 转发到后端
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- **正向代理**：代理客户端（科学上网）；**反向代理**：代理服务端（隐藏后端、集中入口）。
- 透传 `X-Forwarded-*` 头，后端 `Spring Boot` 才能拿到真实 IP（见 `08-springboot/README.md`）。

---

## 五、负载均衡

```nginx
upstream backend {
    # 默认轮询；可选：weight 加权、ip_hash、least_conn
    server 10.0.0.1:8080 weight=2;
    server 10.0.0.2:8080;
    server 10.0.0.3:8080 backup;        # 备用机
    # ip_hash;                          # 同 IP 落到同节点（会话保持）
    # least_conn;                       # 选连接最少的节点
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

- 策略：`round-robin`（默认轮询）、`weight`（加权）、`ip_hash`（会话保持）、`least_conn`（最少连接）、`hash $request_uri`（按 URL 一致性哈希）。
- 健康检查：社区版靠 `max_fails`/`fail_timeout` 被动剔除；`nginx-plus`/开源 `nginx_upstream_check_module` 支持主动探活。
- 与注册中心：静态配置；动态可用 `Nacos`/`Consul` + `nginx-conf` 自动生成（见 `11-nacos/README.md`）。

---

## 六、动静分离

```nginx
server {
    location /static/ {
        root /data/www;                 # 静态文件直接由 Nginx 返回
        expires 30d;                    # 浏览器缓存
    }
    location / {
        proxy_pass http://backend;      # 动态请求转发后端
    }
}
```

- 静态资源（图片/JS/CSS）由 Nginx 直接返回，降低后端压力、提升吞吐。

---

## 七、HTTPS / SSL

```nginx
server {
    listen 443 ssl;
    server_name example.com;
    ssl_certificate     /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;

    location / { proxy_pass http://backend; }
}
# HTTP 强制跳转 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

- Nginx 做 **SSL 终止**（解密在 Nginx，后端走 HTTP），减轻后端加解密开销。
- 证书：Let's Encrypt（`certbot`）免费自动续期。

---

## 八、Gzip 与缓存

```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1k;

location ~* \.(js|css|png)$ {
    expires 7d;                 # 静态资源缓存
    add_header Cache-Control "public";
}
```

- 压缩文本类响应，显著减少传输体积；静态资源设 `expires` 提升命中率。

---

## 九、限流与安全

```nginx
# 限流：定义共享内存 zone，每秒 10 个请求，突发 20
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
server {
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
}
# 连接数限制
limit_conn_zone $binary_remote_addr zone=conn:10m;
limit_conn conn 100;
```

- `limit_req`：漏桶式限流；`limit_conn`：并发连接限制。
- 安全：隐藏版本号 `server_tokens off`；防恶意 UA/目录遍历；配合 WAF（如 ModSecurity）。

---

## 十、与 Spring Boot / K8s 衔接

- **前置 Spring Boot**：Nginx 作反向代理 + 负载均衡（多实例），典型生产拓扑：`客户端 → Nginx → 多个 Spring Boot 实例`。
- **K8s Ingress**：`15-kubernetes/README.md#六ingress` 中 ingress-nginx 控制器底层就是 Nginx，把 Ingress 规则翻译成 Nginx 配置。
- **网关对比**：Nginx 偏通用流量层；Spring Cloud Gateway 偏业务网关（鉴权/限流/灰度），二者可分层（Nginx 外层 + Gateway 内层），见 `09-microservices/README.md#六api-网关`。

---

## 十一、常用命令与排查

```bash
nginx -t                      # 检查配置语法
nginx -s reload              # 平滑重载（不停机）
nginx -s stop / quit         # 停止 / 优雅停止
systemctl status nginx
# 排查
tail -f /var/log/nginx/error.log
# 502 Bad Gateway：后端不可达，查 upstream 健康
# 504 Gateway Timeout：后端响应慢，调 proxy_read_timeout
# 403 Forbidden：权限/目录索引问题
```

- 关键超时参数：`proxy_connect_timeout`、`proxy_read_timeout`、`proxy_send_timeout`。
- 502 多为后端挂掉；504 多为后端慢或阻塞（结合 `13-linux/README.md` 排查后端）。

---

## 十二、常见面试考点

1. **正向代理 vs 反向代理？** → 前者代客户端，后者代服务端（隐藏后端）。
2. **Nginx 为什么高并发？** → 异步非阻塞 + `epoll` 事件驱动 + 多 worker 无锁。
3. **master/worker 模型？** → master 管理配置/信号，worker 处理请求（=CPU核）。
4. **负载均衡策略？** → 轮询/加权/ip_hash/least_conn/一致性哈希。
5. **location 匹配优先级？** → `=` > `^~` > 正则 `~` > 前缀。
6. **502 与 504 区别？** → 502 后端不可达；504 后端超时。
7. **如何限流？** → `limit_req_zone` + `limit_req`（漏桶）。
8. **Nginx 与 Ingress 关系？** → ingress-nginx 控制器把 K8s Ingress 转成 Nginx 配置。
9. **SSL 终止是什么？** → Nginx 解密 HTTPS，后端走明文 HTTP，省后端开销。
