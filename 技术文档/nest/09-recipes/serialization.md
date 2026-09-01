# Recipes - 序列化（Serialization）

> 来源：NestJS 中文官方文档 `https://docs.nestjs.cn/techniques/serialization`（最后更新 2026/8/9）
> 系列位置：`09-recipes` 第六章。序列化 = 控制"返回给客户端的字段"，与 `validation.md`（入参）对应，是"出参"安全。

## 一、为什么要序列化控制

数据库实体常含敏感字段（密码、盐、内部标记）。直接 `return entity` 会把它们也发给前端。序列化用 `class-transformer` 装饰器决定**哪些字段输出、哪些隐藏、如何变形**。

## 二、安装

```bash
npm i class-transformer class-validator
# serialization 复用 validation 的依赖
```

## 三、在实体上声明输出形态

```ts
import { Exclude, Expose } from 'class-transformer';

export class UserEntity {
  id: number;
  email: string;

  @Exclude()            // 永远不输出
  password: string;

  @Expose({ name: 'fullName' })  // 改名输出
  name: string;

  @Expose({ groups: ['admin'] })  // 仅 admin 分组可见
  internalNote: string;
}
```

## 四、返回时转换

```ts
import { plainToInstance } from 'class-transformer';

@Get(':id')
findOne(@Param('id') id: string) {
  const user = this.usersService.findById(id);  // 含 password
  return plainToInstance(UserEntity, user);       // @Exclude 生效，password 被剥离
}
```

- `plainToInstance(UserEntity, plain)` 把普通对象按装饰器规则转成实例并控制输出。
- 配合全局 `ClassSerializerInterceptor` 可自动执行（下）。

## 五、全局 ClassSerializerInterceptor

```ts
// main.ts
app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
```

之后 Controller 返回实体类实例时，自动按 `@Exclude/@Expose` 序列化：

```ts
@Get(':id')
findOne(@Param('id') id: string): UserEntity {
  return this.usersService.findById(id);  // 自动剥离 password
}
```

⚠️ 必须返回**类实例**（而非 plain object）拦截器才生效；用 `plainToInstance` 包一层最稳。

## 六、分组/版本控制输出

```ts
@Expose({ groups: ['admin'] }) secret: string;

// 读取时指定组
plainToInstance(UserEntity, data, { groups: ['admin'] });
```

适合"普通用户看不到、管理员能看到"的字段。

## 七、要点

| 需求 | 做法 |
|------|------|
| 隐藏字段 | `@Exclude()` |
| 改名/变形 | `@Expose({ name })` |
| 自动序列化 | 全局 `ClassSerializerInterceptor` + 返回类实例 |
| 按角色输出 | `@Expose({ groups })` |

> 与 `validation.md` 互补：validation 管"进"（DTO 校验），serialization 管"出"（实体脱敏）。两者都靠 `class-transformer`，但方向相反。

## 下一篇

→ `task-scheduling.md`：定时任务。
