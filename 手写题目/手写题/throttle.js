/**
 * @description 手写节流
 * @author 氧化氢
 */

function throttle(fn, wait) {
  let flag = true
  return function() {
    if(flag) {
      setTimeout(() => {
        fn.call(this)
        flag = true
      }, wait)
      flag = false
    }
  }
}