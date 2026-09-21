# 04 - 异常处理（Exceptions）

> 来源：Oracle 官方《The Java™ Tutorials》— Essential Java Classes > Exceptions
> 原文：https://docs.oracle.com/javase/tutorial/essential/exceptions/index.html

Java 用异常机制把正常逻辑和错误处理分离，比返回错误码更健壮。

---

## 一、异常层次结构

```
Throwable
├── Error          // 严重系统错误，不应捕获（如 OutOfMemoryError）
└── Exception      // 程序可处理的异常
    ├── RuntimeException        // 未检查（unchecked）
    └── 其他 Exception（如 IOException） // 已检查（checked）
```

- **已检查异常（checked）**：必须 `try-catch` 或在方法签名 `throws` 声明，否则编译不过。
- **未检查异常（unchecked）**：`RuntimeException` 及其子类，编译器不强制处理（如 `NullPointerException`、`ArrayIndexOutOfBoundsException`）。

---

## 二、try-catch-finally

```java
try {
    int x = Integer.parseInt("abc"); // 可能 NumberFormatException
} catch (NumberFormatException e) {
    System.out.println("格式错误：" + e.getMessage());
} finally {
    System.out.println("无论如何都会执行（常用于清理）");
}
```

- 可多个 `catch` 从具体到宽泛；Java 7+ 支持多异常合并：`catch (A | B e)`。
- `finally` 在 `return` 之前执行（除非 `System.exit`）。

---

## 三、try-with-resources（Java 7+）

实现 `AutoCloseable` 的资源（如 `InputStream`、`Connection`）会自动关闭，无需手写 finally。

```java
try (BufferedReader br = new BufferedReader(new FileReader("a.txt"));
     PrintWriter pw = new PrintWriter("b.txt")) {
    pw.println(br.readLine());
} catch (IOException e) {
    e.printStackTrace();
}
// 离开 try 块时 br、pw 自动按声明逆序关闭
```

---

## 四、抛出异常

```java
// 声明可能抛出的已检查异常
public void read() throws IOException {
    if (file == null) {
        throw new IllegalArgumentException("file 不能为 null");
    }
}
```

- `throw` 显式抛出异常实例。
- `throws` 在方法签名声明，把处理责任交给调用者。

### 链式异常（Chained Exceptions）
保留原始原因：
```java
try { ... }
catch (IOException e) { throw new RuntimeException("包装", e); }
```

---

## 五、自定义异常

```java
public class BusinessException extends RuntimeException {
    private final int code;
    public BusinessException(int code, String msg) {
        super(msg); this.code = code;
    }
    public int getCode() { return code; }
}
```

- 业务异常通常继承 `RuntimeException`（未检查），避免到处 `throws`。
- 需被调用方强制处理的，才继承 `Exception`（已检查）。

---

## 六、最佳实践

1. 不要吞掉异常（空 `catch` 块）。
2. 用具体异常而非笼统 `catch (Exception e)`。
3. IO / 数据库连接优先用 try-with-resources。
4. 在合适层级处理异常，不要在底层默默 `catch` 后返回 `null`。

---

## 七、与系列其他文档的关系

- 异常是错误传播机制，类似 TS 的 `throw new Error` + `try/catch`，但 Java 区分 checked/unchecked（TS 无此区分）。
- 资源清理类似 TS 的 `try/finally` 或 `using`（C#）；Java try-with-resources 最优雅。
- 对比 Nest 后端的异常过滤器（`05-NestJS异常过滤器`），Java 这里用语言级机制，Nest 用框架级 `@Catch()`。
