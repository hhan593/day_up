/*
 * @Author: hh
 * @Date: 2025-06-25 16:44:08
 * @LastEditors: hh
 * @LastEditTime: 2025-06-25 16:55:43
 * @Description:
 */
let nums = [1, 2, 5, 4, 3];
let obj = { val: 5 };
//map - 参数:接受两个参数，一个是回调函数，一个是回调函数的this值(可选)。 其中，回调函数被默认传入三个值，依次为当前元素、当前索引、整个数组。

let newNums = nums.map(function (item, index, array) {
  return item + index + array[index] + this.val;
  //对第一个元素，1 + 0 + 1 + 5 = 7
  //对第二个元素，2 + 1 + 2 + 5 = 10
  //对第三个元素，3 + 2 + 3 + 5 = 13
}, obj);
// console.log(newNums); //[7, 10, 13]

//reduce
//  接收两个参数，一个为回调函数，另一个为初始值。回调函数中三个默认参数，依次为积累值、当前值、整个数组。 不传默认值会自动以第一个元素为初始值，然后从第二个元素开始依次累计。
let sum = nums.reduce((prev, cur) => {
  return prev + cur;
});

//filter
// 接受一个回调函数，回调函数接受三个参数，依次为当前元素、当前索引、整个数组。 返回一个新数组，新数组包含所有满足条件的元素。
let newNums2 = nums.filter((item, index, array) => {
  return item > 5;
});
// console.log(newNums2);

//sort 排序
// 接受一个比较函数，比较函数接受两个参数，依次为当前元素和下一个元素。返回值大于0表示前者大于后者，小于0表示前者小于后者，等于0表示相等。
//当比较函数返回值大于0，则 a 在 b 的后面，即a的下标应该比b大 反之，则 a 在 b 的后面，即 a 的下标比 b 小。
//当然还有一个需要注意的情况，就是比较函数不传的时候，是如何进行排序的？
// 答案是将数字转换为字符串，然后根据字母unicode值进行升序排序，也就是根据字符串的比较规则进行升序排序。

const newNums3 = nums.sort((a, b) => {
  return a - b; // 升序排序
  // return b - a; // 降序排序
});
console.log(newNums3); // [1, 2, 3]
