/**
 * @description 手写 Promise.race
 * @author 氧化氢
 */

// Promise.race 会返回一个由所有可迭代实例中第一个 fulfilled 或 rejected 的实例包装后的新实例。
Promise.race = function(promiseArr) {
  return new Promise((resolve, reject) => {
    promiseArr.forEach(item => {
      Promise.resolve(item).then(val => {
        resolve(val)
      }, err => {
        reject(err)
      })
    }) 
  })
}