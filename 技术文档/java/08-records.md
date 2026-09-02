# 08 - Record（记录类）：不可变数据载体

> 来源：Oracle 官方 Java SE 21 语言指南 — Record Classes（JEP 395）
> 原文：https://docs.oracle.com/en/java/javase/21/language/records.html
> 版本：Java 16 正式（JEP 395），本文以 Java 21 为准。

`record` 用于以极少样板代码建模**纯数据聚合（plain data aggregate）**，是天然不可变的数据载体。

---

## 一、为什么需要 Record

传统 POJO 为 `name/age` 要写字段、构造器、`getter`、`equals`、`hashCode`、`toString`，约 50 行。
Record 一行搞定：

```java
public record Rectangle(double length, double width) { }
```

等价于如下普通类（自动生成）：
```java
public final class Rectangle {
    private final double length;
    private final double width;
    public Rectangle(double length, double width) { this.length = length; this.width = width; }
    public double length() { return length; }
    public double width()  { return width; }
    // 自动生成 equals / hashCode / toString
}
```

---

## 二、组件（Components）与自动成员

`record` 头部声明的每个组件自动生成：

1. **私有 final 字段**（同类型同名）。
2. **公开访问器**（方法名与组件同名，如 `length()`，**不是 `getLength()`**）。
3. **规范构造器（canonical constructor）**：签名与头部一致。
4. **equals / hashCode**：类型相同且所有组件值相等才相等。
5. **toString**：含组件名与值的字符串，如 `Rectangle[length=4.0, width=5.0]`。

```java
Rectangle r = new Rectangle(4, 5);
System.out.println(r.length());  // 4.0
System.out.println(r);           // Rectangle[length=4.0, width=5.0]
```

---

## 三、规范构造器（校验逻辑）

### 显式规范构造器
```java
record Rectangle(double length, double width) {
    public Rectangle {
        if (length <= 0 || width <= 0)
            throw new IllegalArgumentException("边长必须为正");
    }
}
```

### 紧凑构造器（Compact Constructor）
更简洁，签名隐式，结束时自动赋值：
```java
record Rectangle(double length, double width) {
    public Rectangle {            // 无参数列表
        if (length <= 0) throw new IllegalArgumentException("长度非法");
    }
}
```

---

## 四、可显式声明的成员

- 可重写 `equals`/`hashCode`/`toString`/访问器（需保持原特征）。
- 可声明**静态字段、静态方法、静态初始化块**。
- 可声明实例方法、嵌套类/接口（含嵌套 record，隐式 static）。
- **不可**声明实例变量（非 static 字段）、实例初始化块、`native` 方法。

```java
record Range(int lo, int hi) {
    static Range of(int x) { return new Range(Math.min(x, 0), Math.max(x, 0)); }
    public int size() { return hi - lo; }   // 实例方法 OK
}
```

---

## 五、特性与限制

- 隐式 `final`，**不能被继承**。
- 组件字段全部 `final`，无 setter，天然线程安全。
- 可直接实现接口、使用泛型、加注解。
- 父类是 `java.lang.Record`，反射 `Class.isRecord()` / `getRecordComponents()` 可获取组件信息。
- 可序列化，但反序列化由组件和规范构造器主导，不能自定义 `writeObject`/`readObject`。

---

## 六、与密封类 / 模式匹配配合

```java
sealed interface Expr permits Const, Add { }
record Const(int value) implements Expr { }
record Add(Expr left, Expr right) implements Expr { }
```

> 配合模式匹配 switch 可写出极简求值器，见 `09-sealed-pattern-matching.md`。

---

## 七、与系列其他文档的关系

- 对比 TS：Record 类似 `type Point = { readonly x: number; readonly y: number }` 但更省代码；
  访问器 `length()` 而非 `getLength()`（Lombok 习惯）。
- 对比 Kotlin：`data class`；对比 C#：`record`（C# 12 也有）。
- 替代大量 DTO / 值对象样板，是 Java 现代化的重要一环 → 见 `11-new-features-java8-21.md`。
