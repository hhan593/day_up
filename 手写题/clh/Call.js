/**
 * @author：琪琪
 * @description: 手写 call
 *
    弄清楚规则：
    1. 如果传入是null或者undefined那么this指向window
    2. 如果传入Boolean、String、Number、Symbol、BigInt，this指向它们new Obejct()后的对象
    3. 如果传入其他参数，就指向其他参数
 */

// 扩展Function原型，添加自定义的myCall方法，模拟call函数的行为
Function.prototype.myCall = function (context, ...args) {
  // 检查调用myCall的上下文是否为函数，如果不是，抛出类型错误
  if (typeof this !== "function") {
    throw new TypeError("call应该被函数所调用");
  }

  // 如果传入的context不是对象，那么就new一个对象
  // 这是为了处理当传入原始值时，能够将其转换为对应的包装对象
  // 包括Boolean、String、Number、Symbol、BigInt值类型
  if (typeof context !== "object") {
    context = new Object(context);
  }
  // 如果传入的context是原始值（除了null和undefined），就new一个对应的包装对象
  if (context === null || context === undefined) {
    context = window; //因为node环境中不存在window，所以使用getGlobalObject方法获取全局对象glabol()
  } else if (typeof context !== "object" && typeof context !== "function") {
    context = new Object(context);
  }
  // 生成一个唯一的Symbol作为属性键，避免可能的属性名称冲突
  const key = Symbol();

  // 将当前函数（即调用myCall的函数）赋值给context的key属性
  context[key] = this;

  // 使用context作为调用上下文，并传入args参数，执行函数
  // 这里是实现call功能的核心部分
  const res = context[key](...args);

  // 删除之前添加到context的函数引用，避免污染context
  delete context[key];

  // 返回函数执行结果
  return res;
};

const obj = {
  //   name: "qiqi",
  //   age: 18,
  sayName(name, age) {
    console.log(this);
    console.log(name);
    console.log(age);
  },
};
// obj.sayName();
// "use strict";
// obj.sayName.call(null); //改变this指向为null
//非严格模式：this 被设置为 null 或 undefined 时，实际上会指向全局对象。
// 严格模式：this 会保持为 null 或 undefined，不会被转换为全局对象。

obj.sayName.myCall(null, "qiqi", 18);
