# 02 - Java 语言基础（变量 / 类型 / 运算符 / 控制流 / 数组）

> 来源：Oracle 官方《The Java™ Tutorials》— Learning the Java Language > Language Basics
> 官方教程基线为 JDK 8，但本篇补充了后续版本（Java 9+）的改进，并标注差异。
> 原文：https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html

本篇覆盖 Java 入门后必须掌握的语言骨架：变量、基本数据类型、运算符、控制流、数组。

---

## 一、变量（Variables）

Java 是**强类型语言**，每个变量必须先声明类型再使用。

- **变量命名规则**：以字母、`$`、`_` 开头，后续可含数字；不能用关键字；区分大小写。
- **约定**：类名 `PascalCase`，方法/变量 `camelCase`，常量 `UPPER_SNAKE_CASE`。
- **默认值**：类成员变量（字段）有默认值（`int` 为 `0`、`boolean` 为 `false`、引用类型为 `null`）；**局部变量没有默认值，必须显式初始化**。

```java
int count = 10;            // 基本类型
String name = "Java";     // 引用类型
final double PI = 3.14159; // 常量（编译期后不可重新赋值）
```

---

## 二、数据类型（Data Types）

### 1. 基本类型（Primitive Types，8 种）

| 类别 | 类型 | 位数 | 范围 / 说明 |
|---|---|---|---|
| 整数 | `byte` | 8 | -128 ~ 127 |
| | `short` | 16 | -32768 ~ 32767 |
| | `int` | 32 | 约 ±21 亿 |
| | `long` | 64 | 后缀 `L`（如 `100L`） |
| 浮点 | `float` | 32 | 后缀 `f`（如 `3.14f`） |
| | `double` | 64 | 默认浮点类型 |
| 字符 | `char` | 16 | 单个 UTF-16 字符 `'A'` |
| 布尔 | `boolean` | — | 仅 `true` / `false` |

> 注意：Java 的布尔类型**不是** 0/1，不能与整数互转（区别于 C/C++）。

### 2. 引用类型（Reference Types）

- 类（`String`、自定义类）、接口、数组、枚举。
- 变量存的是**对象在堆中的引用（地址）**，不是对象本身。
- `String` 是引用类型但不可变（immutable），字面量存于字符串常量池。

### 3. 字面量（Literals）

- 二进制：`0b1010`；十六进制：`0xFF`；下划线分隔：`1_000_000`（Java 7+）。
- **文本块 Text Blocks**（Java 15 正式，JEP 378）：用 `"""` 多行字符串，避免拼接转义。

```java
String json = """
    {
      "name": "Java",
      "version": 21
    }
    """;
```

---

## 三、运算符（Operators）

| 分类 | 示例 |
|---|---|
| 赋值 | `=`、`+=`、`-=` |
| 算术 | `+`、`-`、`*`、`/`、`%` |
| 一元 | `++`、`--`、`!`、`+`（正）、`-`（负） |
| 关系 | `==`、`!=`、`>`、`<`、`>=`、`<=` |
| 条件（三元） | `? :` |
| 逻辑 | `&&`、`||`、`!` |
| 位运算 | `&`、`|`、`^`、`~`、`<<`、`>>`、`>>>`（无符号右移） |
| 实例 | `instanceof` |

- `==` 比较基本类型是**值相等**，比较引用类型是**地址相等**（对象内容用 `equals`）。
- `&&` / `||` 具有**短路**特性（左侧已决定结果则不执行右侧）。

---

## 四、控制流（Control Flow）

### 1. 条件
```java
if (score >= 60) { ... } else if (score >= 0) { ... } else { ... }

// switch（传统，Java 21 前）
switch (day) {
    case MONDAY:
    case FRIDAY: System.out.println("_work"); break;
    default: System.out.println("weekend");
}
```
> Java 21 起 switch 支持**类型模式 + `when` 守卫 + `case null`**，见 `09-sealed-pattern-matching.md`。

### 2. 循环
```java
for (int i = 0; i < 10; i++) { }            // 普通 for
for (String s : list) { }                   // 增强 for（Iterable）
while (condition) { }
do { } while (condition);
```
- 分支：`break`（跳出）、`continue`（进入下一轮）、`return`（退出方法）。
- 带标签跳出：`break outer;` 可跳出嵌套循环。

### 3. 表达式 / 语句 / 块
- **表达式（expression）**：计算为值，如 `a + b`。
- **语句（statement）**：以 `;` 结尾，如 `int x = 5;`。
- **块（block）**：`{ ... }`，限定局部变量作用域。

---

## 五、数组（Arrays）

- 固定长度、同类型元素集合，长度 `arr.length`。
- 索引从 `0` 开始，越界抛 `ArrayIndexOutOfBoundsException`。

```java
int[] nums = new int[5];          // 声明 + 分配（默认 0）
int[] primes = {2, 3, 5, 7, 11};  // 字面量初始化
String[][] matrix = new String[3][3]; // 多维数组

for (int n : primes) { System.out.println(n); }
```

- **多维数组**本质是「数组的数组」，每行长度可不同。
- 常用工具：`java.util.Arrays`（`sort`、`binarySearch`、`equals`、`toString`、`copyOf`）。

```java
import java.util.Arrays;
int[] copy = Arrays.copyOf(primes, primes.length);
Arrays.sort(copy);
System.out.println(Arrays.toString(copy));
```

---

## 六、与系列其他文档的关系

- 面向对象（类/接口/继承）→ `03-oop-classes-objects.md`
- 错误处理 → `04-exceptions.md`
- 现代特性（Record / 模式匹配 / 虚拟线程）→ `08 ~ 11`
- 对比：Java 数组类似 TS `number[]`、Python `list`，但**定长且同类型**；
  `instanceof` 类似 TS 类型守卫，但 Java 需显式强转（模式匹配后免强转，见 09）。
