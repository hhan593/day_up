/**
 * @description 查找对象值
 * @author 刘永奇加油！！！
 */

const obj = { a: { b: 1, c: { e: 2, f: 4 } }, d: 3 };

function findPropFromObj(obj, path) {
  let arr = path.split(".");
  for (let i = 0; i < arr.length; i++) {
    obj = obj[arr[i]] ? obj[arr[i]] : undefined;
  }
  return obj;
}

console.log(findPropFromObj(obj, "a.c.d"));
