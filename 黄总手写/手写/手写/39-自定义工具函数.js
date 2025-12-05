// Map

let ls = [1,2,3,4,5]
// let res = ls.map((item, index) => {
//     return item*2
// })
// console.log(res)

// function map(ls, callback){
//     let res = []
//     for(let i = 0; i < ls.length; i++){
//         res.push(callback(ls[i], i))
//     }
//     return res
// }

// Array.prototype.map = function(callback){
//     let res = [];
//     for(let i = 0; i < this.length; i++){
//         res.push(callback(this[i], i))
//     }
//     return res
// }

// let res = ls.map((item, index) => {
//     return item*2
// })
// console.log(res)
// console.log(ls)





// filter

// let res = ls.filter((item, index) => {
//     return index == 1 || index == 2
// })

// console.log(res)

// function filter(ls, callback){
//     let res = []
//     for(let i = 0; i < ls.length; i++){
//         let mask = callback(ls[i], i)
//         if(mask){
//             res.push(ls[i])
//         }
//     }
//     return res
// }



// Array.prototype.filter = function(callback){
//     let res = [];
//     for(let i = 0 ; i < this.length; i++){
//         if(callback(this[i], i)){
//             res.push(this[i])
//         }
//     }
//     return res
// }



// console.log(filter(ls, (item, index) => {
//     return index == 1 || index == 2
// }))




// find
// let res = ls.find((item, index) => {
//     return item > 1
// })

// console.log(res)

// function find(ls, callback){
//     for(let i = 0; i < ls.length; i++){
//         let mask = callback(ls[i], i)
//         if(mask){
//             return ls[i]
//         }
//     }
//     return undefined
// }
// console.log(find(ls, (item, index) => {
//     return item > 1
// }))




// reduce

let res = ls.reduce((result, value) => {
    // console.log(result)
    return result + value
}, 0)
console.log(res)

// function reduce(ls, callback, initValue){
//     let res = initValue;
//     for(let i = 0; i < ls.length; i++){
//         res = callback(res, ls[i])
//     }
//     return res;
// }
// console.log(reduce(ls, (res, value)=> {
//     return res + value
// }, 0))




// some有一个符合要求则true, every有一个不符合要求则false
// let res = ls.some((item, index) => {
//     return item > 2
// })
// console.log(res)

// function some(ls, callback){
//     for(let i = 0; i < ls.length; i++){
//         if(callback(ls[i], i)){
//             return true
//         }
//     }
//     return false
// }

// console.log(some(ls, (item, index)=>{
//     return item>2
// }))




// concat两种传参方式

const ls1 = [1,2,3]
// ls = ls.concat(ls1)
ls = ls.concat(ls1, 1, 1, 1)
console.log(ls)

// function concat(ls, ...args){
//     let res = ls
//     args.forEach((item, index) => {
//         if(Array.isArray(item)){
//             res.push(...item)
//         }else{
//             res.push(item)
//         }
//     })
//     return res
// }

// console.log(concat(ls, [1,2,3], 1,2,3))




// // 深拷贝
// function deepClone(target){
//     if(typeof target === 'object' && target !== null){
//         const res = Array.isArray(target) ? []: {};
//         for(let key in target){
//             if(target.hasOwnProperty(key)){
//                 res[key] = deepClone(target[key])
//             }
//         }
//         return res
//     }else{
//         return target
//     }
// }
// // 测试
// const obj = {
//     a: 1,
//     b: ['e', 'f', 'g'],
//     c: {h: 20},
//     // JSON不能克隆方法
//     d: function(){}
// };

// // 递归拷贝
// const result = deepClone(obj)

// result.b = ['a', 'b', 'c']
// console.log(obj)
// console.log(result)

