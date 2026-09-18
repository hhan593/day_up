# 20 - MyBatis（半自动 SQL 映射框架）

> 来源：MyBatis 3 官方中文文档（mybatis.org/zh_CN）
> 原文：
> - XML 映射器：https://mybatis.org/mybatis-3/zh_CN/sqlmap-xml.html
> - 动态 SQL：https://mybatis.org/mybatis-3/zh_CN/dynamic-sql.html
> 版本：MyBatis 3.5.19（文档更新 2025-01-02，© MyBatis.org）
> 说明：上述两页均抓取到完整正文，下列内容忠实于官方中文文档。

MyBatis 是**半自动化**持久层框架：开发者写 SQL，MyBatis 负责参数映射与结果封装，比 JPA 更可控，比 JDBC 更少样板。

---

## 一、核心概念

```
SqlSessionFactory  →  SqlSession  →  Mapper 接口（或 SqlSession.selectXxx）
```

- `Mapper`：接口，方法对应 XML 中的 SQL 语句 id。
- 配置：`mybatis-config.xml`（数据源、别名、映射文件），Spring 整合后由 `SqlSessionFactoryBean` 接管。

### Mapper 接口 + 注解最简用法
```java
public interface UserMapper {
    @Select("SELECT id, username FROM t_user WHERE id = #{id}")
    User selectById(Long id);
}
```

---

## 二、XML 映射器（select / insert / update / delete）

```xml
<!-- UserMapper.xml -->
<mapper namespace="com.demo.mapper.UserMapper">
  <select id="selectById" resultType="User">
    SELECT id, username, age FROM t_user WHERE id = #{id}
  </select>

  <insert id="insert" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO t_user(username, age) VALUES(#{username}, #{age})
  </insert>
</mapper>
```

### 主要属性
| 元素 | 关键属性 |
|---|---|
| `select` | `id`、`parameterType`、`resultType`/`resultMap`、`useCache` |
| `insert` | `useGeneratedKeys`（取自增主键）、`keyProperty`、`keyColumn`、`<selectKey>` |

- `useGeneratedKeys="true" keyProperty="id"`：插入后回填自增主键到对象。
- `<selectKey>`：处理不支持自增的库（如 Oracle 用序列，`order="BEFORE"`）。

---

## 三、#{} 与 ${} 的区别（关键安全点）

- **`#{}`**：生成 `PreparedStatement` 占位符 `?`，**预编译、防 SQL 注入**（官方明确）。
  ```xml
  WHERE id = #{id}     <!-- 安全 -->
  ```
- **`${}`**：字符串直接替换（不转义），用于动态表名/列名，**有注入风险，须自行校验**。
  ```xml
  ORDER BY ${columnName}   <!-- 危险，columnName 不能来自用户输入 -->
  ```

> 一条常见混用：`select * from user where ${column} = #{value}`——列名用 `${}`，值用 `#{}`。

---

## 四、resultMap（结果映射）

```xml
<resultMap id="userResultMap" type="User">
  <id property="id" column="user_id"/>
  <result property="username" column="user_name"/>
  <result property="age" column="age"/>
</resultMap>

<select id="selectById" resultMap="userResultMap">
  SELECT user_id, user_name, age FROM t_user WHERE id = #{id}
</select>
```

- `id`：标识对象（提升性能）；`result`：普通字段。
- 自动映射：开启 `mapUnderscoreToCamelCase=true` 可下划线转驼峰，省去手工映射。
- 关联映射：
  - `association`：「有一个」（如 User 有 Card）
  - `collection`：「有多个」（如 User 有多个 Order，`ofType` 指定元素类型）
  - `discriminator`：按列值选择不同映射（类似 switch）

---

## 五、动态 SQL（官方文档完整收录）

### 1. `<if>` —— 条件包含
```xml
<select id="find" resultType="Blog">
  SELECT * FROM BLOG WHERE state = 'ACTIVE'
  <if test="title != null"> AND title like #{title} </if>
</select>
```

### 2. `<choose>/<when>/<otherwise>` —— 多选一（类似 switch）
```xml
<choose>
  <when test="title != null"> AND title like #{title} </when>
  <when test="author != null"> AND author_name like #{author.name} </when>
  <otherwise> AND featured = 1 </otherwise>
</choose>
```

### 3. `<where>` —— 智能 WHERE（自动去开头 AND/OR）
```xml
<where>
  <if test="state != null"> state = #{state} </if>
  <if test="title != null"> AND title like #{title} </if>
</where>
```

### 4. `<set>` —— 动态 UPDATE（去末尾逗号）
```xml
<set>
  <if test="username != null">username=#{username},</if>
  <if test="email != null">email=#{email},</if>
</set>
```

### 5. `<foreach>` —— 遍历集合（IN 查询）
```xml
<foreach item="item" collection="list" open="ID in (" separator="," close=")">
  #{item}
</foreach>
```

### 6. `<trim>` / `<bind>`
- `<trim prefix="WHERE" prefixOverrides="AND |OR ">`：自定义前缀截取（where/set 的底层）。
- `<bind name="pattern" value="'%' + title + '%'"/>`：绑定变量，用于模糊查询。

> 注解中使用动态 SQL：用 `<script>` 包裹，如 `@Update({"<script>", "...", "</script>"})`。

---

## 六、缓存

- **一级缓存**：SqlSession 级别，默认开启。
- **二级缓存**：映射文件加 `<cache/>` 启用（LRU、1024 引用、读写缓存）。
  ```xml
  <cache eviction="FIFO" flushInterval="60000" size="512" readOnly="true"/>
  ```
- `<cache-ref namespace="..."/>`：跨命名空间共享缓存。
- 语句级控制：`useCache`（select 默认 true）、`flushCache`（增删改默认 true）。

---

## 七、与 Spring Boot 整合

```java
@Mapper
public interface UserMapper { ... }   // 加 @Mapper 或被 @MapperScan 扫描

// 配置数据源（application.yml）+ mybatis.mapper-locations=classpath:mapper/*.xml
// 注入即用
@Autowired UserMapper userMapper;
User u = userMapper.selectById(1L);
```

- `mybatis-spring-boot-starter` 自动配置 `SqlSessionFactory`；`@MapperScan("com.demo.mapper")` 批量扫描。

---

## 八、与系列其他文档的关系

- 底层仍是 JDBC（18）；SQL 映射解放 90% JDBC 样板（官方原文）。
- 对比 JPA（19）：MyBatis 手写 SQL 更可控、适合复杂报表；JPA 自动 ORM 适合领域 CRUD。
- 对比 Nest（TypeORM，见 `技术文档/nest`）：两者都「写 SQL + 映射」，但 MyBatis 的 XML 动态 SQL 更强大。
- `#{}` 防注入与 JDBC `PreparedStatement`（18）原理一致。
