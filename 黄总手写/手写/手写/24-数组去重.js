let ls = [1,3,2,4,5,6,5,2]

// 第一种方法, includes
let res1 = []
for(let i = 0; i < ls.length; i++){
    if(!res1.includes(ls[i])){
        res1.push(ls[i])
    }
}
console.log(res1)


// 第二种方法 indexOf
let res2 = []
ls.forEach(item => {
    if(res2.indexOf(item) == -1){
        res2.push(item)
    }
})
console.log(res2)


// 第三种方法, 借助对象
const res3 = []
const obj = {}
ls.forEach(item => {
    if(obj[item] === undefined){
        obj[item] = true
        res3.push(item);
    }
})

console.log(res3)


// 第四种方法 Set, ...
let set = new Set(ls)
let res4 = [...set]
console.log(res4)