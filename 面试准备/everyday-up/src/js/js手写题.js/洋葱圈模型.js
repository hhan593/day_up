/**
 * @description 洋葱圈模型
 * @author 刘永奇加油！！！
 */

async function test1(next) {
  console.log(1);
  await next();
  console.log(5);
}

async function test2(next) {
  console.log(2);
  await next();
  console.log(6);
}

async function test3(next) {
  console.log(3);
  await next();
  console.log(7);
}

async function test4(next) {
  return new Promise((resolve, reject) => {
    console.log(4);
    resolve();
  });
}

const composes = [test1, test2, test3, test4];

function compose(composes) {
  return function () {
    async function dispatch(i) {
      let fn = composes[i];
      if (typeof fn === "function") {
        i++;
        const next = async function () {
          await dispatch(i);
        };
        await fn(next);
      }
    }
    dispatch(0);
  };
}

compose(composes)();
