// 定义一个Animal构造函数
function Animal() {
  // 初始化Animal实例的colors属性为一个包含"red"和"white"的数组
  this.colors = ["red", "white"];
}

// 在Animal的原型上添加一个logColors方法，用于打印colors属性
Animal.prototype.logColors = function () {
  console.log(this.colors);
};

// 定义一个Dog构造函数
function Dog() {}

// 将Dog的原型设置为Animal的一个实例，实现继承
Dog.prototype = new Animal();
console.log(Dog.prototype);

// 创建一个Dog的实例
let dog = new Dog();
// 在dog的颜色数组中添加"black"
dog.colors.push("black");

// 打印dog的颜色数组
console.log(dog.colors);
// 移除颜色数组的最后一个元素
dog.colors.pop();

// 打印dog的构造函数，由于Dog的原型被重写，此处将打印Animal
console.log(dog.constructor);
// 打印dog的原型的构造函数，此处将打印Dog
console.log(dog.__proto__.constructor);

// 判断并打印dog是否为Dog的实例
console.log(dog instanceof Dog);
// 判断并打印dog是否为Animal的实例
console.log(dog instanceof Animal);

// 调用dog的logColors方法，由于Dog继承了Animal，所以可以访问logColors
console.log(dog.logColors());

//但是这样会会出现所有的实例都共用一个原型对象因为内容是写死的，所以不推荐使用这种继承方式

/**************************************11.2 借用构造函数实现继承************************************************ */
