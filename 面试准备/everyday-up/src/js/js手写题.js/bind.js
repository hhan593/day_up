/**
 * 手写bind函数
 */

Function.prototype.myBind = function(context,...arg){
  if(typeof this !== 'function'){
    throw new Error('this no a function')
  }

  let self = this;
  function Fn(...args){
    self.apply(this instanceof Fn ?  this : context,[...arg,...args]);
  }
  return Fn;
}