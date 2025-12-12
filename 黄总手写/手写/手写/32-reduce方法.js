// 求和
let arr = [1,2,3,4]

let sum = arr.reduce((pre, cur) => {
    return pre + cur
}, 2)
console.log(sum)



// 计算数组中每个元素出现的个数
let person = ['张曼玉', '刘嘉玲', '梅艳芳', '关之琳', '杨幂', '杨幂']

let nameNum = person.reduce((pre, cur) => {
    if(cur in pre){
        pre[cur]++
    }else{
        pre[cur] = 1
    }
    return pre
}, {})

console.log(nameNum)



