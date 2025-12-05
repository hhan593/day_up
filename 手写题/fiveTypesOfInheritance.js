

// 第一种： 原型链继承：
function Animal() {
  this.name = 'animal'
  this.colors = ['red', 'green']
}
Animal.prototype.getColor = function() {
  return 'red'
}

function Dog() {}
Dog.prototype = new Animal()

let dog1 = new Dog()
let dog2 = new Dog()
dog1.colors.push('brown')
console.log(dog2.colors);
// 问题：
// 1、原型中包含的引用类型属性（colors）会被所有实例共享
// 2、子类不能给父类传参





// 借用构造函数实现继承：
function Animal(name) {
  this.name = name
  this.getName = function() {
    return this.name
  }
}

function Dog(name) {
  Animal.call(this, name)
}
Dog.prototype = new Animal()
// 问题：
// 每次创建子类实例都会创建一遍方法，浪费内存




// 组合继承：
function Animal(name) {
  this.name = name
  this.colors = ['red', 'white']
}
Animal.prototype.getName = function() {
  return this.name
}
function Dog(name, age) {
  Animal.call(this, name)
  this.age = age
}
Dog.prototype = new Animal()
Dog.prototype.constructor = Dog

var dog1 = new Dog('AAA', 12)
var dog2 = new Dog('BBB', 20)
// 问题：多调用一次 Animal 会对性能不友好


// 寄生时组合继承：
function Animal(name) {
  this.name = name
  this.colors = ['red', 'green']
}
Animal.prototype.getName = function() {
  return this.name
}

function Dog(name, age) {
  Animal.call(this, name)
  this.age = age
}
Dog.prototype = Object.create(Animal.prototype)
Dog.prototype.constructor = Dog

var dog1 = new Dog('AAA', 19)
var dog2 = new Dog('BBB', 20)




// class 实现继承：
class Animal {
  constructor(name) {
    this.name = name
  }
  getName() {
    return this.name
  }
}

class Dog extends Animal {
  constructor(name, age) {
    super(name)
    this.age = age
  }
}