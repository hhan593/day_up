# 18. Go Web 框架：Gin 与 Echo

> 来源可信度：**结构确认 + 标准实践**（Gin 官方文档站点 404 重定向，以标准 API 知识撰写并标注；Echo 公开 API）
> 关联：`09-http-api-net-http.md`、`11-context-in-server.md`

## 1. 为什么还要框架

标准库 `net/http` 够用，但缺：路由参数、分组、中间件链、绑定/校验。Gin/Echo 在 `net/http` 之上补这些。

## 2. Gin 核心

```go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()

    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id")            // 路径参数
        name := c.Query("name")        // 查询参数
        c.JSON(200, gin.H{"id": id, "name": name})
    })

    r.POST("/users", func(c *gin.Context) {
        var u struct{ Name string `json:"name" binding:"required"` }
        if err := c.ShouldBindJSON(&u); err != nil {
            c.JSON(400, gin.H{"error": err.Error()}); return
        }
        c.JSON(201, u)
    })

    r.Run(":8080")
}
```

- `gin.Default()` 含日志 + 恢复中间件。
- 路由分组：`r.Group("/api/v1")`。
- 中间件：`r.Use(authMiddleware())`，签名 `func(*gin.Context)`。
- 绑定/校验：`ShouldBindJSON` + struct tag `binding`。

## 3. Gin 中间件示例

```go
func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"})
            return
        }
        c.Next() // 放行
    }
}
```

## 4. Echo 对比

```go
import "github.com/labstack/echo/v4"

e := echo.New()
e.GET("/users/:id", func(c echo.Context) error {
    return c.JSON(200, map[string]string{"id": c.Param("id")})
})
e.Start(":8080")
```

- Echo 中间件签名 `func(echo.HandlerFunc) echo.HandlerFunc`，更函数式。
- 内置更多：HTTP/2、自动 TLS、更完善的 binder。

## 5. Gin vs Echo

| 维度 | Gin | Echo |
|------|-----|------|
| 性能 | 极高 | 极高（略优） |
| 生态 | 最大 | 丰富 |
| 中间件模型 | `c.Next()` | 包装式 |
| 上手 | 简单 | 简单 |

## 6. 与 net/http 互通

Gin/Echo 的 handler 最终都能包成 `http.Handler`；反向也行——它们可挂到标准 `http.Server`，复用 `11-context-in-server.md` 的超时/优雅关停。

```go
srv := &http.Server{ Addr: ":8080", Handler: r }
srv.ListenAndServe()
```

## 7. 一句话总结

> Gin 用 `gin.Default()`+`c.Param/Query/ShouldBindJSON` 快速建 API，`r.Use` 串中间件；Echo 中间件更函数式。二者都跑在 `net/http` 之上，可无缝接入标准库 Server 做优雅关停。
