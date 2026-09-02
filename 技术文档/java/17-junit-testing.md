# 17 - JUnit 6（Jupiter）单元测试

> 来源：JUnit 6.1.3 官方用户指南（docs.junit.org）
> 原文：https://docs.junit.org/6.1.3/overview.html
> 版本：JUnit 6.1.3（JUnit Jupiter 已演进至 6.x）；**运行时需 Java 17+**，可测试低版本编译的代码
> 说明：官方概述页为 Antora 文档框架，web 抓取仅取得结构目录（已标注），下列注解与生命周期基于 JUnit Jupiter 标准 API 整理。

JUnit 是 Java 单元测试事实标准。Spring Boot 项目默认 `spring-boot-starter-test` 已集成。

---

## 一、组成

- **JUnit Platform**：JVM 上启动测试框架的基础（定义 TestEngine）。
- **JUnit Jupiter**：编写测试的编程模型（即 `@Test` 等注解所在模块）。
- **JUnit Vintage**：运行 JUnit 3/4 旧测试（迁移用，已废弃）。

---

## 二、测试生命周期与核心注解

```java
import org.junit.jupiter.api.*;

class CalculatorTest {

    @BeforeAll          // 静态，整个类前执行一次
    static void initAll() { }

    @BeforeEach         // 每个测试方法前执行
    void init() { }

    @Test
    @DisplayName("加法应返回两数之和")
    void testAdd() {
        Assertions.assertEquals(5, 2 + 3);
    }

    @AfterEach
    void tearDown() { }

    @AfterAll
    static void tearDownAll() { }
}
```

| 注解 | 作用 |
|---|---|
| `@Test` | 标记为测试方法 |
| `@BeforeEach` / `@AfterEach` | 每方法前后 |
| `@BeforeAll` / `@AfterAll` | 类前后（必须 `static`） |
| `@DisplayName` | 自定义显示名（报告可读） |
| `@Disabled` | 跳过该测试 |

---

## 三、断言（Assertions）

```java
import static org.junit.jupiter.api.Assertions.*;

@Test
void assertions() {
    assertEquals(4, 2 * 2);
    assertTrue(list.isEmpty());
    assertThrows(IllegalArgumentException.class, () -> method(null));
    assertNotNull(obj);
    // 分组断言
    assertAll("person",
        () -> assertEquals("John", p.name()),
        () -> assertEquals(25, p.age()));
}
```

- 常用：`assertEquals` `assertTrue` `assertThrows` `assertTimeout` `assertAll`（分组，全部执行后统一报告）。

---

## 四、嵌套测试 @Nested

```java
@Nested
class WhenEmpty {
    @Test void shouldThrow() { assertThrows(...); }
}
@Nested
class WhenNotEmpty { ... }
```

- 用内部类分组测试场景，结构清晰。

---

## 五、参数化测试 @ParameterizedTest

```java
@ParameterizedTest
@ValueSource(ints = {1, 2, 3})
void testMultiple(int n) {
    assertTrue(n > 0);
}

@ParameterizedTest
@CsvSource({"1,2,3", "4,5,9"})
void testSum(int a, int b, int expected) {
    assertEquals(expected, a + b);
}
```

- 源：`@ValueSource` `@CsvSource` `@MethodSource` `@EnumSource` 等。

---

## 六、Mockito 集成（测试替身）

> 注：官方指南不内置 Mockito，需自行引入依赖；Mockito 是 Spring 测试生态标准。

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {
    @Mock OrderRepository repo;
    @InjectMocks OrderService service;

    @Test
    void findById_returnsMapped() {
        when(repo.findById(1L)).thenReturn(new Order(1L, "x"));
        Order o = service.findById(1L);
        assertEquals("x", o.getName());
    }
}
```

- `@Mock` 创建假对象，`@InjectMocks` 注入被测类，`when(...).thenReturn(...)` 设定桩。

---

## 七、Spring Boot 测试

```java
@SpringBootTest
class DemoApplicationTests {
    @Autowired OrderService service;   // 加载完整上下文
    @Test void contextLoads() { }
}

@WebMvcTest(OrderController.class)      // 仅测 Web 层，切片测试
class OrderControllerTest {
    @Autowired MockMvc mvc;
}
```

- `@SpringBootTest`：启动完整应用上下文。
- 切片测试：`@WebMvcTest` `@DataJpaTest` `@JsonTest` 等，只加载相关部分，更快。

---

## 八、与系列其他文档的关系

- 测试对象常是 Spring Bean → `13-spring-boot.md` / `14-spring-core.md`
- 并发代码用 JUnit 测线程安全 → `15-concurrency-advanced.md`
- 对比其他语言：JUnit ≈ pytest（Python）≈ Jest（JS，见 `技术文档/react` 测试）；JUnit 注解式、`@Nested` 分组是特色。
- 推荐配合 AssertJ（流式断言）、Mockito（Mock）、Testcontainers（集成测试 DB）。
