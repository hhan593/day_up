/**
 * @description 手写 Promise.allSettled 
 * @author 氧化氢
 */
// 直接手写：
Promise.allSettled_1 = function(promiseArr) {
  let result = [], i = 0
  return new Promise((resolve, reject) => {
    promiseArr.forEach((item, index) => {
      Promise.resolve(item).then(val => {
        i++
        result[index] = {
          status: 'fulfilled',
          value: val
        }
        if(i === promiseArr.length) {
          resolve(result)
        }
      }, err => {
        i++
        result[index] = {
          status: 'rejected',
          reason: err
        }
        if(i === promiseArr.length) {
          resolve(result)
        }
      })
    })
  })
}

// 通过 promise.all实现
Promise.allSettled_2 = function (promises) {
  return Promise.all(promises.map(p => Promise.resolve(p).then(res => {
    return { status: 'fulfilled', value: res }
  }, error => {
    return { status: 'rejected', reason: error }
  })));
};


// 测试：
const promise2 = Promise.resolve(3);
const promise1 = new Promise((resolve, reject) => setTimeout(reject, 2000, 'foo'));
const promises = [promise1, promise2];

Promise.allSettled(promises).
  then((results) => {
    console.log(results)
  });