/**
 * @description 手写map
 * @author 鼠鼠要努力
 */

Array.prototype.myMap = function(fn){
  if(Array.isArray(this)) {
    throw new Error('不可以在一个非数组上调用map方法')
  }
  let arr = this;
  let len = arr.length;
  let res = [];
  let thisArg = arguments[1] || window;
  for(let i = 0 ; i < len ; i++){
    res.push(fn.call(thisArg,arr[i],i,arr))
  }
  return res;
}