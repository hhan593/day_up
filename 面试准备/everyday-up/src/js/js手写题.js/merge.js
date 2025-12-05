/**
 * @description 归并排序
 * @author 刘永奇加油！！！
 */
function merge(arr) {
  if (arr.length == 1) return arr;
  let mid = Math.floor(arr.length / 2);

  return mergeTwo(merge(arr.slice(0, mid)), merge(arr.slice(mid)));
}

function mergeTwo(left, right) {
  let newArr = [];
  while (left.length && right.length) {
    if (left[0] < right[0]) {
      newArr.push(left.shift());
    } else {
      newArr.push(right.shift());
    }
  }
  return newArr.concat(left).concat(right);
}

let arr = [1, 3, 4, 3, 23, 45, 23, 11, 3, 4, 6, 0];
console.log(merge(arr));
