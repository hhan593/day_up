// const obj1 = {
//     name: 'qianguyihao',
//     age: 28,
//     desc: 'hello world',
// };

// const obj2 = {
//     name: '许嵩',
//     sex: '男',
// };

// let obj = {}
// // 【关键代码】浅拷贝：把 obj1 赋值给 obj2。这行代码的返回值也是 obj2
// Object.assign(obj,  obj1);

// // console.log(JSON.stringify(obj2));
// // console.log(obj2);
// obj1.name = 'HHH'
// console.log(obj1);
// console.log(obj);





// function clone (target) {
//     if (target instanceof Array) {
//         return [...target]
//         // return target.slice()
//         // return [].concat(target)
//         // return Array.from(target)
//         // return target.filter(value => true)
//         // return target.map(item => item)
//     } else if (target!==null && typeof target==='object') {
//         return { ...target }
//     } else {// 如果不是数组或对象, 直接返回
//         return target
//     }
// }


// const obj1 = {
//     name: 'qianguyihao',
//     age: 28,
//     desc: 'hello world',
// };


// let obj2 = clone(obj1)
// obj1.name = 'HHH'
// console.log(obj1)
// console.log(obj2)
