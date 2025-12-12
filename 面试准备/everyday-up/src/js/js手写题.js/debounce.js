/**
 * @description 防抖
 * @author 奥里给！！！
 */

function debounce(fn, wait) {
  let timer = null;
  return function fn(...arg) {
    let context = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn.apply(context, arg), wait);
  };
}
