/**
 * @description 插入排序
 * @author 氧化氢
 */

// 当排序序列为已排序序列时，为最好的时间复杂度 O(n)。插入排序的平均时间复杂度为 O(n²) ，最坏时间复杂度为 O(n²) ，空间复杂度为 O(1) ，是稳定排序
var arr = [3, 5, 6, 82, 83, 4, 6, 10]

function insertSort(arr) {
  for(var i = 1; i < arr.length; i++) {
    var curVal = arr[i]
    var j = i - 1
    while(j >= 0 && curVal < arr[j]) {
      arr[j+1] = arr[j]
      j--
    }
    arr[j+1] = curVal
  }

  return arr
}

console.log(insertSort(arr));

// https://www.bilibili.com/video/BV1qU4y157sS?from=search&seid=8543612679184171497&spm_id_from=333.337.0.0