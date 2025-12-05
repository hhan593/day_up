/**
 * @author hh
 * @description 浅拷贝
 */

/**
 * 这就是浅拷贝的限制所在了。
 * 它只能拷贝一层对象。如果有对象的嵌套，那么浅拷贝将无能为力。
 * 但幸运的是，深拷贝就是为了解决这个问题而生的，它能
 * 深拷贝可以解决浅拷贝的问题，它可以拷贝多层对象。
 */

const arr = [1, 2, 3, 4, 5];
const arr1 = [1, 2, 56, [12, 85]];
const obj = {
  a: 1,
  b: 2,
  c: 3,
};
let obj1 = {
  a: 1,
  b: 2,
  c: 3,
  d: [1, 2, 3],
};
//1. 手动实现
const shallowCopy1 = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj; // 如果不是对象或为null，直接返回
  }
  // 创建一个新的对象或数组，取决于原对象的类型
  let newObj = Array.isArray(obj) ? [] : {};
  //使用for in 循环遍历对象的属性
  // 注意：for in 循环会遍历对象的所有可枚举属性，包括原型链上的属性
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = obj[key]; // 直接赋值，进行浅拷贝
    }
  }
  return newObj;
};
const newArr = shallowCopy1(arr1);
// console.log(newArr, arr);
let newObj = shallowCopy1(obj1);
// console.log(newObj.d === obj1.d);
// 浅拷贝只复制对象的一层属性，对于嵌套的对象或数组，仍然是引用关系，修改新对象的属性可能会影响原对象。
newObj.d[0] = 100;
// console.log(newObj.d, obj1.d); //[ 100, 2, 3 ] [ 100, 2, 3 ]

//2.S使用object.assign() 方法
//但是需要注意的是，Object.assgin() 拷贝的是对象的属性的引用，而不是对象本身。
let obj2 = { name: "sy", age: 18 };
const newObj2 = Object.assign({}, { sex: 1 }, obj2);
console.log(newObj2.name == obj2.name); // true

/**************************************************     使用concat实现浅拷贝 */

const arr3 = [1, 23, 56, 78];
const newArr3 = arr3.concat();
console.log(newArr3, arr3);

// 拓展运算符  ...
const newArr4 = [...arr3];
console.log(newArr4, arr3);

//使用slice实现浅拷贝

const newArr5 = arr3.slice();
console.log(newArr5, arr3);
