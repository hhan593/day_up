// 1.
// class A {
//     constructor(x) {
//         let _x = x
//         this.showX = function() {
//             return _x
//         }
//     }
// }

// let a = new A(1)
// // 无法访问
// console.log(a._x) // undefined
// // 可以访问
// console.log(a.showX()) // 1




// 2. 
// 利用闭包生成IIFE，返回类A
// const A = (function() {
//     // 定义私有变量_x
//     let _x
//     class A {
//         constructor(x) {
//             _x = x
//         }
//         showX() {
//             return _x
//         }
//     }
//     return A
// })()
// let a = new A(1)
// a._x // undefined
// a.showX() //1



// 3
class IncreasingCounter {
    // Private class field
    #privateValue = 0;
    get value() {
        return this.#privateValue;
    }
    increment() {
        this.#privateValue++;
    }
}
 
const counter = new IncreasingCounter()
 
console.log(counter)






//  A模块
// const x = Symbol('x');

// export default class A {
//     constructor(a) {
//         // 利用symbol声明私有变量
//         this[x] = a
//     }

//     showX() {
//         return this[x]
//     }
// }

// // B模块
// import A from "A模块"

// const a = new A(1)

// // 1. 第一种方式
// // a[_x] // 报错 Uncaught ReferenceError: _x is not defined

// // 2. 第二种方式
// // 自行定义一个相同的Symbol
// // const x = Symbol('x')
// // a[x] // 无法访问，undefined

// // 3. 第三种方式，可以访问（正解）
// a.showX() //1



