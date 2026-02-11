/**
 * @description 实现数组转树
 * @author 氧化氢
 */

let input = [
  {
    id: 1,
    val: "学校",
    parentId: null,
  },
  {
    id: 2,
    val: "班级1",
    parentId: 1,
  },
  {
    id: 3,
    val: "班级2",
    parentId: 1,
  },
  {
    id: 4,
    val: "学生1",
    parentId: 2,
  },
  {
    id: 5,
    val: "学生2",
    parentId: 3,
  },
  {
    id: 6,
    val: "学生3",
    parentId: 3,
  },
];

function buildTree(arr, parentId, childrenArray) {
  arr.forEach((item) => {
    if (item.parentId === parentId) {
      // 说明该元素是 parentId 的孩子元素
      item.children = [];
      buildTree(arr, item.id, item.children);
      // 把该元素加入到父元素孩子列表中
      childrenArray.push(item);
    }
  });
}

function arrayToTree(input) {
  const array = [];
  buildTree(input, null, array);

  return array.length > 0 ? (array.length === 1 ? array[0] : array) : {};
}

console.log(arrayToTree(input));

function createTree(arr, parentId, array) {
  arr.forEach((item) => {
    if (item.parentId === parentId) {
      item.children = [];
      createTree(arr, item.id, item.children);
      array.push(item);
    }
  });
}

function arrayToTree([]) {
  let array = [];
  createTree(arr, null, array);
  return array.length > 0 ? (array.length == 1 ? array[0] : array) : {};
}
