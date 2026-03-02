/**
 * new 都干了什么？
 */

function myNew(Conf,...arg){
  let obj = new Object(Conf.prototype);
  let res = Conf.apply(obj,arg);
  return typeof res === 'object' || res !== null ? res : obj;
}