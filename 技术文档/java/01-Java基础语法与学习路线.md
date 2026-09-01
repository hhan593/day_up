  
  
这份笔记适合 Java 初学阶段使用，重点是先建立完整的知识地图，再通过小练习逐步掌握语法和面向对象思想。  
  
## 一、Java 程序基本结构  
  
Java 程序通常从 `main` 方法开始执行。  
  
```java  
public class Main {  
    public static void main(String[] args) {        System.out.println("Hello Java");    }}  
```  
  
需要先理解几个概念：  
  
- `class`：类，Java 代码的基本组织单位。  
- `main`：程序入口。  
- `System.out.println()`：控制台输出。  
- 文件名通常要和 `public class` 的类名一致。  
  
## 二、变量和数据类型  
  
Java 是强类型语言，变量必须先声明类型，再使用。  
  
```java  
int age = 18;  
double height = 1.75;  
boolean isStudent = true;  
char grade = 'A';  
String name = "Tom";  
```  
  
常见类型：  
  
- `int`：整数。  
- `double`：小数。  
- `boolean`：布尔值，只有 `true` 和 `false`。  
- `char`：单个字符。  
- `String`：字符串，属于引用类型，不是基本类型。  
  
常见细节：  
  
```java  
int a = 5 / 2;       // 结果是 2double b = 5 / 2;    // 结果是 2.0double c = 5.0 / 2;  // 结果是 2.5  
```  
  
整数相除默认还是整数结果。如果想得到小数，至少有一个参与运算的值要是小数。  
  
## 三、运算符  
  
常用运算符包括：  
  
```text  
+  -  *  /  %  
==  !=  >  <  >=  <=  
&&  ||  !  
```  
  
示例：  
  
```java  
int score = 85;  
  
if (score >= 60 && score <= 100) {  
    System.out.println("及格");  
}  
```  
  
需要掌握：  
  
- 算术运算符：`+`、`-`、`*`、`/`、`%`。  
- 比较运算符：`==`、`!=`、`>`、`<`、`>=`、`<=`。  
- 逻辑运算符：`&&`、`||`、`!`。  
- 自增自减：`i++`、`++i`、`i--`、`--i`。  
  
## 四、条件语句  
  
### if / else  
  
```java  
int age = 18;  
  
if (age >= 18) {  
    System.out.println("成年人");  
} else {  
    System.out.println("未成年人");  
}  
```  
  
### else if  
  
```java  
int score = 85;  
  
if (score >= 90) {  
    System.out.println("优秀");  
} else if (score >= 80) {  
    System.out.println("良好");  
} else if (score >= 60) {  
    System.out.println("及格");  
} else {  
    System.out.println("不及格");  
}  
```  
  
### switch  
  
```java  
int day = 1;  
  
switch (day) {  
    case 1:        System.out.println("星期一");  
        break;    case 2:        System.out.println("星期二");  
        break;    default:        System.out.println("其他");  
}  
```  
  
重点掌握：  
  
- `if`  
- `else if`  
- `else`  
- `switch`  
- `case`  
- `break`  
- `default`  
  
## 五、循环语句  
  
### for 循环  
  
```java  
for (int i = 0; i < 5; i++) {  
    System.out.println(i);}  
```  
  
适合循环次数明确的场景。  
  
### while 循环  
  
```java  
int i = 0;  
  
while (i < 5) {  
    System.out.println(i);    i++;}  
```  
  
适合循环次数不固定，但有明确条件的场景。  
  
### do while 循环  
  
```java  
int i = 0;  
  
do {  
    System.out.println(i);    i++;} while (i < 5);  
```  
  
`do while` 至少会执行一次。  
  
重点掌握：  
  
- `for`  
- `while`  
- `do while`  
- `break`  
- `continue`  
  
## 六、数组  
  
数组用于保存一组相同类型的数据。  
  
```java  
int[] nums = {1, 2, 3, 4, 5};  
  
System.out.println(nums[0]);  
System.out.println(nums.length);  
```  
  
遍历数组：  
  
```java  
for (int i = 0; i < nums.length; i++) {  
    System.out.println(nums[i]);}  
```  
  
增强 `for` 循环：  
  
```java  
for (int num : nums) {  
    System.out.println(num);}  
```  
  
重点掌握：  
  
- 数组下标从 `0` 开始。  
- 数组长度通过 `length` 获取。  
- 访问不存在的下标会出现数组越界异常。  
- 数组长度创建后不能改变。  
  
## 七、方法  
  
方法用于封装一段可以重复使用的逻辑。  
  
```java  
public static int add(int a, int b) {  
    return a + b;}  
```  
  
调用方法：  
  
```java  
int result = add(3, 5);  
System.out.println(result);  
```  
  
没有返回值的方法使用 `void`：  
  
```java  
public static void sayHello(String name) {  
    System.out.println("Hello, " + name);}  
```  
  
方法重载：  
  
```java  
public static int add(int a, int b) {  
    return a + b;}  
  
public static double add(double a, double b) {  
    return a + b;}  
```  
  
重点掌握：  
  
- 方法名。  
- 参数。  
- 返回值。  
- `return`。  
- `void`。  
- 方法重载。  
  
## 八、面向对象基础  
  
Java 是典型的面向对象语言。面向对象是 Java 的核心。  
  
### 1. 类和对象  
  
```java  
class Student {  
    String name;    int age;  
    void sayHello() {        System.out.println("你好，我是 " + name);    }}  
```  
  
使用对象：  
  
```java  
Student s = new Student();  
s.name = "Tom";  
s.age = 18;  
s.sayHello();  
```  
  
理解方式：  
  
- 类是模板。  
- 对象是根据模板创建出来的具体实例。  
- 属性描述对象的状态。  
- 方法描述对象的行为。  
  
### 2. 构造方法  
  
```java  
class Student {  
    String name;    int age;  
    Student(String name, int age) {        this.name = name;        this.age = age;    }}  
```  
  
使用：  
  
```java  
Student s = new Student("Tom", 18);  
```  
  
重点掌握：  
  
- 构造方法名必须和类名一致。  
- 构造方法没有返回值。  
- `this` 表示当前对象。  
- 创建对象时会调用构造方法。  
  
### 3. 封装  
  
封装通常会把属性设为 `private`，再通过方法访问。  
  
```java  
class Student {  
    private String name;  
    public String getName() {        return name;    }  
    public void setName(String name) {        this.name = name;    }}  
```  
  
重点掌握：  
  
- `private`：只能在本类中访问。  
- `public`：外部可以访问。  
- getter / setter。  
- 封装可以保护对象内部数据。  
  
### 4. 继承  
  
```java  
class Animal {  
    void eat() {        System.out.println("吃东西");  
    }}  
  
class Dog extends Animal {  
    void bark() {        System.out.println("汪汪");  
    }}  
```  
  
重点掌握：  
  
- `extends`。  
- 子类可以继承父类的属性和方法。  
- Java 只支持单继承。  
- 子类可以重写父类方法。  
- `super` 可以访问父类内容。  
  
### 5. 多态  
  
```java  
Animal animal = new Dog();  
animal.eat();  
```  
  
多态的核心是：父类引用指向子类对象。  
  
多态常用于：  
  
- 降低代码耦合。  
- 面向父类或接口编程。  
- 提高程序扩展性。  
  
### 6. 接口  
  
```java  
interface Flyable {  
    void fly();}  
  
class Bird implements Flyable {  
    public void fly() {        System.out.println("鸟会飞");  
    }}  
```  
  
重点掌握：  
  
- `interface`。  
- `implements`。  
- 接口定义一种能力或规范。  
- 一个类可以实现多个接口。  
  
## 九、常用类和基础库  
  
### 1. String  
  
```java  
String name = "Java";  
  
System.out.println(name.length());  
System.out.println(name.toUpperCase());  
System.out.println(name.substring(0, 2));  
```  
  
字符串比较一般用 `equals()`：  
  
```java  
String a = "hello";  
String b = "hello";  
  
System.out.println(a.equals(b));  
System.out.println(a == b);  
```  
  
`equals()` 比较内容，`==` 比较引用地址。  
  
### 2. Scanner  
  
```java  
import java.util.Scanner;  
  
Scanner scanner = new Scanner(System.in);  
  
System.out.print("请输入年龄：");  
int age = scanner.nextInt();  
  
System.out.println("你的年龄是：" + age);  
```  
  
### 3. Math  
  
```java  
System.out.println(Math.max(3, 5));  
System.out.println(Math.min(3, 5));  
System.out.println(Math.sqrt(16));  
```  
  
### 4. Random  
  
```java  
import java.util.Random;  
  
Random random = new Random();  
int number = random.nextInt(100);  
```  
  
## 十、集合  
  
数组长度固定，集合更灵活。  
  
### ArrayList  
  
```java  
import java.util.ArrayList;  
  
ArrayList<String> names = new ArrayList<>();  
  
names.add("Tom");  
names.add("Jerry");  
  
System.out.println(names.get(0));  
System.out.println(names.size());  
```  
  
### HashMap  
  
```java  
import java.util.HashMap;  
  
HashMap<String, Integer> scores = new HashMap<>();  
  
scores.put("Tom", 90);  
scores.put("Jerry", 85);  
  
System.out.println(scores.get("Tom"));  
```  
  
常见集合：  
  
- `ArrayList`：有序、可重复，查找方便。  
- `LinkedList`：链表结构，适合频繁增删。  
- `HashSet`：无序、不重复。  
- `HashMap`：键值对。  
  
## 十一、泛型  
  
泛型用于限制和说明数据类型。  
  
```java  
ArrayList<String> list = new ArrayList<>();  
```  
  
`<String>` 表示这个集合里只能放字符串。  
  
优点：  
  
- 提高类型安全。  
- 减少强制类型转换。  
- 常用于集合和工具类。  
  
## 十二、异常处理  
  
```java  
try {  
    int result = 10 / 0;} catch (ArithmeticException e) {  
    System.out.println("不能除以 0");}  
```  
  
常见结构：  
  
```java  
try {  
    // 可能出错的代码  
} catch (Exception e) {  
    // 出错后的处理  
} finally {  
    // 无论是否出错都会执行  
}  
```  
  
重点掌握：  
  
- `try`  
- `catch`  
- `finally`  
- `throw`  
- `throws`  
- 编译时异常  
- 运行时异常  
  
## 十三、包和访问修饰符  
  
包用于组织代码：  
  
```java  
package basic_types;  
  
import java.util.Scanner;  
```  
  
常见访问修饰符：  
  
- `public`：任何地方都可以访问。  
- `private`：只能在本类中访问。  
- `protected`：本包和子类可以访问。  
- 默认不写：同一个包内可以访问。  
  
## 十四、JDK、JRE、JVM  
  
需要理解 Java 的运行机制：  
  
- `JDK`：Java Development Kit，开发工具包，写 Java 需要它。  
- `JRE`：Java Runtime Environment，运行环境。  
- `JVM`：Java Virtual Machine，Java 虚拟机，负责运行字节码。  
  
Java 程序执行流程：  
  
```text  
.java 源代码 -> .class 字节码 -> JVM 运行  
```  
  
## 十五、推荐学习路线  
  
### 第一阶段：语法入门  
  
目标：能写简单控制台程序。  
  
重点：  
  
- 变量和数据类型。  
- 运算符。  
- 条件判断。  
- 循环。  
- 数组。  
- 方法。  
  
练习：  
  
- BMI 计算器。  
- 简单计算器。  
- 成绩等级判断。  
- 猜数字游戏。  
- 九九乘法表。  
- 数组求最大值、最小值和平均值。  
  
### 第二阶段：面向对象  
  
目标：理解 Java 的核心编程方式。  
  
重点：  
  
- 类和对象。  
- 构造方法。  
- `this`。  
- 封装。  
- 继承。  
- 多态。  
- 接口。  
- 抽象类。  
  
练习：  
  
- 学生类。  
- 银行账户类。  
- 图书类。  
- 宠物类。  
- 员工工资计算。  
  
### 第三阶段：常用类和集合  
  
目标：能写更实用的程序。  
  
重点：  
  
- `String`。  
- `Math`。  
- `Random`。  
- `Scanner`。  
- `ArrayList`。  
- `HashMap`。  
- 异常处理。  
  
练习：  
  
- 通讯录。  
- 商品库存管理。  
- 简单记账程序。  
- 单词计数器。  
  
### 第四阶段：文件、项目和工具  
  
目标：接近真实开发。  
  
重点：  
  
- 文件读写。  
- 包管理。  
- Maven 或 Gradle。  
- JUnit 单元测试。  
- Git 基础。  
  
练习：  
  
- 从文件读取学生成绩并统计。  
- 保存通讯录到文件。  
- 写一个命令行小项目。  
  
### 第五阶段：进阶内容  
  
基础稳了以后再学：  
  
- Lambda。  
- Stream。  
- Optional。  
- 多线程。  
- 网络编程。  
- JDBC。  
- Spring Boot。  
  
不要一开始直接学 Spring Boot。框架会隐藏很多基础细节，如果语法和面向对象没掌握，后面会很吃力。  
  
## 十六、学习方法建议  
  
### 1. 每个语法点都写一遍  
  
不要只看视频或文章。比如学 `if`，至少写这些练习：  
  
- 判断奇偶数。  
- 判断成绩等级。  
- 判断年龄阶段。  
  
### 2. 少抄大项目，多写小程序  
  
初学 Java 最有效的是大量小练习：  
  
- 输入体重和身高，计算 BMI。  
- 输入年份，判断是不是闰年。  
- 输入三个数，求最大值。  
- 输入成绩，输出等级。  
  
### 3. 学完一章就重构一次  
  
比如 BMI 程序可以这样升级：  
  
1. 直接写在 `main` 方法里。  
2. 抽成方法。  
3. 用类封装。  
4. 加输入校验。  
5. 支持多个人计算。  
  
这样比单纯刷语法更容易理解。  
  
### 4. 遇到错误要读报错  
  
常见错误包括：  
  
- 类名和文件名不一致。  
- 少写分号。  
- 大小写错误。  
- 数组越界。  
- 空指针异常。  
- 类型不匹配。  
  
### 5. 推荐学习节奏  
  
如果每天学习 1 到 2 小时，可以按这个节奏：  
  
```text  
第 1 周：变量、类型、运算符、if、switch  
第 2 周：循环、数组、方法  
第 3 周：类、对象、构造方法、封装  
第 4 周：继承、多态、接口  
第 5 周：集合、异常、字符串  
第 6 周：做一个小项目  
```  
  
## 十七、现在可以从哪里开始  
  
建议先按这个顺序学习：  
  
1. 变量和数据类型。  
2. `if` 条件判断。  
3. `for` / `while` 循环。  
4. 数组。  
5. 方法。  
6. 类和对象。  
7. 封装、继承、多态。  
8. `ArrayList` 和 `HashMap`。  
9. 异常处理。  
10. 做一个学生管理系统。  
  
当前项目里已经有 BMI 相关练习，可以继续围绕 BMI 程序做升级练习。