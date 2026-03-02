let arr = [1, 2, 3, [1, 5, 6, [7, 9, [11, 32,[444,44]]]],[1], 10]

Array.prototype.c = function () {
  let n = 0

  // function fn(arr) {
  //   arr.forEach(item => {
  //     if (Array.isArray(item)) {
  //       n++
  //       fn(item)
  //     }
  //   });
  // }
  function fn(arr){
    let arg = arr.slice(0);
    while(arg.some(Array.isArray)){
      n++;
      arg = [].concat(...arg);
    }
  }

  fn(this)

  return n
}

console.log(arr.c());