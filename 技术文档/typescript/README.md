# TypeScript 知识文档索引

> 全部基于 **TypeScript 官方文档**（typescriptlang.org handbook，2026/8/31 更新，© Microsoft）抓取整理，部分高级项官网分到 Reference 子页，已用「标准补充」标注。另含 `tsconfig` 未来方向见 TS 5.0 官方博客。

## 文档清单

### 基础（新增，官网权威）
| 文档 | 主题 | 核心内容 |
|------|------|----------|
| `everyday-types.md` | 日常类型 | 原始/数组/any/函数/对象类型、联合、type 别名、interface、字面量类型、null/undefined、非空断言；**type vs interface 官方表述** |
| `narrowing.md` | 类型收窄 | typeof/真值/等值/in/instanceof/类型谓词/断言函数/穷尽性检查 |
| `more-on-functions.md` | 函数进阶 | 可选/默认/剩余参数、函数重载、this 类型、泛型函数、void |
| `classes.md` | 类 | 字段、readonly、参数属性、继承、可见性、存取器、implements、abstract、this 类型、isolatedModules |
| `enums.md` | 枚举 | 数字/字符串/异构/const 枚举、反向映射、环境枚举、as const 替代方案 |
| `creating-types-from-types.md` | 从类型构造类型 | keyof/查找类型、条件类型 + infer、分布式、映射类型 + 键重映射、模板字面量 + 内置字符串工具 |
| `decorators.md` | 装饰器 | 旧 `experimentalDecorators`（Nest 在用）vs TS 5 新标准（Stage 3）全面对比、为何 Nest 不迁移 |
| `modules.md` | 模块系统 | ES Module 导入导出、import type、re-export、动态 import、CommonJS 互操作、模块解析、namespaces |
| `tsconfig.md` | 编译配置 | tsconfig 作用、files/include/exclude、extends、strict 全家桶、装饰器 flag、项目引用、典型 Nest 配置 |

### 原有文档（已存在，互补）
| 文档 | 主题 |
|------|------|
| `typescript-learning-roadmap.md` | 学习路线图 |
| `typescript-cheatsheet.md` | 速查表 |
| `typescript-best-practices.md` | 最佳实践 |
| `typescript-advanced-types.md` | 高级类型（实战技巧，与 `creating-types-from-types.md` 互补） |
| `typescript-interview-questions.md` | 面试题 |
| `typescript-new-features.md` | 新特性 |

## 学习顺序建议

```
入门 → everyday-types → narrowing → more-on-functions → classes
进阶 → enums → modules → tsconfig
高手 → creating-types-from-types → decorators
实战 → 结合下面"衔接"看 Nest 怎么用 TS
```

## 核心机制全景图

```
            ┌─────────────── 值层面 ───────────────┐
            │  classes / enums / functions / modules │
            └───────────────────────────────────────┘
                        │ 类型附着
            ┌─────────────── 类型层面 ──────────────┐
            │ everyday-types / narrowing / creating │
            │ -types-from-types                      │
            └───────────────────────────────────────┘
                        │ 元编程
            ┌─────────────── 元层面 ────────────────┐
            │ decorators（旧标准 Nest 用 / 新标准未来）│
            └───────────────────────────────────────┘
                        │ 工程化开关
            ┌─────────────── 配置层面 ──────────────┐
            │ tsconfig（strict / 装饰器 flag / 模块） │
            └───────────────────────────────────────┘
```

## 高价值坑速查

1. **`strict: true`**：必开，Nest 用 `nest new --strict`。
2. **Nest 必须开两个 flag**：`experimentalDecorators` + `emitDecoratorMetadata`，否则 DI 失效（见 `decorators.md`）。
3. **TS 5 新装饰器 ≠ 旧装饰器**：新标准无元数据、无参数装饰，Nest 暂不用（见 `decorators.md`）。
4. **`null` 收窄**：开 strict 后 `string | null` 必须显式处理；`!` 断言慎用。
5. **`import type`**：配 SWC/Babel/isolatedModules 必须用它分离类型，否则编译报错（见 `modules.md`）。
6. **const enum 陷阱**：isolatedModules 不兼容、跨项目内联值不一致（见 `enums.md`）。
7. **type vs interface**：对象形状优先 interface（可合并），联合/元组/映射用 type（见 `everyday-types.md`）。

## 跨章节衔接

| 本篇知识点 | 衔接 Nest 文档 |
|------------|----------------|
| 装饰器两 flag | `技术文档/nest/01-fundamentals`（所有 `@Injectable`/`@Controller`） |
| 类、参数属性 | `技术文档/nest/09-recipes`（Entity/Service/Controller 类） |
| 类型收窄 | `技术文档/nest/09-recipes/authentication.md`（`instanceof`/`typeof` 判断） |
| 映射/条件类型 | `技术文档/nest/02-techniques`、`04-microservices`（类型推导） |
| import type / 模块 | `技术文档/nest/08-cli/libraries.md`（路径别名）、`02-techniques` |
| tsconfig | `技术文档/nest/08-cli/scripts.md`（builder、compilerOptions） |
| enums | `技术文档/nest/03-security`（角色枚举） |

## 与 Nest 文档体系的关系

`技术文档/nest` 的 9 个章节大量使用本文档的 TS 机制（类、装饰器、类型、模块、tsconfig）。两目录互为"语言地基"与"框架应用"，建议对照阅读。
