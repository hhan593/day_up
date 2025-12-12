// webpack.config.js
module.exports = {
    module: {
        rules: [
            {
                test: /\.txt$/,
                use: {
                    loader: path.resolve(__dirname, './txt-loader.js'),
                    options: {
                        name: 'HHH'
                    }
                }
            }
        ]
    }
}

// txt. loader.js

var utils = require('loader-utils')

module.exports = function (source) {
    const options = utils.getOptions(this)
    source = source.replace(/\[name\]/g, options.name)
    return `export default ${ JSON.stringify({content: source, filename: this.resourcePath})}`
}


// 测试在项目中import 的txt文件
// test loader output from [name]

// 前端引用
import test from '@/public/test.txt'

// 在浏览器log中出结果，因为txt中保存时自动换行了
{
    content: "test loader output from HHH."
    filename: 'Users/HHH/Desktop/src/public/test.txt'
}
