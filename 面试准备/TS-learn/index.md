## TS-learn：

[TS 教程](http://ts.xcatliu.com/basics/type-of-function.html)
看 CodeWhy 的 Vue3+TS 的视频中的 TS 精讲可快速入门

### 1、装环境：
生成 ts 配置文件：
```bash
tsc --init
```

编译 TS 文件：
```bash
# tsc -> TypeScript Compiler
tsc index.ts
```

解决 ts 编译后报错：
在对应 ts 文件后面加上 `export {}`

#### 使用 ts-node 运行 ts 文件：
安装：
```bash
npm i ts-node tslib @types/node -g
```

运行：
```bash
ts-node index.ts
```

> 说明： ts-node node.ts === tsc index.ts + node index.js

#### webpack ts 环境：
1、安装 webpack：
```bash
npm i webpack webpack-cli -D
```

2、安装 ts loader：
```bash
npm i ts-loader typescript -D
```

3、初始化 ts 配置文件：
```bash
tsc --init
```

4、配置 webpack.config.js：
```js
// 以 src/main.ts 为入口文件
const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.cjs', '.json']
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader'
    }]
  }
}
```

5、执行 webpack 编译打包：
```bash
# 在项目跟文件下执行
webpack
```

6、搭建 server 服务：
6.1、安装 dev-server
```bash
npm i webpack-dev-server -D
```
6.2、安装 html 模板：
```bash
npm i html-webpack-plugin -D
```
6.3、修改 package.json 命令：
在 scripts 选项中配置：
```json
"serve": "webpack serve"
```

最新的 webpack.config.js：
```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/main.ts',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js'
  },
  devServer: {},
  resolve: {
    extensions: ['.ts', '.js', '.cjs', '.json']
  },
  module: {
    rules: [{
      test: /\.ts$/,
      loader: 'ts-loader'
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    })
  ]
}
```

### 2、基础数据类型：
unknown 类型只能赋值给 any 和 unknown 类型
any 类型可以赋值给任意类型

never: 用于什么都不会返回的，比如：函数内有死循环、抛出异常


`type`: 用来给类型起别名的
```js
type Fn = (num1: number, num2: number) => number

const fn: Fn = (num1, num2) => {
  return num1 + num2
}
```

### 3、函数：
3.1 函数重载：函数的名称相同，但是参数不同的几个函数，就是函数的重载
```js
// 方式一：通过联合类型
function getLength(args: string | any[]) {
  return args.length
}

console.log(getLength('abc'));
console.log(getLength([123, 321, 123]));


// 方式二：通过函数重载
function getLength(args: string): number;
function getLength(args: any[]): number;
function getLength(args: any): number {
  return args.length
}

console.log(getLength('abc'));
console.log(getLength([123, 321, 123]));
```
上例中，我们重复定义了多次函数 getLength，前几次都是函数定义，最后一次是函数实现。在编辑器的代码提示中，可以正确的看到前两个提示。

> 注意，TypeScript 会优先从最前面的函数定义开始匹配，所以多个函数定义如果有包含关系，需要优先把精确的定义写在前面。

**建议：** 能用联合类型就用联合类型，如果联合类型实现起来比较麻烦，就用函数重载！

### 4、接口：
多个 `interface` 可以重复，不会发生冲突，会进行合并，但是多个 `type` 不可以重复，会冲突报错

官网推荐的是使用 `interface`，但是像 联合类型 就只能使用 `type`

### 5、枚举：
枚举有个非常大的好处是它的可读性非常强                     

### 6、泛型：
平时开发中我们可能会看到一些常用的名称：
T：Type 的缩写，类型
K、V：key和value的缩写，键值对
E：Element的缩写，元素
O：Object的缩写，对象