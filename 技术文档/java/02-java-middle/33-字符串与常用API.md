# 33 - 字符串与常用 API（String / Object / 时间 / 枚举 / 正则）

> 来源：Oracle《The Java™ Tutorials》— Numbers and Strings、Date and Time、Enum Types、Regular Expressions；Java SE 21 API Specification（`java.lang`、`java.time`、`java.util.regex`）
> 官方：https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html 、https://docs.oracle.com/javase/tutorial/java/data/whendateis.html
> 补充：JEP 394/359（字符串模式匹配与文本块）取自 OpenJDK JEP 列表；JDK 常量池/包装类缓存边界以 HotSpot 实现与 JLS 5.1.7 为准。
本篇系统补齐 String、Object 方法、包装类、日期时间、枚举、正则这些「天天用却没细想」的 API 底层原理——列出的几乎每个点都是笔试选择题陷阱与面试高频追问。

---
## 一、String 不可变性
JDK 9 起 `String` 内部不再是 `char[]`，而是 **`byte[]` + `byte coder`**（compact strings）：全部字符落在 Latin-1 内则 `coder=LATIN1`（1 字节/字符），否则 `UTF16`（2 字节/字符）；JDK 8 及以前一律 `char[]`。类是 `final`、字段 `private final`、数组引用从不外泄，所有「修改」方法都返回新对象。不可变换来三件事：**跨线程共享安全**、**字面量可进常量池复用**、**hashCode 算一次即缓存**。
```java
String s = "abc";
System.out.println(s.substring(0, s.length()) == s); // true
System.out.println(s.concat("") == s);               // true
```
> 解释：`substring` 覆盖整串、`concat` 追加空串时直接返回 `this` 而非拷贝——若字符串可变这就是事故，正因不可变才敢放心共享。
> 注意：JDK 8 时代可用反射改 String 内部数组「原地变身」，后果是**污染字符串常量池**（所有持有同一字面量的人看到被改后的值）。JDK 9+ 外部已无法触及内部数组，该手段彻底失效。

---
## 二、字符串常量池与 intern()（最高频）
**字面量 `"abc"` 进常量池；`new String("abc")` 在堆上创建对象**：池中已有 `"abc"` 则只建 1 个，池中没有则先把字面量入池再 new，共 2 个。**JDK 7 起字符串池从永久代（PermGen）移入堆**（常考历史点）——JDK 6 及以前 `intern()` 把字符**复制**进永久代，JDK 7+ 直接把堆上已有对象的**引用**记入池中，于是同一道题两个 JDK 版本答案相反。
```java
String s = new String("ab") + new String("c"); // 堆对象 "abc"，池中还没有 "abc"
System.out.println(s == s.intern());           // JDK 7+ true；JDK 6 false
// intern() 把 s 这个堆引用直接放入池中，池里存的就是 s 本身
String s1 = "ab";
String s2 = "a" + "b";                         // 编译期常量折叠为 "ab"
System.out.println(s1 == s2);                  // true
final String a = "a";
System.out.println((a + "b") == "ab");         // true：final 局部变量 + 字面量仍是编译期常量
String b = "b";
System.out.println(("a" + b) == "ab");         // false：运行期拼接，堆上新对象，不在池中
```
| 是否进池 | 场景 |
|---|---|
| 进池 | 字面量、文本块；编译期常量折叠表达式（`"a"+"b"`、`final` 常量参与）；显式 `intern()` |
| **不进池** | 运行期拼接（`new String()`、非 final 变量参与）、`substring`/`replace` 等新结果 |

---
## 三、编译期常量折叠与 `+` 的运行期实现
- `javac` 把**纯字面量/编译期常量**的 `+` 折叠成一个字面量（见上节），零运行期开销。
- 运行期 `+` 自 JDK 9（**JEP 280**）不再机械翻译成 `StringBuilder.append`，而是 `invokedynamic` + `StringConcatFactory`，拼接策略运行期决定，多数场景自动优于手写。
- 循环里 `str += x` 的本质没变：**每轮迭代一次新串拷贝**，第 i 轮复制前 i 个字符 → 总拷贝量 O(n²)。
```java
for (int i = 0; i < n; i++) str += arr[i];        // O(n²)：每轮一个临时 String
StringBuilder sb = new StringBuilder(totalLen);   // 已知总长则预分配
for (String x : arr) sb.append(x);                // O(n)
```
| 循环 1 万次拼接 | `str += x` | StringBuilder（预分配） |
|---|---|---|
| 复杂度 / 临时对象 | O(n²)，每轮 1 个 String + 全量拷贝 | O(n)，仅扩容时 |
| 相对耗时 | 约慢两个数量级 | 基准 |

---
## 四、StringBuilder / StringBuffer
- **唯一区别：`StringBuffer` 的公共修改方法都加 `synchronized`**（JDK 1.0 遗留）。单线程一律 `StringBuilder`；局部变量本就栈封闭，无需同步。
- 常用 API：`append` / `insert` / `delete` / `reverse` / `indexOf` / `ensureCapacity`。
- **扩容常考点**：`new StringBuilder()` 默认 `capacity = 16`；不够时扩到 **`旧 capacity * 2 + 2`**（源码 `(capacity << 1) + 2`），若还不够则一步扩到所需长度。
- 已知总长就 `new StringBuilder(len)` 预分配，省掉多次「扩容 + 全量拷贝」。
- `toString()` 会**拷贝一次内部数组**（JDK 9 起从 `byte[]` 新建 String，不与 sb 共享），之后改 sb 不影响已生成的 String。

---
## 五、char、码点与编码（很新的考题）
`char` 是 **UTF-16 码元（code unit）**，不是「一个字符」：U+10000 以上的**增补字符**（绝大多数 emoji）由一对代理（surrogate pair）占据 **2 个 char**。
```java
String s = "😀a";  // 😀 = U+1F600，1 个码点 = 2 个 UTF-16 码元
System.out.println(s.length());                      // 3 ← 不是 2！
System.out.println(s.codePointCount(0, s.length())); // 2 ← 人意义上的「字符数」
System.out.println(Character.charCount(s.codePointAt(0))); // 2：该码点占 2 个 char
```
- 按字符遍历用 `s.codePoints()`（IntStream；BMP 内可用 `chars()`），别用 `charAt` 逐位循环截断 emoji。
- `String.getBytes()` 不传字符集时依赖平台默认编码 → 跨平台乱码（详见 `32-IO与NIO.md`）；**JDK 18（JEP 400）把默认字符集定为 UTF-8**，此坑被削弱，但显式 `getBytes(StandardCharsets.UTF_8)` 仍是铁律。

---
## 六、Object 的 5 个必讲方法
### 1. equals：契约与手写规范实现
契约：自反、**对称**、传递、一致、`x.equals(null)` 恒为 false；「子类新增字段」最容易破坏对称性。
```java
@Override public boolean equals(Object o) {
    if (this == o) return true;                                   // 引用快路径
    if (o == null || getClass() != o.getClass()) return false;    // 比运行时 class，保对称
    User user = (User) o;
    return age == user.age && Objects.equals(name, user.name);    // 字段判等交给 Objects.equals 防 NPE
}
```
`String.equals` 正是这套流程：先比引用、再比 class、最后逐字节比较。业务代码优先 IDE 生成 + `Objects.equals`，不要手搓。
### 2. hashCode：不一起重写就是事故
契约：**equals 相等 ⇒ hashCode 必须相等**（反之不强制）。只改 equals 会让哈希容器失效：
```java
Set<User> set = new HashSet<>();
set.add(new User("Tom", 1));
set.contains(new User("Tom", 1)); // false！默认 hashCode 不同 → 定位到别的桶，equals 根本没执行
```
乘子选 **31** 的一句话：奇素数碰撞分布好、`31*x` 被 JIT 优化成 `(x<<5)-x`、数值小不易过早溢出。（桶定位全流程见 `36-集合底层源码剖析.md`。）
### 3. toString / 4. getClass / 5. clone
- **toString**：默认返回 `类名@hashCode十六进制`；不重写时日志与异常信息全是无定位价值的「天书」。`record` 自动生成可读 toString（见 `08-Record记录类.md`）。
- **getClass**：`public final native Class<?> getClass()`，**final 不可重写**，equals 比类型靠它；但业务判类型优先 `instanceof` 模式匹配——`getClass()` 对子类实例判否。
- **clone**：`Object.clone()` 是**浅拷贝**（引用字段只拷引用）。设计缺陷三连：`Cloneable` 是零方法的标记接口；`clone()` 是 protected，实现接口也拿不到公共访问；**绕过构造器**（校验逻辑、final 字段登记全被跳过）。生产代码用**拷贝构造器** `new User(other)` 或序列化深拷贝替代。

---
## 七、包装类与缓存
| 基本类型 | 包装类 | 默认值 | `X.SIZE`（位） | 缓存 |
|---|---|---|---|---|
| byte | Byte | `(byte)0` | 8 | -128~127 |
| short | Short | `(short)0` | 16 | -128~127 |
| int | Integer | `0` | 32 | **-128~127**（`IntegerCache`） |
| long | Long | `0L` | 64 | -128~127 |
| float | Float | `0f` | 32 | **无缓存** |
| double | Double | `0d` | 64 | **无缓存** |
| char | Character | `'\u0000'` | 16 | 0~127 |
| boolean | Boolean | `false` | — | 静态实例 TRUE/FALSE |
装箱走 `valueOf`（`new Integer(...)` 自 JDK 9 废弃删除，别再用）；`Integer` 缓存上界可用 `-Djava.lang.Integer.IntegerCache.High=1000`（或 `-XX:AutoBoxCacheMax`）调整，但笔试按 -128~127 答。
```java
Integer a = 127, b = 127, c = 128, d = 128;
System.out.println(a == b);  // true：命中 IntegerCache 同一实例
System.out.println(c == d);  // false：超出缓存各自 new。包装类比较一律用 equals
Integer x = null;
int y = x;                     // 事故 1：直接拆箱 → NPE
boolean flag = false;
Integer r = flag ? 1 : x;      // 事故 2：三元一个分支是 int 字面量 → NPE
```
事故 2 机制（JLS 15.25）：`int` 与 `Integer` 混排时按二元数值提升把表达式结果定为 `int` → **`Integer` 那侧被强制拆箱**，`x` 为 null 即炸。
> 注意：触发条件是「一原始一包装混用」；若两边都是 `Integer` 则走引用条件表达式，不拆箱、不 NPE。

---
## 八、数字与 Math
```java
Math.addExact(Integer.MAX_VALUE, 1);    // 抛 ArithmeticException；普通 + 静默溢出回绕
Integer.compare(a, b)                   // 替代 a - b：减法在极端值下溢出，Comparator 排序直接错乱
System.out.println(-7 % 3);             // -1：% 结果符号跟随被除数
System.out.println(Math.floorMod(-7, 3)); // 2：数学取模，正模数下结果恒非负（分桶/环形下标用它）
System.out.println(Math.round(-2.5));   // -2：实现是 floor(x + 0.5)，等于向正无穷方向舍入
```
**BigDecimal 三条军规**：
1. 永不用 `new BigDecimal(double)`：`new BigDecimal(0.1)` 实际存的是 `0.1000000000000000055511151231257827021181583404541015625`（double 本就存不下 0.1）。用 `new BigDecimal("0.1")` 或 `BigDecimal.valueOf(0.1)`（内部走 `Double.toString`）。
2. **比较用 `compareTo` 不用 `equals`**：`new BigDecimal("1.0").equals(new BigDecimal("1.00"))` 为 **false**（equals 连 scale 一起比），`compareTo` 返回 0。
3. 除不尽必须给精度与舍入：`a.divide(b)` 遇到 1/3 直接抛 `ArithmeticException`，写 `a.divide(b, 6, RoundingMode.HALF_UP)`。
随机数：单线程 `Random`；多线程 `ThreadLocalRandom.current()`（避免 CAS 竞争同一 seed）；令牌/验证码等安全场景 `SecureRandom`（密码学强度，开销大）。

---
## 九、日期时间：java.time（JSR-310）
| 类型 | 职责 | 一行示例 |
|---|---|---|
| LocalDate / LocalTime / LocalDateTime | 无时区的日期 / 时间 / 日期+时间 | `LocalDate.of(2026, 9, 4)` |
| ZoneId / ZonedDateTime | 时区 / 带时区与规则的时间 | `now().atZone(ZoneId.of("Asia/Shanghai"))` |
| Instant | UTC 时间轴上的机器时刻 | `Instant.now()` |
| Duration / Period | 时间量 / 日期量 | `Duration.ofHours(8)`、`Period.between(d1, d2)` |
**为什么整套替换旧 API**：`Date`/`Calendar` 可变、month 从 0 数、year 从 1900 算；`SimpleDateFormat` **非线程安全**——内部共享一个可变 `Calendar`，作为静态字段多线程共用时解析报错甚至返回错误日期，是真实生产事故。`DateTimeFormatter` 不可变、线程安全，可声明为 static final。
```java
// 正例：存储与服务器逻辑统一 UTC（Instant），只在展示边界转用户时区
Instant stored = Instant.parse("2026-09-04T08:00:00Z");               // 来自 DB 的 TIMESTAMP
ZonedDateTime userTime = stored.atZone(ZoneId.of("America/New_York")); // Instant 无时区，必须 atZone
userTime.format(DateTimeFormatter.ISO_ZONED_DATE_TIME);               // 2026-09-04T04:00-04:00[America/New_York]
```
新旧互转：`date.toInstant()` / `Date.from(instant)`；JDBC 边界 `java.sql.Timestamp.from(instant)` / `ts.toInstant()`（与 `18-JDBC数据库编程.md` 呼应）。

---
## 十、枚举（enum）
枚举本质是 javac 生成的 **`extends java.lang.Enum` 的 final 类**，构造器隐式 private、每个常量一个静态实例；默认获得 `values()` / `valueOf(name)` / `ordinal()` / `name()` / `compareTo()`。
```java
public enum OrderStatus {
    PAID    { public String next() { return "SHIPPED"; } },
    SHIPPED { public String next() { return "DONE"; } },
    DONE    { public String next() { throw new IllegalStateException("终态不可推进"); } };
    private final int weight;                       // 实例字段：带状态的枚举
    OrderStatus() { this.weight = ordinal(); }      // 构造器仅在类加载时为每个常量执行一次
    public abstract String next();                  // 常量特定方法体（零 if 的策略模式）
}
```
- **单例的最佳实现 = 枚举**：反射破坏不了（对枚举调 `Constructor.newInstance` 直接抛 `InstantiationException`），序列化天然安全（Enum 内置按 name 还原，无需自写 `readResolve`）——详见 `25-设计模式与面试专项.md`。
- `switch` 枚举：老写法编译成合成数组 + `ordinal` 跳表，新增常量不会提醒漏分支；Java 21 模式匹配 switch 可写 `case PAID, SHIPPED ->` 并由编译器强制穷尽（呼应 `09-密封类与模式匹配.md`）。
- `EnumSet` 内部是一个 `long` 位向量、`EnumMap` 是以 ordinal 为下标的数组——性能远超 `HashSet`/`HashMap`，按枚举分桶优先用它们。

---
## 十一、正则：Pattern / Matcher（matches 全匹配 vs find 部分匹配）
**新手第一坑：`matches()` 要求整串匹配，`find()` 才是部分匹配。**
```java
"abc123".matches("\\d+");              // false：不是整串数字
Pattern p = Pattern.compile("\\d+");   // 编译一次、static final 复用；Pattern 线程安全，Matcher 不是
p.matcher("abc123").find();            // true：子串里有数字
Matcher m = p.matcher("a1b22");
while (m.find()) m.group();            // 依次 "1"、"22"；命名组用 group("year") 取值
```
| 元字符 | 含义 | 元字符 | 含义 |
|---|---|---|---|
| `\d` `\w` `\s` | 数字 / 单词字符 / 空白 | `.` | 除换行外任意字符 |
| `*` `+` `?` | ≥0 / ≥1 / 0或1，**默认贪婪** | `*?` `+?` `??` | 懒惰量词（尽量少匹配） |
| `{n,m}` | 出现 n~m 次 | `[^abc]` | 字符类取反 |
| `(abc)` 捕获组 → `group(1)` | 编号引用 | `(?:ab)` / `(?<y>19\d{2})` | 非捕获组 / 命名组 → `group("y")` |
- 便捷入口：`String.matches` / `replaceAll` / `replaceFirst` / `split`；高频路径必须缓存 `Pattern`，别每次隐式重编译。
- `split` 按**正则**执行（按小数点切要 `split("\\.")`）；默认**丢弃尾部空串**，`split(",", -1)` 保留。
- 校验示例：手机号 `1[3-9]\d{9}`、邮箱（简化）`[\w.+-]+@[\w-]+\.[\w.]+`，用 `matches()`（自带整串锚定），别用 `find()` 当校验。
> 注意（ReDoS）：嵌套量词如 `(a+)+`、`(a|aa)*` 面对「差一点就匹配」的输入会灾难性回溯、耗时指数爆炸，是真实线上漏洞类别；用户输入上的正则禁止嵌套量词，或用占有量词 `(?>...)`。

---
## 十二、其他高频工具速查
| API | 一句话要点 |
|---|---|
| `Objects.equals / hash / requireNonNull` | null 安全比较、多字段组合 hashCode、参数快速失败（fail-fast） |
| `Optional` | 容器语义替代 null 返回，用法详见 `07-Lambda与函数式编程.md` |
| `Arrays.toString / deepEquals / sort` | 对象数组 `equals` 只比元素，嵌套必须 `deepEquals`；基础类型 sort 为双轴快排（见 `01-java_base/09-进阶数组.md`） |
| `Collections.unmodifiableList / sort` | 只读是**视图**不是拷贝，源列表变了「不可变列表」跟着变（配合 `05-集合框架.md`） |
| `System.arraycopy` vs `Arrays.copyOf` | 前者 native、真正底层；后者 = 算长度 + new 数组 + arraycopy 的封装 |
| `UUID.randomUUID()` | v4 128 位随机 ID；无序，不适合直接当 InnoDB 聚簇主键 |
| `Base64.getEncoder().encodeToString(bytes)` | JDK 8+ 自带；MIME 换行变体用 `getMimeEncoder()` |
| `String.join` / `StringJoiner` | 定界符拼接；`StringJoiner` 额外支持前后缀与空值默认 |
| `BitSet` | 位集合，ordinal 密集的去重/统计极省内存 |
| `Locale` / `MessageFormat` | 国际化：`MessageFormat.format("共 {0} 项，计 {1,number,currency}", n, sum)` |

---
## 十三、与系列其他文档的关系
- `36-集合底层源码剖析.md`：第六节 hashCode 契约在 HashMap 桶定位/扩容中的完整作用链。
- `05-集合框架.md`：`Collections` 工具与只读视图的使用场景。
- `01-java_base/02-Java基础概念.md`、`01-java_base/03-运算符.md`：字面量与运算符的基础用法；本篇补齐其底层机制（常量池、拆箱、数值提升、`+` 的 JEP 280 实现）。
- `08-Record记录类.md`：record 自动生成 equals/hashCode/toString，正是第六节样板痛点的现代解法。
- `09-密封类与模式匹配.md`：枚举 + switch 穷尽检查与 Java 21 模式匹配的延伸。
- `18-JDBC数据库编程.md`：`java.sql.Timestamp` 与数据库时间类型的映射。
- `25-设计模式与面试专项.md`：枚举单例、原型模式（clone 的替代品）。
- `32-IO与NIO.md`：字符集、编码与字节流的完整讨论。
