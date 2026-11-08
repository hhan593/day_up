# 16. TypeScript 知识文档索引

> 全部基于 **TypeScript 官方文档**（typescriptlang.org handbook，2026/8/31 抓取，© Microsoft）整理，技术基线为 TS 5.x（5.9 时代）；官网未展开处以标准实践补充并标注「来源可信度」。本篇是目录索引（对应文件 `16-README.md`），与根目录 `README.md` 内容对齐。
> 更新：2026-11-08 全目录扩写为「完整详解版」（300–700 行/篇），并新增 21–24 四篇。

## 文档清单（编号即建议阅读序）

| 编号 | 文件 | 主题 | 核心内容 |
|------|------|------|----------|
| 01 | `01-typescript-learning-roadmap.md` | 学习路线图 | 四阶段路线 + 里程碑自测清单、最小工程上手（pnpm+tsx+vitest）、学习误区 |
| 02 | `02-typescript-cheatsheet.md` | 速查表 | 全表格化：类型标注/narrowing/类型运算/22 个内置 Utility Types/装饰器/模块/tsconfig/报错码速查 |
| 03 | `03-everyday-types.md` | 日常类型 | 原始类型与装箱怪癖、any/unknown/never 对比、type vs interface 官方表述、字面量退化坑、null/undefined 全家 |
| 04 | `04-narrowing.md` | 类型收窄 | typeof/truthiness/等值/in/instanceof/类型谓词/断言函数/穷尽性、闭包收窄失效坑 |
| 05 | `05-more-on-functions.md` | 函数进阶 | 调用签名、重载完整规则、this 参数、泛型函数深入、void/never 特殊性 |
| 06 | `06-classes.md` | 类 | 字段初始化与 `useDefineForClassFields` 坑、private/#private 对比、参数属性、override、this 流式 API |
| 07 | `07-enums.md` | 枚举 | 编译产物展开、const enum 三重坑、enum vs as const vs 联合对比 |
| 08 | `08-creating-types-from-types.md` | 从类型构造类型 | keyof/typeof/索引访问/条件类型+infer/映射类型/模板字面量、手写 12 个内置工具类型 |
| 09 | `09-decorators.md` | 装饰器（旧实验代） | 5 种签名与执行顺序、descriptor 修改实战、reflect-metadata 与 Nest DI |
| 10 | `10-modules.md` | 模块系统 | ESM 全语法、import type、CJS 互操作、模块解析策略对比、barrel 性能坑 |
| 11 | `11-tsconfig.md` | 编译配置 | strict 全家桶逐项、module/moduleResolution 配对表、性能组、项目引用、三套模板 |
| 12 | `12-typescript-advanced-type-system.md` | 高级类型系统 | 品牌类型、协变逆变、递归类型、satisfies 深入、验证器/EventEmitter 类型实战 |
| 13 | `13-typescript-best-practices.md` | 最佳实践 | 断言替代方案优先级、接口设计、运行时边界 zod、评审 checklist、坏味道清单 |
| 14 | `14-typescript-interview-questions.md` | 面试题 | 高频题集（含代码与延伸）：类型系统/装饰器/模块/性能全覆盖 |
| 15 | `15-typescript-new-features.md` | 新特性 | 4.9→5.9 逐版本特性 + tsgo 原生编译器展望 |
| 16 | `16-README.md` | 本索引 | 目录导航与机制全景图 |
| 17 | `17-engineering-tsup-vitest.md` | 工程化实践 | tsup 双格式发布、Vitest 类型测试、pnpm+turbo、Changesets 发版 |
| 18 | `18-decorators-deep.md` | 装饰器深入（Stage 3 新代） | 6 种装饰器 + context 全字段、accessor/metadata、新旧两代差异与迁移 |
| 19 | `19-types-vs-rust.md` | 类型系统 vs Rust | 结构 vs 名义、判别联合 vs enum、单态化、wasm-bindgen/napi-rs 互操作 |
| 20 | `20-tsx-and-runtime.md` | TS 直接执行 | Node 原生 strip 演进（23.6+/22.18+ 默认开）、tsx/ts-node、erasableSyntaxOnly |
| 21 | `21-declaration-files.md` | 声明文件与 @types | declare 全家、三斜线、手写 d.ts 实战、module augmentation、@types 机制 |
| 22 | `22-type-gymnastics.md` | 类型体操实战 | 15 道 type-challenges 风格题带逐行推导（Equal/分布律/递归） |
| 23 | `23-error-debugging.md` | 报错解读与类型调试 | 15 个高频错误码逐个修、类型调试工具箱、「类型对但运行炸」专题 |
| 24 | `24-ts-with-react.md` | TS × React 实战 | 泛型组件、hooks 全类型、Context/Zustand/React Query 模式、R3F 衔接 |

## 学习顺序建议

```
入门   → 01 路线图 → 03 日常类型 → 04 收窄 → 05 函数 → 06 类
语法   → 07 枚举 → 09 装饰器(旧代) → 10 模块 → 11 tsconfig
类型层 → 08 从类型构造类型 → 12 高级类型系统 → 22 类型体操实战
边界   → 21 声明文件 → 23 报错调试（含运行时校验边界）
实战   → 13 最佳实践 → 24 TS×React → 17 工程化 → 20 直接执行 → 14 面试题检验
视野   → 15 新特性 → 18 装饰器深入(新代) → 19 TS vs Rust
```

## 核心机制全景图

```
            ┌─────────────── 值层面 ───────────────┐
            │  classes / enums / functions / modules │
            └───────────────────────────────────────┘
                        │ 类型附着
            ┌─────────────── 类型层面 ──────────────┐
            │ everyday-types / narrowing / creating- │
            │ types-from-types / advanced / 体操     │
            └───────────────────────────────────────┘
                        │ 元编程
            ┌─────────────── 元层面 ────────────────┐
            │ decorators（旧代 09 / 新代 18）         │
            └───────────────────────────────────────┘
                        │ 边界防护
            ┌─────────────── 边界层面 ──────────────┐
            │ 声明文件 d.ts（21）/ 运行时校验 zod（23）│
            │ ——类型层与运行时世界的接缝              │
            └───────────────────────────────────────┘
                        │ 工程化开关
            ┌─────────────── 配置层面 ──────────────┐
            │ tsconfig（11）/ 构建（17）/ 运行时（20） │
            └───────────────────────────────────────┘
```

## 高价值坑速查

1. **`strict: true` 必开**：Nest 用 `nest new --strict`；`noUncheckedIndexedAccess` 建议追加（见 `11 篇`）。
2. **Nest 必须开两 flag**：`experimentalDecorators` + `emitDecoratorMetadata`，否则 DI 失效（见 `09 篇`）。
3. **TS 5 新装饰器 ≠ 旧装饰器**：新代无参数装饰器、无 emitDecoratorMetadata，Nest 暂不迁移（见 `18 篇`）。
4. **字面量退化**：对象字面量属性默认推成 `string`；需字面量时 `as const`（见 `03 篇`）。
5. **`import type`**：`isolatedModules`/SWC/Babel 下必须用它分离类型导入（见 `10 篇`）。
6. **const enum 陷阱**：isolatedModules 禁用、单文件转译器不内联、跨包版本漂移——用 `as const` 对象替代（见 `07 篇`）。
7. **type vs interface**：对象形状优先 interface（可声明合并），联合/映射/条件用 type（见 `03 篇`）。
8. **闭包收窄失效**：回调里编译器放弃对可变 `let` 的收窄，先 `const` 固化（见 `04 篇`）。
9. **类型 ≠ 运行时**：API/JSON 边界必须 zod 等 parse 后再信任类型（见 `23 篇`）。
10. **Omit 联合塌缩**：`Omit<A|B, K>` 退化为 `Omit<A&B, K>`，分布处理或用映射类型（见 `08 篇`）。

## 跨章节衔接

| 本目录知识点 | 衔接文档 |
|------------|----------------|
| 装饰器两 flag、DI 反射 | `技术文档/nest/01-fundamentals`、`09-recipes` |
| 类、参数属性、枚举 | `技术文档/nest/09-recipes`（Entity/DTO）、`03-security`（角色枚举） |
| 模块解析、tsconfig | `技术文档/nest/08-cli`（libraries/scripts） |
| React 组件/hooks 类型 | `技术文档/react/`（全系列） |
| R3F 的 JSX 类型扩展 | `技术文档/Three.js/21-React-Three-Fiber.md` |
| TS 直接执行 Node 脚本 | `技术文档/node/`（模块与运行时相关篇） |
| 类型系统 vs Rust | `技术文档/rust/`（泛型/Trait/宏/工程化对应篇） |

## 与其他文档体系的关系

`技术文档/nest`、`技术文档/react`、`技术文档/Three.js` 大量消费本目录的 TS 机制（类、装饰器、类型、模块、tsconfig）。本目录是「语言地基」，其他目录是「框架应用」——建议对照阅读。
