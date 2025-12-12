/*
 * @Author: hh
 * @Date: 2025-06-25 15:05:18
 * @LastEditors: hh
 * @LastEditTime: 2025-06-25 15:50:36
 * @Description: 深拷贝
 */
/**
 * @author hh
 * @description 深拷贝
 */

//## 1. 简易版及问题
// JSON.parse(JSON.stringify());
/**
 * 估计这个api能覆盖大多数的应用场景，没错，谈到深拷贝，我第一个想到的也是它。但是实际上，对于某些严格的场景来说，
 * 这个方法是有巨大的坑的。问题如下：
 *
 * 无法解决循环引用
 */
//1.无法解决循环引用
const a = { val: 2 };
a.target = a;
//2.无法拷贝一些特殊的对象 如RegExp Date Set Map
//3. 无法拷贝`函数`(划重点)。

// 2.深拷贝 手动实现 (三个问题 循环引用 特殊对象丢失 函数无法克隆 )

// 辅助函数
const isObject = (target) =>
  (typeof target === "object" || typeof target === "function") &&
  target !== null;

function deepClone(target, map = new Map()) {
  //首先判断是否为对象

  // 处理循环引用 使用map
  if (map.get(target)) return target;
  if (!isObject(target)) return target;

  map.set(target, true);
  const newTarget = Array.isArray(target) ? [] : {};
  for (let key in newTarget) {
    if (newTarget.hasOwnProperty(key)) {
      newTarget[key] = deepClone(target[key]);
    }
  }
  return newTarget;
}
//现在还存在一个问题 。但还是有一个潜在的坑, 就是map 上的 key 和 map 构成了`强引用关系`，
// 在计算机程序设计中，弱引用与强引用相对，
// 是指不能确保其引用的对象不会被垃圾回收器回收的引用。 一个对象若只被弱引用所引用，
// 则被认为是不可访问（或弱可访问）的，并因此可能在任何时刻被回收。 --百度百科
// 结局方案使用weakMap

// 辅助函数
const getType = (obj) => Object.prototype.toString.call(obj);
const CAN_TRAVERSE_TYPES = {
  "[object Map]": true,
  "[object Set]": true,
  "[object Array]": true,
  "[object Object]": true,
  "[object Arguments]": true,
};

function deepClone(target, map = new WeakMap()) {
  // 1. 基本类型直接返回
  if (target === null || typeof target !== "object") {
    return target;
  }

  // 2. 处理循环引用
  if (map.has(target)) {
    return map.get(target);
  }

  const type = getType(target);
  let cloneTarget;

  // 3. 特殊类型处理（Date/RegExp等不可遍历类型）
  switch (type) {
    case "[object Date]":
      return new Date(target.getTime());
    case "[object RegExp]":
      return new RegExp(target.source, target.flags);
    case "[object Function]":
      return cloneFunction(target); // 函数需单独处理
  }

  // 4. 可遍历类型的初始化（保留原型链）
  if (CAN_TRAVERSE_TYPES[type]) {
    cloneTarget = new target.constructor(); // 关键修复：正确继承原型
  } else {
    return target; // 其他不可遍历类型（如Error）直接返回
  }

  map.set(target, cloneTarget); // 缓存已克隆对象

  // 5. 处理 Map 类型
  if (type === "[object Map]") {
    target.forEach((value, key) => {
      cloneTarget.set(deepClone(key, map), deepClone(value, map));
    });
    return cloneTarget;
  }

  // 6. 处理 Set 类型
  if (type === "[object Set]") {
    target.forEach((value) => {
      cloneTarget.add(deepClone(value, map));
    });
    return cloneTarget;
  }

  // 7. 处理数组/对象（含Symbol属性）
  const keys = Reflect.ownKeys(target); // 获取所有自有键（含Symbol）
  for (const key of keys) {
    cloneTarget[key] = deepClone(target[key], map);
  }

  return cloneTarget;
}

// 函数克隆工具函数
function cloneFunction(func) {
  // 箭头函数直接返回自身,是通过没有原型判断
  if (!func.prototype) return func;
  const bodyReg = /(?<={)(.|\n)+(?=})/m;
  const paramReg = /(?<=\().+(?=\)\s+{)/;
  const funcString = func.toString();
  // 分别匹配 函数参数 和 函数体
  const param = paramReg.exec(funcString);
  const body = bodyReg.exec(funcString);
  if (!body) return null;
  if (param) {
    const paramArr = param[0].split(",");
    return new Function(...paramArr, body[0]);
  } else {
    return new Function(body[0]);
  }
}

const obj = {
  a: 1,
  str: "str",
  d: Date,
  set: new Set(),
  map: new Map(),
  fun: function () {},
  text: () => {},
};

console.log(deepClone(obj));
