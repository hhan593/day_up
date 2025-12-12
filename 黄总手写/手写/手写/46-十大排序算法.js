// 1. 冒泡 O(n**2)。
// let ls = [1,4,3,8,6,7,2,5]

// function bubble(ls){
//     for(let i = 0; i < ls.length - 1; i++){
//         for(let j = 0; j < ls.length - i - 1; j++){
//             if(ls[j] > ls[j+1]){
//                 let temp = ls[j+1];
//                 ls[j+1] = ls[j];
//                 ls[j] = temp
//             }
//         }
//     }
//     return ls
// }
// ls = bubble(ls);
// console.log(ls);



// 2. 选择排序。
// let ls = [1,4,3,8,6,7,2,5]
// function select(ls){
//     var index, temp;
//     for(let i = 0; i < ls.length-1; i++){
//         index = i
//         for(let j = i+1; j<ls.length; j++){
//             if(ls[j] < ls[index]){
//                 index = j
//             }
//         }
//         temp = ls[i];
//         ls[i] = ls[index];
//         ls[index] = temp;
//     }
//     return ls
// }

// ls = select(ls)
// console.log(ls)




// 插入排序。






// 归并排序
function mergeSort(arr) {
    var len = arr.length;
    if (len < 2) {
        return arr;
    }
    var middle = Math.floor(len / 2),
        left = arr.slice(0, middle),
        right = arr.slice(middle);
    return merge(mergeSort(left), mergeSort(right));
}
function merge(left, right) {
    var result = [];
    while (left.length>0 && right.length>0) {
        if (left[0] <= right[0]) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }
    while (left.length)
        result.push(left.shift());
    while (right.length)
        result.push(right.shift());
    return result;
}
console.log(mergeSort([2,6,9,4,2,5,6]))


