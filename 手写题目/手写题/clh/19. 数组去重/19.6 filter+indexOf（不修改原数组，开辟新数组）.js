// 定义一个数组，包含了一些整数元素
const arr = [1, 8, 3, 5, 5, 6, 9, 8, 9, 10];

/**
 * 函数: unique
 * 用途: 去除数组中的重复元素
 * 参数: arr - 需要去重的数组
 * 返回值: 返回一个新的数组，包含原数组中不重复的元素
 */
const unique = (arr) => {
  // 使用filter方法遍历数组，通过indexOf方法检查元素的首次出现位置是否与当前索引相同
  // 如果相同，则表示该元素是首次出现，应包含在结果数组中
  return arr.filter((item, index) => {
    return arr.indexOf(item) === index;
  });
};
