# 通过 SSH Key 连接远程 Mac

这份文档是给客户端电脑使用的。远程 Mac 的 SSH 服务已经开启，连接信息如下：

```text
远程 IP：100.111.78.54
远程用户：yexiyue
```

密码由 Mac 所有人单独提供。

## 1. 在自己的电脑生成 SSH Key

打开终端执行：

```bash
ssh-keygen -t ed25519 -C "your-name" -f ~/.ssh/id_ed25519_yexiyue_mac
```

一路回车即可。生成后会有两个文件：

```text
~/.ssh/id_ed25519_yexiyue_mac
~/.ssh/id_ed25519_yexiyue_mac.pub
```

注意：

- `id_ed25519_yexiyue_mac.pub` 是公钥，可以发给 Mac 所有人。
- `id_ed25519_yexiyue_mac` 是私钥，不能发给别人。

查看公钥内容：

```bash
cat ~/.ssh/id_ed25519_yexiyue_mac.pub
```

Windows PowerShell 可以用：

```powershell
Get-Content ~/.ssh/id_ed25519_yexiyue_mac.pub
```

把显示出来的整行公钥内容发给 Mac 所有人，让对方添加到远程 Mac 的：

```text
/Users/yexiyue/.ssh/authorized_keys
```

## 2. 测试连接

等 Mac 所有人添加好公钥后，在自己的电脑执行：

```bash
ssh -i ~/.ssh/id_ed25519_yexiyue_mac yexiyue@100.111.78.54
```

第一次连接时，可能会提示是否信任主机，输入：

```text
yes
```

如果要求输入密码，输入 Mac 所有人单独提供的密码。

## 3. 配置快捷连接

编辑自己电脑上的 SSH 配置文件：

```bash
nano ~/.ssh/config
```

如果 `~/.ssh` 或 `config` 不存在，可以先创建：

```bash
mkdir -p ~/.ssh
touch ~/.ssh/config
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config
```

在 `~/.ssh/config` 里追加：

```sshconfig
Host yexiyue-mac
    HostName 100.111.78.54
    User yexiyue
    IdentityFile ~/.ssh/id_ed25519_yexiyue_mac
    IdentitiesOnly yes
```

保存后，以后可以直接执行：

```bash
ssh yexiyue-mac
```

## 4. 常见问题


链接cluade 
security unlock-keychain ~/Library/Keychains/login.keychain-db
如果提示 `Permission denied (publickey,password)`：1111

- 确认公钥已经添加到远程 Mac 的 `/Users/yexiyue/.ssh/authorized_keys`。
- 确认添加的是 `.pub` 公钥内容，不是私钥。
- 确认公钥是一整行，没有换行截断。
- 可以先用密码登录，再检查公钥是否添加正确。

如果提示连接超时：

- 确认 IP 是 `100.111.78.54`。
- 确认当前电脑能访问这个 IP。
- 确认远程 Mac 在线。

如果本地私钥权限异常，可以在自己的电脑执行：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_yexiyue_mac
chmod 644 ~/.ssh/id_ed25519_yexiyue_mac.pub
```
