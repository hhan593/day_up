/*
 * @Author: hh
 * @Date: 2025-06-26 09:32:08
 * @LastEditors: hh
 * @LastEditTime: 2025-06-26 09:46:29
 * @Description:手写数组的 reduce 方法
 
 */
/**
 * @description: reduce() 方法对数组中的每个元素执行一个由您提供的函数（升序执行），将其结果汇总为单个返回值。
 * @description: reduce() 方法接收四个参数：回调函数、初始值、thisArg 和可选的初始值。
 * @description: 回调函数接收四个参数：累加器、当前值 、当前索引和原数组。
 *
 */

Array.prototype.MyReduce = function (callback, initialValue) {
  //处理数组类型异常
  if (this === null || this === undefined) {
    throw new TypeError("Cannot read property 'reduce' of null or undefined");
  }
  //检查回调函数是否为函数
  //使用typeof来检查回调函数是否为函数，不严谨，对于一些特殊情况可能会导致错误的返回function
  // Object.prototype.toString.call(callback) === "[object Function]" 更精确，能区分不同类型的函数和对象
  //   console.log(typeof document.createElement); // 可能是 "function" 或 "object"
  // console.log(Object.prototype.toString.call(document.createElement)); // "[object Function]"
  //   if (typeof callback !== "function") {
  //     throw new TypeError(callback + " is not a function");
  //   }
  if (Object.prototype.toString.call(callback) != "[object Function]") {
    throw new TypeError(callback + " is not a function");
  }

  let O = Object(this); // 将this转换为对象
  let len = O.length >>> 0; // 获取数组的长度，使用无符
  let k = 0; // 初始化索引
  let accumulator = initialValue; // 累加器
  // 如果没有提供初始值，则使用数组的第一个元素作为初始值
  if (accumulator === undefined) {
    // 如果没有提供初始值，则使用数组的第一个元素作为初始值
    for (; k < len; k++) {
      if (k in O) {
        accumulator = O[k]; // 将第一个元素赋值给累加器
        k++; // 累加器已经有值了，所以从下一个元素开始
        break; // 跳出循环
      }
    }

    // 如果数组为空且没有提供初始值，则抛出错误
    throw new TypeError("Reduce of empty array with no initial value");
  }
  for (; k < len; k++) {
    if (k in O) {
      // 检查索引k是否在对象O中
      accumulator = callback(accumulator, O[k], k, O); // 调用回调函数
    }
  }
  return accumulator; // 返回累加器
};

let arr = new Array(1, 2, 5, 9, 6); // 创建一个长度为5的稀疏数组
arr.reduce((accumulator, currentValue, index, array) => {
  console.log(
    `累加器: ${accumulator}, 当前值: ${currentValue}, 当前索引: ${index}, 原数组: ${array}`
  );
  return accumulator + currentValue; // 累加器加上当前值
}, 0); // 初始值为0
let result = arr.MyReduce((accumulator, currentValue, index, array) => {
  console.log(
    `累加器: ${accumulator}, 当前值: ${currentValue}, 当前索引: ${index}, 原数组: ${array}`
  );
  return accumulator + currentValue; // 累加器加上当前值
}, 0); // 初始值为0
