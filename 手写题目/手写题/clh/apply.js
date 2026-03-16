/**
 * @author:琪琪
 *@description:手写 apply
 */
//但是必须在浏览器环境下才会有window
Function.prototype.myApply = function (context = window, args) {
  // 只能函数调用 apply
  if (typeof this !== "function") {
    throw "apply应该被函数所调用";
  }

  // 如果传入的是值类型，会被new Object
  if (typeof context !== "object") context = new Object(context);
  // 如果传入参数是null，非严格模式会默认指向(全局)window
  context = context || window;
  // 在context上加一个唯一值，防止出现属性名覆盖
  const symbolKey = Symbol();
  // this 就是当前函数
  context[symbolKey] = this;
  // 相当于 obj.fn()执行 fn内部this指向context(obj)
  const res = context[symbolKey](...args);

  delete context[symbolKey];

  return res;
};
