// 拓展运算符 ...解构赋值
function args(){
    console.log(arguments);
    // 1. 
    // let newArr = [...arguments];

    // 2.
    // let newArr = Array.from(arguments) 

    // 3. 
    // let newArr = []
    // for(let i = 0; i < arguments.length; i++){
    //     newArr.push(arguments[i])
    // }
    // console.log(newArr);

    // 4. Array.prototype.slice.call(arguments)  就是截取（更重要的是获取，slice是得到子数组）函数的参数，
    // 然后让arguments等“伪数组”也可以使用数组的各种方法。
    let newArr = [].slice.call(arguments)
    console.log(newArr)
}
args(1,2,3,23,2,42,34);