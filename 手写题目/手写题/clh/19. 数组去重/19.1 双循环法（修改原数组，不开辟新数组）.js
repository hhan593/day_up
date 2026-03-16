/**
 * @author:qiqi
 * @description:19.1 双循环法（修改原数组，不开辟新数组）
 */

const arr = [1, 2, 3, 3, 3, 3, 3, 3, 8, 9, 10];

//19.1 双循环法（修改原数组，不开辟新数组）
//去除数组中的重复元素。
//该函数使用双层循环来比较每个元素与后续的所有元素，如果发现重复元素，则将其移除。
//注意：此方法会修改原数组。
//@param {Array} arr - 需要去重的数组。
//
function uniqueArr(arr) {
  // 遍历数组中的每个元素
  for (let i = 0; i < arr.length; i++) {
    // 从当前元素的下一个位置开始，检查是否存在重复元素
    for (let j = i + 1; j < arr.length; j++) {
      // 如果找到重复元素
      if (arr[i] === arr[j]) {
        // 移除重复元素，注意 splice 操作会改变数组长度
        arr.splice(j, 1);
        // 移除元素后，需要将 j 减 1 以确保索引正确
        j--;
      }
    }
  }
  return arr;
}
console.log(uniqueArr(arr));
