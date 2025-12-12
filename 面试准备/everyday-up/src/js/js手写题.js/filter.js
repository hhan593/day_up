/**
 * @description 手写filter
 * @author 练就有效，学就有用
 *
 *
 */

Array.prototype.myFilter = function (fn) {
  let _arr = this,
    thisArg = arguments[1] || window;
  let res = [];
  let len = _arr.length;
  for (let i = 0; i < len; i++) {
    if (fn.call(thisArg, _arr[i], i, _arr)) {
      res.push(_arr[i]);
    }
  }
  return res;
};
