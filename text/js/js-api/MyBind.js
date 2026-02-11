// 如何模拟实现一个 bind 的效果？
/*
实现bind之前，我们首先要知道它做了哪些事情。

1. 对于普通函数，绑定this指向

2. 对于构造函数，要保证原函数的原型对象上的属性不能丢失

3. 函数柯理化（预先处理一部分参数）

4. 返回一个新的函数，这个函数可以被调用
*/

Function.prototype.myBind = function (context, ...args) {
  //确保只有函数对象可调用 bind。this 指向调用 bind 的函数本身，若调用者非函数（如 Object.bind()），则抛出错误。
  if (typeof this !== "function") {
    throw new TypeError(
      "Function.prototype.myBind - what is trying to be bound is not callable"
    );
  }
  var self = this; // 保存原函数的引用
  var fNOP = function () {}; // 创建一个空函数，用于继承原函数的原型

  var fbound = function () {
    self.apply(
      this instanceof self ? this : context,
      args.concat(Array.prototype.slice.call(arguments))
    );
  };
  fNOP.prototype = this.prototype; //fNOP.prototype 指向原函数的原型（this.prototype），建立原型关联
  fbound.prototype = new fNOP(); // fbound.prototype 继承自 fNOP 的实例，从而间接继承原函数的原型链

  return fbound;
};
