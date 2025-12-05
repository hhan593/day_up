//Object.create 是 JavaScript 中的一个方法，用于创建一个新对象，并且可以指定该新对象的原型（prototype）对象。
/**
 * javascript
var 新对象 = Object.create(原型对象[, 属性描述符对象]);
第一个参数是作为新对象原型的对象。
第二个参数（可选）是一个属性描述符对象，其键是新对象上要定义的属性名，值是这些属性的描述符（与 Object.defineProperties() 的第二个参数格式相同）。
这个参数允许你为新对象添加自己的属性并设置它们的特性（如是否可写、可枚举等）。
 */

/**
 * 创建一个新对象，并为其设置原型和属性
 * @param {Object|Function} proto - 新对象的原型，可以是对象或函数类型
 * @param {Object} property - 可选参数，定义新对象的属性
 * @returns {Object} - 返回新创建的对象
 * @throws {TypeError} - 如果proto参数不是对象或函数类型，抛出类型错误
 * @throws {TypeError} - 如果property参数是null，抛出类型错误
 */
function cerete(proto, property = undefined) {
  // 检查proto参数类型，确保它只能是对象或函数类型
  if (typeof proto !== "object" && typeof proto !== "function") {
    throw TypeError(`${proto}只接受对象或者null`); //因为 Object的原型为 null
  }
  // 检查property参数，确保它不会是null
  if (property === null) {
    throw TypeError(`${property} 不能是 null`);
  }

  // 创建一个临时函数F，用于创建新对象
  function Fn() {}
  // 将临时函数F的原型设置为proto参数
  Fn.prototype = proto;
  // 使用临时函数F创建新对象
  const obj = new Fn();
  // 如果property参数被提供，则为新对象定义这些属性
  if (property !== undefined) {
    Object.defineProperties(obj, property);
  }
  // 如果proto参数是null，则将新对象的原型设置为null
  if (proto === null) {
    obj.__proto__ = null;
  }
  // 返回新创建的对象
  return obj;
}
/**
 * 
 *   为什么上面要设置obj.__proto__ = null，如果传入的第一个参数是null，那么理论上了来说new Foo时返回的对象的__proto__不就指向null吗？为什么还要这个设置一下呢？
     因为不会生效，请看下面示例代码
 *
 */
function Fn(name, age) {
  this.name = name;
  this.age = age;
}
Fn.prototype = null;

const obj = new Fn("小明", 18);
console.log(obj.__proto__ === null); //false
/**
 * 将Fn.prototype设置为null，new Fn返回的对象的__proto__应该是null但是却不是null，说明没有设置成功，所以需要手动设obj的__proto__属性为null
function Fn(name, age) {
  this.name = name;
  this.age = age;
}
Fn.prototype = null;
const obj = new Fn("刘豪", 20);
obj.__proto__ = null; // 以前的写法
// Object.setPrototypeOf(obj, null); // 官方推荐的写法 Object的静态方法，用于设置对象的原型，返回值是obj
console.log(obj.__proto__ == null); // true
*/
