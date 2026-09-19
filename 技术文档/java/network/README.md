# 计算机网络与 HTTP 知识总纲

> 定位：后端必须懂的网络基础——TCP 可靠传输、HTTP 协议、HTTPS 安全、网络排查。
> 衔接：`microservices/README.md#四服务通信`（gRPC/REST）、`linux/README.md`（网络排查命令）、`concurrency/README.md`（IO 模型）。

---

## 目录

- [一、OSI 与 TCP/IP](#一osi-与-tcpip)
- [二、TCP 核心机制](#二tcp-核心机制)
- [三、TCP 三次握手与四次挥手](#三tcp-三次握手与四次挥手)
- [四、HTTP 协议](#四http-协议)
- [五、HTTPS](#五https)
- [六、HTTP/2 与 HTTP/3](#六http2-与-http3)
- [七、IO 模型](#七io-模型)
- [八、常见网络排查命令](#八常见网络排查命令)
- [九、常见面试考点](#九常见面试考点)

---

## 一、OSI 与 TCP/IP

| 层级（TCP/IP） | 协议 | 设备/说明 |
|----------------|------|-----------|
| 应用层 | HTTP/DNS/SMTP/gRPC | 应用数据 |
| 传输层 | TCP/UDP | 端口、可靠/不可靠 |
| 网络层 | IP/ICMP | 路由、寻址 |
| 链路层 | Ethernet/ARP | 网卡、MAC |

- 后端重点在**传输层（TCP）**与**应用层（HTTP）**。

---

## 二、TCP 核心机制

- **可靠传输**：序列号 + 确认应答（ACK）+ 超时重传。
- **流量控制**：滑动窗口，接收方按缓冲区大小通告窗口，防发送过快。
- **拥塞控制**：慢启动 → 拥塞避免 → 快重传/快恢复，防止压垮网络。
- **粘包/拆包**：TCP 是字节流，应用层需定长/分隔符/长度前缀来拆包（Netty 用 `LengthFieldBasedFrameDecoder`）。

---

## 三、TCP 三次握手与四次挥手

- **握手（建立）**：SYN → SYN+ACK → ACK。防止历史连接、双方确认收发能力。
- **挥手（关闭）**：FIN → ACK → FIN → ACK。因 TCP 全双工，需两端各自关闭。
- **TIME_WAIT**：主动关闭方等待 2MSL，确保最后 ACK 到达、旧报文消散；高并发短连接下 TIME_WAIT 过多需调优（`tcp_tw_reuse`/连接池）。

---

## 四、HTTP 协议

- 无状态，靠 Cookie/Session/JWT 维持状态。
- 方法：`GET`(幂等)/`POST`(非幂等)/`PUT`(幂等)/`DELETE`/`PATCH`/`HEAD`/`OPTIONS`。
- 状态码：
  - 2xx 成功（200/201/204）
  - 3xx 重定向（301 永久/302 临时/304 缓存）
  - 4xx 客户端错（400/401/403/404/429 限流）
  - 5xx 服务端错（500/502/503/504 网关超时）
- 头部：`Content-Type`、`Authorization`、`Cache-Control`、`Connection: keep-alive`、`Cookie`。
- 缓存：`ETag`/`Last-Modified`/`Cache-Control`/`Expires`。

---

## 五、HTTPS

- = HTTP + **TLS/SSL**，解决窃听、篡改、冒充。
- 过程：TCP 握手 → TLS 握手（证书验证 + 非对称协商出**对称密钥**）→ 对称加密传输。
- 证书：CA 签发，含公钥与服务身份；客户端校验链与域名。
- 混合加密：非对称（RSA/ECDHE）仅用于交换密钥，后续用对称（AES）加密数据（性能）。

---

## 六、HTTP/2 与 HTTP/3

- **HTTP/1.1**：持久连接、管线化（队头阻塞）。
- **HTTP/2**：多路复用（单连接并行流）、头部压缩（HPACK）、服务端推送。
- **HTTP/3**：基于 **QUIC（UDP）**，解决 TCP 队头阻塞，0-RTT 建连，移动网络友好。

---

## 七、IO 模型

- **阻塞 BIO**：一连接一线程，并发差。
- **非阻塞 NIO**：轮询，忙等。
- **IO 多路复用**：`select/poll/epoll`，单线程管海量连接（Redis/Nginx/Netty 用），`epoll` 高效（事件驱动）。
- **异步 AIO**：内核完成才通知（Linux `io_uring`）。

---

## 八、常见网络排查命令

```bash
ping host                      # 连通性
telnet host 8080 / nc -vz host 8080   # 端口可达
curl -i https://host/api       # HTTP 请求+头
tcpdump -i any port 8080 -nn   # 抓包
netstat -antp | grep 8080      # 连接状态（TIME_WAIT 等）
ss -s                          # socket 统计（比 netstat 快）
traceroute host                # 路由路径
```

---

## 九、常见面试考点

1. **TCP 为什么三次握手？** → 确认双方收发能力，防历史连接。
2. **为什么四次挥手？** → 全双工需各自 FIN/ACK。
3. **TIME_WAIT 作用？** → 等 2MSL 确保 ACK 到达、旧包消散。
4. **TCP 如何保证可靠？** → 序号/ACK/重传/流量/拥塞控制。
5. **GET 与 POST 区别？** → 语义、幂等、参数位置、缓存。
6. **HTTPS 过程？** → TCP + TLS 握手 + 混合加密。
7. **HTTP/2 改进？** → 多路复用、HPACK、服务端推送。
8. **IO 多路复用？** → select/poll/epoll，单线程管多连接（epoll 事件驱动）。
9. **粘包怎么解？** → 定长/分隔符/长度前缀拆包。
