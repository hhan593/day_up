// function promiseAll(promises){
//     return new Promise((resolve, reject) => {
//         if(!Array.isArray(promises)){
//             console.log('promises 必须是个数组')
//         }
//         let count = 0;
//         let result = []
//         promises.forEach((item, i) => {
//             item.then(res => {
//                 result[i] = res
//                 count++
//                 if(count == promises.length){
//                     resolve(result)
//                 }
//             }, err => {
//                 reject(err)
//             })
//         });
//     })
// }



// function promiseRace(promises){
//     return new Promise((resolve, reject) => {
//         for(let i = 0; i < promises.length; i++){
//             Promise.resolve(promises[i]).then(res => {
//                 resolve(res)
//             }, err => {
//                 reject(err)
//             })
//         }
//     })
// }



// function deepClone(target, map = new Map()){
//     if(typeof target !== 'object' || target == null){
//         return target
//     }
//     let res = Array.isArray(target) ? []: {}

//     if(map.get(target)){
//         return map.get(target)
//     }
//     map.set(target, res)
//     for(const key in target){
//         res[key] == deepClone(target[key], map)
//     }
//     return res
// }


// function limitNum(arr, limit = 3){

//     return new Promise((resolve, reject) => {
//         let count = 0, res = [];
//         while(limit > count){
//             start()
//             count++
//         }

//         function start(){
//             let task = arr.shift()
//             let result = task()
//             res.unshift(result)
//             if(!arr){
//                 resolve(res)
//             }
//         }
//     })
// }




// class Father{
//     constructor(name){
//         this.name = "father"
//     }
//     eat(){
//         console.log("我是：" + this.name)
//     }
// }

// class Child extends Father{
//     constructor(name, age){
//         super(name)
//         // this.name = name
//         this.age = age
//     }
// }

// let xm  = new Child('xiaoming', 12)

// console.log(xm.name)
// console.log(xm.age)
// xm.eat()




// let arr = [1,2,3,4,3,6,5,2,2,4]

// let arr = [...new Set(arr)]

// let res = []
// for(let i = 0; i < arr.length; i++){
//     if(!res.includes(arr[i])){
//         res.push(arr[i])
//     }
// }

// let arr = Array.from(new Set(arr))




// let url = 'http://www.baidu.com?a=aaa&b=bbb'

// function url_params(url){
//     let res1 = url.split('?')[1]
//     let res_ls = res1.split('&')
//     let obj = {}
//     res_ls.forEach((item,index) => {
//         obj[item.split('=')[0]] = item.split('=')[1]
//     })
//     return obj
// }
// console.log(url_params(url))


// const URLSearchParams1 = new URLSearchParams(url.split("?")[1]);
// console.log(URLSearchParams1)
// // 把键值对列表转发成一个对象
// const params = Object.fromEntries(URLSearchParams1.entries())

// console.log(params)




// class eventBus1{
//     constructor(){
//         this.cache= {}
//     }

//     on(name, fn){
//         if(this.cache[name]){
//             this.cache[name].push(fn)
//         }else{
//             this.cache[name] = [fn]
//         }
//     }
//     emit(name, once=false){
//         if(this.cache[name]){
//             const tasks = this.cache[name].slice()
//             for(let i of tasks){
//                 i()
//             }
//         }

//         if(once){
//             delete this.cache[name]
//         }
//     }

//     off(name, fn){
//         const tasks = this.cache[name]
//         if(tasks){
//             const index = tasks.indexOf(fn)
//             if(index >= 0){
//                 tasks.splice(index, 1)
//             }
//         }
//     }
// }

// const eventBus = new eventBus1()
// const task1 = () => {console.log('task1')}
// const task2 = () => {console.log('task2')}
// const task3 = () => {eventBus.on('task3', task3)}

// eventBus.on('task', task1)
// eventBus.on('task2', task2)
// eventBus.on('task3', task3)


// // eventBus.off('task', task1)

// setTimeout(()=>{
//     eventBus.emit('task')  // task2
// }, 1000)
// setTimeout(()=>{
//     eventBus.emit('task3')  // task2
// }, 2000)






// function myNew(fn, ...args){
//     let obj = {}
//     obj.__proto__ = fn.prototype
//     let res = fn.apply(obj, ...args)
//     return res instanceof Object? res: obj
// }




// function myInstanceof(left, right){
//     left = left.__proto__
//     while(left){
//         if(left !== right.prototype){
//             return false
//         }
//         left = left.__proto__
//     }
//     return true
// }






// function PromiseAll(promises){
//     return new Promise((resolve, reject) => {
//         if(!Array.isArray(promises)){
//             throw('必须是个数组')
//         }
//         let count = 0, result = [];
//         promises.forEach((promise, index) => {
//             promise.then(res => {
//                 result.push(res);
//                 count++;
//                 if(count == promises.length){
//                     resolve(result)
//                 }
//             }, err => {
//                 reject(err)
//             })
//         })
//     })
// }




// function PromiseRace(promises){
//     return new Promise((resolve, reject) => {
//         if(!Array.isArray(promises)){
//             throw("必须是数组")
//         }
//         for(let i = 0; i < promises.length; i++){
//             Promise.resolve(promises[i]).then(res => {
//                 resolve(res)
//             }, err=>{
//                 reject(err)
//             })
//         }
//     })
// }





// function deepClone(target, map=new Map()){
//     if(typeof target != 'object'){
//         return target
//     }
//     const temp = Array.isArray(target) ? [] : {};
//     if(map.get(target)){
//         return map.get(target)
//     }
//     map.set(target, temp)
//     for(let k in target){
//         temp[k] = deepClone(temp[k], map)
//     }
//     return temp
// }






// function limit(ls, count = 3){
//     return new Promise((resolve, reject) => {
//         let i = 0;
//         let result = []
//         while(i < count){
//             start(i)
//             i++
//         }
//         function start(i){
//             if(i == ls.lengh - 1){
//                 resolve(result)
//             }
//             axios.get().then((res) => {
//                 result[i] = res
//             })
            
//         }
//     })
// }







// function Son(name){
//     this.name = name
//     // console.log(this)
// }


// Son.prototype.eat = function(){
//     console.log(this.name + "会吃")
// }


// function Father(name, age){
//     Son.call(this, name)
//     this.age = age;
// }


// Father.prototype = Object.create(Son.prototype);
// Father.prototype.constructor = Father

// res = new Father("叭叭", 20)
// res.eat()
// console.log(res.name)
// console.log(res.age)






// class Father{
//     constructor(name){
//         this.name = name
//     }
//     eat(){
//         console.log(this.name + "能吃！")
//     }
// }

// class Son extends Father{
//     constructor(name, age){
//         super(name)
//         this.age = age
//     }
// }


// let cs = new Son("佬子", 20)
// console.log(cs.name)
// console.log(cs.age)
// cs.eat()






// let arr = [1,2,3,4,5,5,4,3,2,3,4]

// console.log([...new Set(arr)])


// let ls = []
// for(let i = 0; i < arr.length; i++){
//     if(!ls.includes(arr[i])){
//         ls.push(arr[i])
//     }
// }
// console.log(ls)



// console.log(Array.from(new Set(arr)))




// function _render(vnode){
//     if(typeof vnode == 'number'){
//         return String(vnode)
//     }
//     if(typeof vnode == 'string'){
//         return document.createTextNode(vnode)
//     }
//     const dom = document.createElement(vnode.tag)
//     Object.keys(vnode.attrs).forEach(item => {
//         dom.setAttribute(item, vnode.attrs[item])
//     })
//     vnode.children.forEach(item => {
//         dom.appendChild(_render(item))
//     })
// }






// class Emit{
//     constructor(){
//         this.cache = {}
//     }

//     on(name, fn){
//         if(this.cache[name]){
//             this.cache[name].push(fn)
//         }else{
//             this.cache[name] = [fn]
//         }
//     }

//     off(name){
//         const temp = this.cache[name].slice();
//         temp
//     }

//     emit(name, fn){
//         let tasks = this.cache[name]
//         let index = tasks.indexof(fn)
//         if(index != '-1'){
//             tasks.splice(index, 1)
//         }
//     }

//     once(name, fn){
//         this.on(name, fn)
//         this.emit(name)
//         this.off(name)
//     }
// }





// function _new(fn, ...args){
//     let obj = {};
//     obj.__proto__ = fn.prototype;
//     let res = fn.apply(obj, args)
//     return res instanceof Object ? res : obj;
// }

// function eat(...args){
//     console.log(args)
// }

// let res = _new(eat, "111", '222')





// function _instanceof(left, right){
    
//     while(left){
//         if(left.__proto__ == right.prototype){
//             return true
//         }
//         left = left.__proto__
//     }
//     return false
// }




// let ls = [2,3,4,5,6,7,8,9]

// function ef(ls, val){
//     let left = 0, right = ls.length - 1;
//     while(left <= right){
//         let mid = parseInt((left+right) / 2);
//         if(ls[mid] == val){
//             return mid
//         }else if(ls[mid] > val){
//             right = mid - 1
//         }else{
//             left = mid + 1
//         }
//     }
//     return null
// }
// console.log(ef(ls, 3))






// function kp_core(ls, left, right){
//     let cur = ls[left]
//     while(left < right){
//         while(left < right && cur <=ls[right]){
//             right--
//         }
//         ls[left] = ls[right]
//         while(left < right && cur >= ls[left]){
//             left++
//         }
//         ls[right] = ls[left]
//     }
//     ls[left] = cur;
//     return left
// }


// function kp(ls, left, right){
//     if(left < right){
//         let temp = kp_core(ls, left, right)
//         kp(ls, left, temp - 1)
//         kp(ls, temp+1, right)
//     }
// }

// ls = [2,1,5,3,7,4,6,9]

// kp(ls, 0, ls.length-1)
// console.log(ls)





// console.log(parseFloat((0.1 + 0.2).toFixed(10)))






// function _apply(fn, obj, args){
//     if(!obj){
//         obj = globalThis
//     }
//     obj.temp = fn;
//     let result = obj.temp(...args)
//     delete obj.temp
//     return result
// }





// function fd(fn, delay){
//     let timer;
//     return function(){
//         if(timer){
//             clearTimeout(timer)
//         }

//         timer = setTimeout(() => {
//             fn.apply(this, arguments)
//         }, delay)
//     }
// }



// function jl(fn, delay){
//     let timer;
//     return function(){
//         if(timer){
//             return false;
//         }
//         fn.apply(this, arguments)
//         timer = setTimeout(() => {
//             clearTimeout(timer)
//             timer = null
//         }, delay)
//     }
// }






// function promiseAll(promises){
//     return new Promise((resolve, reject) => {
//         if(!Array.isArray(promises)){
//             throw ('promises要是数组');
//         }else{
//             let res = [], count = 0;

//             for(let i = 0; i< promises.length; i++){
//                 promises[i].then(r => {
//                     res[i] = r;
//                     if(count == promises.length - 1){
//                         resolve(res)
//                     }
//                     count++;
//                 }, err=> {
//                     reject(err)
//                 })
//             }
//         }
//     })
// }




// function promiseRace(promises){
//     return new Promise((resolve, reject) =>{
//         if(!Array.isArray(promises)){
//             throw "promises要是数组"
//         }else{
//             for(let i = 0; i < promises.length; i++){
//                 promises[i].then(r => {
//                     resolve(r)
//                 }, err=>{
//                     reject(err)
//                 })
//             }
//         }
//     })
    
// }




// function deepClone(target, map = new Map()){
//     if(typeof target !== 'object'){
//         return target
//     }

//     const tmp = Array.isArray(target) ? [] : {};
//     if(map.get(target)){
//         return map.get(target)
//     }
//     map.set(target, tmp);
    
//     for(const k in target){
//         console.log(k)
//         tmp[k] = deepClone(target[k], map)
//     }
//     return tmp;
// }

// const a = [{
//     name: 'sunshine_lin',
//     age: 23,
//     hobbies: { sports: '篮球', tv: '雍正王朝' },
//     works: ['2020', '2021']
// }, 1]
// const target2 = deepClone(a)
// console.log(a)
// console.log(target2)





// function limit(arr, count){
//     new Promise((resolve, reject) => {
//         let i = 0;
//         while(i < count){
//             start();
//             i++;
//         }
//         function start(){
//             let task = arr.shift();
//             axios.get(task).finally(() => {
//                 if(arr.length == 0){
//                     reject()
//                 }else{
//                     i--
//                 }
//             })
//         }
//     })
// }




// function father(name){
//     this.name = name;
// }

// father.prototype.eat = function(){
//     console.log(this.name + 'is eating')
// }


// function child(){
//     father.call(this, child);
// }


// let ls = [1,2,3,4,2,2,1,2,3,4]

// // let res = [...new Set(ls)]
// // let res = Array.from(new Set(ls))
// console.log(res)






// class eventBus{
//     constructor(){
//         this.cache = {}
//     }

//     on(name, fn){
//         if(this.cache[name]){
//             this.cache[name].push(fn)
//         }else{
//             this.cache[name] = []
//         }
//     }

//     off(name, fn){
//         if(this.cache[name]){
//             const index = this.cache[name].findIndex((f) => f === fn)
//             if (index >= 0){
//                 this.cache[name].splice(index, 1)
//             }
//         }
//     }

//     emit(name){
//         if(this.cache[name]){
//             let tasks = this.cache[name].slice();
//             for(let i of tasks){
//                 i()
//             }
//         }
        
//     }

//     once(name, fn){
//         this.on(name, fn)
//         this.emit(name)
//         this.off(name, fn)
//     }
// }







// function fd(callback, delay){
//     let timer;
//     return function(){
//         if(timer){
//             clearTimeout(timer)
//         }
//         timer = setTimeout(()=> {
//             callback.apply(this, arguments)
//             timer = null;
//         }, delay || 2000)
//     }
// }



// function jl(callback, delay){
//     let timer;
//     return function(){
//         if(timer){
//             return;
//         }

//         callback.apply(this, arguments)
//         timer = setTimeout(() => {
//             clearTimeout(timer)
//             timer = null
//         }, delay || 2000)
//     }
// }



// ls = [1,4,6,8,0,2,4,6,87,9]

// function bubble(ls){

//     for(let i = 0; i < ls.length; i++){
//         for(let j = 0; j < ls.length - i - 1; j++){
//             if(ls[j] > ls[j+1]){
//                 let tmp = ls[j];
//                 ls[j] = ls[j+1];
//                 ls[j+1] = tmp
//             }
//         }
//     }
//     return ls
// }

// console.log(bubble(ls))







// ls = [1,4,6,8,0,2,4,6,87,9]
// kp(ls, 0, ls.length - 1)
// console.log(ls)

// function kp(ls, left, right){
//     if(left < right){
//         let mid = kp_core(ls, left, right);
//         kp(ls, left, mid - 1)
//         kp(ls, mid + 1, right)
//     }
// }


// function kp_core(ls, left, right){
//     let tmp = ls[left]
//     while(left < right){
//         while(left < right && ls[right] >= tmp){
//             right--
//         }
//         ls[left] = ls[right];
//         while(left < right && ls[left] <= tmp){
//             left++
//         }
//         ls[right] = ls[left];
//     }
//     ls[left] = tmp
//     return left
// }






// function mySetInterval(callback, delay){
//     let timer;
//     let interval = () =>{
//         callback();
//         timer = setTimeout(interval, delay)
//     }
//     setTimeout(interval, delay)
//     return {
//         cancel: () => {
//             clearTimeout(timer)
//         }
//     }

// }

// let {cancel}  = mySetInterval(() => {
//     console.log("11")
// }, 3000)


// setTimeout(cancel, 10000)




// function _new(fn, ...args){
//     let obj = {};
//     obj.__proto__ = fn.prototype;
//     let res = fn.apply(obj, args);
//     return res instanceof Object ? res : obj;
// }



// mySetTimeout(fn, delay){
//     let timer;
//     let inter = () =>{
//         fn();
//         timer = setTimeout(inter, delay)
//     }

//     setTimeout(inter, delay)
//     return {
//         cancel: () => {
//             clearTimeout(timer)
//         }
//     }
// }





// class Father{
//     constructor(name){
//         this.name = name
//     }
//     eat(){
//         console.log(this.name + ' is eating')
//     }
// }


// class Child extends Father{
//     constructor(name, age){
//         // 这一步相当于调用父组件的constructor方法
//         super(name)
//         this.age = age
//     }
// }

// let son = new Child('HHH', 21)
// son.eat()
// console.log(son)

// let father = new Father("bbb")
// console.log(father)
// console.log(son)




// let a = 0
// console.log(Object.prototype.toString.call(a))





// let ls = [1,2,3,4]
// Array.prototype.reduce = function(callback, args){
//     let pre = args, res = 0;
//     for(let i = 0; i < this.length; i++){
//         let cur = this[i]
//         res = callback(pre, cur)
//         pre = res;
//     }
//     return res
// }

// let total = ls.reduce((pre, cur) => {
//     return pre + cur
// }, 0)

// console.log(total)




// 大数相加
// function big(a, b){
//     let l1 = a.length - 1, l2 = b.length - 1;
//     let total = '', m = 0;
//     while(l1>=0 || l2>=0 || m){
//         let t = (parseInt(a[l1]) || 0) + (parseInt(b[l2]) || 0) + m
//         total = t % 10 + total;
//         m = t > 9 ? 1: 0;
//         l1--, l2--
//     }
//     return total
// }


// console.log(big('123', '234'))




// function dc(target, map = new Map()){
//     if(typeof target != 'object'){
//         return target
//     }

//     let tmp = Array.isArray(target) ? [] : {};
//     if(map.has(target)){
//         return map.get(target)
//     }else{
//         map.set(target)
//     }
//     for(let k in target){
//         tmp[k] = dc(target[k], map)
//     }
//     return tmp
// }

// const a = {
//     name: 'sunshine_lin',
//     age: 23,
//     hobbies: { sports: '篮球', tv: '雍正王朝' },
//     works: ['2020', '2021']
// }
// a.key = a // 环引用
// const b = dc(a)
// a.works[2] = '0'
// console.log(b)
// console.log(a)








// class queue{
//     constructor(){
//         this.stack1 = [];
//         this.stack2 = [];
//     }

//     jin(item){
//         this.stack1.push(item);
//         return this.stack1.length + this.stack2.length
//     }
    
//     chu(){
//         if(this.stack2.length == 0){
//             while(this.stack1.length > 0){
//                 this.stack2.push(this.stack1.pop())
//             }
//             return this.stack2.pop();
//         }else{
//             return this.stack2.pop();
//         }
//     }
// }

// let arr = new queue();
// console.log(arr.jin(0))
// arr.jin(2)
// arr.jin(3)

// // arr.chu()
// console.log(arr.chu())





// 字符串压缩
let str = 'aaaabbcccd'

console.time('aa')
function ys(str){
    let res = ''
    let n = 1;
    for(let i = 0; i < str.length-1; i++){
        if(str[i] != str[i+1]){
            res = res + n + str[i]
            n = 1
        }else{
            n++
        }
    }
    res= res + n + str[str.length - 1]
    return res
}
console.timeEnd('aa')
console.log(ys(str))