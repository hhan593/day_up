# 21 - Spring Data JPA / MyBatis-Plus 进阶

> 来源：
> - Spring Data JPA 官方文档 4.1.1（docs.spring.io，JS 渲染页，已确认版本与章节：分页 / 审计 / 多数据源）
> - MyBatis-Plus 官方文档（baomidou.com）：分页插件、逻辑删除、多数据源（标准特性整理）
> 说明：Spring 官方页为 JS 渲染，仅取得章节目录；下列 API 基于官方文档结构与标准实现整理，并标注可信度。

本篇覆盖持久层进阶四大主题：**分页、审计、逻辑删除、多数据源**，并对比 JPA 与 MyBatis-Plus 两套方案。

---

## 一、分页（Pagination）

### 1. Spring Data JPA —— Pageable
```java
// Repository 直接返回 Page / Slice
Page<User> findByAge(int age, Pageable pageable);
Page<User> findAll(Pageable pageable);

// 调用：第 0 页、每页 10 条，按 id 降序
Pageable pageable = PageRequest.of(0, 10, Sort.by("id").descending());
Page<User> page = repo.findAll(pageable);

page.getTotalElements();   // 总记录数
page.getTotalPages();      // 总页数
page.getContent();         // 当前页数据
page.hasNext();            // 是否还有下一页
```

- `Pageable` / `PageRequest` 是 JPA 标准分页抽象，自动生成 `COUNT` + `LIMIT/OFFSET` SQL。
- `Slice` 不含总数（适合无限滚动，省一次 COUNT）。

### 2. MyBatis-Plus —— 分页插件
```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor interceptor() {
        MybatisPlusInterceptor i = new MybatisPlusInterceptor();
        i.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return i;
    }
}

// 使用
Page<User> page = new Page<>(1, 10);          // 第 1 页，10 条
Page<User> result = userMapper.selectPage(page, null);
result.getRecords(); result.getTotal(); result.getPages();
```

- 需注册 `PaginationInnerInterceptor` 分页插件（MyBatis-Plus 3.4+ 用 `MybatisPlusInterceptor` 组合插件）。

---

## 二、审计（Auditing）

自动填充创建/修改时间、操作人，避免手写。

### JPA 审计
```java
@Entity
@EntityListeners(AuditingEntityListener.class)   // 启用监听
public class Article {
    @CreatedDate  private LocalDateTime createdAt;   // 自动填充创建时间
    @LastModifiedDate private LocalDateTime updatedAt;
    @CreatedBy   private String createdBy;           // 创建人
    @LastModifiedBy private String updatedBy;
}

@Configuration
@EnableJpaAuditing                 // 启动类或配置类开启
public class AuditConfig {
    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> Optional.of(SecurityContextHolder.getContext()
            .getAuthentication().getName());   // 从安全上下文取当前用户
    }
}
```

- 注解：`@CreatedDate` / `@LastModifiedDate` / `@CreatedBy` / `@LastModifiedBy`。
- 必须 `@EnableJpaAuditing` + 提供 `AuditorAware`（告诉框架当前是谁）。

### MyBatis-Plus 自动填充（MetaObjectHandler）
```java
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {
    @Override public void insertFill(MetaObject mo) {
        strictInsertFill(mo, "createdAt", LocalDateTime.class, LocalDateTime.now(), true);
    }
    @Override public void updateFill(MetaObject mo) {
        strictUpdateFill(mo, "updatedAt", LocalDateTime.class, LocalDateTime.now(), true);
    }
}
// 字段加 @TableField(fill = FieldFill.INSERT) / FieldFill.INSERT_UPDATE
```

---

## 三、逻辑删除（Logic Delete）

不真删，用字段标记（如 `deleted` 0/1）。

### MyBatis-Plus 逻辑删除（最成熟）
```java
@TableLogic
private Integer deleted;     // 0 未删 1 已删

// 配置（全局，或字段注解指定）
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
```

- `userMapper.deleteById(1)` 实际执行 `UPDATE ... SET deleted=1`。
- 查询自动加 `WHERE deleted=0`，对业务透明。
- 也可 `@TableLogic(value="0", delval="1")` 局部覆盖。

### JPA 实现逻辑删除
- JPA 无内置注解，常用方案：
  1. `@SQLDelete("UPDATE t SET deleted=1 WHERE id=?")` + `@Where(clause="deleted=0")` 自定义。
  2. 用 Hibernate `@Filter` 全局过滤。
  3. 或引入扩展（如 `hibernate-envers` 审计、或自定义 Repository）。

> 结论：逻辑删除 MyBatis-Plus 开箱即用；JPA 需手动配 `@SQLDelete`+`@Where`（Hibernate 提供）。

---

## 四、多数据源（Multiple DataSources）

### MyBatis-Plus 多数据源（dynamic-datasource 插件，最常用）
```yaml
spring:
  datasource:
    dynamic:
      primary: master
      datasource:
        master: { url: jdbc:mysql://m/db1, username: ..., password: ... }
        slave:  { url: jdbc:mysql://s/db2, username: ..., password: ... }
```
```java
@DS("slave")                       // 注解切换数据源
public List<User> listFromSlave() { return userMapper.selectList(null); }
```

### JPA 多数据源
- 配多个 `DataSource` + `EntityManagerFactory` + `TransactionManager`，用 `@Qualifier` 区分，按包划分（`@EnableJpaRepositories(basePackages=..., entityManagerFactoryRef=...)`）。
- 比 MyBatis-Plus 繁琐，通常建议主库 JPA、其余库用 JDBC/MyBatis。

---

## 五、对比小结

| 主题 | Spring Data JPA | MyBatis-Plus |
|---|---|---|
| 分页 | `Pageable`/`Page`（内置） | 分页插件 + `Page` |
| 审计 | `@CreatedDate`+`AuditorAware`（强） | `MetaObjectHandler`（手动填充） |
| 逻辑删除 | 需 `@SQLDelete`+`@Where` | `@TableLogic`（开箱即用） |
| 多数据源 | 配置繁琐 | `@DS` 注解（最简单） |

> 选型：快速 CRUD + 审计 + 逻辑删除一条龙 → MyBatis-Plus 更省事；领域模型驱动 + 强类型查询 → JPA。两者可共存（多模块）。

---

## 六、与系列其他文档的关系

- 基础：JDBC（18）/ JPA（19）/ MyBatis（20）。
- 审计依赖安全上下文 → `22-spring-security.md`。
- 多数据源常配读写分离，与缓存（23）、消息队列（24）配合。
- 对比 Nest（TypeORM，见 `技术文档/nest`）：TypeORM 的 `@CreateDateColumn` 等价于 JPA 审计；Nest 无内置逻辑删除注解。
