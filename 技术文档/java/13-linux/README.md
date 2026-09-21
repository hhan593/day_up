# Linux 与运维基础知识点总纲

> 定位：后端工程师必须会的服务器操作与线上排查能力。覆盖日常命令、性能排查、Shell、运维。
> 衔接：`05-jvm/README.md`（JVM 排查命令）、`12-network/README.md`（网络命令）、`14-docker/README.md`（容器）、`15-kubernetes/README.md`（编排）。

---

## 目录

- [一、文件与目录](#一文件与目录)
- [二、文本处理](#二文本处理)
- [三、权限与用户](#三权限与用户)
- [四、进程管理](#四进程管理)
- [五、网络相关](#五网络相关)
- [六、性能排查（CPU/内存/IO）](#六性能排查cpu内存io)
- [七、磁盘与 IO](#七磁盘与-io)
- [八、包管理与服务](#八包管理与服务)
- [九、Shell 脚本基础](#九shell-脚本基础)
- [十、常见面试考点](#十常见面试考点)

---

## 一、文件与目录

```bash
pwd / ls -lah / cd / mkdir -p / rm -rf / cp -r / mv / touch
find /data -name "*.log" -mtime +7     # 7 天前日志
tree -L 2 /opt/app
ln -s /data/app /app                    # 软链接
du -sh /var/*                           # 目录占用
```

---

## 二、文本处理

```bash
cat / grep "ERROR" app.log | tail -100
grep -r "OutOfMemory" /data/logs --include=*.log
sed -i 's/old/new/g' file                # 替换
awk '{print $1, $4}' access.log | sort | uniq -c | sort -rn | head   # 统计
cut -d, -f1 data.csv
wc -l app.log                            # 行数
less +F app.log                          # 实时翻页
```

- 管道 `|` 串联命令是核心生产力（如 `ps | grep | awk`）。

---

## 三、权限与用户

```bash
chmod 755 script.sh          # rwxr-xr-x
chown -R app:app /data/app   # 改属主
useradd -m deploy && passwd deploy
sudo -u deploy java -jar app.jar
umask 022                    # 默认权限掩码
```

- 权限位：属主/属组/其他，r=4 w=2 x=1。

---

## 四、进程管理

```bash
ps aux | grep java           # 进程列表
top / htop                   # 实时资源
kill -9 1234                 # 强杀
kill -15 1234                # 优雅终止（SIGTERM）
jobs / fg / bg / &           # 前后台
nohup java -jar app.jar > app.log 2>&1 &   # 后台运行
pstree -p 1234               # 进程树
```

---

## 五、网络相关

```bash
ping / telnet host 8080 / nc -vz host 8080
curl -i http://localhost:8080/health
netstat -antp | grep 8080
ss -s
tcpdump -i any port 8080 -nn
iptables -L -n               # 防火墙规则
```

---

## 六、性能排查（CPU/内存/IO）

- **CPU 高**：
```bash
top                          # 看 %CPU、负载
top -Hp <pid>                # 线程级
printf "%x\n" <tid>          # 线程id转16进制
jstack <pid> | grep <nid>    # 定位线程栈（结合 05-jvm/README.md）
```
- **内存高 / OOM**：
```bash
free -h / cat /proc/meminfo
jmap -histo:live <pid> | head      # 对象占用
jstat -gcutil <pid> 1s             # GC 情况
```
- **磁盘 IO 高**：
```bash
iostat -x 1
iotop                         # 按进程看 IO
```

---

## 七、磁盘与 IO

```bash
df -h                          # 挂载点空间
du -sh /var/log/*              # 占用排序
lsblk / fdisk -l               # 块设备
mount / umount                 # 挂载
lsof | grep deleted            # 已删但仍被占用的文件（空间不释放）
```

---

## 八、包管理与服务

```bash
# Debian/Ubuntu
apt update && apt install -y docker.io
# RHEL/CentOS
yum install -y nginx ; dnf install -y ...
# systemd 服务
systemctl status/start/enable/restart nginx
journalctl -u nginx -f         # 看服务日志
```

---

## 九、Shell 脚本基础

```bash
#!/bin/bash
set -e                          # 报错即停
LOG_DIR=/data/logs
DATE=$(date +%Y%m%d)
# 变量/命令替换/条件/循环
if [ -f "$LOG_DIR/app.log" ]; then
  echo "存在"
fi
for f in $LOG_DIR/*.log; do
  gzip "$f"
done
# 定时任务
# crontab -e: 0 2 * * * /opt/backup.sh
```

- `crontab -e` 配置定时任务（`分 时 日 月 周 命令`）。
- 常用：`$?`（上条命令退出码）、`2>&1`、管道。

---

## 十、常见面试考点

1. **如何查端口占用？** → `netstat -antp | grep 8080` 或 `ss -lntp`。
2. **CPU 100% 怎么排查？** → top → top -Hp pid → 转16进制 → jstack 定位（见 jvm）。
3. **文件删了但磁盘没释放？** → 被进程持有，`lsof | grep deleted`，重启/释放进程。
4. **权限 755 含义？** → 属主 rwx，组与其他 rx。
5. **软硬链接区别？** → 软链接跨文件系统、可跨盘；硬链接同 inode、不能跨盘。
6. **grep/sed/awk 常见用法？** → 过滤/替换/统计列。
7. **nohup 与 & 区别？** → & 后台；nohup 忽略挂断信号，输出重定向。
8. **crontab 格式？** → 分 时 日 月 周。
