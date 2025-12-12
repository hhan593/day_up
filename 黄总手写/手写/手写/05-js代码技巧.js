// 01. null, undefined, 空检查
let first = null
if(first !== null || first !== undefined || first !== ''){
    let second = first
}

// 简写方法
let second = first || '';


// 02. 空值检查和分配默认值
let firs = null;
let secon = firs || ''
console.log(secon)


// 02. 未定义检查和分配默认值
let firs = undefined;
let secon = firs || ''
console.log(secon)

// 03. 多次重复一个字符串


