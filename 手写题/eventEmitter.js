/**
 * @description 发布订阅模式
 * @author 氧化氢
 */

 class eventBus {
  constructor() {
    this.event = {}
  }

  on(name, fn) {
    if(typeof fn !== 'function') {
      throw TypeError(`${fn} 不是函数`)
    }

    if(this.event[name]) {
      this.event[name].push(fn)
    } else {
      this.event[name] = [fn]
    }
  }

  off(name, fn) {
    if(!arguments.length) {
      this.event = {}
      return
    }

    if(name && !fn) {
      this.event[name] = null
      return
    }

    // 拿到绑定的事件列表：
    let tasks = this.event[name]
    for(let i = 0; i < tasks.length; i++) {
      if(tasks[i] === fn) {
        tasks.splice(i, 1)
        i--
      }
    }
  }

  emit(name, ...args) {
    let tasks = this.event[name]
    if(!tasks) {
      throw TypeError(`没有 ${name} 这个方法`)
    }

    for(let fn of tasks) {
      fn(...args)
    }
  }
}

const eBus = new eventBus()

eBus.on('log', function(name, method) {
  console.log(`${name} 调用 ${method} 方法`);
})
eBus.on('a', function() {
  console.log('aaa');
})
eBus.emit('a')
eBus.emit('log')
eBus.off('a')
eBus.emit('log')
eBus.emit('a')