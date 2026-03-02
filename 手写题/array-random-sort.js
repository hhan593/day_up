/**
 * @description 实现数组的随机排序
 * @author 氧化氢
 */

// 生成随机数大于等于 min 小于 max的随机数字：
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// 生成随机的下标，然后放入新数组：
function randomSort(arr) {
  var result = [];
  while (arr.length > 0) {
    var randomIndex = Math.floor(Math.random() * arr.length);
    result.push(arr[randomIndex]);
    arr.splice(randomIndex, 1);
  }
  return result;
}

// 
function randomSort(arr) {
  var index,
  randomIndex,
  temp,
  len = arr.length;

  for (index = 0; index < len; index++) {
    randomIndex = Math.floor(Math.random() * (len - index)) + index;
    temp = arr[index];
    arr[index] = arr[randomIndex];
    arr[randomIndex] = temp;
    // 解构赋值：
    //[array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }
  
  return arr;
}