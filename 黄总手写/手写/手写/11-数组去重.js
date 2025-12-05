let arr = [1,2,3,4,5,6,3,2,4]
// 1.
// const ls = [...new Set(arr)]

// 2.
// const ls = Array.from(new Set(arr))

// 3.
// function resetArr(arr){
//     let res = []
//     arr.forEach(item => {
//         if(res.indexOf(item) === -1){
//             res.push(item)
//         }
//     })
//     return res
// }