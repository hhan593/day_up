/**
 * @description 通过 iterator 让对象变得可迭代
 * @author 氧化氢
 */

var obj = {
  name: 'H2O',
  age: 100,
  address: 'xxxxx'
}

obj[Symbol.iterator] = function() {
  let index = 0
  let keys = Object.keys(this)
  let self = this
  
  return {
    next() {
      if(index < keys.length) {
        return {
          value: self[keys[index++]],
          done: false
        }
      } else {
        return {
          value: undefined,
          done: true
        }
      }
    }
  }
}

for(let value of obj) {
  console.log(value);
}