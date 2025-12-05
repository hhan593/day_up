let ls = [1,2,[3,4],[5,6, [7,8]], 9, 0]


// 1. flat
let res1 = ls.flat(Infinity)  // 不改变原先的ls
console.log(res1)


// 2. 这样都变成了字符串类型
let str2 = JSON.stringify(ls)
let res2 = "[" + str2.replace(/\[|\]/g, '') + "]"
console.log(JSON.parse(res2))


// 3. 递归
let result = [];
function fn(ary) {
    for(let i = 0; i < ary.length; i++){
        let item = ary[i];
        if (Array.isArray(item)){
            fn(item);
        } else {
            result.push(item);
        }
    }
}
fn(ls)
console.log(result)


// 4. reduce



// 5.

while (ls.some(Array.isArray)) {
    ls = [].concat(...ls);
}
console.log(ls)
