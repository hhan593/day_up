/**
 * @author:琪琪
 * @description:深拷贝
 */

const obj = {
  name: "123",
  age: 12,
  address: {
    city: "北京",
    detail: "朝阳区",
  },
  hobby: [1, 2, 3],
};

//深拷贝easy
// ------------------------------------------- 简单版深拷贝：只考虑普通对象属性，不考虑内置对象和函数。 -----------------------------------------
const deepCopy = (obj) => {
  if (typeof obj !== "object") return; //判断是不是对象
  const newObj = Array.isArray(obj) ? [] : {}; //判断是数组还是对象
  for (let key in obj) {
    //遍历obj的值
    if (obj.hasOwnProperty(key)) {
      //    如果有的在判断这个子元素是不是仍为对象，如果是循环调用，不是，直接赋值
      newObj[key] =
        typeof obj[key] === "object" ? deepCopy(obj[key]) : obj[key];
    }
  }
  return newObj;
};
// const obj2 = deepCopy(obj);
// console.log(obj2);
// console.log(obj2.address === obj.address);

//深拷贝难
const deepCopy2 = (target) => {
  const constructor = target.constructor;
  //如果是正则表达式或者是日期对象
  if (/^(RegExp|Date)$/i.test(constructor.name)) {
    return new constructor(target);
  }
  if (isObject(target)) {
    const newObj = Array.isArray(obj) ? [] : {}; //判断是数组还是对象
    for (let key in obj) {
      //遍历obj的值
      if (obj.hasOwnProperty(key)) {
        //    如果有的在判断这个子元素是不是仍为对象，如果是循环调用，不是，直接赋值
        newObj[key] =
          typeof obj[key] === "object" ? deepCopy(obj[key]) : obj[key];
      }
    }
    return newObj;
  } else if (typeof target === "function") {
    return Object.assign(target);
  } else {
    return target;
  }
};

function isObject(target) {
  return typeof target === "object" && target !== null;
}
const obj2 = deepCopy2(obj);
console.log(obj2);
console.log(obj2.address === obj.address);
