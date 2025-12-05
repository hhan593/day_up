/**
 * @description sleep函数
 * @author 刘永奇加油！！！
 */

// function sleep(time) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       console.log("11111");
//       resolve();
//     }, time * 1000);
//   });
// }

// sleep(5).then(() => {
//   console.log("2222");
// });

function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time * 1000);
  });
}
sleep(5).then(() => {
  console.log("123");
});
