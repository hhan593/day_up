# 07 - Lambda 表达式 / 函数式接口 / Stream API / Optional

> 来源：Oracle 官方 dev.java — Learn Java（Lambda Expressions、Streams、Collections）
> dev.java：https://dev.java/learn/
> 原文标注：Lambda、Stream API、Collections Framework 均为官方明确条目；Optional 与函数式接口本页未单列，本篇按 Java SE 标准 API 补充并标注。

Java 8 引入函数式编程能力，是后续 Record/模式匹配的语法基础。

---

## 一、Lambda 表达式

Lambda 是「可传递的匿名函数」，语法 `(参数) -> 表达式/语句块`。

```java
// 旧：匿名内部类
new Thread(new Runnable() {
    public void run() { System.out.println("run"); }
});

// 新：Lambda（Runnable 是函数式接口）
new Thread(() -> System.out.println("run"));
```

- 参数类型可省略（由上下文推断）。
- 单语句可省 `{}` 和 `return`；多语句需 `{}` 和显式 `return`。

```java
List<String> list = List.of("b", "a", "c");
list.sort((x, y) -> x.compareTo(y));
```

---

## 二、函数式接口（Functional Interface）

- 只有**一个抽象方法**的接口，可用 `@FunctionalInterface` 注解校验。
- 内置常见函数式接口（`java.util.function`）：

| 接口 | 签名 | 用途 |
|---|---|---|
| `Predicate<T>` | `boolean test(T)` | 断言/过滤 |
| `Function<T,R>` | `R apply(T)` | 转换 |
| `Consumer<T>` | `void accept(T)` | 消费 |
| `Supplier<T>` | `T get()` | 提供 |
| `UnaryOperator<T>` | `T apply(T)` | 一元操作 |
| `BinaryOperator<T>` | `T apply(T,T)` | 二元操作 |

```java
Predicate<String> notEmpty = s -> !s.isEmpty();
Function<String, Integer> len = String::length;
```

- 方法引用：`String::length`、`System.out::println`、`MyClass::new`。

---

## 三、Stream API

Stream 是对集合的**声明式流水线**处理，不修改源数据、可惰性求值、可并行。

```java
List<String> names = List.of("Alice", "Bob", "Charlie");
List<String> result = names.stream()
    .filter(n -> n.length() > 3)   // 中间操作
    .map(String::toUpperCase)      // 中间操作
    .sorted()                      // 中间操作
    .toList();                     // 终止操作（Java 16+ 用 toList()）
// [ALICE, CHARLIE]
```

### 常用操作
- **中间操作**（返回 Stream，惰性）：`filter`、`map`、`flatMap`、`distinct`、`sorted`、`limit`、`skip`、`peek`。
- **终止操作**（触发计算）：`collect`、`toList`、`count`、`forEach`、`reduce`、`anyMatch`、`findFirst`、`min`、`max`。

### 收集（collect）
```java
Map<Integer, List<String>> byLen =
    names.stream().collect(Collectors.groupingBy(String::length));
```

### 并行流
```java
long count = list.parallelStream().filter(s -> s.length() > 2).count();
```

> 并行流适合 CPU 密集型大数据；IO 密集型请用虚拟线程（见 `10-virtual-threads.md`）。

---

## 四、Optional（避免 NullPointerException）

`Optional<T>` 是可能为空的容器，强制调用方显式处理「无值」。

```java
Optional<String> opt = Optional.ofNullable(getName());
opt.ifPresent(System.out::println);          // 有值才执行
String name = opt.orElse("default");          // 无值给默认
String n2 = opt.orElseThrow();                // 无值抛 NoSuchElementException
String upper = opt.map(String::toUpperCase).orElse("");
```

- 不要用 `Optional.get()` 不判空（会抛异常）。
- 适合作为方法返回值表达「可能无结果」；**不要**用作字段/方法参数（过度设计）。

---

## 五、与系列其他文档的关系

- Stream 操作集合 → `05-collections-framework.md`
- Lambda 配合同步代码可简化为虚拟线程 → `10-virtual-threads.md`
- 对比 TS：`stream().filter().map()` ≈ `arr.filter().map()`；但 Java Stream 是**一次性、不可复用**的，TS 数组方法返回新数组可链式多次。
- 对比 JS 的 `Optional`/`?.`：Java 用类型包装强制处理空，TS 用 `?.` 和 `??` 短路。
