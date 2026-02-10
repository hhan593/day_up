/**
 * @description forEach手写
 * @author 刘永奇加油！！！
 */

Array.prototype.myForEach = function(cb){
  let _arr = this, thisArg = arguments[1]
  for(let i  = 0 ; i < _arr.length; i++){
    cb.call(thisArg,_arr[i],i,_arr);
  }
}