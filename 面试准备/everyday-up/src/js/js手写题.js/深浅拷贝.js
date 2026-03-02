/**
 * @description 深浅拷贝
 * @author liu
 */

function shollowClone(obj){
  if(typeof obj !== 'object' || obj == null) return obj;
  let newObj = Array.isArray(obj) ? [] : {}
  for(let key in obj){
    if(Object.prototype.hasOwnProperty.call(obj,key)){
      newObj[key] = obj[key];
    }
  }
  return newObj;
}


function deepClone(obj){
  if(typeof obj !== 'object' || obj == null ) return obj;
  let newObj = Array.isArray(obj) ? [] : {};
  for(let key in obj){
    if(Object.prototype.hasOwnProperty.call(obj,key)){
      newObj[key] = deepClone(obj[key]);
    }
  }
  return newObj;
}


function deepClone1(obj,map = new weakMap()){
  if(typeof obj !== 'object' || obj == null ) return obj;
  if(map.has(obj)) return map.get(obj);
  let newObj = Array.isArray(obj) ? [] : {}
  map.set(obj,newObj);
  for(let key in obj){
    if(Object.prototype.hasOwnProperty.call(obj,key)){
      newObj[key] = deepClone(obj[key]);
    }
  }
  return newObj;
}
let a = [111]
let arr =  [1,2,3,4,[1,2,3],{1:2}]
let newArr = deepClone(arr);
newArr[4].push(123)

console.log(arr,newArr);