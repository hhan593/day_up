/**
 * @description 偏函数
 * @author 氧化氢
 */

function partial(fn, ...rest) {
  function over(...args) {
    return fn(...rest, ...args)
  }
  return over
}

function add(a, b, c) {
  return a + b + c
}
let partialAdd = partial(add, 1)
console.log(partialAdd(2, 3));