//如何实现一个 call/apply 函数？

//call方法的主要作用是改变函数执行时的this指向
Function.prototype.call = function (context, ...args) {
  var context = context || window; // 1. 绑定上下文处理
  //可以使用Symbol来生成唯一的属性名，避免冲突
  context.fn = this; // 2. 将原函数挂载到上下文对象 通过将原函数（this）赋值给 context 的属性，实现 this 指向的切换.如果已经有fn属性则会覆盖
  //   3. 执行函数
  var result = context.fn(...args); // 更优方案[5,8](@ref)

  delete context.fn; // 4. 清理临时属性
  return result; // 5. 返回执行结果
};
Function.prototype.apply = function (context, args) {
  let context = context || window;
  context.fn = this;
  let result = eval("context.fn(...args)");

  delete context.fn;
  return result;
};

// 使用 eval 执行函数，传入参数数组 args
// 注意：eval 在严格模式下会抛出错误，且不推荐使用，因为它会影响性能和安全性。更好的方式是使用 Function.prototype.call 或 Function.prototype.apply 来执行函数。
