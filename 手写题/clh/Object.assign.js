/**
 * Object.assign() 静态方法将一个或者多个源对象中所有可枚举的自有属性复制到目标对象，并返回修改后的目标对象。/**
 * 将多个对象的属性复制到目标对象中
 *
 * @param {object} target - 目标对象，属性将被复制到该对象
 * @param {...object} args - 一个或多个对象，其属性将被复制到目标对象
 * @returns {object} 返回复制了属性的目标对象
 * @throws {TypeError} 如果目标对象为null或非对象类型，则抛出类型错误
 */
function assign(target, ...args) {
  // 检查目标对象是否为null或非对象类型，如果是，则抛出类型错误
  // undefined 和 null 在进行隐式类型转换的时候是相等的
  if (target === null || typeof target !== "object") {
    throw new TypeError("Cannot convert undefined or null to object");
  }
  // 将目标对象转换为对象类型
  // 如果传入基本数据类型会被Object包一层，基本数据类型中只有字符串可以复制
  // 因为abc经过Object('abc')后会转为 {0: 'a', 1:'b', 2:'c'}
  const obj = Object(target);

  // 遍历每个源对象（可能会有很多）
  args.forEach((item) => {
    // 检查源对象是否为非null的对象类型
    if (item !== null && typeof item === "object") {
      // 遍历源对象的每个属性
      for (let key in item) {
        // 检查属性是否为源对象自有属性
        if (item.hasOwnProperty(key)) {
          // 将源对象的属性复制到目标对象
          obj[key] = item[key];
        }
      }
      if (Object.getOwnPropertySymbols) {
        // 遍历源对象的每个Symbol属性
        Object.getOwnPropertySymbols(item).forEach((sym) => {
          // 检查属性是否为源对象自有属性
          if (Object.prototype.propertyIsEnumerable.call(item, sym)) {
            // 将源对象的Symbol属性复制到目标对象
            obj[sym] = item[sym];
          }
        });
      }
    }
  });
  // 返回复制了属性的目标对象
  return obj;
}

//使用示Oobject.assign()
console.log(
  Object.assign(
    {},
    { age: 18 },
    null,
    undefined,
    11,
    true,
    "name",
    Symbol(),
    BigInt(10000),
    function age() {},
    [1, 2, 3],
    { name: "琪琪", person: Symbol("人啊"), [Symbol("test")]: "test" }
  )
);
console.log(
  assign(
    {},
    { age: 18 },
    null,
    undefined,
    11,
    true,
    "name",
    Symbol(),
    BigInt(10000),
    function age() {},
    [1, 2, 3],
    { name: "琪琪", person: Symbol("人啊"), [Symbol("test")]: "test" }
  )
);

/**
 * *
 * 手写克隆()
 */

function deepclone(target) {
  // 基本数据类型

  const constructor = target.constructor;
  if (/^(RegExp|Date)$/i.test(constructor.name)) {
    return new constructor(target);
  }
  const newObj = Array.isArray(target) ? [] : {};
  if (isObject(target)) {
    for (let key in target) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] =
          typeof obj[key] === "object" ? deepclone(target[key]) : target[key];
      }
    }
  }
  return newObj;
}
function isObject(target) {
  return typeof target === "object" && target !== null;
}
