// 6. 
// // 手写一个repeact()函数，加上下面的代码运行，使每3秒打印一个helloword，总共执行4次
//  const repeatFunc = repeact(console.log,4,3000)         repeatFunc('helloword')

// function repeact(way, nums, time){
//     return function repeactI(con){
//         var i = 0
//         let timer = setInterval(()=> {
//             way(con)
//             i++
//             if(i == nums){
//                 clearInterval(timer)
//             }
//         }, time)
//     }
// }

// const repeactFunc = repeact(console.log, 4, 3000)
// repeactFunc('helloWorld')



// 7. js随机生成颜色
// let r = Math.round(Math.random() * 255);
// let g = Math.round(Math.random() * 255);
// let b = Math.round(Math.random() * 255);
// let color = `rgb(${r}, ${g}, ${b})`;
// console.log(color)


// 8. 给定两个字符串 strA 和 strB, 求 strB 在 strA 中出现的次数
// str1 = 'aaaabbabaaa'
// str2 = 'aa'

// function A_B(str1, str2){
//     let left = 0, right = str1.length-1, count = 0;
//     while(left < right){
//         if(str1.slice(left, left + str2.length) == str2){
//             count++;
//             left = left + str2.length
//         }else{
//             left++
//         }
//     }
//     return count
// }

// console.log(A_B(str1, str2))




// 9. 找出数组中重复出现的元素
// const test = [1, 2, 4, 4, 3, 3, 1, 5, 3]


// 1. 
// let len = test.length
// const res = []
// const res2 = []
// for(let i = 0; i < len; i++){
//     if(!res.includes(test[i])){
//         res.push(test[i])
//     }else{
//         if(!res2.includes(test[i])){
//             res2.push(test[i])
//         }
//     }
// }
// console.log(res2)


// 2. 
// const len = test.length;
// const hash = new Map();
// for(let i = 0; i < len; i++){
//     if(!hash.has(test[i])){
//         hash.set(test[i], 1)
//     }else{
//         let count = hash.get(test[i])
//         count++
//         hash.set(test[i], count);
//     }
// }

// const res = []
// for(let key of hash.keys()){
//     if(hash.get(key) !== 1){
//         res.push(key)
//     }
// }

// console.log(res)




// 10. 假设有个这样的函数add 接受任意数量的数字作为输入，
// 返回一个函数，该函数也能接受数量的数字作为输入，数出结果为前后输入的所有数字之和
// function add(...args){
//     console.log(args)
//     return function add_index(...args2){
//         let sum = 0
//         for(let i = 0; i < args.length; i++){
//             sum += args[i]
//         }
//         for(let i = 0; i < args2.length; i++){
//             sum += args2[i]
//         }
//         return sum
//     } 
// }

// console.log(add(1,2,3)(1,2,3,4))


// 11. 看输出
// const a = 10;
// const obj = {
//     a: 13,
//     b: () => {
//         console.log(this.a);
//     },
//     c: function () {
//         console.log(this.a)
//     },
//     d: function () {
//         return () => {
//             console.log(this);
//         }
//     },
//     e: function () {
//         return this.b
//     }
// }
// obj.b()
// obj.c()
// obj.d()()
// obj.e()()



// 12. 属性有null的就移除， 考虑嵌套
// let obj = {
//     a: 123,
//     b: null,
//     c: {
//         c1: 222,
//         c2: null, 
//         c3: {
//             c33: 333,
//             d33: null
//         },
//         c4: [1,2,3]
//     },
//     d: "abc" 
// }

// function clean_null(obj){
//     for(let key in obj){
//         if(obj[key] == null){
//             delete obj[key]
//         }else if(obj[key] instanceof Object && !Array.isArray(obj[key])){
//             clean_null(obj[key])
//         }
//     }
//     return obj
// }

// console.log(clean_null(obj))




// 13. js版本号排序
// let ls = ["3.1.4522.74", "0.2.45.4", "0.2.23.456", "1.0.1"]

// ls.sort((a, b) => {
//     return (Number("0." + a.split('.').join(""))) - (Number("0." + b.split('.').join("")))
// })

// console.log(ls)




// 15. 闭包用于在对象中创建私有变量
// var aaa = (function(){
//     var a = 1;

//     function bbb(){
//         a++
//         console.log(a);
//     }


//     function ccc(){
//         a++
//         console.log(a)
//     }

//     return {
//         b: bbb,
//         c: ccc
//     }
// })();
// console.log(aaa.a)  // underfined
// aaa.b();  // 2
// aaa.c();  // 3 



// 16. 找出数组中第一个没出现的最小整数
// function firstNum(nums){
//     for(let i = 1; i <= nums.length+1; i++){
//         if(!nums.includes(i)){
//             return i
//         }
//     }
// }


// function firstNum(nums){
//     let set = new Set()
//     for(let i = 1; i < nums.length; i++){
//         set.add(nums[i])
//     }

//     for(let i = 1; i <= nums.length + 1; i++){
//         if(!set.has(i)){
//             return i
//         }
//     }
// }



// 输出顺序的问题

// async function async1() { 
//     console.log("async1 start"); 
//     await async2(); 
//     console.log("async1 end"); 
// } 

// async function async2() { 
//     console.log( 'async2');
// } 

// console.log("script start"); 
// setTimeout(function () { 
//     console.log("settimeout"); 
// },0);

// async1(); 

// new Promise(function (resolve) { 
//     console.log("promise1"); 
//     resolve(); 
// }).then(function () { 
//     console.log("promise2");
// }); 
// console.log('script end');





// await async
// 当调用一个 async 函数时，会返回一个 Promise 对象 (关键)
// async/await 出现的异常是无法捕获的，需要借助 try/catch 来捕获异常
// function sleep(flag) {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             if(flag){
//                 resolve('success')
//             }else{
//                 reject('Error')
//             }
//         }, 2000)
//     })
// }



// // async await 的用法
// async function fn(flag) {
//     try {
//         let result = await sleep(flag)
//         return result
//     } catch (err) {
//         return err
//     }
// }
// // 返回的 a,b 是一个 promise 对象
// var a = fn(true)
// var b = fn(false)
// a.then((res)=>{
//     console.log(res) // success
// })
// b.then((res)=>{
//     console.log(res) // Error
// })



// 设计一个defer函数，实现defer(30).then(res => {  // 30ms后执行})
// function defer(delay){
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve()
//         }, delay)
//     })
// }

// defer(3000).then(res => {
//     console.log("aaa")
// })



// bind

// Function.prototype.bind = function () {
//     console.log(this)
//     var self = this,                        // 保存原函数
//     context = [].shift.call(arguments), // 保存需要绑定的this上下文
//     args = [].slice.call(arguments);    // 剩余的参数转为数组
//     return function () {                    // 返回一个新函数
//         self.apply(context,[].concat.call(args, [].slice.call(arguments)));
//     }
// }

// function a(){
//     console.log("a")
// }
// b = {}
// a.bind(b)



// 数组嵌套层级
// let arr  =[1, 2, 3, [1, 5, 6, [7, 9, [11, 32]]], 10]
// let a = 1

// function multiarr(arr){
//     for(let i = 0; i < arr.length; i++){
//         if(arr[i] instanceof Array){
//             a++;
//             arr = arr[i];
//             multiarr(arr);
//         }
//     }
//     return a
// }

// console.log(multiarr(arr))


// 数组原型上添加方法，返回数组的嵌套层数
// Array.prototype.ceng = function(){
//     let a = 1
//     function multiarr(arr){
//         for(let i = 0; i < arr.length; i++){
//             if(Array.isArray(arr[i])){
//                 a++;
//                 arr = arr[i];
//                 multiarr(arr);
//             }
//         }
//         return a
//     }
//     return multiarr(this)
// }

// console.log(arr.ceng())




// console.log(hello())
// var hello = function(){}






// in   of

// let obj = {
//     a: 1,
//     b: 2,
//     c: 3
// }

// let ls = [1,2,3]

// for(let k in ls){
//     console.log(k)
// }





// 26个英文字母中随机取四位
// let p = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
// let str = ''
// for (var i = 0; i < 4; i++) { // 生成4个字符
//     str += p.charAt(Math.random() * (p.length - 1))
// }
// // console.log(p.charAt(2.8))  // 选择指定下标的字符
// console.log(str)




// function countMenus(menus){
//     let sum = 0
//     function mid(menus, sum){
//         let sum = 0;
//         for(let i = 0; i < menus.length; i++){
//             if(menus[i].name){
//                 sum++
//             }
//             if(menus[i].children){
//                 mid(menus[i].children, sum)
//             }
//         }
//     }
//     mid(menus, sum)
//     return sum

// }





// function kp_core(li, left, right){  // left为列表最左边下标
//     let tmp = li[left].info.age
//     let mid = li[left]
//     while(left < right){
//         while(left < right && li[right].info.age >= tmp){
//             right = right - 1  // 往左走一步
//         }
//         li[left] = li[right]  // 右边的值写道左边的空位上
//         while(left < right && li[left].info.age <= tmp){
//             left = left + 1
//         }
//         li[right] = li[left]  // 左边的值写到右边的空位上
//     }
//     // 这时候left === right
//     li[left] = mid  // 把tmp补到空位上
//     return left
// }

// function kp(li, left, right){
//     if(left < right){
//         mid = kp_core(li, left, right)
//         kp(li, left, mid - 1)
//         kp(li, mid+1, right)
//     }
// }
// let ls = [
//     {
//         "name": 'a',
//         "info": {
//             "genera": 'nan',
//             "age": 10
//         }
//     },
//     {
//         "name": 'b',
//         "info": {
//             "genera": 'nan',
//             "age": 12
//         }
//     },
//     {
//         "name": 'c',
//         "info": {
//             "genera": 'nan',
//             "age": 9
//         }
//     }
// ]




// console.log(this)





// 计算字符串表达式的值：
// function calc (expr){
//     return Function('return (' + expr + ')')()
// }

// str = "1+1*3-2"
// console.log(calc(str))  // 2





// 大数据作业

// function back(path){
//     if(path.length === 3){
//         res.push(path);
//         return;
//     }
//     nums.forEach(item => {
//         if(path.includes(item)){
//             return;
//         }
//         back(path.concat(item))
//     })
// }


// let nums = [1,2,3,4];
// const res = [];
// back([]);
// console.log(res);
// console.log(res.length);









// add(1)(2)(3)的链式调用

// function add(x){
//     x += +add || 0;
//     add.valueOf = add.toString = function(){
//         return x
//     }
//     return add;
// }

// console.log( add(1)(2)(3) )

// var a = 0;
// function add(n) {
//     if (arguments.length) {
//         a += n;
//         return add;
//     }
//     return a;
// }

// var x = add(2)(3)(4)(5);
// console.log(x());









// // 输入
// const arr = [
//     {
//         "id": "123",
//         "count": 100,
//         "children": [
//             {
//                 "id": "1234",
//                 "count": 50
//             }
//         ]
//     },
//     {
//         "id": "456",
//         "count": 200,
//         "children": [
//             {
//                 "id": "4567",
//                 "count": 100,
//                 "children": [
//                     {
//                         "id": "45678",
//                         "count": 50
//                     }
//                 ]
//             }
//         ]
//     },
//     {
//         "id": "201",
//         "count": 60,
//         "children": []
//     }
// ]

// // 输出
// [
//     {
//         "id": "123",
//         "count": 150
//     },
//     {
//         "id": "456",
//         "count": 350
//     },
//     {
//         "id": "201",
//         "count": 60
//     }
// ]
// let res = []
// for(let i = 0; i < arr.length; i++){
//     let item = arr[i], obj = {};
//     for(let k in item){
//         if(k != 'children'){
//             obj[k] = item[k]
//         }
//     }
//     res.push(obj)
// }
// console.log(res)






// function fun(n, o){
//     console.log(o);
//     return {
//         fun: function(m){
//             return fun(m, n)
//         }
//     }
// }


// var a = fun(0);
// a.fun(1);
// a.fun(2);
// a.fun(3);

// var b = fun(0).fun(1).fun(2).fun(3);





// 数组扁平化：加上层级
// let ls = [1, 2, 3, [4, 5, 6, [7, 8]], [9, 0], 10]

// var res = []
// let n = 2
// function flat(ls, level){
//     if(Array.isArray(ls) && level <= n ){
//         for(let i = 0; i < ls.length; i++){
//             flat(ls[i], level+1)
//         }
//     }else{
//         res.push(ls)
//     }
// }
// flat(ls, 1)

// console.log(res)



// 找到数组中重复最多的元素

// let ls = [1,2,3,4,5,6,7,1,2,3,4,1,2,2]

// function countMax(ls){
//     let map = new Map();
//     for(let i = 0; i < ls.length; i++){
//         if(map.get(ls[i])){
//             map.set(ls[i], map.get(ls[i]) + 1)
//         }else{
//             map.set(ls[i], 1)
//         }
//     }

//     let max = 0;
//     let res = 0;
//     for(let k of map){
//         if(max < k[1]){
//             max = k[1]
//             res = k[0];
//         }
//     }
//     return res;
// }
// console.log(countMax(ls))





// 看代码：
// ```js
// Promise(a).then(b).catch(c).then(d)没有抛出错误会执行什么

// b里抛出错误会执行什么
// a里抛出错误会执行什么
// ```



// let ls = [1,2,3,4]
// let ls1 = ls.map((item) => {
// })
// console.log(ls1)






// acm输入

// let [r, c] = readline().split(' ').map(e => parseInt(e));




// rgb(1, 2, 255)  ->   #ffffff
// function rgb2hex(sRGB) {
//     const rgb = sRGB.match(/\d+/g);
//     return rgb
// }
// let ls = rgb2hex('rgb(1, 2, 255)');
// let str = '#'
// for(let i =0; i < ls.length; i++){
//     str= str + ('0' + Number(ls[i]).toString(16)).slice(-2)  // 不足两位的补够两位
// }

// console.log(str)
// // 测试
// console.log(rgb2hex('rgb(255, 255, 255)'))





// 转成千位技术
// let num = "12345678";


// num = num.split('')
// let str = '', index = 1;
// // let reg = /(?!^)(?=(\d{3})+$)/g; 


// // console.log(num.replace(reg, ",")); 

// for(let i = num.length-1; i >= 0; i--){
//     if(index % 3 !== 0 || i === 0){
//         str = num[i] + str

//     }else{
//         str ='.' + num[i] + str
//     }
//     index++
// }

// console.log(str)






// Number.prototype.add = function (val) {
//     return this.valueOf() + val
// }

// Number.prototype.minus = function(val){
//     return this.valueOf() - val
// }

// console.log((5).add(3).minus(2))





// setTimeout(function() {
//   //settimeout1
//   console.log(2)
// }, 0);
// const intervalId = setInterval(function() {
//   //setinterval1
//   console.log(3)
// }, 0)
// setTimeout(function() {
//   //settimeout2
//   console.log(10)
//   new Promise(function(resolve) {
//     //promise1
//     console.log(11)
//     resolve()
//   })
//   .then(function() {
//     console.log(12)
//   })
//   .then(function() {
//     console.log(13)
//     clearInterval(intervalId)
//   })
// }, 0);

// //promise2
// Promise.resolve()
//   .then(function() {
//     console.log(7)
//   })
//   .then(function() {
//     console.log(8)
//   })
// console.log(9)





-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -

// async function async1() {
//     console.log('async1 start');
//     await async2();
//     console.log('async1 end');
// }
// async function async2() {
//     console.log('async2');
// }
// async1();
// new Promise(function(resolve) {
//     console.log('promise1');
//     resolve();
// }).then(function() {
//     console.log('promise2');
// });
// console.log('script end');



// 同步的：
// 中间件函数
// 定义几个中间间函数
// const m1 = (req, res, next) => {
//   console.log('m1 run')
//   next()
// }

// const m2 = (req, res, next) => {
//     setTimeout(() => {
//         console.log('m2 run')
//     }, 2000)

//   next()
// }

// const m3 = (req, res, next) => {
//   console.log('m3 run')
//   next()
// }

// // 中间件集合
// const middlewares = [m1, m2, m3]

// function useApp (req, res) {
//   const next = () => {
//     const middleware = middlewares.shift()
//     if (middleware) {
//       // 将返回值包装为Promise对象
//       return Promise.resolve(middleware(req, res, next))
//     }else {
//       return Promise.resolve("end")
//     }
//   }
//   next()
// }

// // 第一次请求流进入
// useApp()



// const m1 = async (req, res, next) => {
//     // something...
//     setTimeout(() => {
//         console.log('node1')
//     }, 2000)
//     let result = await next();
//   }

//   const m2 = async (req, res, next) => {
//     // something...
//     setTimeout(() => {
//         console.log('node2')
//     }, 2000)
//     let result = await next();
//   }
//   const m3 = async (req, res, next) => {
//     // something...
//     // console.log('node3')
//     let result = await next();
//     return result;
//   }

// const middlewares = [m1, m2, m3];

// function useApp (req, res) {
//     const next = () => {
//       const middleware = middlewares.shift()
//       if (middleware) {
//         return Promise.resolve(middleware(req, res, next))
//       }else {
//         return Promise.resolve("end")
//       }
//     }
//     next()
//   }
// // 启动中间件
// useApp()





// 图片是否加载成功
// 1、加载成功

// 图片加载成功时触发load事件，失败不会触发
// document.addEventListener("load", function (event) {
//   var ev = event ? event : window.event;
//   var elem = ev.target;

//   if (elem.tagName.toLowerCase() == 'img') {  
//     //  图片加载成功
//     //  do something...
//   }
// }, true);


// // 2、加载失败

// // 图片加载成功时触发error事件，成功不会触发
// document.addEventListener("error", function (event) {
//   var ev = event ? event : window.event
//   var elem = ev.target;

//   if (elem.tagName.toLowerCase() == 'img') { 
//     // 图片加载失败  --替换为默认 
//     elem.src = "../img/default.jpg";
//   }
// }, true);




// let obj = {a: 1, b: 2}
// console.log(Object.keys(obj))







// let arr = [1,2,3,4,5]

// Array.prototype.reverse = function(){
//     let left = 0, right = this.length - 1;
//     while(left <= right){
//         let tmp = this[left];
//         this[left] = this[right];
//         this[right] = tmp
//         left++;
//         right--
//     }
// }

// console.log(arr.reverse())
// console.log(arr)





// 对象的深度对比

// function isObject(obj) {
//     return typeof obj === 'object' && null !== obj;
// }

// function compare(obj1, obj2) {
//     // 1.判断是不是引用类型
//     if (!isObject(obj1) || !isObject(obj2)) {
//         return obj1 === obj2
//     }
//     // 2.比较是否为同一个内存地址
//     if (obj1 === obj2) return true
//     // 3.比较 key 的数量
//     const obj1_len = Object.keys(obj1).length
//     const obj2_len = Object.keys(obj2).length
//     if (obj1_len !== obj2_len) return false
//     // 4.比较 value 的值
//     for (let key in obj1) {
//         const result = compare(obj1[key], obj2[key])
//         if (!result) return false
//     }
//     return true
// }

// let obj1 = {a: 1, b: 2}
// let obj2 = {a: 1, b: 2}


// console.log(compare(obj1, obj2))





// 两个耗时操作同时进行
// const fs = require( "fs" );
// function foo() {
//     // 另一个读取相同mp3文件任务
//     function beginAnotherTask() {
//         let anotherFile = fs.createReadStream( "./ipx.mp3" );
//         anotherFile.on( "data", function ( dataChunk ) {
//             console.log( "读取到%d字节", dataChunk.length );
//         } )
//     }
//     process.nextTick( beginAnotherTask );
// }
// // 定义一个读取mp3文件的任务
// let file = fs.createReadStream( "./ipx.mp3" );
// file.on( "data", function ( dataChunk ) {
//     console.log( "从ipx.mp3文件中读取到%d字节", dataChunk.length );
// })

// // 执行另一个读取的任务
// foo();



// 看promise状态
// const test = new Promise(r => {
//     setTimeout(() => {
//         r(1);
//     }, 1000);
// }).then(() => console.log(test)); // pending


// setTimeout(() => {
//     console.log(test); // fullfilled
// }, 2000);




// function fn(){
//     console.log(b)
// }
// function bar(fn){
//     let b=1
//     fn()
// }
// bar(fn)



// var p = new Promise((resolve, reject) => {
//         // resolve 既是函数也是参数，它用于处理成功的； 在异步任务成功的时候，去调用resolve
//         // reject 既是函数也是参数，它用于处理失败的； 在异步任务失败的时候，去调用reject
//         resolve()
// }).then((res) => {
//     return res
//     // console.log(res)
// }).then((res) => {
//     console.log(res)
// })

// console.log(p)






// fn();
// var fn=function(){
//     console.log("函数体没有提前")
// }
//结果：fn is not a function





// console.log(a);  // [Function: a]
// function a(){
//     console.log("学习成功")
// }
// var a="坚持学习";




// new 



// 对象将key转大写字母换成_小写
// const address = [
//   {
//     addressId: 1,
//     addressName: '北京市',
//     subDistrict: [
//       {
//         addressId: 11,
//         addressName: '海淀区',
//         subDistrict: [
//           {
//             addressId: 111,
//             addressName: '中关村',
//           },
//         ],
//       },
//       {
//         addressId: 12,
//         addressName: '朝阳区',
//       },
//     ],
//   },
//   {
//     addressId: 2,
//     addressName: '河北省',
//   },
// ];


// function convert(arr) {
//   let newArr = [];
//   for (let i = 0; i < arr.length; i++) {
//     let obj = arr[i];
//     let newObj = {};
//     for (const key in obj) {
//       const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
//       if (Array.isArray(obj[key])) {
//         newObj[newKey] = convert(obj[key]);
//       } else {
//         newObj[newKey] = obj[key];
//       }
//     }
//     newArr.push(newObj);
//   }
//   return newArr;
// }



// var a = function () { this.b = 3 };
// var c = new a();
// a.prototype.b = 9;
// var b = 7;
// a();
// // 给出下面的执行结果
// console.log(b);
// console.log(c.b);



// setTimeout(function() {
//     console.log("setTimeout");
// })
// new Promise(function(resolve) {
//     console.log("promise");
//     for (var i = 0; i < 10000; i++) {
//       if(i === 10) {
//           console.log("for");
//       }
//       if(i === 9999) {
//           resolve("resolve");
//       }
//     }
// }).then(function(val){
//     console.log(val)
// });
// console.log("console");





// const newObj = new Proxy(obj, {
//     get: function(target, key, receive){

//     },
//     set: function(target, key, value, receive){

//     }
// })






let arr = [1, [2, [3, [4]], 5]],
  n = 2
let ls = []

for (let i = 0; i < n; i++) {
  for (let j = 0; j < arr.length; j++) {
    if (Array.isArray(arr[j])) {
      for (let k = 0; k < arr[j].length; k++) {
        ls.push(arr[j][k])
      }
      // ls.push(...arr[j])
    } else {
      ls.push(arr[j])
    }
  }
  arr = ls
  ls = []
}
console.log(arr)