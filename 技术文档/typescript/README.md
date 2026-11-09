# TypeScript 知识文档索引

> 全部基于 **TypeScript 官方文档（typescriptlang.org/docs）**、**标准库 .d.ts** 抓取整理。
> 知识点标注官网来源；官网未展开处以标准实践补充并注明。
> 技术基线：TS 5.x（5.9 时代）/ Node 22+ / React 18+19；2026-11-08 全目录扩写为完整详解版。

---

## 文档索引（编号即文件名前缀）

| 编号 | 主题 | 说明 |
|---|---|---|
| 01 | TS 学习路线图 | 四阶段路线 + 里程碑自测 + 最小工程上手 |
| 02 | 速查表 | 全表格化速查：类型/工具类型/报错码 |
| 03 | 日常类型 | any/unknown/never、type vs interface、null 全家 |
| 04 | 类型收窄 | narrowing/typeof/谓词/穷尽性 |
| 05 | 函数进阶 | 签名/重载/this/泛型函数 |
| 06 | 类 | class/修饰符/useDefineForClassFields 坑 |
| 07 | 枚举 | 编译产物/const enum 三重坑/替代方案 |
| 08 | 从类型构造类型 | keyof/条件类型/infer/映射/模板字面量 |
| 09 | 装饰器（旧实验代） | Nest 在用的实验装饰器 + reflect-metadata |
| 10 | 模块 | ESM/CJS 互操作/模块解析策略 |
| 11 | tsconfig | strict 全家桶/解析策略/项目引用 |
| 12 | 高级类型系统 | 品牌/协变逆变/satisfies/类型级设计模式 |
| 13 | 最佳实践 | 断言替代/接口设计/评审 checklist |
| 14 | 面试题 | 高频题带代码与延伸 |
| 15 | 新特性 | TS 4.9→5.9 逐版本 + tsgo 展望 |
| 16 | 目录索引 | 本目录导航（`16-README.md`） |
| 17 | 工程化实践 | tsup/Vitest/pnpm+turbo/Changesets |
| 18 | 装饰器深入 | Stage 3 新代全解 + 新旧对比 |
| 19 | 类型系统 vs Rust | 跨语言对照 + wasm/napi 互操作 |
| 20 | TS 直接执行 | Node 原生 strip/tsx/ts-node |
| 21 | 声明文件与 @types | declare 全家/手写 d.ts/module augmentation |
| 22 | 类型体操实战 | 15 道 type-challenges 风格题带推导 |
| 23 | 报错解读与类型调试 | 高频错误码修法/类型调试工具箱 |
| 24 | TS × React 实战 | 泛型组件/hooks/Zustand/React Query/R3F |

---

## 学习路径

1. **入门**（01, 03–06）：路线图、日常类型、收窄、函数、类。
2. **语法**（07, 09–11）：枚举、装饰器（旧代）、模块、tsconfig。
3. **类型编程**（08, 12, 22）：从类型构造类型、高级类型系统、体操实战。
4. **边界**（21, 23）：声明文件、报错解读与运行时校验边界。
5. **实战**（13, 24, 17, 20, 14）：最佳实践、React、工程化、直接执行、面试检验。
6. **视野**（15, 18, 19）：新特性、装饰器新代、vs Rust。

---

## 目录状态

`技术文档/typescript` 共 **24 篇**（01–24，16 号为索引）。与 rust(48)/react(20)/nextjs(20)/vue(17)/java(30)/node(20)/go(20)/nest(9) 共同构成技术复习体系。
