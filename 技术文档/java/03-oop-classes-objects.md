# 03 - 面向对象：类、对象、继承、多态、接口、包

> 来源：Oracle 官方《The Java™ Tutorials》— Learning the Java Language > Classes and Objects / Interfaces / Inheritance
> 官方教程基线 JDK 8，本篇补充接口默认方法（Java 8）、密封类（Java 17）等演进。
> 原文：https://docs.oracle.com/javase/tutorial/java/javaOO/index.html

面向对象（OOP）是 Java 的核心范式：封装、继承、多态。

---

## 一、类与对象（Classes & Objects）

### 1. 类结构
```java
public class Dog {
    // 字段（成员变量）
    private String name;
    private int age;

    // 构造器
    public Dog(String name, int age) {
        this.name = name;   // this 指向当前实例
        this.age = age;
    }

    // 方法
    public void bark() { System.out.println(name + " bark"); }

    // 访问器
    public String getName() { return name; }
}
```

### 2. 创建对象
```java
Dog d = new Dog("Buddy", 3); // new 分配堆内存并调用构造器
d.bark();
```

### 3. 访问控制（Access Modifiers）
| 修饰符 | 同类 | 同包 | 子类 | 其他包 |
|---|---|---|---|---|
| `private` | ✅ | | | |
| （默认/包私有） | ✅ | ✅ | | |
| `protected` | ✅ | ✅ | ✅ | |
| `public` | ✅ | ✅ | ✅ | ✅ |

### 4. 静态成员（static）
- `static` 字段/方法属于**类**而非实例，可通过 `ClassName.x` 访问。
- 静态方法**不能**访问实例字段（无 `this`）。
- 静态初始化块：`static { ... }` 在类加载时执行一次。

### 5. 嵌套类（Nested Classes）
- **静态嵌套类**：`static class`，不持有外部引用。
- **内部类（非 static）**：可访问外部实例成员。
- **局部类 / 匿名类**：方法内或 `new X() { }` 形式（Lambda 推广后少用）。

---

## 二、继承（Inheritance）

- 使用 `extends` 继承父类，单继承（一个类只能有一个直接父类）。
- 子类继承父类的非 `private` 成员。
- `super` 调用父类构造器 / 方法。

```java
public class Animal {
    public void eat() { System.out.println("eat"); }
}
public class Cat extends Animal {
    @Override
    public void eat() { super.eat(); System.out.println("cat eats fish"); }
}
```

- `@Override` 注解：编译期校验确实重写了父类方法。
- 所有类最终都继承自 `Object`（提供 `equals`、`hashCode`、`toString`、`clone`）。

---

## 三、多态（Polymorphism）

- 子类对象可赋给父类引用：`Animal a = new Cat();`
- 运行时根据实际类型调用对应方法（**动态绑定 / 晚期绑定**）。
- 调用 `a.eat()` 实际执行 `Cat.eat()`。

```java
Animal[] zoo = { new Cat(), new Dog("Buddy", 3) };
for (Animal a : zoo) a.eat(); // 各自表现不同 -> 多态
```

---

## 四、抽象类与接口（Abstract & Interface）

### 1. 抽象类
```java
public abstract class Shape {
    public abstract double area(); // 抽象方法，无实现
    public void print() { System.out.println("shape"); }
}
```

### 2. 接口（Interface）
- 早期版本：只能有抽象方法 + 常量。
- **Java 8+**：支持 `default` 方法（有默认实现）和 `static` 方法。
- **Java 9+**：支持 `private` 方法（接口内部复用）。

```java
public interface Comparable<T> {
    int compareTo(T o);              // 抽象
    default boolean isGreater(T o) { return compareTo(o) > 0; } // 默认
}
```

- 类用 `implements` 实现接口，**可多实现**（弥补单继承）。
- 函数式接口：仅一个抽象方法的接口（如 `Runnable`、`Comparator`），可用 Lambda 简化（见 07）。

### 3. 密封类（Sealed，Java 17）
限制哪些类能继承/实现，配合模式匹配（见 `09-sealed-pattern-matching.md`）。

```java
public sealed interface Shape permits Circle, Square { }
final class Circle implements Shape { }
final class Square implements Shape { }
```

---

## 五、包（Packages）

- 用 `package com.example.demo;` 声明包，对应目录结构。
- `import` 引入其他包的类：`import java.util.List;`
- `java.lang` 自动导入（如 `String`、`Object`）。
- 包名一般用反向域名避免冲突。

---

## 六、与系列其他文档的关系

- 不可变数据载体用 Record 替代大量样板类 → `08-records.md`
- 用接口 + 模式匹配替代复杂 instanceof 链 → `09-sealed-pattern-matching.md`
- 对比 TS：Java 接口 ≈ TS `interface`，但 Java 接口可含默认实现；
  `extends`/`implements` 对应 TS 的 `extends`/`implements`；
  密封类 ≈ TS 的 `switch` + 联合类型穷尽性检查。
