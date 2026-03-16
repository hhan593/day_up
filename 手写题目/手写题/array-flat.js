/**
 * @deprecated 实现数组的拍平
 * @author 氧化氢
 */
const arr = [1, 2, 3, 4, [1, 2, 3, [1, 2, 3, [1, 2, 3]]], 5, "string", { name: "弹铁蛋同学" }];

// 递归调用实现拍平：
function flat_one(arr) {
  var res = []
  arr.forEach(item => {
    if(Array.isArray(item)) {
      res = res.concat(flat(item))
    } else {
      res.push(item)
    }
  });

  return res
}

// reduce 实现 flat：
function flat_two(arr) {
  return arr.reduce((acc, cur) => {
    return acc.concat(Array.isArray(cur) ? flat_two(cur) : cur)
  }, [])
}

// 通过栈实现：
function flat_three(arr) {
  const stack = arr
  const res = []
  while(stack.length) {
    const tmp = arr.pop()
    if(Array.isArray(tmp)) {
      stack.push(...tmp)
    } else {
      res.unshift(tmp)
    }
  }

  return res
}

//
function flat__three(arr) {
  let arg = [...arr]
  while(arg.some(Array.isArray)) {
    arg = [].concat(...arg)
  }

  return arg
}

// 通过JSON.stringify 和 JSON.parse
function flat(arr) {
  let str = JSON.stringify(arr)
  str = str.replace(/(\[|\])/g, '')
  return JSON.parse(`[${str}]`)
}