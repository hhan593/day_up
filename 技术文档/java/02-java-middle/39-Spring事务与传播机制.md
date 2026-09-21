# 39 - Spring 事务与传播机制（@Transactional / Propagation / 失效场景 / 乐观锁）

> 来源：Spring Framework Reference — «Transaction Management»（声明式事务、传播行为、只读、事务同步）；Spring `@Transactional` / `TransactionDefinition` Javadoc（`PROPAGATION_*` 常量）；Jakarta Persistence 事务语义
> 官方：https://docs.spring.io/spring-framework/reference/data-access/transaction.html 、https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html
> 补充：并发更新与乐观锁、分布式事务取舍属业界标准实践整理；数据库层隔离级别与 MVCC 见 `03-mysql/09-事务.md`，本篇不重复论证。

**事务的正确性问题是并发问题，不是语法问题。** 会写 `@Transactional` 只是语法；能否说清「这个 checked 异常为什么会提交」「这次自调用为什么没回滚」「这两个线程为什么把库存改成了同一个值」，才是本篇的目标。边界先划清：**数据库层如何保证 ACID、隔离级别、MVCC、行锁/间隙锁 → 见 `03-mysql/09-事务.md`、`03-mysql/16-锁.md`、`03-mysql/17-InnoDB引擎.md`；本篇只讲应用/连接层如何把多个 DB 操作绑到同一个事务、以及绑错绑漏的代价。**

---
## 一、Spring 事务抽象到底解决什么
JDBC 层事务原语只有 `conn.setAutoCommit(false)` / `commit()` / `rollback()`（`18-JDBC数据库编程.md`）。难点在于：**一次业务请求里的多个 DAO 必须拿到同一个 `Connection`**，否则各自提交、原子性为零。Spring 用三件套解决：
| 抽象 | 职责 | 常见实现 |
|---|---|---|
| `PlatformTransactionManager` | 生命周期操作：`getTransaction`/`commit`/`rollback` | `DataSourceTransactionManager`（JDBC，Boot 3 推荐 `JdbcTransactionManager`）、`JpaTransactionManager`、`JtaTransactionManager`（跨库 XA） |
| `TransactionDefinition` | **怎么开**：传播、隔离级别、超时、只读、回滚规则 | `DefaultTransactionDefinition`，由 `@Transactional` 属性映射 |
| `TransactionStatus` | 运行态句柄：`setRollbackOnly()`/`isCompleted()`/`flush()` | manager 返回，可用 `TransactionAspectSupport.currentTransactionStatus()` 取 |
关键机制：**`TransactionSynchronizationManager` 用 ThreadLocal 保存 `DataSource → ConnectionHolder` 映射**，`JdbcTemplate`/MyBatis/`EntityManager` 取连接时先查这个 ThreadLocal，命中即复用同一连接 —— 这就是「应用层事务」的全部物理含义。它同时解释两件事：① **自调用失效**：绑定发生在 AOP 代理上，`this.method()` 不过代理 ⇒ 没 begin ⇒ 内部 DAO 各自自开自提；② **事务不能跨线程**：换线程 = 换 ThreadLocal = 拿不到 `ConnectionHolder`（`35-线程池与线程协作.md` 第十二节的 ThreadLocal 失效与串号在此落地），把 `@Transactional` 方法丢进线程池异步执行、还认为「和调用方在同一事务里」是最典型的认知错误。
> 一句话结论：**`@Transactional` = AOP 代理在方法前后包了 begin/commit/rollback（外加线程绑定），它不是 SQL 层面的东西，数据库根本不知道这个注解存在。**

---
## 二、`@Transactional` 全属性速查表
| 属性 | 默认 | 说明 + 真实用法 |
|---|---|---|
| `value` / `transactionManager` | 容器内唯一或 `@Primary` 的 manager | **多数据源必须显式指定**：`@Transactional("orderTxManager")`。用错 manager = 事务开在另一个 DataSource 的连接上，业务 SQL 不在其中，**等于没开事务**（多数据源见 `21-持久层进阶JPA与MyBatisPlus.md`） |
| `propagation` | `REQUIRED` | 七种，见第四节 |
| `isolation` | `DEFAULT` | **只是「把级别传下去」**：Spring 在事务前 `SET TRANSACTION ISOLATION LEVEL ...`、结束后复原。MySQL 真实行为（RR/间隙锁/MVCC）见 `03-mysql/09-事务.md`，别指望换应用层级别解决幻读 |
| `timeout` | `-1`（永不超时） | 事务级超时（秒），Spring 尽力经 JDBC `setQueryTimeout` 等下推。**是否真正生效依赖 DataSource 与 JDBC driver 实现**，部分驱动不生效，不能当唯一兜底；且它只统计 Spring 感知到的执行时间 |
| `readOnly` | `false` | 两层收益，见第七节 |
| `rollbackFor` / `noRollbackFor`（含 `*ClassName`） | 空 | 前者**追加**要回滚的异常（`rollbackFor = Exception.class` 是团队必备写法）；后者**优先于**前者，用于「这类异常算正常业务分支，别回滚」 |
| `label` | 空 | 给事务打标：`@Transactional(label = "vip")`，配合自定义 `TransactionAttributeSource`/切面按标签统一处理，不改业务码 |
```java
@Transactional(transactionManager = "stockTxManager", propagation = Propagation.REQUIRED, timeout = 3,
               rollbackFor = Exception.class, noRollbackFor = BizQuitException.class, label = "stock-deduct")
public void deduct(Long skuId, int num) throws IOException { /* ... */ }
```

---
## 三、回滚规则：真实事故第一位
**默认规则只有一条**：`RuntimeException` 与 `Error` 回滚，**checked 异常默认不回滚**（设计动机：checked 常表达「业务上的正常结果」）。
```java
@Transactional                                 // 反例：没配 rollbackFor
public void create(Order o) throws IOException {
    orderMapper.insert(o);
    receiptClient.archive(o.getId());          // 抛 new IOException("disk full") —— checked
}   // ⇒ 异常一路抛到 Web 层，但 order 已【提交】：接口报错 + 有堆栈 + 数据写进去了（一单两付）
```
修法只有一行：`@Transactional(rollbackFor = Exception.class)`；坑在于现象「看起来像已经回滚了」。
### 1. `UnexpectedRollbackException`：外层 try-catch 反而把系统搞挂
内层事务（`REQUIRED`，与外层共享**同一物理事务**）抛异常时会把整个物理事务标记为 rollback-only；外层 catch 住异常想正常提交 → 提交阶段全局事务已不可提交，抛 `UnexpectedRollbackException: Transaction rolled back because it has been marked as rollback-only`。
```java
@Transactional(rollbackFor = Exception.class) public void pay(Order o) {          // 外层
    try { flowService.write(o); } catch (Exception e) { log.warn("ignore"); }      // 兜住了，但已晚
}   // ⇒ 提交阶段抛 UnexpectedRollbackException，一条数据都没落
// 内层 FlowService#write：@Transactional(rollbackFor = Exception.class) throw new IllegalStateException("boom");
```
三种正解：① 内层改 `REQUIRES_NEW`（独立回滚、不污染外层）；② 外层不要 catch，让异常上抛；③ 明知要吞异常就显式放弃本事务：`TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();`。`noRollbackFor` 的典型场景：业务校验失败以异常表达、但不希望回滚已写的流水 —— `@Transactional(noRollbackFor = BizCheckException.class)`。

---
## 四、七种传播行为（本篇核心）
枚举语义来自 `TransactionDefinition`（`PROPAGATION_*`）。逐个给「什么场景用它 + 用错会怎样」。
### 1. `REQUIRED`（默认）：有则加入，无则新建
90% 场景；转账的两步扣减必须同一事务。
```java
@Transactional(rollbackFor = Exception.class)
public void transfer(long from, long to, BigDecimal amt) {
    accountMapper.deduct(from, amt);  accountMapper.add(to, amt);   // 同一 Connection、同一物理事务
}   // 用错示范：把「审计日志」也写成 REQUIRED ⇒ 主业务回滚时日志一起消失，事后无法追责
```
### 2. `REQUIRES_NEW`：挂起外层、开新事务、**独立提交**
典型：**操作日志/审计记录不能因主流程回滚而丢失**、序列号发号、发券计数。
```java
@Transactional(propagation = Propagation.REQUIRED, rollbackFor = Exception.class)
public void placeOrder(Order o) {
    orderMapper.insert(o);  opLogService.save(o.getId(), "CREATE");  // 内层 REQUIRES_NEW：主流程回滚它也已提交
    if (o.riskHigh()) throw new IllegalStateException("risk");
}   // 用错会怎样：反过来指望「外层回滚时内层跟着回滚」—— 内层已提交的动作【不可能】被外层回滚
@Transactional(propagation = Propagation.REQUIRES_NEW) public void save(String bizId, String act) { /* OpLogService#save → opLogMapper.insert(...) */ }
```
**两条实现前提**：外层连接被**挂起**（不提交不回滚、先让位），新事务要**再借一个连接** ⇒ 一次嵌套 = 同一线程占 **2 个 DB 连接**。若 `spring.datasource.hikari.maximum-pool-size` 偏小（默认 10），并发一高就出现「所有线程各持 1 个连接、等第 2 个、谁也拿不到」→ **连接池打满 + 超时，形似死锁**（这是连接池打满的经典成因，池参数见 `18-JDBC数据库编程.md`）。
### 3. `NESTED`：**同一物理事务内的保存点**，可回滚到保存点而外层继续
```java
@Transactional(rollbackFor = Exception.class)
public ImportResult batchImport(List<Row> rows) {     // 批量导入 1000 行，单行失败只回滚该行
    int ok = 0, bad = 0;
    for (Row r : rows) { try { rowService.insertOne(r); ok++; }        // insertOne = NESTED：每行一个 savepoint
                         catch (Exception e) { bad++; } }              // 回到该行 savepoint，前面成功的行仍保留
    return new ImportResult(ok, bad);                 // 外层整体【仍可提交】—— 这是 REQUIRES_NEW 做不到的
}   // 用错会怎样：换成 REQUIRES_NEW ⇒ 成功行各自独立提交，外层想整体放弃也回不来
```
| 维度 | `REQUIRES_NEW` | `NESTED` |
|---|---|---|
| 是否新事务 | **是**（独立物理事务） | 否（同一物理事务 + savepoint） |
| 内层回滚对外层 | 互不影响 | 回到保存点，外层继续 |
| 内层能否**独立提交** | 能（内层先提交） | **不能**，随外层一起提交/回滚 |
| 外层回滚时内层 | 已提交的不受影响 | 一起回滚 |
| 需要第 2 个连接 | **需要** | 不需要 |
| 依赖 | manager 支持事务即可 | 需实现 `SavepointManager`（JDBC 走 `Connection.setSavepoint`，MySQL InnoDB 可用）；不支持则抛 `NestedTransactionNotSupportedException` |
### 4~7. `SUPPORTS` / `NOT_SUPPORTED` / `MANDATORY` / `NEVER`
```java
@Transactional(propagation = Propagation.SUPPORTS, readOnly = true) public List<Item> listItems(long orderId) { /* 有则加入，无则【非事务】 */ }
@Transactional(propagation = Propagation.NOT_SUPPORTED) public void exportBigReport(OutputStream out) { /* 挂起外层，游标/流式读 */ }
@Transactional(propagation = Propagation.MANDATORY) public void insertStockLog(long skuId, int delta) { /* 无事务则拒绝执行 */ }
@Transactional(propagation = Propagation.NEVER) public void sendBatchMail(List<Task> tasks) { /* 有事务则直接抛 */ }
```
| 行为 | 用它干什么 | 用错会怎样 |
|---|---|---|
| `SUPPORTS` | 查询「有事务就顺带、没事务也别硬开」 | 外层无事务时它**真的没事务**：JPA 下 `EntityManager` 已关闭，访问懒加载即 `LazyInitializationException` |
| `NOT_SUPPORTED` | 长查询/导出不占着事务与锁 | 标在**写**方法上 ⇒ autocommit 逐条提交，异常时**部分成功**且无法整体回滚 |
| `MANDATORY` | 内部 API 护栏（流水表、领域事件表），裸调无意义 | 被当成对外入口直接调用 ⇒ 无事务时抛 `IllegalTransactionStateException` 类异常（`TransactionUsageException` 体系） |
| `NEVER` | 显式声明「本方法不得在事务里跑」，误用当场暴露 | 与 `NOT_SUPPORTED` 的差别是「默默挂起」vs「直接抛」；调用方是否带事务不稳定时会随机炸 |
### 8. 汇总矩阵（标准答案，务必记牢）
| 传播行为 | 外层**无**事务 | 外层**有**事务 |
|---|---|---|
| `REQUIRED`（默认） | **新建** | **加入** |
| `SUPPORTS` | 非事务执行 | 加入 |
| `MANDATORY` | **抛异常** | 加入 |
| `REQUIRES_NEW` | 新建 | **挂起外层 + 新建**（需 2 个连接） |
| `NESTED` | 新建（等价 `REQUIRED`） | 加入并在其中**建保存点** |
| `NOT_SUPPORTED` | 非事务执行 | **挂起外层** + 非事务执行 |
| `NEVER` | 非事务执行 | **抛异常** |
### 9. 自调用为何让传播失效（最小复现 + 三种修法）
```java
@Transactional public void outer() { inner(); }   // this.inner() 绕过代理 ⇒ inner 的注解完全不生效
@Transactional(propagation = Propagation.REQUIRES_NEW) public void inner() { throw new RuntimeException("x"); }
// 期望：内层独立回滚、外层不受影响；实际：异常直接冒到 outer ⇒ outer 整体回滚
```
修法：① `@Lazy @Resource private MonoService self;` → `self.inner()` 走代理；② `@EnableAspectJAutoProxy(exposeProxy = true)` + `((MonoService) AopContext.currentProxy()).inner();`；③ **拆到另一个 Bean（最推荐，职责清晰）**，见 `40-Bean生命周期与循环依赖.md`。
> 注意：**同类两个 `@Transactional` 方法互相调用，第二个注解不会生效**，无论它的传播行为写什么。

---
## 五、事务失效的完整清单（面试必考）
| # | 现象 | 根因 | 修法 |
|---|---|---|---|
| 1 | 加不加都无效果、无报错 | **方法非 `public`**：`protected`/`private`/包级上的 `@Transactional` 被静默忽略 | 改 public |
| 2 | 传播行为「失效」、内层注解像没写 | **同类自调用 `this.xxx()` 绕过代理**（最常见） | 注入 `@Lazy` self / `AopContext.currentProxy()` / 拆 Bean |
| 3 | 整个类事务都不生效 | **类未被 Spring 管理**：忘 `@Service`，或业务代码 `new XxxService()` 拿到无代理对象 | 改由容器注入 |
| 4 | 抛了异常却提交了 | **异常被 catch 吞掉**，切面看到「正常返回」 | 别吞；或 `setRollbackOnly()` |
| 5 | checked 异常不回滚 | 默认规则只覆盖 `RuntimeException`+`Error` | `rollbackFor = Exception.class` |
| 6 | 逻辑全对但回滚不了 | **表用 MyISAM**（不支持事务），InnoDB 才有事务（`03-mysql/10-存储引擎.md`、`03-mysql/17-InnoDB引擎.md`） | `ALTER TABLE t ENGINE=InnoDB` |
| 7 | 事务开了却没起作用 | **多数据源用错 `transactionManager`** | 显式 `@Transactional("xxxTxManager")` |
| 8 | 意外没事务 | 传播设成 `NOT_SUPPORTED`/`NEVER`，或注解位置（接口/父类）导致属性错配 | 复核传播与注解位置 |
| 9 | 单个方法静默失效 | 方法为 **`final`/`static`**：CGLIB 靠继承覆写，改不了（`31-反射与注解.md` 第六节） | 去 final / 移到实例方法 |
| 10 | 偶发不生效 | 自研切面 `@Order` 把事务切面包在外面，异常先被外层切面吞掉 | 调整 order，让事务切面更内层 |

---
## 六、事务 + 异步 / 事务 + 事件（工程高频）
`@Async` 方法上再加 `@Transactional`：线程切换后 ThreadLocal 里没有 `ConnectionHolder` ⇒ **两者各自独立提交**，「同一事务」的期望完全不成立（机制见 `35-线程池与线程协作.md`）。正确做法三种：① 外层只传参（ID 列表），异步方法自己开事务、自己写完；② 把 `@Transactional` 放在**被异步调用的那个方法最外层**，让它成为边界；③ 提交后才动作 → **事务事件**：
```java
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)   // Spring 4.2+；主流程 create() 内 publishEvent(...)
public void onCreated(OrderCreatedEvent e) {
    mqProducer.send(e.payload());  cache.evict("order:" + e.id());   // 只有主事务真的提交了才发消息；提交后清缓存避免旧值回填
}
```
> 注意：`AFTER_COMMIT` 回调**在提交线程的事务同步阶段执行**（并非另起线程），但业务事务此时**已提交完**，监听器里的写库不会并入主事务（要独立事务就显式 `@Transactional(propagation = REQUIRES_NEW)`，并想清楚它失败怎么办）；监听器抛异常**无法**回滚已提交的主事务，只能重试/告警。另有 `AFTER_COMPLETION`（回滚也执行）、`fallbackExecution = true`（无事务时也执行）。
**为什么不能把发消息写在事务方法内**：`insert` → `send(MQ)` → 事务回滚，消息却已出去 ⇒ 下游按不存在的单据建了单，**脏数据且重试救不回**。要么用事务事件（`AFTER_COMMIT`），要么用**本地消息表 / RocketMQ 事务消息 / Kafka 事务**（`24-消息队列与微服务.md`、`27-Kafka流式处理.md`，消费侧仍需幂等）。

---
## 七、只读事务、长事务与连接池（生产视角）
`readOnly = true` 两层收益：① **JPA/Hibernate 侧**把 flush 模式设为 `MANUAL`、跳过提交前脏检查，省开销且误改不落库；② **主从架构侧**可作为「只读事务路由到从库」的依据，分担主库写压力（`03-mysql/22-读写分离.md`）。给纯查询方法标 `readOnly` 是零成本收益；但它不是权限控制（JDBC 侧只是 `Connection.setReadOnly`，服务端未必强制）。
**长事务三宗罪**：① 连接被长期占用 → 池耗尽、吞吐崩塌；② 事务不结束 → **undo log 无法回收、回滚段膨胀、MVCC 版本链变长**（DB 侧论证见 `03-mysql/09-事务.md`、`03-mysql/17-InnoDB引擎.md`）；③ **行锁/MDL 持有时间长** → 阻塞更新与 DDL（`03-mysql/16-锁.md`）。
**红线：事务方法里禁止 RPC/HTTP 调用、发消息、读大量数据。** 真实案例：`@Transactional` 下单方法内调三方风控、超时 5s，峰值 20 QPS ⇒ 稳态需要 20×5 = **100 个连接**，而 `maximum-pool-size=20` ⇒ 20 个连接全挂在等 HTTP 上，登录、支付回调等所有 SQL 一起超时，看起来「数据库炸了」，实际是**连接被非 DB 工作借走**。修法：把 RPC 挪到事务外（先校验/先算 → 进短事务只写 → 提交后通知）+ 缩短事务边界 + 下游幂等补偿。
事务内 try-catch 重试的正确姿势：**重试单元必须在事务之外**（前一次失败已把当前事务标为 rollback-only，事务内重试是白跑）：
```java
public void placeWithRetry(Order o) {                                  // 无 @Transactional
    for (int i = 0; i < 3; i++) { try { orderTxService.place(o); return; }   // 每次调用 = 一次【新事务】
                                  catch (RetryableException e) { backoff(i); } }
    throw new BizException("place failed");
}
```

---
## 八、并发更新的正确解法（乐观锁）
### 1. 问题定义：**丢失更新（Lost Update）**
```java
public void deductOld(Long id, int n) {                                // 典型「读-改-写」错误
    Stock s = mapper.selectById(id);                                   // 读到 10
    mapper.updateById(new Stock(id, s.getNum() - n));                  // 写回 9 ← 值是自己算出来的
}
```
```text
T1: select stock → 10          T2: select stock → 10
T1: update stock = 10-1 → 9    T2: update stock = 10-1 → 9   ← 扣了两次，只剩一次效果
```
> 注意：`READ COMMITTED` / `REPEATABLE READ` **都救不了它** —— 两个事务各自读到 10、各自成功提交。这是应用层逻辑问题，不是隔离级别问题（DB 层成因见 `03-mysql/09-事务.md`）。
### 2. 四种解法对比
| 方案 | 写法 | 优点 | 代价 |
|---|---|---|---|
| ① 悲观锁 | `SELECT ... FOR UPDATE`；JPA `@Lock(LockModeType.PESSIMISTIC_WRITE)`；MyBatis 手写 SQL | 逻辑最直观，天然串行 | 吞吐低、连接被占久；无索引会锁大量行/**间隙锁**、易死锁（`03-mysql/16-锁.md`） |
| ② 乐观锁版本号 | JPA `@Version`；MyBatis-Plus `@Version` + `OptimisticLockerInnerInterceptor`；手写 `WHERE id=? AND version=?` | 不持锁、并发高、能感知冲突 | 高冲突下重试放大开销；需版本字段 |
| ③ **CAS 式条件更新** | `UPDATE ... SET stock=stock-1 WHERE id=? AND stock>=?` 判 `affected rows` | **无需 version 字段、一条 SQL 原子完成**，库存扣减首选 | 只适合「可表达为条件」的更新，不能算复杂新值 |
| ④ 分布式锁 | Redis / Redlock（`23-Redis缓存.md`） | 跨实例、跨资源串行化 | 它是**应用层互斥**、不是数据库方案，锁过期/续期风险自担 |
**③ 库存扣减（推荐默认写法）**：
```java
@Update("UPDATE t_stock SET stock = stock - #{num}, updated_at = NOW() WHERE sku_id = #{skuId} AND stock >= #{num}")
int tryDeduct(@Param("skuId") long skuId, @Param("num") int num);   // 条件即约束，原子性交给 DB
// 调用侧：if (mapper.tryDeduct(skuId, num) == 0) throw new BizException("库存不足或已被抢完");
```
**② 版本号 + 正确的重试**（悲观锁对照：`@Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from Stock s where s.skuId = :id")`）：
```sql
UPDATE t_stock SET stock = stock - 1, version = version + 1
 WHERE sku_id = 1001 AND version = 5;      -- affected rows = 0 ⇒ 冲突，必须重来
```
JPA 标 `@Version private Integer version;` 后，冲突时抛什么异常视持久层实现而定（Hibernate 侧为 `OptimisticLockException` 系），**Spring 会转译进 `ObjectOptimisticLockingFailureException` / `OptimisticLockingFailureException` 体系**；MyBatis-Plus 不注册 `OptimisticLockerInnerInterceptor` 时 `@Version` 只是个普通字段（`21-持久层进阶JPA与MyBatisPlus.md`）。
> 关键坑：**重试必须发生在【新事务】里**。同一事务内重读，MVCC 快照没变（RR 下尤其明显），拿到的仍是旧 `version`，重试一百次也失败 ⇒ 重试循环放在事务方法之外（或用 `@Retryable`，并确保 Retry 切面在事务切面**外层**），或让每次尝试走 `REQUIRES_NEW` 的独立 Bean 方法。
幂等与去重三件套（并发安全之外还要防重复请求）：**唯一索引兜底**（`UNIQUE KEY uk_biz(biz_no)`，最后一道防线）、`INSERT ... ON DUPLICATE KEY UPDATE stock = stock - VALUES(num)`、token 机制（先 `SETNX` 领令牌再执行）。

---
## 九、声明式 vs 编程式
| 维度 | `@Transactional`（声明式） | `TransactionTemplate`（编程式） |
|---|---|---|
| 边界粒度 | 整个方法 | **代码块**，可把校验/RPC 留在事务外 |
| 是否依赖代理 | 是（⇒ 第五节全部失效场景） | **否**（自调用、非 public 都不影响它） |
| 可读性 / 适用 | 一行声明，意图清晰；常规业务 | 略啰嗦但边界一目了然；长方法、极小事务边界、动态开关 |
```java
private final TransactionTemplate tx;                                  // Boot 自动注入；tx.setPropagationBehavior(...) / setName(...)
public PlaceResult place(Order dto) {
    Rules r = rulesClient.load(dto);                                   // ← 校验/RPC：事务【外】（改造前它们在 @Transactional 里挂着连接）
    tx.executeWithoutResult(st -> { stockMapper.deduct(dto.skuId(), dto.num()); orderMapper.insert(dto.toEntity()); });
    notifyClient.push(dto.getId());                                    // ← 通知：事务【外】，此时已确定提交
    return orderMapper.resultOf(dto.getId());
}   // 需要返回值用 tx.execute(st -> ...)；主动放弃提交用 st.setRollbackOnly()
```
编程式在「事务边界要小」这个目标上**反而更优**：边界写在哪，一眼看得见。回滚语义注意点：`doInTransaction` 只声明抛出非受检异常，抛 `RuntimeException`/`Error` 即回滚，checked 异常需在 lambda 内包装后上抛；且**它与 `@Transactional` 一样，吞掉异常就等于提交**。

---
## 十、注解代理失效的统一根因
| 注解 | 拦截者 | 典型失效表现 |
|---|---|---|
| `@Transactional` | `TransactionInterceptor`（由 `@EnableTransactionManagement` 注册的后置处理器包装 Bean） | 自调用 / 非 public / checked 未配 `rollbackFor` |
| `@Cacheable` | `CacheInterceptor`（注解驱动机制见 `38-SpringMVC请求流程与Web层.md`） | 自调用、`key` 拼错导致「看起来没缓存」 |
| `@Async` | `AsyncAnnotationBeanPostProcessor` + 线程切换 | 自调用 ⇒ 根本不同步；忘 `@EnableAsync` ⇒ 同步执行 |
**四条共性根因**：自调用绕过代理、方法非 public、Bean 未被容器管理/未被扫描、`final` 方法。Spring Boot 默认走 **CGLIB 子类代理**（`spring.aop.proxy-target-class=true`，`@EnableTransactionManagement` 亦默认 `proxyTargetClass=true`），代理是目标类的**子类** ⇒ `final` 方法不能覆写、`private` 方法不进代理链。认知要点（`31-反射与注解.md` 第六节）：**注解本身不含任何逻辑，只是标记；力量全部来自代理拦截 —— 移除拦截器，`@Transactional` 与一句空注释没有区别。** 另外，异常在 Web 层被 `@ExceptionHandler` catch 时，事务边界（切面）早已决定回滚还是提交。

---
## 十一、`@Scheduled` 与 `@Async` 的执行器配置坑
- **`@Scheduled` 默认调度池容量极小（通常 1 个线程）**：Boot `TaskSchedulingProperties` 默认 pool size 为 1 ⇒ **一个任务卡住（例如在 `@Transactional` 里等慢 SQL），全部定时任务串行排队**，表现为「别的任务默默不跑了」。修法：`spring.task.scheduling.pool.size=8`，或自定义 `ThreadPoolTaskScheduler`（线程命名 + 有界队列，遵循 `35-线程池与线程协作.md` 的「禁用 `Executors` 快捷方法 / 队列必须有界」结论）。多实例部署还会**重复执行**（`@Scheduled` 不做集群协调）⇒ 需分布式锁或分片调度（`23-Redis缓存.md`）。
- **`@Async` 的降级行为**：没有 `@EnableAsync` 时注解完全无效（在调用线程同步执行，最容易被误认为「随机 bug」）；Boot 提供了 `applicationTaskExecutor`（核心线程数小、队列近乎无界），生产应显式换成有界队列 + 拒绝策略的执行器。`spring.task.*` 下与此相关的是 `execution`（`@Async`）与 `scheduling`（`@Scheduled`）两组默认池。两坑叠加杀伤力最大：`@Scheduled` 触发 → `@Async` 无界排队 → 内存与延迟同时飙升；而 `@Transactional` + `@Async` 永远不可能共享同一个事务。

---
## 十二、分布式事务取舍
本地事务失效的三个场景：**跨库**（分库分表，`03-mysql/21-分库分表.md`）、**跨服务**（一次下单横跨订单/库存/账务）、**DB 与 MQ 混合**。
| 方案 | 一致性 | 侵入性 | 代价 |
|---|---|---|---|
| 2PC / XA（`JtaTransactionManager` + Atomikos） | 强 | 低（换 manager） | **同步阻塞**、协调者单点、吞吐显著下降，高并发基本不用 |
| **TCC** | 最终一致（可控） | **高**：Try/Confirm/Cancel 三套接口 + 幂等/空回滚/悬挂 | 开发量大，金融核心常见 |
| **Seata AT** | 最终一致 | 低（代理数据源，自动写 `undo_log` 反向补偿） | 全局锁、需部署 TC；**本知识库暂无 Seata 专篇**（此前仅零散提及），细节需另查官方文档 |
| **可靠消息最终一致** | 最终一致（秒级） | 中 | 本地消息表 / RocketMQ 事务消息 / Kafka 事务（`27-Kafka流式处理.md`），消费侧必须幂等 |
| 最大努力通知 | 弱 | 低 | 支付回调类，靠对账兜底 |
**选型结论**：第一原则是**改设计以避免分布式事务** —— 同库同事务、强相关数据放同一分片、单据合并、允许「最终一致 + 对账补偿」。真要上再按一致性等级选：强一致尽量收敛到同库；跨服务写优先可靠消息；需要用户可感知的即时一致才上 TCC / Seata AT。

---
## 十三、常见面试题速答
> **`@Transactional` 默认传播行为？** `REQUIRED`：有则加入，无则新建。
> **`REQUIRES_NEW` 与 `NESTED` 的区别？** 前者挂起外层、开**独立物理事务**、需要**第 2 个连接**、内层可独立提交；后者是**同一物理事务内的 savepoint**，内层回滚到保存点后外层继续，但内层**不能独立提交**。
> **默认回滚规则？** `RuntimeException` 与 `Error` 回滚，**checked 异常不回滚** ⇒ 必须 `rollbackFor = Exception.class`。
> **事务失效场景全列？** 非 public、自调用、类未被容器管理、异常被吞、checked 未配 `rollbackFor`、MyISAM、用错 `transactionManager`、`NOT_SUPPORTED`/`NEVER`、`final`/`static`、切面 order。
> **为什么事务不能跨线程？** 连接绑在 `TransactionSynchronizationManager` 的 **ThreadLocal**（`ConnectionHolder`）上；换线程即换 ThreadLocal，拿不到同一连接。
> **乐观锁三种写法？** `@Version`（JPA / MyBatis-Plus 插件）、手写 `WHERE id=? AND version=?` 判影响行数、CAS 条件更新 `WHERE stock >= ?`（免版本字段，库存首选）；**重试必须在新事务里**。
> **`readOnly` 的两个作用？** JPA/Hibernate 侧关 flush 与脏检查（性能 + 防误写）；主从架构下作为**路由到从库**的依据。
> **长事务三宗罪？** 连接池被占满、undo log 无法回收致回滚段膨胀（MVCC 版本链变长）、锁（含 MDL）持有时间长阻塞更新与 DDL。

---
## 十四、与系列其他文档的关系
- `14-Spring核心IoC与AOP.md`：代理是这一切的实现机制，本篇只把「代理失效」当事务失效的根因引用，不重讲 AOP 概念；`40-Bean生命周期与循环依赖.md`：`@EnableTransactionManagement` 注册的后置处理器何时包装 Bean、「拆 Bean」修自调用与循环依赖的取舍。
- `31-反射与注解.md`：第六节 JDK 代理 vs CGLIB 与 `final` —— 注解无逻辑、代理才有力；`38-SpringMVC请求流程与Web层.md`：`@Cacheable` 等同类注解的代理机制、统一异常处理与事务提交的先后边界。
- `35-线程池与线程协作.md`：ThreadLocal 失效与池化串号 = 「事务不跨线程」「`@Async` 各自独立」的根因，以及 `@Scheduled`/`@Async` 的池参数结论。
- `18-JDBC数据库编程.md`：`setAutoCommit`/`commit`/`rollback` 是事务原语，连接池上限决定 `REQUIRES_NEW` 是否安全；`19-JPA与SpringDataJPA.md` / `21-持久层进阶JPA与MyBatisPlus.md`：`@Entity`/Repository 与审计不在此重复，`@Version`、`OptimisticLockerInnerInterceptor`、多数据源、逻辑删除见 21。
- `23-Redis缓存.md`（缓存与 DB 一致性、分布式锁）、`24-消息队列与微服务.md` + `27-Kafka流式处理.md`（不要在事务里发消息；事务消息与幂等消费）。
- `03-mysql/09-事务.md`（ACID/隔离级别/MVCC）、`03-mysql/16-锁.md`（行锁/间隙锁/死锁/长事务 MDL 之坑）、`03-mysql/10-存储引擎.md`（MyISAM 无事务）、`03-mysql/17-InnoDB引擎.md`（undo/redo 与版本链）、`03-mysql/21-分库分表.md`（跨库事务来源）、`03-mysql/22-读写分离.md`（`readOnly` 的路由收益）。
> 本篇定位：**应用/连接层如何把多个 DB 操作绑成一次事务**；数据库内部如何保证一致性，一律回 mysql 目录。
