# 方案 03：电商 Demo（Mini Shop）

> 复杂度：⭐⭐⭐　重点练手角色守卫、复杂管道、拦截器、事务/连接池、模块共享。

## 1. 项目目标

一个精简电商后台：买家浏览商品、下单；卖家管理商品与订单；管理员审核类目。覆盖本项目中角色守卫（`RoleGuard`）、复杂业务管道、拦截器（本项目架构图标注「后续增加」的点）、事务处理等进阶知识。

## 2. 功能清单

- **买家**：商品列表/详情、加入购物车、下单、查看订单
- **卖家**：发布/下架商品、处理订单（发货）
- **管理员**：类目管理、用户角色调整
- **横切**：角色守卫、金额校验管道、响应耗时拦截器、订单事务

## 3. 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | NestJS 10、TypeORM + PostgreSQL、JWT、class-validator、RxJS |
| 前端 | Vue 3 + Vite + TS（或 React 18 + Vite + TS） |
| 共享 | pnpm workspace monorepo |

## 4. 目录结构（server）

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/role.guard.ts         # 角色守卫（复用 03-守卫 RoleGuard）
│   ├── decorators/roles.decorator.ts# @Roles()（复用 06-装饰器）
│   ├── pipes/money.pipe.ts          # 金额/库存校验管道
│   ├── interceptors/logging.interceptor.ts  # 响应拦截器（补 11-架构图"后续增加"）
│   └── filters/
├── modules/
│   ├── auth/        # 含角色
│   ├── users/
│   ├── products/    # 卖家管理
│   ├── orders/      # 事务 + 库存扣减
│   └── categories/  # 管理员
└── shared/
```

## 5. 数据库设计

- **User**：id, username, passwordHash, role(enum: BUYER/SELLER/ADMIN)
- **Product**：id, name, price, stock, sellerId, categoryId, status
- **Order**：id, buyerId, total, status, createdAt
- **OrderItem**：id, orderId, productId, qty, price

## 6. API 设计（示例）

| 方法 | 路径 | 守卫 | 说明 |
| --- | --- | --- | --- |
| GET | /products | - | 商品列表 |
| POST | /products | Jwt+Roles(SELLER) | 发布商品 |
| POST | /orders | Jwt+Roles(BUYER) | 下单（事务 + 库存管道） |
| PATCH | /orders/:id/ship | Jwt+Roles(SELLER) | 发货 |
| POST | /categories | Jwt+Roles(ADMIN) | 新建类目 |

## 7. NestJS 知识点映射

- **角色守卫**：`RoleGuard` + `@Roles()` 元数据存储（复用 `03-守卫`、`06-装饰器`）
- **复杂管道**：`MoneyPipe` / `StockPipe` 在下单时校验金额与库存，失败抛业务异常
- **拦截器（补架构图）**：`LoggingInterceptor` 记录响应耗时、统一包装响应（对应 `11-架构图` 中标注「后续增加」的拦截器位置）
- **事务**：`orders` 模块用 `DataSource.transaction` 保证下单与库存扣减原子性
- **模块共享**：`UsersModule` 导出 `UserService` 给多个模块；`ProductsModule` 被 `OrdersModule` 依赖

## 8. 前端要点

- 角色路由守卫（前端）与后端 `@Roles` 对齐
- 商品卡片、购物车、订单流
- 管理后台独立布局

## 9. 详细实现步骤（按优先级分步）

> 本方案复杂度 ⭐⭐⭐，建议先完成 01、02。重点新增：**角色守卫 + `@Roles()`、复杂业务管道、响应拦截器、下单事务**。

### 步骤 1：PostgreSQL 连接 + 全局守卫/拦截器（知识点：动态模块 / 拦截器）

- **目标**：接 PG；全局挂载角色守卫与日志拦截器。
- **命令**：`pnpm add pg`；在 `app.module.ts`：
  ```ts
  TypeOrmModule.forRootAsync({  // 异步配置，读取 ConfigService（见 doc 23）
    imports: [ConfigModule], inject: [ConfigService],
    useFactory: (c: ConfigService) => ({ type:'postgres', host:c.get('DB_HOST'), /* ... */ autoLoadEntities:true }),
  })
  ```
- **拦截器**：`src/common/interceptors/logging.interceptor.ts` 用 `tap` 记录响应耗时；`main.ts` 或 `app.module.ts` 的 `provide: APP_INTERCEPTOR` 全局注册（对应架构图「后续增加」的拦截器位置）。

### 步骤 2：Auth + 角色体系（知识点：角色守卫 / 自定义装饰器）

- **目标**：用户带 `role`；接口按角色放行。
- **文件**：
  - `src/common/decorators/roles.decorator.ts`：`export const Roles = (...r:Role[]) => SetMetadata('role', r);`
  - `src/common/guards/role.guard.ts`：`reflector.get('role', ctx.getHandler())`，比对 `req.user.role`，不符抛 `403 Forbidden`。
  - 用法：`@Roles('SELLER') @UseGuards(JwtAuthGuard, RoleGuard) @Post('products')`。

### 步骤 3：ProductsModule 卖家 CRUD + MoneyPipe（知识点：复杂管道）

- **目标**：卖家管理商品；发布时校验价格合法。
- **文件**：`src/common/pipes/money.pipe.ts`（实现 `PipeTransform`，把字符串金额转 `number` 并校验 `> 0`，否则抛 `BadRequestException`）；`@Body('price', MoneyPipe)`。

### 步骤 4：OrdersModule 下单事务 + StockPipe（知识点：事务 / 管道协作）

- **目标**：下单原子性扣库存，库存不足回滚。
- **文件**：`src/common/pipes/stock.pipe.ts`（下单前查库存）；`orders.service.ts`：
  ```ts
  await this.dataSource.transaction(async manager => {
    await manager.decrement(Product, {id}, { stock: qty }); // 扣库存
    await manager.save(order);                              // 落订单
  });
  ```
- **验收**：并发下单或库存不足时，数据无脏写（事务回滚），返回统一业务错误体。

### 步骤 5：CategoriesModule（管理员）

- **目标**：管理员管类目；`@Roles('ADMIN')` 保护。
- **文件**：`categories/categories.controller.ts` + service + entity。

### 步骤 6：前端三端

- **目标**：买家/卖家/管理员三套布局；前端角色路由守卫与后端 `@Roles` 对齐。

> 完成后你已掌握「守卫+管道+拦截器+事务」全链路，强烈建议再挑战 **04 实时聊天室**。

## 10. 验收标准

- [ ] 非 SELLER 角色调用发布商品返回 403
- [ ] 下单时库存不足返回业务错误，且数据无脏写（事务回滚）
- [ ] 拦截器记录每个请求响应耗时
- [ ] 管理员可调整用户角色
