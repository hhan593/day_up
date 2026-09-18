# 01 - Java 入门与开发环境

> 目标：理解 Java 运行原理，装好 JDK，写出并运行第一个 Java 程序。

---

## 1.1 Java 是什么

Java 是一门**面向对象的、跨平台的**高级编程语言，1995 年由 Sun 公司（后被 Oracle 收购）发布。

三个必须分清的概念：

| 缩写 | 全称 | 作用 | 类比 |
|------|------|------|------|
| **JDK** | Java Development Kit | 开发工具包，含编译器 `javac`、运行工具，**开发者装这个** | 整套工具箱 |
| **JRE** | Java Runtime Environment | 运行环境，含 JVM + 核心类库，**只运行程序的人装** | 只有工具 |
| **JVM** | Java Virtual Machine | 虚拟机，负责执行字节码 | 发动机 |

关系：`JDK ⊃ JRE ⊃ JVM`。

```text
JDK = JRE + 开发工具（javac、jar、javadoc ...）
JRE = JVM + 核心类库（String、System ...）
JVM = 执行 .class 字节码的虚拟机
```

> **只需记住**：开发 Java 装 **JDK**，且推荐 **JDK 17 或 21（LTS 长期支持版）**。JDK 8 是历史主流，新项目建议 17+。

---

## 1.2 跨平台原理（Java 的核心卖点）

Java 的口号：**Write Once, Run Anywhere（一次编写，到处运行）**。

```text
Hello.java  --javac 编译-->  Hello.class（字节码）  --JVM 解释执行-->  各平台运行
   （源码）                      （平台无关）             Windows / Linux / macOS 各有自己的 JVM
```

- 源码先编译成**字节码**（`.class`，平台无关）。
- 各操作系统安装对应版本的 **JVM**，由 JVM 把字节码翻译成机器指令。
- 因此：**字节码到处一样，JVM 因平台而异**。

> 与 C/C++ 的区别：C 直接编译成对应平台的机器码，换平台要重新编译；Java 编译一次即可。

---

## 1.3 安装 JDK

1. 下载：Oracle JDK 或 OpenJDK（推荐 [Adoptium Temurin](https://adoptium.net/) 或 [Oracle JDK](https://www.oracle.com/java/technologies/downloads/)）。
2. 安装：一路下一步，**记住安装路径**（如 `C:\Program Files\Java\jdk-21`）。
3. 配置环境变量（Windows）：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JAVA_HOME` | `C:\Program Files\Java\jdk-21` | JDK 根目录 |
| `Path` | 追加 `%JAVA_HOME%\bin` | 让命令行能找到 `javac`/`java` |

4. 验证：

```bash
javac -version
java -version
# 输出类似：javac 21.0.1 / java 21.0.1
```

> **常见问题**：`'javac' 不是内部或外部命令` → Path 没配好，或改完没重开命令行。

---

## 1.4 第一个 Java 程序

新建文件 `Hello.java`：

```java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");   // 输出并换行
    }
}
```

命令行编译运行：

```bash
javac Hello.java     # 编译，生成 Hello.class
java Hello           # 运行（注意：不加 .class）
```

### 程序结构逐行解读

| 代码 | 含义 |
|------|------|
| `public class Hello` | 定义一个公开类，**类名必须与文件名一致** |
| `public static void main(String[] args)` | 主方法，程序入口，固定写法 |
| `System.out.println(...)` | 向控制台打印一行 |
| `;` | 每条语句以分号结束 |

> **易错点**：
> - 类名 `Hello` 与文件名 `Hello.java` 必须完全一致（大小写敏感）。
> - `main` 方法签名写错（如漏 `static`）会导致「找不到 main 方法」。
> - `println` 换行，`print` 不换行。

---

## 1.5 注释

```java
// 单行注释

/*
   多行注释
   可以写很多行
*/

/**
 * 文档注释（javadoc），可被工具提取生成 API 文档
 * @author hh
 */
public class Hello { }
```

> 好习惯：**先写注释说明「要做什么」，再写代码**。注释解释「为什么」，而不是复述「做了什么」。

---

## 1.6 使用 IDEA（推荐）

1. 下载安装 **IntelliJ IDEA Community**（社区版免费）。
2. `New Project` → 选 Java → 选已安装的 JDK → 创建。
3. 在 `src` 下右键 `New → Java Class`，输入 `Hello`。
4. 输入 `psvm` 回车自动生成 `main`，输入 `sout` 回车自动生成 `System.out.println()`。
5. 点绿色三角运行。

常用快捷键：

| 快捷键 | 作用 |
|--------|------|
| `psvm` + Tab | 生成 main 方法 |
| `sout` + Tab | 生成输出语句 |
| `Ctrl + /` | 单行注释 |
| `Ctrl + Shift + /` | 多行注释 |
| `Ctrl + D` | 复制当前行 |

---

## 1.7 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| 找不到 `javac` | 环境变量未配 | 配 `JAVA_HOME` + `Path` |
| 类名与文件名不一致 | 命名错误 | 改成一致 |
| 中文乱码 | 编码不一致 | 统一 UTF-8，或 `javac -encoding UTF-8` |
| 找不到 main 方法 | 签名错误 | 检查 `public static void main(String[] args)` |
| `Error: A JNI error` | 版本不匹配 | 编译与运行用同一 JDK |

---

## 小结

- `JDK ⊃ JRE ⊃ JVM`，开发装 JDK（推荐 17/21 LTS）。
- Java 跨平台 = 字节码平台无关 + 各平台 JVM 解释执行。
- 第一个程序：`public class Xxx { public static void main(String[] args) { ... } }`。
- 类名必须与文件名一致。

## 练习

1. 输出自己的姓名、年龄、专业。
2. 输出一首古诗，练习换行与注释。

→ 下一篇：[02-Java基础概念](./02-Java基础概念.md)
