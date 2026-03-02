class Person {
  constructor(name, age) {
    this.name = name
    this.age = age
  }

  eating() {
    console.log(this.name + '今年' + this.age + '岁了！');
  }
}


// const p = new Person('小明', 19)

// p.eating()

// console.log(p);