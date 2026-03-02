// abstract class Shape {
//   abstract getShape(): number;
// }


// class Rectangle extends Shape {
//   private width: number
//   private height: number

//   constructor(width: number, height: number) {
//     super()
//     this.width = width
//     this.height = height
//   }

//   getShape() {
//     return this.width * this.height
//   }
// }

// class Circle extends Shape {
//   private r: number

//   constructor(r: number) {
//     super()
//     this.r = r
//   }

//   getShape() {
//     return this.r * this.r * 3.14
//   }
// }



// function makeArea(shape: Shape) {
//   return shape.getShape()
// }

// console.log(makeArea(new Circle(100)));




// interface languageYear {
//   readonly age: string
//   [propName: string]: number | string
// }


// let languageMessage: languageYear = {
//   age: "100",
//   "C": 111,
//   "JS": 222
// }


// languageMessage.age = 0


// enum Days {
//   one = 2, two, three, four, five
// }

// console.log(Days['one']);
// console.log(Days['three']);


// // 类实现接口：
// interface Alarm {
//   alert(): void;
// }

// class Door {
// }

// class SecurityDoor extends Door implements Alarm {
//   alert() {
//     console.log('SecurityDoor alert');
//   }
// }

// class Car implements Alarm {
//   alert() {
//     console.log('Car alert');
//   }
// }



// 属性擦除：

interface Person {
  name: string,
  age: number
}


const info = {
  name: '张三',
  age: 100,
  friend: 'zzz'
}

// 会进行属性擦除:
// const p: Person = info
// console.log(p);



interface Person<T1 = string, T2 = number> {
  name: T1
  age: T2
}

const p: Person = {
  name: 'why',
  age: 100
}














export { }


