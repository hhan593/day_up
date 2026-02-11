
//  forEach 中执行异步代码不会保证代码按顺序执行，但可以使用 for of 使代码按顺序进行执行，例如：
// async function test() {
//   let arr = [4, 2, 1]
//   for(const item of arr) {
// 	  const res = await handle(item)
// 	  console.log(res)
//   }
// 	console.log('结束')
// }

function handle(x) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(x)
		}, 1000 * x)
	})
}

test()


// 其实原理就是下面的代码：

async function test() {
  let arr = [4, 2, 1]
  let iterator = arr[Symbol.iterator]();
  let res = iterator.next();
  while(!res.done) {
    let value = res.value;
    console.log(value);
    await handle(value);
    res = iterator.next();
  }
	console.log('结束')
}
// 4
// 2
// 1
// 结束
