o# 34 · Bevy 游戏开发（ECS 架构）

> 官方来源：Bevy Book（https://bevy.org/learn/book/，官方书为重定向/目录式）
> 说明：Bevy 官网书章节为重定向页（未抓到正文），本文基于 Bevy 标准 ECS 架构与官方示例风格 API 整理；Bevy 是当前最活跃的 Rust 游戏引擎（ECS + 数据驱动）。

Bevy 用 **ECS（Entity-Component-System）** 架构，无继承、组合优先，性能高且易扩展。

## 一、ECS 三要素

| 概念 | 说明 |
|---|---|
| Entity | 实体的唯一 ID（无数据） |
| Component | 附加到 Entity 的数据（如 `Position`、`Velocity`） |
| System | 处理 Component 的逻辑（查询 + 变更） |

## 二、第一个 Bevy 应用

```rust
use bevy::prelude::*;

#[derive(Component)]
struct Player;                       // 标记组件

#[derive(Component)]
struct Health(u32);                 // 数据组件

fn spawn_player(mut commands: Commands) {
    commands.spawn((Player, Health(100)));   // 生成实体
}

fn damage_system(mut q: Query<&mut Health, With<Player>>) {
    for mut h in &mut q {
        h.0 -= 10;                   // 系统：扣血
    }
}

fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_systems(Startup, spawn_player)
        .add_systems(Update, damage_system)
        .run();
}
```

- `commands.spawn(...)`：创建实体并挂载组件。
- `Query<&mut Health, With<Player>>`：系统查询满足条件的组件（类似 SQL where）。
- `App::new().add_systems(...)`：注册启动/更新系统。

## 三、资源（Resource）与事件（Event）

```rust
#[derive(Resource)]
struct Score(u32);                          // 全局资源

fn read_score(score: Res<Score>) { /* Res = 只读引用 */ }

#[derive(Event)]
struct Hit;                                 // 事件

fn fire_hit(mut ev: EventWriter<Hit>) { ev.send(Hit); }
fn on_hit(mut ev: EventReader<Hit>) { for _ in ev.read() { /* 处理 */ } }
```

- `Resource`：单例全局状态（类似 axum 的 `State`，`22-web-framework-axum.md`）。
- `Event`：系统间解耦通信（类似 channel，`17-concurrency-parallel.md`）。

## 四、插件（Plugin）

```rust
struct MyPlugin;
impl Plugin for MyPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Update, my_system);
    }
}
app.add_plugins(MyPlugin);                  // 组合复用
```

- Bevy 生态模块化（渲染、物理、音频、UI 均插件）。
- 与 `22-web-framework-axum.md` 的 tower 中间件、`技术文档/nest` 模块对照：插件即组合单元。

## 五、游戏循环与性能

- Bevy 内部用 `Schedule`（Startup/Update/PostUpdate 等 stage）驱动系统。
- 并行系统调度：无冲突的 Query 自动并行（基于 `17-concurrency-parallel.md` 思想）。
- 渲染用 wgpu（WebGPU），可桌面/Web（联动 `25-wasm-web.md`）。

## 六、与系列对照

| Bevy ECS | 其他 |
|---|---|
| Entity/Component | Unity ECS、Java 无原生（可手写） |
| System | 游戏循环 update |
| Resource | 单例/DI 容器 |
| Plugin | 模块系统（10 模块） |

- Rust 无 GC 停顿 → 游戏帧率稳定（vs Java GC，java/16）。

> 延伸：`25-wasm-web.md`（Bevy 编译到 Web）、`17-concurrency-parallel.md`、`22-web-framework-axum.md`、`技术文档/java/16-jvm-memory-model.md`。
