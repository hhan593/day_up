function Animal(name) {
  this.name = name;
  this.getName = function () {
    return this.name;
  };
}

function Dog(name) {
  Animal.call(this, name);
}

Dog.prototype = new Animal();
//可以传递参数到构造函数

let dog = new Dog("小黑");

let dog2 = new Dog("小黄");

// console.log(Object.getPrototypeOf(dog) === Object.getPrototypeOf(dog2));
// console.log(dog.getName());
// console.log(dog2.getName());
console.log(Dog.prototype.constructor); //[Function: Animal]

//组合继承
/**
 * 构造函数: Animal
 * 用途: 创建一个动物实例
 * 参数:
 *   - name: 动物的名称
 * 属性:
 *   - name: 动物的名称
 *   - colors: 动物可能的颜色数组
 */
function Animal(name) {
  this.name = name;
  this.colors = ["black", "white"];
}

/**
 * 方法: getName
 * 用途: 获取动物的名称
 * 返回值: 动物的名称
 */
Animal.prototype.getName = function () {
  return this.name;
};

/**
 * 构造函数: Dog
 * 用途: 创建一个狗实例，狗也是一种动物
 * 参数:
 *   - name: 狗的名称
 *   - age: 狗的年龄
 * 属性:
 *   - name: 狗的名称（继承自Animal）
 *   - age: 狗的年龄
 */
function Dog(name, age) {
  Animal.call(this, name); // 调用父类Animal的构造函数
  this.age = age; // 初始化狗的年龄属性
}

// 继承Animal的原型属性和方法
Dog.prototype = new Animal();

// 修正Dog实例的constructor属性，指向Dog构造函数
Dog.prototype.constructor = Dog;

/***********************11.4 组合继承优化****************************** */
// 解决：
// - 解决了前面两种继承的缺点
// 问题：
// - 调用了两次父类构造函数 Animal
/**
 * 构造函数: Animal
 * 用途: 创建Animal实例，初始化name和colors属性
 * 参数:
 *   - name: 动物的名称
 */
function Animal(name) {
  this.name = name;
  this.colors = ["red", "green"];
}

/**
 * 方法: getName
 * 用途: 获取动物的名称
 * 返回值: 动物的名称
 */
Animal.prototype.getName = function () {
  return this.name;
};

/**
 * 构造函数: Dog
 * 用途: 创建Dog实例，初始化age和name属性，并通过Animal构造函数设置name
 * 参数:
 *   - age: 狗的年龄
 *   - name: 狗的名称
 */
function Dog(age, name) {
  Animal.call(this, name); // 调用Animal构造函数，设置Dog实例的name属性
  this.age = age; // 初始化Dog实例的age属性
}

// 继承Animal的方法
Dog.prototype = Animal.prototype;

// 修正Dog实例的constructor属性，确保其指向Dog构造函数
Dog.prototype.constructor = Dog;
