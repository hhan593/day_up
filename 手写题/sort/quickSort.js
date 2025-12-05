/**
 * @description 快速排序
 * @author 氧化氢
 */


// 思想：快速排序的基本思想是通过一趟排序将要排序的数据分割成独立的两部分，其中一部分的所有数据都比另外一部分的所有数据 都要小，然后再按此方法对这两部分数据分别进行快速排序，整个排序过程可以递归进行，以此达到整个数据变成有序序列。


var arr = [3, 5, 6, 82, 83, 4, 6, 10]

function quickSort(arr) {
  if(arr.length == 1 || arr.length == 0) return arr
  let midIndex = Math.floor(arr.length / 2)
  let currentItem = arr.splice(midIndex, 1)
  let leftArr = [], rightArr = []
  arr.forEach(item => {
    if(item <= currentItem) {
      leftArr.push(item)
    } else {
      rightArr.push(item)
    }
  })
  console.log(leftArr, currentItem, rightArr);
  return quickSort(leftArr).concat(currentItem, quickSort(rightArr))
}

console.log(quickSort(arr));

// 快速排序的空间复杂度取决于递归的深度，所以最好的时候为 O(logn)，最坏的时候为 O(n)。快速排序的平均时间复杂度为 O(nlogn) ，最坏时间复杂度为 O(n²) ，空间复杂度为 O(logn) ，不是稳定排序