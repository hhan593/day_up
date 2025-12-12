/**
 * 手写apply
 */

Function.prototype.myApply = function(context,arg){
  if(typeof this !== 'function'){
    throw TypeError('不能在非函数上调用apply')
  }
  if(typeof context !== 'object') context = new Object(context)
  context = context || window;
  const key = Symbol()
  context[key] = this;
  const res = context[key](...arg);
  delete context.fn;
  return res;
}