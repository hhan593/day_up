/**
 * @description 数组拍平
 * @author 刘永奇加油！！！
 */

let arr = [1, 2, 3, [2, 3, 4, [4, 5, 6, 7]]];

function flat1(arr) {
  let newArr = [];
  for (let item of arr) {
    if (Array.isArray(item)) {
      newArr = newArr.concat(flat1(item));
    } else {
      newArr.push(item);
    }
  }
  return newArr;
}

function flat2(arr) {
  return arr.reduce((pre, cur) => {
    return pre.concat(Array.isArray(cur) ? flat2(cur) : cur);
  }, []);
}

function flat3(arr) {
  let arg = arr;
  while (arg.some(Array.isArray)) {
    arg = [].concat(...arg);
  }
  return arg;
}

function flat4(arr, level) {
  return level > 0
    ? arr.reduce((pre, cur) => {
        return pre.concat(Array.isArray(cur) ? flat4(cur, level - 1) : cur);
      }, [])
    : arr.slice(0);
}

console.log(arr.flat(Infinity));
console.log(flat1(arr));
console.log(flat2(arr));
console.log(flat3(arr));
console.log(flat4(arr, 2));
