const person = {
  name: "Alice",
  age: 25,
  time: new Date(),
  isStudent: true,
  hobbies: ["reading", "coding", "traveling"],
  address: {
    street: "123 Main St",
    city: "Anytown",
    zip: "12345",
  },
  sayHello: function () {
    console.log("Hello, my name is " + this.name);
  },
};
console.log(Object.__proto__);
//转换为json
const jsonString = JSON.stringify(person);
console.log(jsonString);

var fn = function () {};

console.log(Number.__proto__ === Function.prototype); //true
Number.constructor === Function; //true

String.__proto__ === Function.prototype; //true
String.constructor === Function; //true

Object.__proto__ === Function.prototype; //true
Object.constructor === Function; //true

fn.__proto__ === Function.prototype; //true
fn.constructor === Function; //true

function add() {
  let a = 1;
  let b = 2;
  return function () {
    a++;
    return a + b;
  };
}

const fn = add();
console.log(fn());
console.log(fn());
console.log(fn());
/*题目一ming*/
function test() {
  console.log(b);
  if (a) {
    var b = 100;
  }
  console.log(b);
  c = 234;
  console.log(c);
}
var a;
test();
a = 10;
console.log(c);

// 题目二
var foo = 1; // foo  = undefined
function bar() {
  console.log(foo); // undefined
  if (!foo) {
    var foo = 10;
  }
  console.log(foo);
  10;
}

bar();
