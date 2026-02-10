/**
 * @description 手写 Promise.all 
 * @author 氧化氢
 */

Promise.all = function(promiseArr) {
  let index = 0, result = []
  return new Promise((resolve, reject) => {
    promiseArr.forEach((item, i) => {
      Promise.resolve(item).then(val => {
        index++
        result[i] = val
        if(index === promiseArr.length) {
          resolve(result)
        }
      }, err => {
        reject(err)
      })
    })
  })
}