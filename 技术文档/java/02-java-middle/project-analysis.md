# Demo 项目分析：结构、流程、经验与教训

> 本文档基于对项目代码的完整分析，总结 Spring Boot 的开发结构与流程，并复盘开发过程中踩过的坑。

---

## 一、项目结构

```
demo/
├── pom.xml                          # Maven 构建配置（依赖管理）
├── mvnw / mvnw.cmd                  # Maven Wrapper（无需全局安装 Maven）
└── src/main/
    ├── java/com/example/demo/
    │   ├── DemoApplication.java     # 启动类（@SpringBootApplication）
    │   ├── Response.java            # 统一响应包装类
    │   ├── TestController.java      # 测试用控制器
    │   ├── controller/              # Web 层：接收/响应 HTTP 请求
    │   │   └── StudentController.java
    │   ├── service/                 # 业务层：核心业务逻辑
    │   │   ├── StudentService.java          # 接口
    │   │   └── StudentServiceImpl.java      # 实现
    │   ├── dao/                     # 数据访问层：实体 + Repository
    │   │   ├── Student.java                 # JPA 实体（映射数据库表）
    │   │   └── StudentRepository.java       # Spring Data JPA 接口
    │   ├── dto/                     # 数据传输对象（对外暴露的数据结构）
    │   │   └── StudentDTO.java
    │   └── converter/               # Entity ↔ DTO 转换器
    │       └── StudentConverter.java
    └── resources/
        └── application.properties   # 应用配置（数据源、JPA 等）
```

### 分层职责

| 层 | 注解 | 职责 |
|---|---|---|
| Controller | `@RestController` | 定义 REST 接口（GET/POST/PUT/DELETE），参数校验，调用 Service，返回统一响应 |
| Service | `@Service` | 业务逻辑（查重、事务、组合操作），不直接接触 HTTP |
| Repository | 继承 `JpaRepository` | 数据库 CRUD，方法名自动生成 SQL（如 `findByEmail`） |
| Entity | `@Entity` `@Table` | 映射数据库表，字段即列 |
| DTO | `@Data` | 对外传输的数据结构，与实体解耦，可实现脱敏 |
| Converter | 工具类 | Entity 和 DTO 之间的字段映射 |

---

## 二、一个请求的完整流程（以 POST /student 为例）

```
客户端 (JSON)
   │  POST http://localhost:8080/student
   ▼
StudentController.createStudent()      ← @RequestBody 把 JSON 反序列化为 StudentDTO
   ▼
StudentServiceImpl.createStudent()     ← 业务逻辑：findByEmail 查重 → 抛异常或继续
   ▼
StudentConverter.convert(dto)          ← DTO 转为 Entity
   ▼
StudentRepository.save()               ← JPA / Hibernate 生成 INSERT SQL
   ▼
MySQL (todo 库的 student 表)
   ▼
返回 Entity → 转回 DTO → Response.success(data) → 序列化为 JSON
```

### 响应格式约定

```json
{ "code": 200, "msg": "success", "data": 1 }
```

---

## 三、Spring Boot 开发流程（从 0 到 1）

1. **创建项目**：Spring Initializr 生成骨架，选 Web、JPA、MySQL 依赖
2. **配置数据源**：`application.properties` 配置 URL / 用户名 / 密码 / 驱动
   - 加 `createDatabaseIfNotExist=true` 可自动建库
   - `spring.jpa.hibernate.ddl-auto=update` 可按实体自动建表
3. **建实体**：写 `@Entity` 类，用 `@Table` `@Column` `@Index` 精确控制表结构
4. **建 Repository**：继承 `JpaRepository<Entity, ID>`，零实现即有 CRUD；自定义查询按方法名规则写（`findByEmail` → `WHERE email = ?`）
5. **建 DTO 与 Converter**：对外接口不直接暴露 Entity
6. **写 Service**：先定义接口，再写实现类，业务逻辑集中在此层
7. **写 Controller**：`@RestController` + `@GetMapping/@PostMapping/@PutMapping/@DeleteMapping`
8. **测试**：启动应用（`./mvnw spring-boot:run` 或 IDEA 直接运行），用 curl / IDEA HTTP Client（`.http` 文件）验证接口

---

## 四、本项目踩过的坑（教训）

### 1. Maven 命令
- 系统没装 Maven 时，`mvn` / `maven` 都会报 `command not found`
- **教训**：优先使用项目自带的 Maven Wrapper：`./mvnw clean install`

### 2. Lombok 报“无法解析符号”
- 现象：`import lombok.Data` 标红、`getEmail()` 找不到，但 Maven 命令行编译能通过
- 原因：Lombok 是**编译期注解处理器**，源码里根本没有 getter/setter，是编译时生成的
- **教训**：IDE 必须开启 `Settings → Compiler → Annotation Processors → Enable annotation processing`，改完 pom 记得 Reload Maven

### 3. .properties 中文乱码
- 现象：配置文件中文注释显示乱码
- 原因：IDEA 默认按 ISO-8859-1 读取 `.properties` 文件（Java 老规范），而文件实际是 UTF-8
- **教训**：`.properties` 文件注释尽量用英文；或设置 `Settings → Editor → File Encodings → Default encoding for properties files = UTF-8`

### 4. DTO 设计冲突
- 现象：`StudentDTO` 作为“脱敏响应 DTO”故意删掉了 email，但创建接口又需要它作为入参，导致编译错误
- **教训**：一个 DTO 同时当“请求入参”和“响应出参”用，脱敏逻辑会互相打架。规范做法是**入参和出参分开**：`StudentCreateRequest` / `StudentResponse`

### 5. Converter 字段映射遗漏
- 现象：查重逻辑写好了，但 DTO→Entity 转换时漏了 email，存库后邮箱为空
- **教训**：给类加字段时，要检查所有映射点（Converter、测试数据、前端表单）。字段映射建议用 MapStruct 这类映射框架，编译期检查遗漏

### 6. 405 Method Not Allowed
- 现象：发 PUT 请求报错 "...not allowed"
- 原因：Service 层方法写好了，但 Controller 没有对应的 `@PutMapping`，Spring 找不到匹配的处理器
- **教训**：405 意味着“路径存在但 HTTP 方法不匹配”，先检查 Controller 的注解；接口是“Controller + 映射注解”定义的，Service 层有方法不等于接口存在

### 7. 业务判断逻辑写反
- 现象：`updateStudent` 里写的是 `if (name != null && name.equals(studentInDB.getName()))` —— 只有“新值等于旧值”才更新，等于永远改不了
- 正确写法：`if (name != null)`（null 表示“不更新该字段”，非 null 就更新）
- **教训**：条件判断写完后用“新旧值不同”的用例走一遍代码，别只看编译能不能过

### 8. 异常使用不当
- `throw new IllegalAccessError(...)`：`IllegalAccessError` 是 JVM 级错误，语义完全不对
- **教训**：业务异常用 `IllegalArgumentException` 或自定义 `BusinessException`；不要复用 JDK 的 Error 类

### 9. 缺少全局异常处理
- 现象：Service 抛出的 `RuntimeException` 直接变成 HTTP 500 + 一大坨堆栈返回给客户端
- **教训**：加 `@RestControllerAdvice` + `@ExceptionHandler`，把异常统一转成 `Response.fail(msg)`，返回友好格式

---

## 五、后续改进建议（优先级从高到低）

1. **全局异常处理**：新增 `GlobalExceptionHandler`（`@RestControllerAdvice`），捕获业务异常返回 `Response.fail()`
2. **请求/响应 DTO 拆分**：创建用 `StudentCreateRequest`，查询响应用 `StudentResponse`
3. **构造器注入替代字段注入**：`@Autowired` 字段注入 IDEA 会警告，改为构造器注入（可用 `@RequiredArgsConstructor`）
4. **参数校验**：入参加 `@NotBlank` `@Email` 等注解（`spring-boot-starter-validation`）
5. **删除接口返回值**：目前 `DELETE /student/{id}` 返回 void，建议统一返回 `Response<Void>`
6. **查重用 exists**：`findByEmail(...).isEmpty()` 会把整行查回来，改为 `existsByEmail(email)` 返回 boolean 更高效

---

## 六、快速上手命令

```bash
./mvnw clean install        # 构建打包
./mvnw spring-boot:run      # 启动应用（默认 8080 端口）
./mvnw test                 # 跑测试

# 测试接口（curl 示例）
curl -X POST http://localhost:8080/student \
  -H "Content-Type: application/json" \
  -d '{"studentNo":"20260001","name":"张三","email":"zhangsan@example.com","gender":1,"birthDate":"2004-05-20","major":"计算机科学与技术","className":"计科2201","enrollmentYear":2022,"status":1}'

curl http://localhost:8080/student/1
```
