function apply(fn, obj, args){
    // 判断, 如果没有传对象，就是全局对象
    if(obj === undefined || obj === null){
        obj = globalThis;
    }
    // 为obj添加临时方法
    obj.temp = fn;
    // 执行方法
    let result = obj.temp(...args)
    // 删除临时属性
    delete obj.temp;
    // 返回结果
    return result
}





// function call(fn, obj, ...args){
//     if(obj === undefined || obj === null){
//         obj = globalThis;
//     }
//     obj.temp = fn;
//     let result = obj.temp(...args)
//     delete obj.temp();
//     return result;
// }






// function bind(fn, obj, ...args){

//     return function(...args2){
//         if(obj === undefined || obj === null){
//             obj = globalThis;
//         }
//         obj.temp = fn;
//         let result = obj.temp(...args, ...args2)
//         delete obj.temp();
//         return result;
//     }
// }




// Function.prototype.myApply = function(obj, args){
//     obj.tmp = this;
//     let res = obj.tmp(...args);
//     delete obj.tmp
//     return res
// }


// function add(a,b){
//     return a + b;
// }
// let obj = {
//     c: 521
// };
// console.log(add.myApply(obj, [1, 2]))

// console.log(fn4)
// console.log(fn4(30, 50));











Function.prototype.myCall = function(target=window,...args){
  	if (typeof this !== "function") throw new Error('type error')
  	var fun = Symbol()
    target[fun] = this
    const val = target[fun](...args)
    delete target[fun]
    return val
}

Function.prototype.myApply = function(target=window,arr){
	if (typeof this !== "function") throw new Error('type error')
    target.fun = this
    const val = target.fun(...arr)
    delete target.fun
    return val
}


Function.prototype.bind = function(obj, ...args){
    let tmp = args;
    return function(){
        let mid = tmp + [...arguments]
        return this.apply(obj,...mid)
    }
}








