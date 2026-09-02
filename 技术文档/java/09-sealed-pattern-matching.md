# 09 - 密封类 + 模式匹配（instanceof / switch）

> 来源：
> - JEP 409 Sealed Classes（Java 17）：https://openjdk.org/jeps/409
> - JEP 441 Pattern Matching for switch（Java 21）：https://openjdk.org/jeps/441
> - JEP 394 Pattern Matching for instanceof（Java 16）：https://openjdk.org/jeps/394
> 本篇按 Java 21 现行语法整理。

Java 17~21 的模式匹配 + 密封类，让类型判断与穷尽分支变得简洁安全。

---

## 一、模式匹配 instanceof（Java 16+，JEP 394）

旧写法需显式强转：
```java
if (obj instanceof String) {
    String s = (String) obj;     // 重复强转
    System.out.println(s.length());
}
```

新写法：模式变量自动绑定，**无需强转**：
```java
if (obj instanceof String s) {   // s 在 true 分支内可见
    System.out.println(s.length());
}
```

可结合 `&&`：
```java
if (obj instanceof String s && s.length() > 3) {
    System.out.println(s.toUpperCase());
}
```

---

## 二、密封类（Sealed Classes，Java 17，JEP 409）

限制哪些类/接口能继承，给「类型家族」加白名单。

```java
public sealed interface Shape permits Circle, Square, Triangle { }
final class Circle  implements Shape { }
final class Square  implements Shape { }
final class Triangle implements Shape { }
```

- 子类型必须用 `final`、`sealed` 或 `non-sealed` 三选一声明：
  - `final`：不能再被继承。
  - `sealed`：继续受限（再列 `permits`）。
  - `non-sealed`：恢复开放继承。

```java
public sealed class Expr permits Const, Add, Neg { }
final class Const implements Expr { int value; }
record Add(Expr l, Expr r) implements Expr { }   // record 隐式 final
non-sealed class Neg implements Expr { Expr e; } // 可再被继承
```

> 价值：编译器知道**所有可能子类型**，从而支持 switch 穷尽性检查（见下）。

---

## 三、模式匹配 switch（Java 21，JEP 441）

### 1. 类型模式 case
```java
static String formatter(Object obj) {
    return switch (obj) {
        case Integer i -> String.format("int %d", i);
        case Long l    -> String.format("long %d", l);
        case Double d  -> String.format("double %f", d);
        case String s  -> String.format("String %s", s);
        default        -> obj.toString();
    };
}
```

- 选择器可为任意引用类型；`case` 用**类型模式**而非 `==`。
- 取代冗长的 `if (obj instanceof X)` 链，且更易优化。

### 2. `when` 守卫（Guarded Pattern）
仅模式标签可带 `when`：
```java
static void test(String response) {
    switch (response) {
        case null -> System.out.println("null");
        case String s when s.equalsIgnoreCase("YES") -> System.out.println("got it");
        case String s when s.equalsIgnoreCase("NO")  -> System.out.println("shame");
        case String s -> System.out.println("?");
    }
}
```

### 3. `case null` 显式处理
- 旧 switch 遇 `null` 直接抛 `NullPointerException`。
- Java 21 可写 `case null`；无 `case null` 则行为与旧版一致（隐式抛 NPE）。

### 4. 穷尽性（Exhaustiveness）
- **switch 表达式**必须覆盖所有情况。
- 选择器是**密封类**时，编译器根据 `permits` 判定已穷尽，可省 `default`：
```java
static int area(Shape s) {
    return switch (s) {            // Shape 是 sealed，3 个子类都覆盖
        case Circle c  -> Math.PI * c.r() * c.r();
        case Square sq -> sq.side() * sq.side();
        case Triangle t -> 0;       // 无需 default
    };
}
```
- 枚举同理：列出全部常量即穷尽。

### 5. 支配规则（Dominance）
- 先出现且覆盖后一标签所有可能值的标签会让后者**不可达**而编译错误：
```java
switch (obj) {
    case CharSequence cs -> ...;  // 必须在 String 之前
    case String s -> ...;          // 否则 String 被 CharSequence 支配
}
```

---

## 四、与 Record 组合：极简代数数据类型

```java
sealed interface Expr permits Lit, Add, Mul { }
record Lit(int v) implements Expr { }
record Add(Expr l, Expr r) implements Expr { }
record Mul(Expr l, Expr r) implements Expr { }

static int eval(Expr e) {
    return switch (e) {
        case Lit(int v)    -> v;            // 记录模式，直接解构组件
        case Add(var l, var r) -> eval(l) + eval(r);
        case Mul(var l, var r) -> eval(l) * eval(r);
    };
}
```

- 这是 Java 21 的「记录模式（Record Patterns）」，可**解构** record 组件。

---

## 五、与系列其他文档的关系

- Record 配合本篇效果最佳 → `08-records.md`
- 对比 TS：模式匹配 switch ≈ `switch(true)` + 类型守卫，但 Java 在**编译期**保证穷尽；
  密封类 ≈ TS 的 `switch` 对联合类型的穷尽性检查（`never` 兜底）。
- 对比 Scala/Kotlin：Kotlin 的 `when`、Scala 的 `match` 早已支持，Java 21 补齐。
