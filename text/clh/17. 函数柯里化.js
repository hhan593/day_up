/**
 * 函数柯里化指的是一种将多个参数的一个函数转换成一系列使用一个参数的函数的技术
 */
/**
 * 函数柯里化
 * 将一个函数转化为一系列只接受一个参数的函数
 * @param {Function} fn 需要进行柯里化的函数
 * @returns {Function} 柯里化后的函数
 */
function curry(fn) {
  // 检查传入的是否为函数，若不是则抛出类型错误
  if (typeof fn !== "function") throw TypeError(`${fn}不是一个函数`);

  // curried函数接收已传入的参数
  function curried(...arg) {
    // 当传入的参数数量达到或超过原函数所需参数数量时，执行原函数并返回结果.当参数数量小于函数所需参数数量时，返回一个函数（more函数），用于接收后续参数
    if (arg.length >= fn.length) {
      return fn(...arg);
    } else {
      console.log("参数数量比较多，不会执行more");
      // more函数用于接收后续传入的参数
      function more(...arg2) {
        // 将新传入的参数与已传入的参数合并，继续传递给curried函数
        return curried(...arg, ...arg2);
      }
      // 返回more函数，以便接收后续参数
      return more;
    }
  }
  // 返回curried函数，即柯里化后的函数
  return curried;
}

/**
 * 加法函数
 * 接受三个参数并返回它们的和
 * @param {number} a 第一个加数
 * @param {number} b 第二个加数
 * @param {number} c 第三个加数
 * @returns {number} 三个参数的和
 */
function add(a, b, c) {
  return a + b + c;
}

// 将add函数进行柯里化
const A = curry(add);
// 使用柯里化后的函数进行计算
console.log(A(16, 12)(5));
//A(16, 12, 5)这样传递即可，但是如果出现这种A((12,30))的参数不足时，函数会可以接受更多的参数即A((12,30)(9))
