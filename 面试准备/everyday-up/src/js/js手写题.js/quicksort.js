/**
 * @description 快速排序
 * @author 刘永奇加油！！！
 */

let arr = [1, 3, 4, 3, 23, 45, 23, 11, 3, 4, 6, 0];

function quicksort(arr) {
  if (arr.length < 2) return arr;
  let info = arr[0];
  let left = [];
  let right = [];
  for (let i = 1; i < arr.length; i++) {
    if (info > arr[i]) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  return [...quicksort(left), info, ...quicksort(right)];
}

console.log(quicksort(arr));
