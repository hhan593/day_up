// 当前元素与随机抽取的一个剩余元素进行交换。

function shuffle(arr) {
    for (let i = arr.length-1; i>=0; i--) {
        let rIndex = Math.floor(Math.random()*(i+1));
        let temp = arr[rIndex];
        arr[rIndex] = arr[i];
        arr[i] = temp;
        console.log(arr)
    }
    return arr;
}

let res = shuffle([1,2,3,4,5,6]);

console.log(res)




// 乱序的同时，固定一个下标的值
// function shuffle(arr, index) {
//     let res = [];
//     // 取出固定值
//     let fix = arr.splice(index, 1)[0];
//     for (let i=arr.length-1; i>=0; i--) {
//         let rIndex = Math.floor(Math.random()*(i+1));
//         res.push(arr[rIndex]);
//         arr.splice(rIndex, 1);
//     }
//     // 将固定值放入指定位置
//     res.splice(index, 0, fix);
//     return res;
// }
// 多次运行，可以看出数组下标为 1 的值始终是固定的
// shuffle([1,2,3,4,5,6], 1);