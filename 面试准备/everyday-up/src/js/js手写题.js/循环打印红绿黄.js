/**
 * @description 循环答应红绿黄
 * @author 刘永奇加油！！！
 */

function red() {
  console.log("red");
}

function green() {
  console.log("green");
}

function yellow() {
  console.log("yellow");
}

// function tast(type, time, cb) {
//   setTimeout(() => {
//     if (type == "red") {
//       red();
//     } else if (type === "green") {
//       green();
//     } else {
//       yellow();
//     }
//     cb();
//   }, time * 1000);
// }

// function test() {
//   tast("red", 3, () => {
//     tast("green", 2, () => {
//       tast("yellow", 1, () => {
//         test();
//       });
//     });
//   });
// }

// function text1(type, time, cb) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       if (type == "red") {
//         red();
//       } else if (type === "green") {
//         green();
//       } else {
//         yellow();
//       }
//       // cb();
//       resolve();
//     }, time * 1000);
//   });
// }

// test();

// function test1() {
//   text1("red", 3)
//     .then(() => text1("green", 1))
//     .then(() => text1("yellow", 2))
//     .finally(() => {
//       test1();
//     });
// }
// test1();

// async await版

// async function test2() {
//   await text1("red", 3);
//   await text1("green", 1);
//   await text1("yellow", 2);
//   test2();
// }
// test2();

function test(wait, type) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (type == "red") {
        red();
      } else if (type == "green") {
        green();
      } else {
        yellow();
      }
      resolve();
    }, wait * 1000);
  });
}

async function text() {
  // test(3, "red")
  //   .then(() => test(1, "green"))
  //   .then(() => test(2, "yellow"))
  //   .finally(() => {
  //     text();
  //   });
  await test(3, "red");
  await test(1, "green");
  await test(2, "yellow");
  text();
}

text();
