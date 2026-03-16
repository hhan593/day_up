// 交换a,b的值，不能用临时变量
let a = 20
let b = 10

a = a + b
b = a - b
a = a - b

console.log(a, b);