/**
 * @description 手写instanceof
 * @author : 刘永奇加油！！！
 */

function myInstanceOf(leftObj,rightObj){
  let proto = Object.getPrototypeOf(leftObj);
  while(true){
    if(!proto) return false;
    if(proto === rightObj.prototype) return true;
    proto = Object.getPrototypeOf(proto)
  }
}