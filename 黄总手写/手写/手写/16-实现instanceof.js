// a instanceof b 用于判断 构造函数 b 的 prototype 是否存在于 a 的原型链上
// 常用于判断引用类型

function myInstanceof(left, right){
    left = left.__proto__;

    while(left !== right.prototype){
        left = left.__proto__
        if(left === null){
            return false
        }
    }
    return true;
}


// 测试
var a = []
var b = {}
 
function Foo(){}
var c = new Foo()
 
function child(){}
function father(){}
child.prototype = new father() 
var d = new child()
 
console.log(myInstanceof(a, Array)) // true
console.log(myInstanceof(b, Object)) // true
console.log(myInstanceof(b, Array)) // false
console.log(myInstanceof(a, Object)) // true
console.log(myInstanceof(c, Foo)) // true
console.log(myInstanceof(d, child)) // true