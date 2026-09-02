# NestJS 序列化（Serialization）技术详解

> 来源：https://docs.nestjs.cn/techniques/serialization
> 作用：对象返回响应前做"清理与转换"（如去掉 password、计算 fullName、字段改名）。
> 基于 `class-transformer` 的 `ClassSerializerInterceptor` + 装饰器。

---

## 一、核心概念

- `ClassSerializerInterceptor`：拦截器，调用 `instanceToPlain()` 把返回值对象转成纯 JSON，并应用实体/DTO 上的 `class-transformer` 装饰器。
- 目的：把"数据库实体"和"对外 DTO"分离，隐藏敏感字段。
- **必须返回类的实例**才能正确序列化（普通 `{...}` 对象不会应用装饰器，除非用 `@SerializeOptions({ type })` 强转）。

**对比其他框架**：
- 类似 **Spring 的 `@JsonIgnore` / Jackson 序列化注解**，但 Nest 是基于实体类上的 `class-transformer` 装饰器，且用拦截器统一套用。
- 与前面 `validation.md` 的 `class-validator` 是"一对"：`class-validator` 管"进来校验"，`class-transformer` 管"出去转换"。

---

## 二、基础用法（排除密码）

```ts
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}

@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({ id: 1, firstName: 'John', lastName: 'Doe', password: 'secret' });
}
// 响应：{"id":1,"firstName":"John","lastName":"Doe"}
```

---

## 三、Exclude / Expose / Transform

### @Exclude —— 排除字段
```ts
@Exclude() password: string;
```

### @Expose —— 别名 / 计算属性
```ts
@Expose()
get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
}
```

### @Transform —— 转换（如只返回关联对象的某字段）
```ts
@Transform(({ value }) => value.name)
role: RoleEntity;
```

> 对比：Spring 里这是 `@JsonIgnore`、`@JsonProperty("full_name")`、`@JsonSerialize(using=...)`，Nest 把这套搬到了 TS 装饰器上。

---

## 四、传递选项（@SerializeOptions）

向底层 `instanceToPlain()` 传配置：
```ts
import { SerializeOptions } from '@nestjs/common';

@SerializeOptions({ excludePrefixes: ['_'] })
@Get()
findOne(): UserEntity { return new UserEntity(); }
```

---

## 五、转换普通对象（type 强转）

不想每次 `new UserEntity()`，可在控制器级声明 `type`：
```ts
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ type: UserEntity })
@Get()
findOne(@Query() { id }: { id: number }): UserEntity {
  if (id === 1) return { id: 1, firstName: 'John', lastName: 'Doe', password: 'secret' };
  return { id: 2, firstName: 'Kamil', lastName: 'Mysliwiec', password: 'secret2' };
}
```
- 返回普通对象也会自动转成 `UserEntity` 实例并应用装饰器。
- 好处：代码简洁 + 借助 TS 返回类型检查结构匹配。

---

## 六、WebSocket / 微服务

`ClassSerializerInterceptor` 对 HTTP / WS / 微服务运作方式完全相同。

---

## 七、注意事项

1. 序列化**不适用于** `StreamableFile` 响应（直接走流，不进拦截器转换）。
2. `groups` 等高级用法见 `class-transformer` 官方文档（按场景分组序列化）。
3. 返回类型必须是"可被实例化的类"，`interface`/`type` 编译后擦除，无法序列化。

> 口诀：**"实体带装饰，拦截器套用；@Exclude 藏秘密，@Expose 算新值，@Transform 再加工。"**
