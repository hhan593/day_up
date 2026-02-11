/**
 * @description 手写 Promise.resolve
 * @author 氧化氢
 */

// 1、传参为一个 Promise，则直接返回它
// 2、传入一个 thenable 的对象，返回的 Promise会跟随这个对象，采用它的最终状态作为自己的状态
// 3、其他情况，直接返回以该值为成功状态的 promise 对象
Promise.resolve = (param) => {
  if(param instanceof Promise) return param
  return new Promise((resolve, reject) => {
    if(param && param.then && typeof param.then === 'function') {
      param.then(resolve, reject)
    } else {
      resolve(param)
    }
  })
}