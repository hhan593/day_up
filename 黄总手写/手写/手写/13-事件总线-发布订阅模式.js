class EventEmitter {
    constructor() {
        this.cache = {}
    }

    on(name, fn){
        if(this.cache[name]){
            this.cache[name].push(fn)
        }else{
            this.cache[name] = [fn]
        }
    }

    off(name, fn){
        const tasks = this.cache[name]
        if(tasks) {
            const index = tasks.findIndex((f) => f === fn || f.callback === fn)
            if (index >= 0){
                tasks.splice(index, 1)
            }
        }
    }

    emit(name, once = false){
        if(this.cache[name]){
            // 创建副本，如果回调函数内继续注册相同事件，会造成死循环
            const tasks = this.cache[name].slice()
            // const tasks = this.cache[name]
            for(let i of tasks){
                // fn();
                i()
            }
            if(once){
                delete this.cache[name]
            }
        }
    }
}

// 测试
const eventBus = new EventEmitter()
const task1 = () => {console.log('task1')}
const task2 = () => {console.log('task2')}
const task3 = () => {eventBus.on('task3', task3)}

eventBus.on('task', task1)
eventBus.on('task2', task2)
eventBus.on('task3', task3)


// eventBus.off('task', task1)

setTimeout(()=>{
    eventBus.emit('task')  // task2
}, 1000)
setTimeout(()=>{
    eventBus.emit('task3')  // task2
}, 2000)

