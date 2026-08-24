# NestJS 学习架构图（可随学习进度更新）

> 本图基于本项目**真实代码**绘制，用于梳理 NestJS 核心机制的**挂载位置**与**一次请求的真实流转**。
> 图中 🟡 标注「后续增加」的部分 = 尚未实现、已规划要学习的机制（拦截器）。
> 后续学习到新机制时，只需在对应 Mermaid 源码里增删节点，图自动随文本更新。

![NestJS 学习架构示意图](images/NestJS学习架构示意图.png)

---

## 一、机制挂载位置图（每个机制注册在哪一层）

下图按「全局 → 控制器 → 路由/方法」三级，标出本项目里每个机制**具体挂在哪**。

```mermaid
graph TD
    subgraph 全局级["🌐 全局级（影响所有路由）"]
        G_MW["中间件<br/>• app.module: LoggerMiddleware（类,exclude cats）<br/>• main.ts: logger_funMidderware（函数）"]
        G_GD["守卫<br/>• app.module: APP_GUARD → RoleGuard"]
        G_PP["管道<br/>• main.ts: app.useGlobalPipes(ValidationPipe)"]
        G_EF["异常过滤器<br/>• app.module: APP_FILTER → CatchEverythingFilter(外层)<br/>• app.module: APP_FILTER → HttpExceptionFilter(内层)"]
        G_IC["拦截器<br/>⏳后续增加（APP_INTERCEPTOR）"]
    end

    subgraph 控制器级["🎯 控制器级（@Controller 上）"]
        C_CATS["CatsController<br/>@UseFilters(HttpExceptionFilter)<br/>@Role(['admin']) 类装饰器"]
        C_DOGS["DogsController<br/>@UseGuards(RoleGuard)"]
    end

    subgraph 方法级["📍 路由/方法级（单个 @Get/@Post 上）"]
        M_CATS["cats 各方法<br/>@UseFilters(HttpExceptionFilter)<br/>@SetMetadata('role',['admin']) (find)<br/>@Role(['admin']) (create)<br/>@Param(id, DefaultValuePipe+ParseIntPipe)"]
        M_DOGS["dogs 各方法<br/>@Body(new ValidationPipe()) (create)<br/>@Param(id, ParseIntPipe) (findOne)"]
        M_USER["user 方法<br/>@Param(id, UserByIdPipe) (findOne 取实体)"]
    end

    G_MW -.作用.-> C_CATS
    G_MW -.作用.-> C_DOGS
    G_GD -.作用.-> C_CATS
    G_GD -.作用.-> C_DOGS
    G_PP -.作用.-> M_DOGS
    G_EF -.兜底.-> C_CATS

    C_CATS -.包含.-> M_CATS
    C_DOGS -.包含.-> M_DOGS

    classDef done fill:#d4f4dd,stroke:#2e7d32,color:#000;
    classDef pending fill:#fff3cd,stroke:#b8860b,color:#000;
    class G_MW,G_GD,G_PP,G_EF,C_CATS,C_DOGS,M_CATS,M_DOGS,M_USER done;
    class G_IC pending;
```

> 说明：
> - **类中间件** `LoggerMiddleware` 通过 `consumer.apply().exclude(cats).forRoutes('*')` 全局生效但排除 cats；
> - **函数式中间件** `logger_funMidderware` 通过 `app.use()` 全局生效（无 DI、无 exclude）；
> - **RoleGuard** 同时存在于「全局 APP_GUARD」与「DogsController 控制器级」，cats 则用 `@Role`/`@SetMetadata` 元数据在方法级控制；
> - **ValidationPipe** 全局注册 + dogs `create` 方法级 `new ValidationPipe()` 双重演示；
> - **拦截器**尚未实现，预留全局 `APP_INTERCEPTOR` 位置。

---

## 二、一次真实请求的完整流转（POST /dogs）

下图细化一次请求经过的所有节点、参数转换、以及异常分支。

```mermaid
sequenceDiagram
    autonumber
    participant C as 客户端
    participant MW as 全局中间件
    participant GD as RoleGuard(全局)
    participant PPg as ValidationPipe(全局)
    participant CT as DogsController.create
    participant PPm as ValidationPipe(方法级 new)
    participant SV as DogsService
    participant EF as 异常过滤器

    C->>MW: POST /dogs  {name,age}
    Note over MW: logger_funMidderware 记录请求(无DI)<br/>+ LoggerMiddleware(类,注入LoggerService,已排除cats故此处生效)
    MW->>GD: 透传请求
    GD->>GD: canActivate?<br/>Reflector读@Role元数据
    alt 无角色/未登录
        GD-->>EF: 抛 403
        EF-->>C: 标准错误响应
    else 放行
        GD->>PPg: 进入（全局管道已作用于body）
        PPg->>PPm: 参数到达方法级
        PPm->>PPm: 校验 CreateDogDto<br/>(class-validator)
        alt 校验失败
            PPm-->>EF: 抛 BadRequestException
            EF-->>C: 400 + errors字段
        else 校验通过
            PPm->>CT: 传入转换后的 DTO
            CT->>SV: dogsService.create(dto)
            SV-->>CT: 结果
            CT-->>C: 200 成功响应
        end
    end

    Note over EF: CatchEverythingFilter(外层) 兜底一切<br/>HttpExceptionFilter(内层) 处理HttpException
```

### 对照：带管道的 GET /user/:id（取实体）

```mermaid
sequenceDiagram
    participant C as 客户端
    participant GD as RoleGuard
    participant PP as UserByIdPipe(@Param)
    participant CT as UserController.findOne
    participant EF as 异常过滤器

    C->>GD: GET /user/2
    GD->>GD: canActivate 通过
    GD->>PP: 传入 id='2'
    PP->>PP: parseInt → 调 userService.findOne(2)
    alt 用户不存在
        PP-->>EF: 抛 NotFoundException(404)
        EF-->>C: 404 错误响应
    else 找到
        PP->>CT: 直接返回 UserEntity 对象
        CT-->>C: 200 返回实体(无需再查库)
    end
```

---

## 三、机制之间的关系与联系

| 机制 | 作用 | 能否 DI | 本项目挂载位置 | 状态 |
| --- | --- | --- | --- | --- |
| 中间件 | 通用请求处理（日志） | 类可 | 全局（app.use / consumer.apply） | ★已实现 |
| 守卫 | 鉴权/权限 | 可 | 全局 APP_GUARD + 控制器/方法级 | ★已实现 |
| 拦截器 | 转换/缓存/日志/超时 | 可 | ⏳预留 APP_INTERCEPTOR | ⏳后续增加 |
| 管道 | 参数转换/校验 | 可 | 全局 + 方法级（@Param/@Body） | ★已实现 |
| 异常过滤器 | 统一错误响应 | 可 | 全局 APP_FILTER（双层） | ★已实现 |

---

## 四、如何随学习进度更新本图

1. **实现拦截器**：把「一、机制挂载位置图」里 `G_IC` 节点换成真实实现，样式 `pending`→`done`；在「三、关系表」改状态。
2. **新增模块/Service**：在对应控制器级/方法级子图补充节点并连线。
3. **新增全局注册**：在「全局级」子图加节点，用 `-.作用.->` 连到受影响控制器。
4. **新增异常类型**：在时序图 `EF` 分支补充即可。

> 本文件使用 Mermaid 语法，VS Code / GitHub / GitLab 均可直接渲染，修改文本即更新图。

