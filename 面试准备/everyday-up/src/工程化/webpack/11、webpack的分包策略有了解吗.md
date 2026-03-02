 Webpack 支持多种分包(Code Splitting)策略,可以将打包后的代码合理拆分为多个 bundle 文件,从而优化加载性能。常见的分包策略有:

1. **入口分离(Entry Point Separation)**

入口分离是最直接的分包方式,即使用 `entry` 配置中的多个入口,将代码分离到不同的 bundle 中。通常将第三方库或一些通用的模块代码提取到一个单独的文件中,以方便在不同页面间共享。

2. **预获取/预加载模块(prefetch/preload module)**

使用 `import()` 语法,将部分代码懒加载至单独的 bundle 中。`prefetch` 会在空闲时间预先加载模块,而 `preload` 则是在页面加载时立即加载模块。

3. **防止重复(Prevent Duplication)**

使用 `SplitChunksPlugin` 对重复模块进行分离。它可以将多个 bundle 中公共的模块提取到单独的 bundle 中,避免重复加载。

4. **动态导入(Dynamic Imports)**

类似 `prefetch/preload`,通过符合 ECMAScript 提案 的 `import()` 语法来动态导入模块。Webpack 会自动分离加载这些被引入的模块。

5. **捆绑软件包(Bundle Package Optimizations)**

对于如 Lodash 这样庞大的工具库,可以使用 `import('/lodash/uniq')` 这样的方式只导入所需的模块,而不是全部导入。

6. **渐进式 Web 应用程序(Progressive Web Application)**

结合 Service Worker,在需求不同的场景执行不同的分包策略,如首次访问时只加载主要代码,之后访问时再加载其他代码。

这些策略并不是完全独立的,通常需要组合使用多种策略才能发挥最大效果。值得注意的是,对于较大的 Web 应用,过多的分包也可能带来新的性能问题,需要权衡利弊。