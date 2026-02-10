/**
 * @description 冒泡排序
 * @author 氧化氢
 */

// 思想：
// 冒泡排序的基本思想是，对相邻的元素进行两两比较，顺序相反则进行交换，这样，每一趟会将最小或最大的元素“浮”到顶端， 最终达到完全有序。
// 当排序序列为已排序序列时，为最好的时间复杂度为 O(n)。冒泡排序的平均时间复杂度为 O(n²) ，最坏时间复杂度为 O(n²) ，空间复杂度为 O(1) ，是稳定排序。
var arr = [3, 5, 6, 82, 83, 4, 6, 10]

function bubbleSort(arr) {
  for (var i = 0; i < arr.length - 1; i++) {
    for (var j = 0; j < arr.length - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j + 1], arr[j]] = [arr[j], arr[j + 1]]
      }
    }
  }

  return arr
}

console.log(bubbleSort(arr));

// https://www.bilibili.com/video/BV1yK4y1h7F2?from=search&seid=13859277302363611901&spm_id_from=333.337.0.0