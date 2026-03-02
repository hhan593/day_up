/**
 * @description 选择排序
 * @author 氧化氢
 */


// 选择排序不管初始序列是否有序，时间复杂度都为 O(n²)。选择排序的平均时间复杂度为 O(n²) ，最坏时间复杂度为 O(n²) ，空间复杂度为 O(1) ，不是稳定排序。
var arr = [3, 5, 6, 82, 83, 4, 6, 10]

function selectSort(arr) {
  for(var i = 0; i < arr.length; i++) {
    let minIndex = i
    for(var j = i+1; j < arr.length; j++) {
      if(arr[minIndex] > arr[j]) minIndex = j
    }
    [arr[minIndex], arr[i]] = [arr[i], arr[minIndex]]
  }

  return arr
}

console.log(selectSort(arr));

// https://www.bilibili.com/video/BV1V741127GL?from=search&seid=16847063567155014964&spm_id_from=333.337.0.0