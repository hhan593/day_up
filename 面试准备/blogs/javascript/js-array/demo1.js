let nums = [12,35,56]
let obj = {val:77}
let newNums = nums.map(function (item,index,array){
    return item+ index +this.val + array[index]
},obj)
console.log(newNums)
