function race(promiseArr){
    return new Promise((resolve, reject) => {
        for(let i = 0; i < promiseArr.length; i++){
            Promise.resolve(promiseArr[i]).then(data => {
                resolve(data);
            }, err => {
                return reject(err)
            })
        }
    })
}
