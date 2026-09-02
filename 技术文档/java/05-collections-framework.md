# 05 - 集合框架（Collections Framework）

> 来源：Oracle 官方《The Java™ Tutorials》— Collections + dev.java（Mastering the API）
> dev.java：https://dev.java/learn/

集合框架统一了 Java 存储和操作对象组的方式，位于 `java.util` 包。

---

## 一、整体架构

```
Collection（单列）
├── List    // 有序、可重复
├── Set     // 不可重复
│   ├── HashSet
│   ├── LinkedHashSet
│   └── TreeSet（可排序）
└── Queue   // 队列
Map（双列：key -> value）
├── HashMap
├── LinkedHashMap
└── TreeMap（key 可排序）
```

- 顶层接口 `Collection`；`Map` 独立体系（不是 `Collection` 的子接口）。
- 几乎所有实现类都有对应的「线程安全」旧类（`Vector`、`Hashtable`）和并发包类（`ConcurrentHashMap`），新代码优先用 `java.util.concurrent`。

---

## 二、List

```java
List<String> list = new ArrayList<>(); // 数组实现，查快增删慢
list.add("a"); list.add("b");
list.get(0);
list.forEach(System.out::println);

LinkedList<String> ll = new LinkedList<>(); // 链表，增删快
```

- `ArrayList`：最常用，底层动态数组。
- `LinkedList`：双链表，适合频繁头尾插入。
- `Collections.sort(list)` 或 `list.sort(...)` 排序。

---

## 三、Set

```java
Set<Integer> set = new HashSet<>();   // 基于 HashMap，无序、去重
set.add(1); set.add(1);               // 第二次 add 无效
Set<Integer> tset = new TreeSet<>();  // 红黑树，自然排序
```

- 判重依据：`equals` + `hashCode`（自定义对象务必重写两者）。
- `LinkedHashSet`：保持插入顺序。

---

## 四、Map

```java
Map<String, Integer> map = new HashMap<>();
map.put("apple", 3);
map.get("apple");          // 3
map.getOrDefault("pear", 0);
map.forEach((k, v) -> System.out.println(k + "=" + v));
```

- `HashMap`：最常用，key 无序，允许 `null` key。
- `TreeMap`：key 有序（实现 `Comparable` 或传 `Comparator`）。
- `ConcurrentHashMap`：高并发场景首选。

### 遍历 Map
```java
for (Map.Entry<String, Integer> e : map.entrySet()) {
    System.out.println(e.getKey() + ":" + e.getValue());
}
```

---

## 五、Queue / Deque

```java
Queue<String> q = new LinkedList<>();
q.offer("x");      // 入队（失败返回 false 而非抛异常）
q.poll();          // 出队（空返回 null）
q.peek();          // 查看队首

Deque<String> dq = new ArrayDeque<>(); // 双端队列，可做栈
dq.push("a"); dq.pop();
```

- 优先用 `offer/poll/peek` 而非 `add/remove/element`（后者在满/空时抛异常）。

---

## 六、工具类 Collections

```java
Collections.sort(list);
Collections.reverse(list);
Collections.unmodifiableList(list);   // 返回不可变视图
List<String> fixed = List.of("a", "b"); // Java 9+ 不可变集合
```

- Java 9+ 提供 `List.of()` / `Set.of()` / `Map.of()` 创建**不可变**集合。

---

## 七、与 Stream / Lambda 配合

集合常作为 Stream 数据源（见 `07-lambda-functional.md`）：
```java
list.stream().filter(s -> s.length() > 2).toList();
```

---

## 八、与系列其他文档的关系

- 集合 + Stream 是函数式处理数据的核心 → `07-lambda-functional.md`
- 对比 TS：`List` ≈ `Array`，`Map` ≈ `Map`，`Set` ≈ `Set`；但 Java 泛型是**类型擦除**的（运行时无泛型信息）。
- 对比 Go/Python：Java 集合强类型、需指定泛型；并发用 `ConcurrentHashMap` 而非全局锁。
