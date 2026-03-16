/**
 * @description 手写 Promise.any
 * @author 氧化氢
 */

Promise.any = function(promiseArr) {
  let index = 0
  return new Promise((resolve, reject) => {
    if(!promiseArr.length) return
    promiseArr.forEach((item, i) => {
      Promise.resolve(item).then(val => {
        resolve(val)
      }, err => {
        index++
        if(index === promiseArr.length) {
          reject(new AggregateError('All promises were rejected'))
        }
      })
    })
  })
}