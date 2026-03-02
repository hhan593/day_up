/*
 * @Author: hh
 * @Date: 2025-06-25 22:05:15
 * @LastEditors: hh
 * @LastEditTime: 2025-06-25 23:07:14
 * @Description: 数组扁平化
 * 数组扁平化是指将多维数组转换为一维数组的过程。可以使用 flat() 方法来实现。
 */

// 数组扁平化
/**
 * * 1. 使用 flat() 方法
 * * 2. 使用 reduce() 方法
 * * 3. 使用递归
 * * * 4. 使用 forEach() 方法
 * * * 5. 使用 concat() 方法
 * * * 6. 使用 Array.from() 方法
 * * * 7. 使用扩展运算符
 */
const arr = [1, [2, [3, 4], 5], 6];
let str  = JSON.stringify(arr); // 将数组转换为字符串

// 使用 flat() 方法
const flatArr = arr.flat(Infinity); // Infinity 表示扁平化所有层级
console.log(flatArr);

// replace  + split replace是字符串方法，要先转换为字符串
console.log("使用replice + split方法实现");
const arr2 = str.replace(/(\[|\])/g, '').split(',') //转为字符数组
const arrNum = str.replace(/(\[|\])/g, '').split(',').map(item => Number(item)); // 转为数字数组
console.log(arr2);
console.log(arrNum," 数字数组");


// replace  + Json.parse  ,但是这样也只可以展开一层

console.log("使用replace + JSON.parse方法实现");
str = str.replace(/($|$)/g, '');
str = '[' + str + ']';
const arr5 = JSON.parse(str);

const arr3 = JSON.parse('[' + JSON.stringify(arr).replace(/($|$)/g, '') + ']');
//  = JSON.parse(str.replace(/(\[|\])/g, '')); // 转为数字数组
console.log(arr3);
console.log(arr5);//[ [ 1, [ 2, [Array], 5 ], 6 ] ]


// 递归实现
    let result = []
console.log("使用递归方法实现",result);

const flatten = (arr) => {
    for(i =0 ;i<arr.length;i++){
    if(Array.isArray(arr[i])) {
 flatten(arr[i])
    }
    
else{
    result.push(arr[i]);

}
}    return result;

}
flatten(arr); //记得要调用一下这个函数

// 使用 reduce() 方法 concat() 合并数组
console.log("使用reduce方法实现");

function flatten2(arr){
    return arr.reduce((acc, val) => {
        //Array.isArray()：判断当前元素是否是数组，如果是，就递归调用 flatten 继续展开
        return acc.concat(Array.isArray(val) ? flatten2(val) : val);
    }, []);

}
const arr4 = flatten2(arr);
console.log(arr4); // [ 1, 2, 3, 4,

//拓展运算符

console.log("使用拓展运算符实现");
let arr6 =  [...arr];
//如果使用arr 会导致死循环，永远只会展开一层
// 因为每次展开后，仍然会有数组存在，所以需要继续展开
while(arr6.some(item => Array.isArray(item))) {
    arr6 = [].concat(...arr6);
}
console.log(arr6);