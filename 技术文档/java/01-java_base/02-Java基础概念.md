# 02 - Java 基础概念

> 目标：掌握变量、8 种基本数据类型、类型转换、常量与键盘录入。

---

## 2.1 变量

变量 = **内存中的一块存储空间**，用于保存数据。Java 是**强类型语言**：变量必须先声明类型，再使用。

```java
int age = 18;              // 声明 + 赋值
double score = 95.5;
String name = "小明";
boolean isPass = true;

int count;                 // 先声明
count = 10;                // 后赋值（局部变量使用前必须初始化）
```

三要素：**数据类型、变量名、值**。

---

## 2.2 八种基本数据类型

| 类别 | 类型 | 位数 | 取值范围 / 说明 | 默认值 |
|------|------|------|----------------|--------|
| 整数 | `byte` | 8 | -128 ~ 127 | 0 |
| | `short` | 16 | -32768 ~ 32767 | 0 |
| | `int` | 32 | 约 ±21 亿（**默认整数类型**） | 0 |
| | `long` | 64 | 更大，字面量后缀 `L` | 0L |
| 浮点 | `float` | 32 | 后缀 `f`，精度低 | 0.0f |
| | `double` | 64 | **默认浮点类型** | 0.0 |
| 字符 | `char` | 16 | 单个字符，用单引号 `'A'` | '\u0000' |
| 布尔 | `boolean` | — | 只能是 `true` / `false` | false |

```java
byte b = 100;
short s = 30000;
int i = 1000000;
long l = 12345678900L;     // 超过 int 范围必须加 L

float f = 3.14f;           // 必须加 f，否则被当 double
double d = 3.14;

char c = 'A';              // 单引号，只能一个字符
boolean flag = true;       // 只能 true / false
```

> **易错点**：
> - `char` 用**单引号**，`String` 用**双引号**：`'A'` vs `"A"`。
> - `long` 不加 `L`、`float` 不加 `f` 都会编译报错或精度问题。
> - Java 的 `boolean` **不是** 0/1，不能与整数互转（区别于 C/C++）。

---

## 2.3 引用数据类型

除了 8 种基本类型，其余都是**引用类型**，最常见的是 `String`：

```java
String name = "Java";      // String 是引用类型，不是基本类型
int[] arr = {1, 2, 3};     // 数组
```

- 基本类型变量存的是**值本身**。
- 引用类型变量存的是**对象在堆中的地址**。

```text
int a = 10;          栈：a = 10
String s = "hi";     栈：s → 堆中的 "hi" 对象
```

---

## 2.4 标识符与命名规范

**标识符**：给类、方法、变量起的名字。

硬性规则：
- 由字母、数字、`_`、`$` 组成，**不能以数字开头**。
- 不能是关键字（如 `class`、`int`、`public`）。
- **区分大小写**（`age` 和 `Age` 是两个变量）。

约定规范（行业通用，务必遵守）：

| 类型 | 规范 | 示例 |
|------|------|------|
| 类名 | 大驼峰 PascalCase | `StudentManager` |
| 方法名 / 变量名 | 小驼峰 camelCase | `getUserName`、`studentAge` |
| 常量 | 全大写下划线 | `MAX_SCORE` |
| 包名 | 全小写 | `com.example.demo` |

---

## 2.5 常量

值**一经赋值就不能改变**，用 `final`：

```java
final double PI = 3.14159;
final int MAX_SCORE = 100;
// MAX_SCORE = 101;   // ❌ 编译错误：cannot assign a value to final variable
```

> 常量名习惯全大写；`final` 还可修饰方法、类（进阶篇讲）。

---

## 2.6 字面量与进制

```java
int a = 100;        // 十进制
int b = 0b1010;     // 二进制 → 10
int c = 010;        // 八进制 → 8（以 0 开头）
int d = 0x1F;       // 十六进制 → 31（以 0x 开头）
long big = 1_000_000;   // 下划线分隔，便于阅读（JDK 7+）
```

---

## 2.7 类型转换

### 自动类型转换（小 → 大，安全）

```java
int a = 10;
long b = a;         // int → long，自动
double c = a;       // int → double，自动

// 顺序：byte → short → int → long → float → double
//        char ↗（char 可转 int）
```

### 强制类型转换（大 → 小，可能丢精度）

```java
double d = 9.99;
int i = (int) d;    // 强制转换 → 9（小数部分被截断，不是四舍五入！）

int big = 300;
byte bt = (byte) big;   // 溢出，结果不是 300（按补码截断）
```

> **重点理解**：整数除法 `5 / 2 = 2`（不是 2.5）。要小数结果，至少一边是浮点：
> ```java
> int a = 5 / 2;        // 2
> double b = 5 / 2;     // 2.0（先算整数除法再转 double，仍是 2.0）
> double c = 5.0 / 2;   // 2.5 ✅
> ```

---

## 2.8 键盘录入（Scanner）

```java
import java.util.Scanner;      // 导包

public class Demo {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.print("请输入姓名：");
        String name = sc.next();          // 接收字符串（遇空格结束）

        System.out.print("请输入年龄：");
        int age = sc.nextInt();           // 接收整数

        System.out.print("请输入身高：");
        double height = sc.nextDouble();  // 接收小数

        System.out.println("姓名：" + name + "，年龄：" + age + "，身高：" + height);
        sc.close();                       // 用完关闭
    }
}
```

> **易错点**：`nextInt()` 后再 `nextLine()` 会读到残留的换行符。解决：中间加一次 `sc.nextLine()` 吃掉换行。

---

## 2.9 变量作用域

```java
public class Demo {
    static int field = 100;        // 成员变量：整个类可用

    public static void main(String[] args) {
        int local = 10;            // 局部变量：只能在 main 内用
        {
            int inner = 20;        // 块级作用域：只在 {} 内有效
            System.out.println(inner);
        }
        // System.out.println(inner);  // ❌ 超出作用域
    }
}
```

| 对比 | 成员变量 | 局部变量 |
|------|---------|---------|
| 位置 | 类中、方法外 | 方法 / 代码块内 |
| 默认值 | 有 | **无，必须手动初始化** |
| 作用域 | 整个类 | 所在 `{}` 内 |

---

## 小结

- Java 强类型：先声明类型再用；8 种基本类型 + 引用类型。
- `int`/`double` 是默认整数/浮点；`long` 加 `L`，`float` 加 `f`。
- 整数相除结果是整数，要小数需引入浮点。
- 小转大自动、大转小强制且可能丢精度。
- `Scanner` 做键盘录入，注意 `nextInt()` 后的换行残留。

## 练习

1. 定义各类型变量并打印，观察默认值。
2. 用 `Scanner` 录入两个整数，输出它们的和、差、积、商（商保留两位小数）。
3. 判断：`(int)3.99` 的结果是多少？为什么？

→ 下一篇：[03-运算符](./03-运算符.md)
