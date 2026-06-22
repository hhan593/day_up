# 在远程 Mac 上给指定目录单独配置 Git 账号和 SSH Key

这份文档给朋友使用。你已经可以 SSH 登录远程 Mac：

```bash
ssh yexiyue@100.111.78.54
```

登录后，下面所有命令都在远程 Mac 上执行。

## 目标

只让某一个新目录使用你的 Git 作者和你的 Git SSH Key，例如：

```text
/Volumes/yexiyue/hh/
```

其他目录里的仓库不受影响，仍然使用远程 Mac 原来的 Git 作者和原来的 SSH 配置。

如果你想换目录名，把下面所有命令里的 `hh` 换成你指定的目录名。

## 原理

Git 有一个功能叫 `includeIf`，可以按仓库所在目录自动加载额外配置。

我们会在远程 Mac 的 `~/.gitconfig` 里加一段：

```ini
[includeIf "gitdir:/Volumes/yexiyue/hh/"]
    path = ~/.gitconfig-hh
```

意思是：

- 只有仓库位于 `/Volumes/yexiyue/hh/` 下面时，才加载 `~/.gitconfig-hh`。
- `~/.gitconfig-hh` 里会写你的 Git 作者和你的 SSH Key。
- 其他目录不会加载这个配置，所以不会影响原来的 Git 作者。

## 1. 创建你的专属目录

```bash
mkdir -p /Volumes/yexiyue/hh
```

以后你的仓库都放在这个目录下面。

## 2. 在远程 Mac 上生成你的 Git SSH Key

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "你的Git邮箱" -f ~/.ssh/id_ed25519_hh_git
```

例如：

```bash
ssh-keygen -t ed25519 -C "you@example.com" -f ~/.ssh/id_ed25519_hh_git
```

生成后会有两个文件：

```text
~/.ssh/id_ed25519_hh_git
~/.ssh/id_ed25519_hh_git.pub
```

注意：

- `.pub` 是公钥，可以添加到 GitHub / GitLab / Gitee。
- 没有 `.pub` 的是私钥，只能留在远程 Mac，不要发给别人。

查看公钥：

```bash
cat ~/.ssh/id_ed25519_hh_git.pub
```

把输出的整行内容添加到你的 Git 平台账号里。

GitHub 路径：

```text
GitHub -> Settings -> SSH and GPG keys -> New SSH key
```

## 3. 写入目录专属 Git 配置

创建配置文件：

```bash
nano ~/.gitconfig-hh
```

写入下面内容，把名字和邮箱换成你的：

```ini
[user]
    name = Your Name
    email = you@example.com

[core]
    sshCommand = ssh -i ~/.ssh/id_ed25519_hh_git -o IdentitiesOnly=yes
```

保存退出。

这个文件只会给 `/Volumes/yexiyue/hh/` 下面的仓库使用。

## 4. 让 Git 在指定目录自动启用这份配置

编辑全局 Git 配置：

```bash
nano ~/.gitconfig
```

在文件最后追加：

```ini
[includeIf "gitdir:/Volumes/yexiyue/hh/"]
    path = ~/.gitconfig-hh
```

保存退出。

这一步不会覆盖原来的 Git 配置，只是增加一个“目录匹配规则”。

## 5. 克隆你的仓库到指定目录

```bash
cd /Volumes/yexiyue/hh
git clone git@github.com:你的用户名/你的仓库.git
```

例如：

```bash
git clone git@github.com:your-name/your-repo.git
```

如果是 GitLab：

```bash
git clone git@gitlab.com:your-name/your-repo.git
```

## 6. 检查是否生效

进入仓库：

```bash
cd /Volumes/yexiyue/hh/你的仓库
```

检查 Git 作者：

```bash
git config user.name
git config user.email
```

检查 SSH Key 配置：

```bash
git config core.sshCommand
```

查看配置来自哪里：

```bash
git config --show-origin user.name
git config --show-origin user.email
git config --show-origin core.sshCommand
```

如果生效，应该能看到配置来源包含：

```text
~/.gitconfig-hh
```

## 7. 测试 GitHub SSH

如果你用 GitHub：

```bash
ssh -i ~/.ssh/id_ed25519_hh_git -T git@github.com
```

成功时一般会显示：

```text
Hi your-name! You've successfully authenticated, but GitHub does not provide shell access.
```

## 8. 确认不会影响其他目录

去其他目录的仓库检查：

```bash
cd 其他仓库目录
git config user.name
git config user.email
git config core.sshCommand
```

只要那个仓库不在 `/Volumes/yexiyue/hh/` 下面，就不会使用 `~/.gitconfig-hh`。

也就是说：

- `/Volumes/yexiyue/hh/xxx` 使用你的 Git 作者和你的 SSH Key。
- 其他目录继续使用远程 Mac 原来的 Git 作者和原来的 SSH 配置。

## 常见问题

如果 commit 作者不对，检查仓库是不是在指定目录下面：

```bash
pwd
```

必须类似：

```text
/Volumes/yexiyue/hh/你的仓库
```

如果 push 提示 `Permission denied (publickey)`，检查公钥是否已经添加到你的 Git 平台账号：

```bash
cat ~/.ssh/id_ed25519_hh_git.pub
```

如果私钥权限异常，执行：

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_hh_git
chmod 644 ~/.ssh/id_ed25519_hh_git.pub
```
