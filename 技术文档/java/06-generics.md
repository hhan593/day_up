# 06 - 泛型（Generics）

> 来源：Oracle 官方《The Java™ Tutorials》— Learning the Java Language > Generics（补充 dev.java 描述）
> 官方教程基线 JDK 8；本篇以现行写法为准。

泛型让类型参数化，在编译期提供类型安全、避免强制转换。

---

## 一、为什么需要泛型

没有泛型时集合取出元素是 `Object`，需强转且易 `ClassCastException`：
```java
List list = new ArrayList();
list.add("a");
String s = (String) list.get(0); // 运行时强转，危险
```

有了泛型，编译期校验：
```java
List<String> list = new ArrayList<>();
list.add("a");
String s = list.get(0); // 无需强转
```

---

## 二、泛型类 / 接口

```java
public class Box<T> {
    private T value;
    public void set(T value) { this.value = value; }
    public T get() { return value; }
}

Box<Integer> b = new Box<>();
b.set(42);
```

- `<T>` 是类型参数，命名约定：`T` 类型、`E` 元素、`K` key、`V` value、`N` 数字。

### 泛型接口
```java
public interface Repository<T, ID> {
    T findById(ID id);
}
```

---

## 三、泛型方法

```java
public static <T> T first(List<T> list) {
    return list.isEmpty() ? null : list.get(0);
}
```

- 类型参数在返回类型前声明。

---

## 四、边界（Bounded Type Parameters）

```java
public static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) > 0 ? a : b;
}
```

- `extends` 限定上界（可多个接口用 `&`，类只能第一个）。
- 通配符：`? extends T`（上界，生产者）、`? super T`（下界，消费者）、`?`（无界）。

```java
void printList(List<? extends Number> list) { } // 可传 List<Integer>/List<Double>
void addNumbers(List<? super Integer> list) { list.add(1); }
```

> **PECS 原则**：Producer `extends`，Consumer `super`。

---

## 五、类型擦除（Type Erasure）

- Java 泛型在编译后**擦除**为原始类型（`List<String>` → `List`），运行时无泛型信息。
- 因此不能 `new T[]`、`instanceof List<String>`（只能 `instanceof List`）。
- 桥接方法（bridge method）保证多态正确。

---

## 六、与系列其他文档的关系

- 泛型是集合框架 `List<T>`、`Map<K,V>` 的基础 → `05-collections-framework.md`
- 对比 TS：`List<String>` ≈ `string[]` / `Array<string>`；但 TS 泛型保留到运行时（结构化类型），Java 是擦除式（标称类型）。
- 对比 C#：C# 泛型是**真泛型（reified）**，运行时保留类型，强于 Java 擦除。
