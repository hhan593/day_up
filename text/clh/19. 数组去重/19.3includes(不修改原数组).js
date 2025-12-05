const arr = [1, 2, 3, 3, 3, 3, 3, 3, 8, 9, 10];
/**
 * @author:QIQI
 * @description: 19.3includes.js数组去重
 */
/**
 *
 * 对数组进行去重操作，返回一个新的数组，其中包含原数组中的所有唯一元素。
 * @param {Array} arr - 需要去重的数组。
 * @returns {Array} - 去重后的数组。
 */
function unique_three(arr) {
  // 创建一个空数组用于存储去重后的结果
  const res = [];
  // 使用map方法遍历原数组
  arr.map((item) => {
    // 如果结果数组中不包含当前元素，则将其添加到结果数组中
    if (!res.includes(item)) {
      res.push(item);
    }
    // 返回结果数组（在map方法中返回值是可选的，这里返回res是为了保持代码的一致性）
    return res;
  });
}
