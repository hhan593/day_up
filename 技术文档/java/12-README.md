# Java 技术文档索引（README）

> 目录：D:\offer\技术文档\java
> 风格：与 `技术文档/` 下 typescript / nest / react / nextjs / vue 一致——**编号 + 官网权威来源**
> 内容来源：Oracle 官方《The Java™ Tutorials》、Java SE 21 语言指南、OpenJDK JEP 系列（394/395/409/441/444）

---

## 阅读顺序（编号即推荐顺序）

| 编号 | 文件 | 主题 | 官方来源 |
|---|---|---|---|
| 01 | `Java基础语法与学习路线.md` | 基础语法与学习路线（已有） | 综合 |
| 02 | `language-basics.md` | 变量 / 8 种基本类型 / 运算符 / 控制流 / 数组 | The Java Tutorials — Language Basics |
| 03 | `oop-classes-objects.md` | 类 / 对象 / 继承 / 多态 / 接口 / 包 | The Java Tutorials — Classes and Objects |
| 04 | `exceptions.md` | 异常体系 / try-catch / try-with-resources | The Java Tutorials — Exceptions |
| 05 | `collections-framework.md` | List / Set / Map / Queue | dev.java — Collections |
| 06 | `generics.md` | 泛型类 / 方法 / 通配符 / 类型擦除 | The Java Tutorials — Generics |
| 07 | `lambda-functional.md` | Lambda / 函数式接口 / Stream / Optional | dev.java — Learn Java |
| 08 | `records.md` | Record 记录类（不可变数据载体） | Oracle SE 21 — Record Classes (JEP 395) |
| 09 | `sealed-pattern-matching.md` | 密封类 + instanceof/switch 模式匹配 | JEP 409 / 441 / 394 |
| 10 | `virtual-threads.md` | 虚拟线程（Java 21 并发革新） | JEP 444 |
| 11 | `new-features-java8-21.md` | Java 8→21 新特性演进总览 | OpenJDK JEPs |
| 12 | `README.md` | 索引（本文件） | — |

---

## 内容特点

1. **权威来源**：每篇标注具体官方 URL 与版本（JDK 8 教程基线 / Java SE 21 / JEP 编号）。
2. **版本演进清晰**：传统教程易混淆的点（如 `switch` 旧写法 vs 模式匹配、`instanceof` 强转 vs 模式变量）均对比说明。
3. **Java 21 现代特性齐全**：Record、Sealed、模式匹配 switch、虚拟线程均独立成篇，且互相引用（Record+Sealed+模式匹配组合威力最大）。
4. **完整可运行代码**：每篇给真实片段（如 Record 校验构造器、虚拟线程 ExecutorService、模式匹配求值器）。
5. **跨语言衔接**：与 `react`（类型守卫对比）、`typescript`（联合类型穷尽）、`nest`（异常过滤器对比）、`vue`、Go/Rust/Kotlin 均建立对照，降低理解成本。
6. **诚实标注**：Oracle 文档页需 JS 渲染、web_fetch 无法取正文的部分（如 sealed-classes 指南页），以 JEP 摘要 + 标准补充标注，不冒充原文。

---

## 与系列其他目录的关系

- `技术文档/typescript`（01-16）、`nest`（01-09）、`react`（01-16）、`nextjs`（01-16）、`vue`（01-13）
- Java 作为后端主力语言，与 `nest`（Node 后端）、`nextjs`（全栈）可对照：Nest 用 TS 装饰器，Java 用注解 + Spring；两者都有 DI、拦截器、异常处理体系。
- 面试题联动：Java 21 虚拟线程、Record、模式匹配是高频新考点，建议结合 `11-new-features-java8-21.md` 复习。

---

## 补充建议（未覆盖主题）

本目录侧重语言核心；如需继续补充，建议下一批：
- **Spring Boot / Spring Framework**：依赖注入、AOP、自动配置（企业最常用）
- **JDBC / JPA / MyBatis**：数据库访问
- **并发进阶**：`synchronized` / `Lock` / `ConcurrentHashMap` / `CompletableFuture`
- **JVM 与内存模型**：GC、堆/栈、字节码、调优
- **单元测试**：JUnit 5 / Mockito

> 如需我继续补充上述任一主题（同样从官方文档取最新 API），告知即可。
