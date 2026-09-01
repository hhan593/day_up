# 25 - 设计模式 / 算法 / 面试题专项

> 来源：Java 官方特性 + GoF《设计模式》标准 + 面试高频考点整理
> 说明：设计模式为 GoF 经典（非 Java 官方文档），但均用 Java 代码演示；算法与面试题为通用知识，结合前 24 篇已在官网确认的内容（如 Java 21 虚拟线程、JVM ZGC）联动。
> 本文是目录收尾篇，串联全目录 01-24 的高频考点。

---

## 一、设计模式（GoF，Java 演示）

### 1. 创建型
**单例（Singleton）**——JVM 内唯一实例
```java
// 枚举单例（Josh Bloch 推荐，防反射/序列化破坏）
public enum Singleton { INSTANCE; public void doWork() {} }
// 或 DCL（双重检查锁）
class Singleton {
    private static volatile Singleton instance;
    private Singleton() {}
    public static Singleton get() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) instance = new Singleton();
            }
        }
        return instance;
    }
}
```
> `volatile` 防指令重排（见 16 JVM 内存模型）；Spring 的 `@Bean` 默认即单例（14）。

**工厂方法（Factory Method）**——子类决定实例类型
```java
interface Shape { void draw(); }
class Circle implements Shape { public void draw() { System.out.println("circle"); } }
interface ShapeFactory { Shape create(); }
class CircleFactory implements ShapeFactory { public Shape create() { return new Circle(); } }
```

**建造者（Builder）**——复杂对象分步构造（类似 Record 的紧凑构造器，见 08）
```java
public class Person {
    private Person(Builder b) { }   // 私有构造
    public static class Builder {
        private String name;
        public Builder name(String n) { this.name = n; return this; }
        public Person build() { return new Person(this); }
    }
}
Person p = new Person.Builder().name("Tom").build();
```

### 2. 结构型
**代理（Proxy）**——AOP 的底层（Spring AOP 用 JDK 动态代理/CGLIB，见 14）
```java
interface Service { void run(); }
class Real implements Service { public void run() { System.out.println("real"); } }
class Proxy implements Service {
    private final Real real = new Real();
    public void run() { System.out.println("before"); real.run(); System.out.println("after"); }
}
```
> 动态代理：`Proxy.newProxyInstance(...)` 运行时生成接口代理；与 14 篇 AOP `@Around` 原理一致。

**适配器（Adapter）**——接口转换；**装饰器（Decorator）**——动态加职责（Java I/O 的 `BufferedReader` 即装饰 `Reader`）。

### 3. 行为型
**策略（Strategy）**——可替换算法（类似 `@Qualifier` 注入不同实现，见 14）
```java
interface Discount { int calc(int price); }
class Vip implements Discount { public int calc(int p) { return p/2; } }
class Normal implements Discount { public int calc(int p) { return p; } }
```
**模板方法（Template Method）**——父类定骨架、子类填步骤
**观察者（Observer）**——Spring `ApplicationEvent` / `ApplicationListener` 发布订阅（见 13/14）

---

## 二、算法与数据结构（Java 标准库）

### 1. 集合底层（面试必考，见 05）
- **HashMap**（Java 8+）：数组 + 链表 + 红黑树；`hash & (n-1)` 定位桶；链表长度 ≥ 8 转红黑树，≤ 6 退化；容量 2 的幂便于位运算扩容。`key` 不可变（重写 `equals`+`hashCode`）。
- **ConcurrentHashMap**（见 15）：Java 8+ 用 `Node` + `CAS` + 桶级 `synchronized`，读无锁。
- **ArrayList** 数组扩容（1.5 倍）；**LinkedList** 双链表。

### 2. 排序
- `Collections.sort` / `List.sort` 用 **TimSort**（归并+插入混合）。
- 自定义：`list.sort(Comparator.comparing(User::getAge).reversed())`（见 07 Lambda）。

### 3. 常见算法套路
- 双指针、滑动窗口、哈希表计数、DFS/BFS（用 `Deque`/`Queue`，见 05）、回溯、动态规划、贪心、二分。
- 示例：两数之和（HashMap O(n)）
```java
Map<Integer,Integer> map = new HashMap<>();
for (int i=0;i<n;i++){ if(map.containsKey(target-a[i])) return new int[]{map.get(target-a[i]),i}; map.put(a[i],i);}
```

### 4. 复杂度
- HashMap 增删查平均 O(1)；红黑树 O(log n)；排序 O(n log n)；数组随机访问 O(1)。

---

## 三、JVM 与并发面试题（联动 10/15/16）

| 考点 | 要点 |
|---|---|
| 对象创建过程 | 类加载→分配内存（指针碰撞/空闲列表）→零值→构造器 |
| 双亲委派 | 类加载器自底向上委托父加载，防重复加载/核心类被篡改 |
| 垃圾回收 | 分代收集；G1（默认）/ ZGC（Java 21 分代，亚毫秒，见 16） |
| 三色标记 | 并发 GC 基础，解决漏标用写屏障 |
| 内存溢出 | 堆 OOM（`-Xmx`）、栈 SOF（递归深）、元空间 OOM |
| synchronized 锁升级 | 无锁→偏向→轻量→重量（存于对象头 Mark Word，见 15/16） |
| volatile | 可见性 + 禁止重排，不保原子（见 15） |
| 线程池参数 | core/max/队列/拒绝策略；拒绝策略：Abort/CallerRuns/Discard/DiscardOldest（见 15） |
| 虚拟线程 | Java 21（10）：M:N 调度，阻塞让出载体，`synchronized` 长临界区 pinning（见 10） |
| CompletableFuture | 异步编排，避免回调地狱（见 15） |

---

## 四、Spring / 数据库面试题（联动 13-24）

| 考点 | 要点 |
|---|---|
| IoC / DI | 控制反转 + 构造器注入（14） |
| Bean 作用域 | singleton/prototype/request/session（14） |
| AOP | 切面/切点/通知，JDK 动态代理 vs CGLIB（14） |
| **循环依赖** | Spring 用**三级缓存**解决单例 setter/字段注入循环依赖；构造器注入无法解决（报错）；`@Lazy` 可破（14） |
| 事务失效 | 自调用（同类内调 `@Transactional` 方法，代理不生效）、异常被 catch、非 public 方法（13/19） |
| JPA N+1 | 懒加载集合触发多次查询，用 `@EntityGraph`/`JOIN FETCH` 解决（19） |
| #{} vs ${} | `#{}` 预编译防注入，`${}` 字符串替换（20） |
| MyBatis 逻辑删除 | `@TableLogic`，查询自动加 `deleted=0`（21） |
| Redis 缓存问题 | 穿透/击穿/雪崩，Cache-Aside 模式（23） |
| JWT vs Session | 无状态 vs 有状态；JWT 注销需黑名单（22） |
| Kafka 消费组 | 同组均分分区、不同组全收；offset 提交（24） |

---

## 五、Java 新特性考点速记（联动 08-11）

- Record（8）：不可变数据载体，自动 equals/hashCode/toString。
- 模式匹配 switch（9）：`case Type t`、`when` 守卫、`case null`、密封类穷尽。
- 虚拟线程（10）：Java 21 并发革新。
- var（11）：局部类型推断。
- Text Blocks（11）：`"""` 多行字符串。
- 接口默认方法（3）：Java 8+。

---

## 六、面试复习路线建议

1. **基础**：02 语法 → 03 OOP → 04 异常 → 05 集合 → 06 泛型 → 07 Lambda
2. **进阶**：08 Record → 09 模式匹配 → 10 虚拟线程 → 11 新特性总览
3. **底层**：15 并发 → 16 JVM
4. **工程**：13/14 Spring → 18-20 数据库 → 21 进阶 → 22 安全 → 23 缓存 → 24 消息微服务
5. **收尾**：本篇（25）串讲 + 刷题（LeetCode Hot 100）+ 项目复盘

---

## 七、与系列其他文档的关系

- 设计模式对应 Nest 的 Provider/Module 设计（技术文档/nest）。
- 算法中的哈希/双指针是前端面试（React/Vue 岗）通用知识。
- 代理模式 = Spring AOP 底层 = Nest 拦截器理念。
- 本文是 `技术文档/java` 目录第 25 篇（收尾），与 typescript/nest/react/nextjs/vue 五个目录构成完整求职复习体系。
