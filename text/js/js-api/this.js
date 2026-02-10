/*
 * @Author: hh
 * @Date: 2025-06-25 16:05:00
 * @LastEditors: hh
 * @LastEditTime: 2025-06-25 16:58:38
 * @Description: this
 */
/**
 *
 *
 */

//其实JS中的this是一个非常简单的东西，只需要理解它的执行规则就OK。
/**
 * 主要这些场隐式绑定的场景讨论:

    1. 全局上下文
    2. 直接调用函数
    3. 对象.方法的形式调用
    4. DOM事件绑定(特殊)
    5. new构造函数绑定
    6. 箭头函数
 */
//## 1. 全局上下文
// 全局上下文默认this指向window, 严格模式下指向undefined。

//## 2. 直接调用函数
//直接调用函数时,函数中的this指向全局对象,严格模式下指向undefined。
// let obj = {
//   a: function () {
//     console.log(this);
//   },
// };
// let func = obj.a;
// func();

// 这种情况是直接调用。this相当于全局上下文的情况。

//## 3. 对象.方法的形式调用

// obj.a(); // { a: [Function: a] }
//对象.方法的形式调用时,函数中的this指向对象。

//## 4. DOM事件绑定(特殊)

//DOM事件绑定时,函数中的this指向事件源。IE比较奇异，使用attachEvent，里面的this默认指向window。

//## 5. new构造函数绑定
//new构造函数绑定时,函数中的this指向新创建的对象。

//## 6. 箭头函数'
let obj = {
  a: function () {
    let perform = () => {
      console.log(this);
    };
    perform();
  },
};
obj.a(); // 找到最近的非箭头函数a，a现在绑定着obj, 因此箭头函数中的this是obj

//箭头函数没有this, 因此也不能绑定。里面的this会指向当前最近的非箭头函数的this，找不到就是window(严格模式是undefined)。比如

//优先级: new  > call、apply、bind  > 对象.方法 > 直接调用。
