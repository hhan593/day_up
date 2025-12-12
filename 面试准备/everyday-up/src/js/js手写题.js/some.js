/**
 * @description 手写some
 * @author 你最棒
 */

Array.prototype.mySome = function(fn){
  let _arr = this, thisArg = arguments[1] || window
  let res = false;
  for(let i = 0 ; i < _arr.length; i++){
    if(fn.call(thisArg,_arr[i],i,_arr)){
      res = true;
    }
  }
  return res;
}