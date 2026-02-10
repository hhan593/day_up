### 30、animation 和 transition 的区别？

`animation` 和 `transition` 都是 CSS 中用于实现动画效果的特性，但它们在用途、复杂性和控制方式上有所不同。

### CSS Transitions

- **用途**：`transition` 用于在 CSS 属性值之间自动创建动画效果，这种变化通常触发于某个动作或事件（如鼠标悬停、焦点、点击或属性值的改变）。
- **简易性**：`transition` 较为简单，主要用于简单的从一个状态过渡到另一个状态的动画效果。
- **属性**：
  - `transition-property`：指定应用过渡效果的 CSS 属性。
  - `transition-duration`：过渡效果持续的时间。
  - `transition-timing-function`：过渡效果的时间曲线。
  - `transition-delay`：过渡效果开始的延迟时间。

### CSS Animations

- **用途**：`animation` 通过 @keyframes 规则更加复杂和灵活，允许你创建从一个 CSS 样式配置到另一个的多阶段动画。
- **复杂性**：`animation` 提供更高的复杂度和控制，可以定义多个关键帧，每个关键帧描述在动画序列中的某一时间点上的样式。
- **属性**：
  - `@keyframes` 规则：定义动画序列中的关键帧及其样式。
  - `animation-name`：指定 `@keyframes` 动画的名称。
  - `animation-duration`：动画完成一个周期所花费的时间。
  - `animation-timing-function`：动画的时间曲线。
  - `animation-delay`：动画开始之前的延迟。
  - `animation-iteration-count`：动画应该播放的次数。
  - `animation-direction`：动画是否应该轮流反向播放。

### 主要区别

1. **复杂性和控制**：`animation` 提供了比 `transition` 更复杂的控制，允许定义多个关键帧和更详细的动画序列。
2. **触发方式**：
   - `transition` 主要用于响应用户交互或其他状态变化（如 hover）来触发简单的两状态变化。
   -- `animation` 不需要触发器即可运行，可以在页面加载时自动开始，或使用 `animationplay-state` 属性来控制。
3. **关键帧**：只有 `animation` 使用 `@keyframes` 来定义动画的中间步骤。

综上所述，选择 `transition` 还是 `animation` 取决于你想实现的动画效果的复杂度和控制需求。对于简单的状态变化动画，`transition` 通常是足够的；而对于需要更细粒度控制或更复杂动画效果的情况，`animation` 则是更好的选择。