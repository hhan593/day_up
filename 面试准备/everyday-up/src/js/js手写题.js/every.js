/**
 * @description every手写
 * @author 加油！！！
 */

Array.prototype.myEvery = function (fn) {
  let _arr = this,
    thisArg = arguments[1] || window;
  let res = true;
  for (let i = 0; i < _arr.length; i++) {
    if (!fn.call(thisArg, _arr[i], i, _arr)) {
      res = false;
    }
  }
  return res;
};
