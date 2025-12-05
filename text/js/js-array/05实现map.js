/*
 * @Author: hh
 * @Date: 2025-06-25 23:07:24
 * @LastEditors: hh
 * @LastEditTime: 2025-06-26 09:43:39
 * @Description: 数组的 map 方法
 */

//实现map
/**
 * 体实现起来并没那么难，需要注意的就是使用 in 来进行原型链查找。同时，如果没有找到就不处理，能有效处理稀疏数组的情况。
 */
// map() 方法创建一个新数组，其结果是该数组中的每个元素都调用

Array.prototype.MyMap = function (callback, thisArg) {
  //首先检查this是否为null或undefined
  if (this === null || this === undefined) {
    throw new TypeError("Cannot read property 'map' of null or undefined");
  }
  //检查回调函数是否为函数
  if (Object.prototype.toString.call(callback) != "[object Function]") {
    throw new TypeError(callback + " is not a function");
  }
  //创建一个新数组来存储结果
  const O = Object(this); // 将this转换为对象
  const T = thisArg || undefined; // 如果提供了thisArg，则使用它，否则为undefined

  const len = O.length >>> 0; // 获取数组的长度，使用无符号右移操作符确保是非负整数
  const result = new Array(len); // 创建一个新数组，长度与原数组相同
  for (let i = 0; i < len; i++) {
    // 还记得原型链那一节提到的 in 吗？in 表示在原型链查找
    // 如果用 hasOwnProperty 是有问题的，它只能找私有属性
    if (i in O) {
      // 检查索引i是否在对象O中
      let kValue = O[i];
      let mappedValue = callback.call(T, kValue, i, O); // 调用回调函数
      result[i] = mappedValue; // 将回调函数的结果存储在新数组中
      // result[i] = callback.call(T, O[i], i, O); // 调用回调函数，并将结果存储在新数组中
    }
  }
  return result; // 返回新数组
};
let arr = new Array(5); // 创建一个长度为5的稀疏数组
arr[0] = 1; // 设置第一个元素
arr[1] = 2; // 设置第二个元素
arr[2] = 3; // 设置第三个元素
arr[3] = 4; // 设置第四个元素
arr[4] = 5; // 设置第五个元素
let result = arr.MyMap((item, index) => {
  console.log(`当前元素: ${item}, 当前索引: ${index}`);
  return item ? item * 2 : 0; // 如果元素存在，则乘以2，否则返回0
});

let result2 = arr.map((item, index) => {
  console.log(`当前元素: ${item}, 当前索引: ${index}`);
  return item ? item * 2 : 0; // 如果元素存在，则乘以2，否则返回0
});
/**
 * *这里解释一下, length >>> 0, 字面意思是指"右移 0 位"，但实际上是把前面的空位用0填充，这里的作用是保证len为数字且为整数。
 * *null >>> 0  //0

 * *undefined >>> 0  //0

 * *void(0) >>> 0  //0

 * *function a (){};  a >>> 0  //0

 * *[] >>> 0  //0

 * *var a = {}; a >>> 0  //0

 * *123123 >>> 0  //123123

 * *45.2 >>> 0  //45

 * *0 >>> 0  //0

 * *-0 >>> 0  //0

 * *-1 >>> 0  //4294967295

 * *-1212 >>> 0  //4294966084
*/
