/**
 * 判断传入对象的数据类型。
 *
 * 该函数通过调用 Object.prototype.toString 方法获取对象的内部 [[Class]] 属性，
 * 然后截取字符串并转换为小写，以准确判断数据类型，包括对象、数组、函数等。
 *
 * @param {any} obj - 需要检测类型的对象，可以是任意类型。
 * @returns {string} - 返回对象类型的字符串，例如 "object"、"array"、"function" 等。
 */
function HH_typeof(obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}
console.log(HH_typeof(2));
