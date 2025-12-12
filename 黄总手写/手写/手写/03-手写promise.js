class MyPromise{
    constructor(executor){
        // 初始化值
        this.initValue()
        // 初始化this指向
        this.initBind()

        // 3. throw
        try {
            // 执行传进来的函数
            executor(this.resolve, this.reject)
        }catch(e){
            // 有错误直接执行reject
            this.reject(e)
        }
    }

    initBind(){
        // 初始化this, resolve和reject的this指向永远指向当前的MyPromise实例，防止随着函数执行环境的改变而改变
        this.resolve = this.resolve.bind(this)
        this.reject = this.reject.bind(this)
    }

    initValue(){
        this.PromiseResult = null  // 终值
        this.PromiseState = 'pending'  // 状态

        // 4.2 定时器情况
        this.onFulfilledCallbacks = [] // 保存成功回调
        this.onRejectedCallbacks = [] // 保存失败回调
    }

    // 1、实现resolve与reject
    resolve(value){
        // 2. 状态不可变
        // state是不可变的
        if(this.PromiseState !== 'pending') return

        // 执行resolve, 改变状态为fulfilled
        this.PromiseState = 'fulfilled'
        // 终值为传进来的值
        this.PromiseResult = value
        // 4.2
        // 执行保存的成功回调
        while (this.onFulfilledCallbacks.length) {
            this.onFulfilledCallbacks.shift()(this.PromiseResult)
        }
    }

    reject(reason){
        // state是不可变的
        if(this.PromiseState !== 'pending') return
        
        // 状态变为rejected
        this.PromiseState = 'rejected'
        this.PromiseResult = reason

        // 4.2
        // 执行保存的失败回调
        while (this.onRejectedCallbacks.length) {
            this.onRejectedCallbacks.shift()(this.PromiseResult)
        }
    }

    // 4.1. 实现then
    then(onFulfilled, onRejected) {
        // 接收两个回调 onFulfilled, onRejected

        // 参数校验，确保一定是函数
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

        // 4.3 then的链式调用
        var thenPromise = new MyPromise((resolve, reject) => {

            const resolvePromise = cb => {
                // 4.4解决then是微任务的问题，需要后面执行
                setTimeout(() => {
                    try {
                        const x = cb(this.PromiseResult)
                        if (x === thenPromise) {
                            // 不能返回自身哦
                            throw new Error('不能返回自身。。。')
                        }
                        if (x instanceof MyPromise) {
                            // 如果返回值是Promise
                            // 如果返回值是promise对象，返回值为成功，新promise就是成功
                            // 如果返回值是promise对象，返回值为失败，新promise就是失败
                            // 谁知道返回的promise是失败成功？只有then知道
                            x.then(resolve, reject)
                        } else {
                            // 非Promise就直接成功
                            resolve(x)
                        }
                    } catch (err) {
                        reject(err)
                    }
                })
            }

            if (this.PromiseState === 'fulfilled') {
                // 如果当前为成功状态，执行第一个回调
                resolvePromise(onFulfilled)
            } else if (this.PromiseState === 'rejected') {
                // 如果当前为失败状态，执行第二个回调
                resolvePromise(onRejected)
            // 4.2 then定时器问题
            } else if (this.PromiseState === 'pending') {
                // 如果状态为待定状态，暂时保存两个回调
                this.onFulfilledCallbacks.push(resolvePromise.bind(this, onFulfilled))
                this.onRejectedCallbacks.push(resolvePromise.bind(this, onRejected))
            }
        })

        
        // 返回这个包装的Promise
        return thenPromise

    }

    // all方法
    // 接收一个Promise数组，数组中如有非Promise项，则此项当做成功
    // 如果所有Promise都成功，则返回成功结果数组
    // 如果有一个Promise失败，则返回这个失败结果
    static all(promises) {
        const result = []
        let count = 0
        return new MyPromise((resolve, reject) => {
            const addData = (index, value) => {
                result[index] = value
                count++
                if (count === promises.length) resolve(result)
            }
            promises.forEach((promise, index) => {
                if (promise instanceof MyPromise) {
                    promise.then(res => {
                        addData(index, res)
                    }, err => reject(err))
                } else {
                    addData(index, promise)
                }
            })
        })
    }

    // race
    // 接收一个Promise数组，数组中如有非Promise项，则此项当做成功
    // 哪个Promise最快得到结果，就返回那个结果，无论成功失败
    static race(promises) {
        return new MyPromise((resolve, reject) => {
            promises.forEach(promise => {
                if (promise instanceof MyPromise) {
                    promise.then(res => {
                        resolve(res)
                    }, err => {
                        reject(err)
                    })
                } else {
                    resolve(promise)
                }
            })
        })
    }

    // allSettled
    // 接收一个Promise数组，数组中如有非Promise项，则此项当做成功
    // 把每一个Promise的结果，集合成数组，返回 
    static allSettled(promises) {
        return new Promise((resolve, reject) => {
            const res = []
            let count = 0
            const addData = (status, value, i) => {
                res[i] = {
                    status,
                    value
                }
                count++
                if (count === promises.length) {
                    resolve(res)
                }
            }
            promises.forEach((promise, i) => {
                if (promise instanceof MyPromise) {
                    promise.then(res => {
                        addData('fulfilled', res, i)
                    }, err => {
                        addData('rejected', err, i)
                    })
                } else {
                    addData('fulfilled', promise, i)
                }
            })
        })
    }

    // any
    // any与all相反
    // 接收一个Promise数组，数组中如有非Promise项，则此项当做成功
    // 如果有一个Promise成功，则返回这个成功结果
    // 如果所有Promise都失败，则报错
    static any(promises) {
        return new Promise((resolve, reject) => {
            let count = 0
            promises.forEach((promise) => {
                promise.then(val => {
                    resolve(val)
                }, err => {
                    count++
                    if (count === promises.length) {
                        reject(new AggregateError('All promises were rejected'))
                    }
                })
            })
        })
    }
}


// 2测试
// const test1 = new MyPromise((resolve, reject) => {
//     // 只以第一次为准
//     resolve('成功')
//     reject('失败')
// })
// console.log(test1)


// 3 测试
// const test3  = new MyPromise((resolve, reject) => {
//     throw('失败')
// })
// console.log(test3)

// 4测试
// const test2 = new MyPromise((resolve, reject) => {
//     setTimeout(() => {
//         resolve('成功') // 1秒后输出 成功
//     }, 1000)
// }).then(res => console.log(res), err => console.log(err))

// 4.3链式调用的测试
const test3 = new MyPromise((resolve, reject) => {
    resolve(100) // 输出 状态：成功 值：200
    // reject(100) // 输出 状态：失败 值：300
}).then(res => 2 * res, err => 3 * err)
    .then(res => console.log(res), err => console.log(err))

const test4 = new MyPromise((resolve, reject) => {
    resolve(100) // 输出 状态：失败 值：200
    // reject(100) // 输出 状态：成功 值：300
    // 这里可没搞反哦。真的搞懂了，就知道了为啥这里是反的
})
.then(res => 
        new MyPromise((resolve, reject) => reject(2 * res)), 
    err => 
        new MyPromise((resolve, reject) => resolve(2 * res)))
    .then(res => console.log(res), err => console.log(err))