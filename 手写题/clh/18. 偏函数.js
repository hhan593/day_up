/**
 * 偏函数就是将一个 n 参的函数转换成固定 x 参的函数，剩余参数（n - x）将在下次调用全部传入。
 * @param {Function} fn - 需要转换的函数
 * @param {...any} rest - 固定的参数
 * @returns {Function} - 返回一个接受剩余参数的函数
 */
function partial(fn, ...rest) {
  // 定义一个新函数，用于处理剩余的参数
  function over(...args) {
    // 将固定的参数和新传入的参数合并后传给原函数
    return fn(...rest, ...args);
  }
  // 返回处理剩余参数的新函数
  return over;
}

// 定义一个简单的加法函数，接受三个参数
function add(a, b, c) {
  // 返回三个参数的和
  return a + b + c;
}
// 使用偏函数固定加法函数的第一个参数为1
let partialAdd = partial(add, 1);
// 调用偏函数，传入剩余的两个参数，并输出结果
console.log(partialAdd(2, 3));
