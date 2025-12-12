/**
 * author: qiqi
 * 手写 instanceOf方法
 */
// 基础知识：原型链
//getPrototypeOf 方法返回指定对象的原型

/**
 * 判断一个对象是否为某个类的实例
 * @param {Any} target - 需要检测的对象
 * @param {Function} origin - 构造函数或类
 * @returns {boolean} - 如果target是origin的实例，则返回true；否则返回false
 */
function myInstanceOf(target, origin) {
  // 原始类型返回false
  if (
    (typeof target !== "object" && typeof target !== "function") ||
    target === null
  )
    return false;
  // Object.getPrototypeOf() 静态方法返回指定对象的原型
  let proto = Object.getPrototypeOf(target);
  // 获取构造函数的原型对象
  let prototype = origin.prototype;
  // 通过原型链向上遍历，直到找到匹配的原型或遍历到null,一直遍历
  while (true) {
    if (!proto) return false;
    if (proto === prototype) return true;

    // 继续向上遍历原型链
    proto = Object.getPrototypeOf(proto);
  }
}

const obj = {};
console.log(obj instanceof Object);
console.log(myInstanceOf(obj, Object));
