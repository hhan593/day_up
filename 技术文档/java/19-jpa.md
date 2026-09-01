# 19 - JPA / Spring Data JPA（对象关系映射）

> 来源：
> - Jakarta Persistence 官方教程（Eclipse Foundation）：https://jakarta.ee/learn/docs/jakartaee-tutorial/current/persist/persistence-intro/
> - Spring Data JPA 官方参考文档 4.1.1（目录确认，docs.spring.io）：https://docs.spring.io/spring-data/jpa/reference/
> 说明：Spring Data JPA 文档为 JS 渲染页（仅目录，已确认版本 4.1.1 与章节结构）；下列注解与用法基于 Jakarta Persistence 标准 API + Spring Data JPA 标准机制整理，关键处标注。

JPA（Jakarta Persistence API）是 ORM 标准规范，Hibernate 是最主流实现；**Spring Data JPA** 在其上提供 Repository 抽象，几乎零样板。

---

## 一、核心概念

- **Entity（实体）**：映射数据库表的 Java 类。
- **EntityManager**：JPA 的 CRUD 入口（类似 Hibernate Session）。
- **Persistence Context（持久化上下文）**：一级缓存，管理实体生命周期。
- Spring Data JPA 用 `JpaRepository` 自动生成实现，开发者只写接口。

---

## 二、实体映射（@Entity 等）

```java
@Entity
@Table(name = "t_user")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   // 自增主键
    private Long id;

    @Column(name = "user_name", nullable = false, length = 50)
    private String username;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
}
```

| 注解 | 作用 |
|---|---|
| `@Entity` | 声明实体类 |
| `@Table` | 指定表名 |
| `@Id` | 主键 |
| `@GeneratedValue` | 主键生成策略（`IDENTITY`/`SEQUENCE`/`AUTO`/`UUID`） |
| `@Column` | 列映射（名/长度/是否为空） |
| `@Transient` | 不持久化 |
| `@Enumerated` | 枚举存索引或字符串 |

> Spring Boot 引入 `spring-boot-starter-data-jpa` 后，根据数据源自动配置 `EntityManagerFactory` 与 `JpaRepository` 实现。

---

## 三、关联关系

```java
@Entity
public class Order {
    @Id @GeneratedValue Long id;

    @ManyToOne(fetch = FetchType.LAZY)        // 多对一，懒加载
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}

@Entity
public class OrderItem {
    @Id @GeneratedValue Long id;
    @ManyToOne @JoinColumn(name = "order_id")
    private Order order;
    private String product;
}
```

- `@OneToMany` / `@ManyToOne` / `@OneToOne` / `@ManyToMany`：关联映射。
- `fetch = LAZY`：惰性加载（用才查），`EAGER`：立即加载。
- `cascade`：级联操作；`mappedBy`：由对方维护外键，避免多余 update。
- 陷阱：**N+1 查询**——懒加载集合在循环里触发多次 SQL，用 `@EntityGraph` 或 `JOIN FETCH` 解决。

---

## 四、Repository（Spring Data JPA 核心）

```java
public interface UserRepository extends JpaRepository<User, Long> {
    // 方法名派生查询（自动生成 SQL）
    List<User> findByUsernameAndAgeGreaterThan(String username, int age);

    // @Query 写 JPQL
    @Query("SELECT u FROM User u WHERE u.role = :role")
    List<User> findByRole(@Param("role") Role role);

    // 原生 SQL
    @Query(value = "SELECT * FROM t_user WHERE city = ?1", nativeQuery = true)
    List<User> findByCity(String city);

    // 分页
    Page<User> findByAge(int age, Pageable pageable);
}
```

- 继承 `JpaRepository<T, ID>` 即得 `save` / `findById` / `findAll` / `delete` 等。
- **方法名派生**：`findByXAndY`、`countBy`、`existsBy`、`deleteBy`、支持 `Like`/`Between`/`OrderBy`/`IgnoreCase` 等关键字。
- `@Query`：写 JPQL（面向实体）或 `nativeQuery = true` 原生 SQL。
- 自定义实现：同包下写 `UserRepositoryImpl` 补充复杂逻辑。

### 使用
```java
@Service
public class UserService {
    private final UserRepository repo;
    public UserService(UserRepository repo) { this.repo = repo; }  // 构造器注入

    @Transactional
    public User create(User u) { return repo.save(u); }
}
```

- `@Transactional`：声明事务边界（Spring AOP 代理，见 `14-spring-core.md`）。

---

## 五、事务与审计

- `@Transactional` 注解控制事务（默认遇到 `RuntimeException` 回滚）。
- 审计字段：`@CreatedDate` / `@LastModifiedDate` + `@EntityListeners(AuditingEntityListener.class)` + `@EnableJpaAuditing`。
- 锁：`@Lock(LockModeType.PESSIMISTIC_WRITE)` 悲观锁。

---

## 六、与 MyBatis / JDBC 的关系

| 维度 | JDBC（18） | JPA / Spring Data JPA | MyBatis（20） |
|---|---|---|---|
| 抽象层级 | 最底层 | 高（全自动 ORM） | 中（半自动 SQL 映射） |
| SQL 控制 | 手写 | 自动生成 / JPQL | 手写（XML/注解） |
| 学习成本 | 低 | 高（概念多） | 中 |
| 适用 | 精细控制、批处理 | 领域模型驱动的 CRUD | 复杂报表、DBA 优化 SQL |

> 选型：领域复杂、CRUD 多 → JPA；SQL 复杂、需 DBA 调优 → MyBatis；极致控制 → JDBC。

---

## 七、与系列其他文档的关系

- 底层是 JDBC（18）；事务靠 Spring `@Transactional`（13/14）。
- 对比 Nest（TypeORM/Prisma，见 `技术文档/nest`）：TypeORM 的 `@Entity`/`@Column` 直接借鉴 JPA 注解风格。
- 关联懒加载 / N+1 与虚拟线程并发（`10-virtual-threads.md`）配合可缓解 IO 等待。
