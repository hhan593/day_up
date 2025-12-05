// // 自动柯里化函数的实现
// function dyCurrying(fn) {
//   function curried(...args) {
//     // 判断当前已经接收的参数的个数, 可以参数本身需要接受的参数是否已经一致了
//     //1.当已经传入的参数 大于等于 需要的参数时, 就执行函数
//     if (args.length >= fn.length) {
//       //这里绑定this是因为可能外面通过call或者apply进行绑定调用
//       return fn.apply(this, args)
//     } else {
//       // 没有达到个数时, 需要返回一个新的函数, 继续来接收的参数
//       function curried2(...args2) {
//         // 接收到参数后, 需要递归调用curried来检查函数的个数是否达到
//         return curried.apply(this, args.concat(args2))
//       }
//       return curried2
//     }
//   }
//   return curried
// }

// function addHandle(x, y, z) {
//   x = x + 2
//   y = y * 2
//   z = z * z
//   return x + y + z
// }

// var curryAdd = dyCurrying(addHandle)
console.log(curryAdd(10, 20, 30))
console.log(curryAdd(10, 20)(30))
console.log(curryAdd(10)(20)(30))



// 支持多参数传递
function curryAdd(fn, args) {
    var _this = this
    var len = fn.length;
    var args = args || [];
    return function() {
        var _args = Array.prototype.slice.call(arguments);
        Array.prototype.push.apply(args, _args);
        // 如果参数个数小于最初的fn.length，则递归调用，继续收集参数
        if (_args.length < len) {
            return curryAdd.call(_this, fn, _args);
        }
        // 参数收集完毕，则执行fn
        return fn.apply(this, _args);
    }
}