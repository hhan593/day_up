# 19. TypeScript 类型系统 vs Rust 类型系统

> 来源可信度：**对比分析**（TS 侧对齐 TypeScript Handbook（见本目录 `03`~`12` 篇）；Rust 侧对齐 The Rust Book 与 rustc 报错语义，见 `/Users/hh/offer/技术文档/rust/` 对应篇目；代码片段均可在各自工具链下编译/检查）
> 关联：本目录 `03-everyday-types.md`（结构类型）、`04-narrowing.md`（收窄）、`08-creating-types-from-types.md` 与 `12-typescript-advanced-type-system.md`（类型编程）、`10-modules.md`（互操作工程侧）；Rust 侧 `rust/01-基础核心/03-所有权与移动语义.md`、`rust/01-基础核心/04-借用与引用.md`、`rust/01-基础核心/06-枚举与模式匹配.md`、`rust/01-基础核心/08-泛型Trait与生命周期.md`、`rust/01-基础核心/10-错误处理Result与Option.md`；互操作见 `rust/03-实战生态/25-wasm-web.md`、`node/17-native-addons-napi.md`、`rust/02-进阶特性/23-cross-lang-comparison.md`

## 1. 总览：一张表看懂

| | TypeScript | Rust |
|---|---|---|
| 类型存在 | 纯编译期，**运行时完全擦除** | 编译期展开，**单态化生成专用代码** |
| 类型判断 | 结构类型（看形状） | 名义类型（看声明） |
| 联合/枚举 | 判别联合 + `never` 穷尽检查 | `enum` + `match` 强制穷尽 |
| 空值 | `null`/`undefined`，靠 `strictNullChecks` 管 | `Option<T>`，语言级强制 |
| 泛型实现 | 擦除（运行时只有一个函数） | 单态化（每个具体类型一份代码） |
| 类型层编程 | 图灵完备（条件类型/infer/递归） | 有限（const 泛型/trait 约束/宏） |
| 错误处理 | 异常（不进类型）或联合返回值（约定） | `Result<T, E>` + `?`（类型强制） |
| 不可变 | `readonly`（编译期纪律，浅） | `&` / `mut`（借用检查器强制，深） |
| 运行时 | GC + 一切皆共享引用 | 所有权系统，无 GC |
| 类型错误发现时机 | 编辑器/tsc 阶段（跑起来的是擦除后的 JS） | 编译期全拦（不过编译就没有二进制） |

- 一句话定位：TS 的类型系统是「**给动态运行时加的静态校验层**」——校验完就扔掉；Rust 的类型系统是「**编译进机器码的行为约束**」——类型即代码。两者都能在编译期抓住大量 bug，但**保证的强度**与**付出的表达成本**不同。

## 2. 结构类型 vs 名义类型

TS：形状匹配即赋值兼容；Rust：必须显式 `impl`/显式构造。

```ts
// ts/structural.ts
interface Point2D { x: number; y: number }
function norm(p: Point2D): number { return Math.hypot(p.x, p.y); }

const p = { x: 3, y: 4, label: 'extra' };   // 多出来的属性不影响
norm(p);                                     // ✅ 5 —— 结构兼容即可
norm({ x: 3, y: 4 });                        // ✅ 字面量直接传（新鲜字面量会查多余属性）
```

```rust
// rust/src/main.rs
struct Point2D { x: f64, y: f64 }

fn norm(p: &Point2D) -> f64 { (p.x * p.x + p.y * p.y).sqrt() }

fn main() {
    let p = Point2D { x: 3.0, y: 4.0 };
    println!("{}", norm(&p));        // ✅ 5
    // struct Label2D { x: f64, y: f64, label: String }
    // norm(&Label2D { ... });       // ❌ E0308: expected `Point2D`, found `Label2D` —— 声明不同就是不同类型
}
```

**差异结论**：结构类型让「适配」零成本（任何长得像的对象都能传），但意外兼容也更容易发生；名义类型把「是什么」绑死在声明上，跨类型混用必须显式转换。

TS 的名义化技巧——Brand（品牌）：

```ts
// ts/brand.ts
type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<number, 'UserId'>;
type OrderId = Brand<number, 'OrderId'>;

function getUserName(id: UserId): string { return `user-${id}`; }

const raw = 42;
// getUserName(raw);             // ❌ TS2345: 'number' 不能赋给 'UserId'
getUserName(raw as UserId);      // ✅ 但 as 一绕就破——Brand 只是编译期纪律
```

```ts
// ts/brand-unique.ts —— unique symbol 版：更难伪造
declare const __userId: unique symbol;              // 全项目唯一类型标识
export type UserId = number & { readonly [__userId]: true };

function create(id: number): UserId { return id as UserId; }   // 只在构造入口「盖章」
export function getUserName(id: UserId): string { return `user-${id}`; }
```

Rust 对应物是 **newtype 模式**——比 Brand 更硬：raw 值连 `as` 都转不过去，必须走构造函数：

```rust
// rust/src/newtype.rs
struct UserId(u64);
struct OrderId(u64);

fn get_user_name(id: UserId) -> String { format!("user-{}", id.0) }

fn main() {
    let raw: u64 = 42;
    // get_user_name(raw);          // ❌ E0308
    // get_user_name(UserId(raw) as u64 as ... 没有任何 as 链能把 u64 变 UserId
    get_user_name(UserId(raw));     // ✅ 唯一入口：显式包装
}
```

- 结论：Brand ≈ newtype 的「弱化版」。TS 用交叉类型在编译期模拟名义性，绕过它只需要一个 `as`；Rust 的名义性是语言级事实。面试高频点：「如何给 TS 加名义类型」→ Brand / unique symbol / `readonly ['brand']` 元组三种（详见 `03-everyday-types.md`、`13-typescript-best-practices.md`）。

## 3. 判别联合 vs enum + match：穷尽性的两种强度

```ts
// ts/shape.ts
type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'rect'; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle': return Math.PI * s.r ** 2;
    case 'rect':   return s.w * s.h;
    default: {
      const _exhaustive: never = s;   // 漏写分支时这里报错：
      return _exhaustive;             // TS2367 / TS2322: Type '{ kind: "triangle"; ... }' is not assignable to type 'never'
    }
  }
}
```

```rust
// rust/src/shape.rs
enum Shape {
    Circle { r: f64 },
    Rect { w: f64, h: f64 },
}

fn area(s: &Shape) -> f64 {
    match s {
        Shape::Circle { r } => std::f64::consts::PI * r * r,
        Shape::Rect { w, h } => w * h,
        // 漏写任一分支 → 编译错误 E0004: non-exhaustive patterns
        // `Circle { .. }` not covered
    }
}
```

- **穷尽性对比**：TS 需要自己搭 `never` 兜底（且只查 `switch`，写成 `if/else if` 链就没有这层保证）；Rust 的 `match` 是语言级强制，漏分支直接编译失败，还支持 `#[non_exhaustive]` 控制下游是否允许 `_` 兜底。
- TS 的优势在**开放性**：联合类型可以散落在任何模块里随时扩；Rust enum 是封闭集合，跨 crate 加变体要改定义（或用 trait 对象开闭）。
- 判别联合的运行时真相：`s.kind` 就是个字符串属性，收窄靠控制流分析（`04-narrowing.md`）；Rust 的 match 是编译期生成的跳转/解构，零运行时标签字符串比较（代价是数据布局由编译器决定）。
- Rust `if let` / `let else` ≈ TS 的 `if (s.kind === 'circle')` 单分支收窄。

## 4. 空安全：strictNullChecks vs Option<T>

```ts
// ts/null-safety.ts —— 需要 strictNullChecks（见 11-tsconfig.md 第 4 章）
interface User { name: string; email?: string }

function greet(u: User): string {
  // return u.email.toUpperCase();                  // ❌ TS18048: 'u.email' is possibly 'undefined'
  const email = u.email ?? 'no-email';              // ?? 兜底        ≈ unwrap_or
  const domain = u.email?.split('@')[1];            // ?. 可选链      ≈ and_then（结果 string | undefined）
  // return u.email!.toUpperCase();                 // ! 非空断言     ≈ unwrap()（自己担保，风险自负）
  return `${u.name} <${email}> (${domain ?? 'anon'})`;
}
```

```rust
// rust/src/null_safety.rs
struct User { name: String, email: Option<String> }

fn greet(u: &User) -> String {
    let email = u.email.as_deref().unwrap_or("no-email");                     // ≈ ??
    let domain = u.email.as_deref()                                           // Option<&str>
        .and_then(|e| e.split('@').nth(1))                                    // ≈ ?.
        .unwrap_or("anon");
    format!("{} <{}> ({})", u.name, email, domain)
}
```

写法对照表：

| TS | Rust | 语义 |
|---|---|---|
| `x?.y` | `x.and_then(\|v\| v.y)` / `map` | 中途断链，整体变「可能空」 |
| `x ?? d` | `x.unwrap_or(d)` / `unwrap_or_else` | 空则兜底 |
| `x!` | `x.unwrap()` / `expect("msg")` | 断言非空，空则崩（panic） |
| `if (x) { ... }` | `if let Some(v) = x { ... }` | 收窄进分支 |
| —— | `?` 运算符 | 空则提前 return（TS 无等价物，见第 7 章） |

- **差异结论**：TS 的空值仍是「值」——`null`/`undefined` 可以在任何运行时刻出现（第三方 JSON、DOM API），strictNullChecks 只保护你标注过的世界；Rust 里 `Option` 是普通枚举，`unwrap` 的 panic 是显式选择，整个调用链上的「可能为空」全部编码在签名里。
- TS 社区对应物：把 `Option<T>` 模拟成 `T | undefined` + 工具类型（`08-creating-types-from-types.md`），或用 neverthrow/true-myth 这类库——但都不阻止别人直接给你 null。

## 5. 泛型 vs trait：擦除 vs 单态化

```ts
// ts/generics.ts
interface Serializable { serialize(): string }

function save<T extends Serializable>(x: T): string {
  return x.serialize();
}
// 编译产物里 T 消失，只剩一个普通函数；类型约束纯编译期
save({ serialize: () => 'hi' });   // ✅ 不需要“注册/实现”，形状对就行
```

```rust
// rust/src/generics.rs
trait Serializable {
    fn serialize(&self) -> String;
}

struct Json;
impl Serializable for Json {
    fn serialize(&self) -> String { "json".into() }
}

fn save<T: Serializable>(x: T) -> String { x.serialize() }
// 也可写 fn save(x: impl Serializable) -> String

fn main() {
    save(Json);      // ✅ 必须显式 impl
    // save(42);     // ❌ E0277: `i32` doesn't implement `Serializable`
}
```

- **单态化（monomorphization）**：Rust 对每个用到的具体类型生成一份专用机器码（静态分发，零运行时开销，代价是编译时间与二进制体积）；动态分发要显式选 `dyn Serializable`（trait object，有虚表成本）。TS 擦除后运行时只有一个函数——没有抽象成本，是因为运行时根本没有类型抽象这回事。
- **where 约束 vs extends**：

```rust
// rust —— 复杂约束拆到 where，可读性最好
fn print_all<T>(items: &[T])
where
    T: Serializable + Clone + std::fmt::Debug,
{ /* ... */ }
```

```ts
// ts —— 交叉类型扮演多重约束
function printAll<T extends Serializable & { clone(): T }>(items: T[]): void {}
```

- **关联类型 vs infer**：Rust 的 `type Item` 把「每个实现只对应一个输出类型」编码进 trait：

```rust
// rust —— 关联类型
trait Container {
    type Item;
    fn get(&self, i: usize) -> &Self::Item;
}
```

```ts
// ts —— 用泛型参数 + infer 抽取模拟（12 篇的 Get/infer 模式）
interface Container {
  get(i: number): unknown;
}
type Item<C> = C extends { get(i: number): infer I } ? I : never;

type I1 = Item<{ get(i: number): string }>;   // string
type I2 = Item<{ get(i: number): boolean }>;  // boolean
```

- 区别：Rust 的关联类型在 trait 定义处就约束了「一一对应」（impl 时不许一物多型），编译器据此消歧；TS 的 `infer` 是从**使用点反向抽取**，表达力更野、约束更弱。详见 `rust/01-基础核心/08-泛型Trait与生命周期.md` 与 `12-typescript-advanced-type-system.md`。

## 6. 类型推导强度对比

```ts
// ts/inference.ts —— 推导偏“按使用上下文”
const xs = [1, 2, 3].map((n) => n * 2);   // number[]：map 的泛型 + 回调返回值自动推导
let y = xs[0];        // number —— 默认假设“元素存在”
// let z = xs[9];     // 还是 number！TS 不查索引越界（开 noUncheckedIndexedAccess 后才是 number | undefined，见 11 篇 4 章）

document.addEventListener('click', (e) => {
  console.log(e.clientX);   // e: MouseEvent —— 上下文类型按监听的事件名反推
});
```

```rust
// rust/src/inference.rs —— 推导偏“按数据流”，局部几乎零注解，但导出 API 必须显式
fn main() {
    let xs = vec![1, 2, 3];            // Vec<i32>：整数字面量默认 i32
    let doubled: Vec<_> = xs.iter().map(|n| n * 2).collect();  // _ 让编译器填
    let y = xs[0];                     // i32
    let z = xs.get(9);                 // Option<i32> —— 越界表达在类型里！
    println!("{:?}", (doubled, y, z));
}
// fn process(v) ← 不允许：导出函数的参数/返回类型必须显式标注（E0207/E0283 级别的强制）
```

- 对照结论：
  - TS 的推导杀手锏是**上下文类型**（按赋值目标/回调预期反推表达式类型）与**控制流收窄**，API 不标类型也能推导得很好——但也因此隐式 `any` 一旦漏进来就静默扩散。
  - Rust 推导只作用于**函数体内**（局部 HM 风格），跨函数边界一律显式；换来的是每个导出签名即文档，IDE 悬停永不说谎。
  - 两者都强调「边界显式、内部省略」：TS 的最佳实践也是如此（导出函数手写返回类型，见 `13-typescript-best-practices.md`）。

## 7. 错误处理：Result / ? vs 异常 / 联合返回值

```ts
// ts/errors.ts —— TS 的两种流派
class ParseError extends Error {}

// 流派① 异常：不进类型系统，调用方从签名看不到“会抛”
function parseThrow(s: string): number {
  const n = Number(s);
  if (Number.isNaN(n)) throw new ParseError(`bad input: ${s}`);
  return n;
}
try {
  parseThrow('abc');
} catch (e) {
  if (e instanceof ParseError) { /* 处理 */ }
  else throw e;                       // useUnknownInCatchVariables 下 e 是 unknown（11 篇第 4 章）
}

// 流派② 判别联合模拟 Result：把“可能失败”写进返回类型
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function parse(s: string): Result<number, string> {
  const n = Number(s);
  return Number.isNaN(n) ? { ok: false, error: `bad input: ${s}` } : { ok: true, value: n };
}

function run(): Result<number, string> {
  const r = parse('42');
  if (!r.ok) return r;                 // 手动传播（Rust 的 ? 做的就是这件事）
  return { ok: true, value: r.value + 1 };
}
```

```rust
// rust/src/errors.rs
fn parse(s: &str) -> Result<i64, String> {
    s.parse::<i64>().map_err(|e| e.to_string())
}

fn run() -> Result<i64, String> {
    let n = parse("42")?;   // ? 运算符：Ok 解包继续，Err 直接向上 return
    Ok(n + 1)
}
```

- **差异结论**：Rust 把「失败」做成普通值 + 一个语法糖（`?` 等价于 TS 例里的手动 `if (!r.ok) return r`），错误路径**必须**被处理才能编译；TS 的异常完全绕开类型系统（`throws` 子句不存在），联合返回值流派又没有 `?`——链式传播靠 neverthrow 的 `.andThen()` 或手写，噪音明显。
- 实战口径（`13-typescript-best-practices.md`）：库代码优先联合返回值（把失败暴露给类型），应用边界用 try/catch 兜底；`Result` 型库（neverthrow）适合追求 Rust 手感的大团队。

## 8. 不可变性：readonly vs &mut / Clone

```ts
// ts/readonly.ts
interface Config { readonly host: string; readonly tags: readonly string[] }
// Readonly<T> 只包一层：嵌套对象/数组要递归版本 DeepReadonly（见 12 篇）
// Object.freeze() 是运行时浅冻结；readonly 是纯编译期，as any 一绕就破

function call(c: Config) {
  // c.host = 'x';        // ❌ TS2540: Cannot assign to 'host' because it is a read-only property.
  // c.tags.push('x');    // ❌ TS2339: Property 'push' does not exist on type 'readonly string[]'.
}
// 但底层对象若被别处持有引用，运行时谁都能改——readonly 只是承诺，不是机制
```

```rust
// rust/src/mutability.rs
fn main() {
    let mut v = vec![1, 2];       // 声明 mut 才能改
    v.push(3);
    let r = &v;                   // 不可变借用：可以同时有多个
    // let w = &mut v;            // ❌ E0502: cannot borrow `v` as mutable because it is also borrowed as immutable
    let owned = v.clone();        // 显式深拷贝（Clone trait）
    println!("{:?} {:?}", r, owned);
}
```

- **差异结论**：TS 的 readonly 表达「这个引用视角下别改」（浅层、编译期、可绕过）；Rust 的 `&`/`mut` 是借用检查器强制的所有权规则——同一时刻要么多个共享引用 `&T`，要么唯一可变引用 `&mut T`，编译期排除数据竞争（`rust/01-基础核心/04-借用与引用.md`）。
- API 设计对照：TS 库常接收 `Readonly<T>` 参数承诺不改；Rust 直接收 `&T`——「不修改」不是文档约定而是函数签名的机械事实。

## 9. 所有权与借用：一句话与 API 设计影响

一句话：**TS 里所有值都是 GC 管理的共享引用，「传」永远是传引用、想拷就 `clone`/structuredClone、无需声明；Rust 里每个值有唯一所有者，赋值/传参默认移动（move），共享要 `&`、深拷要显式 `Clone`。**

对 API 设计的具体影响（这也是 Rust 代码「看着啰嗦」的根源）：

| 决策点 | TS 习惯 | Rust 习惯与理由 |
|---|---|---|
| 参数类型 | 收 `string` 就完了 | 收 `&str` 而非 `&String`（最小借用，调用方零拷贝） |
| 返回 | 随便返回引用 | 返回 `String`（拥有值）还是 `&str`（要挂生命周期）要想清楚 |
| 转换 API | 原地返回新对象 | `into()` / `to_owned()` 显式表达所有权转移 |
| 可变性 | 值本身可变与否看运行时 | `&mut` 参数明确声明「我会改你」 |

- 见 `rust/01-基础核心/03-所有权与移动语义.md`。对 TS 开发者的迁移提示：Rust 的「借用最小化、按值传递小块数据、Clone 不丢人」直接对应 TS 里「别共享可变大对象、传快照」的防御式写法——只是 Rust 把它变成编译规则。

## 10. 类型编程能力：图灵完备类型层 vs 常量泛型与宏

```ts
// ts/type-level.ts —— TS 类型层：条件类型 + infer + 递归 + 模板字面量（图灵完备）
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

type Route = `${'GET' | 'POST'} /api/${string}`;   // 模板字面量类型
type Handler = (route: Route) => void;

declare const h: Handler;
// h('DELETE /api/x');   // ❌ TS2345 —— 字符串的“语法”在类型层被校验
h('GET /api/users');      // ✅
```

```rust
// rust/src/type_level.rs —— 类型层表达能力有限，但有 const 泛型与宏
struct Buffer<const N: usize> {
    data: [u8; N],        // 数组长度进类型：长度错误编译期报错
}

fn make() -> Buffer<16> { Buffer { data: [0; 16] } }
// let b: Buffer<15> = make();   // ❌ E0308: expected `Buffer<15>`, found `Buffer<16>`

macro_rules! json {          // 声明宏：语法层生成代码
    ($($k:literal : $v:expr),* $(,)?) => {{
        let mut m = std::collections::HashMap::new();
        $( m.insert($k.to_string(), $v); )*
        m
    }};
}

fn main() {
    let _b = make();
    let m = json! { "a" => 1, "b" => 2 };
    println!("{:?}", m);
}
```

- 对比结论：
  - TS 能在**类型层做任意计算**（解析字符串、模拟状态机、`12-typescript-advanced-type-system.md` 里的 UnionToTuple 等），但一切都是「编译期标签游戏」，运行时零存在；复杂类型层会拖慢 tsc 并折磨同事——克制使用（`13-typescript-best-practices.md` 的红线）。
  - Rust 类型层朴素（const 泛型、GAT、PhantomData 打标记），但**编译期宏能在语法层直接生成代码**——TS 类型层能算却不能生成运行时结构，Rust 宏能生成却几乎不会「算」（proc macro 也是解析 TokenStream 的编程，只是没有类型层推理）。
  - 一句话：**TS 的抽象发生在「类型的层面」，Rust 的抽象发生在「代码生成的层面」**。

## 11. 互操作通道一：wasm-bindgen（Rust → wasm → 浏览器/Node）

```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n { 0 => 0, 1 => 1, _ => fibonacci(n - 1) + fibonacci(n - 2) }
}

#[wasm_bindgen]
pub struct Point { pub x: f64, pub y: f64 }

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Point { Point { x, y } }
    pub fn norm(&self) -> f64 { (self.x * self.x + self.y * self.y).sqrt() }
}
```

```bash
wasm-pack build --target web     # 产出 pkg/：rs_math_bg.wasm + rs_math.js（胶水）+ rs_math.d.ts
```

```ts
// index.ts —— TS 侧：类型绑定由 wasm-pack 自动生成的 .d.ts 提供，无需手写
import init, { fibonacci, Point } from './pkg/rs_math.js';

await init();                    // 加载并实例化 wasm 模块
console.log(fibonacci(10));      // 55
const p = new Point(3, 4);
console.log(p.norm());           // 5
```

- 边界规则：wasm 只能直接传数字，复杂类型（String/Vec/struct）由 wasm-bindgen 生成胶水代码在 JS 堆与 wasm 线性内存之间搬运——**跨边界越频繁越慢**，API 设计要把大计算整块下沉到 Rust 侧。
- 适用：浏览器里的 CPU 密集逻辑（图像、加密、解析器）、想在前后端复用同一份 Rust 核心。见 `rust/03-实战生态/25-wasm-web.md`。

## 12. 互操作通道二：napi-rs（Rust → Node 原生扩展）

```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
napi = "3"
napi-derive = "3"

[build-dependencies]
napi-build = "3"
```

```rust
// src/lib.rs
use napi_derive::napi;

#[napi]
pub fn sum(a: i32, b: i32) -> i32 { a + b }

#[napi(object)]                 // 映射为普通 JS 对象
pub struct UserInfo {
    pub id: f64,                // JS number 本质是 f64，此处对齐
    pub name: String,
}

#[napi]
pub fn find_user(id: f64) -> Option<UserInfo> {
    if id == 1.0 { Some(UserInfo { id, name: "alice".into() }) } else { None }
}
```

```rust
// build.rs —— napi-rs 脚手架标配
fn main() { napi_build::setup(); }
```

```bash
napi build --release            # 产出 index.node（二进制）+ index.js（加载器）+ index.d.ts（自动类型绑定）
```

```ts
// consumer.ts —— Node 侧直接 import，类型来自自动生成的 index.d.ts
import { sum, find_user, UserInfo } from './index.js';

console.log(sum(1, 2));         // 3
const u: UserInfo | null = find_user(1);
console.log(u?.name);           // alice
```

- `Option<T>` 自动映射为 `T | null`、`Result` 映射为抛异常——**Rust 的空安全/错误类型在边界上被翻译成 JS 世界的习惯**，这就是互操作层的核心工作。
- 工业案例：SWC、Rolldown、rspack、Biome、oxc 全是 napi-rs——「TS/JS 做胶水与生态，Rust 做性能内核」是当前（截至 2026-11）前端基础设施的主流架构。见 `node/17-native-addons-napi.md`（对比 C++ addon）。
- 两通道选型：目标浏览器/通用 → wasm-bindgen；目标 Node/CLI 工具链、需要文件系统线程等原生能力 → napi-rs。

## 13. 选型决策表

| 需求 | 更适合 | 理由 |
|---|---|---|
| Web UI / 快速迭代 / 生态即生产力 | TS | 结构类型灵活、npm 生态、即时反馈 |
| CPU 密集内核（编译器/压缩器/图像） | Rust（经 napi-rs/wasm） | 单态化零开销、无 GC 抖动 |
| 高并发服务 | Rust | 所有权排除数据竞争；TS 有 worker 但共享状态靠约定 |
| 穷尽建模业务状态机 | 两者皆可 | TS 判别联合够用；Rust match 保证更强但要改 enum 定义 |
| 跨端复用计算逻辑 | Rust 核心 + 双绑定 | 一份 Rust，wasm 给浏览器、napi 给 Node |
| 团队类型功底训练 | 先 TS 后 Rust | TS 类型层免费练「编译期思维」，Rust 再补所有权维度 |

- 互迁移路径：TS → Rust 先攻所有权与借用（rust/01-基础核心/03、04 两篇）；Rust → TS 先接受「类型会消失」，把重心放到运行时收窄与守卫（`04-narrowing.md`）。
- 更系统的两语言横向对比见 `rust/02-进阶特性/23-cross-lang-comparison.md`。

## 14. 一句话总结

> TS 类型是编译期擦除的校验层：结构类型开放灵活、判别联合靠 never 穷尽、空值靠 strictNullChecks、类型层图灵完备但运行时消失；Rust 类型是编译进机器码的行为约束：名义类型 + newtype、match 强制穷尽、Option/Result 语言级强制、泛型单态化零开销、所有权排除数据竞争。TS 调 Rust 有两条成熟通道——wasm-bindgen（浏览器，数字直传 + 胶水搬运）与 napi-rs（Node 原生扩展，Option/Result 自动映射），SWC/Rolldown 一系的「TS 胶水 + Rust 内核」已是主流架构。两种类型思维可互相迁移：TS 练类型层抽象，Rust 练编译期严格性。
