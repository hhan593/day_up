function deepClone(target){
    // 基本数据类型直接返回
    if(typeof target !== 'object'){ return target }
    // 判断是数组还是对象
    const temp = Array.isArray(target) ? [] : {}
    for(const key in target){
        // 递归
        temp[key] = deepClone(target[key])
    }
    return temp
}


const a = {
    name: 'sunshine_lin',
    age: 23,
    hobbies: { sports: '篮球', tv: '雍正王朝' },
    works: ['2020', '2021']
}
// a.key = a // 环引用
const b = deepClone(a)
const c = {}
Object.assign(c, a)


a.works[2] = '0'
console.log(c)
console.log(b)
console.log(a)




// function deepClone(target, map = new Map()){
//     // 基本数据类型直接返回
//     if(typeof target !== 'object'){ return target }
//     // 判断是数组还是对象
//     const temp = Array.isArray(target) ? [] : {}
//     // if(map.get(target)){
//     //     // 已存在则直接返回
//     //     return map.get(target)
//     // }
//     // console.log(temp)
//     // 不存在则第一次设置
//     // map.set(target, temp)
//     for(const key in target){
//         // 递归
//         temp[key] = deepClone(target[key], map)
//     }
//     return temp
// }









// 浅拷贝：     slice()和concat()都并非深拷贝
// const a = {
//     name: 'sunshine_lin',
//     age: 23,
//     hobbies: { sports: '篮球', tv: '雍正王朝' },
//     works: ['2020', '2021']
// }
// let obj2 = Object.assign({},a)


// a.name = "HHH"
// obj2.name = "GGG"
// console.log(obj2)
// console.log(a)




// 这种的浅拷贝就不行了
// var obj = {
//     name: "北极光之夜。",
//     like: "aurora",
//     num: {
//         a: "1",
//         b: "2",
//     },
// };
// function cloneObj(obj) {
//     let clone = {};
//     for (let i in obj) {
//         clone[i] = obj[i];
//     }
//     return clone;
// }
// var clone = cloneObj(obj);
// obj.num.a = 'AA';
// console.log(clone);