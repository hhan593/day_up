/**
 * @description 偏函数
 * @author 小刘加油，要努力！！！
 */

function fn(...arg){
  return function fns(...args){
    let res = 0 ;
    [...arg,...args].forEach((item)=>{
      res += item;
    })
    return res;
  }
}

const a = fn(1,2,3,4,5);
console.log(a(1,1,1,1,1))