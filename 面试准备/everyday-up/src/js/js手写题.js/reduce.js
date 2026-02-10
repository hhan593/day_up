/**
 * @description 手写reduce
 * @author 拿下
 */

Array.prototype.myReduce = function(fn,init = null){
  let _arr = this
  let i = init ? 0 : 1;
  init = init ? init : _arr[0];
  let pre = init;
  for(; i < _arr.length; i++){
    pre = fn(pre,_arr[i],i,_arr);
  }
  return pre;
}

let arr = [1,2,3,4,5,6];

console.log(arr.myReduce((pre,cur)=>{
  return pre+cur
},10))

