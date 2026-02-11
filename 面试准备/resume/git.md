### git 总结：
[git 总结](https://blog.csdn.net/weixin_49278803/article/details/120153217)
[git rebase](https://www.bilibili.com/video/BV1Xb4y1773F?spm_id_from=333.337.search-card.all.click&vd_source=605eaae8506df36fc86fca9b2b498d80)

##### 如何合并多个 commit？（以合并三个 commit 为例子吧）
通过 git rebase -i HEAD~3 或者 git rebase -i 版本号~3

然后会进入一个命令框，然后将第一个下面的所有 pick 改为 s，然后 :wq 保存退出
然后在新的框里面输入合并 commit 的总信息，然后 :wq 保存退出。
然后提交到远程仓库即可注意提交的时候要强制提交 `git push -f` 或 `git push --force`

若想退出放弃此次压缩，执行命令：
`git rebase --abort`


查看文件目录：
linux：ll
window: tree 看到所有的文件夹目录
        tree/f 看到所有文件目录

tree /f >darknet.txt
保存的树形结构，只含有文件夹
tree /f >darknetf.txt
保存的树形结构，包含文件夹和文件



##### 查看状态：
git status

```bash
On branch master # 当前在 master 分支
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean # 
```

##### 进行追踪（将 hello.js 添加到暂存区）：
git add hello.js

##### 从 commit 中 返回 未追踪（从暂存区中返回工作区）：
git restore --staged hello.js



##### 提交本地库，形成一个历史版本:
git commit -m "日志信息" 文件名

```bash
#分支名称 版本号   提交信息
[master 22e88d2] feat: hello.js
# 几个文件改变    改变信息（插入一行）
 1 file changed, 1 insertion(+)
 create mode 100644 hello.js
```

##### 查看日志信息：
git reflog

```bash
22e88d2 (HEAD -> master) HEAD@{0}: commit: feat: hello.js
33b6a43 (origin/master) HEAD@{1}: commit (initial): feat: init
```

查看详细日志信息： git log

```bash
#     完整版版本号                                指针 指向 master 分支
commit 22e88d2f0690c42c8286ffb52c61e5b612bb998b (HEAD -> master) 
Author: 凉风有信 <3042146237@qq.com>
Date:   Thu Sep 1 09:14:18 2022 +0800
#   提交的信息
    feat: hello.js

commit 33b6a434e2926668f806c6102adde57c428773b5 (origin/master)
Author: 凉风有信 <3042146237@qq.com>
Date:   Thu Sep 1 08:55:08 2022 +0800

    feat: init
```


##### 版本改变：(切换当前指针 HEAD 指向的版本)
git reset --hard 版本号

```bash
# 返回信息：指针现在是在 版本号
HEAD is now at 22e88d2 feat: hello.js
```

#### 分支管理：
git branch 分支名        创建分支
git branch -v           查看分支(信息比较详细)
git branch              查看分支（只有分支名称）
git branch -a           查看所有分支（包括远程分支）
git checkout 分支名      切换分支
git merge 分支名         把指定的分支合并到当前分支上


###### 合并分支：
将 A 合并到 B 上面：
1、切换到 B 分支上面
2、git merge A


###### 冲突合并：
控制台返回的：
```bash
Auto-merging hello.js
# 合并出现冲突在 hello.js
CONFLICT (content): Merge conflict in hello.js
# 自动合并失败         修复冲突，然后提交结果
Automatic merge failed; fix conflicts and then commit the result.
```

<!-- 冲突代码提示： -->
```js
// 这个是当前分支的代码（<<< 和 === 之间）
<<<<<<< HEAD
// 这是 5 行，master 改
=======
// hot-fix 修改
>>>>>>> hot-fix
// 这个是合并分支的代码（=== 和 >>> 之间）
```

如何解决：
1、
在当前分支中，在冲突代码中，把需要的代码留下，其他的删除（还有 <<<< ==== >>>> 这样的标识符）
2、
把改动后的添加到暂存区
> 注意：在 commit 的时候不能添加文件名,因为 git 不知道是那个分支的文件 commit
如：
`git commit -m "解决冲突" hello.js`
控制台返回：
`fatal: cannot do a partial commit during a merge.`
正确 commit：
`git commit -m "解决冲突"`

> 还有一点需要注意的是，冲突解决的是 master 分支，而不是 hot-fix 分支。这里是 hot-fix 合并到 master 分支冲突的情况


##### 拉取分支：
git pull 分支名


