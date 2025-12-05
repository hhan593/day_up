function mySetTimeout(fn, delay){
    let timer;
    let interval = () => {
        fn()
        timer = setTimeout(interval, delay)
    }
    setTimeout(interval, delay)
    return {
        cancel: () => {
            clearTimeout(timer)
        }
    }
}

const {cancel} = mySetTimeout(() => {
    console.log(888)
}, 1000)

setTimeout(() => {
    cancel()
}, 4000)