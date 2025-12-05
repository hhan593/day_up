function mp(ls){
    for(let i=0; i<ls.length; i++){
        for(let j=i+1; j<ls.length; j++){
            if(ls[i] > ls[j]){
                let mid = ls[i]
                ls[i] = ls[j]
                ls[j] = mid
            }
        }
    }
    return ls
}

let ls = [2,5,7,9,0,3,1,6,8]
console.log(mp(ls))
