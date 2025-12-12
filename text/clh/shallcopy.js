/**
 * @author hh
 * @description 浅拷贝
 */

const obj = {
  name: "小明",
  age: 18,
  address: {
    city: "北京",
    detail: "朝阳区",
  },
  Symbol: "123",
  hobby: [1, 2, 3],

  //   hobby: function () {
  //     console.log("hobby");
  //   },
};

// 1.使用Object.assign
const newObj = Object.assign({}, obj);
console.log(newObj);
console.log(newObj.address === obj.address);

// 2.使用扩展运算符
const newObj2 = { ...obj };
console.log(newObj2);
console.log(newObj2.address === obj.address);
// 3.使用JSON.parse(JSON.stringify()) 这是深拷贝但是JSON没有办法转换函数和symbol类型的值，所以就不相同
const newObj3 = JSON.parse(JSON.stringify(obj));
console.log(newObj3);
console.log(newObj3.address === obj.address);
const arr = [1, 2, 3];
console.log(arr.filter((item) => item > 2)); // 筛选
console.log(arr.reduce((pre, cur) => pre + cur, 1));
arr.forEach(function (item, index, array) {
  console.log(item);
});
const arr3 = arr.map((item) => {
  return item * 2;
});
console.log(arr);
console.log(arr3);
