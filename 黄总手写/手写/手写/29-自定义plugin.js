// 一次完整的 webpack 打包大致是这样的过程：

// 将命令行参数与 webpack 配置文件 合并、解析得到参数对象。
// 参数对象传给 webpack 执行得到 Compiler 对象。
// 执行 Compiler 的 run 方法开始编译。每次执行 run 编译都会生成一个 Compilation 对象。
// 触发 Compiler 的 make 方法分析入口文件，调用 compilation 的 buildModule 方法创建主模块对象。
// 生成入口文件 AST(抽象语法树)，通过 AST 分析和递归加载依赖模块。
// 所有模块分析完成后，执行 compilation 的 seal 方法对每个 chunk 进行整理、优化、封装。
// 最后执行 Compiler 的 emitAssets 方法把生成的文件输出到 output 的目录中。

class CopyrightWebpackPlugin {
  apply(compiler) {
    // emit 钩子是生成资源到 output 目录之前执行，emit 是一个异步串行钩子，需要用 tapAsync 来注册
    compiler.hooks.emit.tapAsync('CopyrightWebpackPlugin', (compilation, callback) => {
      // 回调方式注册异步钩子
      const copyrightText = '版权归 HHH 所有'
      // compilation存放了这次打包的所有内容
      // 所有待生成的文件都在它的 assets 属性上
      compilation.assets['copyright.txt'] = {
        // 添加copyright.txt
        source: function () {
          return copyrightText
        },
        size: function () {
          // 文件大小
          return copyrightText.length
        },
      }
      callback() // 必须调用
    })
  }
}


// webpack 中许多对象扩展自 Tapable 类。这个类暴露 tap, tapAsync 和 tapPromise 方法，
// 可以使用这些方法，注入自定义的构建步骤，这些步骤将在整个编译过程中不同时机触发。
// 使用 tapAsync 方法来访问插件时，需要调用作为最后一个参数提供的回调函数。

module.exports = CopyrightWebpackPlugin





// webpack.config.js

const path = require('path')
const CopyrightWebpackPlugin = require('./src/plugins/copyright-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [new CopyrightWebpackPlugin()],
}


// 执行 webpack 命令，就会看到 dist 目录下生成copyright.txt文件

// 在配置文件使用 plugin 时传入参数该怎么获得呢，可以在插件类添加构造函数拿到：

plugins: [
    new CopyrightWebpackPlugin({
    name: 'HHH',
    }),
]

// 在copyright-webpack-plugin.js中

class CopyrightWebpackPlugin {
  constructor(options = {}) {
    console.log('options', options) // options { name: 'HHH' }
  }
}