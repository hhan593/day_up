# 03 · Spring 事务失效实战清单

> `@Transactional` 是生产事故重灾区。本篇是**失效场景清单**：每条给错误代码、现象、修复。
> 传播行为/隔离级别理论见 `../java-middle/39-Spring事务与传播机制.md`、`../springboot/README.md#七事务管理`。

---

## 总原理（先懂一句话）

`@Transactional` 基于 **AOP 代理**：Spring 生成代理对象，在**外部调用代理方法时**开事务。所以一切失效，根源几乎都是——**事务切面没被触发，或事务上下文断了**。

---

## ① 同类自调用（最高频，没有之一）

```java
@Service
public class OrderService {
    public void create(Order o) {
        saveOrder(o);          // ❌ this.saveOrder()，绕过了代理 → 无事务
    }

    @Transactional
    public void saveOrder(Order o) { ... }
}
```

- **现象**：saveOrder 里第二条 insert 失败，第一条不回滚。
- **修复**（三选一）：
  1. 拆类：把 saveOrder 挪到另一个 Service（最简单，推荐）。
  2. 注入自身代理：`@Autowired private OrderService self;` 然后 `self.saveOrder(o)`。
  3. `AopContext.currentProxy()`（需 `@EnableAspectJAutoProxy(exposeProxy = true)`）。

---

## ② 方法不是 public

```java
@Transactional
protected void save() { ... }   // ❌ CGLIB 代理不增强非 public 方法，静默失效
```

- **现象**：无报错、无事务，最难发现的一种。
- **修复**：改 public。** team 规约：`@Transactional` 只标注在 public 方法上，用 ArchUnit/Checkstyle 固化。**

---

## ③ 异常被 try-catch 吞掉

```java
@Transactional
public void save() {
    try {
        insertA();
        insertB();          // 这里抛异常
    } catch (Exception e) {
        log.error("保存失败", e);   // ❌ 异常没抛出去，代理看不到 → 不回滚
    }
}
```

- **修复**：要么不 catch，要么 catch 后 `throw new RuntimeException(e)`，要么手动 `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`。

---

## ④ 抛了受检异常，默认不回滚

```java
@Transactional                       // ❌ 默认只回滚 RuntimeException/Error
public void save() throws Exception {
    insertA();
    if (bad) throw new Exception("业务校验失败");   // 受检异常 → 已插入的不回滚
}
```

- **修复**：`@Transactional(rollbackFor = Exception.class)`。
- **实战规约**：**团队统一所有 `@Transactional` 都写 `rollbackFor = Exception.class`**，不依赖默认值。

---

## ⑤ 事务方法里开新线程

```java
@Transactional
public void save() {
    insertA();
    CompletableFuture.runAsync(() -> insertB());   // ❌ B 在新线程，拿不到当前事务连接
    // insertA 未提交，B 线程读不到；A 回滚了 B 照样插进去了
}
```

- **修复**：线程里的操作要么独立成一个新事务（接受最终一致 + 补偿），要么不要放进事务方法。**事务与线程池天然不兼容**，别硬凑。

---

## ⑥ 事务里调远程接口（慢事务，另一类事故）

```java
@Transactional
public void createOrder(Order o) {
    insertOrder(o);
    paymentClient.pay(o);       // ❌ 支付接口 3 秒超时 → DB 连接被霸占 3 秒
    insertOrderItem(o);         // 高并发下连接池瞬间被吸干（见 01 篇场景五）
}
```

- **修复**：远程调用移出事务；用"本地先落库(状态=处理中) → 远程成功后回调更新"的模式。
- 这是**连接池耗尽**类故障的第一根因（见 `01-线上故障排查实战手册.md` 场景五）。

---

## ⑦ 传播行为误用：REQUIRES_NEW 与 REQUIRED 混搭

```java
@Transactional
public void outer() {
    insertA();
    try {
        self.inner();           // inner 是 REQUIRES_NEW：挂起外层事务，新开一个
    } catch (Exception e) {
        // 捕获了，外层继续
    }
    insertB();
}
```

- **坑**：REQUIRES_NEW 的新事务提交了，但**外层事务稍后回滚时，新事务的数据不会跟着回滚**——数据与预期不符。且外层事务持有连接、内层又拿一个连接，**池小时会自我死锁**（两个方法互相等连接）。
- **经验**：REQUIRES_NEW 只用于"无论主流程成败都必须独立落库"的场景（如操作日志、审计），且要评估连接数翻倍。

---

## ⑧ bean 不是 Spring 管理的

```java
OrderService s = new OrderService();   // ❌ 手动 new，没有代理，@Transactional 是摆设
s.save();
```

- 修复：交给容器（`@Autowired`），或 `ApplicationContext.getBean()`。

---

## ⑨ 引擎/环境不支持事务

- MySQL 表引擎是 **MyISAM**（`../mysql/10-存储引擎.md`）：SQL 全部照常执行，回滚无效。
- 多数据源场景：`@Transactional` 只管**主数据源**的事务管理器，另一个库不受控。
- **修复**：InnoDB；多库用指定 `transactionManager`，或放弃跨库强一致改最终一致（`../distributed/README.md#六分布式事务`）。

---

## ⑩ NESTED 的依赖条件

- `Propagation.NESTED` 基于 JDBC savepoint，**只对 DataSourceTransactionManager 有效**，JPA/Hibernate 下直接报错或行为不符预期。

---

## ⑪ 事后读取的"幻觉"：事务未提交时的跨方法读

```java
@Transactional
public void create(Order o) {
    orderMapper.insert(o);
    // 同类里再查一次并依赖其他服务能看到 —— 对方读不到未提交数据（RC/RR 下）
    remoteService.notify(orderMapper.selectById(o.getId()));   // 本地能看到，远程看不到
}
```

- **经验**：事务内发 MQ/通知，接收方可能读到**旧数据**。要么事务提交后再发（`TransactionSynchronizationManager.registerSynchronization` 的 afterCommit），要么用事务消息/`@TransactionalEventListener(phase = AFTER_COMMIT)`。

---

## ⑫ 大事务：能跑，但是定时炸弹

特征：一个 `@Transactional` 方法几百行、包揽校验+计算+多次DB+远程调用。

危害：连接占用久 → 池耗尽；undo log 巨大；锁持有久 → 死锁/阻塞（`../mysql/16-锁.md`）；主从延迟。

**改造三板斧**：
1. 查询、校验、远程调用移出事务，事务只包 DB 写。
2. `@Transactional` 下沉到最内层的写方法（**事务尽量小**）。
3. 需要读-改-写原子性时，用 DB 乐观锁代替长事务。

---

## 自查清单（Code Review 用）

```text
□ @Transactional 方法是 public？
□ 有没有被同类自调用？（搜类内方法名）
□ rollbackFor = Exception.class 写了吗？
□ 方法体里有没有 try-catch 吞异常？
□ 有没有远程调用 / 消息发送 / 新开线程？
□ 方法行数 > 100 行？（大事务嫌疑）
□ 涉及的表是 InnoDB？
□ 事务内读 DB 后发给外部系统？（提交前可见性问题）
```

## 关联文档

- 传播行为/隔离级别全解：`../java-middle/39-Spring事务与传播机制.md`
- MySQL 事务与锁：`../mysql/09-事务.md`、`../mysql/16-锁.md`
- 连接池事故：`01-线上故障排查实战手册.md` 场景五
