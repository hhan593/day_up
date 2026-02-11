// 如何模拟实现一个new的效果
/**
 * @author : huihui
 * @description : 手写 new 操作符

在调用new操作符的过程中会发生以下四件事情：
1. 首先会创建一个新的空对象
2. 设置原型，将对象的原型设置为函数的 prototype 对象
3. 让函数的 this 指向这个对象，执行构造函数的代码（为这个新对象添加属性）
4. 判断函数的返回值类型，如果是值类型，返回创建的对象。如果是引用类型，就返回这个引用类型的对象
 */

/**
 * 实现一个模拟new操作符功能的函数
 * @param {Function} ctor 构造函数
 * @param {...*} args 构造函数的参数
 * @returns {Object} 返回构造函数的实例对象
 */
function myNew(ctor, ...args) {
  // ctor为构造函数，args为构造函数的参数
  if (typeof ctor !== "function") {
    throw new TypeError("ctor must be a function");
  }
  let obj = Object.create(ctor.prototype); // 创建一个新对象，并设置原型为ctor.prototype
  /*
  之前的实现无法正常工作是因为ES6类的构造函数（constructor）内部有一个严格的要求：
  它们必须使用new关键字来调用。这个要求是由JavaScript引擎强制执行的，目的是确保类的构造函数不会被错误地当作普通函数来调用，
  从而避免潜在的错误或不期望的行为。
  */
  // let res = ctor.apply(obj, args); // 执行构造函数，并将this指向新对象,但是这样的是错误的
  //构造一个新的对象。  指定传递给构造函数的参数。  指定新对象的原型（第三个参数）
  const res = Reflect.construct(ctor, args, ctor); // 使用Reflect.construct方法来执行构造函数，并将this指向新对象
  // 判断构造函数执行结果是否为对象或函数
  let isObject = typeof res === "object" && res !== null;
  let isFunction = typeof res === "function";
  // 如果构造函数返回的是对象或函数，则直接返回，否则返回新创建的对象
  return isObject || isFunction ? res : obj;
}

class Person {
  constructor(name) {
    this.name = name;
  }
  sayName() {
    console.log(this.name);
  }
}

let p = myNew(Person, "huihui");
p.sayName();
