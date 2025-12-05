const input = [
  { id: 3, parentId: 2 },
  { id: 1, parentId: null },
  { id: 2, parentId: 1 },
];

// 输出  
const output = {
  id: 1,
  parent: null,
  children: [
    {
      id: 2,
      parent: 1,
      children: [
        {
          id: 3,
          parent: 2,
        },
      ],
    },
  ],
};


function buildTree(arr, parentId, childrenArray) {
  arr.forEach((item) => {
    if (item.parentId === parentId) {
      item.children = [];
      buildTree(arr, item.id, item.children);
      childrenArray.push(item);
    }
  });
}
function arrayToTree(input, parentId) {
  const array = [];
  buildTree(input, parentId, array);

  console.log(array);

  return array.length > 0 ? (array.length > 1 ? array : array[0]) : {};
}

const obj = arrayToTree(input, null);
console.log(obj);