/*
 * @Author: hh
 * @Date: 2025-06-25 21:50:49
 * @LastEditors: hh
 * @LastEditTime: 2025-06-25 22:03:48
 * @Description: JS判断数组中是否包含某个值
 */

// 判断数组中是否包含某个值
/**
 * 1. 使用 indexOf() 方法
 * 2. 使用 includes() 方法
 * 3. 使用 find() 方法
 * 4. 使用 findIndex() 方法
 */
//indexOf() 方法返回数组中某个指定的元素第一次出现的位置(下标)，如果不存在则返回 -1。
const arr = [1, 2, 3, 4, 5];
var index = arr.indexOf(3); // 返回值为2
index !== -1 ? console.log('包含') : console.log('不包含'); // 包含


// includes() 方法判断数组中是否包含某个值，返回布尔值。
console.log("includes方法实现");
arr.includes(3) ? console.log('包含') : console.log('不包含'); // 包含


// find() 方法返回数组中满足提供的测试函数的第一个元素的值，否则返回 undefined。
console.log("find方法实现");
const found = arr.find(element => element > 3);

found !== undefined ? console.log('包含') : console.log('不包含'); // 包含

// findIndex() 方法返回数组中满足提供的测试函数的第一个元素的索引，否则返回 -1。
const foundIndex = arr.findIndex((element)=>{
    // element => element = 3
    console.log(element);
    return element == 3; // 返回第一个大于3的元素的索引
});
console.log(foundIndex); // 3