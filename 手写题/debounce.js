/**
 * @description 手写防抖
 * @author 氧化氢
 */

function debounce(fn, wait) {
  let event = null
  return function() {
    if(event) clearTimeout(event)
    
    event = setTimeout(() => {
      fn.call(this)
    }, wait)
  }
}