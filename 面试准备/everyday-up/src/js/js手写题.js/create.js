/**
 * @description Object.Create
 * @author liu
 */

Object.prototype.myCreate = function(proto,property = undefined){

  function Fn(){}
  let obj = new Fn()
  obj.prototype = proto;
  if(property){
    Object.defineProperty(obj,property);
  }
  return obj;
}