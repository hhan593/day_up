// const func1 = () => {
//     return new Promise(resolve => {
//         setTimeout(() => {
//             resolve(1);
//         }, 1000)
//     });
// };

// const func2 = () => {
//     return Promise.resolve(2);
// };

// const func3 = () => {
//     return new Promise(resolve => {
//         setTimeout(() => {
//             resolve(3);
//         }, 1000);
//     });
// }

// // 链式调用
// (async () => {
//     let obj = {};
//     obj[Symbol.asyncIterator] = async function* (){
//         console.log('1Start');
//         yield func1();
//         console.log('2Start');
//         yield func2();
//         console.log('3Start');
//         yield func3();
//     };

//     for await (let x of obj){  //这个格式不能变
//         console.log(x)
//     }
// })();






function task1 () {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('1', '我是第一个任务，必须第一个执行');
      resolve('done');
    }, 3000);
  });
}
function task2 () {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('2', '第二个任务');
      resolve('done');
    }, 1000)
  });
}
function task3 () {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('3', '第三个任务');
      reject('error');
    }, 1000);
  });
}
let arr = [task1, task2, task3];
async function allTasks (arr) {
    for(let i = 0; i < arr.length; i++){
        await arr[i]()
    }
}
allTasks(arr);










