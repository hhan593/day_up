/**
 * @description 手写 typeof 关键字
 * @author 氧化氢
 */

function LH_typeof (obj) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase()
}