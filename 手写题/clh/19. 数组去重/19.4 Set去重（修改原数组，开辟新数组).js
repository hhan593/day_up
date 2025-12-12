/**
 * @author:qiqi
 * @description:Set 去重（修改原数组，开辟新数组）
 */

/**
 * 对数组进行去重操作，返回一个新的数组，其中包含原数组中的所有唯一元素。
 * @param {Array} arr - 需要去重的数组。
 * @returns {Array} - 去重后的数组。
 */
function unique(arr) {
  // 使用Set数据结构对数组进行去重，Set只会存储唯一的值
  const res = new Set(arr);
  // 将Set转换为数组并返回
  return [...res];
}
/**
 * 对数组进行去重操作，返回一个新的数组，其中包含原数组中的所有唯一元素。
 * @param {Array} arr - 需要去重的数组。
 * @returns {Array} - 去重后的数组。
 */
const unique_four = (arr) => {
  return Array.from(new Set(arr));
};
