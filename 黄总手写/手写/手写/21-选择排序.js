ls = [2,1,5,6,7,4,3,8,9,0]

// function xuan(ls){
//     let minIndex;
//     for(let i = 0; i < ls.length - 1; i++){
//         minIndex = i
//         for(let j = i + 1; j < ls.length; j++){
//             if(ls[minIndex] > ls[j]){
//                 minIndex = j
//             }
//         }
//         let temp = ls[i]
//         ls[i] = ls[minIndex]
//         ls[minIndex] = temp
//     }
//     return ls
// }

// console.log(xuan(ls))



// function xuan(arr){
//     let min = 0;
//     for(let i = 0; i < arr.length - 1; i++){
//         min = i;
//         for(let j = i+1; j < ls.length; j++){
//             if(arr[j] < arr[min]){
//                 min = j
//             }
//         }

//         let tmp = ls[i];
//         ls[i] = ls[min];
//         ls[min] = tmp;
//     }
//     return ls
// }

console.log(xuan(ls))