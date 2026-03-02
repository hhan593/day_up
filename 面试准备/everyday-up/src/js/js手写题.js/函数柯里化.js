/**
 * 函数柯里化技巧
 */

function curry(fn){
  return function curried(...arg){
    if(arg.length >= fn.length){
      return fn(...arg)
    }else{
      function temp(...args){
        return curried(...arg,...args);
      }
      return temp;
    }
  }
}
let add = (a,b,c)=>{
  return a + b + c
}
let a = curry(add);
console.log(a(1,2,4));