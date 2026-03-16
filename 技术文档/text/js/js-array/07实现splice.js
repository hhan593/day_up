/*
 * @Author: hh
 * @Date: 2025-06-26 09:57:55
 * @LastEditors: hh
 * @LastEditTime: 2025-06-26 10:13:39
 * @Description: 手写数组的 splice 方法
 * @description: splice() 方法用于向或从数组中添加/删除项目，并返回被删除的项目。该方法更改原始数组。
 * @description: splice() 方法接收三个参数：起始索引、删除的元素数量和要添加的元素。
 * @description: 如果要添加元素，则可以在删除的元素数量后面添加要添加的元素。
 * @description: 如果要删除元素，则可以在起始索引后面添加要添加的元素。
 * @d
 */
/**
 *
- 1. splice(position, count) 表示从 position 索引的位置开始，删除count个元素
- 2. splice(position, 0, ele1, ele2, ...) 表示从 position 索引的元素后面插入一系列的元素
- 3. splice(postion, count, ele1, ele2, ...) 表示从 position 索引的位置开始，删除 count 个元素，然后再插入一系列的元素
- 4. 返回值为`被删除元素`组成的`数组`。

 *
//  */
// Array.prototype.MySplice = function (start, deleteCount, ...items) {
//   let argumentsLength = arguments.length; // 获取传入参数的长度
//   let array = Object(this); // 将this转换为对象
//   let len = array.length; // 获取数组的长度，使用无符
//   let deleteArray = new Array[deleteCount](); // 用于存储被删除的元素

//   sliceDeleteElements(array, start, deleteCount, deleteArray);

//   monePostElements(array, start, deleteCount, items, argumentsLength);
// };

// 先拷贝删除的元素，如下所示:

// const sliceDeleteElements = (array, startIndex, deleteCount, deleteArr) => {
//   for (let i = 0; i < deleteCount; i++) {
//     let index = startIndex + i;
//     if (index in array) {
//       let current = array[index];
//       deleteArr[i] = current;
//     }
//   }
// };

/***
然后对删除元素后面的元素进行挪动, 挪动分为三种情况:
1. 添加的元素和删除的元素个数相等
2. 添加的元素个数小于删除的元素
3. 添加的元素个数大于删除的元素
 */
// 二者相等
// const movePostElements = (array, startIndex, len, deleteCount, addElements) => {
//   if (deleteCount === addElements.length) return;
// };

// 当添加的元素个数小于删除的元素时, 如图所示:
// const movePostElements = (array, startIndex, len, deleteCount, addElements) => {
//   //...
//   if (deleteCount < addElements.length) {
//     // 删除的元素比新增的元素少，那么后面的元素整体向后挪动
//     // 思考一下: 这里为什么要从后往前遍历？从前往后会产生什么问题？
//     for (let i = len - 1; i >= startIndex + deleteCount; i--) {
//       let fromIndex = i;
//       // 将要挪动到的目标位置
//       let toIndex = i + (addElements.length - deleteCount);
//       if (fromIndex in array) {
//         array[toIndex] = array[fromIndex];
//       } else {
//         delete array[toIndex];
//       }
//     }
//   }
// };
// 当添加的元素个数大于删除的元素时, 如图所示:
// const movePostElements = (array, startIndex, len, deleteCount, addElements) => {
//   //...
//   if (deleteCount < addElements.length) {
//     // 删除的元素比新增的元素少，那么后面的元素整体向后挪动
//     // 思考一下: 这里为什么要从后往前遍历？从前往后会产生什么问题？
//     for (let i = len - 1; i >= startIndex + deleteCount; i--) {
//       let fromIndex = i;
//       // 将要挪动到的目标位置
//       let toIndex = i + (addElements.length - deleteCount);
//       if (fromIndex in array) {
//         array[toIndex] = array[fromIndex];
//       } else {
//         delete array[toIndex];
//       }
//     }
//   }
// };

// 特殊情况1：参数的边界情况
// 当用户传来非法的 startIndex 和 deleteCount 或者负索引的时候，需要我们做出特殊的处理。
/*
const computeStartIndex = (startIndex, len) => {
  // 处理索引负数的情况
  if (startIndex < 0) {
    return startIndex + len > 0 ? startIndex + len : 0;
  }
  return startIndex >= len ? len : startIndex;
};

const computeDeleteCount = (startIndex, len, deleteCount, argumentsLen) => {
   删除数目没有传，默认删除startIndex及后面所有的
  if (argumentsLen === 1) return len - startIndex;
   删除数目过小
  if (deleteCount < 0) return 0;
  删除数目过大
  if (deleteCount > len - deleteCount) return len - startIndex;
  return deleteCount;
};*/

//特殊情况2：数组为密封对象或冻结对象
// 密封对象和冻结对象是 JavaScript 中的两种特殊对象，它们的属性不能被添加、删除或修改。
// 密封对象是指不能添加或删除属性，但可以修改现有属性的值

if (Object.isSealed(array) && deleteCount !== addElements.length) {
  throw new TypeError("the object is a sealed object!");
} else if (
  Object.isFrozen(array) &&
  (deleteCount > 0 || addElements.length > 0)
) {
  throw new TypeError("the object is a frozen object!");
}

Array.prototype.splice = function (startIndex, deleteCount, ...addElements) {
  //,...
  let deleteArr = new Array(deleteCount);

  // 下面参数的清洗工作
  startIndex = computeStartIndex(startIndex, len);
  deleteCount = computeDeleteCount(startIndex, len, deleteCount, argumentsLen);

  // 拷贝删除的元素
  sliceDeleteElements(array, startIndex, deleteCount, deleteArr);
  //...
};
const sliceDeleteElements = (array, startIndex, deleteCount, deleteArr) => {
  for (let i = 0; i < deleteCount; i++) {
    let index = startIndex + i;
    if (index in array) {
      let current = array[index];
      deleteArr[i] = current;
    }
  }
};

const movePostElements = (array, startIndex, len, deleteCount, addElements) => {
  // 如果添加的元素和删除的元素个数相等，相当于元素的替换，数组长度不变，被删除元素后面的元素不需要挪动
  if (deleteCount === addElements.length) return;
  // 如果添加的元素和删除的元素个数不相等，则移动后面的元素
  else if (deleteCount > addElements.length) {
    // 删除的元素比新增的元素多，那么后面的元素整体向前挪动
    // 一共需要挪动 len - startIndex - deleteCount 个元素
    for (let i = startIndex + deleteCount; i < len; i++) {
      let fromIndex = i;
      // 将要挪动到的目标位置
      let toIndex = i - (deleteCount - addElements.length);
      if (fromIndex in array) {
        array[toIndex] = array[fromIndex];
      } else {
        delete array[toIndex];
      }
    }
    // 注意注意！这里我们把后面的元素向前挪，相当于数组长度减小了，需要删除冗余元素
    // 目前长度为 len + addElements - deleteCount
    for (let i = len - 1; i >= len + addElements.length - deleteCount; i--) {
      delete array[i];
    }
  } else if (deleteCount < addElements.length) {
    // 删除的元素比新增的元素少，那么后面的元素整体向后挪动
    // 思考一下: 这里为什么要从后往前遍历？从前往后会产生什么问题？
    for (let i = len - 1; i >= startIndex + deleteCount; i--) {
      let fromIndex = i;
      // 将要挪动到的目标位置
      let toIndex = i + (addElements.length - deleteCount);
      if (fromIndex in array) {
        array[toIndex] = array[fromIndex];
      } else {
        delete array[toIndex];
      }
    }
  }
};

const computeStartIndex = (startIndex, len) => {
  // 处理索引负数的情况
  if (startIndex < 0) {
    return startIndex + len > 0 ? startIndex + len : 0;
  }
  return startIndex >= len ? len : startIndex;
};

const computeDeleteCount = (startIndex, len, deleteCount, argumentsLen) => {
  // 删除数目没有传，默认删除startIndex及后面所有的
  if (argumentsLen === 1) return len - startIndex;
  // 删除数目过小
  if (deleteCount < 0) return 0;
  // 删除数目过大
  if (deleteCount > len - deleteCount) return len - startIndex;
  return deleteCount;
};

Array.prototype.splice = function (startIndex, deleteCount, ...addElements) {
  let argumentsLen = arguments.length;
  let array = Object(this);
  let len = array.length >>> 0;
  let deleteArr = new Array(deleteCount);

  startIndex = computeStartIndex(startIndex, len);
  deleteCount = computeDeleteCount(startIndex, len, deleteCount, argumentsLen);

  // 判断 sealed 对象和 frozen 对象, 即 密封对象 和 冻结对象
  if (Object.isSealed(array) && deleteCount !== addElements.length) {
    throw new TypeError("the object is a sealed object!");
  } else if (
    Object.isFrozen(array) &&
    (deleteCount > 0 || addElements.length > 0)
  ) {
    throw new TypeError("the object is a frozen object!");
  }

  // 拷贝删除的元素
  sliceDeleteElements(array, startIndex, deleteCount, deleteArr);
  // 移动删除元素后面的元素
  movePostElements(array, startIndex, len, deleteCount, addElements);

  // 插入新元素
  for (let i = 0; i < addElements.length; i++) {
    array[startIndex + i] = addElements[i];
  }

  array.length = len - deleteCount + addElements.length;

  return deleteArr;
};
