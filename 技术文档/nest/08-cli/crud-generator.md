# NestJS CLI CRUD 生成器（CRUD Generator）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/recipes/crud-generator/`（最后更新 2026/8/9）
> 系列位置：`08-cli` 第六章。本文讲 `nest g resource`——一键生成整张表的增删改查骨架，省掉重复样板。

## 一、为什么需要它

为每个实体写 CRUD，都要建 module / service / controller / DTO / entity 五件套，重复劳动极大。CLI 提供 **schematic** 自动生成全部样板：

```bash
# 交互式
nest g resource
# 指定名称
nest g resource users
```

> 仅支持 TypeScript 项目（JS 项目不适用）。

## 二、交互提问

运行后会问几个问题（以 `nest g resource users` 为例）：

1. **What transport layer do you use?**（传输层）
   - REST API（默认，生成 HTTP 控制器）
   - GraphQL (code first)
   - GraphQL (schema first)
   - 微服务（Redis/MQTT/NATS/RabbitMQ/Kafka/gRPC 等）
   - WebSocket 网关
2. **Would you like to generate CRUD entry points?**（是否生成 CRUD 入口）
   - Yes → 生成全部 CRUD 端点占位
   - No → 仅生成基础结构，不含 CRUD 路由

## 三、生成文件清单

以 **GraphQL (code first)** 为例，生成：

```
src/users/
  users.module.ts          # 模块
  users.resolver.spec.ts   # 解析器测试
  users.resolver.ts        # 解析器（REST 下是 controller）
  users.service.spec.ts    # 服务测试
  users.service.ts         # 服务（业务逻辑占位）
  dto/
    create-user.input.ts   # 创建 DTO/输入（REST 下是 create-user.dto.ts）
    update-user.input.ts   # 更新 DTO/输入
  entities/
    user.entity.ts         # 实体类
# 自动更新 app.module.ts 加入 UsersModule
```

**REST API** 的差异：
- 生成 `users.controller.ts` 而非 `resolver.ts`
- DTO 文件后缀是 `.dto.ts`（如 `create-user.dto.ts`）

## 四、REST CRUD 样板内容

生成的 `UsersController` 自动衔接 Service：

```ts
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(createUserDto);
}

@Get()
findAll() {
  return this.usersService.findAll();
}

@Get(':id')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(+id);
}

@Patch(':id')
update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  return this.usersService.update(+id, updateUserDto);
}

@Delete(':id')
remove(@Param('id') id: string) {
  return this.usersService.remove(+id);
}
```

所有端点**自动衔接 Service**，无需手动定义路由占位。Service 里是占位实现（返回 `undefined` 或抛 `TODO`），业务自己填。

## 五、transport 选项对照

| 选项 | 生成产物 |
|------|----------|
| REST API | `users.controller.ts` + `.dto.ts` |
| GraphQL (code first) | `users.resolver.ts` + `.input.ts` + `@ObjectType` entity |
| GraphQL (schema first) | `users.resolver.ts` + SDL 相关 |
| 微服务 | 带 `@MessagePattern` 的 controller |
| WebSocket | `@SubscribeMessage` 网关 |

> 衔接：`04-microservices`、`05-websockets`、`06-graphql` 三章讲解对应 transport 的原理。

## 六、spec 选项

- 默认生成 `.spec.ts` 测试文件（`users.service.spec.ts` 等）。
- 传 `--no-spec` 跳过：

```bash
nest g resource users --no-spec
```

## 七、实用组合

```bash
# 最常用的 REST 全 CRUD，不要测试文件
nest g resource users --no-spec

# GraphQL code first，带 CRUD，带测试
nest g resource posts
# 交互选 GraphQL (code first) → Yes
```

> 价值点：CRUD generator 把"建一张表"的 5 个文件 + 5 个路由一次性落地，让你只聚焦业务逻辑。配合 `02-techniques/validation.md` 的 `class-validator` DTO 校验，就是标准生产骨架。

## 衔接

- DTO 校验体系见 `02-techniques/validation.md`。
- 生成的 resolver/controller 原理见 `01-fundamentals`（controllers / custom-decorators）。
- GraphQL 选项细节见 `06-graphql`。

## 系列收尾

→ `README.md`：CLI 章节索引与跨章节衔接。
