# 11 - Java 8 → 21 新特性演进总览

> 来源：综合 OpenJDK JEPs 与 Oracle Java SE 文档（JDK 8 / 11 / 17 / 21 四个 LTS 为主线）
> 主要 JEP 索引：https://openjdk.org/jeps/0
> 版本基线：截至 Java 21（最新 LTS）。Java 22+ 的持续预览特性见官方 JEP 列表。

面试与实战常问「Java 新特性」。本篇按 LTS 版本梳理关键演进，对应到本目录各专题文档。

---

## 一、Java 8（2014，长期经典）

- **Lambda 表达式 + 函数式接口**（JSR 335）→ `07-lambda-functional.md`
- **Stream API** → `07-lambda-functional.md`
- **Optional** → `07-lambda-functional.md`
- **接口默认方法 / 静态方法** → `03-oop-classes-objects.md`
- **新的日期时间 API** `java.time`（LocalDate / LocalDateTime / Instant），取代 `Date`/`Calendar`
- **方法引用** `Class::method`
- **重复注解、类型注解**

> Java 8 仍是大量存量项目基线，但新项目应直接上 17/21。

---

## 二、Java 11（2018，LTS）

- **var 局部变量类型推断**（JEP 286，Java 10 引入，11 沿用）：`var list = new ArrayList<String>();`
- **标准 HTTP Client**（JEP 321，`java.net.http`，支持 HTTP/2、WebSocket，取代老旧 `HttpURLConnection`）
- **字符串新方法**：`isBlank()`、`lines()`、`strip()`、`repeat(n)`
- **单文件源码直接运行**：`java Hello.java`（无需先 `javac`）
- **移除** Java EE、CORBA 模块
- **ZGC / Epsilon GC** 实验引入（后续成熟）

---

## 三、Java 17（2021，LTS，重要分水岭）

- **密封类 Sealed Classes**（JEP 409）正式 → `09-sealed-pattern-matching.md`
- **模式匹配 instanceof**（JEP 394）正式 → `09-sealed-pattern-matching.md`
- **文本块 Text Blocks**（JEP 378）正式 → `02-language-basics.md`
- **Switch 表达式**（JEP 361）正式：`yield` / `->` 箭头
- **强封装 JDK 内部 API**（JEP 403）：`--illegal-access` 默认 deny
- **移除** Applet、实验 AOT
- **新的 macOS / Windows 渲染管线**

> 很多公司从 8 直接升级到 17，是「现代 Java」起点。

---

## 四、Java 21（2023，LTS，当前最新）

- **虚拟线程 Virtual Threads**（JEP 444）正式 GA → `10-virtual-threads.md`
- **模式匹配 switch**（JEP 441）正式 → `09-sealed-pattern-matching.md`
- **Record 模式 Record Patterns**（JEP 440）正式：switch 内解构 record → `08 / 09`
- **未命名模式与变量 `_`**（预览，JEP 443）
- **序列化集合 SequencedCollection**（JEP 431）：`first()`/`last()`/`reversed()`
- **StringTemplates**（预览）、**ScopedValue**（预览，替代 ThreadLocal）
- **分代 ZGC**（JEP 439）正式：低延迟 GC 性能更强

---

## 五、版本选择建议

| 场景 | 推荐 |
|---|---|
| 新项目 / 学习 | **Java 21**（最新 LTS，特性最全） |
| 企业存量升级 | 8 → 17 → 21 渐进 |
| 仅需稳定不需要新特性 | 17（长期支持） |
| Android | 受限于 Android 运行时，并非直接对应 OpenJDK 版本 |

---

## 六、快速对照表

| 特性 | 版本 | 对应文档 |
|---|---|---|
| Lambda / Stream / Optional | 8 | 07 |
| 日期时间 `java.time` | 8 | （标准库） |
| var 推断 | 10/11 | 02 |
| HTTP Client | 11 | （标准库） |
| 文本块 | 15 | 02 |
| Switch 表达式 | 14 | 09 |
| 模式匹配 instanceof | 16 | 09 |
| Record | 16 | 08 |
| 密封类 | 17 | 09 |
| 虚拟线程 | 21 | 10 |
| 模式匹配 switch | 21 | 09 |
| Record 模式 | 21 | 08/09 |

---

## 七、与系列其他文档的关系

- 本篇是目录 02~10 的「地图」，建议先读 `01` 入门再按编号深入。
- 对比 TS/JS：Java 8 才补上 Lambda，明显晚于 JS 闭包；但 Java 21 的虚拟线程、模式匹配已追上甚至领先主流语言。
- 对比 Go/Rust：虚拟线程对标协程（Go）、async（Rust tokio）；模式匹配对标 Rust `match`、Scala `match`。
