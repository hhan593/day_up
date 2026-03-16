/**
 * @description 手写 promise.reject
 * @author 氧化氢
 */

Promise.reject = function(reason) {
  return new Promise((resolve, reject) => reject(reason))
}