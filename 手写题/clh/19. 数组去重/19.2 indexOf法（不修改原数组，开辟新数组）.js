/**
 * @author:qiqi
 * @description: indexOf方法去重数组
 * 从数组中移除重复元素，不修改原数组，返回一个新数组。
 *
 * @param {Array} arr - 需要去重的原始数组。
 * @returns {Array} 去重后的新数组。
 */
function unique_two(arr) {
  // 初始化一个空数组用于存储唯一元素
  const res = [];

  // 遍历原始数组中的每个元素
  arr.map((item) => {
    // 如果结果数组中不存在当前元素，则将其添加到结果数组中
    if (res.indexOf(item) === -1) {
      res.push(item);
    }
  });

  // 返回去重后的结果数组
  return res;
}

// 示例数组，包含一些重复元素
const arr = [1, 2, 3, 3, 3, 3, 3, 3, 8, 9, 10];
console.log(unique_two(arr));
