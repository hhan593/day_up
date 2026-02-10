/**
 * @description 函数柯里化
 * @author 氧化氢
 */

 function curry(fn) {
  if(typeof fn !== 'function') throw TypeError(`${fn}不是一个函数`)

  function curried(...arg) {
    if(arg.length >= fn.length) {
      return fn(...arg)
    } else {
      function more(...arg2) {
        return curried(...arg, ...arg2)
      }
      return more
    }
  }
  return curried
}

function add(a, b, c) {
  return a + b + c
}

const A = curry(add)
console.log(A(1)(1)(1));