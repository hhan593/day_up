/**
 * 总结来说，call()和apply()方法都可以用来改变函数执行上下文， 并且可以传递多个参数给函数。
 * 而bind()方法则创建了一个新的函数，并将原函数的执行上下文绑定到新函数上，
 * 但只接受第一个参数作为上下文对象，后续的参数会作为新函数的参数。
 */

function fn() {
  console.log(this);
}
// 第一次bind
const a = fn.bind({ a: 1 });
a(); // { a: 1 }
// 第二次bind
const b = a.bind({ b: 1 });
b(); // { a: 1 }
