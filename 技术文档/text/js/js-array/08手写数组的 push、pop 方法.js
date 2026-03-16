/*
 * @Author: hh
 * @Date: 2025-06-26 10:35:47
 * @LastEditors: hh
 * @LastEditTime: 2025-06-26 10:35:53
 * @Description:手写数组的 push、pop 方法
 */

Array.prototype.push = function (...items) {
  let O = Object(this);
  let len = this.length >>> 0;
  let argCount = items.length >>> 0;
  // 2 ** 53 - 1 为JS能表示的最大正整数
  if (len + argCount > 2 ** 53 - 1) {
    throw new TypeError(
      "The number of array is over the max value restricted!"
    );
  }
  for (let i = 0; i < argCount; i++) {
    O[len + i] = items[i];
  }
  let newLength = len + argCount;
  O.length = newLength;
  return newLength;
};

Array.prototype.pop = function () {
  let O = Object(this);
  let len = this.length >>> 0;
  if (len === 0) {
    O.length = 0;
    return undefined;
  }
  len--;
  let value = O[len];
  delete O[len];
  O.length = len;
  return value;
};
