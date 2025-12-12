function Parent(name){
    this.name = name
}
Parent.prototype.eat = function(){  // 将需要复用，共享的代码定义在父类原型上
    console.log(this.name + ' is eating')
}
function Child(name, age){
    Parent.call(this, name)
    this.age = age
}
// 通过创建中间对象，子类原型和父类原型隔离开，不是同一个了
Child.prototype = Object.create(Parent.prototype)
// Object.create(object, propertiesObject)  创建一个新对象，使用第一个参数来提供新创建对象
// 的_proto_(以第一个参数作为新对象的构造函数的原型对象)

// 修复构造函数指向
Child.prototype.contructor = Child
Child.prototype.study = function(){
    console.log(this.name + ' is studying')
}

// 测试
let Child1 = new Child('xiaoming', 16)
console.log(Child1.name)  // xiaoming
Child1.eat()  //  xiaoming is eating
Child1.study() // xiaoming is studying
