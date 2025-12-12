/**
 * @description 实现一个浅拷贝
 * @author 氧化氢
 */

function shallCopy(obj) {
  if (typeof obj !== "object") return;
  const newObj = Array.isArray(obj) ? [] : {};
  for (let key in obj) {
    //判断这个属性是不是属于这个对象这个是最关键的一步，如果是就克隆，不是就不克隆

    if (obj.hasOwnProperty(key)) {
      newObj[key] = obj[key]; //浅克隆隆就一层，所以不需要递归
      // newObj[key] =
      //   typeof obj[key] === "object" ? shallCopy(obj[key]) : obj[key]; //如果想要深克隆的话，这里需要递归
    }
  }

  return newObj;
}
