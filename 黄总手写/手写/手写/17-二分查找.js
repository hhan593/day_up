function ef(li, val){
    let left = 0
    let right = li.length - 1
    while(left <= right){
        let mid = parseInt((left + right) / 2)
        if(li[mid] == val){
            return mid
        }else if(li[mid] > val){
            right = mid - 1
        }else{
            left = mid + 1
        }
    }
    return null;
}

let li = [1,2,3,4,5,6,7]
console.log(ef(li, 4))

// 时间复杂度 O(logn)























