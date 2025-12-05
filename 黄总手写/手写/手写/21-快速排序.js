// function kp_core(li, left, right){  // left为列表最左边下标
//     let tmp = li[left]
//     while(left < right){
//         while(left < right && li[right] >= tmp){
//             right = right - 1  // 往左走一步
//         }
//         li[left] = li[right]  // 右边的值写道左边的空位上
//         while(left < right && li[left] <= tmp){
//             left = left + 1
//         }
//         li[right] = li[left]  // 左边的值写到右边的空位上
//     }
//     // 这时候left === right
//     li[left] = tmp  // 把tmp补到空位上
//     return left
// }


// function kp(li, left, right){
//     if(left < right){
//         mid = kp_core(li, left, right)
//         kp(li, left, mid - 1)
//         kp(li, mid+1, right)
//     }
// }


// // ls = [7,5,4,6,3,1,2,9,8]
// console.log(ls)
// kp(ls, 0, ls.length - 1)

// console.log(ls)


// 时间复杂度平均nlogn







// 2. 
function quickSort(arr, left, right) {
    var len = arr.length,
        partitionIndex,
        left = typeof left != 'number' ? 0 : left,
        right = typeof right != 'number' ? len - 1 : right;
 
    if (left < right) {
        partitionIndex = partition(arr, left, right);
        quickSort(arr, left, partitionIndex-1);
        quickSort(arr, partitionIndex+1, right);
    }
    return arr;
}
 
function partition(arr, left ,right) {     // 分区操作
    var pivot = left,                      // 设定基准值（pivot）
        index = pivot + 1;
    for (var i = index; i <= right; i++) {
        if (arr[i] < arr[pivot]) {
            swap(arr, i, index);
            index++;
        }       
    }
    swap(arr, pivot, index - 1);
    return index-1;
}
 
function swap(arr, i, j) {
    var temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
}
