let ls = [1,2,3,4,5,5,5,5,3,2,2,1]

let res = [...new Set(ls)]
console.log(res)

let res1 = []

ls.forEach(item => {
    if(!res1.includes(item)){
        res1.push(item)
    }
})
console.log(res1)