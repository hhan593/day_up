class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'

  constructor (executor) {
    let self = this
    // 初始状态为等待
    self.state = MyPromise.PENDING
    self.value = undefined
    self.reason = undefined
    this.onResolvedCallbacks = []
    this.onRejectedCallbacks = []
    // 成功
    let resolve = function (value) {
      if (self.state === MyPromise.PENDING) {
        self.state = MyPromise.FULFILLED
        self.value = value
        self.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    // 失败
    let reject = function (reason) {
      if (self.state === MyPromise.PENDING) {
        self.state = MyPromise.REJECTED
        self.reason = reason
        self.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    // 立即执行
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  then (onFulfilled, onRejected) {
    // 同步直接处理
    if (this.state === MyPromise.FULFILLED) {
      onFulfilled(this.value)
    }
    if (this.state === MyPromise.REJECTED) {
      onRejected(this.reason)
    }
    // 异步将函数放入数组，待resolve或reject时处理
    if (this.state === MyPromise.PENDING) {
      this.onResolvedCallbacks.push(() => {
        onFulfilled(this.value)
      })
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason)
      })
    }
  }
}