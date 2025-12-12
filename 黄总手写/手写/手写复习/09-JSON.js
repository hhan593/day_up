let obj = {
    a: 1,
    b: 2
}

let res = JSON.stringify(obj)
console.log(res)

// function parse(json){
//     return eval("(" + json + ")")
// }

console.log(parse(res))

let res2 = JSON.parse(res)
console.log(res2)

// 实现parse()
console.log((new Function('return ' + res))())
