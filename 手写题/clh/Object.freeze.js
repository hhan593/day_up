/**
 * @author:qiqi
 * @description:Object.freeze()方法用于冻结一个对象。一个被冻结的对象再也不能被修改。
 *
 */
/**
 * 1.判断传入的参数是不是一个对象，如果是继续执行，如果不是就是返回原参数
 * 2.如果参数是一个对象，就先封闭对象Object.seal(obj)，for.. in ..循环遍历对象。使用obj.hasOwnProperty获取在该对象上的key,去掉原型属性，将其writable特性设置为false(设置只读)
 * 3.如果属性值仍未对象，就通过递归来进行进一步的冻结
 */
let obj = {
  name: "why",
  age: 18,
  friends: {
    name: "12",
  },
};
const newObj = Object.freeze(obj);
newObj.name = "kobe";
// console.log(newObj);
function myObjectFreeze(obj) {
  // 判断参数是否为Object类型，如果是就封闭对象，循环遍历对象。去掉原型属性，将其writable特性设置为false
  if (obj instanceof Object) {
    Object.seal(obj); // 封闭对象
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        Object.defineProperty(obj, key, {
          writable: false, // 设置只读
        });
        // 如果属性值依然为对象，要通过递归来进行进一步的冻结
        myObjectFreeze(obj[key]);
      }
    }
  }
  return obj; // 返回处理过后的对象
}

let newobj1 = myObjectFreeze(obj);

newobj1.name = "11111";

console.log(newobj1);
