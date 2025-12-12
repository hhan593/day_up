const p1 = new Promise((resolve, reject) => {
    resolve('成功')
}).then(res => console.log(res), err => console.log(err))

// 一秒后输出失败
const p2 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('失败')
    }, 1000)
}).then(res => console.log(res), err => console.log('err+',err))

// 链式调用 输出 200
const p3 = new Promise((resolve, reject) => {
    resolve(100)
}).then(res => {return 2 * res}, err => console.log(err))
.then(res => console.log(res), err => console.log(err))